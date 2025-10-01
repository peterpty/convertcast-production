# 🔍 WebSocket Overlay Debug Guide

## Overview
This guide will help you diagnose and fix the overlay delivery issue using the new comprehensive debugging system.

---

## 🎯 **Testing Links**

### **Studio (Broadcaster)**
```
https://convertcast.app/dashboard/stream/studio
```

### **Viewer (Receiver)**
```
https://convertcast.app/watch/[YOUR_STREAM_ID]
```

Replace `[YOUR_STREAM_ID]` with your actual stream playback ID.

---

## 🛠️ **Debug Tools Added**

### **1. WebSocket Debug Panel (Viewer Page)**
- **Location**: Bottom-right floating button "WS Debug"
- **Features**:
  - Real-time connection status
  - WebSocket URL verification
  - Event log (last 20 events)
  - Connection health checks

### **2. Enhanced Console Logging**
- All WebSocket events now logged with `[WebSocket Event]` prefix
- Broadcasts show: `📤 Broadcasting overlay`
- Receipts show: `📡 Overlay update received`

### **3. Broadcast Confirmation (Studio)**
- Alert popup confirms when overlay is broadcast
- Shows overlay type and reminds to check viewer debug panel

---

## 📋 **Step-by-Step Debugging Process**

### **Phase 1: Verify Environment Variables**

1. **Check Vercel Dashboard**
   - Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables
   - **Required Variable**:
     ```
     NEXT_PUBLIC_WEBSOCKET_URL=wss://convertcast-websocket-production.up.railway.app
     ```
   - Ensure it's set for **Production** environment
   - If you just added it, **redeploy** the application

2. **Trigger Redeploy**
   ```bash
   git commit --allow-empty -m "chore: trigger redeploy"
   git push
   ```

### **Phase 2: Test WebSocket Connection**

1. **Open Viewer Page**
   ```
   https://convertcast.app/watch/[STREAM_ID]
   ```

2. **Open Debug Panel**
   - Click the floating **"WS Debug"** button (bottom-right)

3. **Verify Connection**
   Check these indicators:
   - ✅ **Connection Status**: Should show "connected"
   - ✅ **WebSocket URL**: Should show `wss://convertcast-websocket-production.up.railway.app`
   - ✅ **Socket Connected**: Should have green checkmark
   - ✅ **Events Received**: Will update when events arrive

4. **Check Event Log**
   You should see:
   - `connect` event with socketId
   - `join-stream-attempt` event with streamId
   - (Optionally) `join-stream-success` event

### **Phase 3: Test Overlay Broadcasting**

1. **Open Studio in One Tab**
   ```
   https://convertcast.app/dashboard/stream/studio
   ```

2. **Open Viewer in Another Tab**
   ```
   https://convertcast.app/watch/[STREAM_ID]
   ```
   - Keep debug panel open on viewer page

3. **Broadcast Test Overlay**
   - In Studio → Navigate to **"Stream Info"** tab
   - Click **"Test Poll Overlay"** or **"Test Special Offer"**
   - You should see: **Alert popup** confirming broadcast

4. **Check Viewer Debug Panel**
   - Look for `overlay-update` event in the event log
   - Check the event data shows correct overlay information

---

## 🐛 **Common Issues & Fixes**

### **Issue 1: WebSocket URL Shows "Not configured"**

**Symptoms:**
- Debug panel shows "Not configured" for WebSocket URL
- Connection status stuck on "connecting" or "failed"

**Solution:**
```bash
# 1. Verify env var in Vercel
NEXT_PUBLIC_WEBSOCKET_URL=wss://convertcast-websocket-production.up.railway.app

# 2. Redeploy
git commit --allow-empty -m "chore: trigger redeploy with WebSocket URL"
git push

# 3. Wait 2-3 minutes for deployment
# 4. Hard refresh browser (Ctrl+Shift+R)
```

### **Issue 2: Connection Shows "failed" or "disconnected"**

**Symptoms:**
- Red status indicator
- Error message in debug panel

**Possible Causes:**
1. **Railway WebSocket server is down**
   - Check: https://convertcast-websocket-production.up.railway.app/health
   - Should return: `{"status":"ok"}`

2. **CORS issue**
   - Railway server needs to allow `convertcast.app` origin
   - Check Railway server logs

3. **WebSocket upgrade failed**
   - Check browser console for CORS or upgrade errors

