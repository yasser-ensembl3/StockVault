type CacheEntry<T> = {
  data: T
  timestamp: number
}

const cache = new Map<string, CacheEntry<unknown>>()

const DEFAULT_TTL = 60 * 1000 // 60 seconds in milliseconds

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined
  if (!entry) return null

  const isExpired = Date.now() - entry.timestamp > DEFAULT_TTL
  if (isExpired) {
    cache.delete(key)
    return null
  }

  return entry.data
}

export function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() })
}

export function clearCache(): void {
  cache.clear()
}

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = getCached<T>(key)
  if (cached !== null) {
    console.log(`[Cache] HIT: ${key}`)
    return cached
  }

  console.log(`[Cache] MISS: ${key}`)
  const data = await fetcher()
  setCache(key, data)
  return data
}
