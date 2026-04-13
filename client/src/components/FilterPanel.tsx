import React from 'react'

export interface Filters {
  severity?: 'High' | 'Medium' | 'Low' | null
  category?: string | null
}

interface FilterPanelProps {
  filters: Filters
  categories: string[]
  onFilterChange: (filters: Filters) => void
  findingsCount: number
  filteredCount: number
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  categories,
  onFilterChange,
  findingsCount,
  filteredCount
}) => {
  const handleClearFilters = () => {
    onFilterChange({
      severity: null,
      category: null
    })
  }

  const hasActiveFilters = filters.severity || filters.category

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">🔍 Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold underline"
          >
            ✕ Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Severity
          </label>
          <select
            value={filters.severity || ''}
            onChange={(e) => {
              const value = e.target.value
              onFilterChange({
                ...filters,
                severity: (value || null) as 'High' | 'Medium' | 'Low' | null
              })
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Severities</option>
            <option value="High">🔴 High</option>
            <option value="Medium">🟡 Medium</option>
            <option value="Low">🔵 Low</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Category
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => {
              const value = e.target.value
              onFilterChange({
                ...filters,
                category: value || null
              })
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-600">Showing</p>
            <p className="text-xl font-bold text-blue-600">{filteredCount}/{findingsCount}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
