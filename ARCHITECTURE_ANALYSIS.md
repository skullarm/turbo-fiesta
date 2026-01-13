# Turbo-Fiesta: Architecture Analysis & Improvement Plan

## Current Architecture Summary

### Client Flow (client.js)
1. **WebSocket Connection** (`C()` function)
   - Connects to Cloudflare Workers via `wss://{server}.paytel.workers.dev`
   - Server name rotates through `['osric','wit','offal','bilboes']` to distribute load
   - Includes daily auth token via `au` parameter

2. **Request Protocol**
   - Client sends JSON messages with structure: `{u, q, au, os, admin, method, body}`
   - Server responds with three message types:
     - `s`: Stream start (metadata with content-length, totalLength, etc.)
     - Binary chunks: Prepended with 9-byte request ID (`qbytes`)
     - `e`: End-of-stream marker
     - `r`: Regular response (text/html/css/javascript)
     - `er`: Error message
     - `info`: Informational message

3. **Request Management** 
   - Each request gets a unique ID (`q`) using `O()` function
   - Requests stored in Map `p` with structure:
     ```javascript
     {
       q, u, f[], k, b, vid, img, mp4, codec, MSE_mSrc, srcBfr, 
       bfrInd, firstSeg, Q[], processing, c, o, tl, mb, ou, ...
     }
     ```
   - Request ID is 9-byte encoded and prepended to each streamed chunk

4. **Content Type Handling**
   - **HTML**: Parsed via DOMParser, intercepted for proxying
   - **Images**: Downloaded via batch processing, stored in `f[]`, converted to ObjectURL at end
   - **Video/Audio**: Started as MediaSource objects (incomplete implementation)
   - **PDF**: Fetched and rendered via pdf.js
   - **CSS**: Injected into shadow DOM

5. **Current State Variables** (minified names in parentheses):
   - `d`: document
   - `w`: WebSocket connection
   - `u`: current URL object
   - `p`: Map of active requests
   - `c`: connection state (!!0/!!1)
   - `h[]`: history array
   - `sv`: server name display
   - `cb`: checkbox (auto-continue on disconnect)
   - `dl`: download active flag
   - `vdld`: video download active
   - `si`: simultaneous image counter
   - `svrInd`: server index for rotation
   - `atmps`: attempts remaining before server rotation

### Server Flow (worker.js)
1. **Request Handling**
   - Accepts WebSocket connections
   - Validates daily auth token
   - Handles special endpoints (CMD_KV, getcode, etc.)
   - Normalizes URLs and manages redirects

2. **Media Streaming**
   - Detects content type from response headers
   - For binary (video/audio/image/pdf):
     - Sends start message with metadata
     - Streams in 32KB chunks with qbytes prepended
     - Sends end marker
   - For text: Sends as single JSON response

3. **Caching**
   - Uses Cloudflare cache API
   - Stores small files (< 5MB) in binary format
   - Different timeout for media vs text

4. **Range Requests**
   - Supports resumption via `os` (offset start) and `oe` (offset end)
   - Automatically adds Range header for media files

---

## Issue Analysis

### Issue #1: MP4 Streaming & Memory Management
**Current Problem:**
- Entire MP4 file held in memory in `r.f[]` array
- Converted to ObjectURL blob at end
- Large files (400MB+) cause browser crashes
- Media Source setup incomplete/non-functional

**Root Causes:**
- No chunked processing via mp4box.js
- No fragmentation of mp4 into playable segments
- No progressive cleanup of old data

**Desired Solution:**
- Use mp4box.js to parse and fragment mp4 chunks progressively
- Implement proper MSE setup with SourceBuffer
- Track moov atom metadata separately
- Request file in 50-100MB chunks via Range Requests
- Clean up consumed segments from memory

### Issue #2: Form Method Support
**Current Problem:**
- Only GET methods for link interception
- Form submissions limited to GET only
- No POST/PUT/PATCH handling in `Z()` function

**Root Cause:**
- `Z()` function hardcoded for single-request flow
- Form handlers not intercepting submit events
- No method parameter passed to server

### Issue #3: Request ID Prepending Overhead
**Current Design:**
- Every binary chunk gets 9-byte request ID prepended
- Necessary for image batches where chunks may arrive out-of-order
- Adds ~1% overhead for large files

**Analysis:**
- Needed for images (batched, unordered arrival)
- Likely overkill for video/audio (sequential, single request)
- Could optimize by request type

