"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PageProps {
  params: Promise<{ name: string }>
}

type FinancialData = any
type StrategicData = any

export default function CompanyPage({ params }: PageProps) {
  const searchParams = useSearchParams()
  const quarter = searchParams.get("quarter") || "Q3"

  const [companyName, setCompanyName] = useState<string>("")
  const [financial, setFinancial] = useState<FinancialData | null>(null)
  const [strategic, setStrategic] = useState<StrategicData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function unwrapParams() {
      const resolved = await params
      setCompanyName(decodeURIComponent(resolved.name))
    }
    unwrapParams()
  }, [params])

  useEffect(() => {
    async function fetchData() {
      if (!companyName) return

      setLoading(true)
      try {
        const [financialRes, strategicRes] = await Promise.all([
          fetch(`/api/drive/insights?quarter=${encodeURIComponent(quarter)}&company=${encodeURIComponent(companyName)}&type=financial`),
          fetch(`/api/drive/insights?quarter=${encodeURIComponent(quarter)}&company=${encodeURIComponent(companyName)}&type=strategic`),
        ])

        if (financialRes.ok) {
          const data = await financialRes.json()
          setFinancial(data.data)
        }
        if (strategicRes.ok) {
          const data = await strategicRes.json()
          setStrategic(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch insights:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [companyName, quarter])

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A"
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`
    return `$${value.toLocaleString()}`
  }

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A"
    const sign = value >= 0 ? "+" : ""
    return `${sign}${value.toFixed(1)}%`
  }

  const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A"
    return value.toLocaleString()
  }

  const renderText = (value: unknown): string => {
    if (value === null || value === undefined) return "N/A"
    if (typeof value === "string") return value
    if (typeof value === "object") {
      if ("text" in (value as object)) return (value as { text: string }).text
      if ("description" in (value as object)) return (value as { description: string }).description
      return JSON.stringify(value)
    }
    return String(value)
  }

  if (!companyName) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">{companyName}</h1>
          <p className="text-muted-foreground">{quarter} Financial Report</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading insights...
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="financial" className="text-xs sm:text-sm">Financial</TabsTrigger>
            <TabsTrigger value="strategic" className="text-xs sm:text-sm">Strategic</TabsTrigger>
            <TabsTrigger value="products" className="text-xs sm:text-sm">Products</TabsTrigger>
            <TabsTrigger value="competitive" className="text-xs sm:text-sm">Competitive</TabsTrigger>
            <TabsTrigger value="risks" className="text-xs sm:text-sm">Risks</TabsTrigger>
            <TabsTrigger value="investor" className="text-xs sm:text-sm">Investor</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Company Info */}
            {(financial?.company_info || strategic?.company_info) && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div>
                      <h2 className="text-xl font-bold">
                        {financial?.company_info?.name || strategic?.company_info?.name}
                      </h2>
                      <p className="text-muted-foreground">
                        {financial?.company_info?.ticker || strategic?.company_info?.ticker} |
                        {financial?.company_info?.quarter || strategic?.company_info?.quarter} {financial?.company_info?.year || strategic?.company_info?.year}
                      </p>
                    </div>
                    {financial?.company_info?.company_type && (
                      <Badge variant="outline">{financial.company_info.company_type}</Badge>
                    )}
                    {financial?.company_info?.report_date && (
                      <Badge variant="secondary">Report: {financial.company_info.report_date}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Executive Summary */}
            {strategic?.executive_summary && (
              <Card>
                <CardHeader>
                  <CardTitle>Executive Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {strategic.executive_summary.one_liner && (
                    <p className="text-lg font-medium">{strategic.executive_summary.one_liner}</p>
                  )}
                  {strategic.executive_summary.management_tone && (
                    <Badge variant={
                      strategic.executive_summary.management_tone === "optimistic" ? "default" :
                      strategic.executive_summary.management_tone === "cautious" ? "secondary" : "destructive"
                    }>
                      Tone: {strategic.executive_summary.management_tone}
                    </Badge>
                  )}
                  {strategic.executive_summary.key_narrative && (
                    <p className="text-muted-foreground">{strategic.executive_summary.key_narrative}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {financial?.income_statement?.revenue?.value && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(financial.income_statement.revenue.value * 1000000)}
                    </div>
                    {financial.income_statement.revenue.yoy_pct !== undefined && (
                      <Badge variant={financial.income_statement.revenue.yoy_pct >= 0 ? "default" : "destructive"} className="mt-1">
                        {formatPercent(financial.income_statement.revenue.yoy_pct)} YoY
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )}
              {financial?.income_statement?.net_income?.value && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Net Income</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(financial.income_statement.net_income.value * 1000000)}
                    </div>
                    {financial.income_statement.net_income.yoy_pct !== undefined && (
                      <Badge variant={financial.income_statement.net_income.yoy_pct >= 0 ? "default" : "destructive"} className="mt-1">
                        {formatPercent(financial.income_statement.net_income.yoy_pct)} YoY
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )}
              {financial?.income_statement?.eps?.diluted && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">EPS (Diluted)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${financial.income_statement.eps.diluted.toFixed(2)}
                    </div>
                    {financial.income_statement.eps.yoy_pct !== undefined && (
                      <Badge variant={financial.income_statement.eps.yoy_pct >= 0 ? "default" : "destructive"} className="mt-1">
                        {formatPercent(financial.income_statement.eps.yoy_pct)} YoY
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )}
              {financial?.operational_metrics?.employees?.count && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Employees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatNumber(financial.operational_metrics.employees.count)}
                    </div>
                    {financial.operational_metrics.employees.yoy_change !== undefined && (
                      <Badge variant={financial.operational_metrics.employees.yoy_change >= 0 ? "default" : "destructive"} className="mt-1">
                        {formatPercent(financial.operational_metrics.employees.yoy_change)} YoY
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Key Takeaways */}
            {strategic?.key_takeaways && strategic.key_takeaways.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Key Takeaways</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {strategic.key_takeaways.slice(0, 10).map((takeaway: string, i: number) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-muted-foreground shrink-0">•</span>
                        <span className="text-muted-foreground text-sm">{renderText(takeaway)}</span>
                      </li>
                    ))}
                  </ul>
                  {strategic.key_takeaways.length > 10 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      +{strategic.key_takeaways.length - 10} more takeaways...
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* FINANCIAL TAB */}
          <TabsContent value="financial" className="space-y-6">
            {financial ? (
              <>
                {/* Income Statement */}
                <Card>
                  <CardHeader>
                    <CardTitle>Income Statement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {financial.income_statement?.revenue?.value && (
                        <div>
                          <p className="text-sm text-muted-foreground">Revenue</p>
                          <p className="text-lg font-semibold">{formatCurrency(financial.income_statement.revenue.value * 1000000)}</p>
                          {financial.income_statement.revenue.yoy_pct !== undefined && (
                            <p className="text-xs text-muted-foreground">{formatPercent(financial.income_statement.revenue.yoy_pct)} YoY</p>
                          )}
                        </div>
                      )}
                      {financial.income_statement?.operating_income?.value && (
                        <div>
                          <p className="text-sm text-muted-foreground">Operating Income</p>
                          <p className="text-lg font-semibold">{formatCurrency(financial.income_statement.operating_income.value * 1000000)}</p>
                          {financial.income_statement.operating_income.margin_pct && (
                            <p className="text-xs text-muted-foreground">{financial.income_statement.operating_income.margin_pct}% margin</p>
                          )}
                        </div>
                      )}
                      {financial.income_statement?.net_income?.value && (
                        <div>
                          <p className="text-sm text-muted-foreground">Net Income</p>
                          <p className="text-lg font-semibold">{formatCurrency(financial.income_statement.net_income.value * 1000000)}</p>
                          {financial.income_statement.net_income.margin_pct && (
                            <p className="text-xs text-muted-foreground">{financial.income_statement.net_income.margin_pct}% margin</p>
                          )}
                        </div>
                      )}
                      {financial.income_statement?.ebitda?.adjusted && (
                        <div>
                          <p className="text-sm text-muted-foreground">Adjusted EBITDA</p>
                          <p className="text-lg font-semibold">{formatCurrency(financial.income_statement.ebitda.adjusted * 1000000)}</p>
                        </div>
                      )}
                    </div>

                    {/* Operating Expenses Breakdown */}
                    {financial.income_statement?.operating_expenses?.breakdown && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium mb-3">Operating Expenses Breakdown</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.entries(financial.income_statement.operating_expenses.breakdown).map(([key, value]) => (
                            <div key={key} className="bg-muted/50 p-2 rounded">
                              <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                              <p className="text-sm font-medium">{formatCurrency((value as number) * 1000000)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Balance Sheet */}
                {financial.balance_sheet && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Balance Sheet</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {financial.balance_sheet.total_cash && (
                          <div>
                            <p className="text-sm text-muted-foreground">Total Cash</p>
                            <p className="text-lg font-semibold">{formatCurrency(financial.balance_sheet.total_cash * 1000000)}</p>
                          </div>
                        )}
                        {financial.balance_sheet.total_debt && (
                          <div>
                            <p className="text-sm text-muted-foreground">Total Debt</p>
                            <p className="text-lg font-semibold">{formatCurrency(financial.balance_sheet.total_debt * 1000000)}</p>
                          </div>
                        )}
                        {financial.balance_sheet.total_assets && (
                          <div>
                            <p className="text-sm text-muted-foreground">Total Assets</p>
                            <p className="text-lg font-semibold">{formatCurrency(financial.balance_sheet.total_assets * 1000000)}</p>
                          </div>
                        )}
                        {financial.balance_sheet.shareholders_equity && (
                          <div>
                            <p className="text-sm text-muted-foreground">Shareholders Equity</p>
                            <p className="text-lg font-semibold">{formatCurrency(financial.balance_sheet.shareholders_equity * 1000000)}</p>
                          </div>
                        )}
                        {financial.balance_sheet.net_cash_position && (
                          <div>
                            <p className="text-sm text-muted-foreground">Net Cash Position</p>
                            <p className="text-lg font-semibold">{formatCurrency(financial.balance_sheet.net_cash_position * 1000000)}</p>
                          </div>
                        )}
                        {financial.balance_sheet.cash_and_equivalents && (
                          <div>
                            <p className="text-sm text-muted-foreground">Cash & Equivalents</p>
                            <p className="text-lg font-semibold">{formatCurrency(financial.balance_sheet.cash_and_equivalents * 1000000)}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Cash Flow */}
                {financial.cash_flow && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Cash Flow</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {financial.cash_flow.operating_cash_flow !== undefined && (
                          <div>
                            <p className="text-sm text-muted-foreground">Operating CF</p>
                            <p className="text-lg font-semibold">{formatCurrency(financial.cash_flow.operating_cash_flow * 1000000)}</p>
                          </div>
                        )}
                        {financial.cash_flow.investing_cash_flow !== undefined && (
                          <div>
                            <p className="text-sm text-muted-foreground">Investing CF</p>
                            <p className="text-lg font-semibold">{formatCurrency(financial.cash_flow.investing_cash_flow * 1000000)}</p>
                          </div>
                        )}
                        {financial.cash_flow.financing_cash_flow !== undefined && (
                          <div>
                            <p className="text-sm text-muted-foreground">Financing CF</p>
                            <p className="text-lg font-semibold">{formatCurrency(financial.cash_flow.financing_cash_flow * 1000000)}</p>
                          </div>
                        )}
                        {financial.cash_flow.free_cash_flow !== undefined && financial.cash_flow.free_cash_flow !== null && (
                          <div>
                            <p className="text-sm text-muted-foreground">Free Cash Flow</p>
                            <p className="text-lg font-semibold">{formatCurrency(financial.cash_flow.free_cash_flow * 1000000)}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Revenue Breakdown */}
                {financial.revenue_breakdown && (
                  <>
                    {/* By Segment */}
                    {financial.revenue_breakdown.by_segment && financial.revenue_breakdown.by_segment.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Revenue by Segment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {financial.revenue_breakdown.by_segment.slice(0, 8).map((segment: { name: string; revenue: number; pct_of_total?: number; yoy_pct?: number }, i: number) => (
                              <div key={i} className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{segment.name}</p>
                                  {segment.pct_of_total && (
                                    <p className="text-sm text-muted-foreground">{segment.pct_of_total}% of total</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">{formatCurrency(segment.revenue * 1000000)}</p>
                                  {segment.yoy_pct !== undefined && segment.yoy_pct !== null && (
                                    <Badge variant={segment.yoy_pct >= 0 ? "default" : "destructive"} className="text-xs">
                                      {formatPercent(segment.yoy_pct)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* By Geography */}
                    {financial.revenue_breakdown.by_geography && financial.revenue_breakdown.by_geography.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Revenue by Geography</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {financial.revenue_breakdown.by_geography.slice(0, 5).map((geo: { region: string; revenue: number; pct_of_total?: number; yoy_pct?: number }, i: number) => (
                              <div key={i} className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{geo.region}</p>
                                  {geo.pct_of_total && (
                                    <p className="text-sm text-muted-foreground">{geo.pct_of_total}% of total</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">{formatCurrency(geo.revenue * 1000000)}</p>
                                  {geo.yoy_pct !== undefined && geo.yoy_pct !== null && (
                                    <Badge variant={geo.yoy_pct >= 0 ? "default" : "destructive"} className="text-xs">
                                      {formatPercent(geo.yoy_pct)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {/* Guidance */}
                {financial.guidance && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Guidance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {financial.guidance.next_quarter?.other && financial.guidance.next_quarter.other.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-3">Next Quarter Guidance</h4>
                          <div className="space-y-2">
                            {financial.guidance.next_quarter.other.map((item: { metric: string; low?: number; high?: number }, i: number) => (
                              <div key={i} className="flex justify-between items-center bg-muted/50 p-2 rounded">
                                <span className="text-sm">{item.metric}</span>
                                <span className="text-sm font-medium">
                                  {item.low && item.high ? `$${item.low}M - $${item.high}M` : 'TBD'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Sector Specific Metrics */}
                {financial.sector_specific && Object.keys(financial.sector_specific).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Sector-Specific Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(financial.sector_specific).slice(0, 16).map(([key, value]) => {
                          if (typeof value === 'object') return null
                          return (
                            <div key={key} className="bg-muted/50 p-2 rounded">
                              <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                              <p className="text-sm font-medium">
                                {typeof value === 'number'
                                  ? (value >= 1000 ? formatCurrency(value * 1000000) : formatNumber(value))
                                  : String(value)}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Other KPIs */}
                {financial.operational_metrics?.other_kpis && financial.operational_metrics.other_kpis.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Other KPIs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {financial.operational_metrics.other_kpis.slice(0, 12).map((kpi: { name: string; value: number | null; unit?: string }, i: number) => (
                          <div key={i} className="bg-muted/50 p-2 rounded">
                            <p className="text-xs text-muted-foreground">{kpi.name}</p>
                            <p className="text-sm font-medium">
                              {kpi.value !== null ? formatNumber(kpi.value) : 'N/A'}
                              {kpi.unit && ` ${kpi.unit}`}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No financial data available for {companyName} in {quarter}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* STRATEGIC TAB */}
          <TabsContent value="strategic" className="space-y-6">
            {strategic ? (
              <>
                {/* Strategic Initiatives */}
                {strategic.strategic_initiatives && strategic.strategic_initiatives.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Strategic Initiatives ({strategic.strategic_initiatives.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {strategic.strategic_initiatives.slice(0, 10).map((init: { initiative: string; status?: string; progress?: string; expected_impact?: string; timeline?: string }, i: number) => (
                          <div key={i} className="border-l-2 border-border pl-4 py-2">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">{init.initiative}</p>
                              {init.status && (
                                <Badge variant={
                                  init.status === 'completed' ? 'default' :
                                  init.status === 'in_progress' ? 'secondary' : 'outline'
                                } className="text-xs">
                                  {init.status}
                                </Badge>
                              )}
                            </div>
                            {init.progress && (
                              <p className="text-sm text-muted-foreground">{init.progress}</p>
                            )}
                            {init.expected_impact && (
                              <p className="text-xs text-muted-foreground mt-1">Impact: {init.expected_impact}</p>
                            )}
                          </div>
                        ))}
                      </div>
                      {strategic.strategic_initiatives.length > 10 && (
                        <p className="text-xs text-muted-foreground mt-4">
                          +{strategic.strategic_initiatives.length - 10} more initiatives...
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Management Commentary */}
                {strategic.management_commentary && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Management Commentary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {strategic.management_commentary.ceo_message && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">CEO Message</p>
                          <p className="text-muted-foreground">{strategic.management_commentary.ceo_message}</p>
                        </div>
                      )}
                      {strategic.management_commentary.cfo_message && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">CFO Message</p>
                          <p className="text-muted-foreground">{strategic.management_commentary.cfo_message}</p>
                        </div>
                      )}
                      {strategic.management_commentary.priorities && strategic.management_commentary.priorities.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Key Priorities</p>
                          <ul className="space-y-1">
                            {strategic.management_commentary.priorities.slice(0, 10).map((priority: string, i: number) => (
                              <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                <span className="text-muted-foreground">•</span>
                                {renderText(priority)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Notable Quotes */}
                {strategic.notable_quotes && strategic.notable_quotes.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Notable Quotes ({strategic.notable_quotes.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {strategic.notable_quotes.slice(0, 8).map((item: { speaker?: string; quote?: string; context?: string } | string, i: number) => (
                          <div key={i} className="border-l-2 border-border pl-4">
                            {typeof item === 'string' ? (
                              <p className="italic text-muted-foreground">&ldquo;{item}&rdquo;</p>
                            ) : (
                              <div className="space-y-1">
                                <p className="italic text-muted-foreground">&ldquo;{item.quote}&rdquo;</p>
                                {item.speaker && (
                                  <p className="text-sm font-medium">— {item.speaker}</p>
                                )}
                                {item.context && (
                                  <p className="text-xs text-muted-foreground">{item.context}</p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Partnerships & M&A */}
                {strategic.partnerships_and_ma && (
                  <>
                    {strategic.partnerships_and_ma.acquisitions && strategic.partnerships_and_ma.acquisitions.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Acquisitions ({strategic.partnerships_and_ma.acquisitions.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {strategic.partnerships_and_ma.acquisitions.slice(0, 5).map((acq: { target: string; status?: string; rationale?: string; expected_synergies?: string }, i: number) => (
                              <div key={i} className="bg-muted/50 p-3 rounded">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-medium">{acq.target}</p>
                                  {acq.status && <Badge variant="outline" className="text-xs">{acq.status}</Badge>}
                                </div>
                                {acq.rationale && <p className="text-sm text-muted-foreground">{acq.rationale}</p>}
                                {acq.expected_synergies && <p className="text-xs text-muted-foreground mt-1">{acq.expected_synergies}</p>}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {strategic.partnerships_and_ma.partnerships && strategic.partnerships_and_ma.partnerships.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Partnerships ({strategic.partnerships_and_ma.partnerships.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {strategic.partnerships_and_ma.partnerships.slice(0, 6).map((p: { partner: string; nature?: string; significance?: string }, i: number) => (
                              <div key={i} className="bg-muted/50 p-3 rounded">
                                <p className="font-medium">{p.partner}</p>
                                {p.nature && <p className="text-sm text-muted-foreground">{p.nature}</p>}
                                {p.significance && <p className="text-xs text-muted-foreground mt-1">{p.significance}</p>}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {/* Regulatory & Legal */}
                {strategic.regulatory_and_legal && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Regulatory & Legal</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {strategic.regulatory_and_legal.regulatory_environment && (
                        <div>
                          <p className="text-sm font-medium mb-1">Environment</p>
                          <p className="text-muted-foreground text-sm">{strategic.regulatory_and_legal.regulatory_environment}</p>
                        </div>
                      )}
                      {strategic.regulatory_and_legal.ongoing_matters && strategic.regulatory_and_legal.ongoing_matters.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Ongoing Matters</p>
                          <div className="space-y-2">
                            {strategic.regulatory_and_legal.ongoing_matters.slice(0, 5).map((matter: { matter: string; status?: string; potential_impact?: string }, i: number) => (
                              <div key={i} className="bg-muted/50 p-2 rounded">
                                <p className="text-sm font-medium">{matter.matter}</p>
                                {matter.status && <p className="text-xs text-muted-foreground">{matter.status}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No strategic data available for {companyName} in {quarter}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* PRODUCTS TAB */}
          <TabsContent value="products" className="space-y-6">
            {strategic?.product_and_innovation ? (
              <>
                {/* R&D Focus */}
                {strategic.product_and_innovation.r_and_d_focus && (
                  <Card>
                    <CardHeader>
                      <CardTitle>R&D Focus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{strategic.product_and_innovation.r_and_d_focus}</p>
                    </CardContent>
                  </Card>
                )}

                {/* New Launches */}
                {strategic.product_and_innovation.new_launches && strategic.product_and_innovation.new_launches.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>New Product Launches ({strategic.product_and_innovation.new_launches.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {strategic.product_and_innovation.new_launches.slice(0, 10).map((product: { product: string; description?: string; target_market?: string; competitive_advantage?: string; reception?: string }, i: number) => (
                          <div key={i} className="border rounded-lg p-4">
                            <p className="font-medium text-muted-foreground">{product.product}</p>
                            {product.description && (
                              <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                            )}
                            {product.target_market && (
                              <p className="text-xs mt-2"><span className="text-muted-foreground">Target:</span> {product.target_market}</p>
                            )}
                            {product.competitive_advantage && (
                              <p className="text-xs text-muted-foreground mt-1">{product.competitive_advantage}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pipeline */}
                {strategic.product_and_innovation.pipeline && strategic.product_and_innovation.pipeline.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Pipeline ({strategic.product_and_innovation.pipeline.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {strategic.product_and_innovation.pipeline.map((item: { product: string; expected_launch?: string; details?: string }, i: number) => (
                          <div key={i} className="flex items-start gap-4 bg-muted/50 p-3 rounded">
                            <div className="flex-1">
                              <p className="font-medium">{item.product}</p>
                              {item.details && <p className="text-sm text-muted-foreground">{item.details}</p>}
                            </div>
                            {item.expected_launch && (
                              <Badge variant="outline" className="shrink-0">{item.expected_launch}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No product data available
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* COMPETITIVE TAB */}
          <TabsContent value="competitive" className="space-y-6">
            {strategic?.competitive_landscape ? (
              <>
                {/* Market Position */}
                {strategic.competitive_landscape.market_position && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Market Position</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{strategic.competitive_landscape.market_position}</p>
                      {strategic.competitive_landscape.market_share_commentary && (
                        <p className="text-sm text-muted-foreground mt-2">{strategic.competitive_landscape.market_share_commentary}</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Advantages & Threats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {strategic.competitive_landscape.competitive_advantages && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-foreground">Competitive Advantages</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {strategic.competitive_landscape.competitive_advantages.slice(0, 10).map((adv: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-foreground shrink-0">+</span>
                              {renderText(adv)}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {strategic.competitive_landscape.competitive_threats && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-foreground">Competitive Threats</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {strategic.competitive_landscape.competitive_threats.slice(0, 10).map((threat: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-foreground shrink-0">-</span>
                              {renderText(threat)}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Industry Trends */}
                {strategic.competitive_landscape.industry_trends && strategic.competitive_landscape.industry_trends.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Industry Trends ({strategic.competitive_landscape.industry_trends.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {strategic.competitive_landscape.industry_trends.slice(0, 8).map((trend: { trend: string; company_positioning?: string }, i: number) => (
                          <div key={i} className="bg-muted/50 p-3 rounded">
                            <p className="font-medium text-sm">{trend.trend}</p>
                            {trend.company_positioning && (
                              <p className="text-xs text-muted-foreground mt-1">{trend.company_positioning}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No competitive data available
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* RISKS TAB */}
          <TabsContent value="risks" className="space-y-6">
            {strategic?.risks_and_challenges && strategic.risks_and_challenges.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Risks & Challenges ({strategic.risks_and_challenges.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {strategic.risks_and_challenges.slice(0, 15).map((risk: { risk: string; category?: string; severity?: string; management_response?: string; mitigation?: string }, i: number) => (
                      <div key={i} className="border-l-2 border-border pl-4 py-2">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium">{risk.risk}</p>
                          {risk.category && (
                            <Badge variant="outline" className="text-xs">{risk.category}</Badge>
                          )}
                          {risk.severity && (
                            <Badge variant={
                              risk.severity === 'high' ? 'destructive' :
                              risk.severity === 'medium' ? 'secondary' : 'outline'
                            } className="text-xs">
                              {risk.severity}
                            </Badge>
                          )}
                        </div>
                        {risk.management_response && (
                          <p className="text-sm text-muted-foreground">{risk.management_response}</p>
                        )}
                        {risk.mitigation && (
                          <p className="text-xs text-muted-foreground mt-1">Mitigation: {risk.mitigation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {strategic.risks_and_challenges.length > 15 && (
                    <p className="text-xs text-muted-foreground mt-4">
                      +{strategic.risks_and_challenges.length - 15} more risks...
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No risk data available
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* INVESTOR TAB */}
          <TabsContent value="investor" className="space-y-6">
            {strategic?.investor_highlights ? (
              <>
                {/* Bull & Bear Cases */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {strategic.investor_highlights.bull_case && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-foreground">Bull Case ({strategic.investor_highlights.bull_case.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {strategic.investor_highlights.bull_case.slice(0, 10).map((point: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-foreground shrink-0">+</span>
                              {renderText(point)}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {strategic.investor_highlights.bear_case && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-foreground">Bear Case ({strategic.investor_highlights.bear_case.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {strategic.investor_highlights.bear_case.slice(0, 10).map((point: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-foreground shrink-0">-</span>
                              {renderText(point)}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Catalysts */}
                {strategic.investor_highlights.catalysts && strategic.investor_highlights.catalysts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Catalysts ({strategic.investor_highlights.catalysts.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {strategic.investor_highlights.catalysts.slice(0, 8).map((catalyst: { catalyst: string; timeline?: string; potential_impact?: string }, i: number) => (
                          <div key={i} className="flex items-start gap-4 bg-muted/50 p-3 rounded">
                            <div className="flex-1">
                              <p className="font-medium">{catalyst.catalyst}</p>
                              {catalyst.potential_impact && (
                                <p className="text-sm text-muted-foreground">{catalyst.potential_impact}</p>
                              )}
                            </div>
                            {catalyst.timeline && (
                              <Badge variant="outline" className="shrink-0">{catalyst.timeline}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Key Questions */}
                {strategic.investor_highlights.key_questions && strategic.investor_highlights.key_questions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Questions ({strategic.investor_highlights.key_questions.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {strategic.investor_highlights.key_questions.slice(0, 10).map((q: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex gap-2">
                            <span className="text-muted-foreground shrink-0">?</span>
                            {renderText(q)}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No investor data available
                </CardContent>
              </Card>
            )}

            {/* ESG */}
            {strategic?.esg_and_sustainability && (
              <Card>
                <CardHeader>
                  <CardTitle>ESG & Sustainability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {strategic.esg_and_sustainability.environmental && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Environmental</p>
                      <p className="text-sm text-muted-foreground">{strategic.esg_and_sustainability.environmental}</p>
                    </div>
                  )}
                  {strategic.esg_and_sustainability.social && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Social</p>
                      <p className="text-sm text-muted-foreground">{strategic.esg_and_sustainability.social}</p>
                    </div>
                  )}
                  {strategic.esg_and_sustainability.governance && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Governance</p>
                      <p className="text-sm text-muted-foreground">{strategic.esg_and_sustainability.governance}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
