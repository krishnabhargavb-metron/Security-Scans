import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock sonner for toast notifications
vi.mock('sonner', () => {
  const toast = vi.fn()
  toast.success = vi.fn()
  toast.error = vi.fn()
  toast.loading = vi.fn()
  return {
    toast,
    Toaster: () => null,
  }
})

// Mock fetch globally
global.fetch = vi.fn()
