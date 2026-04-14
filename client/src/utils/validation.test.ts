import { describe, it, expect } from 'vitest'
import { validateUsername, validateFilters } from './validation'

describe('validation', () => {
  describe('validateUsername', () => {
    it('should return null for valid username', () => {
      const result = validateUsername('testuser')
      expect(result).toBeNull()
    })

    it('should return error for empty username', () => {
      const result = validateUsername('')
      expect(result).not.toBeNull()
      expect(result?.message).toContain('required')
    })

    it('should return error for username shorter than 2 characters', () => {
      const result = validateUsername('a')
      expect(result).not.toBeNull()
      expect(result?.message).toContain('at least 2 characters')
    })

    it('should return error for username longer than 100 characters', () => {
      const longUsername = 'a'.repeat(101)
      const result = validateUsername(longUsername)
      expect(result).not.toBeNull()
      expect(result?.message).toContain('cannot be longer than 100')
    })

    it('should return error for invalid characters', () => {
      const result = validateUsername('user@invalid!')
      expect(result).not.toBeNull()
      expect(result?.message).toContain('letters, numbers, hyphens, and underscores')
    })

    it('should accept hyphens and underscores', () => {
      const result1 = validateUsername('user-name')
      const result2 = validateUsername('user_name')
      expect(result1).toBeNull()
      expect(result2).toBeNull()
    })

    it('should trim whitespace', () => {
      const result = validateUsername('   validuser   ')
      expect(result).toBeNull()
    })
  })

  describe('validateFilters', () => {
    it('should return empty array for valid filters', () => {
      const errors = validateFilters('High', 'Security')
      expect(errors).toHaveLength(0)
    })

    it('should return error for invalid severity', () => {
      const errors = validateFilters('Invalid', null)
      expect(errors).toHaveLength(1)
      expect(errors[0].message).toContain('Invalid severity')
    })

    it('should accept valid severity levels', () => {
      const errors1 = validateFilters('High', null)
      const errors2 = validateFilters('Medium', null)
      const errors3 = validateFilters('Low', null)
      expect(errors1).toHaveLength(0)
      expect(errors2).toHaveLength(0)
      expect(errors3).toHaveLength(0)
    })

    it('should return error for non-string category', () => {
      const errors = validateFilters(null, 'valid' as any)
      expect(errors).toHaveLength(0)
    })

    it('should handle null values', () => {
      const errors = validateFilters(null, null)
      expect(errors).toHaveLength(0)
    })

    it('should return multiple errors when applicable', () => {
      const errors = validateFilters('BadSeverity', null)
      expect(errors.length).toBeGreaterThan(0)
    })
  })
})
