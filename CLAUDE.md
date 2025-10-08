# ConvertCast Development Status

**⚠️ CRITICAL: Before fixing bugs or adding features, read [LESSONS_LEARNED.md](./LESSONS_LEARNED.md)**

**Last Updated:** 2025-10-07
**Development Server:** http://localhost:3009
**Production Status:** ✅ PRODUCTION READY - All systems operational
**Current Branch:** `clean-production-v2`

---

## 🚨 **MANDATORY READ BEFORE ANY WORK**

1. **[LESSONS_LEARNED.md](./LESSONS_LEARNED.md)** - Critical mistakes and how to avoid them
2. **This file (CLAUDE.md)** - Current system status and architecture
3. **[README.md](./README.md)** - Project overview and setup

**Why This Matters:**
- Multiple production outages have occurred from rushing fixes
- Patterns documented in LESSONS_LEARNED.md prevent repeated mistakes
- Always revert first when production is broken, debug second

---

## 📋 Quick Reference

**Key Files to Reference:**
- `LESSONS_LEARNED.md` - **Read this first** before any bug fix
- `CLAUDE.md` - This file - Current system status
- `README.md` - Project setup and overview
- `DEPLOYMENT.md` - Production deployment guide
- `MUX_SETUP_GUIDE.md` - Mux video streaming configuration

**Development Workflow:**
```bash
cd "C:\Users\peter\Desktop\Cast Away\convertcast"
npm run dev  # Starts on http://localhost:3009
```

---

## ✅ **CURRENT SYSTEM STATUS**

### **Core Features (Production Ready)**

#### **Streaming Foundation**
- ✅ Real Mux stream creation and management
- ✅ RTMP server integration: `rtmp://global-live.mux.com/app`
- ✅ Stream health monitoring with Mux API
- ✅ OBS connection working and verified
- ✅ **Low-latency mode enabled** (2-6 second delay)
- ✅ User-isolated streams (RLS policies enforced)

#### **Studio Dashboard (Streamer Interface)**
- ✅ Real-time stream management
- ✅ Live preview with OBS integration
- ✅ Stream health monitoring
- ✅ AI-powered features:
  - Hot Leads detection
  - AI Live Chat
  - AutoOffer™ engine
  - Insight Dashboard
  - Smart Scheduler

#### **Overlay System**
- ✅ Real-time overlay broadcasting (Studio → Viewers)
- ✅ Poll overlays with voting
- ✅ Special offer overlays with countdowns
- ✅ Manual test buttons in Stream Info tab
- ⚠️ WebSocket fallback active (need production WebSocket server)

#### **Viewer Experience**
- ✅ Production-ready streaming player (Mux)
- ✅ Volume and fullscreen controls
- ✅ Real-time overlay reception
- ✅ Live chat (Supabase real-time)
- ✅ Reaction system
- ✅ **Mobile optimized** with immersive landscape mode
- ✅ **Chat focus bug fixed** (4-part fix, commit `6b73f56`)

#### **Mobile Viewer Features**
- ✅ Landscape lock with rotation prompt
- ✅ Edge-to-edge fullscreen video
- ✅ Auto-hide controls (tap to show)
- ✅ iOS fullscreen compatibility
- ✅ Keyboard-aware UI positioning
- ✅ Live-lock system (7-layer protection)
- ✅ Scaled overlays (60% size in landscape)

#### **Authentication System**
- ✅ Email signup with verification
- ✅ Email login with session management
- ✅ Password reset flow
- ✅ Google OAuth integration
- ✅ Protected routes with middleware
- ✅ Row Level Security (RLS) policies

---

## 🛠️ **CRITICAL FIXES APPLIED**

### **Latest Working Commit: `6b73f56`**
**Title:** "fix: FINAL FIX for chat input focus loss - multi-layer solution"

**What This Fixed:**
- Chat input focus loss on mobile/desktop
- 97% reduction in re-renders (conditional state updates)
- Debounced resize events (150ms mobile, 50ms keyboard)
- Component stays mounted with CSS visibility
- Input maintains focus through all interactions

**Do NOT revert past this commit** - It's the last stable production state.

### **Other Critical Fixes:**
1. **Low-Latency Streaming** (`27ffd2e`)
   - Added `latency_mode: 'low'` to Mux stream creation
   - 2-6 second delay instead of 10-30 seconds
   - **Note:** Must delete old streams and create new ones

2. **User Stream Isolation** (Multiple commits)
   - Created `/api/mux/stream/user` endpoint
   - Added RLS policies to prevent shared stream keys
   - Fixed critical security issue

3. **Purple Overlay Removal** (`f55802f`)
   - Changed MuxPlayer colors to transparent/white
   - Removed live-only controls (play/pause/seek)
   - Added auto-resume on pause attempts

4. **Stream Key Refresh** (`fe18408`)
   - Added error handling
   - User feedback with success/error states
   - Fixed silent failures

---

## 🐛 **KNOWN ISSUES & WORKAROUNDS**

