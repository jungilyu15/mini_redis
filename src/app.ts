import Fastify from "fastify";
import { z } from "zod";
import { MiniRedisStore } from "./lib/mini-redis/store";
import { getSlowData } from "./services/slow-data";

const setBodySchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  ttlSeconds: z.number().int().positive().optional()
});

const expireBodySchema = z.object({
  key: z.string().min(1),
  ttlSeconds: z.number().int().positive()
});

const invalidateBodySchema = z.object({
  prefix: z.string().min(1)
});

const keyQuerySchema = z.object({
  key: z.string().min(1)
});

const demoQuerySchema = z.object({
  id: z.string().min(1)
});

export function buildServer(store = new MiniRedisStore()) {
  const app = Fastify({ logger: false });

  app.addHook("onClose", async () => {
    store.close();
  });

  app.post("/redis/set", async (request, reply) => {
    const parsed = setBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message }
      });
    }

    store.set(parsed.data.key, parsed.data.value, parsed.data.ttlSeconds);
    return reply.code(201).send({ success: true, data: { stored: true } });
  });

  app.get("/redis/get", async (request, reply) => {
    const parsed = keyQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message }
      });
    }

    const value = store.get(parsed.data.key);
    if (value === null) {
      return reply.code(404).send({
        success: false,
        error: { code: "KEY_NOT_FOUND", message: "key not found or expired" }
      });
    }

    return reply.send({ success: true, data: { key: parsed.data.key, value } });
  });

  app.delete("/redis/del", async (request, reply) => {
    const parsed = keyQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message }
      });
    }

    const deleted = store.del(parsed.data.key);
    return reply.send({ success: true, data: { deleted } });
  });

  app.post("/redis/expire", async (request, reply) => {
    const parsed = expireBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message }
      });
    }

    const updated = store.expire(parsed.data.key, parsed.data.ttlSeconds);
    if (!updated) {
      return reply.code(404).send({
        success: false,
        error: { code: "KEY_NOT_FOUND", message: "key not found or expired" }
      });
    }

    return reply.send({ success: true, data: { updated: true } });
  });

  app.get("/redis/ttl", async (request, reply) => {
    const parsed = keyQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message }
      });
    }

    const ttl = store.ttl(parsed.data.key);
    return reply.send({ success: true, data: { key: parsed.data.key, ttl } });
  });

  app.post("/redis/invalidate", async (request, reply) => {
    const parsed = invalidateBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message }
      });
    }

    const deletedCount = store.invalidatePrefix(parsed.data.prefix);
    return reply.send({ success: true, data: { deletedCount } });
  });

  app.get("/demo/no-cache", async (request, reply) => {
    const parsed = demoQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message }
      });
    }

    const startedAt = Date.now();
    const data = await getSlowData(parsed.data.id);
    const durationMs = Date.now() - startedAt;

    return reply.send({
      success: true,
      data: { id: parsed.data.id, payload: data, cacheHit: false, durationMs }
    });
  });

  app.get("/demo/with-cache", async (request, reply) => {
    const parsed = demoQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: { code: "INVALID_INPUT", message: parsed.error.issues[0]?.message }
      });
    }

    const cacheKey = `demo:${parsed.data.id}`;
    const startedAt = Date.now();
    const cached = store.get(cacheKey);

    if (cached !== null) {
      const durationMs = Date.now() - startedAt;
      return reply.send({
        success: true,
        data: {
          id: parsed.data.id,
          payload: JSON.parse(cached),
          cacheHit: true,
          durationMs
        }
      });
    }

    const data = await getSlowData(parsed.data.id);
    store.set(cacheKey, JSON.stringify(data), 30);
    const durationMs = Date.now() - startedAt;

    return reply.send({
      success: true,
      data: { id: parsed.data.id, payload: data, cacheHit: false, durationMs }
    });
  });

  return app;
}
