#!/bin/bash
echo "=============================="
echo "VOUCHEDGE FULL APP RESCAN"
echo "=============================="
echo "Scan time: $(date)"
echo ""

echo "## 1. BUILD STATUS"
npm run build
echo ""

echo "## 2. ROUTE REGISTRATION"
grep -R "app.use\|app.get\|app.post\|router.get\|router.post\|router.put\|router.delete\|parlayRoutes\|coreRoutes\|authRoutes" -n server.ts server \
  --include="*.ts" --include="*.js" | sed -n '1,360p'
echo ""

echo "## 3. NEW BACKEND ME ROUTES"
grep -R '"/me/\|/api/me' -n server src \
  --include="*.ts" --include="*.tsx" | sed -n '1,260p'
echo ""

echo "## 4. PARLAY / PICK BACKEND"
grep -R "parlay\|pick_legs\|picks\|ledger\|dashboard-summary" -ni server \
  --include="*.ts" --include="*.js" | sed -n '1,420p'
echo ""

echo "## 5. FRONTEND API CALLS"
grep -R "fetch(.*api\|apiFetch\|axios\|/api/" -n src \
  --include="*.ts" --include="*.tsx" | sed -n '1,420p'
echo ""

echo "## 6. FRONTEND LOCALSTORAGE USAGE"
grep -R "localStorage" -n src \
  --include="*.ts" --include="*.tsx" | sed -n '1,420p'
echo ""

echo "## 7. THE EDGE / ISLAND / WELCOME SYSTEM"
grep -R "TheEdgeShell\|TheEdgeOverlay\|WelcomePortal\|EdgePortal\|videoIntro\|welcomeBack\|dashboard-summary\|me/ledger" -n src server \
  --include="*.ts" --include="*.tsx" | sed -n '1,420p'
echo ""

echo "## 8. RESULTS / LEDGER FRONTEND"
grep -R "ResultsPage\|ledger\|pending\|won\|lost\|graded\|grade" -ni src server \
  --include="*.ts" --include="*.tsx" | sed -n '1,420p'
echo ""

echo "## 9. AUTH TOKEN NAMES"
grep -R "vouchedge_auth_token\|mlb_ai_auth_token\|Authorization\|Bearer" -n src server \
  --include="*.ts" --include="*.tsx" | sed -n '1,360p'
echo ""

echo "## 10. BIGGEST FILES"
find src server -type f \( -name "*.tsx" -o -name "*.ts" \) -exec wc -l {} + 2>/dev/null | sort -nr | head -50
echo ""

echo "## 11. ROUTE PROTECTION TESTS WITHOUT TOKEN"
echo "/api/me/ledger:"
curl -s -i http://localhost:3000/api/me/ledger | sed -n '1,12p'
echo ""
echo "/api/me/dashboard-summary:"
curl -s -i http://localhost:3000/api/me/dashboard-summary | sed -n '1,12p'
echo ""

echo "=============================="
echo "FULL RESCAN COMPLETE"
echo "=============================="
