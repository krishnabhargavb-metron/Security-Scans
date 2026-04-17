import React, { useState } from 'react'
import type { Finding } from './FindingCard'
import { exportAsJSON, exportAsPDF } from '../utils/exportReport'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { Badge } from './ui/badge'

interface PaginationInfo {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

interface ResultsViewProps {
  findings: Finding[]
  isLoading: boolean
  isLoadingMore?: boolean
  isEmpty: boolean
  pagination: PaginationInfo
  onLoadMore: () => void
  username?: string
}

export const ResultsView: React.FC<ResultsViewProps> = ({ findings, isLoading, isLoadingMore = false, isEmpty, pagination, onLoadMore, username = '' }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-12 text-center">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#FC6D26] mb-4"></div>
          <p className="text-gray-900 text-lg font-semibold">Scanning repositories...</p>
          <p className="text-gray-600 text-sm mt-2">This may take a moment</p>
        </div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-12 text-center">
        <div className="text-6xl mb-4">✨</div>
        <p className="text-gray-900 text-xl font-semibold">No vulnerabilities found!</p>
        <p className="text-gray-600 mt-2">Your repositories are looking clean and secure</p>
      </div>
    )
  }

  // Calculate statistics
  const highCount = findings.filter(f => f.severity === 'High').length
  const mediumCount = findings.filter(f => f.severity === 'Medium').length
  const lowCount = findings.filter(f => f.severity === 'Low').length

  // Filter findings based on search term
  const filteredFindings = findings.filter(finding =>
    finding.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
    finding.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    finding.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleRowExpansion = (key: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedRows(newExpanded)
  }

  return (
    <div className="space-y-6">
      {/* Export Options */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">📥 Export Report</h3>
            <p className="text-sm text-gray-600 mt-1">Download findings in your preferred format</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => exportAsJSON(findings, username)}
              className="px-4 py-2 bg-[#FC6D26] text-white rounded-lg font-semibold hover:bg-[#E45A1F] transition-colors flex items-center gap-2"
            >
              📄 JSON
            </button>
            <button
              onClick={() => exportAsPDF(findings, username)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              📋 PDF
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <p className="text-gray-600 text-sm font-semibold">📊 Total</p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{pagination.total}</p>
        </div>
        <div className="bg-red-50 border border-red-300 rounded-lg shadow-lg p-4">
          <p className="text-red-700 text-sm font-semibold">🔴 High</p>
          <p className="text-4xl font-bold text-red-600 mt-2">{highCount}</p>
        </div>
        <div className="bg-orange-50 border border-orange-300 rounded-lg shadow-lg p-4">
          <p className="text-[#FC6D26] text-sm font-semibold">🟠 Medium</p>
          <p className="text-4xl font-bold text-[#FC6D26] mt-2">{mediumCount}</p>
        </div>
        <div className="bg-green-50 border border-green-300 rounded-lg shadow-lg p-4">
          <p className="text-green-700 text-sm font-semibold">🟢 Low</p>
          <p className="text-4xl font-bold text-green-600 mt-2">{lowCount}</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        {/* Table Header with Search */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search vulnerabilities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FC6D26]"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{filteredFindings.length}</span> of <span className="font-semibold">{findings.length}</span> items
            </div>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-[#FC6D26] to-[#E74C3C] hover:from-[#E45A1F] hover:to-[#D43E2A]">
              <TableHead className="text-white font-bold">Severity</TableHead>
              <TableHead className="text-white font-bold">Issue</TableHead>
              <TableHead className="text-white font-bold">Project</TableHead>
              <TableHead className="text-white font-bold">Category</TableHead>
              <TableHead className="text-white font-bold">File Path</TableHead>
              <TableHead className="text-white font-bold">Description</TableHead>
              <TableHead className="text-white font-bold text-center">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFindings.map((finding) => {
              const uniqueKey = `${finding.projectName}-${finding.filePath || 'no-file'}-${finding.issue}`
              const isExpanded = expandedRows.has(uniqueKey)

              const badgeVariant = {
                'High': 'high' as const,
                'Medium': 'medium' as const,
                'Low': 'low' as const
              }[finding.severity] || 'default' as const

              return (
                <React.Fragment key={uniqueKey}>
                  <TableRow className="hover:bg-orange-50 transition-colors">
                    <TableCell>
                      <Badge variant={badgeVariant} className="whitespace-nowrap">
                        {finding.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900">{finding.issue}</TableCell>
                    <TableCell className="text-gray-700">{finding.projectName}</TableCell>
                    <TableCell>
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        {finding.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      {finding.filePath ? (
                        <code className="bg-gray-100 px-3 py-1 rounded text-xs font-mono text-gray-800 max-w-xs inline-block truncate">
                          {finding.filePath}
                        </code>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">{finding.description.substring(0, 50)}...</TableCell>
                    <TableCell className="text-center">
                      <button
                        onClick={() => toggleRowExpansion(uniqueKey)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-200 transition-colors"
                        title="More options"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="bg-gray-50 border-t-2 border-gray-200">
                      <TableCell colSpan={7} className="py-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase">Full Description</p>
                            <p className="text-sm text-gray-700 mt-1">{finding.description}</p>
                          </div>
                          {finding.filePath && (
                            <div>
                              <p className="text-xs font-semibold text-gray-600 uppercase">File Path</p>
                              <code className="text-sm text-gray-800 mt-1 block bg-white border border-gray-200 rounded p-2 font-mono">
                                {finding.filePath}
                              </code>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              )
            })}

            {/* Loading skeleton while fetching more data */}
            {isLoadingMore && (
              <>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={`skeleton-${i}`} className="bg-gray-50">
                    <TableCell><div className="h-4 bg-gray-300 rounded w-12 animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-300 rounded w-16 animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-300 rounded w-40 animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-300 rounded w-8 animate-pulse"></div></TableCell>
                  </TableRow>
                ))}
              </>
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-semibold">{pagination.offset + 1}</span> to <span className="font-semibold">{Math.min(pagination.offset + filteredFindings.length, pagination.total)}</span> of <span className="font-semibold">{pagination.total}</span> findings
          </div>
          {pagination.hasMore && (
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="px-4 py-2 bg-[#FC6D26] text-white rounded-lg font-semibold hover:bg-[#E45A1F] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoadingMore ? '⏳ Loading...' : '📥 Load More'}
            </button>
          )}
          {!pagination.hasMore && pagination.total > 0 && (
            <span className="text-sm text-gray-500">All results loaded ✓</span>
          )}
        </div>
      </div>
    </div>
  )
}
