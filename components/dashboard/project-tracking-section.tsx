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
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { PageSection } from "./page-section"
import { useProjectConfig } from "@/lib/project-config"

interface Task {
  id: string
  title: string
  description: string | null
  assignee: string | null
  status: string
  dueDate: string | null
  priority: string | null
  tags: string[]
  url: string
}

export function OneTimeTasksSection() {
  const config = useProjectConfig()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee: "",
    dueDate: "",
    priority: "",
    status: "",
    tags: ""
  })

  // Status columns for Kanban
  const statusColumns = [
    { value: "To Do", label: "To Do", color: "bg-slate-100 text-slate-700 border-slate-300" },
    { value: "In Progress", label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-300" },
    { value: "Review", label: "Review", color: "bg-purple-100 text-purple-700 border-purple-300" },
    { value: "Done", label: "Done", color: "bg-green-100 text-green-700 border-green-300" },
  ]

  // Priority colors
  const getPriorityColor = (priority: string | null) => {
    if (!priority) return "bg-gray-100 text-gray-600"
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-300"
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-300"
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "low":
        return "bg-blue-100 text-blue-600 border-blue-300"
      default:
        return "bg-gray-100 text-gray-600 border-gray-300"
    }
  }

  // Get status color
  const getStatusColor = (status: string) => {
    const column = statusColumns.find(col => col.value === status)
    return column?.color || "bg-gray-100 text-gray-600 border-gray-300"
  }

  // Filter tasks by status
  const filteredTasks = selectedStatus
    ? tasks.filter(task => task.status === selectedStatus)
    : tasks

  // Group tasks by status for Kanban
  const tasksByStatus = statusColumns.reduce((acc, column) => {
    acc[column.value] = tasks.filter(task => task.status === column.value)
    return acc
  }, {} as Record<string, Task[]>)

  const fetchTasks = async () => {
    if (!config?.notionDatabases?.tasks) {
      setError("Tasks database not configured")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/notion/tasks?databaseId=${config?.notionDatabases.tasks}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tasks")
      }

      setTasks(data.tasks)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (config?.notionDatabases?.tasks) {
      fetchTasks()
    }
  }, [config?.notionDatabases?.tasks])

  const handleCreateTask = async () => {
    if (!formData.title || !config?.notionDatabases?.tasks) return

    try {
      const tagsArray = formData.tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const response = await fetch("/api/notion/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          databaseId: config?.notionDatabases.tasks,
          title: formData.title,
          description: formData.description || undefined,
          assignee: formData.assignee || undefined,
          status: formData.status || undefined,
          dueDate: formData.dueDate || undefined,
          priority: formData.priority || undefined,
          tags: tagsArray,
        }),
      })

      if (response.ok) {
        setOpen(false)
        setFormData({
          title: "",
          description: "",
          assignee: "",
          dueDate: "",
          priority: "",
          status: "",
          tags: ""
        })
        await fetchTasks()
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to create task")
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Get active tasks (To Do + In Progress) for quick view
  const activeTasks = tasks.filter(t => t.status === "To Do" || t.status === "In Progress")

  const getActiveTaskColor = (status: string) => {
    return status === "In Progress"
      ? "bg-blue-50 border-blue-200 text-blue-900"
      : "bg-slate-50 border-slate-200 text-slate-900"
  }

  const keyMetrics = activeTasks.length > 0 ? (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground mb-2">
        {activeTasks.length} active task{activeTasks.length !== 1 ? 's' : ''}
      </div>
      {activeTasks.slice(0, 5).map((task) => (
        <div key={task.id} className={`p-2 rounded-lg border ${getActiveTaskColor(task.status)}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-xs truncate">{task.title}</div>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground">{task.status}</span>
                {task.assignee && (
                  <span className="text-[10px] text-muted-foreground">👤 {task.assignee}</span>
                )}
                {task.dueDate && (
                  <span className="text-[10px] text-muted-foreground">📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            {task.priority && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            )}
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
      <p className="text-xs text-muted-foreground">No active tasks</p>
    </div>
  )

  const detailedContent = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">One-Time Tasks from Notion</h4>
          <div className="flex gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!config?.notionDatabases?.tasks}>
                  New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Create New One-Time Task</DialogTitle>
                  <DialogDescription>
                    Add a new one-time task to your Notion database.
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
                    <Label htmlFor="assignee">Assignee</Label>
                    <Input
                      id="assignee"
                      placeholder="e.g., John Doe"
                      value={formData.assignee}
                      onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">Due Date</Label>
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
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Select priority (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="Review">Review</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      placeholder="ex: frontend, bug, urgent"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
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
              {config?.notionDatabases?.tasks
                ? "No tasks available. Click 'New Task' to create your first task."
                : "Tasks database not configured. Configure it in project settings."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={selectedStatus === null ? "default" : "outline"}
                onClick={() => setSelectedStatus(null)}
              >
                All ({tasks.length})
              </Button>
              {statusColumns.map((column) => (
                <Button
                  key={column.value}
                  size="sm"
                  variant={selectedStatus === column.value ? "default" : "outline"}
                  onClick={() => setSelectedStatus(column.value)}
                  className={selectedStatus === column.value ? column.color : ""}
                >
                  {column.label} ({tasksByStatus[column.value]?.length || 0})
                </Button>
              ))}
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {statusColumns.map((column) => (
                <div key={column.value} className="space-y-3">
                  <div className={`p-2 rounded-lg border ${column.color} font-semibold text-sm text-center`}>
                    {column.label} ({tasksByStatus[column.value]?.length || 0})
                  </div>
                  <div className="space-y-3 min-h-[200px]">
                    {tasksByStatus[column.value]?.map((task) => (
                      <Card key={task.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <CardTitle className="text-sm font-semibold">{task.title}</CardTitle>

                            {task.description && (
                              <p className="text-xs text-muted-foreground">{task.description}</p>
                            )}

                            {(task.assignee || task.dueDate) && (
                              <CardDescription className="text-xs space-y-1">
                                {task.assignee && <div>👤 {task.assignee}</div>}
                                {task.dueDate && (
                                  <div>📅 {new Date(task.dueDate).toLocaleDateString()}</div>
                                )}
                              </CardDescription>
                            )}

                            <div className="flex flex-wrap gap-1.5">
                              {task.priority && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getPriorityColor(task.priority)}`}
                                >
                                  {task.priority}
                                </Badge>
                              )}
                            </div>

                            {task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {task.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <PageSection
      title="One-Time Tasks"
      description="Track one-time tasks and projects from Notion with filters and tags"
      icon="✅"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
    />
  )
}