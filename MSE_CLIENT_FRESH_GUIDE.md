# Fresh MP4 MSE Client - Implementation Guide

## Overview

This is a clean, fresh implementation of an MP4 streaming client that:

1. **Receives fragmented MP4 chunks** over WebSocket from your worker.js proxy
2. **Parses MP4 structure** using mp4box.js without blocking the UI
3. **Feeds segments to MediaSource Extensions** for browser playback
4. **Manages buffer memory** by trimming old data as playback progresses
5. **Handles multiple tracks** (video + audio with independent codecs)

Built with **fresh eyes** - no dependencies on previous attempts, focusing on simplicity and correctness.

---

## Key Components

### 1. MP4StreamPlayer Class (`mse-client-fresh.js`)

The main client that orchestrates the entire flow:

```javascript
const player = new MP4StreamPlayer({
  videoElement: document.querySelector('video'),
  serverUrl: 'ws://localhost:8000'
});

await player.connect(serverUrl);
player.requestFile('https://example.com/video.mp4');
```

#### Core Methods

| Method | Purpose |
|--------|---------|
| `connect(url)` | Establish WebSocket to proxy |
| `requestFile(url)` | Request file from server |
| `feedMP4Data(buffer)` | Feed raw MP4 data to parser |
| `getStatus()` | Get playback status object |
| `destroy()` | Clean up all resources |

---

## Architecture Diagram

```
┌─ WebSocket Server (worker.js) ─────────────────┐
│  Streams fragmented MP4 chunks (32KB typical)  │
└──────────────────┬──────────────────────────────┘
                   │ Binary data
                   ▼
        ┌──────────────────────────┐
        │ MP4StreamPlayer          │
        │                          │
        │ • WebSocket receiver     │
        │ • mp4box wrapper         │
        │ • MSE orchestrator       │
        │ • Buffer manager         │
        └──────────────────────────┘
              │              │
        ┌─────┘              └──────┐
        │                           │
        ▼                           ▼
    ┌──────────────┐        ┌──────────────┐
    │ mp4box.js    │        │ MediaSource  │
    │              │        │              │
    │ • Parse moov │        │ • Video SB   │
    │ • Extract    │        │ • Audio SB   │
    │   codecinfo  │        │ • Append     │
    │ • Track info │        │   samples    │
    └──────────────┘        └──────────────┘
                                   │
                                   ▼
                            ┌──────────────┐
                            │ HTML5 <video>│
                            │              │
                            │ • Playback   │
                            │ • Timeline   │
                            └──────────────┘
```

---

## Data Flow - Step by Step

### 1. Connection Phase

```
User clicks "Connect" 
    ↓ (WebSocket handshake)
Server confirms ready
    ↓ (onopen event)
Player waits for file request
```

### 2. Request Phase

```
User enters file URL and clicks "Play"
    ↓ (requestFile message sent)
Server streams first chunks (ftyp, moov boxes)
    ↓ (feedMP4Data called for each chunk)
Client accumulates in mp4box parser
```

### 3. Ready Phase

```
  mp4box receives complete 'moov' box
    ↓ (triggers onReady callback)
Client extracts: track info, codecs, duration
    ↓ (initializeMediaSource)
Creates SourceBuffers with detected codecs
    ↓ (calls mp4file.start())
Begins sample extraction
```

### 4. Playback Phase

```
  mp4box extracts samples from fragments
    ↓ (onSamples callback)
Client queues samples by track
    ↓ (processBufferQueue)
SourceBuffer.appendBuffer() called
    ↓ (updateend event)
Browser decodes and plays
    ↓ (timeupdate event fires)
Monitor for buffer trimming needs
```

### 5. Memory Management

```
Playback continues → 30+ seconds of data viewed
    ↓ (trimBuffers called every 2 seconds)
Calculate: trimBeforeTime = currentTime - 30s
    ↓ (SourceBuffer.remove called)
Old data removed from buffer
    ↓ (freed from browser memory)
Only ~2 minutes of video kept in RAM
```

---

## MP4box.js Integration

### Callbacks Used

```javascript
mp4file.onReady = (info) => {
  // Called when moov box fully received
  // info contains: duration, timescale, tracks[], codecs
  // Use this to initialize MSE with correct codecs
}

mp4file.onSamples = (trackId, userId, samples) => {
  // Called when samples extracted from moof/mdat
  // sample.data = Uint8Array of encoded data
  // sample.dts/cts/duration for timing
  // sample.is_sync = key frame indicator
}
```

