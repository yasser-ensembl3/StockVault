import { NextRequest, NextResponse } from "next/server"
import { fetchAllForSymbol } from "@/lib/alpha-vantage"
import { uploadStockDataToDrive } from "@/lib/google-drive"

const SYMBOL_REGEX = /^[A-Z]{1,5}$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const symbol = (body.symbol as string)?.toUpperCase()?.trim()

    if (!symbol || !SYMBOL_REGEX.test(symbol)) {
      return NextResponse.json(
        { error: "Invalid symbol. Use 1-5 uppercase letters (e.g. AAPL, MSFT)." },
        { status: 400 }
      )
    }

    console.log(`[Pipeline] Starting fetch for ${symbol}...`)

    // Step 1: Fetch all endpoints from Alpha Vantage
    const fetchResult = await fetchAllForSymbol(symbol)

    const successCount = fetchResult.results.filter((r) => r.data !== null).length
    const totalCount = fetchResult.results.length

    if (successCount === 0) {
      return NextResponse.json(
        {
          error: "All endpoints failed",
          errors: fetchResult.errors,
        },
        { status: 502 }
      )
    }

    // Step 2: Upload to Google Drive
    let driveResult = null
    try {
      driveResult = await uploadStockDataToDrive(symbol, fetchResult)
      console.log(`[Pipeline] Uploaded ${driveResult.uploaded.length} files to Drive for ${symbol}`)
    } catch (driveErr) {
      console.error("[Pipeline] Drive upload failed:", driveErr)
    }

    return NextResponse.json({
      symbol,
      fetched: `${successCount}/${totalCount}`,
      errors: fetchResult.errors,
      drive: driveResult
        ? { folderId: driveResult.folderId, uploaded: driveResult.uploaded }
        : null,
      fetchedAt: fetchResult.fetchedAt,
    })
  } catch (error) {
    console.error("[Pipeline] Error:", error)
    return NextResponse.json(
      { error: "Pipeline failed" },
      { status: 500 }
    )
  }
}
