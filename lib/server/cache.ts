import { Redis } from "@upstash/redis";
import crypto from "crypto";

// Initialize Upstash Redis with a safety check
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;

if (REDIS_URL && REDIS_TOKEN && REDIS_URL.startsWith('https://')) {
  try {
    redis = new Redis({
      url: REDIS_URL,
      token: REDIS_TOKEN,
    });
  } catch (e) {
    console.error("[CACHE] Failed to initialize Redis:", e);
    redis = null;
  }
} else {
  console.warn("[CACHE] Redis credentials missing or invalid. Cache is disabled.");
  redis = null;
}

/**
 * Generates a stable cache key based on the payload and a namespace.
 */
export function generateCacheKey(namespace: string, payload: any): string {
  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
  return `sclade:${namespace}:${hash}`;
}

/**
 * Gets a value from the cache.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.error("[CACHE] Get Error:", error);
    return null;
  }
}

/**
 * Sets a value in the cache with a default TTL of 24 hours.
 */
export async function setCache(key: string, value: any, ttlSeconds: number = 86400): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error("[CACHE] Set Error:", error);
  }
}

/**
 * A wrapper to handle the entire get-or-fetch-and-set flow.
 */
export async function withCache<T>(
  namespace: string,
  payload: any,
  fetcher: () => Promise<T>,
  ttlSeconds?: number
): Promise<T> {
  if (!redis) return await fetcher();

  const key = generateCacheKey(namespace, payload);
  
  // Try to get from cache
  const cached = await getCache<T>(key);
  if (cached) {
    return cached;
  }

  // Fetch new data
  const freshData = await fetcher();
  
  // Save to cache
  await setCache(key, freshData, ttlSeconds);
  
  return freshData;
}
