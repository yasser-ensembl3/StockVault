"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { PageSection } from "./page-section"
import { useProjectConfig } from "@/lib/project-config"

interface Milestone {
  id: string
  title: string
  dueDate: string
  description?: string
  percentage?: number
}

export function OverviewSection() {
  const config = useProjectConfig()
  const [description, setDescription] = useState("")
  const [vision, setVision] = useState("")
  const [milestones, setMilestones] = useState<Milestone[]>([])

  const [editingDescription, setEditingDescription] = useState(false)
  const [editingVision, setEditingVision] = useState(false)
  const [tempDescription, setTempDescription] = useState("")
  const [tempVision, setTempVision] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const [isAddingMilestone, setIsAddingMilestone] = useState(false)
  const [isEditingMilestone, setIsEditingMilestone] = useState(false)
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null)
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    dueDate: "",
    description: "",
    percentage: "",
  })

  // Charger les données depuis Notion au changement de projet
  useEffect(() => {
    if (config?.projectPageId) {
      fetchOverview()
    }
    if (config?.notionDatabases?.milestones) {
      fetchMilestones()
    }
  }, [config?.projectPageId, config?.notionDatabases?.milestones])

  const fetchOverview = async () => {
    if (!config?.projectPageId) return

    try {
      const response = await fetch(`/api/notion/project-overview?projectPageId=${config?.projectPageId}`)
      if (response.ok) {
        const data = await response.json()
        setDescription(data.description || "")
        setVision(data.vision || "")
      }
    } catch (error) {
      console.error("Error fetching overview:", error)
    }
  }

  const fetchMilestones = async () => {
    if (!config?.notionDatabases?.milestones) return

    try {
      const response = await fetch(`/api/notion/milestones?databaseId=${config?.notionDatabases.milestones}`)
      if (response.ok) {
        const data = await response.json()
        setMilestones(data.milestones || [])
      }
    } catch (error) {
      console.error("Error fetching milestones:", error)
    }
  }

  const handleEditDescription = () => {
    setTempDescription(description)
    setEditingDescription(true)
  }

  const handleSaveDescription = async () => {
    if (!config?.projectPageId) {
      setDescription(tempDescription)
      setEditingDescription(false)
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/notion/project-overview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectPageId: config?.projectPageId,
          description: tempDescription,
        }),
      })

      if (response.ok) {
        setDescription(tempDescription)
        setEditingDescription(false)
      } else {
        console.error("Failed to save description")
      }
    } catch (error) {
      console.error("Error saving description:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditVision = () => {
    setTempVision(vision)
    setEditingVision(true)
  }

  const handleSaveVision = async () => {
    if (!config?.projectPageId) {
      setVision(tempVision)
      setEditingVision(false)
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/notion/project-overview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectPageId: config?.projectPageId,
          vision: tempVision,
        }),
      })

      if (response.ok) {
        setVision(tempVision)
        setEditingVision(false)
      } else {
        console.error("Failed to save vision")
      }
    } catch (error) {
      console.error("Error saving vision:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddMilestone = () => {
    setNewMilestone({
      title: "",
      dueDate: "",
      description: "",
      percentage: "",
    })
    setIsAddingMilestone(true)
  }

  const handleSaveMilestone = async () => {
    if (!newMilestone.title.trim()) return

    if (!config?.notionDatabases?.milestones) {
      // Fallback to local state if no Notion database
      const milestone: Milestone = {
        id: Date.now().toString(),
        title: newMilestone.title,
        dueDate: newMilestone.dueDate,
        description: newMilestone.description,
        percentage: parseInt(newMilestone.percentage) || 0,
      }
      setMilestones([...milestones, milestone])
      setIsAddingMilestone(false)
      return
    }

    setIsSaving(true)
    try {
      const percentageValue = newMilestone.percentage.trim() === "" ? 0 : parseInt(newMilestone.percentage)
      console.log("[OverviewSection] Creating milestone with percentage:", percentageValue)

      const response = await fetch("/api/notion/milestones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          databaseId: config?.notionDatabases.milestones,
          title: newMilestone.title,
          dueDate: newMilestone.dueDate,
          description: newMilestone.description,
          percentage: percentageValue,
        }),
      })

      if (response.ok) {
        setIsAddingMilestone(false)
        // Recharger les milestones
        await fetchMilestones()
      } else {
        const errorData = await response.json()
        console.error("Failed to create milestone:", errorData)
        alert(`Failed to create milestone: ${errorData.error}\n\nDetails: ${JSON.stringify(errorData.details, null, 2)}`)
      }
    } catch (error) {
      console.error("Error creating milestone:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestoneId(milestone.id)
    setNewMilestone({
      title: milestone.title,
      dueDate: milestone.dueDate || "",
      description: milestone.description || "",
      percentage: milestone.percentage?.toString() || "",
    })
    setIsEditingMilestone(true)
  }

  const handleUpdateMilestone = async () => {
    if (!newMilestone.title.trim() || !editingMilestoneId) return

    if (!config?.notionDatabases?.milestones) {
      // Fallback to local state
      setMilestones(milestones.map(m =>
        m.id === editingMilestoneId
          ? { ...m, title: newMilestone.title, dueDate: newMilestone.dueDate, description: newMilestone.description, percentage: parseInt(newMilestone.percentage) || 0 }
          : m
      ))
      setIsEditingMilestone(false)
      setEditingMilestoneId(null)
      return
    }

    setIsSaving(true)
    try {
      const percentageValue = newMilestone.percentage.trim() === "" ? 0 : parseInt(newMilestone.percentage)
      console.log("[OverviewSection] Updating milestone with percentage:", percentageValue)

      const response = await fetch("/api/notion/milestones", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          milestoneId: editingMilestoneId,
          title: newMilestone.title,
          dueDate: newMilestone.dueDate,
          description: newMilestone.description,
          percentage: percentageValue,
        }),
      })

      if (response.ok) {
        setIsEditingMilestone(false)
        setEditingMilestoneId(null)
        await fetchMilestones()
      } else {
        console.error("Failed to update milestone")
      }
    } catch (error) {
      console.error("Error updating milestone:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm("Are you sure you want to delete this milestone?")) return

    if (!config?.notionDatabases?.milestones) {
      // Fallback to local state
      setMilestones(milestones.filter(m => m.id !== milestoneId))
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/notion/milestones?milestoneId=${milestoneId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchMilestones()
      } else {
        console.error("Failed to delete milestone")
      }
    } catch (error) {
      console.error("Error deleting milestone:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const detailedContent = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Project Description</h4>
          {!editingDescription ? (
            <Button size="sm" variant="outline" onClick={handleEditDescription}>
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditingDescription(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveDescription} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>
        <div className="p-4 border rounded-lg">
          {editingDescription ? (
            <textarea
              className="w-full min-h-[100px] bg-transparent text-sm resize-none focus:outline-none"
              value={tempDescription}
              onChange={(e) => setTempDescription(e.target.value)}
              placeholder="Enter project description..."
              autoFocus
            />
          ) : description ? (
            <p className="text-sm">{description}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No project description available. Add a description to help team members understand the project goals and context.
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Vision</h4>
          {!editingVision ? (
            <Button size="sm" variant="outline" onClick={handleEditVision}>
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditingVision(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveVision} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </div>
        <div className="p-4 border rounded-lg">
          {editingVision ? (
            <textarea
              className="w-full min-h-[100px] bg-transparent text-sm resize-none focus:outline-none"
              value={tempVision}
              onChange={(e) => setTempVision(e.target.value)}
              placeholder="Enter project vision..."
              autoFocus
            />
          ) : vision ? (
            <p className="text-sm">{vision}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No vision statement defined. Define your project vision to align team efforts toward common objectives.
            </p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Milestones</h4>
          <Button size="sm" onClick={handleAddMilestone}>Add Milestone</Button>
        </div>
        {milestones.length === 0 ? (
          <div className="p-8 border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              No milestones created yet. Milestones help track major project achievements and deadlines.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Click &ldquo;Add Milestone&rdquo; to create your first project milestone.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {milestones.map((milestone) => (
              <Card key={milestone.id}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium text-sm flex-1">{milestone.title}</h5>
                      <div className="flex items-center gap-2">
                        {milestone.percentage !== undefined && (
                          <Badge variant="secondary">{milestone.percentage}%</Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditMilestone(milestone)}
                          className="h-7 px-2"
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteMilestone(milestone.id)}
                          className="h-7 px-2 text-destructive hover:text-destructive"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    {milestone.description && (
                      <p className="text-xs text-muted-foreground whitespace-pre-line">{milestone.description}</p>
                    )}
                    {milestone.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(milestone.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <PageSection
        title="Overview"
        description="High-level summary of your project status and activity"
        icon="📊"
        detailedContent={detailedContent}
      />

      <Dialog open={isAddingMilestone} onOpenChange={setIsAddingMilestone}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Milestone</DialogTitle>
            <DialogDescription>
              Create a new milestone for your project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="milestone-title">Name</Label>
              <Input
                id="milestone-title"
                placeholder="Milestone name"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-percentage">Completion (%)</Label>
              <Input
                id="milestone-percentage"
                type="text"
                placeholder="0-100"
                value={newMilestone.percentage}
                onChange={(e) => {
                  const value = e.target.value
                  // Permettre seulement les chiffres
                  if (value === "" || /^\d+$/.test(value)) {
                    const num = parseInt(value) || 0
                    if (num >= 0 && num <= 100) {
                      setNewMilestone({ ...newMilestone, percentage: value })
                    }
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-description">Description</Label>
              <Textarea
                id="milestone-description"
                placeholder="Milestone description (supports multiple lines, bullet points, etc.)"
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                className="min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone-date">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newMilestone.dueDate ? (
                      format(new Date(newMilestone.dueDate), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newMilestone.dueDate ? new Date(newMilestone.dueDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setNewMilestone({
                          ...newMilestone,
                          dueDate: format(date, "yyyy-MM-dd")
                        })
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddingMilestone(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveMilestone} disabled={isSaving || !newMilestone.title.trim()}>
              {isSaving ? "Creating..." : "Create Milestone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditingMilestone} onOpenChange={setIsEditingMilestone}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Milestone</DialogTitle>
            <DialogDescription>
              Update milestone information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-milestone-title">Name</Label>
              <Input
                id="edit-milestone-title"
                placeholder="Milestone name"
                value={newMilestone.title}
                onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-milestone-percentage">Completion (%)</Label>
              <Input
                id="edit-milestone-percentage"
                type="text"
                placeholder="0-100"
                value={newMilestone.percentage}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "" || /^\d+$/.test(value)) {
                    const num = parseInt(value) || 0
                    if (num >= 0 && num <= 100) {
                      setNewMilestone({ ...newMilestone, percentage: value })
                    }
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-milestone-description">Description</Label>
              <Textarea
                id="edit-milestone-description"
                placeholder="Milestone description (supports multiple lines, bullet points, etc.)"
                value={newMilestone.description}
                onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                className="min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-milestone-date">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newMilestone.dueDate ? (
                      format(new Date(newMilestone.dueDate), "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newMilestone.dueDate ? new Date(newMilestone.dueDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setNewMilestone({
                          ...newMilestone,
                          dueDate: format(date, "yyyy-MM-dd")
                        })
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditingMilestone(false)
                setEditingMilestoneId(null)
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateMilestone} disabled={isSaving || !newMilestone.title.trim()}>
              {isSaving ? "Updating..." : "Update Milestone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
