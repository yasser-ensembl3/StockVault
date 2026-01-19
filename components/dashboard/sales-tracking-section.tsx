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
} from "recharts"

interface SalesRecord {
  id: string
  url: string
  Period: string | null
  "Gross Sales": number | null
  "Net Sales": number | null
  "Total Sales": number | null
  Discounts: number | null
  Returns: number | null
  Taxes: number | null
  Shipping: number | null
  "Paid Orders": number | null
  "Orders Fulfilled": number | null
  "Average Order Value": number | null
  "Avg Order Value": number | null
  "Returning Customer Rate": number | null
}

interface OrderRecord {
  id: string
  url: string
  createdTime: string
  [key: string]: string | number | null
}

type MetricKey = "Total Sales" | "Net Sales" | "Paid Orders" | "Average Order Value" | "Returning Customer Rate"

const METRIC_CONFIGS: Record<MetricKey, { label: string; format: (v: number) => string; color: string }> = {
  "Total Sales": { label: "Total Sales", format: (v) => `$${v.toLocaleString()}`, color: "#10b981" },
  "Net Sales": { label: "Net Sales", format: (v) => `$${v.toLocaleString()}`, color: "#3b82f6" },
  "Paid Orders": { label: "Orders", format: (v) => v.toLocaleString(), color: "#8b5cf6" },
  "Average Order Value": { label: "AOV", format: (v) => `$${v.toFixed(2)}`, color: "#f59e0b" },
  "Returning Customer Rate": { label: "Return Rate", format: (v) => `${v.toFixed(1)}%`, color: "#ec4899" },
}

