import { NextRequest, NextResponse } from 'next/server'
import {
  getInvestmentCompany,
  getReportContent,
  parseReport,
  isInvestmentConfigured
} from '@/lib/investment-reports'
import { withCache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyName = searchParams.get('company')

    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    }

    if (!isInvestmentConfigured()) {
      return NextResponse.json({
        data: null,
        source: 'mock',
        error: 'Investment folder not configured'
      })
    }

    const cacheKey = `investment:report:${companyName.toLowerCase()}`

    const data = await withCache(cacheKey, async () => {
      const company = await getInvestmentCompany(companyName)
      if (!company) {
        return null
      }

      const content = await getReportContent(company.fileId)
      const parsed = parseReport(content)

      return {
        company,
        report: parsed
      }
    })

    if (!data) {
      return NextResponse.json({
        data: null,
        source: 'drive',
        error: 'Company not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      data,
      source: 'drive'
    })
  } catch (error) {
    console.error('Error fetching investment report:', error)
    return NextResponse.json({
      data: null,
      source: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
