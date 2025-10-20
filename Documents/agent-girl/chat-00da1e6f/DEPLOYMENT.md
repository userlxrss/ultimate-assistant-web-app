# Ultimate Assistant Hub - Deployment Guide

This comprehensive deployment guide covers all aspects of deploying the Ultimate Assistant Hub to production environments.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL database
- Redis cache
- Domain name with SSL certificates

### Environment Setup

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd ultimate-assistant-hub
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   # Fill in your environment variables
   ```

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

## 🐳 Docker Deployment

### Local Development
```bash
# Start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment
```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Scale the application
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

## ☁️ Cloud Deployment

### Vercel (Frontend)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Environment Variables** (Set in Vercel Dashboard)
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `REDIS_URL`

### Railway (Backend)

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy**
   ```bash
   railway login
   railway up
   ```

### Render (Alternative)

1. **Connect GitHub Repository**
2. **Configure Environment Variables**
3. **Deploy Automatically on Push**

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster
- kubectl configured
- cert-manager for SSL

### Deploy
```bash
# Deploy all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n ultimate-assistant-hub

# View logs
kubectl logs -f deployment/ultimate-assistant-hub -n ultimate-assistant-hub
```

### Scale Application
```bash
# Scale to 5 replicas
kubectl scale deployment ultimate-assistant-hub --replicas=5 -n ultimate-assistant-hub
```

## 🔄 CI/CD Pipeline

### GitHub Actions Setup

1. **Repository Secrets** (Settings → Secrets and variables → Actions)
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `RAILWAY_TOKEN`
   - `RAILWAY_SERVICE_ID`

2. **Automatic Deployment**
   - Push to `main` → Production deployment
   - Pull requests → Testing only

### Manual Deployment Scripts

```bash
# Production build
npm run build:prod

# Deploy to production
npm run deploy:prod

# Migrate database
npm run migrate:prod
```

## 🗄️ Database Management

### Migrations
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Deploy migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Backup and Restore
```bash
# Backup database
npm run db:backup

# Restore database
npm run db:restore
```

### Seeding
```bash
# Seed with initial data
npm run db:seed
```

## 🔍 Monitoring and Health Checks

### Health Endpoints
- `/api/health` - Basic health check
- `/api/health?type=deep` - Comprehensive health check
- `/api/health?type=readiness` - Readiness probe

### Monitoring Setup

1. **Application Logs**
   ```bash
   # Docker logs
   docker-compose logs -f app

   # Kubernetes logs
   kubectl logs -f deployment/ultimate-assistant-hub -n ultimate-assistant-hub
   ```

2. **Performance Monitoring**
   - Add Sentry for error tracking
   - Configure Vercel Analytics
   - Set up custom metrics

## 🔒 Security

### SSL/TLS Configuration
- Automatic SSL with Let's Encrypt (Kubernetes)
- Vercel provides SSL automatically
- Railway/Render include SSL

### Environment Variables
Never commit secrets to Git. Use:
- Environment files (`.env.production`)
- Cloud provider secret management
- Kubernetes secrets

### Security Headers
All deployments include security headers:
- HSTS
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection**
   ```bash
   # Test database connection
   npx prisma db pull
   ```

2. **Build Failures**
   ```bash
   # Clean build
   rm -rf .next node_modules
   npm install
   npm run build
   ```

3. **Docker Issues**
   ```bash
   # Rebuild containers
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

4. **Migration Locks**
   ```bash
   # Check for migration locks
   npx prisma migrate resolve --rolled-back migration_name
   ```

### Performance Optimization

1. **Database**
   - Add indexes to frequently queried columns
   - Use connection pooling
   - Monitor query performance

2. **Application**
   - Enable Next.js caching
   - Use CDN for static assets
   - Implement Redis caching

3. **Infrastructure**
   - Use horizontal pod autoscaling
   - Configure load balancing
   - Monitor resource usage

## 📋 Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificates installed
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Security headers verified
- [ ] Performance tests passing
- [ ] Documentation updated
- [ ] Team notification setup

## 🔄 Rollback Procedure

### Quick Rollback
```bash
# Rollback database
./scripts/migrate.sh rollback

# Rollback application
git checkout previous_commit_tag
npm run deploy:prod
```

### Full Rollback
```bash
# Stop current deployment
kubectl scale deployment ultimate-assistant-hub --replicas=0 -n ultimate-assistant-hub

# Restore database backup
psql $DATABASE_URL < backup.sql

# Deploy previous version
kubectl apply -f k8s/previous-version/
```

## 📞 Support

For deployment issues:
1. Check logs for error messages
2. Verify environment variables
3. Test database connectivity
4. Check resource usage
5. Review GitHub Actions workflow

## 📚 Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)