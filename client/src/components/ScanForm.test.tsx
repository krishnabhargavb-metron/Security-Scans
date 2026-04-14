import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../test/test-utils'
import { ScanForm } from './ScanForm'

describe('ScanForm', () => {
  const mockOnScan = vi.fn()

  it('should render scan form with input and button', () => {
    render(<ScanForm onScan={mockOnScan} isLoading={false} />)

    expect(screen.getByPlaceholderText(/e.g., torvalds, kubernetes/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /🚀 Scan/i })).toBeInTheDocument()
  })

  it('should disable inputs and button when loading', () => {
    render(<ScanForm onScan={mockOnScan} isLoading={true} />)

    const input = screen.getByPlaceholderText(/e.g., torvalds, kubernetes/i) as HTMLInputElement
    const button = screen.getByRole('button', { name: /⏳ Scanning/i })

    expect(input.disabled).toBe(true)
    expect(button.disabled).toBe(true)
  })

  it('should show validation error for empty username', async () => {
    render(<ScanForm onScan={mockOnScan} isLoading={false} />)

    const form = screen.getByRole('button', { name: /🚀 Scan/i }).closest('form')
    if (form) {
      fireEvent.submit(form)
    }

    await waitFor(() => {
      expect(screen.getByText(/Username is required/i)).toBeInTheDocument()
    })
  })

  it('should show validation error for short username', async () => {
    render(<ScanForm onScan={mockOnScan} isLoading={false} />)

    const input = screen.getByPlaceholderText(/e.g., torvalds, kubernetes/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'a' } })

    const form = input.closest('form')
    if (form) {
      fireEvent.submit(form)
    }

    await waitFor(() => {
      expect(screen.getByText(/at least 2 characters/i)).toBeInTheDocument()
    })
  })

  it('should call onScan with valid username', async () => {
    render(<ScanForm onScan={mockOnScan} isLoading={false} />)

    const input = screen.getByPlaceholderText(/e.g., torvalds, kubernetes/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'testuser' } })

    const button = screen.getByRole('button', { name: /🚀 Scan/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockOnScan).toHaveBeenCalledWith('testuser', undefined)
    })
  })

  it('should call onScan with username and PAT', async () => {
    render(<ScanForm onScan={mockOnScan} isLoading={false} />)

    const input = screen.getByPlaceholderText(/e.g., torvalds, kubernetes/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'testuser' } })

    // Open advanced options
    const advancedButton = screen.getByText(/Show Advanced Options/i)
    fireEvent.click(advancedButton)

    // Fill PAT
    await waitFor(() => {
      const patInput = screen.getByPlaceholderText(/Enter your GitHub PAT/i) as HTMLInputElement
      fireEvent.change(patInput, { target: { value: 'token123' } })
    })

    const button = screen.getByRole('button', { name: /🚀 Scan/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockOnScan).toHaveBeenCalledWith('testuser', 'token123')
    })
  })

  it('should toggle advanced options', async () => {
    render(<ScanForm onScan={mockOnScan} isLoading={false} />)

    const advancedButton = screen.getByText(/Show Advanced Options/i)
    expect(advancedButton).toBeInTheDocument()

    fireEvent.click(advancedButton)

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Enter your GitHub PAT/i)).toBeInTheDocument()
    })

    const hideButton = screen.getByText(/Hide Advanced Options/i)
    fireEvent.click(hideButton)

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Enter your GitHub PAT/i)).not.toBeInTheDocument()
    })
  })

  it('should clear validation error when user starts typing', async () => {
    render(<ScanForm onScan={mockOnScan} isLoading={false} />)

    // Trigger validation error
    const form = screen.getByRole('button', { name: /🚀 Scan/i }).closest('form')
    if (form) {
      fireEvent.submit(form)
    }

    await waitFor(() => {
      expect(screen.getByText(/Username is required/i)).toBeInTheDocument()
    })

    // Start typing
    const input = screen.getByPlaceholderText(/e.g., torvalds, kubernetes/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'a' } })

    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText(/Username is required/i)).not.toBeInTheDocument()
    })
  })

  it('should disable button when username is empty', () => {
    render(<ScanForm onScan={mockOnScan} isLoading={false} />)

    const button = screen.getByRole('button', { name: /🚀 Scan/i }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
  })

  it('should enable button when username is provided', () => {
    render(<ScanForm onScan={mockOnScan} isLoading={false} />)

    const input = screen.getByPlaceholderText(/e.g., torvalds, kubernetes/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: 'validuser' } })

    const button = screen.getByRole('button', { name: /🚀 Scan/i }) as HTMLButtonElement
    expect(button.disabled).toBe(false)
  })

  it('should trim whitespace from username', async () => {
    render(<ScanForm onScan={mockOnScan} isLoading={false} />)

    const input = screen.getByPlaceholderText(/e.g., torvalds, kubernetes/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '  testuser  ' } })

    const button = screen.getByRole('button', { name: /🚀 Scan/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockOnScan).toHaveBeenCalledWith('testuser', undefined)
    })
  })
})
