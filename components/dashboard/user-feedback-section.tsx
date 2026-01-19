"use client"

import { useState, useEffect } from "react"
import { PageSection } from "./page-section"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useProjectConfig } from "@/lib/project-config"
import { ChevronDown, ChevronUp } from "lucide-react"

interface Feedback {
  id: string
  title: string
  date: string
  feedback: string
  userName: string
  url?: string
}

export function UserFeedbackSection() {
  const config = useProjectConfig()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    date: new Date().toISOString().split('T')[0],
    feedback: "",
    userName: ""
  })
  const [detailsOpen, setDetailsOpen] = useState(true)

  const fetchFeedbacks = async () => {
    if (!config?.notionDatabases?.feedback) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/notion/feedback?databaseId=${config?.notionDatabases.feedback}`)
      if (response.ok) {
        const data = await response.json()
        setFeedbacks(data.feedbacks || [])
      } else {
        console.error("Failed to fetch feedbacks from Notion")
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (config?.notionDatabases?.feedback) {
      fetchFeedbacks()
    }
  }, [config?.notionDatabases?.feedback])

  const handleOpenAdd = () => {
    setEditingId(null)
    setFormData({ title: "", date: new Date().toISOString().split('T')[0], feedback: "", userName: "" })
    setOpen(true)
  }

  const handleOpenEdit = (feedback: Feedback) => {
    setEditingId(feedback.id)
    setFormData({
      title: feedback.title,
      date: feedback.date,
      feedback: feedback.feedback,
      userName: feedback.userName
    })
    setOpen(true)
  }

  const handleSave = async () => {
    if (!formData.title || !formData.feedback || !formData.userName) {
      alert("Title, Feedback, and User Name are required")
      return
    }

    if (!config?.notionDatabases?.feedback) {
      alert("Feedback database not configured in Project Settings")
      return
    }

    setLoading(true)
    try {
      if (editingId) {
        // Update existing feedback
        const response = await fetch("/api/notion/feedback", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pageId: editingId,
            title: formData.title,
            date: formData.date,
            feedback: formData.feedback,
            userName: formData.userName,
          }),
        })

        if (response.ok) {
          setOpen(false)
          setFormData({ title: "", date: new Date().toISOString().split('T')[0], feedback: "", userName: "" })
          setEditingId(null)
          await fetchFeedbacks()
        } else {
          const errorData = await response.json()
          alert(`Failed to update feedback: ${errorData.error}`)
        }
      } else {
        // Create new feedback
        const response = await fetch("/api/notion/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            databaseId: config?.notionDatabases.feedback,
            title: formData.title,
            date: formData.date,
            feedback: formData.feedback,
            userName: formData.userName,
          }),
        })

        if (response.ok) {
          setOpen(false)
          setFormData({ title: "", date: new Date().toISOString().split('T')[0], feedback: "", userName: "" })
          setEditingId(null)
          await fetchFeedbacks()
        } else {
          const errorData = await response.json()
          alert(`Failed to create feedback: ${errorData.error}`)
        }
      }
    } catch (error: any) {
      console.error("Error saving feedback:", error)
      alert(`Error saving feedback: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (feedbackId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce feedback ?")) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/notion/feedback?pageId=${feedbackId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchFeedbacks()
      } else {
        const errorData = await response.json()
        alert(`Failed to delete feedback: ${errorData.error}`)
      }
    } catch (error: any) {
      console.error("Error deleting feedback:", error)
      alert(`Error deleting feedback: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const totalCount = feedbacks.length
  const thisWeekCount = feedbacks.filter(f => {
    const feedbackDate = new Date(f.date)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    return feedbackDate >= oneWeekAgo
  }).length
  const thisMonthCount = feedbacks.filter(f => {
    const feedbackDate = new Date(f.date)
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    return feedbackDate >= oneMonthAgo
  }).length

  const keyMetrics = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
        <div className="text-2xl font-bold text-blue-700">{totalCount}</div>
        <div className="text-sm text-blue-600">Total Feedbacks</div>
      </div>
      <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
        <div className="text-2xl font-bold text-green-700">{thisWeekCount}</div>
        <div className="text-sm text-green-600">This Week</div>
      </div>
      <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-200">
        <div className="text-2xl font-bold text-purple-700">{thisMonthCount}</div>
        <div className="text-sm text-purple-600">This Month</div>
      </div>
    </div>
  )

  const detailedContent = (
    <div className="space-y-6">
      <div className="border rounded-lg">
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => setDetailsOpen(!detailsOpen)}
        >
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">Feedback Items</h4>
            <span className="text-xs text-muted-foreground">
              ({feedbacks.length} feedbacks)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                fetchFeedbacks()
              }}
              disabled={loading || !config?.notionDatabases?.feedback}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleOpenAdd()
              }}
              disabled={!config?.notionDatabases?.feedback}
            >
              Add Feedback
            </Button>
            {detailsOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>

        {detailsOpen && (
          <div className="p-4 pt-0 space-y-4">
            {!config?.notionDatabases?.feedback ? (
              <div className="p-8 border rounded-lg text-center border-dashed bg-muted/30">
                <p className="text-sm text-muted-foreground">
                  Feedback database not configured. Configure it in Project Settings.
                </p>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="p-8 border rounded-lg text-center border-dashed">
                <p className="text-sm text-muted-foreground">
                  No feedback recorded yet. Add feedback items to track user responses.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Click &ldquo;Add Feedback&rdquo; to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {feedbacks.map((feedback) => (
                  <Card key={feedback.id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-semibold text-base">{feedback.title}</h5>
                              <Badge variant="outline" className="text-xs">
                                {new Date(feedback.date).toLocaleDateString()}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{feedback.feedback}</p>
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">By:</span> {feedback.userName}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button size="sm" variant="outline" onClick={() => handleOpenEdit(feedback)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(feedback.id)}>
                              Delete
                            </Button>
                            {feedback.url && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={feedback.url} target="_blank" rel="noopener noreferrer">
                                  View in Notion
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  // Don't show full section if no feedbacks
  if (feedbacks.length === 0) {
    return (
      <>
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <h3 className="font-semibold text-sm">User Feedback</h3>
                <p className="text-xs text-muted-foreground">Track and manage user feedback</p>
              </div>
            </div>
            <Button size="sm" onClick={handleOpenAdd} disabled={!config?.notionDatabases?.feedback}>
              Add Feedback
            </Button>
          </div>
        </div>

        {/* Add/Edit Feedback Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Feedback" : "Add New Feedback"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update feedback information below." : "Add new user feedback to track."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Feature request for dark mode"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="feedback">Feedback *</Label>
                <Input
                  id="feedback"
                  placeholder="Describe the feedback..."
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="userName">User Name *</Label>
                <Input
                  id="userName"
                  placeholder="e.g., John Doe"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : (editingId ? "Save Changes" : "Add Feedback")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <PageSection
        title="User Feedback"
        description="Monitor and respond to user feedback and requests"
        icon="💬"
        keyMetrics={keyMetrics}
        detailedContent={detailedContent}
      />

      {/* Add/Edit Feedback Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Feedback" : "Add New Feedback"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update feedback information below." : "Add new user feedback to track."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Feature request for dark mode"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="feedback">Feedback *</Label>
              <Input
                id="feedback"
                placeholder="Describe the feedback..."
                value={formData.feedback}
                onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="userName">User Name *</Label>
              <Input
                id="userName"
                placeholder="e.g., John Doe"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : (editingId ? "Save Changes" : "Add Feedback")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
