import { db } from '../config/database'
import { settings } from '../db/schema'

type SettingsMap = Record<string, string>

let cache: SettingsMap | null = null
let lastRefreshed = 0
const CACHE_TTL_MS = 60_000

async function loadFromDb(): Promise<SettingsMap> {
  const rows = await db
    .select({ key: settings.key, value: settings.value })
    .from(settings)

  const map: SettingsMap = {}
  for (const row of rows) {
    map[row.key] = row.value
  }
  return map
}

export async function getSettingsCache(): Promise<SettingsMap> {
  const now = Date.now()
  if (!cache || now - lastRefreshed > CACHE_TTL_MS) {
    try {
      cache = await loadFromDb()
      lastRefreshed = now
    } catch (err) {
      console.warn('[settingsCache] Failed to load from DB, using existing cache or empty:', (err as Error).message)
      if (!cache) {
        cache = {}
      }
    }
  }
  return cache
}

export async function refreshSettingsCache(): Promise<SettingsMap> {
  try {
    cache = await loadFromDb()
    lastRefreshed = Date.now()
  } catch (err) {
    console.warn('[settingsCache] Failed to refresh settings from DB:', (err as Error).message)
    if (!cache) {
      cache = {}
    }
  }
  return cache
}

export async function getSetting(key: string): Promise<string> {
  try {
    const map = await getSettingsCache()
    return map[key] || ''
  } catch {
    return ''
  }
}

export function getCachedSetting(key: string): string {
  return cache?.[key] || ''
}

export function isCacheReady(): boolean {
  return cache !== null
}
