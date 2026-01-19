# StockVault

A financial insights dashboard for analyzing quarterly reports from public companies. Built with Next.js 14, Tailwind CSS, and powered by Google Drive for data storage and OpenAI for intelligent chat assistance.

## Features

### Dashboard
- Overview of all tracked companies with key financial metrics
- Search and filter companies by name
- Quick access to individual company details
- Quarter selector to view different reporting periods

### Company Analysis
Detailed company pages with 7 comprehensive tabs:
- **Overview** - Executive summary, key takeaways, and management tone
- **Financial** - Income statement, balance sheet, cash flow metrics
- **Strategic** - Strategic initiatives, guidance, and outlook
- **Products** - Product segments and business lines breakdown
- **Competitive** - Market position and competitive advantages
- **Risks** - Risk factors and challenges
- **Investor** - Bull/bear cases and notable management quotes

### Compare Tool
- Side-by-side comparison of up to 4 companies
- Visual charts: Revenue, Net Income, Growth Rates
- Radar chart for multi-dimensional analysis
- Detailed financial metrics table

### Trends
- Track a single company's performance across multiple quarters
- Line charts for Revenue, Net Income, Operating Income
- Bar charts for EPS and YoY growth rates
- Quarter-over-quarter comparison table

### AI Chat Assistant
- Ask questions about financial data in natural language
- Powered by OpenAI GPT-4o-mini
- Markdown-formatted responses with tables and lists
- Context-aware responses using actual company data

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui + Radix UI
- **Charts**: Recharts
- **Data Source**: Google Drive API
- **AI**: OpenAI API
- **Documentation**: Nextra

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── chat/          # OpenAI chat endpoint
│   │   └── drive/         # Google Drive API routes
│   ├── chat/              # AI assistant page
│   ├── company/[name]/    # Company detail page
│   ├── compare/           # Company comparison page
│   ├── dashboard/         # Main dashboard
│   ├── docs/              # Documentation (Nextra)
│   └── trends/            # Quarter trends page
├── components/
│   ├── sidebar.tsx        # Navigation sidebar
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── google-drive.ts    # Google Drive client
│   └── utils.ts           # Utility functions
└── content/
    └── docs/              # MDX documentation
```

## Data Structure

The app expects data organized in Google Drive as follows:

```
Root Folder/
├── Q3 2024/
│   ├── Amazon/
│   │   └── Insights/
│   │       ├── financial.json
│   │       └── strategic.json
│   ├── Coinbase/
│   │   └── Insights/
│   │       ├── financial.json
│   │       └── strategic.json
│   └── ...
├── Q2 2024/
│   └── ...
└── ...
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Google Drive OAuth2
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token

# Google Drive Root Folder ID
GDRIVE_ROOT_FOLDER_ID=your_folder_id

# OpenAI API Key (for chat assistant)
OPENAI_API_KEY=your_openai_key
```

### Setting up Google Drive API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Drive API
4. Create OAuth 2.0 credentials (Desktop app)
5. Use the OAuth Playground or a script to get a refresh token with `drive.readonly` scope

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Google Cloud project with Drive API enabled
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone git@github.com:yasser-ensembl3/StockVault.git
cd StockVault

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Build for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables on Vercel

Make sure to add all environment variables from `.env.local` to your Vercel project settings.

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/drive/quarters` | GET | List available quarters |
| `/api/drive/companies` | GET | List companies for a quarter |
| `/api/drive/insights` | GET | Get financial/strategic data |
| `/api/chat` | POST | Chat with AI assistant |

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
