#!/bin/bash

set -e

echo "================================================"
echo "   Dialog AI Service - E2E Test Runner"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup containers
cleanup() {
    echo -e "${YELLOW}Cleaning up containers and volumes...${NC}"
    docker-compose -f docker-compose.e2e.yml down -v --remove-orphans
    docker-compose -f docker-compose.test.yml down -v --remove-orphans
    docker-compose down -v --remove-orphans
}

# Function to check for required files
check_requirements() {
    echo "Checking requirements..."
    
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}Warning: .env file not found. Creating from .env.example...${NC}"
        cp .env.example .env
    fi
    
    if [ ! -f "package.json" ]; then
        echo -e "${RED}Error: package.json not found!${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Requirements check passed${NC}"
}

# Function to build and run tests
run_tests() {
    echo ""
    echo "Building Docker images..."
    docker-compose -f docker-compose.e2e.yml build
    
    echo ""
    echo "Starting test environment..."
    docker-compose -f docker-compose.e2e.yml up -d postgres-e2e
    
    echo ""
    echo "Waiting for database to be healthy..."
    timeout 30s bash -c 'until docker-compose -f docker-compose.e2e.yml exec postgres-e2e pg_isready -U e2euser; do sleep 1; done' || {
        echo -e "${RED}Database failed to become healthy${NC}"
        cleanup
        exit 1
    }
    
    echo ""
    echo "Running E2E tests..."
    docker-compose -f docker-compose.e2e.yml run --rm test-runner || TEST_RESULT=$?
    
    if [ ${TEST_RESULT:-0} -eq 0 ]; then
        echo -e "${GREEN}✓ All E2E tests passed successfully!${NC}"
    else
        echo -e "${RED}✗ Some tests failed. Check the logs above.${NC}"
    fi
    
    echo ""
    echo "Test reports available at:"
    echo "  - HTML Report: playwright-report/index.html"
    echo "  - JSON Results: test-results/results.json"
    
    return ${TEST_RESULT:-0}
}

# Main execution
main() {
    # Trap to ensure cleanup on exit
    trap cleanup EXIT
    
    # Parse arguments
    case "${1:-}" in
        --no-cleanup)
            trap - EXIT
            ;;
        --help)
            echo "Usage: $0 [--no-cleanup|--help]"
            echo ""
            echo "Options:"
            echo "  --no-cleanup  Don't clean up containers after tests"
            echo "  --help        Show this help message"
            exit 0
            ;;
    esac
    
    check_requirements
    cleanup
    run_tests
    
    if [ "${1:-}" != "--no-cleanup" ]; then
        echo ""
        read -p "Press Enter to clean up containers, or Ctrl+C to keep them running..."
        cleanup
    fi
}

# Run main function
main "$@"