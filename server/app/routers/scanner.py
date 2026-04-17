import os
import gitlab
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, HTTPException, Query, Header
from typing import Optional, List
from dotenv import load_dotenv
from app.schema.scannerModels import PaginatedResponse, Finding, SeverityEnum, RiskCategory

load_dotenv()

router = APIRouter(prefix="/scan", tags=["GitLab Scanner"])

# Configuration for the scanner
TARGET_SECRETS = [".env", "id_rsa", "secrets.yml", ".pem"]
REQUIRED_METADATA = ["README.md", "LICENSE"]
SKIP_FOLDERS = ["vendor/", "node_modules/", ".git/"]

def check_for_secrets(project, branch_name: str) -> List[Finding]:
    """Uses Search API to find specific high-risk files deep in the tree."""
    findings = []
    for target in TARGET_SECRETS:
        try:
            results = project.search('blobs', f"filename:{target}", ref=branch_name)
            for match in results:
                if any(folder in match['path'] for folder in SKIP_FOLDERS):
                    continue
                
                findings.append(Finding(
                    projectName=f"{project.name} ({branch_name})",
                    issue=f"Sensitive file: {target}",
                    severity=SeverityEnum.HIGH,
                    category=RiskCategory.SENSITIVE_FILES,
                    filePath=match['path'],
                    description=f"Secret file exposed on branch {branch_name}."
                ))
        except Exception:
            continue
    return findings

def check_missing_metadata(project, branch_name: str) -> List[Finding]:
    """Checks the root directory to see if mandatory files are missing."""
    findings = []
    try:
        # Get only the top-level files (shallow check)
        root_items = project.repository_tree(ref=branch_name, recursive=False)
        existing_files = [item['name'].lower() for item in root_items]

        for meta_file in REQUIRED_METADATA:
            if meta_file.lower() not in existing_files:
                findings.append(Finding(
                    projectName=f"{project.name} ({branch_name})",
                    issue=f"Missing {meta_file}",
                    severity=SeverityEnum.LOW,
                    category=RiskCategory.SENSITIVE_FILES,
                    filePath="Root",
                    description=f"Compliance check failed: {meta_file} not found in root."
                ))
    except Exception:
        pass
    return findings

def scan_branch_worker(project, branch_name: str) -> List[Finding]:
    """Combines all checks for a single branch."""
    print(f"🧵 Threading branch: {branch_name}")
    # Combine lists from both helper functions
    return check_for_secrets(project, branch_name) + check_missing_metadata(project, branch_name)

@router.get("/gitlab/{username}", response_model=PaginatedResponse)
def scan_gitlab_account(
    username: str,
    limit: int = Query(5, ge=1, le=100),
    offset: int = Query(0, ge=0),
    authorization: Optional[str] = Header(None)
):
    active_token = authorization.replace("token ", "") if authorization else os.getenv("GITLAB_TOKEN")
    if not active_token:
        raise HTTPException(status_code=401, detail="GitLab Token missing")

    try:
        gl = gitlab.Gitlab("https://gitlab.com", private_token=active_token)
        gl.auth()

        user_matches = gl.users.list(username=username)
        if not user_matches:
            raise HTTPException(status_code=404, detail="User not found")
        
        all_projects = user_matches[0].projects.list(all=True, order_by='id', sort='asc')
        current_batch = all_projects[offset : offset + limit]

        final_findings = []

        for p_summary in current_batch:
            project = gl.projects.get(p_summary.id)
            branches = project.branches.list(get_all=True)
            
            # Concurrency: 5 threads scanning branches simultaneously
            with ThreadPoolExecutor(max_workers=5) as executor:
                futures = [executor.submit(scan_branch_worker, project, b.name) for b in branches]
                for f in futures:
                    final_findings.extend(f.result())

        return PaginatedResponse(
            items=final_findings,
            total=len(all_projects),
            limit=limit,
            offset=offset,
            hasMore=(offset + limit) < len(all_projects)
        )

    except Exception as e:
        print(f"❌ Scan failed: {e}")
        raise HTTPException(status_code=500, detail="Internal Scanner Error")