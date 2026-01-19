"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageSection } from "./page-section"
import { useProjectConfig } from "@/lib/project-config"
import { ExternalLink, GitBranch, GitCommit, GitPullRequest, AlertCircle } from "lucide-react"

interface GitHubData {
  repository: {
    name: string
    fullName: string
    description: string
    stars: number
    forks: number
    openIssues: number
    defaultBranch: string
    language: string
    htmlUrl: string
  }
  commits: Array<{
    sha: string
    message: string
    author: string
    date: string
    url: string
  }>
  issues: Array<{
    number: number
    title: string
    state: string
    createdAt: string
    url: string
    labels: string[]
  }>
  pullRequests: Array<{
    number: number
    title: string
    state: string
    createdAt: string
    url: string
    author: string
  }>
}

export function GitHubSection() {
  const config = useProjectConfig()
  const [data, setData] = useState<GitHubData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGitHubData = useCallback(async () => {
    if (!config?.github?.owner || !config?.github?.repo) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/github/repo?owner=${config?.github.owner}&repo=${config?.github.repo}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch GitHub data")
      }

      const githubData = await response.json()
      setData(githubData)
    } catch (err: any) {
      console.error("[GitHubSection] Error:", err)
      setError(err.message || "Failed to fetch GitHub data")
    } finally {
      setLoading(false)
    }
  }, [config?.github?.owner, config?.github?.repo])

  useEffect(() => {
    if (config?.github?.owner && config?.github?.repo) {
      fetchGitHubData()
    }
  }, [config?.github?.owner, config?.github?.repo, fetchGitHubData])

  const keyMetrics = data ? (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="text-center p-3 bg-muted/50 rounded-lg">
        <div className="text-2xl font-bold">{data.repository.stars}</div>
        <div className="text-xs text-muted-foreground">Stars</div>
      </div>
      <div className="text-center p-3 bg-muted/50 rounded-lg">
        <div className="text-2xl font-bold">{data.repository.forks}</div>
        <div className="text-xs text-muted-foreground">Forks</div>
      </div>
      <div className="text-center p-3 bg-muted/50 rounded-lg">
        <div className="text-2xl font-bold">{data.repository.openIssues}</div>
        <div className="text-xs text-muted-foreground">Open Issues</div>
      </div>
      <div className="text-center p-3 bg-muted/50 rounded-lg">
        <div className="text-2xl font-bold">{data.pullRequests.length}</div>
        <div className="text-xs text-muted-foreground">Open PRs</div>
      </div>
    </div>
  ) : null

  const detailedContent = (
    <div className="space-y-6">
      {loading && (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading GitHub data...</div>
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

      {!config?.github?.owner || !config?.github?.repo ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No GitHub repository configured. Click &quot;Project Settings&quot; to configure your repository.
          </p>
        </div>
      ) : data && (
        <>
          {/* Repository Info */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold">Repository</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(data.repository.htmlUrl, "_blank")}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View on GitHub
              </Button>
            </div>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">{data.repository.fullName}</h5>
                    <div className="flex items-center space-x-2">
                      {data.repository.language && (
                        <Badge variant="secondary">{data.repository.language}</Badge>
                      )}
                      <Badge variant="outline">
                        <GitBranch className="h-3 w-3 mr-1" />
                        {data.repository.defaultBranch}
                      </Badge>
                    </div>
                  </div>
                  {data.repository.description && (
                    <p className="text-sm text-muted-foreground">
                      {data.repository.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Commits */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <GitCommit className="h-4 w-4" />
              <h4 className="font-semibold">Recent Commits</h4>
            </div>
            <div className="space-y-2">
              {data.commits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No commits found</p>
              ) : (
                data.commits.map((commit) => (
                  <Card key={commit.sha}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium line-clamp-2">{commit.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {commit.author} • {new Date(commit.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(commit.url, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Open Pull Requests */}
          {data.pullRequests.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <GitPullRequest className="h-4 w-4" />
                <h4 className="font-semibold">Open Pull Requests</h4>
              </div>
              <div className="space-y-2">
                {data.pullRequests.map((pr) => (
                  <Card key={pr.number}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">#{pr.number}</Badge>
                            <p className="text-sm font-medium">{pr.title}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            by {pr.author} • {new Date(pr.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(pr.url, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Open Issues */}
          {data.issues.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <AlertCircle className="h-4 w-4" />
                <h4 className="font-semibold">Open Issues</h4>
              </div>
              <div className="space-y-2">
                {data.issues.slice(0, 5).map((issue) => (
                  <Card key={issue.number}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">#{issue.number}</Badge>
                            <p className="text-sm font-medium line-clamp-1">{issue.title}</p>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {new Date(issue.createdAt).toLocaleDateString()}
                            </p>
                            {issue.labels.length > 0 && (
                              <div className="flex space-x-1">
                                {issue.labels.slice(0, 2).map((label) => (
                                  <Badge key={label} variant="secondary" className="text-xs">
                                    {label}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(issue.url, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )

  return (
    <PageSection
      title="GitHub Repository"
      description="Track repository activity, commits, issues, and pull requests"
      icon="🐙"
      keyMetrics={keyMetrics}
      detailedContent={detailedContent}
    />
  )
}
