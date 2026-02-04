"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ParsedReport } from "@/lib/investment-reports"

interface PageProps {
  params: Promise<{ name: string }>
}

interface ReportData {
  company: {
    id: string
    name: string
    displayName: string
    folderId: string
    fileId: string
  }
  report: ParsedReport
}

export default function InvestmentReportPage({ params }: PageProps) {
  const [companyName, setCompanyName] = useState<string>("")
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      setError(null)
      try {
        const response = await fetch(`/api/investment/report?company=${encodeURIComponent(companyName)}`)
        const result = await response.json()

        if (result.error) {
          setError(result.error)
        } else {
          setData(result.data)
        }
      } catch (err) {
        setError("Failed to load report")
        console.error("Failed to fetch report:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [companyName])

  if (!companyName) {
    return <div className="p-6">Loading...</div>
  }

  const report = data?.report
  const company = data?.company

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold">{company?.displayName || companyName}</h1>
          <p className="text-muted-foreground">Investment Report 2025</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading report...
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {error}
          </CardContent>
        </Card>
      ) : report ? (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="financial" className="text-xs sm:text-sm">Financial</TabsTrigger>
            <TabsTrigger value="milestones" className="text-xs sm:text-sm">Milestones</TabsTrigger>
            <TabsTrigger value="product" className="text-xs sm:text-sm">Product</TabsTrigger>
            <TabsTrigger value="customers" className="text-xs sm:text-sm">Customers</TabsTrigger>
            <TabsTrigger value="signals" className="text-xs sm:text-sm">Signals</TabsTrigger>
            <TabsTrigger value="raw" className="text-xs sm:text-sm">Raw</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>Company Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{report.companyOverview.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {report.companyOverview.ceo && (
                    <div className="bg-muted/50 p-3 rounded">
                      <p className="text-xs text-muted-foreground">CEO</p>
                      <p className="font-medium">{report.companyOverview.ceo}</p>
                    </div>
                  )}
                  {report.companyOverview.president && (
                    <div className="bg-muted/50 p-3 rounded">
                      <p className="text-xs text-muted-foreground">President</p>
                      <p className="font-medium">{report.companyOverview.president}</p>
                    </div>
                  )}
                  {report.companyOverview.location && (
                    <div className="bg-muted/50 p-3 rounded">
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-medium">{report.companyOverview.location}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Key Signals Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.keySignals.positive.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <span>Positive Indicators</span>
                      <Badge variant="default">{report.keySignals.positive.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.keySignals.positive.slice(0, 5).map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-foreground shrink-0">+</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {report.keySignals.watchItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-muted-foreground flex items-center gap-2">
                      <span>Watch Items</span>
                      <Badge variant="secondary">{report.keySignals.watchItems.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.keySignals.watchItems.slice(0, 5).map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-muted-foreground shrink-0">!</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Strategic Observations */}
            {report.keySignals.strategicObservations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Strategic Observations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.keySignals.strategicObservations.map((obs, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-muted-foreground shrink-0">•</span>
                        {obs}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* FINANCIAL TAB */}
          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                {report.financialPerformance.keyMetrics.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3">Key Metrics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {report.financialPerformance.keyMetrics.map((metric, i) => (
                        <div key={i} className="bg-muted/50 p-3 rounded">
                          <p className="text-sm" dangerouslySetInnerHTML={{
                            __html: metric.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                          }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw Financial Content */}
                <div className="prose prose-invert max-w-none">
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {report.financialPerformance.raw
                      .split('\n')
                      .filter(line => !line.startsWith('|') && !line.startsWith('-'))
                      .join('\n')
                      .trim()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Investor Asks */}
            {(report.investorAsks.targetAccounts.length > 0 || report.investorAsks.fundraising) && (
              <Card>
                <CardHeader>
                  <CardTitle>Investor Asks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.investorAsks.targetAccounts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Target Accounts (Intro Requests)</h4>
                      <div className="flex flex-wrap gap-2">
                        {report.investorAsks.targetAccounts.map((account, i) => (
                          <Badge key={i} variant="outline">{account}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {report.investorAsks.fundraising && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Fundraising</h4>
                      <p className="text-sm text-muted-foreground">{report.investorAsks.fundraising}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* MILESTONES TAB */}
          <TabsContent value="milestones" className="space-y-6">
            {Object.keys(report.keyMilestones).length > 0 ? (
              Object.entries(report.keyMilestones).map(([quarter, milestones]) => (
                <Card key={quarter}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span>{quarter}</span>
                      <Badge variant="secondary">{milestones.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {milestones.map((milestone, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-muted-foreground shrink-0">•</span>
                          <span dangerouslySetInnerHTML={{
                            __html: milestone.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                          }} />
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No milestones data available
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* PRODUCT TAB */}
          <TabsContent value="product" className="space-y-6">
            {Object.keys(report.product.sections).length > 0 ? (
              Object.entries(report.product.sections).map(([sectionName, content]) => (
                <Card key={sectionName}>
                  <CardHeader>
                    <CardTitle>{sectionName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {content.split('\n').map((line, i) => {
                        if (line.startsWith('- ')) {
                          return (
                            <div key={i} className="flex gap-2 mb-1">
                              <span className="text-muted-foreground shrink-0">•</span>
                              <span dangerouslySetInnerHTML={{
                                __html: line.replace(/^- /, '').replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                              }} />
                            </div>
                          )
                        }
                        return <p key={i} className="mb-2" dangerouslySetInnerHTML={{
                          __html: line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                        }} />
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No product data available
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* CUSTOMERS TAB */}
          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notable Customers</CardTitle>
              </CardHeader>
              <CardContent>
                {report.notableCustomers.table.length > 1 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {report.notableCustomers.table[0]?.map((header, i) => (
                            <th key={i} className="text-left py-2 px-3 font-medium">{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {report.notableCustomers.table.slice(1).map((row, i) => (
                          <tr key={i} className="border-b border-muted">
                            {row.map((cell, j) => (
                              <td key={j} className="py-2 px-3 text-muted-foreground">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground">{report.notableCustomers.raw || "No customer data available"}</p>
                )}
              </CardContent>
            </Card>

            {/* Team Updates */}
            {report.teamUpdates && (
              <Card>
                <CardHeader>
                  <CardTitle>Team Updates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {report.teamUpdates.split('\n').map((line, i) => {
                      if (line.startsWith('- ')) {
                        return (
                          <div key={i} className="flex gap-2 mb-2">
                            <span className="text-muted-foreground shrink-0">•</span>
                            <span dangerouslySetInnerHTML={{
                              __html: line.replace(/^- /, '').replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                            }} />
                          </div>
                        )
                      }
                      return <p key={i} className="mb-2" dangerouslySetInnerHTML={{
                        __html: line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
                      }} />
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* SIGNALS TAB */}
          <TabsContent value="signals" className="space-y-6">
            {/* Positive Indicators */}
            {report.keySignals.positive.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-foreground">Positive Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.keySignals.positive.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-foreground shrink-0">+</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Watch Items */}
            {report.keySignals.watchItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-muted-foreground">Watch Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.keySignals.watchItems.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-muted-foreground shrink-0">!</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Strategic Observations */}
            {report.keySignals.strategicObservations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-muted-foreground">Strategic Observations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {report.keySignals.strategicObservations.map((item, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-muted-foreground shrink-0">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* RAW TAB */}
          <TabsContent value="raw" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Raw Markdown Content</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-muted/50 p-4 rounded-lg overflow-x-auto max-h-[600px] overflow-y-auto">
                  {report.rawContent}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No report data available for {companyName}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
