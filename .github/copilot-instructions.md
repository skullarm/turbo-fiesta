# Turbo-Fiesta: AI Coding Agent Instructions

## Project Overview
Turbo-Fiesta is a WebSocket-based proxy client for Cloudflare Workers that enables browsing and streaming large media files (MP4, images, audio, PDF) through a decentralized server network. The architecture uses mp4box.js for MP4 fragmentation and MediaSource Extensions (MSE) for progressive video playback.

## Architecture Overview

### Core Client-Server Protocol
- **Client** ([client.js](client.js)): Web UI that connects to Cloudflare Workers via `wss://{server}.paytel.workers.dev`
- **Server** ([worker.js](worker.js)): Handles requests, streams binary content in 32KB chunks, manages caching
- **Key Pattern**: Messages are JSON-encoded except binary streams (video/audio/images/PDF), which are prepended with 9-byte request IDs

### Request Flow
1. Client sends request: `{u, q, au, os, admin, method, body}`
2. Server responds with message type in first char:
   - `s`: Stream start (metadata with content-length, totalLength)
   - Binary chunks: 9-byte ID prefix + data
   - `e`: End-of-stream marker
   - `r`: Regular response (HTML/CSS/JS)
   - `er`: Error

### Critical Request Object Structure
```javascript
{
  q: "request_id",           // 9-char string
  u: URL,                    // URL object
  f: [],                     // Binary chunks array
  b: 0,                      // Bytes received
  tl: 0,                     // Total length (from server metadata)
  mp4: null,                 // mp4box file instance (video only)
  MSE_mSrc: null,            // MediaSource object (video only)
  srcBfr: null,              // SourceBuffer (video only)
  Q: [],                     // Segment queue for buffering
  method: "GET"              // HTTP method
}
```

## Key Patterns & Conventions

### Minified Variable Names (Do NOT change)
- `d` = document
- `w` = WebSocket
- `u` = current URL
- `p` = Map of active requests
- `c` = connection state boolean
- `h` = history array
- `sv` = server name input element
- `fm` = HTTP method selector

These are intentionally minified for performance. All new code should follow this convention.

### MP4 Streaming with MSE (Priority 1)
**Threshold**: Files ≥50MB use MSE; smaller files use simple blob approach.

**Why This Matters**: The evolution from client-v2.js (synchronous) to client.js (async) was critical:
- client-v2.js used blocking mp4box setup → could freeze UI during load
- client.js uses async/await → non-blocking library loading, proper promise-based flow control

**Flow** (in client.js - PRODUCTION):
1. Connection open → triggers `ldmp4box()` async load (non-blocking)
2. Stream start message → checks `shouldUseMSE(r)` (file > 50MB?)
3. If YES: `setUpMp4(r)` → creates mp4 file, waits for onReady
4. mp4box parses headers, emits `onReady` → calls `setUpMSE(r)`
5. `setUpMSE()` → creates MediaSource, waits for sourceopen event
6. `handleStream()` → feeds chunks to `processChk()` which calls `mp4.appendBuffer()`
7. mp4box emits `onSegment()` callbacks → chunks pushed to queue `r.Q` (backpressure: max 20)
8. `setUpMSE.onupdateend` → drains queue when SourceBuffer not updating
9. Smart buffer trimming: keeps only 30s before current playback position

**Key Functions**:
- `ldmp4box()` - **ASYNC** loads mp4box from localStorage (non-blocking; critical fix from v2)
- `setUpMp4(r)` - **ASYNC** initializes mp4box with proper event handlers
- `setUpMSE(r)` - **ASYNC** creates MediaSource and SourceBuffer
- `processChk(bfr, r)` - Feeds chunk to mp4.appendBuffer with fileStart tracking
- `processQ(r)` - Drains segment queue when SourceBuffer ready
- `shouldUseMSE(r)` - Returns true if totalLength > 50MB threshold
- `tryEndOfStream(r)` - Safely ends MediaSource stream

### HTTP Method Support (Priority 2)
Forms are auto-intercepted with `addFormIntercept()`. Supports GET, POST, PUT, PATCH, DELETE.

**Key Functions**:
- `extractFormData(frm)` - Converts FormData to object, handles multi-valued fields
- `addFormIntercept(el)` - Adds submit handler to FORM elements
- Form data encoded as URLSearchParams by default, or JSON if `enctype="application/json"`

