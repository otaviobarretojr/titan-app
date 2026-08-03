#!/usr/bin/env bash
set -u

REPORT="titan-audit-report.txt"

{
  echo "TITAN AUDIT REPORT"
  echo "Generated: $(date -Iseconds)"
  echo
  echo "=== GIT ==="
  git branch --show-current 2>&1
  git status --short 2>&1
  git log -5 --oneline 2>&1
  echo
  echo "=== NODE ==="
  node -v 2>&1
  npm -v 2>&1
  echo
  echo "=== PACKAGE SCRIPTS ==="
  node -e "const p=require('./package.json'); console.log(p.scripts)" 2>&1
  echo
  echo "=== DEPENDENCIES ==="
  npm list --depth=0 2>&1
  echo
  echo "=== SOURCE TREE ==="
  find src -maxdepth 5 -type f | sort
  echo
  echo "=== DOCS TREE ==="
  find docs -maxdepth 3 -type f 2>/dev/null | sort
  echo
  echo "=== BUILD ==="
  npm run build 2>&1
  BUILD_EXIT=$?
  echo "BUILD_EXIT=$BUILD_EXIT"
  echo
  echo "=== LINT ==="
  npm run lint 2>&1
  LINT_EXIT=$?
  echo "LINT_EXIT=$LINT_EXIT"
  echo
  echo "=== TYPESCRIPT ==="
  npx tsc --noEmit 2>&1
  TSC_EXIT=$?
  echo "TSC_EXIT=$TSC_EXIT"
  echo
  echo "=== PWA OUTPUT ==="
  find dist -maxdepth 2 -type f 2>/dev/null | sort
  echo
  echo "=== SUMMARY ==="
  echo "BUILD_EXIT=$BUILD_EXIT"
  echo "LINT_EXIT=$LINT_EXIT"
  echo "TSC_EXIT=$TSC_EXIT"
} | tee "$REPORT"

echo
echo "✅ Auditoria concluída: $REPORT"
