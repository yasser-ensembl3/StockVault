"use client"

import { useState, useEffect } from "react"
import { PageSection } from "./page-section"
import { useProjectConfig } from "@/lib/project-config"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface AnalyticsRecord {
  id: string
  url: string
  Period: string | null
  Sessions: number | null
  "Conversion Rate": number | null
  "Add to Cart Rate": number | null
  "Checkout Rate": number | null
  "Checkout Reached Rate": number | null
  Direct: number | null
  Google: number | null
  Facebook: number | null
  Twitter: number | null
  LinkedIn: number | null
  Other: number | null
  Desktop: number | null
  Mobile: number | null
  "Top Page": string | null
}

type MetricKey = "Sessions" | "Conversion Rate" | "Add to Cart Rate" | "Checkout Rate"

const METRIC_CONFIGS: Record<MetricKey, { label: string; format: (v: number) => string; color: string }> = {
  Sessions: { label: "Sessions", format: (v) => v.toLocaleString(), color: "#3b82f6" },
  "Conversion Rate": { label: "Conv. Rate", format: (v) => `${v.toFixed(2)}%`, color: "#10b981" },
  "Add to Cart Rate": { label: "Add to Cart", format: (v) => `${v.toFixed(2)}%`, color: "#f59e0b" },
  "Checkout Rate": { label: "Checkout", format: (v) => `${v.toFixed(2)}%`, color: "#8b5cf6" },
}

const TRAFFIC_COLORS: Record<string, string> = {
  Direct: "#3b82f6",
  Google: "#ea4335",
  Facebook: "#1877f2",
  Twitter: "#1da1f2",
  LinkedIn: "#0077b5",
  Other: "#6b7280",
}

const DEVICE_COLORS: Record<string, string> = {
  Desktop: "#8b5cf6",
  Mobile: "#f59e0b",
}

