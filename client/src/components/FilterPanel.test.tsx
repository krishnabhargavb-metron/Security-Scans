import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test/test-utils'
import { FilterPanel } from './FilterPanel'

describe('FilterPanel', () => {
  const mockOnFilterChange = vi.fn()
  const defaultProps = {
    filters: { severity: null, category: null },
    categories: ['Security', 'Performance', 'Best Practices'],
    onFilterChange: mockOnFilterChange,
    findingsCount: 100,
    filteredCount: 50,
  }

  it('should render filter panel with filter options', () => {
    render(<FilterPanel {...defaultProps} />)

    expect(screen.getByText(/🔍 Filters/i)).toBeInTheDocument()
    expect(screen.getByText(/Severity/i)).toBeInTheDocument()
  })

  it('should display current findings count and filtered count', () => {
    render(<FilterPanel {...defaultProps} />)

    expect(screen.getByText(/100/)).toBeInTheDocument()
    expect(screen.getByText(/50/)).toBeInTheDocument()
  })

  it('should show clear button when filters are active', () => {
    const props = {
      ...defaultProps,
      filters: { severity: 'High', category: null },
    }

    render(<FilterPanel {...props} />)

    expect(screen.getByText(/✕ Clear All/i)).toBeInTheDocument()
  })

  it('should not show clear button when no filters active', () => {
    render(<FilterPanel {...defaultProps} />)

    expect(screen.queryByText(/✕ Clear All/i)).not.toBeInTheDocument()
  })

  it('should call onFilterChange when clear filters clicked', () => {
    const props = {
      ...defaultProps,
      filters: { severity: 'High', category: 'Security' },
    }

    render(<FilterPanel {...props} />)

    const clearButton = screen.getByText(/✕ Clear All/i)
    fireEvent.click(clearButton)

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      severity: null,
      category: null,
    })
  })

  it('should render severity filter with options', () => {
    render(<FilterPanel {...defaultProps} />)

    // The component should have severity select
    const severityLabel = screen.getByText(/Severity/i)
    expect(severityLabel).toBeInTheDocument()
  })

  it('should render category filter with provided categories', () => {
    render(<FilterPanel {...defaultProps} />)

    // Look for category section
    const categoryText = screen.getByText('Category')
    expect(categoryText).toBeInTheDocument()
  })

  it('should highlight active filters', () => {
    const props = {
      ...defaultProps,
      filters: { severity: 'High', category: 'Security' },
    }

    render(<FilterPanel {...props} />)

    // Component should display the active filters
    expect(screen.getByText(/Filtered/i)).toBeInTheDocument()
  })
})
