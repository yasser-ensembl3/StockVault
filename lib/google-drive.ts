import { google, drive_v3 } from 'googleapis'

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
