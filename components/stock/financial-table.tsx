"use client"

interface FinancialTableProps {
  reports: Record<string, string>[]
  metrics: { key: string; label: string; format?: "currency" | "number" | "percent" }[]
}

function formatValue(value: string | undefined, format?: "currency" | "number" | "percent"): string {
  if (!value || value === "None" || value === "0") return "-"
  const num = parseFloat(value)
  if (isNaN(num)) return value

  if (format === "percent") {
    return `${(num * 100).toFixed(1)}%`
  }

  const abs = Math.abs(num)
  const sign = num < 0 ? "-" : ""

  if (format === "currency" || (!format && abs >= 1e6)) {
    if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`
    if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`
    if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`
    if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(2)}K`
    return `${sign}$${abs.toFixed(2)}`
  }

  return num.toLocaleString()
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short" })
}

export function FinancialTable({ reports, metrics }: FinancialTableProps) {
  if (!reports || reports.length === 0) return null

  return (
    <div className="overflow-x-auto -mx-4 sm:-mx-6">
      <div className="inline-block min-w-full align-middle px-4 sm:px-6">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-4 text-muted-foreground font-medium sticky left-0 bg-card min-w-[160px]">
                Metric
              </th>
              {reports.map((r) => (
                <th
                  key={r.fiscalDateEnding}
                  className="text-right py-2 px-3 text-muted-foreground font-medium min-w-[100px]"
                >
                  {formatDate(r.fiscalDateEnding)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => (
              <tr key={metric.key} className="border-b border-border/50 hover:bg-muted/30">
                <td className="py-2 pr-4 text-muted-foreground sticky left-0 bg-card">
                  {metric.label}
                </td>
                {reports.map((r) => (
                  <td
                    key={r.fiscalDateEnding}
                    className="text-right py-2 px-3 font-mono tabular-nums"
                  >
                    {formatValue(r[metric.key], metric.format)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
