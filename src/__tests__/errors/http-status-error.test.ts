import { describe, expect, it } from "vitest";

import { HttpStatusError, parseHttpStatusDigest } from "@/lib/errors";

describe("HttpStatusError / parseHttpStatusDigest", () => {
  it("round-trips status and message through the digest", () => {
    const err = new HttpStatusError(403, "Não tem permissões");
    expect(parseHttpStatusDigest(err.digest)).toEqual({
      status: 403,
      message: "Não tem permissões",
    });
  });

  it("round-trips a missing status", () => {
    const err = new HttpStatusError(undefined, "Algo falhou");
    expect(parseHttpStatusDigest(err.digest)).toEqual({
      status: undefined,
      message: "Algo falhou",
    });
  });

  it("round-trips a missing message", () => {
    const err = new HttpStatusError(503);
    expect(parseHttpStatusDigest(err.digest)).toEqual({
      status: 503,
      message: undefined,
    });
  });

  it("preserves pipes inside the message", () => {
    const err = new HttpStatusError(400, "campo a | campo b");
    expect(parseHttpStatusDigest(err.digest)?.message).toBe(
      "campo a | campo b",
    );
  });

  it("returns null for digests it did not produce", () => {
    expect(parseHttpStatusDigest(undefined)).toBeNull();
    expect(parseHttpStatusDigest("")).toBeNull();
    expect(parseHttpStatusDigest("abc123")).toBeNull();
    // AppError-style digest ("<errorId>|<message>") must not match.
    expect(parseHttpStatusDigest("1718-ab12cd|mensagem pública")).toBeNull();
  });

  it("is an instance of Error and HttpStatusError", () => {
    const err = new HttpStatusError(500, "x");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(HttpStatusError);
    expect(err.status).toBe(500);
  });
});
