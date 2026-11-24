#!/usr/bin/env bash
# Runs tools/verify-levels.js across all CPU cores and prints one combined report.
# Usage: tools/verify-parallel.sh [jobs]   (env TIME_LIMIT_MS per level, default 45000)
cd "$(dirname "$0")/.."
export TIME_LIMIT_MS=${TIME_LIMIT_MS:-90000}  # boss levels need generous limits
JOBS=${1:-$(nproc)}
N=$(node -e "eval(require('fs').readFileSync('src/levels.js','utf8')+';console.log(LEVELS.length)')")
TMP=$(mktemp -d)
for ((j=0;j<JOBS;j++)); do
  L=""; for ((i=j+1;i<=N;i+=JOBS)); do L="$L $i"; done
  [ -n "$L" ] && (node tools/verify-levels.js $L > "$TMP/$j.txt" 2>&1 &)
done
sleep 1
while pgrep -f "tools/verify-levels.js" >/dev/null; do sleep 2; done
cat "$TMP"/*.txt | grep -E "^(PASS|FAIL)" | sort -k2 -n
FAILS=$(cat "$TMP"/*.txt | grep -c "^FAIL")
CHEATS=$(cat "$TMP"/*.txt | grep -c "noshift=CHEAT")
rm -rf "$TMP"
[ "$CHEATS" -gt 0 ] && echo "$CHEATS level(s) solvable WITHOUT shifting (shift is optional): fix these"
[ "$FAILS" -eq 0 ] && [ "$CHEATS" -eq 0 ] && echo "All $N level(s) solvable and need shifting" || { echo "$FAILS level(s) NOT verified"; exit 1; }
