import { Redis } from 'ioredis';
import { config } from '../config.js';

class InMemoryRedisStore {
  private kv = new Map<string, { value: string; expiresAt?: number }>();
  private sets = new Map<string, Set<string>>();
  private hashes = new Map<string, Map<string, string>>();

  private isExpired(entry?: { value: string; expiresAt?: number }) {
    if (!entry) return true;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      return true;
    }
    return false;
  }

  async get(key: string): Promise<string | null> {
    const entry = this.kv.get(key);
    if (this.isExpired(entry)) {
      this.kv.delete(key);
      return null;
    }
    return entry!.value;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    let expiresAt: number | undefined;
    if (mode === 'EX' && duration) {
      expiresAt = Date.now() + duration * 1000;
    }
    this.kv.set(key, { value, expiresAt });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    let count = 0;
    if (this.kv.delete(key)) count++;
    if (this.sets.delete(key)) count++;
    if (this.hashes.delete(key)) count++;
    return count;
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    let set = this.sets.get(key);
    if (!set) {
      set = new Set();
      this.sets.set(key, set);
    }
    let added = 0;
    for (const m of members) {
      if (!set.has(m)) {
        set.add(m);
        added++;
      }
    }
    return added;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    const set = this.sets.get(key);
    if (!set) return 0;
    let removed = 0;
    for (const m of members) {
      if (set.delete(m)) removed++;
    }
    return removed;
  }

  async smembers(key: string): Promise<string[]> {
    const set = this.sets.get(key);
    return set ? Array.from(set) : [];
  }

  async sismember(key: string, member: string): Promise<number> {
    const set = this.sets.get(key);
    return set && set.has(member) ? 1 : 0;
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    let hash = this.hashes.get(key);
    if (!hash) {
      hash = new Map();
      this.hashes.set(key, hash);
    }
    const isNew = !hash.has(field);
    hash.set(field, value);
    return isNew ? 1 : 0;
  }

  async hget(key: string, field: string): Promise<string | null> {
    const hash = this.hashes.get(key);
    return hash && hash.has(field) ? hash.get(field)! : null;
  }

  async hdel(key: string, ...fields: string[]): Promise<number> {
    const hash = this.hashes.get(key);
    if (!hash) return 0;
    let count = 0;
    for (const f of fields) {
      if (hash.delete(f)) count++;
    }
    return count;
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    const hash = this.hashes.get(key);
    if (!hash) return {};
    const res: Record<string, string> = {};
    for (const [k, v] of hash.entries()) {
      res[k] = v;
    }
    return res;
  }
}

export type RedisClientLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: string, duration?: number): Promise<any>;
  del(key: string): Promise<number>;
  sadd(key: string, ...members: string[]): Promise<number>;
  srem(key: string, ...members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  sismember(key: string, member: string): Promise<number>;
  hset(key: string, field: string, value: string): Promise<number>;
  hget(key: string, field: string): Promise<string | null>;
  hdel(key: string, ...fields: string[]): Promise<number>;
  hgetall(key: string): Promise<Record<string, string>>;
};

class RedisService {
  private client: Redis | null = null;
  private memoryStore = new InMemoryRedisStore();
  public isUsingFallback = false;

  async initialize(): Promise<void> {
    if (!config.REDIS_URL) {
      console.log('[Redis] No REDIS_URL configured. Activating in-memory store.');
      this.isUsingFallback = true;
      return;
    }

    try {
      const redis = new Redis(config.REDIS_URL, {
        password: config.REDIS_PASSWORD || undefined,
        retryStrategy: (times) => {
          if (times > 2) {
            return null; // Don't hang indefinitely if Redis isn't running locally
          }
          return Math.min(times * 100, 1000);
        },
        maxRetriesPerRequest: 2,
        connectTimeout: 2000,
        lazyConnect: true,
      });

      redis.on('error', (err) => {
        if (!this.isUsingFallback) {
          console.warn(`[Redis] Connection issue: ${err.message}. Switching to in-memory store.`);
          this.isUsingFallback = true;
        }
      });

      await redis.connect();
      this.client = redis;
      console.log('[Redis] Connected successfully to Redis.');
    } catch (err: any) {
      console.warn(`[Redis] Could not connect to Redis server (${err.message}). Using in-memory fallback store.`);
      this.isUsingFallback = true;
      this.client = null;
    }
  }

  getStore(): RedisClientLike {
    if (this.isUsingFallback || !this.client) {
      return this.memoryStore;
    }
    return this.client as unknown as RedisClientLike;
  }
}

export const redisService = new RedisService();
