import { google, drive_v3 } from 'googleapis'
import { Readable } from 'stream'
import type { AVFunction } from './alpha-vantage-types'
import type { AVFetchAllResult } from './alpha-vantage'

export interface DriveFile {
  id: string
  name: string
  mimeType: string
}

export interface Quarter {
  id: string
  name: string
}

export interface Company {
  name: string
  folderId: string
  insightsFolderId: string | null
  hasFinancial: boolean
  hasStrategic: boolean
}

export interface QuarterData {
  quarter: Quarter
  companies: Company[]
}

let driveClient: drive_v3.Drive | null = null

function getDriveClient(): drive_v3.Drive {
  if (driveClient) return driveClient

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google OAuth2 credentials not configured')
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  driveClient = google.drive({ version: 'v3', auth: oauth2Client })
  return driveClient
}

export async function listFolderContents(folderId: string): Promise<DriveFile[]> {
  const drive = getDriveClient()
  const files: DriveFile[] = []
  let pageToken: string | undefined

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType)',
      pageToken,
      orderBy: 'name',
    })

    for (const file of response.data.files || []) {
      if (file.id && file.name && file.mimeType) {
        files.push({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
        })
      }
    }

    pageToken = response.data.nextPageToken || undefined
  } while (pageToken)

  return files
}

export async function fetchFileContent<T>(fileId: string): Promise<T> {
  const drive = getDriveClient()

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'text' }
  )

  return JSON.parse(response.data as string) as T
}

// List all quarter folders (Q3 2024, Q4 2024, etc.)
export async function listQuarters(): Promise<Quarter[]> {
  const rootFolderId = process.env.GDRIVE_ROOT_FOLDER_ID
  if (!rootFolderId) {
    throw new Error('GDRIVE_ROOT_FOLDER_ID is not configured')
  }

  const contents = await listFolderContents(rootFolderId)
  return contents
    .filter(f => f.mimeType === 'application/vnd.google-apps.folder')
    .map(f => ({ id: f.id, name: f.name }))
    .sort((a, b) => b.name.localeCompare(a.name)) // Most recent first
}

// Find the insights folder within a company folder
async function findInsightsFolder(companyFolderId: string): Promise<DriveFile | null> {
  const contents = await listFolderContents(companyFolderId)
  const insightsFolder = contents.find(
    f => f.mimeType === 'application/vnd.google-apps.folder' &&
        f.name.toLowerCase() === 'insights'
  )
  return insightsFolder || null
}

// Check if a file matching pattern exists in a folder
async function hasFileMatching(folderId: string, pattern: string): Promise<boolean> {
  const contents = await listFolderContents(folderId)
  return contents.some(f => f.name.toLowerCase().endsWith(pattern.toLowerCase()))
}

// Find a file matching pattern in a folder
async function findFileMatching(folderId: string, pattern: string): Promise<DriveFile | null> {
  const contents = await listFolderContents(folderId)
  return contents.find(f => f.name.toLowerCase().endsWith(pattern.toLowerCase())) || null
}

// List companies in a quarter folder
export async function listCompanies(quarterFolderId: string): Promise<Company[]> {
  const contents = await listFolderContents(quarterFolderId)
  const companyFolders = contents.filter(f => f.mimeType === 'application/vnd.google-apps.folder')

  const companies = await Promise.all(
    companyFolders.map(async (folder) => {
      const insightsFolder = await findInsightsFolder(folder.id)
      const companyContents = await listFolderContents(folder.id)

      let hasFinancial = false
      let hasStrategic = false

      // Check in Insights folder first
      if (insightsFolder) {
        hasFinancial = await hasFileMatching(insightsFolder.id, '_financial.json')
        hasStrategic = await hasFileMatching(insightsFolder.id, '_strategic.json')
      }

      // Also check directly in company folder (some companies have files there)
      if (!hasFinancial) {
        hasFinancial = companyContents.some(f => f.name.toLowerCase().endsWith('_financial.json'))
      }
      if (!hasStrategic) {
        hasStrategic = companyContents.some(f => f.name.toLowerCase().endsWith('_strategic.json'))
      }

      return {
        name: folder.name,
        folderId: folder.id,
        insightsFolderId: insightsFolder?.id || null,
        hasFinancial,
        hasStrategic,
      }
    })
  )

  // Only return companies that have at least one insight file
  return companies.filter(c => c.hasFinancial || c.hasStrategic)
}

// Get insights data for a company
export async function getInsights(
  quarterFolderId: string,
  companyName: string,
  type: 'financial' | 'strategic'
): Promise<unknown | null> {
  // Find the company folder
  const contents = await listFolderContents(quarterFolderId)
  const companyFolder = contents.find(
    f => f.mimeType === 'application/vnd.google-apps.folder' &&
        f.name.toLowerCase() === companyName.toLowerCase()
  )

  if (!companyFolder) return null

  const pattern = `_${type}.json`

  // First check in Insights folder
  const insightsFolder = await findInsightsFolder(companyFolder.id)
  if (insightsFolder) {
    const file = await findFileMatching(insightsFolder.id, pattern)
    if (file) {
      return fetchFileContent(file.id)
    }
  }

  // Also check directly in company folder
  const companyContents = await listFolderContents(companyFolder.id)
  const directFile = companyContents.find(f => f.name.toLowerCase().endsWith(pattern))
  if (directFile) {
    return fetchFileContent(directFile.id)
  }

  return null
}

