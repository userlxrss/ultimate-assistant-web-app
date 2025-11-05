# Vercel Deployment Guide

## Overview
This Next.js 14 application with Supabase integration is now configured for successful deployment on Vercel.

## Required Environment Variables

Before deploying, you must configure these environment variables in your Vercel project:

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Get from your Supabase project dashboard
   - Format: `https://your-project-id.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Get from your Supabase project dashboard under Settings > API
   - This is the public/anonymous key (safe to use in client-side code)

## Setup Instructions

### 1. Get Supabase Credentials
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project or create a new one
3. Navigate to Settings > API
4. Copy the Project URL and anon public key

### 2. Configure Vercel Environment Variables

**Option A: Using Vercel Dashboard**
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following variables:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`, Value: Your Supabase URL
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`, Value: Your Supabase anon key

**Option B: Using Vercel CLI**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
npm install -g vercel
vercel
```

**Option B: Using Git Integration**
1. Push your code to GitHub/GitLab
2. Connect your repository to Vercel
3. Vercel will automatically deploy

## Database Setup

After deployment, ensure your Supabase database has the required `profiles` table:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  username TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## Troubleshooting

### 404 Errors After Deployment
1. Verify environment variables are set correctly in Vercel
2. Check Vercel deployment logs for build errors
3. Ensure your Supabase project is active and URL is accessible

### Authentication Issues
1. Verify Supabase URL and keys are correct
2. Check if email confirmation is enabled in Supabase auth settings
3. Ensure CORS is properly configured in Supabase settings

### Build Errors
1. Run `npm run build` locally to reproduce issues
2. Check that all dependencies are properly installed
3. Verify TypeScript types are correct

## Features Successfully Configured

✅ **Next.js 14 with App Router**
- Proper build configuration for Vercel
- Optimized static generation

✅ **Supabase Integration**
- Authentication (sign up, sign in, sign out)
- Profile management
- Row-level security policies

✅ **Tailwind CSS**
- Proper PostCSS configuration
- Optimized for production builds

✅ **TypeScript**
- Full type safety
- Proper path mapping with @/ imports

✅ **Security Headers**
- XSS protection
- Content type protection
- Frame protection

## Production Considerations

1. **Environment Variables**: Never commit `.env.local` files
2. **Database**: Set up proper backup and monitoring
3. **Domain**: Configure custom domain in Vercel dashboard
4. **Analytics**: Enable Vercel Analytics for performance monitoring
5. **Error Tracking**: Consider integrating Sentry or similar service

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Verify Supabase configuration
3. Ensure all environment variables are set
4. Test locally with `npm run build && npm start`