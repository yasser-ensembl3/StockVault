import { NextRequest, NextResponse } from 'next/server'
import { listQuarters, getInsights, isGoogleDriveConfigured } from '@/lib/google-drive'

// Mock insights data as fallback
function getMockFinancialData(company: string, quarter: string) {
  return {
    id: {
      company,
      ticker: company.toUpperCase().slice(0, 4),
      quarter,
      year: 2024,
      company_type: "public",
      report_date: "2024-10-31",
    },
    financials: {
      income_statement: {
        revenue: Math.floor(Math.random() * 50000000000) + 10000000000,
        revenue_yoy_pct: Math.random() * 30 - 5,
        operating_income: Math.floor(Math.random() * 10000000000) + 1000000000,
        net_income: Math.floor(Math.random() * 8000000000) + 500000000,
      },
      per_share: {
        eps_diluted: Math.random() * 10 + 0.5,
      },
      cash_flow: {
        operating_cash_flow: Math.floor(Math.random() * 15000000000),
        free_cash_flow: Math.floor(Math.random() * 10000000000),
      },
    },
  }
}

function getMockStrategicData(company: string, quarter: string) {
  return {
    id: { company, quarter },
    investment_thesis: `${company} continues to demonstrate strong market positioning with robust fundamentals and strategic growth initiatives.`,
    key_highlights: [
      "Strong revenue growth driven by core business segments",
      "Margin expansion through operational efficiencies",
      "Strategic investments in emerging technologies",
    ],
    key_positives: [
      "Market share gains in key segments",
      "Strong cash flow generation",
      "Effective cost management",
    ],
    key_concerns: [
      "Competitive pressure in primary markets",
      "Regulatory uncertainty in some regions",
      "Currency headwinds affecting international revenue",
    ],
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const quarterName = searchParams.get('quarter') || 'Q3 2024'
  const company = searchParams.get('company')
  const type = searchParams.get('type') as 'financial' | 'strategic' | null

  if (!company) {
    return NextResponse.json(
      { error: 'Missing company parameter' },
      { status: 400 }
    )
  }

  if (!type || (type !== 'financial' && type !== 'strategic')) {
    return NextResponse.json(
      { error: 'Invalid type parameter. Must be "financial" or "strategic"' },
      { status: 400 }
    )
  }

  try {
    if (!isGoogleDriveConfigured()) {
      console.warn('[API /drive/insights] Google Drive not configured, using mock data')
      const mockData = type === 'financial'
        ? getMockFinancialData(company, quarterName)
        : getMockStrategicData(company, quarterName)

      return NextResponse.json({
        quarter: quarterName,
        company,
        type,
        data: mockData,
        source: 'mock',
      })
    }

    // Get all quarters
    const quarters = await listQuarters()

    if (quarters.length === 0) {
      const mockData = type === 'financial'
        ? getMockFinancialData(company, quarterName)
        : getMockStrategicData(company, quarterName)

      return NextResponse.json({
        quarter: quarterName,
        company,
        type,
        data: mockData,
        source: 'mock-fallback',
      })
    }

    // Find the requested quarter or use the most recent
    let quarter = quarters[0]
    if (quarterName) {
      const found = quarters.find(q => q.name === quarterName)
      if (found) quarter = found
    }

    const data = await getInsights(quarter.id, company, type)

    if (!data) {
      // Return mock data if no real data found
      const mockData = type === 'financial'
        ? getMockFinancialData(company, quarterName)
        : getMockStrategicData(company, quarterName)

      return NextResponse.json({
        quarter: quarter.name,
        company,
        type,
        data: mockData,
        source: 'mock-fallback',
      })
    }

    return NextResponse.json({
      quarter: quarter.name,
      company,
      type,
      data,
      source: 'drive',
    })
  } catch (error) {
    console.error('[API /drive/insights] Error:', error)
    // Return mock data as fallback
    const mockData = type === 'financial'
      ? getMockFinancialData(company, quarterName)
      : getMockStrategicData(company, quarterName)

    return NextResponse.json({
      quarter: quarterName,
      company,
      type,
      data: mockData,
      source: 'mock-fallback',
      error: 'Google Drive credentials may be expired.',
    })
  }
}
