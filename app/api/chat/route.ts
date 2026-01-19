import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { listQuarters, listCompanies, getInsights } from "@/lib/google-drive"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

function extractKeyMetrics(financial: any): string {
  if (!financial) return "No financial data available"

  const lines: string[] = []

  // Company info
  if (financial.company_info) {
    lines.push(`Company: ${financial.company_info.name} (${financial.company_info.ticker})`)
    lines.push(`Quarter: ${financial.company_info.quarter} ${financial.company_info.year}`)
  }

  // Income statement
  if (financial.income_statement) {
    const is = financial.income_statement
    if (is.revenue?.value) lines.push(`Revenue: $${is.revenue.value}M (YoY: ${is.revenue.yoy_pct || 'N/A'}%)`)
    if (is.operating_income?.value) lines.push(`Operating Income: $${is.operating_income.value}M (Margin: ${is.operating_income.margin_pct || 'N/A'}%)`)
    if (is.net_income?.value) lines.push(`Net Income: $${is.net_income.value}M (YoY: ${is.net_income.yoy_pct || 'N/A'}%)`)
    if (is.eps?.diluted) lines.push(`EPS (Diluted): $${is.eps.diluted} (YoY: ${is.eps.yoy_pct || 'N/A'}%)`)
  }

  // Balance sheet
  if (financial.balance_sheet) {
    const bs = financial.balance_sheet
    if (bs.total_cash) lines.push(`Total Cash: $${bs.total_cash}M`)
    if (bs.total_debt) lines.push(`Total Debt: $${bs.total_debt}M`)
    if (bs.total_assets) lines.push(`Total Assets: $${bs.total_assets}M`)
  }

  // Cash flow
  if (financial.cash_flow) {
    const cf = financial.cash_flow
    if (cf.operating_cash_flow) lines.push(`Operating Cash Flow: $${cf.operating_cash_flow}M`)
    if (cf.free_cash_flow) lines.push(`Free Cash Flow: $${cf.free_cash_flow}M`)
  }

  // Revenue breakdown
  if (financial.revenue_breakdown?.by_segment) {
    lines.push(`\nRevenue Segments:`)
    financial.revenue_breakdown.by_segment.slice(0, 5).forEach((seg: { name: string; revenue: number; pct_of_total?: number }) => {
      lines.push(`  - ${seg.name}: $${seg.revenue}M (${seg.pct_of_total || 'N/A'}%)`)
    })
  }

  return lines.join("\n")
}

function extractKeyStrategic(strategic: any): string {
  if (!strategic) return "No strategic data available"

  const lines: string[] = []

  // Executive summary
  if (strategic.executive_summary) {
    if (strategic.executive_summary.one_liner) lines.push(`Summary: ${strategic.executive_summary.one_liner}`)
    if (strategic.executive_summary.management_tone) lines.push(`Management Tone: ${strategic.executive_summary.management_tone}`)
  }

  // Key highlights (limit to 5)
  if (strategic.key_takeaways?.length > 0) {
    lines.push(`\nKey Takeaways:`)
    strategic.key_takeaways.slice(0, 5).forEach((t: string) => lines.push(`  - ${t}`))
  }

  // Strategic initiatives (limit to 3)
  if (strategic.strategic_initiatives?.length > 0) {
    lines.push(`\nStrategic Initiatives:`)
    strategic.strategic_initiatives.slice(0, 3).forEach((i: { initiative: string; status?: string }) => {
      lines.push(`  - ${i.initiative} (${i.status || 'N/A'})`)
    })
  }

  // Risks (limit to 3)
  if (strategic.risks_and_challenges?.length > 0) {
    lines.push(`\nKey Risks:`)
    strategic.risks_and_challenges.slice(0, 3).forEach((r: { risk: string; severity?: string }) => {
      lines.push(`  - ${r.risk} (${r.severity || 'N/A'})`)
    })
  }

  // Bull/Bear case
  if (strategic.investor_highlights) {
    if (strategic.investor_highlights.bull_case?.length > 0) {
      lines.push(`\nBull Case:`)
      strategic.investor_highlights.bull_case.slice(0, 3).forEach((b: string) => lines.push(`  + ${b}`))
    }
    if (strategic.investor_highlights.bear_case?.length > 0) {
      lines.push(`\nBear Case:`)
      strategic.investor_highlights.bear_case.slice(0, 3).forEach((b: string) => lines.push(`  - ${b}`))
    }
  }

  return lines.join("\n")
}

// Extract company names and quarters from the user's question
function extractContext(question: string, availableCompanies: string[], availableQuarters: string[]) {
  const lowerQuestion = question.toLowerCase()

  const mentionedCompanies = availableCompanies.filter(company =>
    lowerQuestion.includes(company.toLowerCase())
  )

  const mentionedQuarters = availableQuarters.filter(quarter =>
    lowerQuestion.includes(quarter.toLowerCase())
  )

  return {
    companies: mentionedCompanies.length > 0 ? mentionedCompanies : availableCompanies.slice(0, 2),
    quarters: mentionedQuarters.length > 0 ? mentionedQuarters : availableQuarters.slice(0, 1),
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      )
    }

    const { messages, question } = await request.json()

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      )
    }

    // Fetch available quarters and companies
    const quarters = await listQuarters()
    const quarterNames = quarters.map(q => q.name)

    // Get companies from the most recent quarter
    let allCompanies: string[] = []
    if (quarters.length > 0) {
      const companies = await listCompanies(quarters[0].id)
      allCompanies = companies.map(c => c.name)
    }

    // Determine which data to fetch based on the question
    const context = extractContext(question, allCompanies, quarterNames)

    // Fetch relevant financial and strategic data - OPTIMIZED: only key metrics
    const dataContext: string[] = []

    for (const quarterName of context.quarters) {
      const quarter = quarters.find(q => q.name === quarterName)
      if (!quarter) continue

      for (const companyName of context.companies) {
        try {
          // Fetch financial data
          const financial = await getInsights(quarter.id, companyName, "financial")
          if (financial) {
            dataContext.push(`\n=== ${companyName} - Financial (${quarterName}) ===\n${extractKeyMetrics(financial)}`)
          }

          // Fetch strategic data
          const strategic = await getInsights(quarter.id, companyName, "strategic")
          if (strategic) {
            dataContext.push(`\n=== ${companyName} - Strategic (${quarterName}) ===\n${extractKeyStrategic(strategic)}`)
          }
        } catch (error) {
          console.error(`Failed to fetch data for ${companyName} in ${quarterName}:`, error)
        }
      }
    }

    // Build the system prompt - more concise
    const systemPrompt = `You are a financial assistant for Quarterly Vault. You analyze quarterly reports from companies.

AVAILABLE DATA:
${dataContext.join("\n")}

COMPANIES: ${allCompanies.join(", ")}
QUARTERS: ${quarterNames.join(", ")}

INSTRUCTIONS:
- Respond concisely and in a structured manner
- Use markdown for formatting (## headings, **bold**, lists)
- Cite precise figures
- If you don't have the data, say so clearly
- Always respond in English`

    // Build conversation history (keep only last 6 messages)
    const conversationMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...(messages || []).slice(-6),
      { role: "user", content: question }
    ]

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversationMessages,
      temperature: 0.5,
      max_tokens: 1500,
    })

    const response = completion.choices[0]?.message?.content || "I couldn't generate a response."

    return NextResponse.json({
      response,
      context: {
        companies: context.companies,
        quarters: context.quarters,
      }
    })

  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    )
  }
}
