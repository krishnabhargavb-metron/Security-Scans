import concurrent.futures
import os
import re
from github import Github
from github.GithubException import UnknownObjectException, RateLimitExceededException
from fastapi import APIRouter, HTTPException, Query, Header
from dotenv import load_dotenv
from typing import List, Optional
from pydantic import BaseModel
from enum import Enum
from cachetools import TTLCache

load_dotenv()

router = APIRouter(prefix="/scan", tags=["Scanner Logic"])

# --- Cache Setup ---
# Stores 100 unique requests for 10 minutes
scan_cache = TTLCache(maxsize=100, ttl=600)

# --- Data Models ---
class SeverityEnum(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class RiskCategory(str, Enum):
    SENSITIVE_FILES = "Sensitive Files"
    EXPOSED_CREDENTIALS = "Exposed Credentials"
    MISSING_METADATA = "Missing Repository Metadata"

class Finding(BaseModel):
    projectName: str
    issue: str
    severity: SeverityEnum
    category: RiskCategory
    filePath: Optional[str] = None
    description: str

class PaginatedResponse(BaseModel):
    items: List[Finding]
    total: int
    limit: int
    offset: int
    hasMore: bool

# --- Configuration ---
SENSITIVE_FILES_DESC = {
    ".env": "Environment variables file",
    ".pem": "Private key file",
    "id_rsa": "SSH private key",
    "config.json": "Configuration file with potential secrets",
    "secrets.yml": "Secrets configuration",
}

SECRET_PATTERNS = {
    "GitHub Token": {"pattern": r"gh[p|o|u|s|r]_[a-zA-Z0-9]{36}", "severity": SeverityEnum.HIGH},
    "Generic API Key": {"pattern": r"(?i)(api[-_]?key|apikey)[\s]*[:=>]+[\s]*['\"]([a-zA-Z0-9\-_]{16,})['\"]", "severity": SeverityEnum.MEDIUM},
    "Hardcoded Password": {"pattern": r"(?i)(password|passwd|pwd)[\s]*[:=>]+[\s]*['\"]([^'\"]{6,})['\"]", "severity": SeverityEnum.MEDIUM}
}



# --- Helper Functions ---

def check_sensitive_files(filenames: List[str]) -> List[Finding]:
    findings = []
    EXACT_MATCHES = [".env", "config.json", "secrets.yml", "id_rsa"]
    EXTENSION_MATCHES = [".pem", ".key"]

    for path in filenames:
        fname = path.split('/')[-1].lower()
        if fname in EXACT_MATCHES or any(fname.endswith(ext) for ext in EXTENSION_MATCHES):
            findings.append(Finding(
                projectName="", issue=f"Sensitive file: {path}",
                severity=SeverityEnum.HIGH, category=RiskCategory.SENSITIVE_FILES,
                filePath=path, description=SENSITIVE_FILES_DESC.get(fname, "Potentially sensitive file")
            ))
    return findings

def check_exposed_secrets(repo, filenames: List[str]) -> List[Finding]:
    findings = []
    valid_exts = ('.py', '.js', '.ts', '.env', '.json', '.yml', '.txt')
    exclude = ('package-lock.json', 'yarn.lock', 'tsconfig.json')
    
    to_scan = [f for f in filenames if f.endswith(valid_exts) and f.split('/')[-1] not in exclude][:15]

    def scan_file(path):
        f_findings = []
        try:
            content = repo.get_contents(path)
            if content.size > 1000000: return []
            text = content.decoded_content.decode('utf-8')
            for name, info in SECRET_PATTERNS.items():
                if re.search(info["pattern"], text):
                    f_findings.append(Finding(
                        projectName=repo.full_name, issue=f"{name} found",
                        severity=info["severity"], category=RiskCategory.EXPOSED_CREDENTIALS,
                        filePath=path, description=f"Regex match for {name}"
                    ))
        except: pass
        return f_findings

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as exec:
        results = exec.map(scan_file, to_scan)
        for res in results: findings.extend(res)
    return findings

def perform_risk_analysis(repo) -> List[Finding]:
    findings = []
    try:
        branch = repo.default_branch
        if not branch: return []
        tree = repo.get_git_tree(branch, recursive=True)
        files = [e.path for e in tree.tree if e.type == "blob"]
        
        findings.extend(check_sensitive_files(files))
        # Check for README
        if not any(f.lower().endswith("readme.md") for f in files):
            findings.append(Finding(
                projectName=repo.full_name, issue="Missing README.md",
                severity=SeverityEnum.LOW, category=RiskCategory.MISSING_METADATA,
                description="Repository lacks documentation."
            ))
        findings.extend(check_exposed_secrets(repo, files))
    except: pass
    return findings

# --- API Route ---

@router.get("/{username}")
async def scan_github_account(
    username: str,
    limit: int = Query(5, ge=1, le=100),
    offset: int = Query(0, ge=0),
    authorization: Optional[str] = Header(None)
):
    # Extract token from Authorization header (format: "token <pat>")
    active_token = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "token":
            active_token = parts[1]
    
    # Fall back to environment variable if no token provided
    active_token = active_token or os.getenv("GITHUB_TOKEN")
    
    if not active_token:
        raise HTTPException(status_code=401, detail="No GitHub Token provided")
    
    g_dynamic = Github(active_token)

    is_private_request = authorization is not None
    cache_key = f"{username}_{limit}_{offset}_{'private' if is_private_request else 'public'}"
    
    if cache_key in scan_cache:
        return scan_cache[cache_key]

    try:
        try:
            user = g_dynamic.get_user(username)
        except UnknownObjectException:
            raise HTTPException(status_code=404, detail="User not found")

        all_repos = user.get_repos(type="owner", sort="updated")
        
        # 3. Proper Pagination: Only scan the requested slice
        current_batch = list(all_repos[offset : offset + limit])
        
        all_findings = []
        for repo in current_batch:
            print(f"--> Scanning: {repo.full_name}")
            risks = perform_risk_analysis(repo)
            for risk in risks:
                risk.projectName = repo.full_name
                all_findings.append(risk)

        # 4. Prepare Response
        response = PaginatedResponse(
            items=all_findings,
            total=all_repos.totalCount,
            limit=limit,
            offset=offset,
            hasMore=(offset + limit) < all_repos.totalCount
        )

        # 5. Store in Cache
        scan_cache[cache_key] = response
        return response

    except RateLimitExceededException:
        raise HTTPException(status_code=429, detail="GitHub API Rate Limit Hit")
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")