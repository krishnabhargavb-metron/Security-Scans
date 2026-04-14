import { useState, useEffect, useMemo } from 'react'
import type { Finding } from './components/FindingCard'
import type { Filters } from './components/FilterPanel'
import { ScanForm } from './components/ScanForm'
import { FilterPanel } from './components/FilterPanel'
import { ResultsView } from './components/ResultsView'
import { useToast } from './hooks/useToast'
import { apiService } from './utils/apiService'
import './App.css'

const getErrorMessage = (status: number, fallback: string): string => {
  const statusMessages: Record<number, string> = {
    400: 'Invalid request. Please check your input and try again.',
    401: 'Unauthorized. Please check your credentials.',
    403: 'Access forbidden. You do not have permission to access this resource.',
    404: 'Resource not found. Please check the username and try again.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Server error occurred. Please try again later.',
    502: 'Bad gateway. The server is temporarily unavailable.',
    503: 'Service unavailable. Please try again later.',
    504: 'Gateway timeout. The server took too long to respond.'
  }

  return statusMessages[status] || fallback
}

function App() {
  const toast = useToast()
  const [findings, setFindings] = useState<Finding[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
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
      const response = await apiService.get<{ categories: string[] }>('/scan')
      if (response.ok && response.data) {
        setCategories(response.data.categories || [])
      }
    }
    fetchMetadata()
  }, [])

  // Handle scan
  const handleScan = async (username: string, pat?: string) => {
    setIsLoading(true)
    setFindings([])
    setCurrentUsername(username)
    setCurrentPat(pat || '')
    setPagination({ total: 0, limit: 10, offset: 0, hasMore: false })

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

    interface ScanResponse {
      items: Finding[]
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }

    const response = await apiService.get<ScanResponse>(
      `/scan/${username}?${params}`,
      headers
    )

    if (!response.ok || !response.data) {
      const errorMessage = response.error
        ? getErrorMessage(response.status, response.error.message)
        : 'Failed to scan. Please try again.'

      toast.error(errorMessage, {
        duration: 5000
      })
      setIsLoading(false)
      return
    }

    setFindings(response.data.items || [])
    setPagination({
      total: response.data.total,
      limit: response.data.limit,
      offset: response.data.offset,
      hasMore: response.data.hasMore
    })
    console.log('Scan response:', response.data)
    toast.success(`Found ${response.data.items.length} vulnerabilities`, {
      duration: 3000
    })
    setIsLoading(false)
  }

  // Handle load more
  const handleLoadMore = async () => {
    if (!currentUsername || isLoadingMore) return

    setIsLoadingMore(true)
    const newOffset = pagination.offset + pagination.limit

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

    interface ScanResponse {
      items: Finding[]
      total: number
      limit: number
      offset: number
      hasMore: boolean
    }

    const response = await apiService.get<ScanResponse>(
      `/scan/${currentUsername}?${params}`,
      headers
    )

    if (!response.ok || !response.data) {
      const errorMessage = response.error
        ? getErrorMessage(response.status, response.error.message)
        : 'Failed to load more results'

      toast.error(errorMessage, {
        duration: 5000
      })
      setIsLoadingMore(false)
      return
    }

    setFindings([...findings, ...(response.data.items || [])])
    setPagination({
      total: response.data.total,
      limit: response.data.limit,
      offset: response.data.offset,
      hasMore: response.data.hasMore
    })
    toast.success('Loaded more vulnerabilities', {
      duration: 2000
    })
    setIsLoadingMore(false)
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

        const params = new URLSearchParams({
          limit: '10',
          offset: '0'
        })
        if (newFilters.severity) params.append('severity', newFilters.severity)
        if (newFilters.category) params.append('category', newFilters.category)

        const headers: Record<string, string> = {}
        if (currentPat) {
          headers['Authorization'] = `token ${currentPat}`
        }

        interface ScanResponse {
          items: Finding[]
          total: number
          limit: number
          offset: number
          hasMore: boolean
        }

        const response = await apiService.get<ScanResponse>(
          `/scan/${currentUsername}?${params}`,
          headers
        )

        if (!response.ok || !response.data) {
          const errorMessage = response.error
            ? getErrorMessage(response.status, response.error.message)
            : 'Failed to apply filters'

          toast.error(errorMessage, {
            duration: 5000
          })
          setIsLoading(false)
          return
        }

        setFindings(response.data.items || [])
        setPagination({
          total: response.data.total,
          limit: response.data.limit,
          offset: response.data.offset,
          hasMore: response.data.hasMore
        })
        toast.info(`Filtered: ${response.data.total} vulnerabilities found`, {
          duration: 3000
        })
        setIsLoading(false)
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
        {!isLoading && findings.length === 0 && (
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
