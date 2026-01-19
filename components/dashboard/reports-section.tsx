"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageSection } from "./page-section"
import { useProjectConfig } from "@/lib/project-config"
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"

export function ReportsSection() {
  const config = useProjectConfig()
  const [reports, setReports] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(true)

  // Load reports from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('minivault_weekly_reports')
    if (stored) {
      try {
        setReports(JSON.parse(stored))
      } catch (e) {
        console.error('Failed to parse stored reports:', e)
      }
    }
  }, [])

  const generateReport = async () => {
    if (!config) return

    setGenerating(true)
    setError(null)
    try {
      // Fetch tasks from Notion if configured
      let tasksData = { tasks: [] }
      if (config?.notionDatabases?.tasks) {
        const tasksResponse = await fetch(`/api/notion/tasks?databaseId=${config?.notionDatabases.tasks}`)
        if (tasksResponse.ok) {
          tasksData = await tasksResponse.json()
        }
      }

      // Generate summary with AI
      const aiResponse = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Generate a comprehensive weekly project summary report based on this data:\n\nTasks: ${JSON.stringify(tasksData.tasks)}\n\nInclude:\n1. Executive Summary\n2. Task Completion Stats\n3. Key Achievements\n4. Blockers & Issues\n5. Next Week's Priorities\n\nFormat the report in markdown.`,
          provider: "openai",
        }),
      })

      const aiData = await aiResponse.json()

      if (!aiResponse.ok) {
        throw new Error(aiData.error || "Failed to generate report")
      }

      // Save report to config
      const newReport = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        content: aiData.response,
        title: `Weekly Report - ${new Date().toLocaleDateString()}`
      }

      const updatedReports = [newReport, ...reports]
      setReports(updatedReports)
      localStorage.setItem('minivault_weekly_reports', JSON.stringify(updatedReports))

    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const deleteReport = (reportId: string) => {
    if (confirm("Are you sure you want to delete this report?")) {
      const updatedReports = reports.filter(r => r.id !== reportId)
      setReports(updatedReports)
      localStorage.setItem('minivault_weekly_reports', JSON.stringify(updatedReports))
    }
  }
  const latestReport = reports[0]

  const keyMetrics = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="text-2xl font-bold text-blue-700">{reports.length}</div>
        <div className="text-sm text-blue-600">Reports Generated</div>
      </div>
      <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
        <div className="text-2xl font-bold text-green-700">{config?.notionDatabases?.tasks ? "✓" : "—"}</div>
        <div className="text-sm text-green-600">Data Source</div>
      </div>
      <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-200">
        <div className="text-2xl font-bold text-purple-700">
          {latestReport ? new Date(latestReport.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "—"}
        </div>
        <div className="text-sm text-purple-600">Latest Report</div>
      </div>
    </div>
  )

  const detailedContent = (
    <div className="space-y-6">
      <div className="border rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setDetailsOpen(!detailsOpen)}
        >
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Weekly Reports</h4>
            <span className="text-xs text-muted-foreground">
              ({reports.length} reports)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={(e) => {
              e.stopPropagation()
              generateReport()
            }} disabled={generating}>
              {generating ? "Generating..." : "Generate New Report"}
            </Button>
            {detailsOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {detailsOpen && (
          <div className="p-4 pt-0 space-y-4">
            {error && (
              <div className="p-4 border border-red-500 rounded-lg bg-red-500/10">
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            {!config?.notionDatabases?.tasks && (
              <div className="p-4 border border-dashed rounded-lg bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Configure your Notion Tasks database in Project Settings to generate AI-powered reports from your task data.
                </p>
              </div>
            )}

            {generating ? (
              <div className="p-8 border rounded-lg text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Generating your weekly report with AI...</p>
                </div>
              </div>
            ) : reports.length === 0 ? (
              <div className="p-8 border rounded-lg text-center border-dashed">
                <p className="text-sm text-muted-foreground">
                  No reports generated yet.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Click &ldquo;Generate New Report&rdquo; to create your first weekly summary.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <Card key={report.id} className="relative group">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => deleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-base">{report.title || "Weekly Report"}</CardTitle>
                      <CardDescription>
                        {new Date(report.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap text-sm font-mono bg-muted/50 p-4 rounded-lg overflow-x-auto">
                          {report.content}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border rounded-lg p-4">
        <h4 className="font-semibold mb-3">Report Configuration</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">AI Provider</span>
            <span className="text-sm font-medium">OpenAI GPT-4</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Data Sources</span>
            <span className="text-sm font-medium">
              {config?.notionDatabases?.tasks ? "Notion Tasks" : "Not configured"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Report Format</span>
            <span className="text-sm font-medium">Markdown</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Storage</span>
            <span className="text-sm font-medium">Local (Browser)</span>
          </div>
        </div>
      </div>
    </div>
  )

  // Don't show full section if no reports
  if (reports.length === 0) {
    return (
      <div className="border rounded-lg p-4 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <h3 className="font-semibold text-sm">Weekly Reports</h3>
              <p className="text-xs text-muted-foreground">Generate AI-powered project summaries</p>
            </div>
          </div>
          <Button size="sm" onClick={generateReport} disabled={generating || !config?.notionDatabases?.tasks}>
            {generating ? "Generating..." : "Generate Report"}
          </Button>
        </div>
        {error && (
          <div className="mt-3 p-3 border border-red-500 rounded-lg bg-red-500/10">
            <p className="text-xs text-red-500">{error}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <PageSection
      title="Weekly Reports"
      description="Generate comprehensive weekly summaries with AI"
      icon="📊"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
    />
  )
}
