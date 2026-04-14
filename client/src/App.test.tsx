import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from './test/test-utils'
import App from './App'
import { toast } from 'sonner'

describe('App - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('should render app with header and scan form', () => {
    render(<App />)

    expect(screen.getByText(/🔐 GitHub Security Dashboard/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g., torvalds, kubernetes/i)).toBeInTheDocument()
  })

  it('should fetch categories on mount', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ categories: ['Security', 'Performance'] }),
    })

    render(<App />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/scan'),
        expect.any(Object)
      )
    })
  })

  it('should handle scan form submission with valid data', async () => {
    const mockResponse = {
      items: [
        {
          projectName: 'test-project',
          issue: 'SQL Injection',
          severity: 'High' as const,
          category: 'Security',
          description: 'Test vulnerability',
        },
      ],
      total: 1,
      limit: 10,
      offset: 0,
      hasMore: false,
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ categories: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

    render(<App />)

    // Fill in username and submit
    const input = screen.getByPlaceholderText(/e.g., torvalds, kubernetes/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'testuser' } })

    const button = screen.getByRole('button', { name: /🚀 Scan/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('SQL Injection')).toBeInTheDocument()
    })
  })

  it('should show success toast on successful scan', async () => {
    const mockResponse = {
      items: [
        {
          projectName: 'test-project',
          issue: 'SQL Injection',
          severity: 'High' as const,
          category: 'Security',
          description: 'Test vulnerability',
        },
      ],
      total: 1,
      limit: 10,
      offset: 0,
      hasMore: false,
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ categories: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

    render(<App />)

    const input = screen.getByPlaceholderText(/e.g., torvalds, kubernetes/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'testuser' } })

    const button = screen.getByRole('button', { name: /🚀 Scan/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    })
  })

  it('should show error toast on failed scan', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ categories: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'User not found' }),
      })

    render(<App />)

    const input = screen.getByPlaceholderText(/e.g., torvalds, kubernetes/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'nonexistentuser' } })

    const button = screen.getByRole('button', { name: /🚀 Scan/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })

  it('should validate username before submission', async () => {
    render(<App />)

    const input = screen.getByPlaceholderText(/e.g., torvalds, kubernetes/i) as HTMLInputElement
    const button = screen.getByRole('button', { name: /🚀 Scan/i })

    // Button should be disabled when input is empty
    fireEvent.change(input, { target: { value: '' } })
    expect((button as HTMLButtonElement).disabled).toBe(true)

    // Button should be enabled when input has value
    fireEvent.change(input, { target: { value: 'validuser' } })
    expect((button as HTMLButtonElement).disabled).toBe(false)
  })

  it('should display empty state when no findings', () => {
    render(<App />)

    // Empty state should show by default
    expect(screen.getByText(/Scan repositories/i)).toBeInTheDocument()
  })

  it('should handle network errors gracefully', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ categories: [] }),
      })
      .mockRejectedValueOnce(new Error('Network error'))

    render(<App />)

    const input = screen.getByPlaceholderText(/e.g., torvalds, kubernetes/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'testuser' } })

    const button = screen.getByRole('button', { name: /🚀 Scan/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })

  it('should handle rate limiting error (429)', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ categories: [] }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ detail: 'Too many requests' }),
      })

    render(<App />)

    const input = screen.getByPlaceholderText(/e.g., torvalds, kubernetes/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'testuser' } })

    const button = screen.getByRole('button', { name: /🚀 Scan/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })

  it('should display findings with proper categories and filters', async () => {
    const mockResponse = {
      items: [
        {
          projectName: 'project1',
          issue: 'SQL Injection',
          severity: 'High' as const,
          category: 'Security',
          description: 'Test',
        },
        {
          projectName: 'project2',
          issue: 'Performance Issue',
          severity: 'Low' as const,
          category: 'Performance',
          description: 'Test',
        },
      ],
      total: 2,
      limit: 10,
      offset: 0,
      hasMore: false,
    }

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ categories: ['Security', 'Performance'] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      })

    render(<App />)

    const input = screen.getByPlaceholderText(/e.g., torvalds, kubernetes/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'testuser' } })

    const button = screen.getByRole('button', { name: /🚀 Scan/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('SQL Injection')).toBeInTheDocument()
      expect(screen.getByText('Performance Issue')).toBeInTheDocument()
    })
  })
})
