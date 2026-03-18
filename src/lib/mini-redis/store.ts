export type RedisValue = string;

type StoreEntry = {
  value: RedisValue;
  expiresAt: number | null;
};

export type TtlResult = number;

export class MiniRedisStore {
  private readonly data = new Map<string, StoreEntry>();
  private readonly cleanupTimer: NodeJS.Timeout;

  constructor(private readonly cleanupIntervalMs = 5000) {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredKeys();
    }, cleanupIntervalMs);
    this.cleanupTimer.unref();
  }

  close(): void {
    clearInterval(this.cleanupTimer);
  }

  set(key: string, value: RedisValue, ttlSeconds?: number): void {
    const expiresAt =
      typeof ttlSeconds === "number" ? Date.now() + ttlSeconds * 1000 : null;

    this.data.set(key, { value, expiresAt });
  }

  get(key: string): RedisValue | null {
    const entry = this.data.get(key);
    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.data.delete(key);
      return null;
    }

    return entry.value;
  }

  del(key: string): boolean {
    return this.data.delete(key);
  }

  expire(key: string, ttlSeconds: number): boolean {
    const entry = this.data.get(key);
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.data.delete(key);
      return false;
    }

    entry.expiresAt = Date.now() + ttlSeconds * 1000;
    this.data.set(key, entry);
    return true;
  }

  ttl(key: string): TtlResult {
    const entry = this.data.get(key);
    if (!entry) {
      return -2;
    }

    if (this.isExpired(entry)) {
      this.data.delete(key);
      return -2;
    }

    if (entry.expiresAt === null) {
      return -1;
    }

    const remainingMs = entry.expiresAt - Date.now();
    if (remainingMs <= 0) {
      this.data.delete(key);
      return -2;
    }

    return Math.ceil(remainingMs / 1000);
  }

  invalidatePrefix(prefix: string): number {
    let deleted = 0;
    for (const key of this.data.keys()) {
      if (key.startsWith(prefix)) {
        this.data.delete(key);
        deleted += 1;
      }
    }
    return deleted;
  }

  size(): number {
    this.cleanupExpiredKeys();
    return this.data.size;
  }

  private cleanupExpiredKeys(): void {
    for (const [key, entry] of this.data.entries()) {
      if (this.isExpired(entry)) {
        this.data.delete(key);
      }
    }
  }

  private isExpired(entry: StoreEntry): boolean {
    return entry.expiresAt !== null && entry.expiresAt <= Date.now();
  }
}
