import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "No access token found. Please sign in with Google." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get("folderId")

    if (!folderId) {
      return NextResponse.json(
        { error: "Missing folderId parameter" },
        { status: 400 }
      )
    }

    // Fetch files from the specified folder
    const filesResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink,size,createdTime)&orderBy=modifiedTime desc&pageSize=50`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/json",
        },
      }
    )

    if (!filesResponse.ok) {
      const error = await filesResponse.json()
      return NextResponse.json(
        { error: error.error?.message || "Failed to fetch files from Google Drive" },
        { status: filesResponse.status }
      )
    }

    const filesData = await filesResponse.json()

    // Fetch folder metadata
    const folderResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,modifiedTime,webViewLink`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/json",
        },
      }
    )

    const folderData = folderResponse.ok ? await folderResponse.json() : null

    return NextResponse.json({
      folder: folderData ? {
        id: folderData.id,
        name: folderData.name,
        modifiedTime: folderData.modifiedTime,
        webViewLink: folderData.webViewLink,
      } : null,
      files: filesData.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        modifiedTime: file.modifiedTime,
        createdTime: file.createdTime,
        webViewLink: file.webViewLink,
        iconLink: file.iconLink,
        size: file.size,
        isFolder: file.mimeType === "application/vnd.google-apps.folder",
        isDocument: file.mimeType === "application/vnd.google-apps.document",
        isSpreadsheet: file.mimeType === "application/vnd.google-apps.spreadsheet",
        isPresentation: file.mimeType === "application/vnd.google-apps.presentation",
      })),
      totalFiles: filesData.files.length,
    })
  } catch (error) {
    console.error("[Google Drive API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
