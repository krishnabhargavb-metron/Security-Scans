import { describe, it, expect, beforeEach, vi } from 'vitest'
import { apiService } from './apiService'

describe('apiService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('get', () => {
    it('should return successful response with data', async () => {
      const mockData = { items: [], total: 0 }
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      })

      const result = await apiService.get('/test')

      expect(result.ok).toBe(true)
      expect(result.status).toBe(200)
      expect(result.data).toEqual(mockData)
      expect(result.error).toBeUndefined()
    })

    it('should return error response with detail message', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'User not found' }),
      })

      const result = await apiService.get('/nonexistent')

      expect(result.ok).toBe(false)
      expect(result.status).toBe(404)
      expect(result.data).toBeUndefined()
      expect(result.error?.message).toBe('User not found')
      expect(result.error?.status).toBe(404)
    })

    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

      const result = await apiService.get('/test')

      expect(result.ok).toBe(false)
      expect(result.status).toBe(0)
      expect(result.data).toBeUndefined()
      expect(result.error?.message).toBe('Network error')
    })

    it('should handle JSON parse errors', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON')
        },
      })

      const result = await apiService.get('/test')

      expect(result.ok).toBe(false)
      expect(result.status).toBe(500)
      expect(result.error?.message).toBe('API request failed')
    })

    it('should include custom headers in request', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      })

      const headers = { Authorization: 'Bearer token123' }
      await apiService.get('/test', headers)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          headers: expect.objectContaining(headers),
        })
      )
    })
  })

  describe('post', () => {
    it('should return successful response with data', async () => {
      const mockData = { success: true }
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      })

      const result = await apiService.post('/test', { name: 'test' })

      expect(result.ok).toBe(true)
      expect(result.status).toBe(200)
      expect(result.data).toEqual(mockData)
    })

    it('should handle POST errors', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: 'Bad request' }),
      })

      const result = await apiService.post('/test', { invalid: 'data' })

      expect(result.ok).toBe(false)
      expect(result.error?.message).toBe('Bad request')
    })

    it('should stringify body correctly', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      })

      const body = { key: 'value' }
      await apiService.post('/test', body)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify(body),
        })
      )
    })
  })
})
