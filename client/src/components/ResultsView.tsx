import React from 'react'
import type { Finding } from './FindingCard'
import { exportAsJSON, exportAsPDF } from '../utils/exportReport'

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
  if (isLoading) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-12 text-center">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              📄 JSON
            </button>
            <button
              onClick={() => exportAsPDF(findings, username)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              📋 PDF
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <p className="text-gray-600 text-sm font-semibold">📊 Total</p>
          <p className="text-4xl font-bold text-gray-900 mt-2">{pagination.total}</p>
        </div>
        <div className="bg-red-50 border border-red-300 rounded-lg shadow-lg p-4">
          <p className="text-red-700 text-sm font-semibold">🔴 High</p>
          <p className="text-4xl font-bold text-red-600 mt-2">{highCount}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg shadow-lg p-4">
          <p className="text-yellow-700 text-sm font-semibold">🟡 Medium</p>
          <p className="text-4xl font-bold text-yellow-600 mt-2">{mediumCount}</p>
        </div>
        <div className="bg-blue-50 border border-blue-300 rounded-lg shadow-lg p-4">
          <p className="text-blue-700 text-sm font-semibold">🔵 Low</p>
          <p className="text-4xl font-bold text-blue-600 mt-2">{lowCount}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="px-6 py-4 text-left text-sm font-bold">Severity</th>
                <th className="px-6 py-4 text-left text-sm font-bold">Issue</th>
                <th className="px-6 py-4 text-left text-sm font-bold">Project</th>
                <th className="px-6 py-4 text-left text-sm font-bold">Category</th>
                <th className="px-6 py-4 text-left text-sm font-bold">File</th>
                <th className="px-6 py-4 text-left text-sm font-bold">Description</th>
              </tr>
            </thead>
            <tbody>
              {findings.map((finding) => {
                // Create unique key from finding data
                const uniqueKey = `${finding.projectName}-${finding.filePath || 'no-file'}-${finding.issue}`
                
                const severityEmoji = {
                  'High': '🔴',
                  'Medium': '🟡',
                  'Low': '🔵'
                }[finding.severity] || '⚪'

                const severityBgColor = {
                  'High': 'hover:bg-red-50',
                  'Medium': 'hover:bg-yellow-50',
                  'Low': 'hover:bg-blue-50'
                }[finding.severity] || 'hover:bg-gray-50'

                return (
                  <tr key={uniqueKey} className={`border-t border-gray-200 ${severityBgColor} transition-colors`}>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{severityEmoji} {finding.severity}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{finding.issue}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{finding.projectName}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{finding.category}</td>
                    <td className="px-6 py-4 text-sm">
                      {finding.filePath ? (
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-800">{finding.filePath}</code>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{finding.description}</td>
                  </tr>
                )
              })}
              
              {/* Loading skeleton while fetching more data */}
              {isLoadingMore && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <tr key={`skeleton-${i}`} className="border-t border-gray-200 bg-gray-50">
                      <td className="px-6 py-4"><div className="h-4 bg-gray-300 rounded w-12 animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-300 rounded w-16 animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-300 rounded w-32 animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-300 rounded w-40 animate-pulse"></div></td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-gray-50 border-t border-gray-300 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing <span className="font-semibold">{pagination.offset + 1}</span> to <span className="font-semibold">{Math.min(pagination.offset + findings.length, pagination.total)}</span> of <span className="font-semibold">{pagination.total}</span> findings
          </div>
          {pagination.hasMore && (
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