// Get full quarter data including all companies
export async function getQuarterData(quarterName: string): Promise<QuarterData | null> {
  const quarters = await listQuarters()
  const quarter = quarters.find(q => q.name === quarterName)

  if (!quarter) return null

  const companies = await listCompanies(quarter.id)

  return {
    quarter,
    companies,
  }
}

export function isGoogleDriveConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN &&
    process.env.GDRIVE_ROOT_FOLDER_ID
  )
}

// ============================================================
// Stock Data — Google Drive read/write
// ============================================================

const AV_FN_TO_FILENAME: Record<AVFunction, string> = {
  OVERVIEW: 'overview.json',
  INCOME_STATEMENT: 'income_statement.json',
  BALANCE_SHEET: 'balance_sheet.json',
  CASH_FLOW: 'cash_flow.json',
  EARNINGS: 'earnings.json',
}

/**
 * Create a sub-folder inside `parentId` or return the existing one.
 */
export async function createOrGetFolder(
  parentId: string,
  name: string
): Promise<string> {
  const drive = getDriveClient()

  // Check if folder already exists
  const existing = await drive.files.list({
    q: `'${parentId}' in parents and name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
  })

  if (existing.data.files && existing.data.files.length > 0 && existing.data.files[0].id) {
    return existing.data.files[0].id
  }

  // Create it
  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  })

  if (!created.data.id) throw new Error(`Failed to create folder "${name}"`)
  return created.data.id
}

/**
 * Upload (or update) a JSON file in a Drive folder.
 */
export async function uploadJsonFile(
  folderId: string,
  fileName: string,
  data: unknown
): Promise<string> {
  const drive = getDriveClient()
  const content = JSON.stringify(data, null, 2)

  // Check if file already exists
  const existing = await drive.files.list({
    q: `'${folderId}' in parents and name = '${fileName}' and trashed = false`,
    fields: 'files(id)',
  })

  if (existing.data.files && existing.data.files.length > 0 && existing.data.files[0].id) {
    // Update existing file
    const fileId = existing.data.files[0].id
    await drive.files.update({
      fileId,
      media: {
        mimeType: 'application/json',
        body: Readable.from(content),
      },
    })
    return fileId
  }

  // Create new file
  const created = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType: 'application/json',
      body: Readable.from(content),
    },
    fields: 'id',
  })

  if (!created.data.id) throw new Error(`Failed to upload "${fileName}"`)
  return created.data.id
}

/**
 * Upload all fetched stock data to Drive.
 * Structure: Stock Data / SYMBOL / {overview, income_statement, ...}.json + _meta.json
 */
export async function uploadStockDataToDrive(
  symbol: string,
  fetchResult: AVFetchAllResult
): Promise<{ folderId: string; uploaded: string[] }> {
  const stockFolderId = process.env.GDRIVE_STOCK_FOLDER_ID
  if (!stockFolderId) throw new Error('GDRIVE_STOCK_FOLDER_ID not configured')

  const symbolFolder = await createOrGetFolder(stockFolderId, symbol.toUpperCase())
  const uploaded: string[] = []

  for (const result of fetchResult.results) {
    if (result.data) {
      const fileName = AV_FN_TO_FILENAME[result.fn]
      await uploadJsonFile(symbolFolder, fileName, result.data)
      uploaded.push(fileName)
    }
  }

  // Upload metadata
  const meta = {
    symbol: symbol.toUpperCase(),
    fetchedAt: fetchResult.fetchedAt,
    errors: fetchResult.errors,
    files: uploaded,
  }
  await uploadJsonFile(symbolFolder, '_meta.json', meta)
  uploaded.push('_meta.json')

  return { folderId: symbolFolder, uploaded }
}

/**
 * Read a single stock data JSON from Drive for a given symbol and AV function.
 */
export async function readStockDataFromDrive(
  symbol: string,
  fn: AVFunction
): Promise<unknown | null> {
  const stockFolderId = process.env.GDRIVE_STOCK_FOLDER_ID
  if (!stockFolderId) return null

  const drive = getDriveClient()

  // Find symbol folder
  const symbolFolders = await drive.files.list({
    q: `'${stockFolderId}' in parents and name = '${symbol.toUpperCase()}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id)',
  })

  if (!symbolFolders.data.files || symbolFolders.data.files.length === 0) {
    return null
  }

  const symbolFolderId = symbolFolders.data.files[0].id!
  const fileName = AV_FN_TO_FILENAME[fn]

  // Find the JSON file
  const files = await drive.files.list({
    q: `'${symbolFolderId}' in parents and name = '${fileName}' and trashed = false`,
    fields: 'files(id)',
  })

  if (!files.data.files || files.data.files.length === 0) {
    return null
  }

  return fetchFileContent(files.data.files[0].id!)
}

/**
 * List all stock symbol folders inside the Stock Data folder.
 */
export async function listStockSymbols(): Promise<string[]> {
  const stockFolderId = process.env.GDRIVE_STOCK_FOLDER_ID
  if (!stockFolderId) return []

  const contents = await listFolderContents(stockFolderId)
  return contents
    .filter(f => f.mimeType === 'application/vnd.google-apps.folder')
    .map(f => f.name)
    .sort()
}