### **Non-Critical Issues:**
1. **WebSocket Mock Fallback Active**
   - Need production WebSocket server
   - Current: Demo overlays work, real-time may be delayed
   - Workaround: System functions with fallback

2. **Console Spam** (Fixed with memoization)
   - StudioDashboard re-render loops fixed
   - `handleOverlayTrigger` memoized
   - Stream object memoized

### **Critical Issues (None Currently)**
- System is stable on commit `6b73f56`
- No production-breaking bugs

---

## 🏗️ **ARCHITECTURE OVERVIEW**

### **Technology Stack:**
- **Frontend:** Next.js 15, React 18, TypeScript, Tailwind CSS
- **Video:** Mux Live Streaming (low-latency mode)
- **Database:** Supabase (PostgreSQL with real-time subscriptions)
- **Auth:** Supabase Auth (Email + Google OAuth)
- **Realtime:** WebSocket (Socket.io) with mock fallback
- **Deployment:** Vercel (auto-deploy from GitHub)

### **Key File Locations:**

**Studio (Streamer):**
- `src/app/dashboard/stream/studio/page.tsx` - Main studio page
- `src/components/studio/StudioDashboard.tsx` - Dashboard component
- `src/components/studio/RightPanel.tsx` - AI features panel
- `src/components/studio/LivePreview.tsx` - Video preview

**Viewer:**
- `src/app/watch/[id]/page.tsx` - Main viewer page
- `src/components/viewer/InstagramBar.tsx` - Mobile chat bar
- `src/components/viewer/FloatingComments.tsx` - Floating comments
- `src/components/viewer/MuteToggle.tsx` - Audio control

**Core Services:**
- `src/lib/streaming/muxProductionService.ts` - Mux API integration
- `src/lib/websocket/useWebSocket.ts` - WebSocket hook
- `src/lib/supabase/chatService.ts` - Chat functionality

**Custom Hooks:**
- `src/hooks/useMobileDetection.ts` - Rotation-proof mobile detection
- `src/hooks/useKeyboardDetection.ts` - Virtual keyboard tracking
- `src/hooks/useOrientation.ts` - Device orientation
- `src/hooks/useAutoHide.ts` - Auto-hide controls
- `src/hooks/useLandscapeLock.ts` - Lock to landscape mode

---

## 🔑 **ENVIRONMENT VARIABLES**

### **Required (Already Configured in .env.local):**
```env
# Mux Video (Production)
MUX_TOKEN_ID=<configured>
MUX_TOKEN_SECRET=<configured>

# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=<configured>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<configured>
SUPABASE_SERVICE_ROLE_KEY=<configured>

# WebSocket (To Be Added)
NEXT_PUBLIC_WEBSOCKET_URL=<not configured - using fallback>

# Mailgun (For notifications)
MAILGUN_API_KEY=<configured>
MAILGUN_DOMAIN=mail.convertcast.com

# Twilio (For SMS)
TWILIO_ACCOUNT_SID=<configured>
TWILIO_AUTH_TOKEN=<configured>
TWILIO_PHONE_NUMBER=+18889730264
```

**Security Note:** Never commit `.env.local` to git. It's in `.gitignore`.

---

## 🧪 **TESTING PROTOCOL**

### **Before Deploying ANY Change:**

1. ✅ Test locally at http://localhost:3009
2. ✅ Verify in Chrome DevTools console (no errors)
3. ✅ Test affected features work correctly
4. ✅ Test on mobile if mobile-related
5. ✅ Hard refresh browser (Ctrl+Shift+R)
6. ✅ Review git diff before committing
7. ✅ Read [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) checklist

### **For Critical Bug Fixes:**

1. ✅ **REVERT FIRST** - Get production working immediately
2. ✅ Notify user production is restored
3. ✅ Debug on separate branch
4. ✅ Test extensively before deploying
5. ✅ Deploy during off-hours
6. ✅ Monitor logs after deploy

### **Test URLs:**
- **Homepage:** http://localhost:3009
- **Dashboard:** http://localhost:3009/dashboard
- **Studio:** http://localhost:3009/dashboard/stream/studio
- **Viewer:** http://localhost:3009/watch/[streamId]
- **Login:** http://localhost:3009/auth/login

---

## 📦 **DEPLOYMENT**

### **Automatic Deployment (Vercel):**
```bash
git add .
git commit -m "descriptive message"
git push  # Auto-deploys to Vercel
```

**Deployment Time:** ~2 minutes
**Production URL:** https://www.convertcast.app

### **Force Deployment (After Revert):**
```bash
git push --force  # Only use after git reset --hard
```

**⚠️ Warning:** Force push overwrites remote history. Only use when reverting production.

### **Monitoring:**
- Vercel Dashboard: https://vercel.com/dashboard
- Supabase Dashboard: https://supabase.com/dashboard/project/yedvdwedhoetxukablxf
- GitHub Repo: https://github.com/peterpty/convertcast-production

