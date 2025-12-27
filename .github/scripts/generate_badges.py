#!/usr/bin/env python3
"""Read BADGE_MANIFEST.json and fetch badge URLs into assets/badges/, saving as .svg files.
This script should be used by the badge-regenerator workflow.
"""
import json
import os
import glob
import re
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
from datetime import datetime

OUTDIR = "assets/badges"
os.makedirs(OUTDIR, exist_ok=True)

manifests = glob.glob("**/BADGE_MANIFEST.json", recursive=True)
if not manifests:
    print("No BADGE_MANIFEST.json found; nothing to do.")
    exit(0)

slugify = lambda s: re.sub(r"[^
A-Za-z0-9_-]", "-", s)

fetched = []
for m in manifests:
    with open(m, "r", encoding="utf-8") as fh:
        data = json.load(fh)
    for b in data.get("badges", []):
        url = b.get("badge_url")
        if not url:
            continue
        filename = f"{slugify(b.get('id'))}.svg"
        outpath = os.path.join(OUTDIR, filename)
        req = Request(url, headers={"User-Agent": "Anselmoo-Badge-Regenerator/1.0"})
        try:
            with urlopen(req, timeout=15) as r:
                content = r.read()
                with open(outpath, "wb") as of:
                    of.write(content)
                fetched.append({"id": b.get('id'), "path": outpath})
                print(f"Fetched {url} -> {outpath}")
        except Exception as e:
            print(f"Failed to fetch {url}: {e}")

# Print summary
print(f"Fetched {len(fetched)} badges.")
if fetched:
    print("Files written:\n" + "\n".join([f['path'] for f in fetched]))

# Exit 0 so the workflow can decide on PR creation
exit(0)
