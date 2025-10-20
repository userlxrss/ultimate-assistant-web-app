#!/bin/bash

# Production Build Script
# This script prepares the application for production deployment

set -e

echo "🚀 Starting production build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."

    required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "$var is not set!"
            exit 1
        else
            print_status "$var is set ✓"
        fi
    done
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm ci --only=production
    print_status "Dependencies installed ✓"
}

# Generate Prisma client
generate_prisma_client() {
    print_status "Generating Prisma client..."
    npx prisma generate
    print_status "Prisma client generated ✓"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    npx prisma migrate deploy
    print_status "Database migrations completed ✓"
}

# Build the application
build_app() {
    print_status "Building Next.js application..."
    npm run build
    print_status "Application built successfully ✓"
}

# Run tests (if available)
run_tests() {
    if [ -f "package.json" ] && grep -q "test" package.json; then
        print_status "Running tests..."
        npm test
        print_status "Tests passed ✓"
    else
        print_warning "No tests found, skipping..."
    fi
}

# Create production directories
create_directories() {
    print_status "Creating production directories..."
    mkdir -p uploads
    mkdir -p logs
    print_status "Directories created ✓"
}

# Set permissions
set_permissions() {
    print_status "Setting file permissions..."
    chmod -R 755 .
    chmod -R 777 uploads logs
    print_status "Permissions set ✓"
}

# Health check
health_check() {
    print_status "Running health checks..."

    # Check if .next directory exists
    if [ ! -d ".next" ]; then
        print_error "Build directory not found!"
        exit 1
    fi

    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        print_error "node_modules not found!"
        exit 1
    fi

    print_status "Health checks passed ✓"
}

# Main execution
main() {
    print_status "Starting production build..."

    # Load environment variables from .env.production if it exists
    if [ -f ".env.production" ]; then
        export $(cat .env.production | grep -v '^#' | xargs)
        print_status "Loaded .env.production ✓"
    fi

    check_env_vars
    install_dependencies
    generate_prisma_client
    run_migrations
    run_tests
    build_app
    create_directories
    set_permissions
    health_check

    print_status "🎉 Production build completed successfully!"
    print_status "Application is ready for deployment!"
}

# Run main function
main "$@"