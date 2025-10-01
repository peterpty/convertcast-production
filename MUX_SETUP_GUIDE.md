# Mux Live Streaming Setup Guide

Your ConvertCast application is currently running in **DEMO MODE** for live streaming. To enable real Mux-powered live streaming with professional infrastructure, follow this guide.

## Current Status: Demo Mode

The application currently shows "DEMO MODE" because it's using placeholder Mux credentials. Demo mode provides:
- ✅ Simulated streaming interface
- ✅ Mock stream health monitoring
- ✅ Demo RTMP endpoints
- ❌ No actual video streaming
- ❌ No real stream ingestion

## Enable Real Mux Streaming

### Step 1: Create a Mux Account

1. Go to [mux.com](https://mux.com)
2. Sign up for a free account
3. Complete the verification process

### Step 2: Generate API Credentials

1. Log into your [Mux Dashboard](https://dashboard.mux.com)
2. Navigate to **Settings** → **Access Tokens**
3. Click **Generate new token**
4. Select permissions:
   - ✅ **Mux Video** (required for live streaming)
   - ✅ **Mux Data** (optional, for analytics)
5. Click **Generate token**
6. **Save both the Token ID and Token Secret immediately** - the secret won't be shown again!

### Step 3: Update Environment Variables

Edit your `.env.local` file:

```env
# Replace with your real Mux credentials
MUX_TOKEN_ID=your-actual-token-id-from-mux
MUX_TOKEN_SECRET=your-actual-token-secret-from-mux

# Optional: Add environment key for additional features
NEXT_PUBLIC_MUX_ENV_KEY=your-mux-env-key-here

# Set this to 'true' to enable real Mux streaming
NEXT_PUBLIC_MUX_CONFIGURED=true
```

### Step 4: Restart the Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Verification

After restarting, check the streaming setup page:

1. Go to **Dashboard** → **Stream** → **Studio**
2. Look for **"REAL MUX"** indicator (green dot) instead of **"DEMO MODE"**
3. The RTMP server URL should show `rtmp://global-live.mux.com/live`
4. Stream keys will be real Mux stream keys (not demo keys)

## What Changes With Real Mux?

### ✅ Real Streaming Infrastructure
- Professional-grade video ingestion
- Global CDN distribution
- Adaptive bitrate streaming
- Ultra-low latency options

### ✅ Real Analytics
- Actual viewer metrics
- Stream health monitoring
- Quality of experience data
- Playback performance insights

### ✅ Production Features
- Stream recording/VOD
- Thumbnail generation
- Multiple playback qualities
- Advanced stream controls

## Troubleshooting

### "DEMO MODE" Still Shows After Setup

1. **Check credentials**: Ensure you copied the Token ID and Secret exactly
2. **Verify .env.local**: Make sure `NEXT_PUBLIC_MUX_CONFIGURED=true`
3. **Restart server**: Stop and restart `npm run dev`
4. **Check console**: Look for Mux initialization messages in browser/terminal

### API Errors

- **401 Unauthorized**: Invalid credentials - check Token ID/Secret
- **403 Forbidden**: Insufficient permissions - ensure "Mux Video" is enabled
- **Rate Limited**: Too many requests - wait and retry

### Console Messages

Look for these success messages:
```
✅ Mux SDK initialized successfully with real credentials
🎥 Live streaming will use real Mux infrastructure
```

## Mux Pricing

- **Free Tier**: 1,000 minutes of video processing/month
- **Pay-as-you-go**: $0.0045 per minute of video processed
- **Enterprise**: Custom pricing for high-volume usage

## Security Notes

- **Never commit real credentials to version control**
- Keep your Token Secret secure - treat it like a password
- Use environment variables only
- Consider using different tokens for development vs production

## Need Help?

- [Mux Documentation](https://docs.mux.com/)
- [Mux Live Streaming Guide](https://docs.mux.com/guides/video/stream-live-to-mux)
- [ConvertCast Support](mailto:support@convertcast.com)

---

*This setup enables professional live streaming infrastructure for your ConvertCast events. The demo mode is perfect for development and testing, but real Mux credentials are required for production streaming.*