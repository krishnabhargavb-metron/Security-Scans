import React from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false
}) => {
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = []
    const showPages = 3 // Number of pages to show around current page

    if (totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate range around current page
      let startPage = Math.max(2, currentPage - showPages)
      let endPage = Math.min(totalPages - 1, currentPage + showPages)

      // Add ellipsis if needed
      if (startPage > 2) {
        pages.push('...')
      }

      // Add pages around current
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // Add ellipsis if needed
      if (endPage < totalPages - 1) {
        pages.push('...')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }

  const handlePageClick = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage && !isLoading) {
      onPageChange(page)
    }
  }

  const pageNumbers = getPageNumbers()
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {/* Previous Button */}
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={!hasPrev || isLoading}
        className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200 transition-colors"
        title="Previous page"
      >
        ← Prev
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-gray-500 font-semibold"
              >
                ...
              </span>
            )
          }

          const isActive = currentPage === page
          return (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              disabled={isActive || isLoading}
              className={`px-3 py-2 rounded-lg font-semibold transition-colors ${
                isActive
                  ? 'bg-[#FC6D26] text-white border border-[#FC6D26]'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200'
              }`}
            >
              {page}
            </button>
          )
        })}
      </div>

      {/* Next Button */}
      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={!hasNext || isLoading}
        className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200 transition-colors"
        title="Next page"
      >
        Next →
      </button>

      {/* Page Info */}
      <div className="ml-4 text-sm text-gray-600 font-semibold">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  )
}
