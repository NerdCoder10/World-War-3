"""Bump the site version: every ?v= in index.html and version.json together.

Run before each release (python3 tools/bump-version.py). Open copies of the game check version.json
and reload into the new version (js/update.js), and the ?v= makes browsers fetch the new files.
"""
import json, pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
index = root / "index.html"
html = index.read_text(encoding="utf-8")
cur = max(int(v) for v in re.findall(r"\?v=(\d+)", html))
new = cur + 1
index.write_text(re.sub(r"\?v=\d+", f"?v={new}", html), encoding="utf-8")
(root / "version.json").write_text(json.dumps({"version": str(new)}) + "\n", encoding="utf-8")
print(f"version {cur} -> {new}")
