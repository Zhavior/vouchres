#!/bin/bash
echo "=============================="
echo "VOUCHEDGE BACKEND MAP"
echo "=============================="

echo ""
echo "## SERVER FILE TREE"
find server -maxdepth 5 -type f \( -name "*.ts" -o -name "*.js" \) | sort

echo ""
echo "## ROUTE DEFINITIONS"
grep -R "router.get\|router.post\|router.put\|router.delete\|app.get\|app.post\|app.put\|app.delete" -n server \
  --include="*.ts" --include="*.js" | sed -n '1,300p'

echo ""
echo "## PICK / PARLAY BACKEND"
grep -R "pick\|parlay\|pick_legs\|legs" -ni server \
  --include="*.ts" --include="*.js" | sed -n '1,320p'

echo ""
echo "## GRADING BACKEND"
grep -R "grade\|grading\|pending\|WON\|LOST\|VOID\|settle" -ni server \
  --include="*.ts" --include="*.js" | sed -n '1,320p'

echo ""
echo "## SUPABASE TABLE USAGE"
grep -R "from(.*picks\|from(.*pick_legs\|from(.*profiles\|from(.*trust\|from(.*subscriptions\|from(" -ni server \
  --include="*.ts" --include="*.js" | sed -n '1,360p'

echo ""
echo "## AUTH MIDDLEWARE / USER ID"
grep -R "requireAuth\|auth\|userId\|user_id\|supabase.auth\|jwt\|token" -ni server \
  --include="*.ts" --include="*.js" | sed -n '1,320p'

echo ""
echo "=============================="
echo "BACKEND MAP COMPLETE"
echo "=============================="
