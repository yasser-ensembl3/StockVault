"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, X, Loader2 } from "lucide-react"

interface DocumentPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  url: string
  type: string
}

type EmbedType = "google-doc" | "google-sheet" | "google-drive" | "notion" | "none"

interface NotionBlock {
  id: string
  type: string
  [key: string]: any
}

interface NotionPage {
  id: string
  title: string
  icon?: string
  cover?: string
  blocks: NotionBlock[]
}

function getEmbedInfo(url: string): { type: EmbedType; embedUrl: string; pageId?: string } | null {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`)
    const hostname = urlObj.hostname

    // Google Docs
    if (hostname.includes("docs.google.com") && url.includes("/document/")) {
      const docId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
      if (docId) {
        return {
          type: "google-doc",
          embedUrl: `https://docs.google.com/document/d/${docId}/preview`
        }
      }
    }

    // Google Sheets
    if (hostname.includes("docs.google.com") && url.includes("/spreadsheets/")) {
      const sheetId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
      if (sheetId) {
        return {
          type: "google-sheet",
          embedUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/preview`
        }
      }
    }

    // Google Drive folder
    if (hostname.includes("drive.google.com") && url.includes("/folders/")) {
      const folderId = url.match(/\/folders\/([a-zA-Z0-9-_]+)/)?.[1]
      if (folderId) {
        return {
          type: "google-drive",
          embedUrl: `https://drive.google.com/embeddedfolderview?id=${folderId}#list`
        }
      }
    }

    // Notion - extract page ID for API fetch
    if (hostname.includes("notion.so") || hostname.includes("notion.site")) {
      // Extract page ID from URL (32-char hex with or without dashes)
      const pageIdMatch = url.match(/([a-f0-9]{32})|([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i)
      if (pageIdMatch) {
        return {
          type: "notion",
          embedUrl: url,
          pageId: pageIdMatch[0].replace(/-/g, "")
        }
      }
    }

    // Not embeddable - return null to trigger external redirect
    return null
  } catch {
    return null
  }
}

// Check if URL can be previewed in-app
export function canPreviewUrl(url: string): boolean {
  return getEmbedInfo(url) !== null
}

// Render a Notion block to HTML-like JSX
function renderNotionBlock(block: NotionBlock): React.ReactNode {
  const { type, id } = block

  const renderRichText = (richText: any[]): React.ReactNode => {
    if (!richText || richText.length === 0) return null
    return richText.map((text: any, i: number) => {
      let content: React.ReactNode = text.plain_text
      if (text.annotations?.bold) content = <strong key={i}>{content}</strong>
      if (text.annotations?.italic) content = <em key={i}>{content}</em>
      if (text.annotations?.code) content = <code key={i} className="bg-muted px-1 rounded">{content}</code>
      if (text.href) content = <a key={i} href={text.href} className="text-blue-500 underline" target="_blank" rel="noopener noreferrer">{content}</a>
      return <span key={i}>{content}</span>
    })
  }

  switch (type) {
    case "paragraph":
      return (
        <p key={id} className="mb-3 text-sm leading-relaxed">
          {renderRichText(block.paragraph?.rich_text)}
        </p>
      )
    case "heading_1":
      return (
        <h1 key={id} className="text-2xl font-bold mb-4 mt-6">
          {renderRichText(block.heading_1?.rich_text)}
        </h1>
      )
    case "heading_2":
      return (
        <h2 key={id} className="text-xl font-bold mb-3 mt-5">
          {renderRichText(block.heading_2?.rich_text)}
        </h2>
      )
    case "heading_3":
      return (
        <h3 key={id} className="text-lg font-bold mb-2 mt-4">
          {renderRichText(block.heading_3?.rich_text)}
        </h3>
      )
    case "bulleted_list_item":
      return (
        <li key={id} className="ml-4 mb-1 text-sm list-disc">
          {renderRichText(block.bulleted_list_item?.rich_text)}
        </li>
      )
    case "numbered_list_item":
      return (
        <li key={id} className="ml-4 mb-1 text-sm list-decimal">
          {renderRichText(block.numbered_list_item?.rich_text)}
        </li>
      )
    case "to_do":
      return (
        <div key={id} className="flex items-start gap-2 mb-1 text-sm">
          <input type="checkbox" checked={block.to_do?.checked} readOnly className="mt-1" />
          <span className={block.to_do?.checked ? "line-through text-muted-foreground" : ""}>
            {renderRichText(block.to_do?.rich_text)}
          </span>
        </div>
      )
    case "quote":
      return (
        <blockquote key={id} className="border-l-4 border-muted-foreground pl-4 italic mb-3 text-sm">
          {renderRichText(block.quote?.rich_text)}
        </blockquote>
      )
    case "code":
      return (
        <pre key={id} className="bg-muted p-3 rounded-lg mb-3 overflow-x-auto text-xs">
          <code>{block.code?.rich_text?.map((t: any) => t.plain_text).join("")}</code>
        </pre>
      )
    case "divider":
      return <hr key={id} className="my-4 border-muted" />
    case "callout":
      return (
        <div key={id} className="bg-muted/50 border rounded-lg p-3 mb-3 flex gap-2 text-sm">
          <span>{block.callout?.icon?.emoji || "💡"}</span>
          <div>{renderRichText(block.callout?.rich_text)}</div>
        </div>
      )
    case "image":
      const imageUrl = block.image?.file?.url || block.image?.external?.url
      return imageUrl ? (
        <img key={id} src={imageUrl} alt="" className="max-w-full rounded-lg mb-3" />
      ) : null
    case "bookmark":
    case "link_preview":
      const linkUrl = block.bookmark?.url || block.link_preview?.url
      return linkUrl ? (
        <a key={id} href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline block mb-2 text-sm">
          {linkUrl}
        </a>
      ) : null
    case "child_database":
      return (
        <div key={id} className="bg-muted/30 border rounded-lg p-3 mb-3 text-sm">
          <span className="text-muted-foreground">Database: </span>
          <span className="font-medium">{block.child_database?.title || "Untitled"}</span>
        </div>
      )
    default:
      return null
  }
}

