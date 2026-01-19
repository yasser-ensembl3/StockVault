"use client"

import { signOut, useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { useProjectConfig } from "@/lib/project-config"

export function DashboardHeader() {
  const { data: session } = useSession()
  const config = useProjectConfig()

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {config.projectName}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Welcome back, {session?.user?.name || "User"}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>Connected: {session?.provider === "google" ? "Google" : "GitHub"}</span>
              <span>•</span>
              <button
                onClick={() => signOut()}
                className="hover:underline"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
