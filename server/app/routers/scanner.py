import os
import gitlab
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, HTTPException, Query, Header
from typing import Optional, List, Dict
from cachetools import TTLCache
from dotenv import load_dotenv
from app.schema.scannerModels import PaginatedResponse, Finding, SeverityEnum, RiskCategory

load_dotenv()

router = APIRouter(prefix="/scan", tags=["GitLab Scanner"])

GLOBAL_RESPONSE_CACHE = TTLCache(maxsize=500, ttl=3600)
PROJECT_LIST_CACHE = TTLCache(maxsize=100, ttl=600)
SCAN_CACHE = TTLCache(maxsize=2000, ttl=86400)

TARGET_SECRETS = [".env", "id_rsa", "secrets.yml", ".pem"]
REQUIRED_METADATA = ["README.md", "LICENSE"]
SKIP_FOLDERS = ["vendor/", "node_modules/", ".git/"]

def get_user_latest_projects(gl, username: str) -> str:
    try:
        user = gl.users.list(username=username)[0]
        latest = user.projects.list(limit=1, order_by='last_activity_at', sort='desc', simple=True)
        if not latest:
            return "no_projects"
        return f"{latest[0].id}:{latest[0].last_activity_at}"
    except Exception:
        return "error"

def check_for_secrets(project, branch_name: str) -> List[Finding]:
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
        except Exception: continue
    return findings

def check_missing_metadata(project, branch_name: str) -> List[Finding]:
    findings = []
    try:
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
    except Exception: pass
    return findings

def scan_branch_worker(project, branch) -> List[Finding]:
    branch_name = branch.name
    print("Branch---->", branch_name)
    current_sha = branch.commit['id'] 
    cache_key = f"{project.id}:{branch_name}:{current_sha}"
    if cache_key in SCAN_CACHE:
        return SCAN_CACHE[cache_key]

    results = check_for_secrets(project, branch_name) + check_missing_metadata(project, branch_name)
    SCAN_CACHE[cache_key] = results
    return results

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

        latestChange = get_user_latest_projects(gl, username)
        global_cache_key = f"{username}:{offset}:{limit}:{latestChange}"
        
        if global_cache_key in GLOBAL_RESPONSE_CACHE:
            print("getting data from cache")
            return GLOBAL_RESPONSE_CACHE[global_cache_key]

        user_matches = gl.users.list(username=username)
        if not user_matches:
            raise HTTPException(status_code=404, detail="User not found")
        
        current_page = (offset // limit) + 1
        all_projects=[]
        
        project_list_object = user_matches[0].projects.list(
            page=current_page, 
            per_page=limit, 
            order_by='id', 
            sort='asc',
            get_all=False
        )
        print("Project List Object---->", project_list_object)

        cache_key = f"projects:{username}:{latestChange}"
        if cache_key in PROJECT_LIST_CACHE:
            all_projects = PROJECT_LIST_CACHE[cache_key]
        else:
            user = gl.users.list(username=username)[0]
            all_projects = user.projects.list(all=True, order_by='id', sort='asc')
            PROJECT_LIST_CACHE[cache_key] = all_projects

        final_findings = []

        for p_summary in project_list_object:
            project = gl.projects.get(p_summary.id)
            print("Project---->", project.name)
            branches = project.branches.list(get_all=True)
            
            with ThreadPoolExecutor(max_workers=5) as executor:
                futures = [executor.submit(scan_branch_worker, project, b) for b in branches]
                for f in futures:
                    final_findings.extend(f.result())

        response = PaginatedResponse(
            items=final_findings,
            total=len(all_projects),
            limit=limit,
            offset=offset,
            hasMore=(offset + limit) < len(all_projects)
        )
        
        GLOBAL_RESPONSE_CACHE[global_cache_key] = response
        return response

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal Scanner Error")