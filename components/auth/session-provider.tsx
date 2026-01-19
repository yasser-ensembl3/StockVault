"use client"

import { SessionProvider } from "next-auth/react"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log("[AuthProvider] Rendering SessionProvider wrapper")
  return <SessionProvider>{children}</SessionProvider>
}