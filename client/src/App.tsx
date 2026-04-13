import { useState, useEffect, useMemo } from 'react'
import type { Finding } from './components/FindingCard'
import type { Filters } from './components/FilterPanel'
import { ScanForm } from './components/ScanForm'
import { FilterPanel } from './components/FilterPanel'
import { ResultsView } from './components/ResultsView'
import { formatErrorMessage } from './utils/validation'
import './App.css'

const API_BASE_URL = 'http://localhost:8000'

function App() {
  const [findings, setFindings] = useState<Finding[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [filters, setFilters] = useState<Filters>({
    severity: null,
    category: null
  })
  const [categories, setCategories] = useState<string[]>([])
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    hasMore: false
  })
  const [currentUsername, setCurrentUsername] = useState<string>('')
  const [currentPat, setCurrentPat] = useState<string>('')

  // Fetch available categories on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/scan`)
        const data = await response.json()
        setCategories(data.categories || [])
      } catch (err) {
        console.log('Could not fetch metadata:', err)
      }
    }
    fetchMetadata()
  }, [])

  // Handle scan
  const handleScan = async (username: string, pat?: string) => {
    setIsLoading(true)
    setError(undefined)
    setFindings([])
    setCurrentUsername(username)
    setCurrentPat(pat || '')
    setPagination({ total: 0, limit: 10, offset: 0, hasMore: false })

    try {
      const params = new URLSearchParams({
        limit: '10',
        offset: '0'
      })
      if (filters.severity) params.append('severity', filters.severity)
      if (filters.category) params.append('category', filters.category)

      const headers: Record<string, string> = {}
      if (pat) {
        headers['Authorization'] = `token ${pat}`
      }

      const response = await fetch(`${API_BASE_URL}/scan/${username}?${params}`, {
        headers
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to scan')
      }

      const data = await response.json()
      setFindings(data.items || [])
      setPagination({
        total: data.total,
        limit: data.limit,
        offset: data.offset,
        hasMore: data.hasMore
      })
    } catch (err) {
      const message = formatErrorMessage(err)
      setError(message)
      console.error('Scan error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle load more
  const handleLoadMore = async () => {
    if (!currentUsername || isLoadingMore) return

    setIsLoadingMore(true)
    const newOffset = pagination.offset + pagination.limit

    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: newOffset.toString()
      })
      if (filters.severity) params.append('severity', filters.severity)
      if (filters.category) params.append('category', filters.category)

      const headers: Record<string, string> = {}
      if (currentPat) {
        headers['Authorization'] = `token ${currentPat}`
      }

      const response = await fetch(`${API_BASE_URL}/scan/${currentUsername}?${params}`, {
        headers
      })
      
      if (!response.ok) {
        throw new Error('Failed to load more results')
      }

      const data = await response.json()
      setFindings([...findings, ...(data.items || [])])
      setPagination({
        total: data.total,
        limit: data.limit,
        offset: data.offset,
        hasMore: data.hasMore
      })
    } catch (err) {
      console.error('Load more error:', err)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // Apply filters
  const filteredFindings = useMemo(() => {
    return findings.filter(finding => {
      if (filters.severity && finding.severity !== filters.severity) {
        return false
      }
      if (filters.category && finding.category !== filters.category) {
        return false
      }
      return true
    })
  }, [findings, filters])

  const onFilterChange = (newFilters: Filters) => {
    setFilters(newFilters)
    // Rescan with new filters
    if (currentUsername) {
      const performFilteredScan = async () => {
        setIsLoading(true)
        setFindings([])
        setPagination({ total: 0, limit: 10, offset: 0, hasMore: false })

        try {
          const params = new URLSearchParams({
            limit: '10',
            offset: '0'
          })
          if (newFilters.severity) params.append('severity', newFilters.severity)
          if (newFilters.category) params.append('category', newFilters.category)

          const response = await fetch(`${API_BASE_URL}/scan/${currentUsername}?${params}`)
          
          if (!response.ok) {
            throw new Error('Failed to scan')
          }

          const data = await response.json()
          setFindings(data.items || [])
          setPagination({
            total: data.total,
            limit: data.limit,
            offset: data.offset,
            hasMore: data.hasMore
          })
        } catch (err) {
          console.error('Filter error:', err)
        } finally {
          setIsLoading(false)
        }
      }
      performFilteredScan()
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-blue-600 text-white px-8 py-6 shadow-lg">
        <h1 className="text-4xl font-bold mb-2">🔐 GitHub Security Dashboard</h1>
        <p className="text-blue-100">Scan repositories for vulnerabilities and misconfigurations</p>
      </div>

      <div className="w-full px-8 py-8">
        {/* Scan Form */}
        <ScanForm
          onScan={handleScan}
          isLoading={isLoading}
          error={error}
        />

        {/* Results Section */}
        {findings.length > 0 && (
          <>
            <FilterPanel
              filters={filters}
              categories={categories}
              onFilterChange={onFilterChange}
              findingsCount={pagination.total}
              filteredCount={filteredFindings.length}
            />

            <ResultsView
              findings={filteredFindings}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              isEmpty={false}
              pagination={pagination}
              onLoadMore={handleLoadMore}
              username={currentUsername}
            />
          </>
        )}

        {/* Empty State */}
        {!isLoading && findings.length === 0 && !error && (
          <ResultsView
            findings={[]}
            isLoading={false}
            isLoadingMore={false}
            isEmpty={true}
            pagination={{ total: 0, limit: 10, offset: 0, hasMore: false }}
            onLoadMore={() => {}}
            username={currentUsername}
          />
        )}
      </div>
    </div>
  )
}

export default App