export function SalesTrackingSection() {
  const config = useProjectConfig()
  const [records, setRecords] = useState<SalesRecord[]>([])
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("Total Sales")
  const [showAllOrders, setShowAllOrders] = useState(false)

  const fetchSalesData = async () => {
    if (!config?.notionDatabases?.salesTracking) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `/api/notion/shopify?type=sales&databaseId=${config.notionDatabases.salesTracking}`
      )
      if (response.ok) {
        const data = await response.json()
        setRecords(data.records || [])
      } else {
        console.error("Failed to fetch sales data from Notion")
      }
    } catch (error) {
      console.error("Error fetching sales data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    if (!config?.notionDatabases?.orders) {
      return
    }

    setOrdersLoading(true)
    try {
      const response = await fetch(
        `/api/notion/sales?databaseId=${config.notionDatabases.orders}`
      )
      if (response.ok) {
        const data = await response.json()
        // Sort orders by date descending (most recent first)
        const sortedOrders = (data.orders || []).sort((a: OrderRecord, b: OrderRecord) => {
          const dateA = a["Date"] ? new Date(a["Date"] as string).getTime() : 0
          const dateB = b["Date"] ? new Date(b["Date"] as string).getTime() : 0
          return dateB - dateA
        })
        setOrders(sortedOrders)
      } else {
        console.error("Failed to fetch orders from Notion")
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setOrdersLoading(false)
    }
  }

  useEffect(() => {
    if (config?.notionDatabases?.salesTracking) {
      fetchSalesData()
    }
    if (config?.notionDatabases?.orders) {
      fetchOrders()
    }
  }, [config?.notionDatabases?.salesTracking, config?.notionDatabases?.orders])

  // Get most recent record for summary
  const latestRecord = records.length > 0 ? records[0] : null

  // Get value for a metric (handle both property names for AOV)
  const getMetricValue = (record: SalesRecord, metric: MetricKey): number => {
    if (metric === "Average Order Value") {
      return (record["Average Order Value"] ?? record["Avg Order Value"] ?? 0) as number
    }
    return (record[metric] ?? 0) as number
  }

  // Prepare chart data (reverse for chronological order)
  const chartData = [...records].reverse().map((record) => ({
    period: record.Period || "Unknown",
    value: getMetricValue(record, selectedMetric),
    url: record.url,
  }))

  const keyMetrics = latestRecord ? (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {(Object.keys(METRIC_CONFIGS) as MetricKey[]).map((metric) => {
        const config = METRIC_CONFIGS[metric]
        const value = getMetricValue(latestRecord, metric)
        const isSelected = selectedMetric === metric

        return (
          <button
            key={metric}
            onClick={() => setSelectedMetric(metric)}
            className={`text-center p-3 rounded-lg transition-all cursor-pointer hover:shadow-md ${
              isSelected
                ? "bg-emerald-600 border-emerald-700 ring-2 ring-emerald-400"
                : "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950 dark:border-emerald-800 dark:hover:bg-emerald-900"
            } border`}
          >
            <div className={`text-xl font-bold ${isSelected ? "text-white" : "text-emerald-700 dark:text-emerald-300"}`}>
              {config.format(value)}
            </div>
            <div className={`text-xs ${isSelected ? "text-emerald-100" : "text-emerald-600 dark:text-emerald-400"}`}>
              {config.label}
            </div>
            <div className={`text-[10px] ${isSelected ? "text-emerald-200" : "text-muted-foreground"}`}>
              {latestRecord.Period}
            </div>
          </button>
        )
      })}
    </div>
  ) : (
    <div className="text-center p-6 rounded-lg bg-muted/50 border border-dashed">
      <p className="text-sm text-muted-foreground">No sales data yet. Configure your Sales Tracking database.</p>
    </div>
  )

  const detailedContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">Sales Trend</h4>
          <span className="text-xs text-muted-foreground">({records.length} periods)</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchSalesData}
          disabled={loading || !config?.notionDatabases?.salesTracking}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {!config?.notionDatabases?.salesTracking ? (
        <div className="p-8 border rounded-lg text-center border-dashed bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Sales Tracking database not configured.
          </p>
        </div>
      ) : loading ? (
        <div className="p-8 border rounded-lg text-center">
          <p className="text-sm text-muted-foreground">Loading sales data...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="p-8 border rounded-lg text-center border-dashed">
          <p className="text-sm text-muted-foreground">No sales data available</p>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          {/* Selected metric display */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h5 className="text-lg font-semibold">{METRIC_CONFIGS[selectedMetric].label}</h5>
              <p className="text-xs text-muted-foreground">Click a card above to switch metrics</p>
            </div>
            {latestRecord && (
              <div className="text-right">
                <p className="text-3xl font-bold text-emerald-600">
                  {METRIC_CONFIGS[selectedMetric].format(getMetricValue(latestRecord, selectedMetric))}
                </p>
                <p className="text-xs text-muted-foreground">Latest: {latestRecord.Period}</p>
              </div>
            )}
          </div>

          {/* Chart */}
          <div className="h-80 w-full">
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
                  formatter={(value: number) => [METRIC_CONFIGS[selectedMetric].format(value), METRIC_CONFIGS[selectedMetric].label]}
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

          {/* Breakdown for latest period */}
          {latestRecord && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Gross Sales</p>
                <p className="font-semibold">${(latestRecord["Gross Sales"] ?? 0).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Discounts</p>
                <p className="font-semibold text-red-500">-${(latestRecord.Discounts ?? 0).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Returns</p>
                <p className="font-semibold text-red-500">-${(latestRecord.Returns ?? 0).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">Shipping + Tax</p>
                <p className="font-semibold">${((latestRecord.Shipping ?? 0) + (latestRecord.Taxes ?? 0)).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Orders section */}
          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-sm font-semibold">Orders</h5>
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchOrders}
                disabled={ordersLoading || !config?.notionDatabases?.orders}
                className="h-6 px-2 text-xs"
              >
                {ordersLoading ? "..." : "Refresh"}
              </Button>
            </div>

            {!config?.notionDatabases?.orders ? (
              <div className="p-4 border rounded-lg text-center border-dashed bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  Orders database not configured. Add NEXT_PUBLIC_NOTION_DB_ORDERS to your environment.
                </p>
              </div>
            ) : ordersLoading ? (
              <div className="p-4 border rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-4 border rounded-lg text-center border-dashed">
                <p className="text-xs text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <>
                {/* Key metrics summary */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg text-center">
                    <p className="text-lg font-bold text-emerald-600">{orders.length}</p>
                    <p className="text-[10px] text-muted-foreground">Orders</p>
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                    <p className="text-lg font-bold text-blue-600">
                      {orders.reduce((sum, o) => sum + (Number(o["Items"]) || 0), 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Items</p>
                  </div>
                  <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded-lg text-center">
                    <p className="text-lg font-bold text-purple-600">
                      ${orders.reduce((sum, o) => sum + (Number(o["Total $"]) || 0), 0).toFixed(0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Revenue</p>
                  </div>
                  <div className="p-2 bg-amber-50 dark:bg-amber-950 rounded-lg text-center">
                    <p className="text-lg font-bold text-amber-600">
                      {orders.filter(o => o["Fulfillment"] === "Fulfilled").length}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Fulfilled</p>
                  </div>
                </div>

                {/* Orders list */}
                <div className="space-y-1">
                  {(showAllOrders ? orders : orders.slice(0, 5)).map((order) => (
                    <a
                      key={order.id}
                      href={order.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-xs p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <span className="font-mono text-muted-foreground w-14 flex-shrink-0">
                        {order["Order"] || "-"}
                      </span>
                      <span className="font-medium flex-1 truncate">
                        {order["Customer"] || "-"}
                      </span>
                      <span className="text-muted-foreground w-20 text-right flex-shrink-0">
                        {order["Date"] || "-"}
                      </span>
                      <span className="text-blue-600 w-8 text-center flex-shrink-0">
                        {order["Items"] || 0}x
                      </span>
                      <span className="font-semibold text-emerald-600 w-12 text-right flex-shrink-0">
                        ${Number(order["Total $"] || 0).toFixed(0)}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                        order["Payment"] === "Paid"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                          : order["Payment"] === "Refunded"
                          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}>
                        {order["Payment"] || "Pending"}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${
                        order["Fulfillment"] === "Fulfilled"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                      }`}>
                        {order["Fulfillment"] || "Unfulfilled"}
                      </span>
                    </a>
                  ))}
                </div>

                {/* Show all button */}
                {orders.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllOrders(!showAllOrders)}
                    className="w-full mt-2 text-xs"
                  >
                    {showAllOrders ? "Show less" : `Show all ${orders.length} orders`}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <PageSection
      title="Sales"
      description="Shopify sales and order tracking"
      icon="💰"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
    />
  )
}
