#!/bin/bash

# Validation Script pour le système Auto-Refresh
# Usage: bash validate-auto-refresh.sh

echo "======================================"
echo "🔍 Validation Auto-Refresh System"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter
PASS=0
FAIL=0

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} File exists: $1"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} File missing: $1"
        ((FAIL++))
    fi
}

# Function to check string in file
check_string_in_file() {
    if grep -q "$2" "$1" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Found in $1: $2"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} Missing in $1: $2"
        ((FAIL++))
    fi
}

echo "📋 Checking Core Files..."
echo "-------"
check_file "resources/js/hooks/useAutoRefresh.js"
check_file "resources/js/utils/autoRefresh.js"
check_file "resources/js/providers/AutoRefreshProvider.jsx"
check_file "public/sw.js"
check_file "public/manifest.json"
check_file "app/Http/Controllers/ManifestController.php"
echo ""

echo "📋 Checking Route Integration..."
echo "-------"
check_string_in_file "routes/web.php" "manifest.json"
check_string_in_file "routes/web.php" "ManifestController"
check_string_in_file "routes/api.php" "refresh-manifest"
echo ""

echo "📋 Checking React Integration..."
echo "-------"
check_string_in_file "resources/js/app.jsx" "AutoRefreshProvider"
echo ""

echo "📋 Checking shopStorage Fix..."
echo "-------"
check_string_in_file "resources/js/utils/shopStorage.js" "shouldNotify"
check_string_in_file "resources/js/utils/shopStorage.js" "mergeGuestDataForUser"
echo ""

echo "📋 Checking Service Worker..."
echo "-------"
check_string_in_file "public/sw.js" "self.addEventListener"
check_string_in_file "public/sw.js" "PRECACHE_URLS"
check_string_in_file "public/sw.js" "cacheFirst"
check_string_in_file "public/sw.js" "networkFirst"
echo ""

echo "📋 Checking Documentation..."
echo "-------"
check_file "docs/AUTO_REFRESH.md"
check_file "docs/DEPLOYMENT_CHECKLIST.md"
check_file "docs/SESSION_COMPLETION_REPORT.md"
check_file "QUICK_REFERENCE.md"
check_file "tests/Feature/AutoRefreshTest.php"
echo ""

echo "📋 Checking Type Hints..."
echo "-------"
check_string_in_file "app/Http/Controllers/ManifestController.php" "Response|JsonResponse"
echo ""

# Summary
echo "======================================"
echo "📊 Summary"
echo "======================================"
echo -e "Passed: ${GREEN}${PASS}${NC}"
echo -e "Failed: ${RED}${FAIL}${NC}"

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "🚀 Next Steps:"
    echo "  1. npm run dev"
    echo "  2. Check F12 Console for [AutoRefresh] logs"
    echo "  3. Test manifest: curl http://localhost:8000/manifest.json"
    echo "  4. Run tests: php artisan test tests/Feature/AutoRefreshTest.php"
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review.${NC}"
    exit 1
fi
