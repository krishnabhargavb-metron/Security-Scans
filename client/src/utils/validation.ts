export interface ValidationError {
  field: string
  message: string
}

export const validateUsername = (username: string): ValidationError | null => {
  const trimmed = username.trim()

  if (!trimmed) {
    return {
      field: 'username',
      message: 'Username is required'
    }
  }

  if (trimmed.length < 2) {
    return {
      field: 'username',
      message: 'Username must be at least 2 characters long'
    }
  }

  if (trimmed.length > 100) {
    return {
      field: 'username',
      message: 'Username cannot be longer than 100 characters'
    }
  }

  // Allow alphanumeric, hyphens, and underscores (GitHub/GitLab standards)
  if (!/^[a-zA-Z0-9\-_]+$/.test(trimmed)) {
    return {
      field: 'username',
      message: 'Username can only contain letters, numbers, hyphens, and underscores'
    }
  }

  return null
}

export const validateFilters = (severity: string | null, category: string | null): ValidationError[] => {
  const errors: ValidationError[] = []

  const validSeverities = ['High', 'Medium', 'Low']
  if (severity && !validSeverities.includes(severity)) {
    errors.push({
      field: 'severity',
      message: 'Invalid severity level selected'
    })
  }

  if (category && typeof category !== 'string') {
    errors.push({
      field: 'category',
      message: 'Invalid category selected'
    })
  }

  return errors
}

export const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('fetch')) {
      return 'Unable to connect to the server. Please check your connection or try again later.'
    }
    // User not found or other API errors
    if (error.message.includes('404') || error.message.includes('not found')) {
      return 'Username not found. Please check the spelling and try again.'
    }
    // Rate limiting
    if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
      return 'Too many requests. Please wait a moment and try again.'
    }
    // Server errors
    if (error.message.includes('500')) {
      return 'Server error occurred. Please try again later.'
    }
    return error.message
  }
  return 'An unexpected error occurred. Please try again.'
}
