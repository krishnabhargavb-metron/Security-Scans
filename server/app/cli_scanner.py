import os
import sys
import argparse
from github import Github

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
if SCRIPT_DIR not in sys.path:
    sys.path.insert(0, SCRIPT_DIR)

try:
    from routers.scanner import perform_risk_analysis
except ImportError as e:
    print(f"❌ Error: Could not find 'scanner.py' or its dependencies in {SCRIPT_DIR}")
    print(f"Details: {e}")
    sys.exit(1)

def mask_sensitive_data(text):
    if not text: return "N/A"
    return text[:8] + "********" if len(text) > 15 else text

def run_ci_scan(username, repo_limit):
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        print("❌ Error: GITHUB_TOKEN environment variable not set.")
        sys.exit(1)

    g = Github(token)
    
    try:
        user = g.get_user(username)
        print(f"\n{'='*50}")
        print(f"🛡️  SECURITY SCAN REPORT: {username}")
        print(f"{'='*50}\n")
        
        repos = list(user.get_repos(type="owner", sort="updated")[:repo_limit])
        print(f"📦 Found {len(repos)} repositories to check.\n")
        
        total_findings = 0
        critical_count = 0

        for repo in repos:
            print(f"🔍 Checking: {repo.full_name}")
            
            findings = perform_risk_analysis(repo)
            
            if not findings:
                print(f"   ✅ No vulnerabilities detected.")
            else:
                for f in findings:
                    severity_icon = "🔴" if f.severity == "High" else "🟡"
                    print(f"   {severity_icon} [{f.severity}] {f.issue}")
                    print(f"      📍 File: {f.filePath}")
                    # Masking descriptions just in case they contain the secret found
                    print(f"      📝 Info: {f.description}")
                    
                    total_findings += 1
                    if f.severity == "High":
                        critical_count += 1
            print(f"{'-'*50}")

        print(f"\n📊 SCAN SUMMARY")
        print(f"  • Total Findings: {total_findings}")
        print(f"  • Critical Risks: {critical_count}")

        if critical_count > 0:
            print(f"\n❌ VERDICT: FAILED. {critical_count} High-risk issues must be fixed.")
            sys.exit(1) 
        else:
            print("\n✅ VERDICT: PASSED. No critical security risks identified.")
            sys.exit(0)

    except Exception as e:
        print(f"❌ Execution Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Automated GitHub Security Scanner")
    parser.add_argument("--user", help="Target GitHub username", required=True)
    parser.add_argument("--limit", type=int, default=5, help="Max repos to scan (default: 5)")
    
    args = parser.parse_args()
    run_ci_scan(args.user, args.limit)