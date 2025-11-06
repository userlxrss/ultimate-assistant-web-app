#!/bin/bash

# Vercel Deployment Trigger Script
# This script helps manually trigger Vercel deployments when auto-deploy doesn't work

echo "🚀 Vercel Deployment Trigger Script"
echo "==================================="
echo ""

# Function to trigger GitHub workflow
trigger_github_workflow() {
    echo "📧 Triggering GitHub workflow deployment..."

    # Get the latest commit SHA
    COMMIT_SHA=$(git rev-parse HEAD)
    echo "📋 Latest commit: $COMMIT_SHA"

    # Create a dispatch event to trigger the workflow
    curl -X POST \
        -H "Authorization: token YOUR_GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/repos/userlxrss/ultimate-assistant-web-app/dispatches \
        -d '{
            "event_type": "deploy-vercel",
            "client_payload": {
                "commit_sha": "'$COMMIT_SHA'",
                "message": "Manual trigger for email verification deployment"
            }
        }' 2>/dev/null || echo "❌ GitHub workflow trigger failed - need GitHub token"
}

# Function to create deploy trigger commit
create_deploy_commit() {
    echo "📝 Creating deployment trigger commit..."

    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S UTC')
    echo "📅 Timestamp: $TIMESTAMP"

    # Update the deployment trigger file
    cat > deploy-trigger.txt << EOF
🚀 MANUAL DEPLOYMENT TRIGGER
📧 Email verification system ready for production
🔐 Secure authentication with mandatory email confirmation
🌐 Target: dailydeck.vercel.app
⏰ Triggered: $TIMESTAMP
🔄 Status: Ready for Vercel deployment
EOF

    # Commit and push
    git add deploy-trigger.txt
    git commit -m "🔄 Manual deployment trigger - $TIMESTAMP

📧 Email verification system ready for production
🔐 Secure authentication with mandatory email confirmation
🚀 Ready for immediate deployment to dailydeck.vercel.app

This manual trigger will force Vercel to deploy the latest changes
including the comprehensive email verification system.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

    git push origin main
    echo "✅ Deployment trigger commit pushed successfully!"
}

# Function to check deployment status
check_deployment_status() {
    echo "🔍 Checking deployment status..."

    # Check latest commits
    echo "📋 Latest commits:"
    git log --oneline -5

    echo ""
    echo "🌐 Check these URLs for deployment status:"
    echo "   Production: https://dailydeck.vercel.app"
    echo "   Vercel Dashboard: https://vercel.com/dashboard"
    echo "   GitHub Actions: https://github.com/userlxrss/ultimate-assistant-web-app/actions"
}

# Main execution
main() {
    case "${1:-trigger}" in
        "github")
            trigger_github_workflow
            ;;
        "commit")
            create_deploy_commit
            ;;
        "status")
            check_deployment_status
            ;;
        "trigger"|"all")
            create_deploy_commit
            echo ""
            check_deployment_status
            ;;
        *)
            echo "Usage: $0 [github|commit|status|trigger|all]"
            echo "  github  - Trigger GitHub workflow deployment"
            echo "  commit  - Create deployment trigger commit"
            echo "  status  - Check deployment status"
            echo "  trigger  - Create commit and check status (default)"
            echo "  all     - Run all triggers"
            exit 1
            ;;
    esac
}

# Run the main function
main "$@"