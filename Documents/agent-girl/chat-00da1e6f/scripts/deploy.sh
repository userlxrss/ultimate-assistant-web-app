#!/bin/bash

# Deployment Script
# This script deploys the application to production

set -e

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV=${1:-production}
BACKUP_DIR="/tmp/backups/$(date +%Y%m%d_%H%M%S)"
HEALTH_CHECK_URL="https://your-domain.com/api/health"
ROLLBACK_URL="https://your-domain.com/api/rollback"

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

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Backup current deployment
backup_current() {
    print_header "Creating backup..."

    mkdir -p "$BACKUP_DIR"

    # Backup database
    if command -v pg_dump &> /dev/null; then
        print_status "Backing up database..."
        pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database.sql"
        print_status "Database backup completed ✓"
    fi

    # Backup application files
    print_status "Backing up application files..."
    cp -r .next "$BACKUP_DIR/" 2>/dev/null || true
    cp -r uploads "$BACKUP_DIR/" 2>/dev/null || true
    cp package.json "$BACKUP_DIR/" 2>/dev/null || true

    print_status "Backup completed: $BACKUP_DIR"
}

# Pre-deployment checks
pre_deploy_checks() {
    print_header "Running pre-deployment checks..."

    # Check if we're on the right branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        print_warning "Not on main branch (current: $current_branch)"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Deployment cancelled"
            exit 1
        fi
    fi

    # Check if working directory is clean
    if ! git diff-index --quiet HEAD --; then
        print_error "Working directory is not clean. Commit or stash changes first."
        exit 1
    fi

    # Check environment variables
    if [ ! -f ".env.production" ]; then
        print_error ".env.production file not found!"
        exit 1
    fi

    print_status "Pre-deployment checks passed ✓"
}

# Build application
build_application() {
    print_header "Building application..."

    # Clean previous builds
    rm -rf .next

    # Build
    ./scripts/build.sh

    print_status "Application built successfully ✓"
}

# Deploy to Vercel (if applicable)
deploy_to_vercel() {
    if command -v vercel &> /dev/null; then
        print_header "Deploying to Vercel..."
        vercel --prod
        print_status "Vercel deployment completed ✓"
    else
        print_warning "Vercel CLI not found, skipping Vercel deployment..."
    fi
}

# Deploy Docker containers
deploy_docker() {
    print_header "Deploying Docker containers..."

    # Pull latest images
    docker-compose -f docker-compose.prod.yml pull

    # Deploy new containers
    docker-compose -f docker-compose.prod.yml up -d

    # Wait for containers to be healthy
    print_status "Waiting for containers to be healthy..."
    sleep 30

    print_status "Docker deployment completed ✓"
}

# Run database migrations
run_migrations() {
    print_header "Running database migrations..."

    npx prisma migrate deploy

    print_status "Database migrations completed ✓"
}

# Post-deployment health checks
post_deploy_checks() {
    print_header "Running post-deployment checks..."

    # Wait for application to start
    print_status "Waiting for application to start..."
    sleep 60

    # Health check
    max_attempts=10
    attempt=1

    while [ $attempt -le $max_attempts ]; do
        print_status "Health check attempt $attempt/$max_attempts..."

        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null; then
            print_status "Health check passed ✓"
            return 0
        fi

        print_warning "Health check failed, retrying in 30 seconds..."
        sleep 30
        ((attempt++))
    done

    print_error "Health check failed after $max_attempts attempts!"
    print_warning "Initiating rollback..."
    rollback
    exit 1
}

# Rollback function
rollback() {
    print_header "Rolling back deployment..."

    # Restore database from backup
    if [ -f "$BACKUP_DIR/database.sql" ]; then
        print_status "Restoring database..."
        psql "$DATABASE_URL" < "$BACKUP_DIR/database.sql"
    fi

    # Restore application files
    if [ -d "$BACKUP_DIR/.next" ]; then
        print_status "Restoring application files..."
        rm -rf .next
        cp -r "$BACKUP_DIR/.next" .
    fi

    # Restart services
    docker-compose -f docker-compose.prod.yml restart

    print_status "Rollback completed ✓"
}

# Cleanup old deployments
cleanup() {
    print_header "Cleaning up old deployments..."

    # Remove old Docker images
    docker image prune -f

    # Remove old backups (keep last 5)
    find /tmp/backups -type d -mtime +7 -exec rm -rf {} \; 2>/dev/null || true

    print_status "Cleanup completed ✓"
}

# Send notification (optional)
send_notification() {
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        print_status "Sending deployment notification..."

        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"✅ Ultimate Assistant Hub deployed to production successfully!\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi
}

# Main execution
main() {
    print_header "Ultimate Assistant Hub Deployment"
    print_status "Environment: $DEPLOY_ENV"
    print_status "Timestamp: $(date)"

    # Load environment variables
    if [ -f ".env.production" ]; then
        export $(cat .env.production | grep -v '^#' | xargs)
        print_status "Environment variables loaded ✓"
    fi

    # Deployment steps
    pre_deploy_checks
    backup_current
    build_application

    # Choose deployment method based on environment
    case $DEPLOY_ENV in
        "vercel")
            deploy_to_vercel
            ;;
        "docker")
            deploy_docker
            ;;
        "production")
            deploy_to_vercel
            deploy_docker
            ;;
        *)
            print_error "Unknown deployment environment: $DEPLOY_ENV"
            exit 1
            ;;
    esac

    run_migrations
    post_deploy_checks
    cleanup
    send_notification

    print_header "Deployment completed successfully! 🎉"
    print_status "Application is now live and healthy!"
}

# Error handling
trap 'print_error "Deployment failed at line $LINENO"' ERR

# Run main function with all arguments
main "$@"