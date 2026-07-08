#!/bin/bash
set -e

REPORT="VOUCHRES_FULL_STACK_SCAN.md"

echo "# Vouchres / VouchEdge Full Stack Scan" > "$REPORT"
echo "" >> "$REPORT"
echo "Generated: $(date)" >> "$REPORT"
echo "" >> "$REPORT"

echo "## 1. Git Status" >> "$REPORT"
echo '```txt' >> "$REPORT"
git status --short >> "$REPORT" || true
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "## 2. Build Check" >> "$REPORT"
echo '```txt' >> "$REPORT"
npm run build >> "$REPORT" 2>&1 || true
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "## 3. Biggest Frontend Files" >> "$REPORT"
echo '```txt' >> "$REPORT"
find src -type f $begin:math:text$ \-name \"\*\.tsx\" \-o \-name \"\*\.ts\" \-o \-name \"\*\.css\" $end:math:text$ \
  -not -path "*/node_modules/*" \
  -exec wc -l {} + | sort -nr | head -40 >> "$REPORT"
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "## 4. Route/Auth Logic in App.tsx" >> "$REPORT"
echo '```txt' >> "$REPORT"
grep -n "PUBLIC_SECTIONS\|PROTECTED_SECTIONS\|hasRealAuthToken\|requiresLogin\|navigateSection\|activeSection\|setActiveSection\|welcome\|login_required" src/App.tsx | sed -n '1,260p' >> "$REPORT" || true
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "## 5. The Edge / The Island Routing" >> "$REPORT"
echo '```txt' >> "$REPORT"
grep -R "The Edge\|The Island\|welcomeBack\|dashboard\|onSectionChange\|navigateSection\|enterSite" -n src/components/theEdge src/social/feed src/App.tsx --include="*.tsx" --include="*.ts" | sed -n '1,260p' >> "$REPORT" || true
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "## 6. Auth Badge / Supabase Session Logic" >> "$REPORT"
echo '```txt' >> "$REPORT"
sed -n '1,260p' src/components/auth/AuthStatusBadge.tsx >> "$REPORT" 2>/dev/null || true
echo "" >> "$REPORT"
grep -R "getSession\|getUser\|onAuthStateChange\|signOut\|vouchedge_auth_token\|mlb_ai_auth_token" -n src --include="*.tsx" --include="*.ts" | sed -n '1,260p' >> "$REPORT" || true
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "## 7. Fake/Demo/Local Data Scan" >> "$REPORT"
echo '```txt' >> "$REPORT"
grep -R "demo\|fake\|mock\|sample\|placeholder\|localStorage\|sessionStorage" -n src --include="*.tsx" --include="*.ts" | sed -n '1,320p' >> "$REPORT" || true
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "## 8. Results / Parlay / Account Data Frontend" >> "$REPORT"
echo '```txt' >> "$REPORT"
grep -R "/api/me/ledger\|/api/me/dashboard-summary\|/api/me/parlays\|/api/parlays\|ResultsPage\|ParlayLab\|dashboardSummary\|backendLedger" -n src server --include="*.tsx" --include="*.ts" | sed -n '1,320p' >> "$REPORT" || true
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "## 9. Backend Routes and Auth Protection" >> "$REPORT"
echo '```txt' >> "$REPORT"
grep -R "router\\.\|app\\.\|requireAuth\|requireAdmin\|createClient\|SUPABASE_SERVICE_ROLE\|SUPABASE_SECRET\|ANON_KEY" -n server server.ts --include="*.ts" | sed -n '1,420p' >> "$REPORT" || true
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "## 10. Backend Routes Without requireAuth Nearby" >> "$REPORT"
echo '```txt' >> "$REPORT"
python3 - <<'PY' >> "$REPORT"
from pathlib import Path
import re

for p in list(Path("server").rglob("*.ts")) + [Path("server.ts")]:
    if not p.exists() or ".before" in p.name or ".backup" in p.name:
        continue
    lines = p.read_text(errors="ignore").splitlines()
    for i, line in enumerate(lines):
        if re.search(r"(router|app)\.(get|post|put|patch|delete)\(", line):
            window = "\n".join(lines[max(0, i-3): min(len(lines), i+8)])
            has_auth = "requireAuth" in window or "requireAdmin" in window
            status = "OK_AUTH_NEARBY" if has_auth else "CHECK_NO_AUTH_NEARBY"
            print(f"{status}: {p}:{i+1}: {line.strip()}")
PY
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "## 11. Frontend Secret Exposure Scan" >> "$REPORT"
echo '```txt' >> "$REPORT"
grep -R "SUPABASE_SERVICE_ROLE_KEY\|SUPABASE_SECRET_KEY\|service_role\|sb_secret\|STRIPE_SECRET\|JWT_SECRET" -n src public --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || echo "No obvious frontend secret references found." >> "$REPORT"
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "## 12. Env Names Present, Hidden" >> "$REPORT"
echo '```txt' >> "$REPORT"
grep -n "SUPABASE\|STRIPE\|JWT\|VITE_" .env .env.local 2>/dev/null | sed 's/=.*/=*** hidden ***/' >> "$REPORT" || true
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "## 13. Vite Watch / Backup Reload Risk" >> "$REPORT"
echo '```txt' >> "$REPORT"
sed -n '1,180p' vite.config.ts >> "$REPORT" || true
echo "" >> "$REPORT"
echo "Backup files still inside src/server:" >> "$REPORT"
find src server -type f \( -name "*.before*" -o -name "*.backup*" -o -name "*.save" \) -print >> "$REPORT" || true
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "## 14. Known Enum Bug Scan" >> "$REPORT"
echo '```txt' >> "$REPORT"
grep -R "monthly\|trust_scope" -n server src --include="*.ts" --include="*.tsx" | sed -n '1,180p' >> "$REPORT" || true
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "## 15. Package Scripts / Dependencies" >> "$REPORT"
echo '```txt' >> "$REPORT"
cat package.json >> "$REPORT"
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

echo "✅ Scan complete: $REPORT"
ls -lh "$REPORT"
