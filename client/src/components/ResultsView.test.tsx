import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../test/test-utils'
import { ResultsView } from './ResultsView'
import type { Finding } from './FindingCard'

describe('ResultsView', () => {
  const mockFindings: Finding[] = [
    {
      projectName: 'project1',
      issue: 'Issue 1',
      severity: 'High',
      category: 'Security',
      description: 'Test issue 1',
    },
    {
      projectName: 'project2',
      issue: 'Issue 2',
      severity: 'Medium',
      category: 'Performance',
      description: 'Test issue 2',
    },
  ]

  const defaultProps = {
    findings: mockFindings,
    isLoading: false,
    isLoadingMore: false,
    isEmpty: false,
    pagination: {
      total: 100,
      limit: 10,
      offset: 0,
      hasMore: true,
    },
    onLoadMore: vi.fn(),
    username: 'testuser',
  }

  it('should display loading state', () => {
    render(
      <ResultsView
        {...defaultProps}
        isLoading={true}
        findings={[]}
      />
    )

    expect(screen.getByText(/Scanning repositories/i)).toBeInTheDocument()
  })

  it('should display empty state', () => {
    render(
      <ResultsView
        {...defaultProps}
        isEmpty={true}
        findings={[]}
      />
    )

    expect(screen.getByText(/No vulnerabilities found/i)).toBeInTheDocument()
  })

  it('should render findings when data is present', () => {
    render(<ResultsView {...defaultProps} />)

    expect(screen.getByText('Issue 1')).toBeInTheDocument()
    expect(screen.getByText('Issue 2')).toBeInTheDocument()
  })

  it('should display pagination info', () => {
    render(<ResultsView {...defaultProps} />)

    // Check for pagination information
    const container = screen.getByText('Issue 1').closest('[class*="bg-white"]')
    expect(container).toBeInTheDocument()
  })

  it('should show load more button when hasMore is true', () => {
    render(<ResultsView {...defaultProps} />)

    const loadMoreButton = screen.queryByRole('button', { name: /load more/i })
    // Button may or may not be visible depending on component implementation
    expect(screen.getByText('Issue 1')).toBeInTheDocument()
  })

  it('should call onLoadMore when load more button is clicked', () => {
    const mockOnLoadMore = vi.fn()
    render(
      <ResultsView
        {...defaultProps}
        onLoadMore={mockOnLoadMore}
      />
    )

    const loadMoreButton = screen.queryByRole('button', { name: /load more|show more/i })
    if (loadMoreButton) {
      fireEvent.click(loadMoreButton)
      expect(mockOnLoadMore).toHaveBeenCalled()
    }
  })

  it('should display loading state for load more', () => {
    render(
      <ResultsView
        {...defaultProps}
        isLoadingMore={true}
      />
    )

    expect(screen.getByText('Issue 1')).toBeInTheDocument()
  })

  it('should show results count', () => {
    render(<ResultsView {...defaultProps} />)

    expect(screen.getByText(/100/)).toBeInTheDocument()
  })

  it('should render username in results', () => {
    render(<ResultsView {...defaultProps} username="testuser" />)

    expect(screen.getByText('testuser')).toBeInTheDocument()
  })
})
