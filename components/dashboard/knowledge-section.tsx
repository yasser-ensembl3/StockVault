"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageSection } from "./page-section"

export function KnowledgeSection() {
  const keyMetrics = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-muted-foreground">-</div>
        <div className="text-sm text-muted-foreground">Documents</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-muted-foreground">-</div>
        <div className="text-sm text-muted-foreground">Knowledge Areas</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-muted-foreground">-</div>
        <div className="text-sm text-muted-foreground">Last Updated</div>
      </div>
    </div>
  )

  const detailedContent = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Recent Documents</h4>
          <Button size="sm">Create New</Button>
        </div>
        <div className="p-8 border rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            No documents available. Documents will be fetched from Google Drive and Notion.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Connect to Google Drive and Notion to see your knowledge base.
          </p>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3">Knowledge Categories</h4>
        <div className="p-4 border rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            Categories will be automatically organized once documents are loaded.
          </p>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">Create Meeting Notes</Button>
          <Button variant="outline" size="sm">Generate Documentation</Button>
          <Button variant="outline" size="sm">Share Knowledge Base</Button>
          <Button variant="outline" size="sm">Export All Docs</Button>
        </div>
      </div>
    </div>
  )

  return (
    <PageSection
      title="Knowledge Base"
      description="Create clear instructions and context for all collaborators"
      icon="📚"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
    />
  )
}