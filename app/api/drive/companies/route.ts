import { NextRequest, NextResponse } from 'next/server'
import { listQuarters, listCompanies, isGoogleDriveConfigured } from '@/lib/google-drive'
import { withCache } from '@/lib/cache'

// Mock data as fallback when Google Drive credentials are invalid/expired
const MOCK_COMPANIES = [
  { name: 'Amazon', folderId: 'mock-amazon', insightsFolderId: 'mock-amazon-insights', hasFinancial: true, hasStrategic: true },
  { name: 'Coinbase', folderId: 'mock-coinbase', insightsFolderId: 'mock-coinbase-insights', hasFinancial: true, hasStrategic: true },
  { name: 'Shopify', folderId: 'mock-shopify', insightsFolderId: 'mock-shopify-insights', hasFinancial: true, hasStrategic: false },
  { name: 'NVIDIA', folderId: 'mock-nvidia', insightsFolderId: 'mock-nvidia-insights', hasFinancial: true, hasStrategic: true },
  { name: 'eBay', folderId: 'mock-ebay', insightsFolderId: 'mock-ebay-insights', hasFinancial: true, hasStrategic: false },
  { name: 'Etsy', folderId: 'mock-etsy', insightsFolderId: 'mock-etsy-insights', hasFinancial: true, hasStrategic: true },
  { name: 'LVMH', folderId: 'mock-lvmh', insightsFolderId: 'mock-lvmh-insights', hasFinancial: true, hasStrategic: false },
  { name: 'Circle', folderId: 'mock-circle', insightsFolderId: 'mock-circle-insights', hasFinancial: false, hasStrategic: true },
]

function getMockCompaniesForQuarter(quarterName: string) {
  // Return slightly different data per quarter for realism
  if (quarterName === 'Q3 2024') return MOCK_COMPANIES
  if (quarterName === 'Q2 2024') return MOCK_COMPANIES.slice(0, 6)
  return MOCK_COMPANIES.slice(0, 4)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const quarterName = searchParams.get('quarter') || 'Q3 2024'

  try {
    if (!isGoogleDriveConfigured()) {
      console.warn('[API /drive/companies] Google Drive not configured, using mock data')
      const mockCompanies = getMockCompaniesForQuarter(quarterName)
      return NextResponse.json({
        quarter: quarterName,
        quarterId: `mock-${quarterName.toLowerCase().replace(' ', '-')}`,
        companies: mockCompanies,
        count: mockCompanies.length,
        source: 'mock',
      })
    }

    // Get all quarters (cached)
    const quarters = await withCache('quarters', listQuarters)

    if (quarters.length === 0) {
      const mockCompanies = getMockCompaniesForQuarter(quarterName)
      return NextResponse.json({
        quarter: quarterName,
        quarterId: 'mock-fallback',
        companies: mockCompanies,
        count: mockCompanies.length,
        source: 'mock-fallback',
      })
    }

    // Find the requested quarter or use the most recent
    let quarter = quarters[0]
    if (quarterName) {
      const found = quarters.find(q => q.name === quarterName)
      if (found) quarter = found
    }

    // Get companies (cached by quarter)
    const companies = await withCache(
      `companies:${quarter.id}`,
      () => listCompanies(quarter.id)
    )

    return NextResponse.json({
      quarter: quarter.name,
      quarterId: quarter.id,
      companies,
      count: companies.length,
      source: 'drive',
    })
  } catch (error) {
    console.error('[API /drive/companies] Error:', error)
    // Return mock data as fallback
    const mockCompanies = getMockCompaniesForQuarter(quarterName)
    return NextResponse.json({
      quarter: quarterName,
      quarterId: 'mock-fallback',
      companies: mockCompanies,
      count: mockCompanies.length,
      source: 'mock-fallback',
      error: 'Google Drive credentials may be expired.',
    })
  }
}
