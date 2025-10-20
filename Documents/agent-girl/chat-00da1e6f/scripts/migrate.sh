#!/bin/bash

# Database Migration Script
# Handles database migrations for production environments

set -e

echo "🗄️  Database Migration Script"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Configuration
MIGRATION_LOCK_FILE="/tmp/migration.lock"
BACKUP_DIR="/tmp/db_backups/$(date +%Y%m%d_%H%M%S)"
ENVIRONMENT=${1:-production}

# Check if migration is already running
check_migration_lock() {
    if [ -f "$MIGRATION_LOCK_FILE" ]; then
        local pid=$(cat "$MIGRATION_LOCK_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            print_error "Migration is already running (PID: $pid)"
            exit 1
        else
            print_warning "Removing stale migration lock file"
            rm -f "$MIGRATION_LOCK_FILE"
        fi
    fi

    # Create lock file
    echo $$ > "$MIGRATION_LOCK_FILE"
    trap 'rm -f $MIGRATION_LOCK_FILE; exit $?' EXIT
}

# Backup database before migration
backup_database() {
    print_header "Creating Database Backup"

    mkdir -p "$BACKUP_DIR"

    if [ -n "$DATABASE_URL" ]; then
        print_status "Backing up database..."

        # Extract database info from URL
        DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')

        # Create backup
        pg_dump "$DATABASE_URL" > "$BACKUP_DIR/database.sql"
        gzip "$BACKUP_DIR/database.sql"

        print_status "Database backup created: $BACKUP_DIR/database.sql.gz"
    else
        print_warning "DATABASE_URL not set, skipping backup"
    fi
}

# Check database connection
check_database_connection() {
    print_header "Checking Database Connection"

    if ! npx prisma db pull --force 2>/dev/null; then
        print_error "Cannot connect to database"
        exit 1
    fi

    print_status "Database connection successful ✓"
}

# Generate Prisma client
generate_prisma_client() {
    print_header "Generating Prisma Client"

    npx prisma generate
    print_status "Prisma client generated ✓"
}

# Check for pending migrations
check_pending_migrations() {
    print_header "Checking for Pending Migrations"

    # Check if there are any pending migrations
    if npx prisma migrate deploy --dry-run 2>/dev/null | grep -q "No pending migrations"; then
        print_status "No pending migrations ✓"
        return 1
    else
        print_status "Pending migrations found ✓"
        return 0
    fi
}

# Apply migrations
apply_migrations() {
    print_header "Applying Database Migrations"

    # Run migrations in deployment mode (safer for production)
    npx prisma migrate deploy

    print_status "Migrations applied successfully ✓"
}

# Validate migration
validate_migration() {
    print_header "Validating Migration"

    # Test database connectivity
    npx prisma db pull --force

    # Validate Prisma schema
    npx prisma validate

    # Test a simple query
    npx prisma db execute --stdin <<< "SELECT 1 as test;" > /dev/null

    print_status "Migration validation successful ✓"
}

# Seed database (if needed)
seed_database() {
    if [ "$2" = "--seed" ]; then
        print_header "Seeding Database"

        if [ -f "prisma/seed.ts" ]; then
            npx tsx prisma/seed.ts
            print_status "Database seeded successfully ✓"
        else
            print_warning "No seed file found, skipping seeding"
        fi
    fi
}

# Post-migration health checks
post_migration_checks() {
    print_header "Post-Migration Health Checks"

    # Check if all expected tables exist
    local expected_tables=("User" "Task" "Contact" "Journal" "Calendar")
    local missing_tables=""

    for table in "${expected_tables[@]}"; do
        if ! npx prisma db execute --stdin <<< "SELECT 1 FROM \"$table\" LIMIT 1;" >/dev/null 2>&1; then
            missing_tables="$missing_tables $table"
        fi
    done

    if [ -n "$missing_tables" ]; then
        print_error "Missing tables:$missing_tables"
        exit 1
    fi

    print_status "All expected tables exist ✓"
    print_status "Post-migration health checks passed ✓"
}

# Main execution
main() {
    print_header "Ultimate Assistant Hub Database Migration"
    print_status "Environment: $ENVIRONMENT"
    print_status "Timestamp: $(date)"

    # Load environment variables
    if [ -f ".env.$ENVIRONMENT" ]; then
        export $(cat ".env.$ENVIRONMENT" | grep -v '^#' | xargs)
        print_status "Loaded .env.$ENVIRONMENT ✓"
    elif [ -f ".env" ]; then
        export $(cat ".env" | grep -v '^#' | xargs)
        print_status "Loaded .env ✓"
    else
        print_warning "No environment file found"
    fi

    # Migration process
    check_migration_lock
    backup_database
    check_database_connection
    generate_prisma_client

    if check_pending_migrations; then
        apply_migrations
        validate_migration
        seed_database "$@"
        post_migration_checks
        print_header "Migration completed successfully! 🎉"
    else
        print_status "No migrations to apply"
    fi
}

# Error handling
trap 'print_error "Migration failed at line $LINENO"' ERR

# Run main function
main "$@"