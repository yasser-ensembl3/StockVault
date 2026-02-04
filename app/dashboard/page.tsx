"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QuarterSelector } from "@/components/quarter-selector"
import { CompanyCard } from "@/components/company-card"
import { Input } from "@/components/ui/input"

interface Quarter {
  id: string
  name: string
}

interface Company {
  name: string
  folderId: string
  insightsFolderId: string | null
  hasFinancial: boolean
  hasStrategic: boolean
}

export default function DashboardPage() {
  const [quarters, setQuarters] = useState<Quarter[]>([])
  const [selectedQuarter, setSelectedQuarter] = useState<string>("")
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch quarters on mount
  useEffect(() => {
    async function fetchQuarters() {
      try {
        const res = await fetch("/api/drive/quarters")
        if (res.ok) {
          const data = await res.json()
          setQuarters(data.quarters || [])
          if (data.quarters?.length > 0) {
            setSelectedQuarter(data.quarters[0].name)
          }
        }
      } catch (error) {
        console.error("Failed to fetch quarters:", error)
      }
    }
    fetchQuarters()
  }, [])

  // Fetch companies when quarter changes
  useEffect(() => {
    async function fetchCompanies() {
      if (!selectedQuarter) return

      setLoading(true)
      try {
        const res = await fetch(`/api/drive/companies?quarter=${encodeURIComponent(selectedQuarter)}`)
        if (res.ok) {
          const data = await res.json()
          setCompanies(data.companies || [])
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchCompanies()
  }, [selectedQuarter])

  // Filter companies based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredCompanies(companies)
    } else {
      const filtered = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredCompanies(filtered)
    }
  }, [companies, searchTerm])

  const stats = {
    totalCompanies: companies.length,
    withFinancial: companies.filter(c => c.hasFinancial).length,
    withStrategic: companies.filter(c => c.hasStrategic).length,
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Stoic Vault</h1>
          <p className="text-muted-foreground">
            Financial insights for {selectedQuarter || "..."}
          </p>
        </div>
        <QuarterSelector
          quarters={quarters}
          selected={selectedQuarter}
          onSelect={setSelectedQuarter}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCompanies}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Financial Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.withFinancial}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Strategic Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.withStrategic}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Companies Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading companies...
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm ? `No companies found matching "${searchTerm}"` : `No companies found for ${selectedQuarter}`}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCompanies.map((company) => (
            <CompanyCard
              key={company.folderId}
              company={company}
              quarter={selectedQuarter}
            />
          ))}
        </div>
      )}
    </div>
  )
}
