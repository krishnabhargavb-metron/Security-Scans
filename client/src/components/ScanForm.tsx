import React, { useState } from 'react'
import { validateUsername, type ValidationError } from '../utils/validation'

interface ScanFormProps {
  onScan: (username: string, pat?: string) => void
  isLoading: boolean
  error?: string
}

export const ScanForm: React.FC<ScanFormProps> = ({ onScan, isLoading, error }) => {
  const [username, setUsername] = useState('')
  const [validationError, setValidationError] = useState<ValidationError | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [pat, setPat] = useState('')
  const [showTooltip, setShowTooltip] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const error = validateUsername(username)
    if (error) {
      setValidationError(error)
      return
    }

    onScan(username.trim(), pat.trim() || undefined)
  }

  const handleUsernameChange = (value: string) => {
    setUsername(value)
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null)
    }
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">🔍 Scan Repository</h2>
      <p className="text-gray-600 mb-6">
        Enter a GitHub username or group name to scan for vulnerabilities.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
            GitHub Username or Group Name
          </label>
          <div className="flex gap-3">
            <input
              id="username"
              type="text"
              placeholder="e.g., torvalds, kubernetes"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              disabled={isLoading}
              className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all ${
                validationError
                  ? 'border-red-300 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-blue-500 focus:ring-2'
              }`}
            />
            <button
              type="submit"
              disabled={isLoading || !username.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? '⏳ Scanning...' : '🚀 Scan'}
            </button>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div className="flex items-center gap-2 mt-3">
          <div className="relative group">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Advanced Options"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.236a2 2 0 011.35 0l5.206 2.05A2 2 0 0119 8.236v8.528a2 2 0 01-1.119 1.95l-5.206 2.05a2 2 0 01-1.35 0l-5.206-2.05A2 2 0 015 16.764V8.236a2 2 0 011.119-1.95l5.206-2.05z" />
              </svg>
            </button>
            
            {/* Tooltip */}
            {showTooltip && (
              <div className="absolute bottom-full left-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                Advanced Options
                <div className="absolute top-full left-2 border-4 border-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>
          
          <span className="text-sm text-gray-600">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              {showAdvanced ? '▼ Hide Advanced Options' : '▶ Show Advanced Options'}
            </button>
          </span>
        </div>

        {/* Advanced Options Content */}
        {showAdvanced && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <div>
              <label htmlFor="pat" className="block text-sm font-semibold text-gray-700 mb-2">
                🔐 Personal Access Token (Optional)
              </label>
              <input
                id="pat"
                type="password"
                placeholder="Enter your GitHub PAT for increased rate limits"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-600 mt-2">
                💡 Using a PAT allows scanning private repositories and increases API rate limits.
              </p>
            </div>
          </div>
        )}

        {validationError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-900 text-sm">
            <p className="font-bold mb-1">⚠️ Validation Error</p>
            <p>{validationError.message}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-900 text-sm">
            <p className="font-bold mb-1">❌ Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <span className="text-2xl">🔐</span>
            <div>
              <p className="font-semibold text-gray-900">Sensitive Files</p>
              <p className="text-sm text-gray-600">.env, keys, credentials</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <span className="text-2xl">🔑</span>
            <div>
              <p className="font-semibold text-gray-900">Exposed Secrets</p>
              <p className="text-sm text-gray-600">API keys & tokens</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <span className="text-2xl">📚</span>
            <div>
              <p className="font-semibold text-gray-900">Missing Metadata</p>
              <p className="text-sm text-gray-600">README & LICENSE</p>
            </div>
          </div>
        </div> */}
      </form>
    </div>
  )
}
