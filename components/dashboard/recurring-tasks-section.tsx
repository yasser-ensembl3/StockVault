"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, RepeatIcon } from "lucide-react"
import { format } from "date-fns"
import { PageSection } from "./page-section"
import { useProjectConfig } from "@/lib/project-config"

interface RecurringTask {
  id: string
  title: string
  description: string | null
  assignee: string | null
  status: string
  dueDate: string | null
  frequency: string | null
  lastCompleted: string | null
  url: string
}

export function RecurringTasksSection() {
  const config = useProjectConfig()
  const [tasks, setTasks] = useState<RecurringTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee: "",
    dueDate: "",
    status: "",
    frequency: ""
  })

  // Frequency categories
  const frequencyOptions = [
    { value: "Daily", label: "Daily", color: "bg-blue-100 text-blue-700 border-blue-300", emoji: "📅" },
    { value: "Weekly", label: "Weekly", color: "bg-green-100 text-green-700 border-green-300", emoji: "📆" },
    { value: "Monthly", label: "Monthly", color: "bg-purple-100 text-purple-700 border-purple-300", emoji: "🗓️" },
    { value: "Quarterly", label: "Quarterly", color: "bg-orange-100 text-orange-700 border-orange-300", emoji: "📊" },
    { value: "Custom", label: "Custom", color: "bg-gray-100 text-gray-700 border-gray-300", emoji: "⚙️" },
  ]

  // Get frequency color
  const getFrequencyColor = (frequency: string | null) => {
    if (!frequency) return "bg-gray-100 text-gray-600 border-gray-300"
    const option = frequencyOptions.find(opt => opt.value === frequency)
    return option?.color || "bg-gray-100 text-gray-600 border-gray-300"
  }

  // Get frequency emoji
  const getFrequencyEmoji = (frequency: string | null) => {
    if (!frequency) return "⚙️"
    const option = frequencyOptions.find(opt => opt.value === frequency)
    return option?.emoji || "⚙️"
  }

  // Filter tasks by frequency
  const filteredTasks = selectedFrequency
    ? tasks.filter(task => task.frequency === selectedFrequency)
    : tasks

  // Group tasks by frequency
  const tasksByFrequency = frequencyOptions.reduce((acc, option) => {
    acc[option.value] = tasks.filter(task => task.frequency === option.value)
    return acc
  }, {} as Record<string, RecurringTask[]>)

  const fetchTasks = async () => {
    if (!config?.notionDatabases?.recurringTasks) {
      setError("Recurring tasks database not configured")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/notion/recurring-tasks?databaseId=${config?.notionDatabases.recurringTasks}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch recurring tasks")
      }

      setTasks(data.tasks)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (config?.notionDatabases?.recurringTasks) {
      fetchTasks()
    }
  }, [config?.notionDatabases?.recurringTasks])

  const handleCreateTask = async () => {
    if (!formData.title || !config?.notionDatabases?.recurringTasks) return

    try {
      const response = await fetch("/api/notion/recurring-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          databaseId: config?.notionDatabases.recurringTasks,
          title: formData.title,
          description: formData.description || undefined,
          assignee: formData.assignee || undefined,
          status: formData.status || undefined,
          dueDate: formData.dueDate || undefined,
          frequency: formData.frequency || undefined,
        }),
      })

      if (response.ok) {
        setOpen(false)
        setFormData({
          title: "",
          description: "",
          assignee: "",
          dueDate: "",
          status: "",
          frequency: ""
        })
        await fetchTasks()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create recurring task")
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Get active recurring tasks for quick view
  const activeTasks = tasks.filter(t => t.status !== "Done" && t.status !== "Completed")

  const keyMetrics = activeTasks.length > 0 ? (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground mb-2">
        {activeTasks.length} active recurring task{activeTasks.length !== 1 ? 's' : ''}
      </div>
      {activeTasks.slice(0, 5).map((task) => (
        <div key={task.id} className="p-2 rounded-lg bg-purple-50 border border-purple-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-xs text-purple-900 truncate">
                {getFrequencyEmoji(task.frequency)} {task.title}
              </div>
              <div className="flex gap-2 mt-1 flex-wrap">
                {task.frequency && (
                  <span className="text-[10px] text-purple-600">
                    🔄 {frequencyOptions.find(f => f.value === task.frequency)?.label || task.frequency}
                  </span>
                )}
                {task.assignee && (
                  <span className="text-[10px] text-purple-600">👤 {task.assignee}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      {activeTasks.length > 5 && (
        <div className="text-[10px] text-muted-foreground text-center">
          +{activeTasks.length - 5} more
        </div>
      )}
    </div>
  ) : (
    <div className="text-center p-4 rounded-lg bg-muted/50 border border-dashed">
      <p className="text-xs text-muted-foreground">No active recurring tasks</p>
    </div>
  )

  const detailedContent = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Recurring Tasks from Notion</h4>
          <div className="flex gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!config?.notionDatabases?.recurringTasks}>
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create Recurring Task</DialogTitle>
                  <DialogDescription>
                    Add a new recurring task to your Notion database.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Name *</Label>
                    <Input
                      id="title"
                      placeholder="Task name"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      placeholder="Task description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="frequency">Frequency *</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                    >
                      <SelectTrigger id="frequency">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.emoji} {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="assignee">Assignee</Label>
                    <Input
                      id="assignee"
                      placeholder="e.g., John Doe"
                      value={formData.assignee}
                      onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">Next Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.dueDate ? (
                            format(new Date(formData.dueDate), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.dueDate ? new Date(formData.dueDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setFormData({
                                ...formData,
                                dueDate: format(date, "yyyy-MM-dd")
                              })
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="To Do">To Do</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleCreateTask} disabled={!formData.title}>
                    Create Task
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button size="sm" onClick={fetchTasks} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 border border-red-500 rounded-lg bg-red-500/10 mb-4">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="p-8 border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-8 border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              {config?.notionDatabases?.recurringTasks
                ? "No recurring tasks available. Click 'New Task' to create your first task."
                : "Recurring tasks database not configured. Configure it in project settings."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Frequency Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={selectedFrequency === null ? "default" : "outline"}
                onClick={() => setSelectedFrequency(null)}
              >
                All ({tasks.length})
              </Button>
              {frequencyOptions.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={selectedFrequency === option.value ? "default" : "outline"}
                  onClick={() => setSelectedFrequency(option.value)}
                  className={selectedFrequency === option.value ? option.color : ""}
                >
                  {option.emoji} {option.label} ({tasksByFrequency[option.value]?.length || 0})
                </Button>
              ))}
            </div>

            {/* Tasks Grid grouped by Frequency */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {frequencyOptions.map((option) => {
                const frequencyTasks = tasksByFrequency[option.value] || []
                if (selectedFrequency && selectedFrequency !== option.value) return null
                if (!selectedFrequency && frequencyTasks.length === 0) return null

                return (
                  <div key={option.value} className="space-y-3">
                    <div className={`p-2 rounded-lg border ${option.color} font-semibold text-sm text-center`}>
                      {option.emoji} {option.label} ({frequencyTasks.length})
                    </div>
                    <div className="space-y-3 min-h-[150px]">
                      {frequencyTasks.map((task) => (
                        <Card key={task.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <CardTitle className="text-sm font-semibold">{task.title}</CardTitle>

                              {task.description && (
                                <p className="text-xs text-muted-foreground">{task.description}</p>
                              )}

                              {(task.assignee || task.dueDate || task.lastCompleted) && (
                                <CardDescription className="text-xs space-y-1">
                                  {task.assignee && <div>👤 {task.assignee}</div>}
                                  {task.dueDate && (
                                    <div>📅 Next: {new Date(task.dueDate).toLocaleDateString()}</div>
                                  )}
                                  {task.lastCompleted && (
                                    <div className="text-muted-foreground">
                                      ✓ Last: {new Date(task.lastCompleted).toLocaleDateString()}
                                    </div>
                                  )}
                                </CardDescription>
                              )}

                              {task.status && (
                                <div className="mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {task.status}
                                  </Badge>
                                </div>
                              )}

                              <a
                                href={task.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-blue-500 hover:underline block mt-1"
                              >
                                View in Notion →
                              </a>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <PageSection
      title="Recurring Tasks"
      description="Track recurring tasks from Notion (daily, weekly, monthly, quarterly)"
      icon="🔄"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
    />
  )
}
