import { NextResponse } from 'next/server'
import { listQuarters, isGoogleDriveConfigured } from '@/lib/google-drive'
import { withCache } from '@/lib/cache'

// Mock data as fallback when Google Drive credentials are invalid/expired
const MOCK_QUARTERS = [
  { id: 'mock-q3-2024', name: 'Q3 2024' },
  { id: 'mock-q2-2024', name: 'Q2 2024' },
  { id: 'mock-q1-2024', name: 'Q1 2024' },
]

export async function GET() {
  try {
    if (!isGoogleDriveConfigured()) {
      console.warn('[API /drive/quarters] Google Drive not configured, using mock data')
      return NextResponse.json({
        quarters: MOCK_QUARTERS,
        count: MOCK_QUARTERS.length,
        source: 'mock',
      })
    }

    const quarters = await withCache('quarters', listQuarters)

    return NextResponse.json({
      quarters,
      count: quarters.length,
      source: 'drive',
    })
  } catch (error) {
    console.error('[API /drive/quarters] Error:', error)
    // Return mock data as fallback
    return NextResponse.json({
      quarters: MOCK_QUARTERS,
      count: MOCK_QUARTERS.length,
      source: 'mock-fallback',
      error: 'Google Drive credentials may be expired. Please regenerate the refresh token.',
    })
  }
}
