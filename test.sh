#!/bin/bash

# Test script for Prayer Times Parser

echo "🧪 Testing Prayer Times Parser..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test functions
test_health() {
    echo "🔍 Testing health endpoint..."
    response=$(curl -s -w "%{http_code}" http://localhost:8000/health)
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Health check passed${NC}"
        return 0
    else
        echo -e "${RED}❌ Health check failed (HTTP $http_code)${NC}"
        return 1
    fi
}

test_web_interface() {
    echo "🌐 Testing web interface..."
    response=$(curl -s -w "%{http_code}" http://localhost:8000/)
    http_code="${response: -3}"
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Web interface accessible${NC}"
        return 0
    else
        echo -e "${RED}❌ Web interface failed (HTTP $http_code)${NC}"
        return 1
    fi
}

test_import_modules() {
    echo "📦 Testing Python module imports..."
    cd /home/mustafah/prayercal
    
    modules=("models" "parser" "calendar_generator" "main")
    
    for module in "${modules[@]}"; do
        if /home/mustafah/prayercal/.venv/bin/python -c "import $module" 2>/dev/null; then
            echo -e "${GREEN}✅ $module imported successfully${NC}"
        else
            echo -e "${RED}❌ Failed to import $module${NC}"
            return 1
        fi
    done
    
    return 0
}

check_dependencies() {
    echo "📋 Checking dependencies..."
    cd /home/mustafah/prayercal
    
    missing_deps=0
    
    # Check if virtual environment exists
    if [ ! -d ".venv" ]; then
        echo -e "${RED}❌ Virtual environment not found${NC}"
        missing_deps=1
    fi
    
    # Check if requirements are installed
    if ! /home/mustafah/prayercal/.venv/bin/pip check >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️ Some dependencies may have conflicts${NC}"
    else
        echo -e "${GREEN}✅ All dependencies satisfied${NC}"
    fi
    
    # Check environment file
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️ .env file not found (required for production)${NC}"
    else
        echo -e "${GREEN}✅ .env file exists${NC}"
    fi
    
    return $missing_deps
}

# Run tests
echo "🚀 Starting tests..."
echo "=================================="

failed_tests=0

# Check dependencies first
if ! check_dependencies; then
    ((failed_tests++))
fi

# Test module imports
if ! test_import_modules; then
    ((failed_tests++))
fi

# Test if server is running
echo "⏳ Waiting for server to be ready..."
sleep 2

# Test health endpoint
if ! test_health; then
    ((failed_tests++))
fi

# Test web interface
if ! test_web_interface; then
    ((failed_tests++))
fi

echo "=================================="

if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Prayer Times Parser is ready to use.${NC}"
    echo ""
    echo "📝 Next steps:"
    echo "1. Add your MISTRAL_API_KEY to .env file"
    echo "2. Visit http://localhost:8000 to use the application"
    echo "3. Upload a prayer timetable image to test the full functionality"
    exit 0
else
    echo -e "${RED}❌ $failed_tests test(s) failed. Please check the issues above.${NC}"
    exit 1
fi
