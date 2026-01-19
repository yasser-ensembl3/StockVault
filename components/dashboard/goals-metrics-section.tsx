"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageSection } from "./page-section"
import { useProjectConfig } from "@/lib/project-config"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface Metric {
  id: string
  type: string
  value: number
  date: string
  url: string
}

export function GoalsMetricsSection() {
  const config = useProjectConfig()
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [loading, setLoading] = useState(false)
  const [isAddMetricOpen, setIsAddMetricOpen] = useState(false)
  const [selectedMetricType, setSelectedMetricType] = useState<string>("")
  const [metricForm, setMetricForm] = useState({
    type: "",
    value: "",
    date: new Date().toISOString().split('T')[0]
  })

  // Fetch metrics from Notion
  const fetchMetrics = async () => {
    if (!config?.notionDatabases?.goals) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/notion/metrics?databaseId=${config?.notionDatabases.goals}`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics || [])
      } else {
        console.error("Failed to fetch goals from Notion")
      }
    } catch (error) {
      console.error("Error fetching goals:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (config?.notionDatabases?.goals) {
      fetchMetrics()
    }
  }, [config?.notionDatabases?.goals])

  // Auto-select first metric type when metrics load
  useEffect(() => {
    if (metrics.length > 0 && !selectedMetricType) {
      const grouped = getGroupedMetrics()
      const types = Object.keys(grouped)
      if (types.length > 0) {
        setSelectedMetricType(types[0])
      }
    }
  }, [metrics, selectedMetricType])

  // Normalize metric type (lowercase, no accents, no special chars)
  const normalizeMetricType = (text: string): string => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s]/g, "") // Remove special chars except spaces
      .trim()
  }

  const resetForm = () => {
    setMetricForm({
      type: "",
      value: "",
      date: new Date().toISOString().split('T')[0]
    })
  }

  const handleAddMetric = () => {
    resetForm()
    setIsAddMetricOpen(true)
  }

  const handleSaveMetric = async () => {
    if (!metricForm.type || !metricForm.value) {
      alert("Type and value are required")
      return
    }

    if (!config?.notionDatabases?.goals) {
      alert("Goals database not configured in Project Settings")
      return
    }

    // Normalize the metric type before sending
    const normalizedType = normalizeMetricType(metricForm.type)

    setLoading(true)
    try {
      const response = await fetch("/api/notion/metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          databaseId: config?.notionDatabases.goals,
          type: normalizedType,
          value: metricForm.value,
          date: metricForm.date,
        }),
      })

      if (response.ok) {
        setIsAddMetricOpen(false)
        resetForm()
        await fetchMetrics()
      } else {
        const errorData = await response.json()
        alert(`Failed to create goal: ${errorData.error}`)
      }
    } catch (error: any) {
      console.error("Error creating goal:", error)
      alert(`Error creating goal: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Group metrics by type
  const getGroupedMetrics = () => {
    if (!metrics || metrics.length === 0) return {}

    const groupedByType = metrics.reduce((acc, metric) => {
      if (!acc[metric.type]) {
        acc[metric.type] = []
      }
      acc[metric.type].push(metric)
      return acc
    }, {} as Record<string, Metric[]>)

    // Sort each group by date (most recent first)
    Object.keys(groupedByType).forEach(type => {
      groupedByType[type].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    })

    return groupedByType
  }

  // Get the latest metric for each type
  const getLatestMetrics = () => {
    const grouped = getGroupedMetrics()
    return Object.values(grouped).map((metricsList: Metric[]) => metricsList[0])
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Get latest metrics for display
  const latestMetrics = getLatestMetrics()

  const keyMetrics = latestMetrics.length > 0 ? (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {latestMetrics.map((metric) => {
        const isSelected = selectedMetricType === metric.type
        return (
          <button
            key={metric.id}
            onClick={() => setSelectedMetricType(metric.type)}
            className={`text-center p-3 rounded-lg transition-all cursor-pointer hover:shadow-md ${
              isSelected
                ? 'bg-green-600 border-green-700 ring-2 ring-green-400'
                : 'bg-green-50 border-green-200 hover:bg-green-100'
            } border`}
          >
            <div className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-green-700'}`}>
              {metric.value}
            </div>
            <div className={`text-xs mb-1 ${isSelected ? 'text-green-100' : 'text-green-600'}`}>
              {metric.type}
            </div>
            <div className={`text-[10px] ${isSelected ? 'text-green-200' : 'text-muted-foreground'}`}>
              {formatDate(metric.date)}
            </div>
          </button>
        )
      })}
    </div>
  ) : (
    <div className="text-center p-6 rounded-lg bg-muted/50 border border-dashed">
      <p className="text-sm text-muted-foreground">No goals yet. Add your first goal to get started.</p>
    </div>
  )

  const detailedContent = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Goals Chart</h4>
            <span className="text-xs text-muted-foreground">
              ({getLatestMetrics().length} types)
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchMetrics}
              disabled={loading || !config?.notionDatabases?.goals}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              size="sm"
              onClick={handleAddMetric}
              disabled={!config?.notionDatabases?.goals}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Goal
            </Button>
          </div>
        </div>

        <div className="space-y-6">
            {!config?.notionDatabases?.goals ? (
              <div className="p-8 border rounded-lg text-center border-dashed bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Goals database not configured. Configure it in Project Settings.
                </p>
              </div>
            ) : loading ? (
              <div className="p-8 border rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Loading goals...</p>
              </div>
            ) : (() => {
              const groupedMetrics = getGroupedMetrics()
              const metricTypes = Object.keys(groupedMetrics)

              if (metricTypes.length === 0) {
                return (
                  <div className="p-8 border rounded-lg text-center border-dashed">
                    <p className="text-sm text-muted-foreground mb-2">
                      No goals yet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Click &ldquo;Add Goal&rdquo; to create your first goal
                    </p>
                  </div>
                )
              }

              // Get selected metric data
              const currentType = selectedMetricType || metricTypes[0]
              const metricsForType = groupedMetrics[currentType] || []
              const latestValue = metricsForType.length > 0 ? metricsForType[0].value : 0

              // Prepare chart data (reverse to show oldest to newest)
              const chartData = [...metricsForType]
                .reverse()
                .map((metric) => ({
                  date: new Date(metric.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  }),
                  value: metric.value,
                  fullDate: metric.date,
                }))

              return (
                <div className="border rounded-lg p-4">
                  {/* Selected metric display */}
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h5 className="text-lg font-semibold capitalize">{currentType}</h5>
                      <p className="text-xs text-muted-foreground">Click on a card above to switch goals</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-green-700">{latestValue}</p>
                      {metricsForType.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          as of {formatDate(metricsForType[0].date)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#16a34a"
                          strokeWidth={2}
                          dot={{ fill: '#16a34a', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Data table */}
                  <div className="mt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Recent Entries</p>
                    <div className="space-y-1">
                      {metricsForType.slice(0, 5).map((metric) => (
                        <div
                          key={metric.id}
                          className="flex items-center justify-between text-xs p-2 rounded bg-muted/30"
                        >
                          <span className="text-muted-foreground">{formatDate(metric.date)}</span>
                          <span className="font-semibold">{metric.value}</span>
                          <a
                            href={metric.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            View →
                          </a>
                        </div>
                      ))}
                    </div>
                    {metricsForType.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        + {metricsForType.length - 5} more entries
                      </p>
                    )}
                  </div>
                </div>
              )
            })()}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <PageSection
        title="Goals"
        description="Track output metrics and key results"
        icon="🎯"
        keyMetrics={keyMetrics}
        detailedContent={detailedContent}
      />

      {/* Add Metric Dialog */}
      <Dialog open={isAddMetricOpen} onOpenChange={setIsAddMetricOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Goal</DialogTitle>
            <DialogDescription>
              Add a new goal value
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="metric-type">Type *</Label>
              <Input
                id="metric-type"
                placeholder="e.g., Number of sales, Subscribers, Amazon reviews"
                value={metricForm.type}
                onChange={(e) => setMetricForm({ ...metricForm, type: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Will be normalized to lowercase without accents or special characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metric-value">Nombre *</Label>
              <Input
                id="metric-value"
                type="number"
                placeholder="e.g., 150"
                value={metricForm.value}
                onChange={(e) => setMetricForm({ ...metricForm, value: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metric-date">Date *</Label>
              <Input
                id="metric-date"
                type="date"
                value={metricForm.date}
                onChange={(e) => setMetricForm({ ...metricForm, date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => {
              setIsAddMetricOpen(false)
              resetForm()
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveMetric} disabled={!metricForm.type || !metricForm.value}>
              Add Goal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
