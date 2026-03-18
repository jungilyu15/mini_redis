import { afterEach, describe, expect, it, vi } from "vitest";
import { MiniRedisStore } from "../src/lib/mini-redis/store";

describe("MiniRedisStore", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("stores and reads a value", () => {
    const store = new MiniRedisStore();
    store.set("name", "jungle");
    expect(store.get("name")).toBe("jungle");
    store.close();
  });

  it("deletes a value", () => {
    const store = new MiniRedisStore();
    store.set("k", "v");
    expect(store.del("k")).toBe(true);
    expect(store.get("k")).toBeNull();
    store.close();
  });

  it("expires value with ttl", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    const store = new MiniRedisStore();
    store.set("token", "abc", 3);
    expect(store.ttl("token")).toBe(3);

    vi.setSystemTime(new Date("2026-01-01T00:00:04Z"));
    expect(store.get("token")).toBeNull();
    expect(store.ttl("token")).toBe(-2);
    store.close();
  });

  it("updates ttl with expire", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    const store = new MiniRedisStore();
    store.set("job", "done");
    expect(store.ttl("job")).toBe(-1);
    expect(store.expire("job", 5)).toBe(true);
    expect(store.ttl("job")).toBe(5);
    store.close();
  });

  it("invalidates keys by prefix", () => {
    const store = new MiniRedisStore();
    store.set("user:1", "A");
    store.set("user:2", "B");
    store.set("post:1", "P");

    expect(store.invalidatePrefix("user:")).toBe(2);
    expect(store.get("user:1")).toBeNull();
    expect(store.get("post:1")).toBe("P");
    store.close();
  });
});