export function WebAnalyticsSection() {
  const config = useProjectConfig()
  const [records, setRecords] = useState<AnalyticsRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("Sessions")

  const fetchAnalyticsData = async () => {
    if (!config?.notionDatabases?.webAnalytics) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `/api/notion/shopify?type=analytics&databaseId=${config.notionDatabases.webAnalytics}`
      )
      if (response.ok) {
        const data = await response.json()
        setRecords(data.records || [])
      } else {
        console.error("Failed to fetch analytics data from Notion")
      }
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (config?.notionDatabases?.webAnalytics) {
      fetchAnalyticsData()
    }
  }, [config?.notionDatabases?.webAnalytics])

  // Get most recent record for summary
  const latestRecord = records.length > 0 ? records[0] : null

  // Prepare chart data (reverse for chronological order)
  const chartData = [...records].reverse().map((record) => ({
    period: record.Period || "Unknown",
    value: record[selectedMetric] ?? 0,
    url: record.url,
  }))

  // Prepare traffic source data for pie chart
  const trafficData = latestRecord
    ? [
        { name: "Direct", value: latestRecord.Direct ?? 0, color: TRAFFIC_COLORS.Direct },
        { name: "Google", value: latestRecord.Google ?? 0, color: TRAFFIC_COLORS.Google },
        { name: "Facebook", value: latestRecord.Facebook ?? 0, color: TRAFFIC_COLORS.Facebook },
        { name: "Twitter", value: latestRecord.Twitter ?? 0, color: TRAFFIC_COLORS.Twitter },
        { name: "LinkedIn", value: latestRecord.LinkedIn ?? 0, color: TRAFFIC_COLORS.LinkedIn },
        { name: "Other", value: latestRecord.Other ?? 0, color: TRAFFIC_COLORS.Other },
      ].filter((item) => item.value > 0)
    : []

  // Prepare device data
  const deviceData = latestRecord
    ? [
        { name: "Desktop", value: latestRecord.Desktop ?? 0, color: DEVICE_COLORS.Desktop },
        { name: "Mobile", value: latestRecord.Mobile ?? 0, color: DEVICE_COLORS.Mobile },
      ].filter((item) => item.value > 0)
    : []

  const totalTraffic = trafficData.reduce((sum, item) => sum + item.value, 0)

  const keyMetrics = latestRecord ? (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {(Object.keys(METRIC_CONFIGS) as MetricKey[]).map((metric) => {
        const config = METRIC_CONFIGS[metric]
        const value = latestRecord[metric] ?? 0
        const isSelected = selectedMetric === metric

        return (
          <button
            key={metric}
            onClick={() => setSelectedMetric(metric)}
            className={`text-center p-3 rounded-lg transition-all cursor-pointer hover:shadow-md ${
              isSelected
                ? "bg-blue-600 border-blue-700 ring-2 ring-blue-400"
                : "bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-950 dark:border-blue-800 dark:hover:bg-blue-900"
            } border`}
          >
            <div className={`text-xl font-bold ${isSelected ? "text-white" : "text-blue-700 dark:text-blue-300"}`}>
              {config.format(value)}
            </div>
            <div className={`text-xs ${isSelected ? "text-blue-100" : "text-blue-600 dark:text-blue-400"}`}>
              {config.label}
            </div>
            <div className={`text-[10px] ${isSelected ? "text-blue-200" : "text-muted-foreground"}`}>
              {latestRecord.Period}
            </div>
          </button>
        )
      })}
    </div>
  ) : (
    <div className="text-center p-6 rounded-lg bg-muted/50 border border-dashed">
      <p className="text-sm text-muted-foreground">No analytics data yet. Configure your Web Analytics database.</p>
    </div>
  )

  const detailedContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">Traffic & Conversion Trend</h4>
          <span className="text-xs text-muted-foreground">({records.length} periods)</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchAnalyticsData}
          disabled={loading || !config?.notionDatabases?.webAnalytics}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {!config?.notionDatabases?.webAnalytics ? (
        <div className="p-8 border rounded-lg text-center border-dashed bg-muted/30">
          <p className="text-sm text-muted-foreground">Web Analytics database not configured.</p>
        </div>
      ) : loading ? (
        <div className="p-8 border rounded-lg text-center">
          <p className="text-sm text-muted-foreground">Loading analytics data...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="p-8 border rounded-lg text-center border-dashed">
          <p className="text-sm text-muted-foreground">No analytics data available</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main trend chart */}
          <div className="border rounded-lg p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h5 className="text-lg font-semibold">{METRIC_CONFIGS[selectedMetric].label}</h5>
                <p className="text-xs text-muted-foreground">Click a card above to switch metrics</p>
              </div>
              {latestRecord && (
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">
                    {METRIC_CONFIGS[selectedMetric].format(latestRecord[selectedMetric] ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Latest: {latestRecord.Period}</p>
                </div>
              )}
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" style={{ fontSize: "12px" }} />
                  <YAxis style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                    }}
                    formatter={(value: number) => [
                      METRIC_CONFIGS[selectedMetric].format(value),
                      METRIC_CONFIGS[selectedMetric].label,
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={METRIC_CONFIGS[selectedMetric].color}
                    strokeWidth={2}
                    dot={{ fill: METRIC_CONFIGS[selectedMetric].color, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Traffic sources and device breakdown */}
          {latestRecord && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Traffic Sources */}
              <div className="border rounded-lg p-4">
                <h5 className="font-semibold mb-3">Traffic Sources</h5>
                <div className="flex items-center gap-4">
                  <div className="h-40 w-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={trafficData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={60}
                        >
                          {trafficData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1">
                    {trafficData.map((source) => (
                      <div key={source.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: source.color }}
                          />
                          <span>{source.name}</span>
                        </div>
                        <span className="font-medium">
                          {source.value} ({((source.value / totalTraffic) * 100).toFixed(0)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Device Breakdown */}
              <div className="border rounded-lg p-4">
                <h5 className="font-semibold mb-3">Device Breakdown</h5>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deviceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" style={{ fontSize: "12px" }} />
                      <YAxis dataKey="name" type="category" style={{ fontSize: "12px" }} width={60} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex justify-center gap-4 text-xs">
                  {deviceData.map((device) => (
                    <div key={device.name} className="flex items-center gap-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: device.color }}
                      />
                      <span>
                        {device.name}: {device.value.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conversion funnel */}
          {latestRecord && (
            <div className="border rounded-lg p-4">
              <h5 className="font-semibold mb-3">Conversion Funnel</h5>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{(latestRecord.Sessions ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Sessions</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {(latestRecord["Add to Cart Rate"] ?? 0).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Add to Cart</p>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {(latestRecord["Checkout Rate"] ?? 0).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Checkout</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {(latestRecord["Conversion Rate"] ?? 0).toFixed(2)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Converted</p>
                </div>
              </div>
            </div>
          )}

          {/* Recent periods table */}
          <div className="border rounded-lg p-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">Recent Periods</p>
            <div className="space-y-1">
              {records.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between text-xs p-2 rounded bg-muted/30"
                >
                  <span className="text-muted-foreground">{record.Period}</span>
                  <span className="font-semibold">
                    {METRIC_CONFIGS[selectedMetric].format(record[selectedMetric] ?? 0)}
                  </span>
                  <a
                    href={record.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <PageSection
      title="Web Analytics"
      description="Traffic, conversion and discoverability signals"
      icon="📊"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
    />
  )
}
