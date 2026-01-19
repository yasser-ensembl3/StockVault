"use client"

import { useState, useEffect } from "react"
import { PageSection } from "./page-section"
import { useProjectConfig } from "@/lib/project-config"
import { Button } from "@/components/ui/button"

interface OrderRecord {
  id: string
  url: string
  createdTime: string
  [key: string]: string | number | null
}

export function OrdersSection() {
  const config = useProjectConfig()
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [showAllUnfulfilled, setShowAllUnfulfilled] = useState(true)
  const [showFulfilled, setShowFulfilled] = useState(false)

  const fetchOrders = async () => {
    if (!config?.notionDatabases?.orders) {
      return
    }

    setLoading(true)
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
      setLoading(false)
    }
  }

  useEffect(() => {
    if (config?.notionDatabases?.orders) {
      fetchOrders()
    }
  }, [config?.notionDatabases?.orders])

  // Filter orders by status
  const unfulfilledOrders = orders.filter(o => o["Fulfillment"] !== "Fulfilled")
  const fulfilledOrders = orders.filter(o => o["Fulfillment"] === "Fulfilled")
  const refundedOrders = orders.filter(o => o["Payment"] === "Refunded")
  const pendingPaymentOrders = orders.filter(o => o["Payment"] !== "Paid" && o["Payment"] !== "Refunded")

  // Calculate totals
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o["Total $"]) || 0), 0)
  const unfulfilledRevenue = unfulfilledOrders.reduce((sum, o) => sum + (Number(o["Total $"]) || 0), 0)

  const keyMetrics = orders.length > 0 ? (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Unfulfilled - Most important, shown first */}
      <div className={`p-3 rounded-lg border ${
        unfulfilledOrders.length > 0
          ? "bg-orange-100 border-orange-300 dark:bg-orange-950 dark:border-orange-800"
          : "bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800"
      }`}>
        <div className={`text-2xl font-bold ${
          unfulfilledOrders.length > 0 ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"
        }`}>
          {unfulfilledOrders.length}
        </div>
        <div className="text-xs text-muted-foreground">Unfulfilled</div>
        {unfulfilledOrders.length > 0 && (
          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            ${unfulfilledRevenue.toFixed(0)} pending
          </div>
        )}
      </div>

      {/* Total Orders */}
      <div className="p-3 rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{orders.length}</div>
        <div className="text-xs text-muted-foreground">Total Orders</div>
      </div>

      {/* Total Revenue */}
      <div className="p-3 rounded-lg border bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800">
        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
          ${totalRevenue.toFixed(0)}
        </div>
        <div className="text-xs text-muted-foreground">Revenue</div>
      </div>

      {/* Refunded / Issues */}
      <div className={`p-3 rounded-lg border ${
        refundedOrders.length > 0
          ? "bg-red-100 border-red-300 dark:bg-red-950 dark:border-red-800"
          : "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-800"
      }`}>
        <div className={`text-2xl font-bold ${
          refundedOrders.length > 0 ? "text-red-600 dark:text-red-400" : "text-gray-400"
        }`}>
          {refundedOrders.length}
        </div>
        <div className="text-xs text-muted-foreground">Refunded</div>
      </div>
    </div>
  ) : (
    <div className="text-center p-4 rounded-lg bg-muted/50 border border-dashed">
      <p className="text-sm text-muted-foreground">No orders yet</p>
    </div>
  )

  const OrderRow = ({ order }: { order: OrderRecord }) => (
    <a
      href={order.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 text-sm p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
    >
      <span className="font-mono text-muted-foreground w-16 flex-shrink-0">
        {order["Order"] || "-"}
      </span>
      <span className="font-medium flex-1 truncate">
        {order["Customer"] || "-"}
      </span>
      <span className="text-muted-foreground w-24 text-right flex-shrink-0 hidden sm:block">
        {order["Date"] || "-"}
      </span>
      <span className="text-blue-600 w-10 text-center flex-shrink-0">
        {order["Items"] || 0}x
      </span>
      <span className="font-semibold text-emerald-600 w-16 text-right flex-shrink-0">
        ${Number(order["Total $"] || 0).toFixed(0)}
      </span>
      <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
        order["Payment"] === "Paid"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
          : order["Payment"] === "Refunded"
          ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
      }`}>
        {order["Payment"] || "Pending"}
      </span>
      <span className={`text-xs px-2 py-1 rounded flex-shrink-0 ${
        order["Fulfillment"] === "Fulfilled"
          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
          : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
      }`}>
        {order["Fulfillment"] || "Unfulfilled"}
      </span>
    </a>
  )

  const detailedContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Orders Overview</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchOrders}
          disabled={loading || !config?.notionDatabases?.orders}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {!config?.notionDatabases?.orders ? (
        <div className="p-8 border rounded-lg text-center border-dashed bg-muted/30">
          <p className="text-sm text-muted-foreground">
            Orders database not configured. Add NEXT_PUBLIC_NOTION_DB_ORDERS to your environment.
          </p>
        </div>
      ) : loading ? (
        <div className="p-8 border rounded-lg text-center">
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-8 border rounded-lg text-center border-dashed">
          <p className="text-sm text-muted-foreground">No orders yet</p>
        </div>
      ) : (
        <>
          {/* Unfulfilled Orders Section - Primary focus */}
          <div className="border rounded-lg overflow-hidden">
            <div className={`px-4 py-3 flex items-center justify-between ${
              unfulfilledOrders.length > 0
                ? "bg-orange-100 dark:bg-orange-950 border-b border-orange-200 dark:border-orange-800"
                : "bg-emerald-100 dark:bg-emerald-950 border-b border-emerald-200 dark:border-emerald-800"
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{unfulfilledOrders.length > 0 ? "⚠️" : "✅"}</span>
                <span className="font-semibold">
                  {unfulfilledOrders.length > 0
                    ? `${unfulfilledOrders.length} Unfulfilled Order${unfulfilledOrders.length > 1 ? "s" : ""}`
                    : "All Orders Fulfilled"}
                </span>
              </div>
              {unfulfilledOrders.length > 0 && (
                <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                  ${unfulfilledRevenue.toFixed(0)} pending
                </span>
              )}
            </div>

            {unfulfilledOrders.length > 0 && (
              <div className="p-3 space-y-2">
                {(showAllUnfulfilled ? unfulfilledOrders : unfulfilledOrders.slice(0, 5)).map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
                {unfulfilledOrders.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllUnfulfilled(!showAllUnfulfilled)}
                    className="w-full text-xs"
                  >
                    {showAllUnfulfilled ? "Show less" : `Show all ${unfulfilledOrders.length} unfulfilled orders`}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Fulfilled Orders Section - Secondary */}
          {fulfilledOrders.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setShowFulfilled(!showFulfilled)}
                className="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">📦</span>
                  <span className="font-semibold">{fulfilledOrders.length} Fulfilled Orders</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {showFulfilled ? "▲ Hide" : "▼ Show"}
                </span>
              </button>

              {showFulfilled && (
                <div className="p-3 space-y-2 border-t">
                  {fulfilledOrders.map((order) => (
                    <OrderRow key={order.id} order={order} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Total Items</p>
              <p className="text-lg font-bold">
                {orders.reduce((sum, o) => sum + (Number(o["Items"]) || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Avg Order</p>
              <p className="text-lg font-bold">
                ${(totalRevenue / orders.length).toFixed(0)}
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Fulfillment Rate</p>
              <p className="text-lg font-bold">
                {((fulfilledOrders.length / orders.length) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Pending Payment</p>
              <p className="text-lg font-bold text-yellow-600">
                {pendingPaymentOrders.length}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )

  return (
    <PageSection
      title="Orders"
      description="Track order fulfillment status"
      icon="📦"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
    />
  )
}
