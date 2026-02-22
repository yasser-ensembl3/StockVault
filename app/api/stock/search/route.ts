import { NextRequest, NextResponse } from "next/server"

export interface SymbolMatch {
  symbol: string
  name: string
  type: string
  region: string
  currency: string
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim()

  if (!query || query.length < 1) {
    return NextResponse.json({ results: [] })
  }

  const apiKey = process.env.ALPHA_VANTAGE_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "ALPHA_VANTAGE_KEY not configured", results: [] },
      { status: 500 }
    )
  }

  try {
    const url = `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${apiKey}`
    const res = await fetch(url, { cache: "no-store" })
    const data = await res.json()

    if (data["Note"] || data["Information"]) {
      return NextResponse.json({ results: [], error: "Rate limited" })
    }

    const matches: SymbolMatch[] = (data.bestMatches || []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (m: any) => ({
        symbol: m["1. symbol"],
        name: m["2. name"],
        type: m["3. type"],
        region: m["4. region"],
        currency: m["8. currency"],
      })
    )

    return NextResponse.json({ results: matches })
  } catch (error) {
    console.error("[API /stock/search] Error:", error)
    return NextResponse.json({ results: [], error: "Search failed" })
  }
}
