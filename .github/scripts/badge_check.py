#!/usr/bin/env python3
"""Scan BADGE_MANIFEST.json files and fetch badge URLs, produce a JSON report.
This script returns exit code 0 (advisory) but writes a report to badge_report.json
"""
import json
import sys
import glob
import os
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from datetime import datetime

REPORT = {"checked_at": datetime.utcnow().isoformat() + "Z", "results": []}

manifests = glob.glob("**/BADGE_MANIFEST.json", recursive=True)
if not manifests:
    print("No BADGE_MANIFEST.json found; nothing to check.")
    print(json.dumps(REPORT))
    sys.exit(0)

for m in manifests:
    try:
        with open(m, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    except Exception as e:
        REPORT["results"].append({"manifest": m, "error": f"could not read manifest: {e}"})
        continue

    for b in data.get("badges", []):
        url = b.get("badge_url")
        if not url:
            REPORT["results"].append({"id": b.get("id"), "manifest": m, "status": "MISSING_URL"})
            continue
        req = Request(url, headers={"User-Agent": "Anselmoo-Badge-Checker/1.0"})
        try:
            with urlopen(req, timeout=10) as r:
                code = r.getcode()
                ctype = r.headers.get("Content-Type", "")
                if code == 200:
                    status = "OK"
                else:
                    status = f"WARN_{code}"
        except HTTPError as e:
            code = e.code
            status = f"HTTP_{code}"
        except URLError as e:
            status = "UNREACHABLE"
        except Exception as e:
            status = f"ERROR_{e}"

        REPORT["results"].append({
            "id": b.get("id"),
            "manifest": m,
            "badge_url": url,
            "status": status,
            "content_type": ctype if 'ctype' in locals() else None
        })

# write report
with open("badge_report.json", "w", encoding="utf-8") as fh:
    json.dump(REPORT, fh, indent=2)

# Print a summary for the workflow log
ok = [r for r in REPORT["results"] if r.get("status") == "OK"]
issues = [r for r in REPORT["results"] if r.get("status") != "OK"]
print(f"Checked {len(REPORT['results'])} badges: {len(ok)} OK, {len(issues)} issues.")
if issues:
    print("Issues:\n" + json.dumps(issues, indent=2))

# Exit 0 since policy is advisory by default
sys.exit(0)
