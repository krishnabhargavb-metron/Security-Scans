const API_BASE_URL = 'http://localhost:8000'

export interface ApiResponse<T> {
  data?: T
  status: number
  ok: boolean
  error?: {
    message: string
    status: number
  }
}

export const apiService = {
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      })

      const data = await response.json().catch(() => ({}))

      return {
        data: response.ok ? data : undefined,
        status: response.status,
        ok: response.ok,
        error: !response.ok
          ? {
              message: data?.detail || data?.message || 'API request failed',
              status: response.status
            }
          : undefined
      }
    } catch (error) {
      return {
        status: 0,
        ok: false,
        error: {
          message: error instanceof Error ? error.message : 'Network error occurred',
          status: 0
        }
      }
    }
  },

  async post<T>(endpoint: string, body?: object, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined
      })

      const data = await response.json().catch(() => ({}))

      return {
        data: response.ok ? data : undefined,
        status: response.status,
        ok: response.ok,
        error: !response.ok
          ? {
              message: data?.detail || data?.message || 'API request failed',
              status: response.status
            }
          : undefined
      }
    } catch (error) {
      return {
        status: 0,
        ok: false,
        error: {
          message: error instanceof Error ? error.message : 'Network error occurred',
          status: 0
        }
      }
    }
  }
}

