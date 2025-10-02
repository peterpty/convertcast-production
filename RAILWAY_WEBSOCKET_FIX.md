# 🔧 Railway WebSocket Server Fix

## Issue Diagnosis

**Problem**: Overlays broadcast from Studio are not reaching viewers.

**Evidence from Debug Panel**:
- ✅ WebSocket connection: `connected`
- ✅ WebSocket URL: `wss://convertcast-websocket-production.up.railway.app`
- ✅ Events received: `connect`, `join-stream-attempt`
- ❌ Missing: `overlay-update` events when broadcasting from Studio

**Root Cause**: The Railway WebSocket server is receiving `broadcast-overlay` events but not emitting `overlay-update` events to room members.

---

## Required Fix

### Location
Repository: `https://github.com/peterpty/convertcast-websocket.git`
File: Likely `server.js` or `index.js` (main Socket.io server file)

### Current Problematic Code Pattern
```javascript
// ❌ MISSING OR INCORRECT - Server receives but doesn't broadcast to room
socket.on('broadcast-overlay', (data) => {
  console.log('Received broadcast-overlay', data);
  // Missing: io.to(streamId).emit('overlay-update', data);
});
```

### Required Fix
```javascript
// ✅ CORRECT - Server receives and broadcasts to all clients in stream room
socket.on('broadcast-overlay', (data) => {
  const { streamId, overlayType, overlayData, timestamp } = data;

  console.log(`📤 Broadcasting overlay to room: ${streamId}`, overlayType);

  // Critical: Emit to ALL clients in the stream room
  io.to(streamId).emit('overlay-update', {
    streamId,
    overlayType,
    overlayData,
    timestamp
  });

  // Optional: Send confirmation back to broadcaster
  socket.emit('broadcast-overlay-success', {
    overlayType,
    streamId,
    timestamp: new Date().toISOString()
  });
});
```

---

## Complete Server Implementation Example

```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// CORS configuration for convertcast.app
const io = new Server(server, {
  cors: {
    origin: [
      'https://convertcast.app',
      'https://www.convertcast.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // Join stream room
  socket.on('join-stream', (data) => {
    const { streamId, userType, userId } = data;

    console.log(`📡 Client ${socket.id} joining stream: ${streamId} as ${userType}`);

    // Join the Socket.io room
    socket.join(streamId);

    // Confirm successful join
    socket.emit('join-stream-success', { streamId, userType, userId });

    // Get room size and notify
    const room = io.sockets.adapter.rooms.get(streamId);
    const viewerCount = room ? room.size : 0;

    // Broadcast updated viewer count to all in room
    io.to(streamId).emit('viewer-count-update', {
      count: viewerCount,
      streamId
    });
  });

  // 🔥 CRITICAL FIX: Broadcast overlay to room
  socket.on('broadcast-overlay', (data) => {
    const { streamId, overlayType, overlayData, timestamp } = data;

    console.log(`📤 Broadcasting overlay to room: ${streamId}`, overlayType);

    // Get room size for logging
    const room = io.sockets.adapter.rooms.get(streamId);
    const viewerCount = room ? room.size : 0;

    // Emit overlay-update to ALL clients in the stream room
    io.to(streamId).emit('overlay-update', {
      streamId,
      overlayType,
      overlayData,
      timestamp
    });

    // Send success confirmation to broadcaster
    socket.emit('broadcast-overlay-success', {
      overlayType,
      streamId,
      viewerCount,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Overlay broadcast to ${viewerCount} viewers in room ${streamId}`);
  });

  // Leave stream room
  socket.on('leave-stream', (data) => {
    const { streamId } = data;
    console.log(`🔌 Client ${socket.id} leaving stream: ${streamId}`);
    socket.leave(streamId);

    // Update viewer count
    const room = io.sockets.adapter.rooms.get(streamId);
    const viewerCount = room ? room.size : 0;
    io.to(streamId).emit('viewer-count-update', {
      count: viewerCount,
      streamId
    });
  });

  // Chat message
  socket.on('send-chat-message', (data) => {
    const { streamId, message, username, timestamp } = data;

    io.to(streamId).emit('chat-message', {
      message,
      username,
      timestamp,
      userId: socket.id
    });
  });

  // Viewer reaction
  socket.on('send-reaction', (data) => {
    const { streamId, reactionType, userId } = data;

    io.to(streamId).emit('viewer-reaction', {
      reactionType,
      userId: userId || socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Poll vote
  socket.on('poll-vote', (data) => {
    const { streamId, pollId, optionId, userId } = data;

    io.to(streamId).emit('poll-vote-update', {
      pollId,
      optionId,
      userId: userId || socket.id,
      timestamp: new Date().toISOString()
    });
  });

  // Disconnect
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id} - ${reason}`);
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`🚨 Socket error for ${socket.id}:`, error);
  });
});

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`);
});
```

---

## Testing the Fix

### 1. Deploy Updated Server to Railway
```bash
# In convertcast-websocket repository
git add .
git commit -m "Fix: Add room broadcasting for overlay-update events"
git push origin main
```

### 2. Verify Server Logs in Railway Dashboard
Look for these logs when testing:
```
✅ Client connected: [socket-id]
📡 Client [socket-id] joining stream: [stream-id] as viewer
📤 Broadcasting overlay to room: [stream-id] poll
✅ Overlay broadcast to 1 viewers in room [stream-id]
```

### 3. Test in Production
1. Open Studio: `https://convertcast.app/dashboard/stream/studio`
2. Open Viewer (different tab): `https://convertcast.app/watch/[STREAM_ID]`
3. Click "WS Debug" button on viewer page
4. In Studio → Navigate to "Stream Info" tab
5. Click "Test Poll Overlay" or "Test Special Offer"
6. **Expected Result**: Debug panel shows `overlay-update` event

