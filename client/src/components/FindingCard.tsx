import React from 'react'

export interface Finding {
  projectName: string
  issue: string
  severity: 'High' | 'Medium' | 'Low'
  category: string
  filePath?: string
  description: string
}

interface FindingCardProps {
  finding: Finding
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'High':
      return 'bg-red-50 border-red-200 text-red-900'
    case 'Medium':
      return 'bg-orange-50 border-orange-200 text-orange-900'
    case 'Low':
      return 'bg-green-50 border-green-200 text-green-900'
    default:
      return 'bg-gray-50 border-gray-200 text-gray-900'
  }
}

const getSeverityBadgeColor = (severity: string) => {
  switch (severity) {
    case 'High':
      return 'bg-red-100 text-red-800'
    case 'Medium':
      return 'bg-orange-100 text-[#FC6D26]'
    case 'Low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
  return (
    <div className={`border-l-4 p-4 rounded-md ${getSeverityColor(finding.severity)}`}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-lg">{finding.issue}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityBadgeColor(finding.severity)}`}>
              {finding.severity}
            </span>
          </div>
          
          <p className="text-sm opacity-75 mb-2">{finding.description}</p>
          
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Project:</span> {finding.projectName}</p>
            <p><span className="font-medium">Category:</span> {finding.category}</p>
            {finding.filePath && (
              <p><span className="font-medium">File:</span> <code className="bg-black/10 px-2 py-1 rounded text-xs">{finding.filePath}</code></p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
