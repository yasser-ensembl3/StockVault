import { NextResponse } from "next/server"
import { withCache } from "@/lib/cache"
import { listStockSymbols } from "@/lib/google-drive"

export async function GET() {
  try {
    const symbols = await withCache("stock:symbols", () => listStockSymbols())
    return NextResponse.json({ symbols })
  } catch (error) {
    console.error("[API /stock/symbols] Error:", error)
    return NextResponse.json({ symbols: [] })
  }
}
