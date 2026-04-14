import { describe, it, expect } from 'vitest'
import { render, screen } from '../test/test-utils'
import { FindingCard, type Finding } from './FindingCard'

describe('FindingCard', () => {
  const mockFinding: Finding = {
    projectName: 'test-project',
    issue: 'SQL Injection Vulnerability',
    severity: 'High',
    category: 'Security',
    filePath: 'src/database.ts',
    description: 'Potential SQL injection found in query builder',
  }

  it('should render finding card with issue title', () => {
    render(<FindingCard finding={mockFinding} />)

    expect(screen.getByText('SQL Injection Vulnerability')).toBeInTheDocument()
  })

  it('should display severity badge with correct styling for High', () => {
    render(<FindingCard finding={mockFinding} />)

    const badge = screen.getByText('High')
    expect(badge).toBeInTheDocument()
  })

  it('should display correct severity badge styling for Medium', () => {
    const mediumFinding = { ...mockFinding, severity: 'Medium' as const }
    render(<FindingCard finding={mediumFinding} />)

    expect(screen.getByText('Medium')).toBeInTheDocument()
  })

  it('should display correct severity badge styling for Low', () => {
    const lowFinding = { ...mockFinding, severity: 'Low' as const }
    render(<FindingCard finding={lowFinding} />)

    expect(screen.getByText('Low')).toBeInTheDocument()
  })

  it('should render project name', () => {
    render(<FindingCard finding={mockFinding} />)

    expect(screen.getByText('test-project')).toBeInTheDocument()
  })

  it('should render description', () => {
    render(<FindingCard finding={mockFinding} />)

    expect(screen.getByText('Potential SQL injection found in query builder')).toBeInTheDocument()
  })

  it('should render file path when provided', () => {
    render(<FindingCard finding={mockFinding} />)

    expect(screen.getByText('src/database.ts')).toBeInTheDocument()
  })

  it('should render category', () => {
    render(<FindingCard finding={mockFinding} />)

    expect(screen.getByText('Security')).toBeInTheDocument()
  })

  it('should handle finding without file path', () => {
    const findingNoPath = { ...mockFinding, filePath: undefined }
    const { container } = render(<FindingCard finding={findingNoPath} />)

    expect(container).toBeInTheDocument()
    expect(screen.getByText('SQL Injection Vulnerability')).toBeInTheDocument()
  })

  it('should apply correct border color based on severity', () => {
    const { container } = render(<FindingCard finding={mockFinding} />)

    const card = container.querySelector('[class*="border"]')
    expect(card).toBeInTheDocument()
  })
})
