# Productivity Hub Deployment Guide

## Overview
This guide provides a complete solution for deploying and managing the Productivity Hub web application with Gmail, Motion, and Google Calendar integrations.

## 🚀 Quick Start

### 1. Clean Startup
```bash
./start-clean.sh
```
This single command:
- Kills all conflicting processes
- Installs dependencies if needed
- Starts the development server
- Optionally starts Gmail and backend services
- Monitors all services

### 2. Manual Alternative
```bash
# Kill conflicting processes
pkill -f "vite" && pkill -f "node.*gmail" && pkill -f "node.*server"

# Start development server
npm run dev

# Start Gmail integration (in separate terminal)
npm run gmail-server

# Start backend server (in separate terminal, if needed)
cd server && npm start
```

## 📁 Project Structure

```
chat-ac5267c7/
├── src/
│   ├── components/
│   │   ├── SettingsStable.tsx    # Fixed settings component
│   │   ├── oauth/                # OAuth integration
│   │   └── email/                # Gmail integration
│   ├── MainApp.tsx               # Main application (updated)
│   └── utils/motionApi.ts        # Motion API integration
├── server/                       # Backend server
├── gmail-imap-server.cjs         # Gmail IMAP server
├── start-clean.sh               # Clean startup script
├── package.json                 # Frontend dependencies
└── .env                         # Environment variables
```

## 🔧 Environment Configuration

### Required Environment Variables (.env)
```bash
# Gmail Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# OAuth Configuration (add as needed)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MOTION_API_KEY=your-motion-api-key
```

### Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character App Password in `SMTP_PASS`

## 🐛 Troubleshooting Common Issues

### 1. Port Conflicts
```bash
# Check what's using ports
lsof -i :5173,5174,5175,3000,3001,8080

# Kill conflicting processes
lsof -ti:5173,5174,5175,3000,3001,8080 | xargs kill -9
```

### 2. Component Flickering
- **Problem**: Settings tab flickers due to re-renders
- **Solution**: Use `SettingsStable.tsx` instead of original settings
- **Fixed**: Implemented proper React.memo and useCallback patterns

### 3. Motion OAuth Issues
- **Problem**: Cannot connect Motion account
- **Solution**:
  1. Get API key from https://app.usemotion.com/settings/api
  2. Enter API key in Settings → Motion Integration
  3. Test connection

### 4. Gmail Connection Issues
- **Problem**: Gmail integration not working
- **Solution**:
  1. Check .env file has correct SMTP credentials
  2. Verify App Password is correct (no spaces)
  3. Ensure Gmail IMAP is enabled

## 📊 Service URLs

After startup:
- **Frontend**: http://localhost:5173
- **Gmail Proxy**: http://localhost:8080
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🔒 Security Considerations

### Production Deployment
1. **Environment Variables**: Never commit .env files
2. **HTTPS**: Use HTTPS in production
3. **CORS**: Configure proper CORS policies
4. **Rate Limiting**: Implement rate limiting on APIs
5. **Authentication**: Secure OAuth flows

### Development Security
```bash
# Audit dependencies
npm audit

# Fix security issues
npm audit fix

# Run security audit
npm run security-audit
```

## 🚀 Production Deployment

### Option 1: Vercel (Recommended for Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option 2: Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Option 3: Traditional Server
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📈 Monitoring and Logs

### Health Checks
```bash
# Check frontend
curl http://localhost:5173

# Check backend
curl http://localhost:3001/health

# Check Gmail service
curl http://localhost:8080/health
```

### Log Monitoring
```bash
# View development logs
npm run dev 2>&1 | tee dev.log

# View Gmail logs
tail -f gmail-server.log

# View backend logs
cd server && tail -f logs/app.log
```

## 🔧 Maintenance

### Regular Tasks
1. **Update Dependencies**: `npm update`
2. **Security Audits**: `npm audit`
3. **Backup Database**: Regular backups
4. **Monitor Logs**: Check for errors daily

### Performance Optimization
1. **Bundle Analysis**: `npm run build -- --analyze`
2. **Image Optimization**: Compress images
3. **Code Splitting**: Implement lazy loading
4. **Caching**: Add appropriate cache headers

## 🆘 Emergency Procedures

### Complete Reset
```bash
# Kill everything
pkill -f "node" && pkill -f "vite"

# Clear caches
rm -rf node_modules package-lock.json
npm install

# Restart fresh
./start-clean.sh
```

### Database Reset (if applicable)
```bash
# Reset database
cd server
npm run db:reset

# Seed with sample data
npm run db:seed
```

## 📞 Support

### Common Error Messages
- **"Port already in use"**: Run the clean startup script
- **"Cannot connect to Motion"**: Check API key in settings
- **"Gmail authentication failed"**: Verify App Password
- **"Component flickering"**: Use SettingsStable component

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run dev

# Or specific modules
DEBUG=app:* npm run dev
```

## 🎯 Next Steps

1. **Test All Integrations**: Verify Gmail, Motion, and Calendar work
2. **Configure OAuth**: Set up proper OAuth for production
3. **Add Monitoring**: Implement error tracking
4. **Deploy to Production**: Use Vercel or your preferred platform
5. **Set Up CI/CD**: Automate testing and deployment

---

## 🎉 Success Checklist

- [ ] All background processes cleaned up
- [ ] Frontend loads without flickering
- [ ] Motion OAuth connects successfully
- [ ] Gmail integration works
- [ ] Google Calendar syncs events
- [ ] All services are monitored
- [ ] Environment variables configured
- [ ] Security audit passed
- [ ] Performance optimized
- [ ] Backup procedures in place

For urgent issues, run `./start-clean.sh` to reset everything to a clean state.