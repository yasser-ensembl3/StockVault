"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageSection } from "./page-section"
import { useProjectConfig } from "@/lib/project-config"
import { ExternalLink } from "lucide-react"
import { DocumentPreviewModal, canPreviewUrl } from "./document-preview-modal"

interface Link {
  id: string
  title: string
  description: string
  url: string
  type: string
  category?: string
}

const LINK_TYPES = [
  { value: "notion", label: "Notion", icon: "📓", color: "bg-gray-100 text-gray-700" },
  { value: "drive", label: "Google Drive", icon: "📁", color: "bg-blue-100 text-blue-700" },
  { value: "github", label: "GitHub", icon: "💻", color: "bg-purple-100 text-purple-700" },
  { value: "slack", label: "Slack", icon: "💬", color: "bg-pink-100 text-pink-700" },
  { value: "figma", label: "Figma", icon: "🎨", color: "bg-purple-100 text-purple-700" },
  { value: "jira", label: "Jira", icon: "📋", color: "bg-blue-100 text-blue-700" },
  { value: "confluence", label: "Confluence", icon: "📖", color: "bg-blue-100 text-blue-700" },
  { value: "trello", label: "Trello", icon: "📊", color: "bg-blue-100 text-blue-700" },
  { value: "asana", label: "Asana", icon: "✅", color: "bg-red-100 text-red-700" },
  { value: "miro", label: "Miro", icon: "🖼️", color: "bg-yellow-100 text-yellow-700" },
  { value: "docs", label: "Documentation", icon: "📄", color: "bg-green-100 text-green-700" },
  { value: "api", label: "API", icon: "🔌", color: "bg-orange-100 text-orange-700" },
  { value: "other", label: "Other", icon: "🔗", color: "bg-gray-100 text-gray-700" },
]

const CATEGORIES = [
  { value: "database", label: "📊 Databases", emoji: "📊", notionLabel: "Databases" },
  { value: "tool", label: "🛠️ Tools", emoji: "🛠️", notionLabel: "Tools" },
  { value: "website", label: "🌐 Apps & Websites", emoji: "🌐", notionLabel: "Apps & Websites" },
  { value: "social", label: "📱 Social Media", emoji: "📱", notionLabel: "Social Media" },
  { value: "document", label: "📄 Documentation", emoji: "📄", notionLabel: "Documentation" },
  { value: "other", label: "🔗 Other Links", emoji: "🔗", notionLabel: "Other Links" },
]