// Notion Content Viewer Component
function NotionContentViewer({ pageId, onLoad }: { pageId: string; onLoad: () => void }) {
  const [page, setPage] = useState<NotionPage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await fetch(`/api/notion/page-content?pageId=${pageId}`)
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to fetch page")
        }
        const data = await response.json()
        setPage(data)
        setError(null)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
        onLoad()
      }
    }

    fetchPage()
  }, [pageId, onLoad])

  if (loading) {
    return null // Loading state handled by parent
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-red-500 mb-2">Erreur: {error}</p>
        <p className="text-sm text-muted-foreground">Impossible de charger le contenu Notion</p>
      </div>
    )
  }

  if (!page) {
    return null
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Cover image */}
      {page.cover && (
        <div className="w-full h-48 mb-6 rounded-lg overflow-hidden">
          <img src={page.cover} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Title with icon */}
      <div className="flex items-center gap-3 mb-6">
        {page.icon && <span className="text-4xl">{page.icon}</span>}
        <h1 className="text-3xl font-bold">{page.title}</h1>
      </div>

      {/* Content blocks */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        {page.blocks.map(block => renderNotionBlock(block))}
      </div>

      {page.blocks.length === 0 && (
        <p className="text-muted-foreground text-center py-8">Cette page est vide</p>
      )}
    </div>
  )
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  title,
  url,
  type,
}: DocumentPreviewModalProps) {
  const [loading, setLoading] = useState(true)

  const embedInfo = getEmbedInfo(url)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
    }
  }, [isOpen, url])

  const handleIframeLoad = () => {
    setLoading(false)
  }

  const handleOpenExternal = () => {
    window.open(url, "_blank")
  }

  // If not embeddable, shouldn't be opened
  if (!embedInfo) {
    return null
  }

  const isNotion = embedInfo.type === "notion"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <DialogTitle className="text-lg font-semibold truncate">{title}</DialogTitle>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0">
                {type}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenExternal}
                className="gap-1"
              >
                <ExternalLink className="h-4 w-4" />
                Ouvrir
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 relative overflow-auto bg-background">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            </div>
          )}

          {isNotion && embedInfo.pageId ? (
            <NotionContentViewer
              pageId={embedInfo.pageId}
              onLoad={() => setLoading(false)}
            />
          ) : (
            <iframe
              src={embedInfo.embedUrl}
              className="w-full h-full border-0"
              style={{ minHeight: "calc(90vh - 80px)" }}
              onLoad={handleIframeLoad}
              allow="fullscreen"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
