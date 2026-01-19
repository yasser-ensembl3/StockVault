// Project configuration from environment variables
// Architecture: One repo = One project
// Each MiniVault deployment is dedicated to a single project

export interface ProjectConfig {
  projectName: string
  description?: string
  github?: {
    owner: string
    repo: string
  }
  googleDrive?: {
    folderId: string
    folderName?: string
  }
  notionDatabases: {
    tasks?: string
    recurringTasks?: string
    goals?: string
    milestones?: string
    documents?: string
    feedback?: string
    metrics?: string
    sales?: string
    orders?: string
    customMetrics?: string
    essentials?: string
    salesTracking?: string
    webAnalytics?: string
  }
  projectPageId?: string
}

/**
 * Get project configuration from environment variables
 * Can be used both server-side and client-side (uses NEXT_PUBLIC_ prefix)
 */
export function getProjectConfig(): ProjectConfig {
  return {
    projectName: process.env.NEXT_PUBLIC_PROJECT_NAME || "MiniVault Dashboard",
    description: process.env.NEXT_PUBLIC_PROJECT_DESCRIPTION,
    github: process.env.NEXT_PUBLIC_GITHUB_OWNER && process.env.NEXT_PUBLIC_GITHUB_REPO ? {
      owner: process.env.NEXT_PUBLIC_GITHUB_OWNER,
      repo: process.env.NEXT_PUBLIC_GITHUB_REPO,
    } : undefined,
    googleDrive: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID ? {
      folderId: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_ID,
      folderName: process.env.NEXT_PUBLIC_GOOGLE_DRIVE_FOLDER_NAME,
    } : undefined,
    notionDatabases: {
      tasks: process.env.NEXT_PUBLIC_NOTION_DB_TASKS,
      recurringTasks: process.env.NEXT_PUBLIC_NOTION_DB_RECURRING_TASKS,
      goals: process.env.NEXT_PUBLIC_NOTION_DB_GOALS,
      milestones: process.env.NEXT_PUBLIC_NOTION_DB_MILESTONES,
      documents: process.env.NEXT_PUBLIC_NOTION_DB_DOCUMENTS,
      feedback: process.env.NEXT_PUBLIC_NOTION_DB_FEEDBACK,
      metrics: process.env.NEXT_PUBLIC_NOTION_DB_METRICS,
      sales: process.env.NEXT_PUBLIC_NOTION_DB_SALES,
      orders: process.env.NEXT_PUBLIC_NOTION_DB_ORDERS,
      customMetrics: process.env.NEXT_PUBLIC_NOTION_DB_CUSTOM_METRICS,
      essentials: process.env.NEXT_PUBLIC_NOTION_DB_ESSENTIALS,
      salesTracking: process.env.NEXT_PUBLIC_NOTION_DB_SALES_TRACKING,
      webAnalytics: process.env.NEXT_PUBLIC_NOTION_DB_WEB_ANALYTICS,
    },
    projectPageId: process.env.NEXT_PUBLIC_NOTION_PROJECT_PAGE_ID,
  }
}

/**
 * Hook to use project configuration in React components
 * Simply returns the config from environment variables
 */
export function useProjectConfig(): ProjectConfig {
  return getProjectConfig()
}