### Key mp4box Objects

```javascript
// ISOFile (created by createFile())
mp4file.moov          // Movie box after parsing
mp4file.moov.mvhd     // Movie header (duration, timescale)
mp4file.moov.traks[]  // Track array
  .tkhd               // Track header (track_id, duration)
  .mdia.mdhd          // Media header (timescale)
  .mdia.minf.stbl.stsd.entries[0]  // Sample entry (codec info)

// Sample object
sample.number         // Sequential sample number
sample.cts/dts        // Composition/Decode time (in timescale units)
sample.duration       // Sample duration (in timescale units)
sample.data           // Uint8Array of encoded data
sample.is_sync        // True for keyframes (I-frames)
sample.size           // Data size in bytes
```

---

## Chrome MSE Codec Support

### Video Codecs (Common)

| Codec | MIME Type | Support |
|-------|-----------|---------|
| H.264 | `video/mp4; codecs="avc1.42E01E"` | ✓ All Chrome |
| H.265/HEVC | `video/mp4; codecs="hvc1..."` | ⚠ Modern Chrome only |
| VP9 | `video/mp4; codecs="vp9"` | ✓ Most Chrome |
| AV1 | `video/mp4; codecs="av01..."` | ✓ Chrome 85+ |

### Audio Codecs (Common)

| Codec | MIME Type | Support |
|-------|-----------|---------|
| AAC | `audio/mp4; codecs="mp4a.40.2"` | ✓ All Chrome |
| MP3 | `audio/mp4; codecs="mp4a.69"` | ✓ Most Chrome |
| Opus | `audio/mp4; codecs="Opus"` | ✓ Modern Chrome |
| FLAC | `audio/mp4; codecs="fLaC"` | ⚠ Limited support |

**Always check with `MediaSource.isTypeSupported()` before creating SourceBuffer!**

---

## Buffer Management Strategy

### Memory Trimming Algorithm

1. **When to trim**: Every 2 seconds during playback
2. **What to trim**: Data older than 30 seconds behind playback position
3. **Why 30s**: Balance between memory efficiency and seeking buffer

```javascript
const TRIM_THRESHOLD = 30;  // seconds behind playback
const currentTime = video.currentTime;
const trimBeforeTime = Math.max(0, currentTime - TRIM_THRESHOLD);

// Remove all buffered data before trimBeforeTime
sourceBuffer.remove(start, trimBeforeTime);
```

### Buffer Limits

| Metric | Value | Reason |
|--------|-------|--------|
| Max buffer ahead | 60 seconds | Prevent excessive memory usage |
| Trim threshold | 30 seconds | Allow seeking back |
| Trim interval | 2 seconds | CPU efficiency |
| Queue size | 10 samples | Backpressure control |

---

## Handling Fast-Started MP4s

The client automatically detects fast-starts (moov before mdat):

```javascript
// ftyp box → ftyp parsed
// moov box → triggers onReady immediately
// mdat box → samples fed to buffers as they arrive

// This is optimal for streaming!
```

### Why Fast-Start Matters

| MP4 Type | Playback | Notes |
|----------|----------|-------|
| Non-fast-start | Download all, then play | Very slow for large files |
| Fast-start | Play immediately | ✓ What we expect |

Your worker.js outputs should be fast-started. Verify with:

```bash
ffmpeg -i input.mp4 -c copy -movflags faststart output.mp4
```

---

## Troubleshooting

### 1. "Unsupported codec" Error

```javascript
// Debug: Check what codec mp4box extracted
console.log(info.videoTracks[0].codec);  // e.g., "avc1.42E01E"

// Solution: Verify with
MediaSource.isTypeSupported(`video/mp4; codecs="${codec}"`)

// If false: Media file has codec not supported in this browser
```

### 2. Audio Out of Sync

**Cause**: Different sample rates between audio and video tracks

**Solution**: Ensure both tracks use same timescale, or resample

**Check**:
```javascript
console.log('Video DTS:', videoTrack.mdia.mdhd.timescale);
console.log('Audio DTS:', audioTrack.mdia.mdhd.timescale);
```

### 3. Jerky Playback

**Causes**:
- Buffer running empty → increase pre-buffering
- AppendBuffer timing → reduce sample queue size from 10 to 5
- CPU stalls → check browser task manager

**Solutions**:
- Increase `MAX_BUFFER_AHEAD` to 90 seconds
- Reduce `nb_samples` in extraction from 10 to 5
- Profile with Chrome DevTools → Performance tab