**Solution:**
```bash
# Verify Railway WebSocket server is running
curl https://convertcast-websocket-production.up.railway.app/health

# Check Railway logs
# Go to Railway dashboard → Your WebSocket project → View logs
```

### **Issue 3: Connected but No Overlay Events**

**Symptoms:**
- Debug panel shows "connected" ✅
- `connect` and `join-stream` events appear
- But no `overlay-update` events when broadcasting

**Possible Causes:**
1. **Room names don't match**
   - Studio broadcasts to wrong stream room
   - Viewer joins different stream room

2. **Railway server not broadcasting to room**
   - Server receives broadcast but doesn't emit to room

**Debug Steps:**
```javascript
// In browser console (Viewer page):
console.log('Stream ID:', window.location.pathname.split('/').pop());

// In browser console (Studio page):
console.log('Broadcasting to stream ID:', document.querySelector('[data-stream-id]')?.dataset.streamId);

// These should match!
```

**Solution:**
- Check Railway WebSocket server logs
- Verify server code:
  ```javascript
  socket.on('broadcast-overlay', (data) => {
    // Must broadcast to room
    io.to(data.streamId).emit('overlay-update', data);
  });
  ```

### **Issue 4: Events Arrive but UI Doesn't Update**

**Symptoms:**
- Debug panel shows `overlay-update` events ✅
- But overlay doesn't appear on video

**Possible Causes:**
1. **React state not updating**
2. **OverlayRenderer component not mounted**
3. **Event data format mismatch**

**Solution:**
```javascript
// Check browser console for:
console.log('📡 Overlay received in viewer:', data);

// Verify data structure matches what OverlayRenderer expects
```

---

## 🎯 **Expected Successful Flow**

### **Studio (Broadcaster)**
```
1. Open Studio page
2. Click "Test Poll Overlay"
3. See alert: "✅ Overlay broadcast: poll"
4. Console shows: "📤 Broadcasting overlay: { streamId, overlayType, ... }"
```

### **Viewer (Receiver)**
```
1. Debug panel shows: "connected" ✅
2. Event log shows: connect → join-stream-attempt
3. When overlay broadcast:
   - Event log shows: "overlay-update" event
   - Console shows: "📡 Overlay received in viewer: {...}"
   - Overlay appears on video
```

---

## 📊 **Railway WebSocket Server Check**

### **Health Check**
```bash
curl https://convertcast-websocket-production.up.railway.app/health
```

**Expected Response:**
```json
{"status":"ok"}
```

### **Server Logs to Monitor**
Look for these in Railway logs:
```
✅ Client connected: [socket-id]
📡 Client joined stream: [stream-id]
📤 Broadcasting overlay to room: [stream-id]
```

---

## 🔧 **Quick Diagnostic Commands**

```bash
# 1. Check if WebSocket server is reachable
curl -I https://convertcast-websocket-production.up.railway.app

# 2. Test WebSocket upgrade (in browser console)
new WebSocket('wss://convertcast-websocket-production.up.railway.app')

# 3. Check Vercel env vars
vercel env ls

# 4. Force redeploy
git commit --allow-empty -m "debug: force redeploy"
git push
```

---

## 📝 **What to Report Back**

Please provide:

1. **Debug Panel Screenshot**
   - From viewer page with panel open

2. **Browser Console Logs**
   - Copy all `[WebSocket Event]` lines
   - Copy any errors

3. **Railway Server Logs**
   - Last 50 lines from Railway dashboard

4. **Verification Results**
   - ✅ or ❌ for each check:
     - [ ] WebSocket URL configured in Vercel
     - [ ] Debug panel shows "connected"
     - [ ] `connect` event appears
     - [ ] `join-stream` event appears
     - [ ] Alert shows when broadcasting
     - [ ] `overlay-update` event appears
     - [ ] Overlay shows on video

---

## 🚀 **Next Steps**

Once you've gone through this guide:

1. Open viewer page and click "WS Debug" button
2. Take screenshot of the debug panel
3. Test broadcasting an overlay from Studio
4. Share results with me

**Test Link for You:**
```
Viewer: https://convertcast.app/watch/[YOUR_STREAM_PLAYBACK_ID]
Studio: https://convertcast.app/dashboard/stream/studio
```

The debug panel will tell us exactly where the issue is! 🎯