export function GuidesDocsSection() {
  const config = useProjectConfig()
  const [customLinks, setCustomLinks] = useState<Link[]>([])
  const [documentsLoaded, setDocumentsLoaded] = useState(false)
  const [syncAttempted, setSyncAttempted] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingConfigType, setEditingConfigType] = useState<"drive" | "notion" | "github" | null>(null)
  const [selectedTab, setSelectedTab] = useState<string>("all")
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
    type: "other",
    category: "other"
  })

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLink, setPreviewLink] = useState<Link | null>(null)

  // Helper function to get link type info
  const getLinkTypeInfo = (type: string) => {
    const linkType = LINK_TYPES.find(t => t.label === type || t.value === type)
    return linkType || { icon: "🔗", color: "bg-gray-100 text-gray-700", label: type }
  }

  // Helper function to extract domain from URL
  const getDomainFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      return urlObj.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  // Load custom links from Notion documents database
  useEffect(() => {
    if (config?.notionDatabases?.documents) {
      setDocumentsLoaded(false)
      setSyncAttempted(false)
      fetchDocuments()
    }
  }, [config?.notionDatabases?.documents])

  // Sync configured links to documents database on initialization
  useEffect(() => {
    const syncConfiguredLinks = async () => {
      // Only sync once after documents have been loaded
      if (!config?.notionDatabases?.documents || !documentsLoaded || syncAttempted) return

      console.log("[GuidesDocsSection] Starting sync check with", customLinks.length, "existing documents")

      // Check if there are any configured links to sync
      const hasDrive = config?.googleDrive?.folderId && config?.googleDrive.folderId.trim() !== ""
      const hasGitHub = config?.github?.owner && config?.github.owner.trim() !== "" &&
                       config?.github?.repo && config?.github.repo.trim() !== ""

      if (!hasDrive && !hasGitHub) {
        setSyncAttempted(true)
        return
      }

      try {
        let needsRefresh = false

        // Check and sync Google Drive link
        if (hasDrive && config?.googleDrive) {
          // Check by URL to avoid duplicates
          const driveUrl = `https://drive.google.com/drive/folders/${config?.googleDrive.folderId}`
          const existingDriveDoc = customLinks.find(link =>
            link.url === driveUrl || link.type === "Google Drive"
          )
          if (!existingDriveDoc) {
            console.log("[GuidesDocsSection] Syncing Drive link to documents database")
            await fetch("/api/notion/documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                databaseId: config?.notionDatabases.documents,
                title: config?.googleDrive.folderName || "Google Drive Folder",
                url: driveUrl,
                description: "Main project documentation",
                type: "Google Drive",
              }),
            })
            needsRefresh = true
          } else {
            console.log("[GuidesDocsSection] Drive link already exists")
          }
        }

        // Check and sync GitHub repository link
        if (hasGitHub && config?.github) {
          // Check by URL to avoid duplicates
          const githubUrl = `https://github.com/${config?.github.owner}/${config?.github.repo}`
          const existingGitHubDoc = customLinks.find(link =>
            link.url === githubUrl || link.type === "GitHub"
          )
          if (!existingGitHubDoc) {
            console.log("[GuidesDocsSection] Syncing GitHub link to documents database")
            await fetch("/api/notion/documents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                databaseId: config?.notionDatabases.documents,
                title: "GitHub Repository",
                url: githubUrl,
                description: "Source code repository",
                type: "GitHub",
              }),
            })
            needsRefresh = true
          } else {
            console.log("[GuidesDocsSection] GitHub link already exists")
          }
        }

        // Mark sync as attempted to prevent running again
        setSyncAttempted(true)

        // Refresh documents only if we created new ones
        if (needsRefresh) {
          console.log("[GuidesDocsSection] Refreshing documents after sync")
          await fetchDocuments()
        }
      } catch (error) {
        console.error("[GuidesDocsSection] Error syncing configured links:", error)
        setSyncAttempted(true) // Mark as attempted even on error
      }
    }

    // Run sync when documents are first loaded
    if (documentsLoaded && !syncAttempted) {
      syncConfiguredLinks()
    }
  }, [documentsLoaded, syncAttempted, config?.notionDatabases?.documents, config?.googleDrive?.folderId, config?.github?.owner, config?.github?.repo, customLinks])

  const fetchDocuments = async () => {
    if (!config?.notionDatabases?.documents) return

    try {
      const response = await fetch(`/api/notion/documents?databaseId=${config?.notionDatabases.documents}`)
      if (response.ok) {
        const data = await response.json()
        const documents = data.documents || []

        console.log(`[GuidesDocsSection] Loaded ${documents.length} documents from Notion`)
        documents.forEach((doc: Link) => {
          console.log(`  - "${doc.title}" → Category: ${doc.category}`)
        })

        // Remove duplicates by URL (keep the first one)
        const uniqueDocuments: Link[] = []
        const seenUrls = new Set<string>()

        for (const doc of documents) {
          if (!seenUrls.has(doc.url)) {
            seenUrls.add(doc.url)
            uniqueDocuments.push(doc)
          } else {
            // Delete duplicate from Notion
            console.log("[GuidesDocsSection] Removing duplicate document:", doc.title, doc.url)
            try {
              await fetch(`/api/notion/documents?documentId=${doc.id}`, {
                method: "DELETE",
              })
            } catch (err) {
              console.error("[GuidesDocsSection] Error removing duplicate:", err)
            }
          }
        }

        setCustomLinks(uniqueDocuments)
        setDocumentsLoaded(true)
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
      setDocumentsLoaded(true) // Mark as loaded even on error to avoid blocking
    }
  }

  const handleOpenAdd = () => {
    setEditingId(null)
    setEditingConfigType(null)
    setFormData({ title: "", url: "", description: "", type: "other", category: "other" })
    setOpen(true)
  }

  const handleOpenEdit = (link: Link) => {
    setEditingId(link.id)
    setEditingConfigType(null)
    const typeValue = LINK_TYPES.find(t => t.label === link.type)?.value || "other"
    setFormData({
      title: link.title,
      url: link.url,
      description: link.description,
      type: typeValue,
      category: link.category || "other"
    })
    setOpen(true)
  }

  const handleEditConfigLink = (type: "drive" | "notion" | "github") => {
    setEditingId(null)
    setEditingConfigType(type)

    if (type === "drive") {
      setFormData({
        title: config?.googleDrive?.folderName || "Google Drive Folder",
        url: config?.googleDrive?.folderId || "",
        description: "Main project documentation",
        type: "drive",
        category: "document"
      })
    } else if (type === "github") {
      setFormData({
        title: "GitHub Repository",
        url: `${config?.github?.owner || ""}/${config?.github?.repo || ""}`,
        description: "Source code repository",
        type: "github",
        category: "tool"
      })
    }

    setOpen(true)
  }

  const handleSaveLink = async () => {
    if (!formData.title || !formData.url || !config) return

    // Config links (Drive, GitHub) cannot be edited in new architecture, they come from .env
    // This function now only handles custom link documents

    // Map category internal value to Notion-friendly label
    const getCategoryNotionLabel = (value: string): string => {
      const cat = CATEGORIES.find(c => c.value === value)
      return cat?.notionLabel || "Other Links"
    }

    // Handle custom links with Notion sync
    if (!config?.notionDatabases?.documents) {
      // Fallback to local state if no Notion database
      const linkData = {
        title: formData.title,
        description: formData.description,
        url: formData.url,
        type: LINK_TYPES.find(t => t.value === formData.type)?.label || "Other",
        category: formData.category
      }

      if (editingId) {
        setCustomLinks(customLinks.map(link =>
          link.id === editingId ? { ...link, ...linkData } : link
        ))
      } else {
        const newLink: Link = {
          id: Date.now().toString(),
          ...linkData
        }
        setCustomLinks([...customLinks, newLink])
      }
      setOpen(false)
      setFormData({ title: "", url: "", description: "", type: "other", category: "other" })
      setEditingId(null)
      return
    }

    // Sync with Notion
    try {
      const typeLabel = LINK_TYPES.find(t => t.value === formData.type)?.label || "Other"
      const categoryLabel = getCategoryNotionLabel(formData.category)

      console.log("[GuidesDocsSection] Saving link with category:", formData.category, "→", categoryLabel)

      if (editingId) {
        // Update existing document
        const response = await fetch("/api/notion/documents", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: editingId,
            title: formData.title,
            url: formData.url,
            description: formData.description,
            type: typeLabel,
            category: categoryLabel,
          }),
        })

        if (response.ok) {
          await fetchDocuments()
        } else {
          console.error("Failed to update document")
        }
      } else {
        // Create new document
        const response = await fetch("/api/notion/documents", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            databaseId: config?.notionDatabases.documents,
            title: formData.title,
            url: formData.url,
            description: formData.description,
            type: typeLabel,
            category: categoryLabel,
          }),
        })

        if (response.ok) {
          await fetchDocuments()
        } else {
          const errorData = await response.json()
          console.error("Failed to create document:", errorData)
          alert(`Failed to create document: ${errorData.error}\n\nDetails: ${JSON.stringify(errorData.details, null, 2)}`)
        }
      }
    } catch (error) {
      console.error("Error saving document:", error)
    }

    setOpen(false)
    setFormData({ title: "", url: "", description: "", type: "other", category: "other" })
    setEditingId(null)
    setEditingConfigType(null)
  }

  const handleViewLink = (link: Link) => {
    if (!link.url || link.url === "Not configured") return

    // Check if URL can be previewed in-app (Notion, Google Docs, Drive)
    if (canPreviewUrl(link.url)) {
      setPreviewLink(link)
      setPreviewOpen(true)
    } else {
      // Open externally for other URLs
      window.open(link.url, "_blank")
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce lien ?")) return

    if (!config?.notionDatabases?.documents) {
      // Fallback to local state
      setCustomLinks(customLinks.filter(link => link.id !== linkId))
      return
    }

    // Sync with Notion
    try {
      const response = await fetch(`/api/notion/documents?documentId=${linkId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchDocuments()
      } else {
        console.error("Failed to delete document")
      }
    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }

  // Config links (Drive, GitHub) are read-only from .env in new architecture
  // No delete functionality needed for config links

  const detailedContent = (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Important Links & References</h4>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleOpenAdd}>Add Link</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>
                  {editingConfigType ? "Edit Configured Link" : editingId ? "Edit Link" : "Add New Link"}
                </DialogTitle>
                <DialogDescription>
                  {editingConfigType
                    ? "Update the configured link information. This will sync with Project Settings."
                    : editingId
                    ? "Update the link information below."
                    : "Add a new link to your project resources. Choose a type and enter the URL."
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                    disabled={!!editingConfigType}
                  >
                    <SelectTrigger id="type">
                      {formData.type ? (
                        <span className="flex items-center gap-2">
                          <span>{LINK_TYPES.find(t => t.value === formData.type)?.icon}</span>
                          <span>{LINK_TYPES.find(t => t.value === formData.type)?.label}</span>
                        </span>
                      ) : (
                        <SelectValue placeholder="Select link type" />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {LINK_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span>{type.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Project Documentation"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">
                    {editingConfigType === "drive" && "Folder ID"}
                    {editingConfigType === "notion" && "Database ID"}
                    {editingConfigType === "github" && "Repository (owner/repo)"}
                    {!editingConfigType && "URL"}
                  </Label>
                  <Input
                    id="url"
                    placeholder={
                      editingConfigType === "drive" ? "1a2b3c4d5e6f..." :
                      editingConfigType === "notion" ? "abc123def456..." :
                      editingConfigType === "github" ? "owner/repo" :
                      "https://..."
                    }
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="Brief description..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSaveLink}>
                  {editingId ? "Save Changes" : "Add Link"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {/* Group all links by category */}
        {(() => {
          // Collect all links (config + custom)
          const allLinks: Link[] = []

          if (config?.googleDrive?.folderId && config?.googleDrive.folderId.trim() !== "") {
            allLinks.push({
              id: "drive-config",
              title: config?.googleDrive?.folderName || "Google Drive",
              description: "Main project documentation",
              url: `https://drive.google.com/drive/folders/${config?.googleDrive?.folderId}`,
              type: "Drive",
              category: "document"
            })
          }

          if (config?.projectPageId) {
            allLinks.push({
              id: "notion-config",
              title: "Project Page",
              description: "Main project Notion page",
              url: `https://notion.so/${config?.projectPageId?.replace(/-/g, "")}`,
              type: "Notion",
              category: "database"
            })
          }

          if (config?.github?.owner && config?.github.owner.trim() !== "" && config?.github?.repo && config?.github.repo.trim() !== "") {
            allLinks.push({
              id: "github-config",
              title: "GitHub Repo",
              description: "Source code repository",
              url: `https://github.com/${config?.github?.owner}/${config?.github?.repo}`,
              type: "GitHub",
              category: "tool"
            })
          }

          // Add custom links
          allLinks.push(...customLinks)

          // Group by category
          const linksByCategory = CATEGORIES.reduce((acc, cat) => {
            acc[cat.value] = allLinks.filter(link => (link.category || "other") === cat.value)
            return acc
          }, {} as Record<string, Link[]>)

          if (allLinks.length === 0) {
            return (
              <div className="p-8 border rounded-lg text-center border-dashed">
                <p className="text-sm text-muted-foreground">
                  No links added yet. Click &ldquo;Add Link&rdquo; to add your first resource link.
                </p>
              </div>
            )
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORIES.map((cat) => {
                const categoryLinks = linksByCategory[cat.value] || []

                return (
                  <div key={cat.value} className="flex flex-col">
                    {/* En-tête de colonne Kanban distinctif */}
                    <div className={`rounded-lg p-3 mb-3 border-2 shadow-sm ${
                      cat.value === 'database' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 border-indigo-700 text-white' :
                      cat.value === 'tool' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-700 text-white' :
                      cat.value === 'website' ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 border-cyan-700 text-white' :
                      cat.value === 'social' ? 'bg-gradient-to-r from-pink-500 to-pink-600 border-pink-700 text-white' :
                      cat.value === 'document' ? 'bg-gradient-to-r from-amber-500 to-amber-600 border-amber-700 text-white' :
                      'bg-gradient-to-r from-gray-500 to-gray-600 border-gray-700 text-white'
                    }`}>
                      <div className="flex items-center justify-between">
                        <h5 className="font-extrabold text-sm flex items-center gap-2 uppercase tracking-wide">
                          <span className="text-xl drop-shadow">{cat.emoji}</span>
                          <span className="truncate drop-shadow">{cat.label.replace(cat.emoji, "").trim()}</span>
                        </h5>
                        <Badge variant="secondary" className="text-xs font-bold bg-white text-gray-900 px-2 py-0.5 shadow-sm">
                          {categoryLinks.length}
                        </Badge>
                      </div>
                    </div>

                    {/* Colonne de cartes compacte */}
                    <div className="space-y-2 min-h-[120px] flex-1">
                      {categoryLinks.length > 0 ? (
                        categoryLinks.map((link) => {
                          const isConfigLink = link.id.endsWith("-config")
                          const typeInfo = getLinkTypeInfo(link.type)
                          const domain = getDomainFromUrl(link.url)

                          return (
                            <Card
                              key={link.id}
                              className="hover:shadow-md transition-all bg-white border cursor-pointer hover:ring-2 hover:ring-primary/50"
                              onClick={() => handleViewLink(link)}
                            >
                              <CardContent className="p-2.5">
                                <div className="flex items-start gap-2">
                                  <div className={`text-xl flex-shrink-0 p-1 rounded ${typeInfo.color}`}>
                                    {typeInfo.icon}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-bold text-[11px] truncate text-gray-900 leading-tight">{link.title}</h5>
                                    <p className="text-[9px] text-blue-600 truncate font-mono mt-0.5">
                                      {domain}
                                    </p>
                                  </div>
                                  {/* Boutons d'action */}
                                  <div className="flex gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                    {isConfigLink && link.id !== "notion-config" && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEditConfigLink(link.id === "drive-config" ? "drive" : "github")}
                                        className="h-6 w-6 p-0 text-[10px]"
                                      >
                                        ✏️
                                      </Button>
                                    )}
                                    {!isConfigLink && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleOpenEdit(link)}
                                          className="h-6 w-6 p-0 text-[10px]"
                                        >
                                          ✏️
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => handleDeleteLink(link.id)}
                                          className="h-6 w-6 p-0 text-[10px] text-red-500 hover:text-red-700"
                                        >
                                          🗑️
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })
                      ) : (
                        <div className="p-3 border border-dashed rounded text-center bg-muted/10">
                          <p className="text-[10px] text-muted-foreground">Aucun lien</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })()}
      </div>
    </div>
  )

  return (
    <>
      <PageSection
        title="Guides and Docs"
        description="Important links and references for project resources"
        icon="📚"
        detailedContent={detailedContent}
      />

      {/* Preview Modal for Notion, Google Docs, Drive */}
      {previewLink && (
        <DocumentPreviewModal
          isOpen={previewOpen}
          onClose={() => {
            setPreviewOpen(false)
            setPreviewLink(null)
          }}
          title={previewLink.title}
          url={previewLink.url}
          type={previewLink.type}
        />
      )}
    </>
  )
}
