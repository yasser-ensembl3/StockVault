"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, CheckCircle2, XCircle, ArrowRight } from "lucide-react"

interface SymbolMatch {
  symbol: string
  name: string
  type: string
  region: string
  currency: string
}

interface PipelineResult {
  symbol: string
  fetched: string
  errors: string[]
  drive: { folderId: string; uploaded: string[] } | null
  fetchedAt: string
}

export default function StockSearchPage() {
  const [query, setQuery] = useState("")
  const [selectedSymbol, setSelectedSymbol] = useState("")
  const [suggestions, setSuggestions] = useState<SymbolMatch[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PipelineResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [symbols, setSymbols] = useState<string[]>([])
  const [symbolsLoading, setSymbolsLoading] = useState(true)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch existing symbols
  useEffect(() => {
    fetch("/api/stock/symbols")
      .then((res) => res.json())
      .then((data) => setSymbols(data.symbols || []))
      .catch(() => {})
      .finally(() => setSymbolsLoading(false))
  }, [])

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Debounced search
  const handleInputChange = (value: string) => {
    setQuery(value)
    setSelectedSymbol("")

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/stock/search?q=${encodeURIComponent(value.trim())}`)
        const data = await res.json()
        setSuggestions(data.results || [])
        setShowSuggestions(true)
      } catch {
        setSuggestions([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  const selectSymbol = (match: SymbolMatch) => {
    setSelectedSymbol(match.symbol)
    setQuery(`${match.symbol} — ${match.name}`)
    setShowSuggestions(false)
  }

  const handleFetch = async () => {
    const sym = selectedSymbol || query.trim().toUpperCase()
    if (!sym) return

    // Extract symbol if user typed "MSFT — Microsoft"
    const finalSymbol = sym.split(/[\s—-]/)[0].toUpperCase()

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch("/api/stock/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: finalSymbol }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Pipeline failed")
        return
      }

      setResult(data)

      if (!symbols.includes(finalSymbol)) {
        setSymbols((prev) => [...prev, finalSymbol].sort())
      }
    } catch {
      setError("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Stock Data Pipeline</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Search by company name or ticker symbol, then fetch data from Alpha Vantage
        </p>
      </div>

      {/* Search with autocomplete */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2" ref={containerRef}>
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loading) handleFetch()
                }}
                placeholder="Search company name or symbol (e.g. Microsoft, AAPL)"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                disabled={loading}
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {suggestions.map((match) => (
                    <button
                      key={`${match.symbol}-${match.region}`}
                      onClick={() => selectSymbol(match)}
                      className="w-full text-left px-4 py-2.5 hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{match.symbol}</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            {match.region}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {match.currency}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {match.name}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleFetch}
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Fetch Data
                </>
              )}
            </button>
          </div>

          {loading && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>
                  Fetching 5 endpoints from Alpha Vantage (~48s)...
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Overview, Income Statement, Balance Sheet, Cash Flow, Earnings
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pipeline Result — {result.symbol}</span>
              <Badge variant="default">{result.fetched} fetched</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>Data fetched at {new Date(result.fetchedAt).toLocaleString()}</span>
            </div>

            {result.drive && (
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>
                  Uploaded {result.drive.uploaded.length} files to Google Drive
                </span>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="space-y-1">
                {result.errors.map((err, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                    <XCircle className="h-3 w-3" />
                    <span>{err}</span>
                  </div>
                ))}
              </div>
            )}

            <Link
              href={`/stock/${result.symbol}`}
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
            >
              View {result.symbol}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Existing Symbols */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Symbols</CardTitle>
        </CardHeader>
        <CardContent>
          {symbolsLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : symbols.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No symbols fetched yet. Use the search above to add one.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {symbols.map((s) => (
                <Link
                  key={s}
                  href={`/stock/${s}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-md text-sm font-medium transition-colors"
                >
                  {s}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
