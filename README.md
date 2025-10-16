# ConvertCast

**Live streaming platform with AI-powered features for product sellers and service providers.**

## 🚨 Important: Read Before Starting

1. **[LESSONS_LEARNED.md](./LESSONS_LEARNED.md)** - Critical mistakes to avoid (READ BEFORE FIXING BUGS)
2. **[CLAUDE.md](./CLAUDE.md)** - Current system status and architecture
3. **This file** - Quick start guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (currently using v20.18.1)
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/peterpty/convertcast-production.git
cd convertcast

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
```

### Environment Setup

Edit `.env.local` with your credentials:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>

# Mux Video (Required for streaming)
MUX_TOKEN_ID=<your-mux-token-id>
MUX_TOKEN_SECRET=<your-mux-token-secret>

# WebSocket (Optional - falls back to mock mode)
NEXT_PUBLIC_WEBSOCKET_URL=<your-websocket-url>
```

See **[CLAUDE.md](./CLAUDE.md)** for detailed configuration instructions.

### Development

```bash
# Start development server
npm run dev

# Server starts at http://localhost:3009
```

Visit http://localhost:3009 to see the application.

## 📚 Documentation

### Essential Reading
- **[LESSONS_LEARNED.md](./LESSONS_LEARNED.md)** - Critical mistakes and debugging patterns
- **[CLAUDE.md](./CLAUDE.md)** - Complete system documentation
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Production deployment guide
- **[MUX_SETUP_GUIDE.md](./MUX_SETUP_GUIDE.md)** - Mux streaming configuration

### Feature Documentation
- **[EVENT_SYSTEM_DOCUMENTATION.md](./EVENT_SYSTEM_DOCUMENTATION.md)** - Event notifications
- **[AUTHENTICATION_COMPLETE_SUMMARY.md](./AUTHENTICATION_COMPLETE_SUMMARY.md)** - Auth system
- **[WEBSOCKET_DEBUG_GUIDE.md](./WEBSOCKET_DEBUG_GUIDE.md)** - WebSocket debugging

## 🎯 Key Features

### For Streamers (Studio Dashboard)
- **Event Lifecycle Management** ⭐ NEW
  - Create scheduled events with title and description
  - One-click "Go Live" button creates stream automatically
  - Studio displays event context (title, description)
  - Seamless workflow from event creation to live streaming
- Real-time Mux stream management
- Live preview with OBS integration
- Stream health monitoring
- AI-powered features:
  - Hot Leads detection
  - AI Live Chat
  - AutoOffer™ engine
  - Insight Dashboard
  - Smart Scheduler

### For Viewers
- **Pre-Event Experience** ⭐ NEW
  - Beautiful countdown timer for upcoming events
  - Displays event title, description, and scheduled start time
  - Automatically switches to video when event goes live
  - Smart URL routing (works with both eventId and stream URLs)
- Low-latency streaming (2-6 second delay)
- Live chat with reactions
- Real-time overlays (polls, special offers)
- Mobile-optimized experience
- Fullscreen landscape mode

### Technical Features
- Email + Google OAuth authentication
- Row Level Security (RLS) with Supabase
- Real-time WebSocket communication
- RTMP streaming via Mux
- Responsive design (mobile + desktop)

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Video**: Mux Live Streaming (low-latency mode)
- **Database**: Supabase (PostgreSQL + real-time)
- **Auth**: Supabase Auth (Email + OAuth)
- **Realtime**: WebSocket (Socket.io) with fallback
- **Deployment**: Vercel

## 🔧 Development Workflow

### Before Fixing Bugs
1. Read [LESSONS_LEARNED.md](./LESSONS_LEARNED.md)
2. Test locally before deploying
3. One change at a time
4. Review git diff before committing

### Before Deploying
1. Test at http://localhost:3009
2. Check browser console for errors
3. Verify affected features work
4. Review [DEPLOYMENT.md](./DEPLOYMENT.md) checklist

### Git Workflow
```bash
# Check current status
git status
git log --oneline -5

# Make changes, test locally
npm run dev

# Commit and deploy
git add .
git commit -m "descriptive message"
git push  # Auto-deploys to Vercel
```

## 🐛 Common Issues

**Problem**: Page crashes with "too many re-renders"
**Solution**: Check [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) Section: Infinite Re-Render Loops

**Problem**: Chat input loses focus
**Solution**: Already fixed in commit `6b73f56`

**Problem**: Stream latency too high
**Solution**: Delete old streams, create new ones (low-latency mode enabled)

**Problem**: WebSocket not connecting
**Solution**: Expected - using fallback mode. Overlays still work.

## 📦 Production Deployment

### Vercel Deployment (Automatic)
```bash
git push  # Automatically deploys to Vercel
```

**Production URL**: https://www.convertcast.app

### Environment Variables (Vercel)
Add these in Vercel Dashboard → Settings → Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=<configured>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<configured>
SUPABASE_SERVICE_ROLE_KEY=<configured>
MUX_TOKEN_ID=<configured>
MUX_TOKEN_SECRET=<configured>
NEXT_PUBLIC_MUX_ENV_KEY=<configured>
NEXT_PUBLIC_MUX_CONFIGURED=true
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🔒 Security

- Never commit `.env.local` (protected by `.gitignore`)
- Use environment variables for all secrets
- Row Level Security (RLS) enabled on all tables
- Supabase Auth with email verification
- Password minimum 6 characters

## 📊 Project Structure

```
convertcast/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── dashboard/          # Studio dashboard
│   │   ├── watch/[id]/         # Viewer page
│   │   └── auth/               # Authentication pages
│   ├── components/             # React components
│   │   ├── studio/             # Studio components
│   │   └── viewer/             # Viewer components
│   ├── lib/                    # Utilities and services
│   │   ├── streaming/          # Mux integration
│   │   ├── websocket/          # WebSocket hooks
│   │   └── supabase/           # Supabase client
│   └── hooks/                  # Custom React hooks
├── public/                     # Static assets
└── supabase/                   # Database migrations
```

## 🆘 Support

**Issues or Questions?**
- Check [CLAUDE.md](./CLAUDE.md) for system documentation
- Review [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) for common mistakes
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment help

**Emergency Revert:**
```bash
git reset --hard <last-working-commit>
git push --force
```

See [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) for emergency procedures.

## 📈 Current Status

**Production Status**: ✅ PRODUCTION READY - All systems operational
**Current Branch**: `clean-production-v2`
**Last Stable Commit**: `6b73f56` - "fix: FINAL FIX for chat input focus loss"
**Development Server**: http://localhost:3009

See [CLAUDE.md](./CLAUDE.md) for detailed status and roadmap.

## 📝 License

Proprietary - All rights reserved

---

**Remember**: Read [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) before fixing bugs or adding features!
