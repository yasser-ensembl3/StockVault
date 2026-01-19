"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

interface Company {
  name: string
  folderId: string
  hasFinancial: boolean
  hasStrategic: boolean
}

type FinancialData = any

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"]

function CompareContent() {
  const searchParams = useSearchParams()
  const quarter = searchParams.get("quarter") || "Q3"

  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [companyData, setCompanyData] = useState<Record<string, FinancialData>>({})
  const [loading, setLoading] = useState(false)

  // Fetch available companies
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch(`/api/drive/companies?quarter=${encodeURIComponent(quarter)}`)
        if (res.ok) {
          const data = await res.json()
          setCompanies(data.companies || [])
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error)
      }
    }
    fetchCompanies()
  }, [quarter])

  // Fetch data for selected companies
  useEffect(() => {
    async function fetchCompanyData() {
      if (selectedCompanies.length === 0) return

      setLoading(true)
      const newData: Record<string, FinancialData> = {}

      await Promise.all(
        selectedCompanies.map(async (company) => {
          try {
            const res = await fetch(
              `/api/drive/insights?quarter=${encodeURIComponent(quarter)}&company=${encodeURIComponent(company)}&type=financial`
            )
            if (res.ok) {
              const data = await res.json()
              newData[company] = data.data
            }
          } catch (error) {
            console.error(`Failed to fetch data for ${company}:`, error)
          }
        })
      )

      setCompanyData(newData)
      setLoading(false)
    }
    fetchCompanyData()
  }, [selectedCompanies, quarter])

  const addCompany = (company: string) => {
    if (company && !selectedCompanies.includes(company) && selectedCompanies.length < 4) {
      setSelectedCompanies([...selectedCompanies, company])
    }
  }

  const removeCompany = (company: string) => {
    setSelectedCompanies(selectedCompanies.filter((c) => c !== company))
    const newData = { ...companyData }
    delete newData[company]
    setCompanyData(newData)
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

  const metrics = [
    { label: "Revenue", path: "income_statement.revenue.value", multiplier: 1000000, format: "currency" },
    { label: "Revenue YoY", path: "income_statement.revenue.yoy_pct", multiplier: 1, format: "percent" },
    { label: "Operating Income", path: "income_statement.operating_income.value", multiplier: 1000000, format: "currency" },
    { label: "Operating Margin", path: "income_statement.operating_income.margin_pct", multiplier: 1, format: "percent" },
    { label: "Net Income", path: "income_statement.net_income.value", multiplier: 1000000, format: "currency" },
    { label: "Net Income YoY", path: "income_statement.net_income.yoy_pct", multiplier: 1, format: "percent" },
    { label: "EPS (Diluted)", path: "income_statement.eps.diluted", multiplier: 1, format: "dollar" },
    { label: "EPS YoY", path: "income_statement.eps.yoy_pct", multiplier: 1, format: "percent" },
    { label: "Total Cash", path: "balance_sheet.total_cash", multiplier: 1000000, format: "currency" },
    { label: "Total Debt", path: "balance_sheet.total_debt", multiplier: 1000000, format: "currency" },
    { label: "Total Assets", path: "balance_sheet.total_assets", multiplier: 1000000, format: "currency" },
    { label: "Shareholders Equity", path: "balance_sheet.shareholders_equity", multiplier: 1000000, format: "currency" },
    { label: "Operating CF", path: "cash_flow.operating_cash_flow", multiplier: 1000000, format: "currency" },
    { label: "Free Cash Flow", path: "cash_flow.free_cash_flow", multiplier: 1000000, format: "currency" },
  ]

  const availableCompanies = companies.filter(
    (c) => c.hasFinancial && !selectedCompanies.includes(c.name)
  )

  // Prepare data for Revenue chart
  const revenueChartData = selectedCompanies.map((company) => ({
    name: company,
    revenue: (getValue(companyData[company], "income_statement.revenue.value") || 0),
  }))

  // Prepare data for Net Income chart
  const netIncomeChartData = selectedCompanies.map((company) => ({
    name: company,
    netIncome: (getValue(companyData[company], "income_statement.net_income.value") || 0),
  }))

  // Prepare data for Growth comparison chart
  const growthChartData = selectedCompanies.map((company) => ({
    name: company,
    revenueYoY: getValue(companyData[company], "income_statement.revenue.yoy_pct") || 0,
    netIncomeYoY: getValue(companyData[company], "income_statement.net_income.yoy_pct") || 0,
    epsYoY: getValue(companyData[company], "income_statement.eps.yoy_pct") || 0,
  }))

  // Prepare data for Radar chart (normalized metrics for comparison)
  const radarChartData = [
    {
      metric: "Revenue",
      ...Object.fromEntries(
        selectedCompanies.map((company) => [
          company,
          Math.min(100, (getValue(companyData[company], "income_statement.revenue.value") || 0) / 100),
        ])
      ),
    },
    {
      metric: "Net Income",
      ...Object.fromEntries(
        selectedCompanies.map((company) => [
          company,
          Math.min(100, (getValue(companyData[company], "income_statement.net_income.value") || 0) / 10),
        ])
      ),
    },
    {
      metric: "Op. Margin",
      ...Object.fromEntries(
        selectedCompanies.map((company) => [
          company,
          getValue(companyData[company], "income_statement.operating_income.margin_pct") || 0,
        ])
      ),
    },
    {
      metric: "Revenue Growth",
      ...Object.fromEntries(
        selectedCompanies.map((company) => [
          company,
          Math.max(0, getValue(companyData[company], "income_statement.revenue.yoy_pct") || 0),
        ])
      ),
    },
    {
      metric: "Cash Position",
      ...Object.fromEntries(
        selectedCompanies.map((company) => [
          company,
          Math.min(100, (getValue(companyData[company], "balance_sheet.total_cash") || 0) / 100),
        ])
      ),
    },
  ]

  // Prepare multi-metric comparison data
  const multiMetricData = [
    { metric: "Revenue ($M)", ...Object.fromEntries(selectedCompanies.map(c => [c, getValue(companyData[c], "income_statement.revenue.value") || 0])) },
    { metric: "Net Income ($M)", ...Object.fromEntries(selectedCompanies.map(c => [c, getValue(companyData[c], "income_statement.net_income.value") || 0])) },
    { metric: "Op. Income ($M)", ...Object.fromEntries(selectedCompanies.map(c => [c, getValue(companyData[c], "income_statement.operating_income.value") || 0])) },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold">Compare Companies</h1>
        <p className="text-muted-foreground">{quarter} - Select up to 4 companies to compare</p>
      </div>

      {/* Company Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Companies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {selectedCompanies.map((company, index) => (
              <Badge
                key={company}
                variant="secondary"
                className="text-sm py-1 px-3"
                style={{ borderLeft: `4px solid ${COLORS[index]}` }}
              >
                {company}
                <button
                  onClick={() => removeCompany(company)}
                  className="ml-2 hover:text-red-500"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>

          {selectedCompanies.length < 4 && (
            <Select onValueChange={addCompany}>
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Add a company..." />
              </SelectTrigger>
              <SelectContent>
                {availableCompanies.map((company) => (
                  <SelectItem key={company.name} value={company.name}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedCompanies.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Select companies from the dropdown to start comparing.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Charts Section */}
      {selectedCompanies.length > 1 && !loading && Object.keys(companyData).length > 0 && (
        <>
          {/* Revenue & Net Income Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Comparison ($M)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                      formatter={(value: number) => [`$${value.toFixed(0)}M`, 'Revenue']}
                    />
                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      {revenueChartData.map((_, index) => (
                        <Bar key={index} dataKey="revenue" fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Net Income Comparison ($M)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={netIncomeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                      formatter={(value: number) => [`$${value.toFixed(0)}M`, 'Net Income']}
                    />
                    <Bar dataKey="netIncome" fill="#10b981" radius={[4, 4, 0, 0]}>
                      {netIncomeChartData.map((_, index) => (
                        <Bar key={index} dataKey="netIncome" fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Growth Rates Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Growth Rates Comparison (YoY %)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={growthChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`]}
                  />
                  <Legend />
                  <Bar dataKey="revenueYoY" name="Revenue YoY" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netIncomeYoY" name="Net Income YoY" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="epsYoY" name="EPS YoY" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Multi-Dimensional Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarChartData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="metric" stroke="#9ca3af" />
                  <PolarRadiusAxis stroke="#9ca3af" />
                  {selectedCompanies.map((company, index) => (
                    <Radar
                      key={company}
                      name={company}
                      dataKey={company}
                      stroke={COLORS[index]}
                      fill={COLORS[index]}
                      fillOpacity={0.2}
                    />
                  ))}
                  <Legend />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Comparison Table */}
      {selectedCompanies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Financial Comparison Table</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading financial data...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Metric</th>
                      {selectedCompanies.map((company, index) => (
                        <th key={company} className="text-right py-3 px-4 font-medium">
                          <span style={{ color: COLORS[index] }}>{company}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map((metric) => (
                      <tr key={metric.path} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 text-muted-foreground">{metric.label}</td>
                        {selectedCompanies.map((company) => {
                          const value = getValue(companyData[company], metric.path)
                          const displayValue = value !== null ? value * metric.multiplier : null

                          let formatted: string
                          if (metric.format === "currency") {
                            formatted = formatCurrency(displayValue)
                          } else if (metric.format === "percent") {
                            formatted = formatPercent(value)
                          } else if (metric.format === "dollar") {
                            formatted = value !== null ? `$${value.toFixed(2)}` : "N/A"
                          } else {
                            formatted = value !== null ? value.toLocaleString() : "N/A"
                          }

                          const isPositive = value !== null && value > 0
                          const isNegative = value !== null && value < 0
                          const isGrowthMetric = metric.label.includes("YoY")

                          return (
                            <td
                              key={company}
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
            )}
          </CardContent>
        </Card>
      )}

      {/* Company Type Badges */}
      {selectedCompanies.length > 0 && Object.keys(companyData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Company Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {selectedCompanies.map((company, index) => {
                const data = companyData[company]
                if (!data?.company_info) return null

                return (
                  <div
                    key={company}
                    className="text-center p-4 bg-muted/50 rounded-lg"
                    style={{ borderTop: `4px solid ${COLORS[index]}` }}
                  >
                    <p className="font-bold">{data.company_info.name || company}</p>
                    <p className="text-sm text-muted-foreground">
                      {data.company_info.ticker}
                    </p>
                    {data.company_info.company_type && (
                      <Badge variant="outline" className="mt-2">
                        {data.company_info.company_type}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <CompareContent />
    </Suspense>
  )
}
