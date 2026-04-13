# GitLab Security Scanner Dashboard

A comprehensive security scanning dashboard for GitLab repositories that detects vulnerabilities, exposed credentials, and missing repository metadata.

## Features

### 🔴 Three Categories of Risk Detection

#### 1. **Sensitive Files Detection**
Scans for accidentally committed sensitive files that could expose credentials or private information:
- `.env` - Environment variables files
- `.pem` - Private key files
- `id_rsa`, `id_dsa` - SSH private keys
- `config.json` - Configuration files
- `secrets.yml` - Secret configuration
- `.aws/credentials` - AWS credentials
- And more...

#### 2. **Exposed Credentials & Secrets**
Uses regex-based detection to find hardcoded secrets in code:
- AWS Access Keys (AKIA*)
- AWS Secret Keys
- GitLab Personal Access Tokens (glpat-*)
- GitHub Personal Access Tokens (ghp_*)
- Generic API Keys
- Passwords and Bearer Tokens
- Slack Tokens
- Private Keys (RSA, DSA, EC, etc.)

#### 3. **Missing Repository Metadata**
Checks for essential repository documentation:
- Missing `README.md` - Project documentation
- Missing `LICENSE` - License file

### 📊 Interactive Dashboard Features

- **Real-time Scanning** - Scan GitLab users or groups instantly
- **Smart Filtering** - Filter findings by severity level and risk category
- **Statistics Dashboard** - View at-a-glance vulnerability overview
- **Detailed Reports** - See file paths, descriptions, and severity for each finding
- **Category Breakdown** - Understand which risk categories are most prevalent

## Project Structure

```
gitlabScanner/
├── server/                  # FastAPI backend
│   └── app/
│       ├── main.py         # FastAPI application setup
│       └── routers/
│           └── scanner.py  # Scanning logic and risk detection
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx         # Main dashboard component
│   │   ├── components/
│   │   │   ├── ScanForm.tsx      # Input form for scanning
│   │   │   ├── FindingCard.tsx   # Individual finding display
│   │   │   ├── FilterPanel.tsx   # Filter controls
│   │   │   └── ResultsView.tsx   # Results display
│   │   └── index.css       # Global styles with Tailwind CSS
│   ├── package.json        # Frontend dependencies
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   └── postcss.config.js   # PostCSS configuration
└── README.md
```

## Setup & Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- GitLab Personal Access Token (for scanning public/private repos)

### Backend Setup

1. **Install Python dependencies:**
   ```bash
   cd server
   pip install fastapi python-gitlab python-dotenv uvicorn
   ```

2. **Set up environment variables:**
   Create a `.env` file in the server directory:
   ```
   GITLAB_TOKEN=your_gitlab_personal_access_token
   ```

3. **Run the backend server:**
   ```bash
   cd server
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Install Node dependencies:**
   ```bash
   cd client
   npm install
   ```

2. **Run the development server:**
   ```bash
   cd client
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## API Documentation

### Scanner Endpoints

#### Get Scan Metadata
```
GET /scan
```
Returns available risk categories and severity levels.

**Response:**
```json
{
  "categories": [
    "Sensitive Files",
    "Exposed Credentials",
    "Missing Repository Metadata"
  ],
  "severities": ["High", "Medium", "Low"]
}
```

#### Scan GitLab User/Group
```
GET /scan/{username}?severity={severity}&category={category}
```

**Parameters:**
- `username` (required): GitLab username or group name
- `severity` (optional): Filter by "High", "Medium", or "Low"
- `category` (optional): Filter by risk category

**Response:**
```json
[
  {
    "projectName": "my-project",
    "issue": "Sensitive file detected: .env",
    "severity": "High",
    "category": "Sensitive Files",
    "filePath": ".env",
    "description": "Environment variables file"
  },
  ...
]
```

## How to Use

1. **Start both servers:**
   - Backend: `uvicorn app.main:app --reload` (from server directory)
   - Frontend: `npm run dev` (from client directory)

2. **Open the dashboard:**
   Navigate to `http://localhost:5173` (or the port Vite shows)

3. **Enter a GitLab username or group name:**
   The dashboard will scan all public repositories for that user/group

4. **Review findings:**
   - View all findings with severity indicators
   - See statistics by category
   - Use filters to focus on specific severity levels or risk categories

5. **Analyze results:**
   - Click through findings to see detailed information
   - File paths show where issues were detected
   - Descriptions explain the risk

## Severity Levels

- **🔴 High**: Critical security issues that need immediate attention
  - Exposed credentials or private keys
  - Hardcoded API keys or tokens
  
- **🟡 Medium**: Important issues that should be addressed
  - Generic API keys in code
  - Password references

- **🔵 Low**: Informational issues or best practices
  - Missing README.md
  - Missing LICENSE file

## Risk Categories

- **Sensitive Files**: Detects accidentally committed sensitive files
- **Exposed Credentials**: Finds hardcoded secrets and credentials
- **Missing Repository Metadata**: Checks for documentation and licensing

## Configuration

### Tailwind CSS
Modify `tailwind.config.js` to customize colors and styling:
- Custom danger, warning, and safe colors are predefined
- Uses Tailwind Forms plugin for styled form elements

### Scanner Patterns
Modify the regex patterns in `server/app/routers/scanner.py` to:
- Add new secret patterns to detect
- Add new sensitive file patterns
- Adjust file types to scan

## Performance Considerations

- Scans up to 5 repositories per user/group (configurable in `scanner.py`)
- Checks up to 10 text files per repository for secrets
- Respects GitLab API rate limits
- Includes timeout handling for network issues

## Security Notes

- Your GitLab token is stored locally in the `.env` file
- Only scans public repositories by default (can be modified)
- The scanner respects GitLab's API access controls
- No data is stored on the server except during active scanning

## Troubleshooting

### CORS Errors
If you see CORS errors, ensure the backend is running and the `CORS_ORIGINS` in the fastapi app includes your frontend URL.

### No Repositories Found
- Ensure the username/group name is correct
- Check that the user/group has public repositories
- Verify your GitLab token has API access

### "VPN/Network blocked" Error
- Check your network connection
- If behind a VPN, ensure it's configured properly
- GitLab might rate limit if scanning too many repositories

## Future Enhancements

- [ ] Support private repository scanning with authentication
- [ ] Export reports as PDF/CSV
- [ ] Historical scanning trends
- [ ] Custom rule definitions
- [ ] Integration with CI/CD pipelines
- [ ] Webhook support for automatic scanning
- [ ] Database storage for scan history

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.
