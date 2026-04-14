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
from ..utils.sanitizer import InputSanitizer

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
    # --- Input Sanitization ---
    username = InputSanitizer.sanitize_username(username)
    limit = InputSanitizer.sanitize_limit(limit, default=5, max_limit=100)
    offset = InputSanitizer.sanitize_offset(offset, default=0)
    
    # --- Token Extraction & Validation ---
    active_token = None
    if authorization:
        if InputSanitizer.detect_sql_injection(authorization):
            raise HTTPException(status_code=400, detail="Invalid authorization header format")
            
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "token":
            try:
                active_token = InputSanitizer.sanitize_token(parts[1])
            except HTTPException as e:
                raise HTTPException(status_code=400, detail=f"Invalid token: {e.detail}")
    
    active_token = active_token or os.getenv("GITHUB_TOKEN")
    if not active_token:
        raise HTTPException(status_code=401, detail="No GitHub Token provided")
    
    g_dynamic = Github(active_token)

    try:
        # 1. Fetch user (Lazy)
        user = g_dynamic.get_user(username)
        
        # 2. Cache Buster: Get the latest update timestamp across all repos
        # This is a very fast metadata call.
        repos_iterator = user.get_repos(type="owner", sort="updated")
        
        # Trigger an actual check to see if user exists and get the latest timestamp
        try:
            # Check the first repo in the sorted list to get the most recent 'updated_at'
            latest_repo = repos_iterator[0]
            last_updated_ts = latest_repo.updated_at.timestamp()
        except (IndexError, UnknownObjectException):
            # If user has 0 repos, use 0 as timestamp. If user doesn't exist, catches below.
            last_updated_ts = 0

        # 3. Versioned Cache Key
        is_private_request = authorization is not None
        cache_key = f"{username}_{limit}_{offset}_{last_updated_ts}_{'private' if is_private_request else 'public'}"
        
        if cache_key in scan_cache:
            print(f"🚀 Cache Hit for {username} (Version: {last_updated_ts})")
            return scan_cache[cache_key]

        # 4. Cache Miss: Perform full scan
        print(f"📡 Cache Miss/Stale for {username}. Starting fresh scan...")
        current_batch = list(repos_iterator[offset : offset + limit])
        
        all_findings = []
        for repo in current_batch:
            safe_repo_name = InputSanitizer.sanitize_repo_name(repo.full_name)
            print(f"🔍 Scanning: {safe_repo_name}")
            
            risks = perform_risk_analysis(repo)
            for risk in risks:
                risk.projectName = repo.full_name
                all_findings.append(risk)

        # 5. Prepare Response
        response = PaginatedResponse(
            items=all_findings,
            total=repos_iterator.totalCount,
            limit=limit,
            offset=offset,
            hasMore=(offset + limit) < repos_iterator.totalCount
        )

        # 6. Store in Cache
        scan_cache[cache_key] = response
        return response

    except UnknownObjectException:
        safe_username = InputSanitizer.sanitize_for_logging(username)
        raise HTTPException(status_code=404, detail=f"GitHub user '{safe_username}' not found.")

    except RateLimitExceededException:
        raise HTTPException(status_code=429, detail="GitHub API Rate Limit Hit.")
    
    except Exception as e:
        error_type = InputSanitizer.sanitize_for_logging(type(e).__name__)
        print(f"🚨 Unexpected Scan Error: {error_type} - {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error during scan")