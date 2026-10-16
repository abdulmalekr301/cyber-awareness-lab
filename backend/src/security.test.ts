import { describe, expect, it } from "vitest";
import { hashToken, makeToken, passwordsMatch } from "./security.js";
import { config } from "./config.js";

describe("admin security", () => {
  it("creates opaque unique tokens and stores only hashes", () => {
    const first = makeToken(); const second = makeToken();
    expect(first).not.toBe(second);
    expect(hashToken(first)).not.toContain(first);
    expect(hashToken(first)).toHaveLength(64);
  });
  it("compares the configured password without partial matches", () => {
    expect(passwordsMatch(config.adminPassword)).toBe(true);
    expect(passwordsMatch(`${config.adminPassword}-wrong`)).toBe(false);
  });
});
