"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, Building2, GitCompare, TrendingUp, Briefcase } from "lucide-react"

type Company = {
  name: string
  folderId: string
}

type InvestmentCompany = {
  id: string
  name: string
  displayName: string
}

export function Sidebar() {
  const pathname = usePathname()
  const [companies, setCompanies] = useState<Company[]>([])
  const [investmentCompanies, setInvestmentCompanies] = useState<InvestmentCompany[]>([])
  const [isStockOpen, setIsStockOpen] = useState(true)
  const [isInvestmentOpen, setIsInvestmentOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isInvestmentLoading, setIsInvestmentLoading] = useState(true)

  useEffect(() => {
    async function fetchCompanies() {
      try {
        const res = await fetch("/api/drive/companies?quarter=Q3")
        const data = await res.json()
        setCompanies(data.companies || [])
      } catch (error) {
        console.error("Failed to fetch companies:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCompanies()
  }, [])

  useEffect(() => {
    async function fetchInvestmentCompanies() {
      try {
        const res = await fetch("/api/investment/companies")
        const data = await res.json()
        setInvestmentCompanies(data.companies || [])
      } catch (error) {
        console.error("Failed to fetch investment companies:", error)
      } finally {
        setIsInvestmentLoading(false)
      }
    }
    fetchInvestmentCompanies()
  }, [])

  // Auto-expand if on a company page
  useEffect(() => {
    if (pathname?.startsWith("/company/")) {
      setIsStockOpen(true)
    }
    if (pathname?.startsWith("/investment/")) {
      setIsInvestmentOpen(true)
    }
  }, [pathname])

  return (
    <aside className="w-64 min-h-screen border-r border-border bg-card p-4 flex-shrink-0">
      <div className="mb-6">
        <Link href="/compare" className="flex items-center gap-2">
          <span className="text-2xl">📈</span>
          <span className="font-bold text-xl">Quarterly Vault</span>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Financial Insights</p>
      </div>

      <nav className="space-y-1">
        {/* Stock Company - Collapsible */}
        <div>
          <button
            onClick={() => setIsStockOpen(!isStockOpen)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
              pathname?.startsWith("/company")
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4" />
              <span>Stock company</span>
            </div>
            {isStockOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {isStockOpen && (
            <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
              {isLoading ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  Loading...
                </div>
              ) : companies.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No companies found
                </div>
              ) : (
                companies.map((company) => {
                  const href = `/company/${encodeURIComponent(company.name)}`
                  const isActive = pathname === href

                  return (
                    <Link
                      key={company.folderId}
                      href={href}
                      className={cn(
                        "block px-3 py-1.5 rounded-md text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {company.name}
                    </Link>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Investment Reports - Collapsible */}
        <div>
          <button
            onClick={() => setIsInvestmentOpen(!isInvestmentOpen)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
              pathname?.startsWith("/investment")
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-3">
              <Briefcase className="h-4 w-4" />
              <span>Investment Reports</span>
            </div>
            {isInvestmentOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {isInvestmentOpen && (
            <div className="ml-4 mt-1 space-y-1 border-l border-border pl-3">
              {isInvestmentLoading ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  Loading...
                </div>
              ) : investmentCompanies.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  No reports found
                </div>
              ) : (
                investmentCompanies.map((company) => {
                  const href = `/investment/${encodeURIComponent(company.name)}`
                  const isActive = pathname === href

                  return (
                    <Link
                      key={company.id}
                      href={href}
                      className={cn(
                        "block px-3 py-1.5 rounded-md text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      {company.displayName}
                    </Link>
                  )
                })
              )}
            </div>
          )}
        </div>

        {/* Compare */}
        <Link
          href="/compare"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
            pathname === "/compare"
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <GitCompare className="h-4 w-4" />
          <span>Compare</span>
        </Link>

        {/* Trends */}
        <Link
          href="/trends"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
            pathname === "/trends"
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Trends</span>
        </Link>
      </nav>
    </aside>
  )
}
