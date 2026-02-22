"use client"

import { Button } from "@/components/ui/button"

interface PeriodToggleProps {
  period: "annual" | "quarterly"
  onChange: (period: "annual" | "quarterly") => void
}

export function PeriodToggle({ period, onChange }: PeriodToggleProps) {
  return (
    <div className="inline-flex rounded-md bg-muted p-1">
      <Button
        variant={period === "annual" ? "default" : "ghost"}
        size="sm"
        className="text-xs h-7 px-3"
        onClick={() => onChange("annual")}
      >
        Annual
      </Button>
      <Button
        variant={period === "quarterly" ? "default" : "ghost"}
        size="sm"
        className="text-xs h-7 px-3"
        onClick={() => onChange("quarterly")}
      >
        Quarterly
      </Button>
    </div>
  )
}
