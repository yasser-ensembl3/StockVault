# Stoic Vault

Financial insights dashboard for analyzing quarterly reports from public companies. Built with Next.js 14, powered by Google Drive for data storage, OpenAI for intelligent chat assistance, and Alpha Vantage for stock data.

## Features

### Dashboard (`/dashboard`)
- Overview of all tracked companies with key financial metrics
- Search and filter companies by name
- Quarter selector to view different reporting periods
- Statistics cards: total companies, financial data available, strategic data available

### Company Comparison (`/compare`)
- Compare 2-4 companies side-by-side
- Bar charts: revenue, net income, growth rates
- Radar chart for multi-dimensional analysis
- 14 financial metrics comparison table

### Quarterly Trends (`/trends`)
- Track a single company across multiple quarters
- Line charts: revenue & net income trends
- Bar charts: EPS trend, YoY growth rates
- Quarter-over-quarter comparison table

### Company Detail (`/company/[name]`)
7-tab deep dive:
- **Overview** — executive summary, key metrics, key takeaways
- **Financial** — income statement, balance sheet, cash flow, revenue breakdown by segment/geography
- **Strategic** — initiatives, management commentary, partnerships, M&A
- **Products** — R&D focus, new launches, pipeline
- **Competitive** — market position, advantages, threats, industry trends
- **Risks** — risk factors with severity badges and mitigation strategies
- **Investor** — bull/bear cases, catalysts, key questions, ESG data

### AI Chat (`/chat`)
- Natural language financial queries powered by GPT-4o-mini
- Automatic context extraction (companies and quarters mentioned)
- Fetches relevant financial + strategic data to build context
- Markdown responses with source badges
- Suggested questions for quick start

### Stock Data (`/stock`)
- Search stock symbols via Alpha Vantage
- Fetch historical data (overview, income statement, balance sheet, cash flow)
- Upload pipeline to Google Drive for persistent storage

### Investment Reports (`/investment/[name]`)
- Detailed investment analysis pages
- Parsed from Google Drive markdown documents

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14, React 18 |
| Language | TypeScript |
| Styling | Tailwind CSS 4, Radix UI, shadcn/ui |
| Charts | Recharts |
| Auth | NextAuth.js (Google + GitHub OAuth) |
| AI | OpenAI API (gpt-4o-mini) |
| Data storage | Google Drive API v3 |
| Stock data | Alpha Vantage API |
| Docs | Nextra |
| Caching | In-memory (60-second TTL) |

## Architecture

```
quarterly-vault/
├── app/
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Home (redirects to /compare)
│   ├── pages/
│   │   ├── dashboard/page.tsx          # Main dashboard
│   │   ├── compare/page.tsx            # Company comparison (2-4)
│   │   ├── trends/page.tsx             # Single company trends
│   │   ├── chat/page.tsx               # AI financial assistant
│   │   ├── company/[name]/page.tsx     # Company detail (7 tabs)
│   │   ├── investment/[name]/page.tsx  # Investment report detail
│   │   ├── stock/page.tsx              # Stock search & fetch
│   │   └── stock/[symbol]/page.tsx     # Stock detail
│   └── api/
│       ├── chat/route.ts               # OpenAI chat endpoint
│       ├── drive/
│       │   ├── quarters/route.ts       # List available quarters
│       │   ├── companies/route.ts      # List companies for quarter
│       │   ├── insights/route.ts       # Fetch financial/strategic JSON
│       │   └── files/route.ts          # Drive file operations
│       ├── investment/
│       │   ├── companies/route.ts      # List investment companies
│       │   └── report/route.ts         # Get investment report
│       └── stock/
│           ├── pipeline/route.ts       # Fetch + upload stock data
│           ├── symbols/route.ts        # List cached symbols
│           ├── search/route.ts         # Search symbols (Alpha Vantage)
│           └── [symbol]/route.ts       # Get stock data
├── components/
│   ├── sidebar.tsx                     # Collapsible sidebar navigation
│   ├── company-card.tsx                # Company display card
│   ├── quarter-selector.tsx            # Quarter dropdown
│   ├── layout-wrapper.tsx              # Responsive layout with sidebar
│   ├── dashboard/                      # Dashboard-specific components
│   ├── stock/                          # Stock components (period toggle, financial table)
│   └── ui/                            # shadcn/ui (card, button, badge, tabs, select, etc.)
├── lib/
│   ├── google-drive.ts                # Google Drive API client (list, fetch, upload)
│   ├── cache.ts                       # In-memory cache (60s TTL)
│   ├── auth.ts                        # NextAuth config (Google + GitHub OAuth)
│   ├── alpha-vantage.ts               # Alpha Vantage API client
│   ├── alpha-vantage-types.ts         # Type definitions
│   ├── investment-reports.ts          # Investment report parsing
│   ├── project-config.ts             # Config loader from env
│   └── utils.ts                       # Helpers (cn for classnames)
├── content/docs/                      # Nextra MDX documentation
└── types/next-auth.d.ts               # NextAuth type augmentation
```

## Data Flow

```
Google Drive (folder structure)
├── Root Folder/
│   ├── Q3 2024/
│   │   ├── Amazon/Insights/
│   │   │   ├── Amazon_financial.json
│   │   │   └── Amazon_strategic.json
│   │   ├── Coinbase/Insights/...
│   │   └── ...
│   ├── Q2 2024/...
│   └── Stock Data/
│       ├── AAPL/ (overview, income, balance, cashflow .json)
│       └── ...
         ↓
    Google Drive API Client (lib/google-drive.ts)
         ↓
    In-Memory Cache (60s TTL)
         ↓
    Next.js API Routes
         ↓
    React Components
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/drive/quarters` | GET | List all available quarters |
| `/api/drive/companies` | GET | List companies in a quarter |
| `/api/drive/insights` | GET | Fetch financial or strategic JSON |
| `/api/drive/files` | GET | List files in a Drive folder (auth required) |
| `/api/chat` | POST | AI chat with financial context |
| `/api/investment/companies` | GET | List investment companies |
| `/api/investment/report` | GET | Get parsed investment report |
| `/api/stock/search` | GET | Search stock symbols |
| `/api/stock/pipeline` | POST | Fetch stock data + upload to Drive |
| `/api/stock/symbols` | GET | List cached stock symbols |

## Setup

### Prerequisites

- Node.js 18+
- Google Cloud project with Drive API enabled
- OpenAI API key
- Alpha Vantage API key (free tier available)

### Installation

```bash
cd quarterly-vault
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REFRESH_TOKEN` | Google OAuth refresh token |
| `GDRIVE_ROOT_FOLDER_ID` | Root folder ID for quarterly data |
| `GDRIVE_STOCK_FOLDER_ID` | Folder ID for stock data (optional) |
| `OPENAI_API_KEY` | OpenAI API key (gpt-4o-mini) |
| `ALPHA_VANTAGE_KEY` | Alpha Vantage API key |
| `NEXTAUTH_SECRET` | NextAuth session secret |
| `NEXTAUTH_URL` | App URL (default: http://localhost:3000) |
| `NEXT_PUBLIC_PROJECT_NAME` | Display name (default: Stoic Vault) |

## Fallback

When Google Drive is unavailable, the app falls back to mock data with sample companies (Amazon, Coinbase, Shopify, NVIDIA, eBay, Etsy, LVMH, Circle) so the UI remains functional.
