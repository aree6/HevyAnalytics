import type { Request } from 'express';
import { timeoutSignal } from './abortSignal';

interface GeoLocationResponse {
  countryCode?: string;
  country?: string;
  status?: string;
}

const geoCache = new Map<string, { countryCode: string | null; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_CACHE_SIZE = 1000; // Prevent unbounded growth

export const getClientIP = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const firstIp = forwarded.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }
  return req.ip || '';
};

export const getCountryFromIP = async (ip: string): Promise<string | null> => {
  if (
    !ip ||
    ip === '127.0.0.1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.')
  ) {
    return null;
  }

  const cleanIp = ip.replace('::ffff:', '');

  if (geoCache.size >= MAX_CACHE_SIZE) {
    const now = Date.now();
    for (const [key, value] of geoCache.entries()) {
      if (now - value.timestamp > CACHE_TTL_MS) {
        geoCache.delete(key);
      }
    }
    // If still full, remove oldest by insertion order (LRU: hits reorder via
    // delete+set below) to make space. Timestamp stays absolute expiry.
    if (geoCache.size >= MAX_CACHE_SIZE) {
      const toRemove = Math.ceil(MAX_CACHE_SIZE * 0.2);
      let removed = 0;
      for (const key of geoCache.keys()) {
        if (removed >= toRemove) break;
        geoCache.delete(key);
        removed += 1;
      }
    }
  }

  const cached = geoCache.get(cleanIp);
  if (cached) {
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      // LRU reorder without refreshing the expiry timestamp: eviction sorts
      // by timestamp, and Map insertion order already protects hot entries
      // from the bulk-evict pass. Refreshing here would convert the absolute
      // TTL into sliding expiry and pin reassigned IPs forever.
      geoCache.delete(cleanIp);
      geoCache.set(cleanIp, cached);
      return cached.countryCode;
    }
    geoCache.delete(cleanIp);
  }

  try {
    const res = await fetch(`https://ip-api.com/json/${cleanIp}?fields=countryCode`, {
      signal: timeoutSignal(3_000),
    });
    if (!res.ok) throw new Error(`geo lookup failed: ${res.status}`);
    const data = (await res.json()) as GeoLocationResponse;
    const countryCode = data.countryCode || null;

    geoCache.set(cleanIp, { countryCode, timestamp: Date.now() });
    return countryCode;
  } catch {
    return null;
  }
};
