import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildServer } from "../src/app";

describe("Mini Redis API", () => {
  const app = buildServer();

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("runs set/get/del flow", async () => {
    const setResponse = await app.inject({
      method: "POST",
      url: "/redis/set",
      payload: { key: "greeting", value: "hello" }
    });
    expect(setResponse.statusCode).toBe(201);

    const getResponse = await app.inject({
      method: "GET",
      url: "/redis/get?key=greeting"
    });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json().data.value).toBe("hello");

    const delResponse = await app.inject({
      method: "DELETE",
      url: "/redis/del?key=greeting"
    });
    expect(delResponse.statusCode).toBe(200);
    expect(delResponse.json().data.deleted).toBe(true);
  });

  it("returns 404 for missing key", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/redis/get?key=missing"
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("KEY_NOT_FOUND");
  });

  it("handles ttl and expiration", async () => {
    await app.inject({
      method: "POST",
      url: "/redis/set",
      payload: { key: "temp", value: "1", ttlSeconds: 1 }
    });

    const ttlResponse = await app.inject({
      method: "GET",
      url: "/redis/ttl?key=temp"
    });
    expect(ttlResponse.statusCode).toBe(200);
    expect(ttlResponse.json().data.ttl).toBeGreaterThanOrEqual(1);

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const afterExpire = await app.inject({
      method: "GET",
      url: "/redis/get?key=temp"
    });
    expect(afterExpire.statusCode).toBe(404);
  });

  it("shows cache hit on second call", async () => {
    const first = await app.inject({
      method: "GET",
      url: "/demo/with-cache?id=abc"
    });
    const second = await app.inject({
      method: "GET",
      url: "/demo/with-cache?id=abc"
    });

    expect(first.statusCode).toBe(200);
    expect(first.json().data.cacheHit).toBe(false);
    expect(second.json().data.cacheHit).toBe(true);
  });
});
