"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PeriodToggle } from "@/components/stock/period-toggle"
import { FinancialTable } from "@/components/stock/financial-table"
import type {
  AVOverview,
  AVIncomeStatement,
  AVBalanceSheet,
  AVCashFlow,
  AVEarnings,
} from "@/lib/alpha-vantage-types"

interface PageProps {
  params: Promise<{ symbol: string }>
}

// --- Helpers ---

function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "None") return "N/A"
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return "N/A"
  const abs = Math.abs(num)
  const sign = num < 0 ? "-" : ""
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(2)}K`
  return `${sign}$${abs.toFixed(2)}`
}

function formatPercent(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "None") return "N/A"
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return "N/A"
  return `${(num * 100).toFixed(2)}%`
}

function formatNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "None") return "N/A"
  const num = typeof value === "string" ? parseFloat(value) : value
  if (isNaN(num)) return "N/A"
  return num.toLocaleString()
}

function formatEps(value: string | null | undefined): string {
  if (!value || value === "None") return "N/A"
  return `$${parseFloat(value).toFixed(2)}`
}

// --- Metric Card ---

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// --- Async Data Fetcher ---

type DataSource = "drive" | "api" | "mock" | null

async function fetchAV<T>(
  fn: string,
  symbol: string
): Promise<{ data: T | null; source: DataSource }> {
  try {
    const res = await fetch(`/api/alpha-vantage?fn=${fn}&symbol=${symbol}`)
    if (!res.ok) return { data: null, source: null }
    const json = await res.json()
    return { data: json.data as T, source: json.source || null }
  } catch {
    return { data: null, source: null }
  }
}

// === MAIN PAGE ===

export default function StockPage({ params }: PageProps) {
  const [symbol, setSymbol] = useState("")
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<AVOverview | null>(null)
  const [income, setIncome] = useState<AVIncomeStatement | null>(null)
  const [balance, setBalance] = useState<AVBalanceSheet | null>(null)
  const [cashFlow, setCashFlow] = useState<AVCashFlow | null>(null)
  const [earnings, setEarnings] = useState<AVEarnings | null>(null)
  const [dataSource, setDataSource] = useState<DataSource>(null)

  // Period toggles per tab
  const [incomePeriod, setIncomePeriod] = useState<"annual" | "quarterly">("annual")
  const [balancePeriod, setBalancePeriod] = useState<"annual" | "quarterly">("annual")
  const [cashPeriod, setCashPeriod] = useState<"annual" | "quarterly">("annual")
  const [earningsPeriod, setEarningsPeriod] = useState<"annual" | "quarterly">("quarterly")

  // Unwrap async params
  useEffect(() => {
    async function unwrapParams() {
      const resolved = await params
      setSymbol(resolved.symbol.toUpperCase())
    }
    unwrapParams()
  }, [params])

  // Fetch all data
  useEffect(() => {
    if (!symbol) return
    setLoading(true)

    Promise.all([
      fetchAV<AVOverview>("OVERVIEW", symbol),
      fetchAV<AVIncomeStatement>("INCOME_STATEMENT", symbol),
      fetchAV<AVBalanceSheet>("BALANCE_SHEET", symbol),
      fetchAV<AVCashFlow>("CASH_FLOW", symbol),
      fetchAV<AVEarnings>("EARNINGS", symbol),
    ]).then(([ov, inc, bal, cf, earn]) => {
      setOverview(ov.data)
      setIncome(inc.data)
      setBalance(bal.data)
      setCashFlow(cf.data)
      setEarnings(earn.data)
      // Use the first non-null source
      setDataSource(ov.source || inc.source || bal.source || cf.source || earn.source)
      setLoading(false)
    })
  }, [symbol])

  if (!symbol) {
    return <div className="p-6 text-muted-foreground">Loading...</div>
  }

  // Analyst ratings total
  const analystTotal = overview
    ? [
        overview.AnalystRatingStrongBuy,
        overview.AnalystRatingBuy,
        overview.AnalystRatingHold,
        overview.AnalystRatingSell,
        overview.AnalystRatingStrongSell,
      ].reduce((sum, v) => sum + (parseInt(v) || 0), 0)
    : 0

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
          >
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {overview?.Name || symbol}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline">{symbol}</Badge>
            {overview?.Exchange && (
              <Badge variant="secondary">{overview.Exchange}</Badge>
            )}
            {overview?.Sector && overview.Sector !== "None" && (
              <Badge variant="secondary">{overview.Sector}</Badge>
            )}
            {dataSource && (
              <Badge
                variant={dataSource === "drive" ? "default" : "outline"}
                className="text-xs"
              >
                Source: {dataSource}
              </Badge>
            )}
            {overview?.Industry && overview.Industry !== "None" && (
              <span className="text-sm text-muted-foreground">
                {overview.Industry}
              </span>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading stock data...
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="income" className="text-xs sm:text-sm">
              Income Statement
            </TabsTrigger>
            <TabsTrigger value="balance" className="text-xs sm:text-sm">
              Balance Sheet
            </TabsTrigger>
            <TabsTrigger value="cashflow" className="text-xs sm:text-sm">
              Cash Flow
            </TabsTrigger>
            <TabsTrigger value="earnings" className="text-xs sm:text-sm">
              Earnings
            </TabsTrigger>
          </TabsList>

          {/* ====== OVERVIEW TAB ====== */}
          <TabsContent value="overview" className="space-y-6">
            {/* Description */}
            {overview?.Description && overview.Description !== "None" && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {overview.Description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Market Cap"
                value={formatCurrency(overview?.MarketCapitalization)}
              />
              <MetricCard
                label="P/E Ratio"
                value={overview?.PERatio && overview.PERatio !== "None" ? overview.PERatio : "N/A"}
                sub={overview?.ForwardPE && overview.ForwardPE !== "None" ? `Forward: ${overview.ForwardPE}` : undefined}
              />
              <MetricCard
                label="EPS"
                value={formatEps(overview?.EPS)}
                sub={
                  overview?.QuarterlyEarningsGrowthYOY &&
                  overview.QuarterlyEarningsGrowthYOY !== "None"
                    ? `YoY: ${formatPercent(overview.QuarterlyEarningsGrowthYOY)}`
                    : undefined
                }
              />
              <MetricCard
                label="Revenue TTM"
                value={formatCurrency(overview?.RevenueTTM)}
                sub={
                  overview?.QuarterlyRevenueGrowthYOY &&
                  overview.QuarterlyRevenueGrowthYOY !== "None"
                    ? `YoY: ${formatPercent(overview.QuarterlyRevenueGrowthYOY)}`
                    : undefined
                }
              />
            </div>

            {/* Margins & Valuation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 p-3 rounded">
                <p className="text-xs text-muted-foreground">Profit Margin</p>
                <p className="text-sm font-medium">
                  {formatPercent(overview?.ProfitMargin)}
                </p>
              </div>
              <div className="bg-muted/50 p-3 rounded">
                <p className="text-xs text-muted-foreground">Operating Margin</p>
                <p className="text-sm font-medium">
                  {formatPercent(overview?.OperatingMarginTTM)}
                </p>
              </div>
              <div className="bg-muted/50 p-3 rounded">
                <p className="text-xs text-muted-foreground">ROE</p>
                <p className="text-sm font-medium">
                  {formatPercent(overview?.ReturnOnEquityTTM)}
                </p>
              </div>
              <div className="bg-muted/50 p-3 rounded">
                <p className="text-xs text-muted-foreground">ROA</p>
                <p className="text-sm font-medium">
                  {formatPercent(overview?.ReturnOnAssetsTTM)}
                </p>
              </div>
            </div>

            {/* 52-week range + Beta */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 p-3 rounded">
                <p className="text-xs text-muted-foreground">52-Week High</p>
                <p className="text-sm font-medium">
                  ${overview?.["52WeekHigh"] || "N/A"}
                </p>
              </div>
              <div className="bg-muted/50 p-3 rounded">
                <p className="text-xs text-muted-foreground">52-Week Low</p>
                <p className="text-sm font-medium">
                  ${overview?.["52WeekLow"] || "N/A"}
                </p>
              </div>
              <div className="bg-muted/50 p-3 rounded">
                <p className="text-xs text-muted-foreground">Beta</p>
                <p className="text-sm font-medium">
                  {overview?.Beta && overview.Beta !== "None" ? overview.Beta : "N/A"}
                </p>
              </div>
              <div className="bg-muted/50 p-3 rounded">
                <p className="text-xs text-muted-foreground">Dividend Yield</p>
                <p className="text-sm font-medium">
                  {overview?.DividendYield && overview.DividendYield !== "0" && overview.DividendYield !== "None"
                    ? formatPercent(overview.DividendYield)
                    : "None"}
                </p>
              </div>
            </div>

            {/* Analyst Ratings */}
            {analystTotal > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Analyst Ratings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-muted-foreground">
                      Target Price:
                    </span>
                    <span className="font-bold text-lg">
                      ${overview?.AnalystTargetPrice || "N/A"}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="default">
                      Strong Buy: {overview?.AnalystRatingStrongBuy}
                    </Badge>
                    <Badge variant="default">
                      Buy: {overview?.AnalystRatingBuy}
                    </Badge>
                    <Badge variant="secondary">
                      Hold: {overview?.AnalystRatingHold}
                    </Badge>
                    {parseInt(overview?.AnalystRatingSell || "0") > 0 && (
                      <Badge variant="destructive">
                        Sell: {overview?.AnalystRatingSell}
                      </Badge>
                    )}
                    {parseInt(overview?.AnalystRatingStrongSell || "0") > 0 && (
                      <Badge variant="destructive">
                        Strong Sell: {overview?.AnalystRatingStrongSell}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3">
                    {/* Visual bar */}
                    <div className="flex h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-green-600"
                        style={{
                          width: `${((parseInt(overview?.AnalystRatingStrongBuy || "0") + parseInt(overview?.AnalystRatingBuy || "0")) / analystTotal) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-yellow-500"
                        style={{
                          width: `${(parseInt(overview?.AnalystRatingHold || "0") / analystTotal) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-red-500"
                        style={{
                          width: `${((parseInt(overview?.AnalystRatingSell || "0") + parseInt(overview?.AnalystRatingStrongSell || "0")) / analystTotal) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Valuation Multiples */}
            <Card>
              <CardHeader>
                <CardTitle>Valuation Multiples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-xs text-muted-foreground">P/E (Trailing)</p>
                    <p className="text-sm font-medium">{overview?.TrailingPE || "N/A"}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-xs text-muted-foreground">P/E (Forward)</p>
                    <p className="text-sm font-medium">{overview?.ForwardPE || "N/A"}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-xs text-muted-foreground">PEG Ratio</p>
                    <p className="text-sm font-medium">{overview?.PEGRatio || "N/A"}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-xs text-muted-foreground">Price/Sales</p>
                    <p className="text-sm font-medium">{overview?.PriceToSalesRatioTTM || "N/A"}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-xs text-muted-foreground">Price/Book</p>
                    <p className="text-sm font-medium">{overview?.PriceToBookRatio || "N/A"}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-xs text-muted-foreground">EV/Revenue</p>
                    <p className="text-sm font-medium">{overview?.EVToRevenue || "N/A"}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-xs text-muted-foreground">EV/EBITDA</p>
                    <p className="text-sm font-medium">{overview?.EVToEBITDA || "N/A"}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded">
                    <p className="text-xs text-muted-foreground">Book Value</p>
                    <p className="text-sm font-medium">${overview?.BookValue || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ====== INCOME STATEMENT TAB ====== */}
          <TabsContent value="income" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Income Statement</h2>
              <PeriodToggle period={incomePeriod} onChange={setIncomePeriod} />
            </div>

            {income && (() => {
              const reports =
                incomePeriod === "annual"
                  ? income.annualReports.slice(0, 5)
                  : income.quarterlyReports.slice(0, 8)
              const latest = reports[0]

              return (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                      label="Revenue"
                      value={formatCurrency(latest?.totalRevenue)}
                    />
                    <MetricCard
                      label="Operating Income"
                      value={formatCurrency(latest?.operatingIncome)}
                      sub={
                        latest?.totalRevenue && latest?.operatingIncome
                          ? `Margin: ${((parseFloat(latest.operatingIncome) / parseFloat(latest.totalRevenue)) * 100).toFixed(1)}%`
                          : undefined
                      }
                    />
                    <MetricCard
                      label="Net Income"
                      value={formatCurrency(latest?.netIncome)}
                      sub={
                        latest?.totalRevenue && latest?.netIncome
                          ? `Margin: ${((parseFloat(latest.netIncome) / parseFloat(latest.totalRevenue)) * 100).toFixed(1)}%`
                          : undefined
                      }
                    />
                    <MetricCard
                      label="EBITDA"
                      value={formatCurrency(latest?.ebitda)}
                    />
                  </div>

                  {/* Table */}
                  <Card>
                    <CardContent className="pt-6">
                      <FinancialTable
                        reports={reports}
                        metrics={[
                          { key: "totalRevenue", label: "Total Revenue", format: "currency" },
                          { key: "costOfRevenue", label: "Cost of Revenue", format: "currency" },
                          { key: "grossProfit", label: "Gross Profit", format: "currency" },
                          { key: "operatingExpenses", label: "Operating Expenses", format: "currency" },
                          { key: "operatingIncome", label: "Operating Income", format: "currency" },
                          { key: "researchAndDevelopment", label: "R&D Expenses", format: "currency" },
                          { key: "sellingGeneralAndAdministrative", label: "SG&A", format: "currency" },
                          { key: "interestExpense", label: "Interest Expense", format: "currency" },
                          { key: "incomeBeforeTax", label: "Pre-Tax Income", format: "currency" },
                          { key: "incomeTaxExpense", label: "Tax Expense", format: "currency" },
                          { key: "netIncome", label: "Net Income", format: "currency" },
                          { key: "ebitda", label: "EBITDA", format: "currency" },
                        ]}
                      />
                    </CardContent>
                  </Card>
                </>
              )
            })()}
          </TabsContent>

          {/* ====== BALANCE SHEET TAB ====== */}
          <TabsContent value="balance" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Balance Sheet</h2>
              <PeriodToggle period={balancePeriod} onChange={setBalancePeriod} />
            </div>

            {balance && (() => {
              const reports =
                balancePeriod === "annual"
                  ? balance.annualReports.slice(0, 5)
                  : balance.quarterlyReports.slice(0, 8)
              const latest = reports[0]

              return (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                      label="Total Assets"
                      value={formatCurrency(latest?.totalAssets)}
                    />
                    <MetricCard
                      label="Total Liabilities"
                      value={formatCurrency(latest?.totalLiabilities)}
                    />
                    <MetricCard
                      label="Shareholder Equity"
                      value={formatCurrency(latest?.totalShareholderEquity)}
                    />
                    <MetricCard
                      label="Cash & Equivalents"
                      value={formatCurrency(latest?.cashAndCashEquivalentsAtCarryingValue)}
                    />
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      <FinancialTable
                        reports={reports}
                        metrics={[
                          { key: "totalAssets", label: "Total Assets", format: "currency" },
                          { key: "totalCurrentAssets", label: "Current Assets", format: "currency" },
                          { key: "cashAndCashEquivalentsAtCarryingValue", label: "Cash & Equivalents", format: "currency" },
                          { key: "inventory", label: "Inventory", format: "currency" },
                          { key: "currentNetReceivables", label: "Net Receivables", format: "currency" },
                          { key: "propertyPlantEquipment", label: "PP&E", format: "currency" },
                          { key: "goodwill", label: "Goodwill", format: "currency" },
                          { key: "totalLiabilities", label: "Total Liabilities", format: "currency" },
                          { key: "totalCurrentLiabilities", label: "Current Liabilities", format: "currency" },
                          { key: "currentAccountsPayable", label: "Accounts Payable", format: "currency" },
                          { key: "longTermDebt", label: "Long-Term Debt", format: "currency" },
                          { key: "totalShareholderEquity", label: "Shareholder Equity", format: "currency" },
                          { key: "retainedEarnings", label: "Retained Earnings", format: "currency" },
                        ]}
                      />
                    </CardContent>
                  </Card>
                </>
              )
            })()}
          </TabsContent>

          {/* ====== CASH FLOW TAB ====== */}
          <TabsContent value="cashflow" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Cash Flow</h2>
              <PeriodToggle period={cashPeriod} onChange={setCashPeriod} />
            </div>

            {cashFlow && (() => {
              const reports =
                cashPeriod === "annual"
                  ? cashFlow.annualReports.slice(0, 5)
                  : cashFlow.quarterlyReports.slice(0, 8)
              const latest = reports[0]

              // Calculate Free Cash Flow
              const opCf = parseFloat(latest?.operatingCashflow || "0")
              const capex = parseFloat(latest?.capitalExpenditures || "0")
              const freeCf = opCf - capex

              return (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <MetricCard
                      label="Operating CF"
                      value={formatCurrency(latest?.operatingCashflow)}
                    />
                    <MetricCard
                      label="Investing CF"
                      value={formatCurrency(latest?.cashflowFromInvestment)}
                    />
                    <MetricCard
                      label="Financing CF"
                      value={formatCurrency(latest?.cashflowFromFinancing)}
                    />
                    <MetricCard
                      label="Free Cash Flow"
                      value={formatCurrency(freeCf.toString())}
                      sub="Operating CF - CapEx"
                    />
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      <FinancialTable
                        reports={reports}
                        metrics={[
                          { key: "operatingCashflow", label: "Operating Cash Flow", format: "currency" },
                          { key: "capitalExpenditures", label: "Capital Expenditures", format: "currency" },
                          { key: "cashflowFromInvestment", label: "Investing Cash Flow", format: "currency" },
                          { key: "cashflowFromFinancing", label: "Financing Cash Flow", format: "currency" },
                          { key: "depreciationDepletionAndAmortization", label: "D&A", format: "currency" },
                          { key: "netIncome", label: "Net Income", format: "currency" },
                        ]}
                      />
                    </CardContent>
                  </Card>
                </>
              )
            })()}
          </TabsContent>

          {/* ====== EARNINGS TAB ====== */}
          <TabsContent value="earnings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Earnings</h2>
              <PeriodToggle period={earningsPeriod} onChange={setEarningsPeriod} />
            </div>

            {earnings && earningsPeriod === "quarterly" && (
              <>
                {/* EPS Cards */}
                {earnings.quarterlyEarnings.length > 0 && (() => {
                  const latest = earnings.quarterlyEarnings[0]
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <MetricCard
                        label="Reported EPS"
                        value={formatEps(latest.reportedEPS)}
                        sub={`Date: ${latest.reportedDate}`}
                      />
                      <MetricCard
                        label="Estimated EPS"
                        value={formatEps(latest.estimatedEPS)}
                      />
                      <MetricCard
                        label="Surprise"
                        value={`$${parseFloat(latest.surprise || "0").toFixed(2)}`}
                      />
                      <MetricCard
                        label="Surprise %"
                        value={`${parseFloat(latest.surprisePercentage || "0").toFixed(2)}%`}
                      />
                    </div>
                  )
                })()}

                {/* Quarterly Earnings Table */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="overflow-x-auto -mx-4 sm:-mx-6">
                      <div className="inline-block min-w-full align-middle px-4 sm:px-6">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                                Quarter
                              </th>
                              <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                                Reported
                              </th>
                              <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                                Estimated
                              </th>
                              <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                                Surprise
                              </th>
                              <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                                Result
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {earnings.quarterlyEarnings.map((q) => {
                              const surprise = parseFloat(q.surprise || "0")
                              const surprisePct = parseFloat(q.surprisePercentage || "0")
                              const beat = surprise >= 0
                              return (
                                <tr
                                  key={q.fiscalDateEnding}
                                  className="border-b border-border/50 hover:bg-muted/30"
                                >
                                  <td className="py-2 pr-4 text-muted-foreground">
                                    {new Date(q.fiscalDateEnding).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "short",
                                    })}
                                  </td>
                                  <td className="text-right py-2 px-3 font-mono tabular-nums">
                                    {formatEps(q.reportedEPS)}
                                  </td>
                                  <td className="text-right py-2 px-3 font-mono tabular-nums">
                                    {formatEps(q.estimatedEPS)}
                                  </td>
                                  <td className="text-right py-2 px-3 font-mono tabular-nums">
                                    {surprisePct.toFixed(1)}%
                                  </td>
                                  <td className="text-right py-2 px-3">
                                    <Badge
                                      variant={beat ? "default" : "destructive"}
                                      className="text-xs"
                                    >
                                      {beat ? "Beat" : "Miss"}
                                    </Badge>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {earnings && earningsPeriod === "annual" && (
              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto -mx-4 sm:-mx-6">
                    <div className="inline-block min-w-full align-middle px-4 sm:px-6">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                              Fiscal Year
                            </th>
                            <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                              EPS
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {earnings.annualEarnings.slice(0, 5).map((a) => (
                            <tr
                              key={a.fiscalDateEnding}
                              className="border-b border-border/50 hover:bg-muted/30"
                            >
                              <td className="py-2 pr-4 text-muted-foreground">
                                {new Date(a.fiscalDateEnding).getFullYear()}
                              </td>
                              <td className="text-right py-2 px-3 font-mono tabular-nums font-medium">
                                {formatEps(a.reportedEPS)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
