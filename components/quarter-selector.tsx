"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Quarter {
  id: string
  name: string
}

interface QuarterSelectorProps {
  quarters: Quarter[]
  selected: string
  onSelect: (value: string) => void
}

export function QuarterSelector({ quarters, selected, onSelect }: QuarterSelectorProps) {
  if (quarters.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading quarters...
      </div>
    )
  }

  return (
    <Select value={selected} onValueChange={onSelect}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select quarter" />
      </SelectTrigger>
      <SelectContent>
        {quarters.map((quarter) => (
          <SelectItem key={quarter.id} value={quarter.name}>
            {quarter.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
