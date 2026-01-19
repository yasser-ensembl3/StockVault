"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PageSectionProps {
  title: string
  description: string
  icon: string
  keyMetrics?: React.ReactNode
  detailedContent?: React.ReactNode
}

export function PageSection({
  title,
  description,
  icon,
  keyMetrics,
  detailedContent,
}: PageSectionProps) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <span className="text-xl sm:text-2xl flex-shrink-0">{icon}</span>
          <div className="min-w-0">
            <CardTitle className="text-base sm:text-xl">{title}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
          </div>
        </div>
        {keyMetrics && (
          <div className="mt-3 sm:mt-4">
            {keyMetrics}
          </div>
        )}
      </CardHeader>
      {detailedContent && (
        <CardContent className="p-4 sm:p-6 pt-0">
          {detailedContent}
        </CardContent>
      )}
    </Card>
  )
}
