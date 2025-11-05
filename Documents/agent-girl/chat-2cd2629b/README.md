# Profile Management App

A Next.js application with Supabase integration that demonstrates user profile data persistence, configured for Vercel deployment.

## Features

- ✅ User authentication (Sign Up/Sign In)
- ✅ Profile data saving to Supabase database
- ✅ Profile data loading and display
- ✅ Auto-save on field blur
- ✅ Profile data persistence across page refreshes
- ✅ Display name shown in header
- ✅ Configured for Vercel production deployment

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/profile-management-app)

## Setup Instructions

### 1. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL migration in `supabase/migrations/001_create_profiles_table.sql` in your Supabase SQL editor
3. Copy your Supabase URL and anon key

### 2. Local Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env.local` file based on `.env.example`:
   ```bash
   cp .env.example .env.local
   ```
4. Add your Supabase credentials to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. Run the development server:
   ```bash
   npm run dev
   ```

### 3. Vercel Deployment

📖 **For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

**Quick Steps:**
1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Required Environment Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Supabase Dashboard > Settings > API |

## Testing the Profile Persistence

1. **Sign up** for a new account
2. **Go to Settings** page
3. **Enter profile data** (display name, username, bio)
4. **Navigate away** or refresh the page
5. **Check that data persists** in both settings and header
6. **Verify auto-save** works when tabbing out of fields

## Technical Implementation

### Database Schema

The `profiles` table stores user profile information with:
- `user_id` (UUID, primary key)
- `display_name` (TEXT)
- `username` (TEXT)
- `bio` (TEXT)
- `avatar_url` (TEXT)
- Timestamps for created/updated tracking

### Key Features

- **Row Level Security**: Users can only access their own profile
- **Auto-updating timestamps**: `updated_at` updates automatically
- **Dual storage**: Profile data saved to both auth metadata and profiles table
- **Real-time updates**: Header displays current profile information
- **Auto-save functionality**: Fields save on blur for better UX

### Deployment Configuration

✅ **Vercel Ready**: Includes optimized configuration for Vercel deployment
- `vercel.json` with proper build settings
- Environment variable documentation
- Security headers configuration
- TypeScript support with proper type definitions

## File Structure

```
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── settings/
│       └── page.tsx
├── components/
│   └── Layout.tsx
├── lib/
│   └── supabase.ts
├── supabase/
│   └── migrations/
│       └── 001_create_profiles_table.sql
├── types/
│   └── env.d.ts
├── .env.example
├── .gitignore
├── DEPLOYMENT_GUIDE.md
├── README.md
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── vercel.json
```

## Troubleshooting

For deployment issues, see the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed troubleshooting steps.