### 4. Verify Debug Panel
After fix, you should see:
```
Event Log:
- connect (with socketId)
- join-stream-attempt
- join-stream-success
- overlay-update ← THIS IS THE CRITICAL EVENT
```

---

## Checklist

- [ ] Update `broadcast-overlay` event handler to emit to room: `io.to(streamId).emit('overlay-update', data)`
- [ ] Add logging to confirm broadcasts: `console.log('Broadcasting to room:', streamId)`
- [ ] Ensure CORS allows `convertcast.app` domain
- [ ] Deploy to Railway and verify logs
- [ ] Test with debug panel open on viewer page
- [ ] Verify `overlay-update` events appear in event log

---

## Common Mistakes to Avoid

### ❌ Wrong: Emitting back to sender only
```javascript
socket.on('broadcast-overlay', (data) => {
  socket.emit('overlay-update', data); // Only sends to broadcaster!
});
```

### ❌ Wrong: Broadcasting to everyone instead of room
```javascript
socket.on('broadcast-overlay', (data) => {
  io.emit('overlay-update', data); // Sends to ALL connected clients!
});
```

### ✅ Correct: Broadcasting to room members
```javascript
socket.on('broadcast-overlay', (data) => {
  const { streamId } = data;
  io.to(streamId).emit('overlay-update', data); // Sends to room members only
});
```

---

## Expected Flow After Fix

1. **Studio** emits `broadcast-overlay` → WebSocket server
2. **Server** receives event and logs: `📤 Broadcasting overlay to room: [streamId]`
3. **Server** emits `overlay-update` to ALL clients in `streamId` room using `io.to(streamId).emit()`
4. **Viewer** receives `overlay-update` event
5. **Debug Panel** shows event in log
6. **Overlay** appears on video

---

## Next Steps

1. Apply the fix to the Railway WebSocket server code
2. Deploy updated server to Railway
3. Test using the debug panel
4. Report back with debug panel screenshot showing `overlay-update` events
