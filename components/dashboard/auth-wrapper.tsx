"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading...</div>
          <div className="text-muted-foreground">Please wait</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return <>{children}</>
}
