"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Company {
  name: string
  folderId: string
  insightsFolderId: string | null
  hasFinancial: boolean
  hasStrategic: boolean
}

interface CompanyCardProps {
  company: Company
  quarter: string
}

export function CompanyCard({ company, quarter }: CompanyCardProps) {
  return (
    <Link href={`/company/${encodeURIComponent(company.name)}?quarter=${encodeURIComponent(quarter)}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{company.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {company.hasFinancial && (
              <Badge variant="default">
                Financial
              </Badge>
            )}
            {company.hasStrategic && (
              <Badge variant="outline">
                Strategic
              </Badge>
            )}
            {!company.hasFinancial && !company.hasStrategic && (
              <Badge variant="secondary">
                No insights yet
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
