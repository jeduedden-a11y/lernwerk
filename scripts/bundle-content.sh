#!/bin/bash
# Copies the lessons and the lesson runtime into Resources/Content, which the app ships as a folder reference,
# and adds KaTeX from npm (the version runtime.json names). With this copy the app works offline from the first
# start; everything in content/ that changes later reaches the phone over the air.
set -euo pipefail
cd "$(dirname "$0")/.."

OUT=Resources/Content
KATEX_VERSION="$(sed -n 's/.*"katex": *"\([^"]*\)".*/\1/p' content/runtime/runtime.json)"
[ -n "$KATEX_VERSION" ] || { echo "runtime.json names no KaTeX version" >&2; exit 1; }

rm -rf "$OUT"
mkdir -p "$OUT"
# everything except the browser test pages (dev*.html) and dot files, the same rule the app's sync uses
(cd content && find . -type f ! -name 'dev*' ! -name '.*') | while IFS= read -r f; do
  mkdir -p "$OUT/$(dirname "$f")"
  cp "content/$f" "$OUT/$f"
done

# The blob hash of every file and the commit: after an install the app takes this copy as its base and drops older
# downloads, so a stale cache never hides newer lessons, and the sync fetches only what changed since this build.
python3 - "$OUT" <<'PY'
import json, subprocess, sys
out = sys.argv[1]
commit = subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
files = {}
for line in subprocess.check_output(["git", "ls-files", "-s", "-z", "content"]).decode("utf-8").split("\0"):
    if not line:
        continue
    meta, path = line.split("\t", 1)
    files[path[len("content/"):]] = meta.split()[1]
with open(out + "/bundle-manifest.json", "w", encoding="utf-8") as f:
    json.dump({"commit": commit, "files": files}, f, ensure_ascii=False, sort_keys=True)
PY

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
(cd "$TMP" && npm pack "katex@${KATEX_VERSION}" --silent >/dev/null && tar -xzf katex-*.tgz)
mkdir -p "$OUT/runtime/vendor/katex/fonts"
cp "$TMP/package/dist/katex.min.js" "$TMP/package/dist/katex.min.css" "$OUT/runtime/vendor/katex/"
# WebKit takes the woff2 files; the woff and ttf fallbacks in the stylesheet are never requested
cp "$TMP/package/dist/fonts/"*.woff2 "$OUT/runtime/vendor/katex/fonts/"
cp "$TMP/package/LICENSE" "$OUT/runtime/vendor/katex/LICENSE"

echo "Inhalte gebündelt: $(find "$OUT" -type f | wc -l | tr -d ' ') Dateien, KaTeX ${KATEX_VERSION}"
