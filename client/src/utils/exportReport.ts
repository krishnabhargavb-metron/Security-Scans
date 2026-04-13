import type { Finding } from '../components/FindingCard'

interface ReportData {
  username: string
  scanDate: string
  totalFindings: number
  findingsBySeverity: {
    high: number
    medium: number
    low: number
  }
  findings: Finding[]
}

export const exportAsJSON = (findings: Finding[], username: string) => {
  if (findings.length === 0) {
    alert('No findings to export')
    return
  }

  const reportData: ReportData = {
    username,
    scanDate: new Date().toISOString(),
    totalFindings: findings.length,
    findingsBySeverity: {
      high: findings.filter(f => f.severity === 'High').length,
      medium: findings.filter(f => f.severity === 'Medium').length,
      low: findings.filter(f => f.severity === 'Low').length
    },
    findings
  }

  const dataStr = JSON.stringify(reportData, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `security-report-${username}-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const exportAsPDF = (findings: Finding[], username: string) => {
  if (findings.length === 0) {
    alert('No findings to export')
    return
  }

  const highCount = findings.filter(f => f.severity === 'High').length
  const mediumCount = findings.filter(f => f.severity === 'Medium').length
  const lowCount = findings.filter(f => f.severity === 'Low').length

  // Create a new window with printable HTML
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please enable pop-ups to export as PDF')
    return
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Security Report - ${username}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 40px;
          }
          .header {
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          h1 {
            color: #1e40af;
            margin-bottom: 10px;
          }
          .scan-info {
            color: #666;
            font-size: 14px;
          }
          .summary {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
            text-align: center;
          }
          .summary-card.high { background-color: #fee2e2; border-color: #fca5a5; }
          .summary-card.medium { background-color: #fef3c7; border-color: #fcd34d; }
          .summary-card.low { background-color: #dbeafe; border-color: #93c5fd; }
          .summary-number {
            font-size: 32px;
            font-weight: bold;
            margin: 10px 0;
          }
          .summary-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th {
            background-color: #2563eb;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
          }
          td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .page-break {
            page-break-after: always;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔒 Security Vulnerability Report</h1>
          <div class="scan-info">
            <p><strong>Username/Organization:</strong> ${username}</p>
            <p><strong>Scan Date:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Findings:</strong> ${findings.length}</p>
          </div>
        </div>

        <div class="summary">
          <div class="summary-card high">
            <div class="summary-label">🔴 High Severity</div>
            <div class="summary-number">${highCount}</div>
          </div>
          <div class="summary-card medium">
            <div class="summary-label">🟡 Medium Severity</div>
            <div class="summary-number">${mediumCount}</div>
          </div>
          <div class="summary-card low">
            <div class="summary-label">🔵 Low Severity</div>
            <div class="summary-number">${lowCount}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">📊 Total Issues</div>
            <div class="summary-number">${findings.length}</div>
          </div>
        </div>

        <h2 style="margin-top: 30px; margin-bottom: 15px; color: #1e40af;">Detailed Findings</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 10%;">Severity</th>
              <th style="width: 15%;">Issue</th>
              <th style="width: 15%;">Project</th>
              <th style="width: 12%;">Category</th>
              <th style="width: 25%;">File</th>
              <th style="width: 23%;">Description</th>
            </tr>
          </thead>
          <tbody>
            ${findings.map(finding => `
              <tr>
                <td>${finding.severity}</td>
                <td>${finding.issue}</td>
                <td>${finding.projectName}</td>
                <td>${finding.category}</td>
                <td><code style="background: #f0f0f0; padding: 2px 4px;">${finding.filePath || '-'}</code></td>
                <td>${finding.description}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>Generated by GitLab Security Scanner | ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
  printWindow.print()
}
