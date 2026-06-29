#!/bin/bash
echo "=============================="
echo "VOUCHEDGE FEATURE AUDIT"
echo "=============================="

echo ""
echo "## 1. Main App Routes / Sections"
grep -R "case '" -n src/App.tsx 2>/dev/null | sed -n '1,180p'

echo ""
echo "## 2. Navigation / Sidebar / Menus"
grep -R "daily_players\|parlay_lab\|notifications\|results\|feed\|welcome\|live_games\|ai_picks" -n src \
  --include="*.tsx" --include="*.ts" 2>/dev/null | head -250

echo ""
echo "## 3. The Edge / Welcome / Island Files"
find src/components -iname "*Edge*" -o -iname "*Welcome*" -o -iname "*Portal*" | sort

echo ""
echo "## 4. Parlay Features"
grep -R "parlay" -n src server --include="*.tsx" --include="*.ts" 2>/dev/null | head -250

echo ""
echo "## 5. Picks / Saved Picks / Ledger / Results"
grep -R "saved pick\|savedPick\|ledger\|result\|grade\|pending\|winRate\|win rate" -ni src server \
  --include="*.tsx" --include="*.ts" 2>/dev/null | head -300

echo ""
echo "## 6. Notifications"
grep -R "notification\|alert" -ni src server --include="*.tsx" --include="*.ts" 2>/dev/null | head -250

echo ""
echo "## 7. AI / Agent / Research Features"
grep -R "AI\|agent\|research\|model\|prediction\|probability\|confidence" -ni src server \
  --include="*.tsx" --include="*.ts" 2>/dev/null | head -300

echo ""
echo "## 8. Backend API Routes"
grep -R "app.get\|app.post\|router.get\|router.post\|router.put\|router.delete" -n server src \
  --include="*.ts" --include="*.tsx" 2>/dev/null | head -300

echo ""
echo "## 9. Supabase / Database Usage"
grep -R "supabase\|from(" -n src server --include="*.ts" --include="*.tsx" 2>/dev/null | head -300

echo ""
echo "## 10. Auth / Login / Signup"
grep -R "login\|signup\|auth\|session\|user" -ni src server --include="*.tsx" --include="*.ts" 2>/dev/null | head -300

echo ""
echo "## 11. MLB Data / Stats API"
grep -R "statsapi\|mlb\|schedule\|gamePk\|pitcher\|homerun\|home run\|HR" -ni src server \
  --include="*.tsx" --include="*.ts" 2>/dev/null | head -350

echo ""
echo "## 12. Files bigger than normal"
find src server -type f \( -name "*.tsx" -o -name "*.ts" \) -exec wc -l {} + 2>/dev/null | sort -nr | head -40

echo ""
echo "=============================="
echo "AUDIT COMPLETE"
echo "=============================="