---

## 🎯 **MVP GAPS & ROADMAP**

### **High Priority (Needed for Full Launch):**

1. **Production WebSocket Server**
   - Current: Mock fallback active
   - Impact: Real-time features work but may have delays
   - Fix: Deploy Socket.io server on Railway or similar

2. **Stream Lifecycle Management**
   - Current: No "End Stream" button
   - Impact: Streams accumulate in Mux
   - Fix: Add end stream functionality + cleanup

3. **Stream Credentials UX**
   - Current: Hidden in tab
   - Impact: Users don't know how to start
   - Fix: Prominent display + OBS setup guide

### **Medium Priority:**
- Stream history/archive page
- Recording functionality
- Enhanced analytics dashboard
- Multi-stream support

### **Low Priority:**
- Advanced AI features (real ML models)
- Mobile apps (React Native)
- Integrations (CRM, email marketing)

---

## 🚀 **QUICK START FOR NEW SESSION**

1. **Read this first:**
   - [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) - Critical mistakes to avoid
   - This file - Current system status

2. **Check current state:**
   ```bash
   cd "C:\Users\peter\Desktop\Cast Away\convertcast"
   git status
   git log --oneline -5
   ```

3. **Start development:**
   ```bash
   npm run dev  # Starts on http://localhost:3009
   ```

4. **Reference documents:**
   - `LESSONS_LEARNED.md` - Before fixing bugs
   - `DEPLOYMENT.md` - Before deploying
   - `MUX_SETUP_GUIDE.md` - For streaming issues

---

## 📞 **SUPPORT & TROUBLESHOOTING**

### **Common Issues:**

**Problem:** Page crashes with "too many re-renders"
**Solution:** Check [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) Section: Infinite Re-Render Loops

**Problem:** Chat input loses focus
**Solution:** Ensure on commit `6b73f56` or later (already fixed)

**Problem:** Stream latency too high
**Solution:** Delete old streams, create new ones (low-latency mode added in `27ffd2e`)

**Problem:** WebSocket not connecting
**Solution:** Expected - using fallback mode. Overlays still work.

### **Emergency Procedures:**

**Production is down:**
1. Check last working commit: `git log --oneline -10`
2. Revert: `git reset --hard <last-working-commit>`
3. Force push: `git push --force`
4. Notify user: "Production restored to commit <hash>"

**Need to test locally:**
1. Make changes
2. `npm run dev`
3. Test at http://localhost:3009
4. Verify in Chrome DevTools
5. Only then: `git push`

---

## 📚 **ADDITIONAL DOCUMENTATION**

**Project Documentation:**
- `README.md` - Project overview and setup
- `LESSONS_LEARNED.md` - **Critical** - Read before any work
- `DEPLOYMENT.md` - Deployment procedures
- `MUX_SETUP_GUIDE.md` - Mux streaming configuration

**Feature Documentation:**
- `EVENT_SYSTEM_DOCUMENTATION.md` - Event notifications
- `WEBSOCKET_DEBUG_GUIDE.md` - WebSocket debugging
- `AUTHENTICATION_COMPLETE_SUMMARY.md` - Auth system

**Historical (Reference Only):**
- `CRITICAL_FIX_SUMMARY.md` - Past emergency fixes
- `PRODUCTION_FIX_REDIRECT_LOOP.md` - Redirect loop fix
- `STREAM_ID_FIX_FINAL.md` - Stream ID issues

---

## ⚠️ **CRITICAL REMINDERS**

1. **Read [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) before EVERY bug fix**
2. **Test locally before deploying** - No exceptions
3. **Revert first, debug second** - When production breaks
4. **One change at a time** - Don't shotgun fixes
5. **Trust the user** - If they say it's broken, it's broken
6. **Document mistakes** - Add to LESSONS_LEARNED.md

---

**Last Stable Commit:** `6b73f56` - "fix: FINAL FIX for chat input focus loss"
**Production Status:** ⚠️ MVP IN PROGRESS - Critical fixes needed
**Next Priority:** Fix private messages + pinned messages

**Remember: Production stability > moving fast. Test thoroughly.**

---

## 🎯 **PRODUCTION ROADMAP**

**CRITICAL:** See [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md) for comprehensive plan

**Current Status:** 54% MVP Ready (14/26 requirements complete)

**BLOCKING ISSUES:**
1. **Private Messages:** ❌ BROKEN - Viewers seeing other viewers' private messages
2. **Pinned Messages:** ⚠️ UNTESTED - Needs verification after RLS fix

**IMMEDIATE ACTION REQUIRED:**
1. Apply SQL migration: `supabase/migrations/20250110000001_fix_chat_rls_for_anonymous.sql`
2. Test private messages with multiple browsers
3. Test pinned messages in viewer interface

**Target MVP Date:** 2-3 weeks from now

See full roadmap with all phases, milestones, and success criteria in [PRODUCTION_ROADMAP.md](./PRODUCTION_ROADMAP.md)
