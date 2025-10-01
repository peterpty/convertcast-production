# ConvertCast Production Deployment Guide

## Environment Configuration

### 1. Copy Environment Template
```bash
cp .env.production.example .env.local
```

### 2. Update Production Variables
Edit `.env.local` with your production values:

```env
# Application URLs
NEXT_PUBLIC_APP_URL=https://convertcast.app

# WebSocket Configuration
NEXT_PUBLIC_WEBSOCKET_URL=wss://ws.convertcast.app

# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_supabase_service_role_key

# Mux (Production)
MUX_TOKEN_ID=your_production_mux_token_id
MUX_TOKEN_SECRET=your_production_mux_token_secret
NEXT_PUBLIC_MUX_ENV_KEY=your_production_mux_env_key
```

## Domain Configuration

### URLs Automatically Updated
The following URLs are automatically environment-aware:

- **Stream URLs**: `convertcast.app/watch/{stream-id}`
- **Registration URLs**: `convertcast.app/join/{event-id}`
- **API Endpoints**: All use `APP_URL` from environment
- **Share Links**: Dynamic based on environment
- **Email Templates**: Use production URLs when deployed

### WebSocket Configuration
- **Development**: `http://localhost:3003`
- **Production**: `wss://ws.convertcast.app`

## Deployment Checklist

### Pre-Deployment
- [ ] Update environment variables
- [ ] Test WebSocket server on production domain
- [ ] Verify Supabase production database
- [ ] Confirm Mux production credentials
- [ ] Test email delivery with production URLs

### Post-Deployment
- [ ] Verify stream URL generation
- [ ] Test share functionality
- [ ] Confirm WebSocket connections
- [ ] Validate email templates
- [ ] Check analytics tracking

## Production Architecture

```
convertcast.app (Main App)
├── /watch/{id} - Viewer experience
├── /join/{id} - Registration pages
├── /dashboard - Studio interface
└── /api/* - Backend APIs

ws.convertcast.app (WebSocket Server)
├── Real-time chat
├── Overlay broadcasting
├── Viewer reactions
└── Connection management
```

## Environment Variables Reference

| Variable | Development | Production |
|----------|-------------|------------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3002` | `https://convertcast.app` |
| `NEXT_PUBLIC_WEBSOCKET_URL` | `http://localhost:3003` | `wss://ws.convertcast.app` |
| `NODE_ENV` | `development` | `production` |

## Monitoring

### Health Checks
- `GET /api/health` - Application health
- `GET /api/mux/health/{streamId}` - Stream health
- WebSocket connection status in UI

### Key Metrics
- Stream uptime and quality
- WebSocket connection stability
- User engagement rates
- Conversion tracking