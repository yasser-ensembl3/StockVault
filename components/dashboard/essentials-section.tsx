"use client"

import { useState, useEffect } from "react"
import { useProjectConfig } from "@/lib/project-config"
import { PageSection } from "./page-section"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, ExternalLink, Calendar, Sparkles } from "lucide-react"

interface Essential {
  id: string
  title: string
  description: string | null
  type: string
  priority: string | null
  url: string | null
  dateAdded: string
  notionUrl: string
}

const ESSENTIAL_TYPES = [
  { value: "Tool", label: "🛠️ Tool", emoji: "🛠️" },
  { value: "Milestone", label: "🎯 Milestone", emoji: "🎯" },
  { value: "Strategy", label: "📊 Strategy", emoji: "📊" },
  { value: "Resource", label: "📚 Resource", emoji: "📚" },
  { value: "Partnership", label: "🤝 Partnership", emoji: "🤝" },
  { value: "Achievement", label: "🏆 Achievement", emoji: "🏆" },
]

const PRIORITIES = [
  { value: "Critical", label: "Critical", color: "bg-red-100 text-red-700 border-red-300" },
  { value: "High", label: "High", color: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "Medium", label: "Medium", color: "bg-yellow-100 text-yellow-700 border-yellow-300" },
]

export function EssentialsSection() {
  const config = useProjectConfig()
  const [essentials, setEssentials] = useState<Essential[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form state
  const [newTitle, setNewTitle] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newType, setNewType] = useState("Resource")
  const [newPriority, setNewPriority] = useState("Medium")
  const [newUrl, setNewUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const essentialsDbId = config.notionDatabases.essentials

  useEffect(() => {
    if (essentialsDbId) {
      fetchEssentials()
    } else {
      setLoading(false)
    }
  }, [essentialsDbId])

  const fetchEssentials = async () => {
    if (!essentialsDbId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/notion/essentials?databaseId=${essentialsDbId}`)
      const data = await response.json()

      if (data.essentials) {
        setEssentials(data.essentials)
      }
    } catch (error) {
      console.error("[Essentials Section] Error fetching essentials:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEssential = async () => {
    if (!essentialsDbId || !newTitle.trim()) return

    try {
      setSubmitting(true)
      const response = await fetch("/api/notion/essentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          databaseId: essentialsDbId,
          title: newTitle,
          description: newDescription,
          type: newType,
          priority: newPriority,
          url: newUrl || undefined,
        }),
      })

      if (response.ok) {
        // Reset form
        setNewTitle("")
        setNewDescription("")
        setNewType("Resource")
        setNewPriority("Medium")
        setNewUrl("")
        setDialogOpen(false)

        // Refresh list
        fetchEssentials()
      } else {
        const error = await response.json()
        console.error("[Essentials Section] Error creating essential:", error)
        alert(`Failed to create essential: ${error.error}`)
      }
    } catch (error) {
      console.error("[Essentials Section] Error:", error)
      alert("Failed to create essential")
    } finally {
      setSubmitting(false)
    }
  }

  const getTypeConfig = (type: string) => {
    return ESSENTIAL_TYPES.find(t => t.value === type) || ESSENTIAL_TYPES[3]
  }

  const getPriorityConfig = (priority: string | null) => {
    return PRIORITIES.find(p => p.value === priority) || PRIORITIES[2]
  }

  if (!essentialsDbId) {
    return (
      <PageSection
        icon="⭐"
        title="Essentials"
        description="Configure NEXT_PUBLIC_NOTION_DB_ESSENTIALS to use this section"
      />
    )
  }

  if (loading) {
    return (
      <PageSection
        icon="⭐"
        title="Essentials"
        description="Loading essential items..."
      />
    )
  }

  const keyMetrics = (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-muted-foreground">
        {essentials.length} {essentials.length === 1 ? "item" : "items"}
      </span>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Essential
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Add Essential Item
            </DialogTitle>
            <DialogDescription>
              Add a critical tool, milestone, or resource to your project essentials.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Substack Post Creator Tool"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What makes this essential to your project?"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESSENTIAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL (optional)</Label>
              <Input
                id="url"
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddEssential} disabled={submitting || !newTitle.trim()}>
              {submitting ? "Adding..." : "Add Essential"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  const detailedContent = essentials.length === 0 ? (
    <div className="text-center py-12">
      <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground mb-4">
        No essential items yet. Add the most important tools, milestones, and resources for your project.
      </p>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add First Essential
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Add Essential Item
            </DialogTitle>
            <DialogDescription>
              Add a critical tool, milestone, or resource to your project essentials.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title-empty">Title *</Label>
              <Input
                id="title-empty"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Substack Post Creator Tool"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description-empty">Description</Label>
              <Textarea
                id="description-empty"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="What makes this essential to your project?"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type-empty">Type</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger id="type-empty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESSENTIAL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority-empty">Priority</Label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                  <SelectTrigger id="priority-empty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url-empty">URL (optional)</Label>
              <Input
                id="url-empty"
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddEssential} disabled={submitting || !newTitle.trim()}>
              {submitting ? "Adding..." : "Add Essential"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  ) : (
    <div className="space-y-4">
      {essentials.map((essential) => {
        const typeConfig = getTypeConfig(essential.type)
        const priorityConfig = getPriorityConfig(essential.priority)

        return (
          <Card key={essential.id} className="p-6 hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
            <div className="space-y-4">
              {/* Header with Title and Icon */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-3xl flex-shrink-0">{typeConfig.emoji}</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Name</div>
                    <h3 className="text-xl font-bold">{essential.title}</h3>
                  </div>
                </div>
                {essential.url && (
                  <a
                    href={essential.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="font-medium">Open Link</span>
                  </a>
                )}
              </div>

              {/* Description */}
              {essential.description && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</div>
                  <p className="text-base text-foreground leading-relaxed">
                    {essential.description}
                  </p>
                </div>
              )}

              {/* Metadata Row */}
              <div className="flex items-center gap-6 pt-3 border-t">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Type</div>
                  <Badge variant="outline" className="text-sm font-medium">
                    {typeConfig.label}
                  </Badge>
                </div>
                {essential.priority && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Priority</div>
                    <Badge variant="outline" className={`text-sm font-medium ${priorityConfig.color}`}>
                      {essential.priority}
                    </Badge>
                  </div>
                )}
                <div className="ml-auto">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Date Added</div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(essential.dateAdded).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )

  return (
    <PageSection
      icon="⭐"
      title="Essentials"
      description="Most important tools, milestones, and resources for this project"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
    />
  )
}
