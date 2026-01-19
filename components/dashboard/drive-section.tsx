"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageSection } from "./page-section"
import { useProjectConfig } from "@/lib/project-config"
import { ExternalLink, FileText, Folder, AlertCircle, File } from "lucide-react"

interface DriveFile {
  id: string
  name: string
  mimeType: string
  modifiedTime: string
  webViewLink: string
  iconLink: string
  isFolder: boolean
  isDocument: boolean
  isSpreadsheet: boolean
  isPresentation: boolean
}

interface DriveData {
  folder: {
    id: string
    name: string
    modifiedTime: string
    webViewLink: string
  } | null
  files: DriveFile[]
  totalFiles: number
}

export function DriveSection() {
  const config = useProjectConfig()
  const [data, setData] = useState<DriveData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDriveData = useCallback(async () => {
    if (!config?.googleDrive?.folderId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/drive/files?folderId=${config?.googleDrive.folderId}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch Google Drive data")
      }

      const driveData = await response.json()
      setData(driveData)
    } catch (err: any) {
      console.error("[DriveSection] Error:", err)
      setError(err.message || "Failed to fetch Google Drive data")
    } finally {
      setLoading(false)
    }
  }, [config?.googleDrive?.folderId])

  useEffect(() => {
    if (config?.googleDrive?.folderId) {
      fetchDriveData()
    }
  }, [config?.googleDrive?.folderId, fetchDriveData])

  const keyMetrics = data ? (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="text-center p-3 bg-muted/50 rounded-lg">
        <div className="text-2xl font-bold">{data.totalFiles}</div>
        <div className="text-xs text-muted-foreground">Total Files</div>
      </div>
      <div className="text-center p-3 bg-muted/50 rounded-lg">
        <div className="text-2xl font-bold">
          {data.files.filter((f) => f.isDocument).length}
        </div>
        <div className="text-xs text-muted-foreground">Documents</div>
      </div>
      <div className="text-center p-3 bg-muted/50 rounded-lg">
        <div className="text-2xl font-bold">
          {data.files.filter((f) => f.isFolder).length}
        </div>
        <div className="text-xs text-muted-foreground">Folders</div>
      </div>
    </div>
  ) : null

  const getFileIcon = (file: DriveFile) => {
    if (file.isFolder) return <Folder className="h-4 w-4" />
    if (file.isDocument || file.isSpreadsheet || file.isPresentation)
      return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const getFileTypeLabel = (file: DriveFile) => {
    if (file.isFolder) return "Folder"
    if (file.isDocument) return "Doc"
    if (file.isSpreadsheet) return "Sheet"
    if (file.isPresentation) return "Slides"
    return "File"
  }

  const detailedContent = (
    <div className="space-y-6">
      {loading && (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading Google Drive data...</div>
        </div>
      )}

      {error && (
        <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/10">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {!config?.googleDrive?.folderId ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No Google Drive folder configured. Click &quot;Project Settings&quot; to configure your folder.
          </p>
        </div>
      ) : data && (
        <>
          {/* Folder Info */}
          {data.folder && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Folder</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(data.folder!.webViewLink, "_blank")}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open in Drive
                </Button>
              </div>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Folder className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h5 className="font-medium">{data.folder.name}</h5>
                      <p className="text-xs text-muted-foreground">
                        Last modified: {new Date(data.folder.modifiedTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Files List */}
          <div>
            <h4 className="font-semibold mb-3">Files & Folders</h4>
            {data.files.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                This folder is empty
              </p>
            ) : (
              <div className="space-y-2">
                {data.files.map((file) => (
                  <Card key={file.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {getFileIcon(file)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Modified: {new Date(file.modifiedTime).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {getFileTypeLabel(file)}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(file.webViewLink, "_blank")}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )

  return (
    <PageSection
      title="Google Drive"
      description="Browse and access project documentation from Google Drive"
      icon="📁"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
    />
  )
}