### Issue #4: Code Organization & Performance
**Current Issues:**
- Heavily minified, hard to maintain
- Shadow DOM used for rendering (might limit styling)
- Event handlers not efficiently delegated
- Some redundant state tracking

---

## Recommended Improvements (Priority Order)

### Priority 1: MP4 Fragmentation with MSE
**Implementation Strategy:**
1. Improve mp4box loading from localStorage
2. Create robust MSE setup with error handling
3. Implement chunked mp4 appending with queue management
4. Handle file size thresholds (< 50MB use old method, >= 50MB use MSE)
5. Track moov atom for playback seeking
6. Implement Range Request loop for progressive fetching

**Expected Benefits:**
- Support for multi-gigabyte files
- Memory usage stays under ~150MB
- Smooth progressive playback
- Ability to clean up old segments

### Priority 2: Extended HTTP Method Support
**Implementation Strategy:**
1. Add form element interception in `L()` function
2. Extract form data (FormData API)
3. Support GET, POST, PUT, DELETE, PATCH
4. Pass method & body to `Z()` function
5. Update server-side handling (already mostly done)

**Expected Benefits:**
- Full web form support
- API testing capability
- Better URL-based application support

### Priority 3: Request ID Optimization
**Implementation Strategy:**
1. Keep ID prepending for images only
2. For video/audio: add ID to stream start message only
3. Add optional flag in stream protocol
4. Reduces bandwidth by ~2-3% for media

### Priority 4: Code Quality & Performance
**Implementation Strategy:**
1. Add minimal comments for clarity (preserve minification)
2. Optimize DOM operations (fewer reflows)
3. Improve error logging
4. Better resource cleanup
5. Enhance UI styling (better visual feedback)

---

## Technical Considerations

### mp4box.js Integration
- **Size**: ~80KB (already in localStorage)
- **Key Functions**:
  - `createFile()`: Create mp4 file instance
  - `appendBuffer()`: Add chunk data
  - `onReady`: Fired when moov is available
  - `onSegment`: Fired when segment ready
  - `setSegmentOptions()`: Configure fragmentation
  - `initializeSegmentation()`: Enable fragmentation mode
  - `start()`: Begin processing

### MediaSource Extensions
- **Setup**: `new MediaSource()` on video element
- **SourceBuffer**: Added in `sourceopen` event
- **MIME Type**: `video/mp4; codecs="avc1.42E01E,mp4a.40.2"`
- **Updating State**: Wait for `onupdateend` before appending more

### Memory Management Strategy
- Keep only 2-3 segments in buffer (150-300MB total)
- Clean old segments using `SourceBuffer.remove()`
- Request next segment when playback nears current segment end
- Maintain moov atom separately for seeking

### Range Request Pattern
```
Initial: 0-52428800 (50MB)
Next: 52428800-104857600
Continue until file end
Server responds with 206 Partial Content
```

---

## Testing Checklist

- [ ] MP4 playback with < 50MB files (use existing method)
- [ ] MP4 playback with 100MB files (MSE method)
- [ ] MP4 playback with 500MB+ files (aggressive chunking)
- [ ] Seeking during playback
- [ ] Form submission with GET
- [ ] Form submission with POST
- [ ] Form submission with PUT
- [ ] Error recovery with disconnects
- [ ] Memory usage stays under 300MB during playback
- [ ] Code still works via `eval()`
- [ ] Works in eval() with strict mode implications

---

## Compatibility Notes

**eval() Constraints:**
- No top-level `import` statements
- Dynamic imports use `import(url)` ✓
- All declarations must be properly scoped
- Avoid strict mode incompatibilities
- Test minification/obfuscation preservation

**Browser Support:**
- MediaSource Extensions (modern browsers)
- WebSocket (all browsers)
- Shadow DOM (all modern browsers)
- FormData API (all modern browsers)

---

## Key Variables Reference

| Var | Full Name | Type | Purpose |
|-----|-----------|------|---------|
| d | document | Document | Reference to DOM |
| w | WebSocket | WebSocket | Active connection |
| u | currentUrl | URL | Current page URL |
| h | history | Array | Navigation history |
| p | requests | Map | Active requests |
| c | connected | Boolean | Connection state |
| si | simImages | Number | Concurrent image downloads |
| dl | downloadActive | Boolean | Download paused? |
| vdld | videoDownloadActive | Boolean | Video downloading? |
| cb | checkboxAuto | HTMLInput | Auto-continue checkbox |
| sv | serverName | HTMLInput | Current server display |
| sd | shadowRoot | ShadowRoot | Isolated DOM tree |

