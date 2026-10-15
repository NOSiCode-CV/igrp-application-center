import type { IGRPSessionStore } from "@igrp/framework-next-auth/session-store";
import { createClient } from "redis";

/*
 * NODE-ONLY MODULE — loaded by `src/instrumentation.ts` behind
 * `NEXT_RUNTIME === "nodejs"`. Never import it from middleware or from
 * `lib/auth-instance.ts`: the Redis client needs `net`/`tls`, which the Edge
 * runtime does not have.
 */

/**
 * Upper bound on any one store call. The store sits on the path of every
 * session read, so a Redis that is down must answer "no" quickly rather than
 * hang the request: a failed write falls back to a full cookie, a failed read
 * signs the user out.
 */
const STORE_TIMEOUT_MS = 2000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            `session store ${label} timed out after ${STORE_TIMEOUT_MS}ms`,
          ),
        ),
      STORE_TIMEOUT_MS,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Session store on Redis, shared by every replica of the app (and safely by
 * other apps: keys are random session ids). Values arrive already encrypted
 * with NEXTAUTH_SECRET; Redis never sees a token in plaintext.
 */
export function createRedisSessionStore(url: string): IGRPSessionStore {
  type Client = ReturnType<typeof createClient>;
  let connecting: Promise<Client> | undefined;

  function client(): Promise<Client> {
    connecting ??= (async () => {
      const redis = createClient({
        url,
        // Fail commands while disconnected instead of queueing them: a queued
        // GET would hold the request until Redis came back.
        disableOfflineQueue: true,
        socket: {
          connectTimeout: STORE_TIMEOUT_MS,
          reconnectStrategy: (retries) => Math.min(retries * 200, 5000),
        },
      });
      // Without a listener, a connection error is an unhandled 'error' event
      // and crashes the process.
      redis.on("error", (error) =>
        console.error("[session-store] Redis error:", error),
      );
      await redis.connect();
      return redis;
    })().catch((error: unknown) => {
      connecting = undefined;
      throw error;
    });
    return connecting;
  }

  return {
    async get(key) {
      return withTimeout(
        client().then((redis) => redis.get(key)),
        "get",
      );
    },
    async set(key, value, ttlSeconds) {
      await withTimeout(
        client().then((redis) =>
          redis.set(key, value, {
            expiration: { type: "EX", value: ttlSeconds },
          }),
        ),
        "set",
      );
    },
    async delete(key) {
      await withTimeout(
        client().then((redis) => redis.del(key)),
        "delete",
      );
    },
    // Refresh lock: only one replica refreshes a session at a time, so two
    // replicas never spend the same refresh token (which the IdP reads as
    // token reuse).
    async acquireLock(key, owner, ttlMs) {
      const reply = await withTimeout(
        client().then((redis) =>
          redis.set(key, owner, {
            condition: "NX",
            expiration: { type: "PX", value: ttlMs },
          }),
        ),
        "acquireLock",
      );
      return reply === "OK";
    },
    async releaseLock(key, owner) {
      // Compare-and-delete in one step: a lock that expired and was taken by
      // another replica must not be released by the late first owner.
      await withTimeout(
        client().then((redis) =>
          redis.eval(RELEASE_LOCK_SCRIPT, { keys: [key], arguments: [owner] }),
        ),
        "releaseLock",
      );
    },
  };
}

const RELEASE_LOCK_SCRIPT =
  'if redis.call("GET", KEYS[1]) == ARGV[1] then return redis.call("DEL", KEYS[1]) else return 0 end';
