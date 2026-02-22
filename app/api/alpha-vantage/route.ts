import { NextRequest, NextResponse } from "next/server"
import { withCache } from "@/lib/cache"
import { getMockData } from "@/lib/alpha-vantage-mock"
import { readStockDataFromDrive } from "@/lib/google-drive"
import { fetchAVEndpoint } from "@/lib/alpha-vantage"
import type { AVFunction } from "@/lib/alpha-vantage-types"

const VALID_FUNCTIONS: AVFunction[] = [
  "OVERVIEW",
  "INCOME_STATEMENT",
  "BALANCE_SHEET",
  "CASH_FLOW",
  "EARNINGS",
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const fn = searchParams.get("fn")?.toUpperCase() as AVFunction | undefined
  const symbol = searchParams.get("symbol")?.toUpperCase()

  if (!fn || !VALID_FUNCTIONS.includes(fn)) {
    return NextResponse.json(
      { error: `Invalid function. Use one of: ${VALID_FUNCTIONS.join(", ")}` },
      { status: 400 }
    )
  }

  if (!symbol) {
    return NextResponse.json(
      { error: "Missing symbol parameter" },
      { status: 400 }
    )
  }

  try {
    const { data, source } = await withCache(
      `av:${fn}:${symbol}`,
      async () => {
        // Strategy 1: Try Google Drive first
        try {
          const driveData = await readStockDataFromDrive(symbol, fn)
          if (driveData) {
            console.log(`[API /alpha-vantage] Drive HIT: ${fn}/${symbol}`)
            return { data: driveData, source: "drive" as const }
          }
        } catch (driveErr) {
          console.warn(`[API /alpha-vantage] Drive read failed:`, driveErr)
        }

        // Strategy 2: Try Alpha Vantage API
        if (process.env.ALPHA_VANTAGE_KEY) {
          const result = await fetchAVEndpoint(fn, symbol)
          if (result.data) {
            console.log(`[API /alpha-vantage] AV API HIT: ${fn}/${symbol}`)
            return { data: result.data, source: "api" as const }
          }
          console.warn(`[API /alpha-vantage] AV API failed: ${result.error}`)
        }

        // Strategy 3: Mock data fallback
        console.log(`[API /alpha-vantage] Using mock: ${fn}/${symbol}`)
        return { data: getMockData(fn, symbol), source: "mock" as const }
      }
    )

    if (!data) {
      return NextResponse.json(
        { error: `No data found for ${fn} / ${symbol}` },
        { status: 404 }
      )
    }

    return NextResponse.json({ data, source })
  } catch (error) {
    console.error(`[API /alpha-vantage] Error:`, error)
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    )
  }
}
