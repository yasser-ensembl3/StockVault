import type { AVFunction } from "./alpha-vantage-types"

const AV_BASE_URL = "https://www.alphavantage.co/query"
const DELAY_BETWEEN_CALLS_MS = 12_000 // 12s between calls (AV rate limit: 5/min)

const AV_FUNCTIONS: AVFunction[] = [
  "OVERVIEW",
  "INCOME_STATEMENT",
  "BALANCE_SHEET",
  "CASH_FLOW",
  "EARNINGS",
]

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export interface AVEndpointResult {
  fn: AVFunction
  data: unknown | null
  error: string | null
}

export interface AVFetchAllResult {
  symbol: string
  results: AVEndpointResult[]
  errors: string[]
  fetchedAt: string
}

/**
 * Fetch a single Alpha Vantage endpoint.
 */
export async function fetchAVEndpoint(
  fn: AVFunction,
  symbol: string
): Promise<AVEndpointResult> {
  const apiKey = process.env.ALPHA_VANTAGE_KEY
  if (!apiKey) {
    return { fn, data: null, error: "ALPHA_VANTAGE_KEY not configured" }
  }

  try {
    const url = `${AV_BASE_URL}?function=${fn}&symbol=${symbol}&apikey=${apiKey}`
    const res = await fetch(url, { cache: "no-store" })

    if (!res.ok) {
      return { fn, data: null, error: `HTTP ${res.status}` }
    }

    const data = await res.json()

    // AV returns error messages in the response body
    if (data["Error Message"]) {
      return { fn, data: null, error: data["Error Message"] }
    }
    if (data["Note"]) {
      return { fn, data: null, error: `Rate limited: ${data["Note"]}` }
    }
    if (data["Information"]) {
      return { fn, data: null, error: `API limit: ${data["Information"]}` }
    }

    return { fn, data, error: null }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { fn, data: null, error: msg }
  }
}

/**
 * Fetch all 5 AV endpoints sequentially with 12s delay between calls.
 * Total time: ~48s for 5 endpoints.
 */
export async function fetchAllForSymbol(
  symbol: string,
  onProgress?: (completed: number, total: number, fn: AVFunction) => void
): Promise<AVFetchAllResult> {
  const results: AVEndpointResult[] = []
  const errors: string[] = []

  for (let i = 0; i < AV_FUNCTIONS.length; i++) {
    const fn = AV_FUNCTIONS[i]

    // Wait between calls (not before the first one)
    if (i > 0) {
      await sleep(DELAY_BETWEEN_CALLS_MS)
    }

    onProgress?.(i, AV_FUNCTIONS.length, fn)

    const result = await fetchAVEndpoint(fn, symbol)
    results.push(result)

    if (result.error) {
      errors.push(`${fn}: ${result.error}`)
      console.error(`[AV] Error fetching ${fn} for ${symbol}: ${result.error}`)
    } else {
      console.log(`[AV] Fetched ${fn} for ${symbol}`)
    }
  }

  return {
    symbol,
    results,
    errors,
    fetchedAt: new Date().toISOString(),
  }
}
