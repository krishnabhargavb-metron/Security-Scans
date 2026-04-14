import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from './useToast'
import { toast as sonnerToast } from 'sonner'

describe('useToast', () => {
  it('should return toast object with all methods', () => {
    const { result } = renderHook(() => useToast())

    expect(result.current).toHaveProperty('success')
    expect(result.current).toHaveProperty('error')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('info')
  })

  it('should call sonner.success for success toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('Success message')
    })

    expect(sonnerToast.success).toHaveBeenCalledWith(
      'Success message',
      expect.objectContaining({
        duration: 4000,
      })
    )
  })

  it('should call sonner.error for error toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.error('Error message')
    })

    expect(sonnerToast.error).toHaveBeenCalledWith(
      'Error message',
      expect.objectContaining({
        duration: 4000,
      })
    )
  })

  it('should call sonner.loading for loading toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.loading('Loading...')
    })

    expect(sonnerToast.loading).toHaveBeenCalledWith(
      'Loading...',
      expect.objectContaining({
        duration: 4000,
      })
    )
  })

  it('should support custom duration', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('Message', { duration: 5000 })
    })

    expect(sonnerToast.success).toHaveBeenCalledWith(
      'Message',
      expect.objectContaining({
        duration: 5000,
      })
    )
  })

  it('should support description', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('Title', { description: 'Description' })
    })

    expect(sonnerToast.success).toHaveBeenCalledWith(
      'Title',
      expect.objectContaining({
        description: 'Description',
      })
    )
  })

  it('should use default duration of 4000ms', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.info('Message')
    })

    expect(sonnerToast).toHaveBeenCalledWith(
      'Message',
      expect.objectContaining({
        duration: 4000,
      })
    )
  })

  it('should call sonner for info toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.info('Info message')
    })

    expect(sonnerToast).toHaveBeenCalledWith(
      'Info message',
      expect.objectContaining({
        duration: 4000,
      })
    )
  })
})