### 4. "SourceBuffer is updating" Errors

**Cause**: Attempting to append while previous append still processing

**Solution**: Currently handled with `buffer.updating` check and queue

```javascript
if (buffer.updating) {
  queue.push(...samples);  // Queue for later
  return;
}
buffer.appendBuffer(samples[0].data);
```

### 5. Memory Leak

**Check**: DevTools → Memory tab → take heap snapshots

**Common causes**:
- SourceBuffer not properly removed (call `endOfStream()`)
- Event listeners not cleaned up
- MediaSource URL not revoked

**Ensure cleanup**:
```javascript
player.destroy();  // Calls all cleanup
```

---

## Performance Optimization Tips

### 1. Reduce Latency

```javascript
// Decrease pre-buffering threshold
player.MAX_BUFFER_AHEAD = 30;  // Default: 60

// Increase sample extraction rate
mp4file.setExtractionOptions(trackId, null, { nbSamples: 20 });
```

### 2. Reduce Memory Footprint

```javascript
// More aggressive trimming
player.TRIM_THRESHOLD = 15;  // Default: 30

// Extract fewer samples at once
mp4file.setExtractionOptions(trackId, null, { nbSamples: 5 });
```

### 3. Reliable Network

```javascript
// Use appropriate server buffer size
// From worker.js perspective:
CHUNK_SIZE = 65536;  // 64KB chunks (default 32KB)
```

---

## Testing Scenarios

### Test 1: Basic Playback
- **File**: Small H.264 video (< 100MB)
- **Expected**: Video plays smoothly with audio
- **Check**: Console logs show codec, timescale match

### Test 2: Seeking
- **Action**: Drag timeline to different position
- **Expected**: Playback continues without stall
- **Check**: Buffered ranges show gaps are filled

### Test 3: Memory Efficiency
- **File**: Large video (> 500MB)
- **Action**: Let play for 5+ minutes
- **Check**: DevTools memory stays < 100MB (not unbounded)

### Test 4: Audio-Only
- **File**: MP3 in MP4 container
- **Expected**: Audio plays, video SourceBuffer absent
- **Check**: Status panel shows only audio codec

### Test 5: Codec Fallback
- **Action**: Send file with unsupported codec
- **Expected**: Clear error message
- **Check**: Console shows `isTypeSupported returned false`

---

## Integration with Your worker.js

### Expected Message Format

The client expects binary data from server. Your worker.js should send:

1. **Initialization**:
   ```
   Server → Client: Binary ftyp + moov boxes
   ```

2. **Streaming**:
   ```
   Server → Client: Binary moof + mdat fragments
   ```

3. **Control Messages** (JSON):
   ```json
   {"type": "ready"}
   {"type": "error", "message": "..."}
   ```

### Recommended Chunk Size

```javascript
// In worker.js
const CHUNK_SIZE = 32768;  // 32KB
// Each send(buffer) call sends 32KB chunk
// mp4box accumulates and parses automatically
```

---

## FAQ

**Q: Why not use dash.js or hls.js?**
A: Those are for DASH/HLS manifests. We're doing raw mp4 over WebSocket, so direct MSE control is simpler.

**Q: Can I play streams without fast-start?**
A: No. Server must output fast-started MP4s. See FFmpeg command above.

**Q: What about DRM/encryption?**
A: Not implemented. Extend with `EME` (Encrypted Media Extensions) if needed.

**Q: Multiple audio tracks?**
A: Currently uses first track. Extend `extractCodecs()` to support track selection.

**Q: Why does buffer.updating block appends?**
A: Chrome's MSE requires sequential appends. Parallel appends cause errors.

**Q: How to measure bandwidth?**
A: Track bytes received vs time in WebSocket onmessage.

---

## Next Steps

1. **Test with your worker.js** - Run local server, stream test MP4
2. **Check codec format** - Ensure ftyp matches video codec
3. **Monitor memory** - Chrome DevTools Performance tab
4. **Optimize buffer sizes** - Adjust TRIM_THRESHOLD based on file size
5. **Handle error cases** - Add codec fallback, retry logic

---

## References

- **mp4box.js**: https://github.com/gpac/mp4box.js
- **MSE Spec**: https://www.w3.org/TR/media-source/
- **MP4 File Format**: https://tools.ietf.org/html/iso-14496-12
- **Chrome MSE Support**: https://caniuse.com/mediasource

