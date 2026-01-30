import { NextResponse } from 'next/server'
import { listInvestmentCompanies, isInvestmentConfigured } from '@/lib/investment-reports'
import { withCache } from '@/lib/cache'

export async function GET() {
  try {
    if (!isInvestmentConfigured()) {
      return NextResponse.json({
        companies: [],
        source: 'mock',
        error: 'Investment folder not configured'
      })
    }

    const companies = await withCache('investment:companies', () => listInvestmentCompanies())

    return NextResponse.json({
      companies,
      count: companies.length,
      source: 'drive'
    })
  } catch (error) {
    console.error('Error fetching investment companies:', error)
    return NextResponse.json({
      companies: [],
      source: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
