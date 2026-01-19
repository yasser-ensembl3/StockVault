"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface Quarter {
  id: string
  name: string
}

interface Company {
  name: string
  folderId: string
  hasFinancial: boolean
  hasStrategic: boolean
}

type FinancialData = any

const COLORS = {
  revenue: "#3b82f6",
  netIncome: "#10b981",
  operatingIncome: "#f59e0b",
  eps: "#8b5cf6",
}

export default function TrendsPage() {
  const [quarters, setQuarters] = useState<Quarter[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>("")
  const [selectedQuarters, setSelectedQuarters] = useState<string[]>([])
  const [quarterData, setQuarterData] = useState<Record<string, FinancialData>>({})
  const [loading, setLoading] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(false)

  // Fetch quarters on mount
  useEffect(() => {
    async function fetchQuarters() {
      try {
        const res = await fetch("/api/drive/quarters")
        if (res.ok) {
          const data = await res.json()
          setQuarters(data.quarters || [])
        }
      } catch (error) {
        console.error("Failed to fetch quarters:", error)
      }
    }
    fetchQuarters()
  }, [])

  // Fetch companies for the first quarter (to get the list)
  useEffect(() => {
    async function fetchCompanies() {
      if (quarters.length === 0) return

      setLoadingCompanies(true)
      try {
        // Fetch companies from the most recent quarter
        const res = await fetch(`/api/drive/companies?quarter=${encodeURIComponent(quarters[0].name)}`)
        if (res.ok) {
          const data = await res.json()
          setCompanies(data.companies || [])
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error)
      } finally {
        setLoadingCompanies(false)
      }
    }
    fetchCompanies()
  }, [quarters])

  // Fetch data for selected company across selected quarters
  useEffect(() => {
    async function fetchQuarterData() {
      if (!selectedCompany || selectedQuarters.length === 0) return

      setLoading(true)
      const newData: Record<string, FinancialData> = {}

      await Promise.all(
        selectedQuarters.map(async (quarter) => {
          try {
            const res = await fetch(
              `/api/drive/insights?quarter=${encodeURIComponent(quarter)}&company=${encodeURIComponent(selectedCompany)}&type=financial`
            )
            if (res.ok) {
              const data = await res.json()
              newData[quarter] = data.data
            }
          } catch (error) {
            console.error(`Failed to fetch data for ${quarter}:`, error)
          }
        })
      )

      setQuarterData(newData)
      setLoading(false)
    }
    fetchQuarterData()
  }, [selectedCompany, selectedQuarters])

  const toggleQuarter = (quarter: string) => {
    if (selectedQuarters.includes(quarter)) {
      setSelectedQuarters(selectedQuarters.filter((q) => q !== quarter))
      const newData = { ...quarterData }
      delete newData[quarter]
      setQuarterData(newData)
    } else {
      setSelectedQuarters([...selectedQuarters, quarter])
    }
  }

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

  const getValue = (data: FinancialData, path: string): number | null => {
    if (!data) return null
    const parts = path.split(".")
    let current = data
    for (const part of parts) {
      if (current === null || current === undefined) return null
      current = current[part]
    }
    return typeof current === "number" ? current : null
  }

  // Sort quarters chronologically
  const sortedSelectedQuarters = [...selectedQuarters].sort((a, b) => {
    // Parse quarter names like "Q3 2024" or "Q3"
    const parseQuarter = (q: string) => {
      const match = q.match(/Q(\d)\s*(\d{4})?/)
      if (match) {
        const quarter = parseInt(match[1])
        const year = match[2] ? parseInt(match[2]) : 2024
        return year * 10 + quarter
      }
      return 0
    }
    return parseQuarter(a) - parseQuarter(b)
  })

  // Prepare chart data
  const chartData = sortedSelectedQuarters.map((quarter) => ({
    quarter,
    revenue: getValue(quarterData[quarter], "income_statement.revenue.value") || 0,
    netIncome: getValue(quarterData[quarter], "income_statement.net_income.value") || 0,
    operatingIncome: getValue(quarterData[quarter], "income_statement.operating_income.value") || 0,
    eps: getValue(quarterData[quarter], "income_statement.eps.diluted") || 0,
  }))

  // Growth rates data
  const growthData = sortedSelectedQuarters.map((quarter) => ({
    quarter,
    revenueYoY: getValue(quarterData[quarter], "income_statement.revenue.yoy_pct") || 0,
    netIncomeYoY: getValue(quarterData[quarter], "income_statement.net_income.yoy_pct") || 0,
    epsYoY: getValue(quarterData[quarter], "income_statement.eps.yoy_pct") || 0,
  }))

  // Metrics for table
  const metrics = [
    { label: "Revenue", path: "income_statement.revenue.value", format: "currency" },
    { label: "Revenue YoY", path: "income_statement.revenue.yoy_pct", format: "percent" },
    { label: "Operating Income", path: "income_statement.operating_income.value", format: "currency" },
    { label: "Operating Margin", path: "income_statement.operating_income.margin_pct", format: "percent" },
    { label: "Net Income", path: "income_statement.net_income.value", format: "currency" },
    { label: "Net Income Margin", path: "income_statement.net_income.margin_pct", format: "percent" },
    { label: "EPS (Diluted)", path: "income_statement.eps.diluted", format: "dollar" },
    { label: "EPS YoY", path: "income_statement.eps.yoy_pct", format: "percent" },
    { label: "Total Cash", path: "balance_sheet.total_cash", format: "currency" },
    { label: "Total Debt", path: "balance_sheet.total_debt", format: "currency" },
    { label: "Free Cash Flow", path: "cash_flow.free_cash_flow", format: "currency" },
  ]

  const availableCompanies = companies.filter((c) => c.hasFinancial)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">Quarter Trends</h1>
        <p className="text-muted-foreground">Compare a company&apos;s performance across quarters</p>
      </div>

      {/* Selectors */}
      <Card>
        <CardHeader>
          <CardTitle>Select Company & Quarters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Company Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Company</label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder={loadingCompanies ? "Loading..." : "Select a company..."} />
              </SelectTrigger>
              <SelectContent>
                {availableCompanies.map((company) => (
                  <SelectItem key={company.name} value={company.name}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quarter Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Quarters (click to toggle)</label>
            <div className="flex flex-wrap gap-2">
              {quarters.map((quarter) => (
                <Badge
                  key={quarter.id}
                  variant={selectedQuarters.includes(quarter.name) ? "default" : "outline"}
                  className="cursor-pointer text-sm py-1 px-3"
                  onClick={() => toggleQuarter(quarter.name)}
                >
                  {quarter.name}
                </Badge>
              ))}
            </div>
          </div>

          {selectedCompany && selectedQuarters.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Click on quarters above to add them to the comparison.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      {selectedCompany && selectedQuarters.length > 0 && !loading && Object.keys(quarterData).length > 0 && (
        <>
          {/* Revenue & Net Income Trend */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedCompany} - Revenue & Net Income Trend ($M)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="quarter" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                    formatter={(value: number) => [`$${value.toFixed(0)}M`]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke={COLORS.revenue}
                    strokeWidth={3}
                    dot={{ fill: COLORS.revenue, strokeWidth: 2, r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="netIncome"
                    name="Net Income"
                    stroke={COLORS.netIncome}
                    strokeWidth={3}
                    dot={{ fill: COLORS.netIncome, strokeWidth: 2, r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="operatingIncome"
                    name="Operating Income"
                    stroke={COLORS.operatingIncome}
                    strokeWidth={3}
                    dot={{ fill: COLORS.operatingIncome, strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* EPS Trend */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>EPS Trend ($)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="quarter" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`]}
                    />
                    <Bar dataKey="eps" name="EPS" fill={COLORS.eps} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Growth Rates */}
            <Card>
              <CardHeader>
                <CardTitle>YoY Growth Rates (%)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="quarter" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`]}
                    />
                    <Legend />
                    <Bar dataKey="revenueYoY" name="Revenue YoY" fill={COLORS.revenue} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="netIncomeYoY" name="Net Income YoY" fill={COLORS.netIncome} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Quarter-over-Quarter Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Metric</th>
                      {sortedSelectedQuarters.map((quarter) => (
                        <th key={quarter} className="text-right py-3 px-4 font-medium">
                          {quarter}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((metric) => (
                      <tr key={metric.path} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 text-muted-foreground">{metric.label}</td>
                        {sortedSelectedQuarters.map((quarter) => {
                          const value = getValue(quarterData[quarter], metric.path)

                          let formatted: string
                          if (metric.format === "currency") {
                            formatted = formatCurrency(value !== null ? value * 1000000 : null)
                          } else if (metric.format === "percent") {
                            formatted = formatPercent(value)
                          } else if (metric.format === "dollar") {
                            formatted = value !== null ? `$${value.toFixed(2)}` : "N/A"
                          } else {
                            formatted = value !== null ? value.toLocaleString() : "N/A"
                          }

                          const isGrowthMetric = metric.label.includes("YoY")
                          const isPositive = value !== null && value > 0
                          const isNegative = value !== null && value < 0

                          return (
                            <td
                              key={quarter}
                              className={`text-right py-3 px-4 font-medium ${
                                isGrowthMetric
                                  ? isPositive
                                    ? "text-green-500"
                                    : isNegative
                                    ? "text-red-500"
                                    : ""
                                  : ""
                              }`}
                            >
                              {formatted}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12 text-muted-foreground">
          Loading data for {selectedCompany}...
        </div>
      )}

      {/* Empty state */}
      {!selectedCompany && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Select a company and quarters to see trends over time.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
