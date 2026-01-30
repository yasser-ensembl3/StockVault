import { google, drive_v3 } from 'googleapis'

export interface InvestmentCompany {
  id: string
  name: string
  displayName: string
  folderId: string
  fileId: string
}

export interface ParsedReport {
  title: string
  companyOverview: {
    description: string
    ceo?: string
    president?: string
    location?: string
    [key: string]: string | undefined
  }
  financialPerformance: {
    raw: string
    tables: string[][]
    keyMetrics: string[]
  }
  keyMilestones: {
    [quarter: string]: string[]
  }
  product: {
    raw: string
    sections: { [key: string]: string }
  }
  notableCustomers: {
    raw: string
    table: string[][]
  }
  teamUpdates: string
  investorAsks: {
    targetAccounts: string[]
    fundraising: string
  }
  keySignals: {
    positive: string[]
    watchItems: string[]
    strategicObservations: string[]
  }
  rawContent: string
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

// Format folder name to display name
function formatDisplayName(name: string): string {
  return name
    .replace(/_\d{4}_report$/, '') // Remove _2025_report suffix
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
}

// List all investment companies
export async function listInvestmentCompanies(): Promise<InvestmentCompany[]> {
  const folderId = process.env.GDRIVE_INVESTMENT_FOLDER_ID
  if (!folderId) {
    throw new Error('GDRIVE_INVESTMENT_FOLDER_ID is not configured')
  }

  const drive = getDriveClient()

  // List company folders
  const foldersResponse = await drive.files.list({
    q: `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    orderBy: 'name',
  })

  const folders = foldersResponse.data.files || []
  const companies: InvestmentCompany[] = []

  // For each folder, find the .md file
  for (const folder of folders) {
    if (!folder.id || !folder.name) continue

    const filesResponse = await drive.files.list({
      q: `'${folder.id}' in parents and name contains '.md' and trashed = false`,
      fields: 'files(id, name)',
    })

    const mdFile = filesResponse.data.files?.[0]
    if (mdFile?.id) {
      companies.push({
        id: folder.name,
        name: folder.name,
        displayName: formatDisplayName(folder.name),
        folderId: folder.id,
        fileId: mdFile.id,
      })
    }
  }

  return companies
}

// Get a specific company by name
export async function getInvestmentCompany(companyName: string): Promise<InvestmentCompany | null> {
  const companies = await listInvestmentCompanies()
  return companies.find(c =>
    c.name.toLowerCase() === companyName.toLowerCase() ||
    c.displayName.toLowerCase() === companyName.toLowerCase()
  ) || null
}

// Read markdown file content
export async function getReportContent(fileId: string): Promise<string> {
  const drive = getDriveClient()

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'text' }
  )

  return response.data as string
}

// Parse markdown content into structured data
export function parseReport(content: string): ParsedReport {
  const sections = content.split(/^## /gm)
  const titleMatch = content.match(/^# (.+)$/m)

  const report: ParsedReport = {
    title: titleMatch?.[1] || 'Unknown Report',
    companyOverview: { description: '' },
    financialPerformance: { raw: '', tables: [], keyMetrics: [] },
    keyMilestones: {},
    product: { raw: '', sections: {} },
    notableCustomers: { raw: '', table: [] },
    teamUpdates: '',
    investorAsks: { targetAccounts: [], fundraising: '' },
    keySignals: { positive: [], watchItems: [], strategicObservations: [] },
    rawContent: content,
  }

  for (const section of sections) {
    const lines = section.trim().split('\n')
    const sectionTitle = lines[0]?.toLowerCase() || ''
    const sectionContent = lines.slice(1).join('\n').trim()

    if (sectionTitle.includes('company overview')) {
      report.companyOverview = parseCompanyOverview(sectionContent)
    } else if (sectionTitle.includes('financial performance')) {
      report.financialPerformance = parseFinancialPerformance(sectionContent)
    } else if (sectionTitle.includes('key milestones')) {
      report.keyMilestones = parseKeyMilestones(sectionContent)
    } else if (sectionTitle.includes('product')) {
      report.product = parseProduct(sectionContent)
    } else if (sectionTitle.includes('notable customers')) {
      report.notableCustomers = parseNotableCustomers(sectionContent)
    } else if (sectionTitle.includes('team updates')) {
      report.teamUpdates = sectionContent
    } else if (sectionTitle.includes('investor asks')) {
      report.investorAsks = parseInvestorAsks(sectionContent)
    } else if (sectionTitle.includes('key signals')) {
      report.keySignals = parseKeySignals(sectionContent)
    }
  }

  return report
}

function parseCompanyOverview(content: string): ParsedReport['companyOverview'] {
  const result: ParsedReport['companyOverview'] = { description: '' }

  const lines = content.split('\n')
  const descLines: string[] = []

  for (const line of lines) {
    const boldMatch = line.match(/^\*\*(.+?):\*\*\s*(.+)$/)
    if (boldMatch) {
      const key = boldMatch[1].toLowerCase().replace(/[^a-z]/g, '')
      result[key] = boldMatch[2]
    } else if (line.trim() && !line.startsWith('---')) {
      descLines.push(line)
    }
  }

  result.description = descLines.join('\n').trim()
  return result
}

function parseFinancialPerformance(content: string): ParsedReport['financialPerformance'] {
  const result: ParsedReport['financialPerformance'] = { raw: content, tables: [], keyMetrics: [] }

  // Extract tables
  const tableMatches = content.match(/\|.+\|[\s\S]*?\n(?=\n|$)/g)
  if (tableMatches) {
    for (const tableStr of tableMatches) {
      const rows = tableStr.split('\n').filter(r => r.trim())
      const table = rows.map(row =>
        row.split('|').map(cell => cell.trim()).filter(cell => cell)
      )
      result.tables.push(table.flat())
    }
  }

  // Extract key metrics (bullet points)
  const metricMatches = content.match(/^- \*\*.+?\*\*.+$/gm)
  if (metricMatches) {
    result.keyMetrics = metricMatches.map(m => m.replace(/^- /, ''))
  }

  return result
}

function parseKeyMilestones(content: string): ParsedReport['keyMilestones'] {
  const result: ParsedReport['keyMilestones'] = {}

  const quarterSections = content.split(/^### /gm)
  for (const section of quarterSections) {
    if (!section.trim()) continue
    const lines = section.split('\n')
    const quarterName = lines[0]?.trim() || 'Unknown'
    const milestones = lines.slice(1)
      .filter(l => l.startsWith('- '))
      .map(l => l.replace(/^- /, '').trim())
    if (milestones.length > 0) {
      result[quarterName] = milestones
    }
  }

  return result
}

function parseProduct(content: string): ParsedReport['product'] {
  const result: ParsedReport['product'] = { raw: content, sections: {} }

  const subSections = content.split(/^### /gm)
  for (const section of subSections) {
    if (!section.trim()) continue
    const lines = section.split('\n')
    const sectionName = lines[0]?.trim() || 'General'
    result.sections[sectionName] = lines.slice(1).join('\n').trim()
  }

  return result
}

function parseNotableCustomers(content: string): ParsedReport['notableCustomers'] {
  const result: ParsedReport['notableCustomers'] = { raw: content, table: [] }

  const tableLines = content.split('\n').filter(l => l.startsWith('|'))
  for (const line of tableLines) {
    const cells = line.split('|').map(c => c.trim()).filter(c => c && !c.match(/^-+$/))
    if (cells.length > 0) {
      result.table.push(cells)
    }
  }

  return result
}

function parseInvestorAsks(content: string): ParsedReport['investorAsks'] {
  const result: ParsedReport['investorAsks'] = { targetAccounts: [], fundraising: '' }

  // Extract target accounts
  const accountMatches = content.match(/^- .+$/gm)
  if (accountMatches) {
    result.targetAccounts = accountMatches.map(m => m.replace(/^- /, '').trim())
  }

  // Extract fundraising section
  const fundraisingMatch = content.match(/### Fundraising[\s\S]*?(?=###|$)/i)
  if (fundraisingMatch) {
    result.fundraising = fundraisingMatch[0].replace(/### Fundraising\s*/i, '').trim()
  }

  return result
}

function parseKeySignals(content: string): ParsedReport['keySignals'] {
  const result: ParsedReport['keySignals'] = { positive: [], watchItems: [], strategicObservations: [] }

  const sections = content.split(/^### /gm)
  for (const section of sections) {
    const lower = section.toLowerCase()
    const bullets = section.match(/^- .+$/gm)?.map(b => b.replace(/^- /, '').trim()) || []

    if (lower.includes('positive')) {
      result.positive = bullets
    } else if (lower.includes('watch')) {
      result.watchItems = bullets
    } else if (lower.includes('strategic')) {
      result.strategicObservations = bullets
    }
  }

  return result
}

export function isInvestmentConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN &&
    process.env.GDRIVE_INVESTMENT_FOLDER_ID
  )
}