### HTML Content Interception
`H()` function parses HTML, intercepts images/videos/embeds, replaces `src` attributes with link placeholders.

**Flow**:
1. `v()` function finds img/video/embed/iframe/audio elements
2. Stores original src in `dataset.pu`, generates unique ID in `dataset.pq`
3. Creates fallback link with element tag name
4. Later: `k()` batch-downloads images with server rotation on every 7th request

### Error Logging Strategy
`mlog()` stores errors in localStorage under 'error' key (max 10KB rolling buffer). Useful for post-incident debugging.

## Developer Workflows

### Testing Video Streaming
1. Start server: `node worker.js`
2. Load client in browser with WebSocket connection
3. Use TESTING_GUIDE.md - Test 2 (100MB MP4) as baseline
4. Check browser DevTools → Application → localStorage → 'error' for logs

### Testing Form Submissions
1. Use test-cmd-kv.js for form data validation
2. Verify method dropdown selector works (fm element)
3. Test enctype variations: `application/x-www-form-urlencoded` (default) vs `application/json`

### Debugging MSE Issues
- Check `mlog()` output in localStorage for mp4box parsing errors
- Use `r.Q.length` to monitor segment queue buildup
- Verify codec support with `MediaSource.isTypeSupported()`
- Monitor `srcBfr.buffered` ranges in DevTools

### Adding New Features
1. Keep variable names minified (2-3 chars) to match existing style
2. Update request object structure in `Z()` function definition (line ~380)
3. Add cleanup code to `V()` function (request cleanup)
4. Document in IMPROVEMENTS_GUIDE.md with "Priority N" header
5. Add test case to TESTING_GUIDE.md

## Integration Points

### External Dependencies
- **mp4box.js**: Loaded from localStorage or CDN, imported dynamically in `ldmp4box()`
- **pdf.js**: Loaded from Cloudflare CDN, requires worker.min.js setup
- **MediaSource Extensions**: Native browser API, requires codec detection

### Server Dependencies
- Worker.js expects `au` (daily auth token) via `P()` function: `btoa(YYYYMMDD)`
- Server rotates through `['osric','wit','offal','bilboes']` for load distribution
- Range Requests use `os` (offset start) and `oe` (offset end) parameters

## Common Pitfalls

- **Don't** change variable naming convention - breaks request routing in Map `p`
- **Don't** remove 9-byte request ID prepending from chunks - images require out-of-order reconstruction
- **Don't** use Promise-heavy approach for MSE - backpressure via `r.Q.length < 20` is intentional
- **Don't** forget to call `r.mp4.flush()` after feeding segments
- **For MSE**, always check `MediaSource.readyState === 'open'` before endOfStream()

## Client Implementation Variants

### Production Code
- **[client.js](client.js)** (392 lines) - **MAIN PRODUCTION VERSION** with complete MSE/mp4box implementation
  - Full MP4 streaming with MediaSource Extensions
  - Proper async/await for mp4box library loading
  - All Priority 1-4 features implemented

### Alternative/Reference Implementations
- **[client2.js](client2.js)** (392 lines) - Identical to client.js (reference backup)
- **[client-v2.js](client-v2.js)** (274 lines) - Earlier alternative attempt
  - Synchronous mp4box setup (less robust)
  - Simpler error handling approach
  - Useful for understanding evolution of the MP4/MSE implementation
  - **Status**: Reference only; use client.js for production

### When to Use Each
- **client.js**: Always use this for deployment and new features
- **client2.js**: Backup copy if needed for version comparison
- **client-v2.js**: Study only; demonstrates original approach to MSE integration

## Key Files to Understand
- [client.js](client.js) - 392 lines, main client logic (PRODUCTION)
- [worker.js](worker.js) - Server proxy (no changes needed)
- [ARCHITECTURE_ANALYSIS.md](ARCHITECTURE_ANALYSIS.md) - Deep dive on components
- [IMPROVEMENTS_GUIDE.md](IMPROVEMENTS_GUIDE.md) - Feature implementation details
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Test checklist with 15 scenarios
- [mp4box-mse-example.js](mp4box-mse-example.js) - Standalone MSE example for reference
