import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redis = {
  on: vi.fn(),
  connect: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  eval: vi.fn(),
};
const createClient = vi.fn(() => redis);
vi.mock("redis", () => ({ createClient: () => createClient() }));

import { createRedisSessionStore } from "@/lib/session-store";

beforeEach(() => {
  vi.clearAllMocks();
  redis.connect.mockResolvedValue(undefined);
});
afterEach(() => {
  vi.useRealTimers();
});

describe("createRedisSessionStore", () => {
  it("takes the refresh lock only when SET NX succeeds", async () => {
    const store = createRedisSessionStore("redis://x");
    redis.set.mockResolvedValueOnce("OK").mockResolvedValueOnce(null);

    await expect(store.acquireLock?.("lock:s1", "a", 5000)).resolves.toBe(true);
    await expect(store.acquireLock?.("lock:s1", "b", 5000)).resolves.toBe(
      false,
    );
    expect(redis.set).toHaveBeenCalledWith("lock:s1", "a", {
      condition: "NX",
      expiration: { type: "PX", value: 5000 },
    });
  });

  it("releases the lock with a compare-and-delete on the owner", async () => {
    const store = createRedisSessionStore("redis://x");
    redis.eval.mockResolvedValue(0);

    await store.releaseLock?.("lock:s1", "a");

    const [script, args] = redis.eval.mock.calls[0];
    expect(script).toMatch(/GET.*==\s*ARGV\[1\].*DEL/);
    expect(args).toEqual({ keys: ["lock:s1"], arguments: ["a"] });
  });

  it("fails a hung read after 2 s instead of holding the request", async () => {
    vi.useFakeTimers();
    const store = createRedisSessionStore("redis://x");
    redis.get.mockReturnValue(new Promise(() => {}));

    const read = store.get("s1");
    const settled = expect(read).rejects.toThrow(/timed out after 2000ms/);
    await vi.advanceTimersByTimeAsync(2000);
    await settled;
  });

  it("connects once, and retries after a failed connect", async () => {
    const store = createRedisSessionStore("redis://x");
    redis.connect.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    redis.get.mockResolvedValue("v");

    await expect(store.get("s1")).rejects.toThrow("ECONNREFUSED");
    await expect(store.get("s1")).resolves.toBe("v");
    await expect(store.get("s1")).resolves.toBe("v");
    expect(createClient).toHaveBeenCalledTimes(2);
    expect(redis.on).toHaveBeenCalledWith("error", expect.any(Function));
  });
});
