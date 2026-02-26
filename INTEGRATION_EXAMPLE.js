/**
 * Integration Example: How mse-client-fresh.js works with worker.js
 * 
 * This file shows the expected protocol and data flow between:
 * - Browser client (mse-client-fresh.js)
 * - Cloudflare Worker proxy (worker.js)
 * 
 * Copy-paste ready examples for both sides.
 */

//
// ============================================================================
// BROWSER SIDE - Client Usage
// ============================================================================
//

// 1. Basic Setup
const player = new MP4StreamPlayer({
  videoElement: document.querySelector('video'),
  serverUrl: 'wss://my-proxy.workers.dev'
});

// 2. Connect to server
await player.connect();

// 3. Request a file
player.requestFile('https://example.com/large-video.mp4');

// 4. Listen to playback events (optional)
document.querySelector('video').addEventListener('timeupdate', (e) => {
  const percent = (e.target.currentTime / e.target.duration) * 100;
  console.log(`Playing: ${percent.toFixed(1)}%`);
});

// 5. Get status anytime
const status = player.getStatus();
console.log('Video codec:', status.videoCodec);
console.log('Buffer:', status.buffered);

// 6. Stop and cleanup
player.destroy();


//
// ============================================================================
// WORKER SIDE - Expected Protocol (worker.js modifications)
// ============================================================================
//

/**
 * Expected message format from browser:
 * 
 * {"action": "request", "url": "https://example.com/video.mp4"}
 */
export default {
  async fetch(request, env, ctx) {
    // Handle WebSocket upgrade
    if (request.headers.get('upgrade') === 'websocket') {
      return this.handleWebSocket(request, env);
    }
    
    // Regular HTTP requests
    return new Response('Not found', { status: 404 });
  },

  async handleWebSocket(request, env) {
    // Upgrade to WebSocket
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();

    // Send ready message when accepted
    server.send(JSON.stringify({ type: 'ready' }));

    // Handle incoming messages from client
    server.addEventListener('message', async (msg) => {
      try {
        const data = JSON.parse(msg.data);
        
        if (data.action === 'request') {
          // Stream the file to client
          await this.streamFile(data.url, server);
        }
      } catch (err) {
        server.send(JSON.stringify({
          type: 'error',
          message: err.message
        }));
      }
    });

    return new Response(null, { status: 101, webSocket: server });
  },

  async streamFile(fileUrl, wsClient) {
    try {
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const CHUNK_SIZE = 32768;  // 32KB chunks
      let totalSent = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        // Send chunk to client
        wsClient.send(value);
        totalSent += value.byteLength;

        // Optional: Log progress
        console.log(`Streamed ${totalSent} bytes`);

        // Avoid sending too fast (backpressure)
        if (wsClient.readyState !== WebSocket.OPEN) {
          break;
        }
      }

      console.log(`Stream complete: ${totalSent} bytes`);
    } catch (err) {
      wsClient.send(JSON.stringify({
        type: 'error',
        message: err.message
      }));
    }
  }
};

export { default };


//
// ============================================================================
// DATA FLOW EXAMPLE - What client receives
// ============================================================================
//

/**
 * Timeline of data reception:
 * 
 * t=0: Connect to WebSocket
 *      ↓ Server: {type: "ready"} (JSON)
 *      ↓ Client: confirms ready
 * 
 * t=1: Client sends: {action: "request", url: "..."}
 * 
 * t=2: Server sends: ftyp box (binary)
 *      Client receives ArrayBuffer(1024 bytes)
 *      mp4box parses it
 * 
 * t=3-5: Server streams more chunks
 *        Each chunk: 32KB binary
 *        Client accumulates: ftyp + moov + mdat
 * 
 * t=6: Client receives complete moov box
 *      onReady callback fires
 *      CodecString extracted: "avc1.42E01E" (H.264)
 *      MediaSource created with video SourceBuffer
 * 
 * t=7+: Server continues streaming moof/mdat fragments
 *       Each fragment ~1-5MB (depends on segment config)
 *       Client extracts samples
 *       Browser plays video seamlessly
 */


//
// ============================================================================
// CODEC EXTRACTION - What client sees
// ============================================================================
//

/**
 * After onReady fires, client has parsed:
 * 
 * info.videoTracks[0]:
 * {
 *   id: 1,
 *   type: "video",
 *   codec: "avc1.42E01E",  ← This becomes MIME type
 *   video: {
 *     width: 1920,
 *     height: 1080
 *   },
 *   samples_duration: 9000000,  (in timescale units)
 * }
 * 
 * info.audioTracks[0]:
 * {
 *   id: 2,
 *   type: "audio",
 *   codec: "mp4a.40.2",     ← AAC-LC
 *   audio: {
 *     sample_rate: 48000,
 *     channel_count: 2
 *   },
 *   samples_duration: 9000000,
 * }
 * 
 * Client creates SourceBuffers:
 * 
 * media.addSourceBuffer(
 *   'video/mp4; codecs="avc1.42E01E"'
 * );
 * 
 * media.addSourceBuffer(
 *   'audio/mp4; codecs="mp4a.40.2"'
 * );
 * 
 * Then as samples arrive:
 * 
 * Sample from video track:
 * {
 *   number: 0,
 *   dts: 0,
 *   cts: 0,
 *   duration: 3000,         (timescale 24000 = 1/8 second)
 *   data: Uint8Array(5000), (H.264 encoded frame)
 *   is_sync: true,          (keyframe)
 *   size: 5000
 * }
 * 
 * Sample from audio track:
 * {
 *   number: 0,
 *   dts: 0,
 *   cts: 0,
 *   duration: 2048,         (timescale 48000 = 42.7ms)
 *   data: Uint8Array(256),  (AAC-LC encoded audio)
 *   is_sync: true,          (all audio samples are sync)
 *   size: 256
 * }
 */


//
// ============================================================================
// BUFFER MANAGEMENT - What client does
// ============================================================================
//

/**
 * As playback progresses:
 * 
 * Timeline: [...====◄PLAYING►===........]
 *           ^    ^          ^    ^
 *        trim  30s prior   now  60s ahead
 *           ↓
 *        Remove this data ~once per 2sec
 * 
 * Example:
 * - Playback at 120s
 * - TRIM_THRESHOLD = 30s
 * - Remove all buffered data < 90s
 * - Keep buffer from 90s → 180s (90 seconds total)
 * 
 * Memory impact:
 * - 1 MB/s typical H.264 bitrate
 * - 90 second buffer = ~90 MB video
 * - Plus 200 KB/s audio = ~18 MB
 * - Total: ~110 MB resident memory
 * 
 * For 2-hour movie @ 2 Mbps:
 * - Initial download: 2.4 GB (!!)
 * - With trimming: ~110 MB (✓ reasonable)
 */


//
// ============================================================================
// ERROR HANDLING - What can go wrong
// ============================================================================
//

/**
 * Common issues and client response:
 * 
 * Issue 1: Codec not supported
 * ─────────────────────────────
 * MediaSource.isTypeSupported('video/mp4; codecs="hevc"') → false
 * Chrome 55-90: No HEVC support
 * Solution: Transcode server-side to H.264 or VP9
 * 
 * Issue 2: Non-fast-start MP4
 * ─────────────────────────────
 * Client receives entire mdat before moov
 * onReady never fires until end of stream
 * Solution: Ensure server outputs with -movflags faststart
 * 
 * Issue 3: Audio sync drift
 * ─────────────────────────
 * Video plays at 30fps, audio at 48kHz
 * Timescale mismatch causes A/V sync loss
 * Solution: Verify timescales match in ORIGINAL MP4
 * 
 * Issue 4: Buffer stalls
 * ──────────────────────
 * SourceBuffer.appendBuffer() throws QuotaExceededError
 * Only ~4GB total MSE buffer available
 * Solution: Increase trim aggression (reduce TRIM_THRESHOLD)
 * 
 * Issue 5: WebSocket drops mid-stream
 * ─────────────────────────────────
 * Server closes connection unexpectedly
 * Browser resumes only if buffer has data ahead
 * Solution: Implement reconnect logic in client if needed
 */


//
// ============================================================================
// OPTIMIZATION CHECKLIST
// ============================================================================
//

const OPTIMIZATION_CHECKLIST = `
✓ MP4 Output Format
  □ Verify MP4 is fast-started: ffmpeg ... -movflags faststart
  □ Video codec is H.264, VP9, or AV1 (Chrome support)
  □ Audio codec is AAC, Opus, or FLAC (Chrome support)
  □ Both tracks have same timescale (or synchronized)

✓ WebSocket Configuration
  □ Chunk size: 32KB (server sends ~32KB per frame)
  □ Backpressure: Don't buffer > 1MB on server side
  □ Timeout: Keep-alive if stream idle > 30s

✓ Client Settings (in mse-client-fresh.js)
  □ TRIM_THRESHOLD: 30s (increase if buffering issues)
  □ MAX_BUFFER_AHEAD: 60s (decrease if memory constrained)
  □ nbSamples: 10 (decrease to 5 for low-end devices)

✓ Testing
  □ Test with small file first (< 100MB)
  □ Verify codec string in console logs
  □ Watch DevTools Network tab: steady chunk rate?
  □ Monitor Memory tab: does it plateau?
  □ Test seeking: does resume playback smoothly?

✓ Production Deployment
  □ Use HTTPS/WSS (encrypted WebSocket)
  □ Enable compression on server (gzip)
  □ Add auth token to WebSocket URL for security
  □ Monitor: dropped packets, reconnect rate
  □ Cache: CDN cache the MP4 file if possible
`;


//
// ============================================================================
// COMPLETE WORKING EXAMPLE
// ============================================================================
//

/**
 * HTML + JS to stream an MP4 with full error handling
 */
const COMPLETE_EXAMPLE = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/mp4box@0.5.0/dist/mp4box.all.js"></script>
  <script src="mse-client-fresh.js"></script>
</head>
<body>
  <video id="video" controls width="800" height="600"></video>
  
  <input id="url" placeholder="wss://..." value="wss://my-proxy.workers.dev" />
  <button onclick="start()">Connect & Play</button>
  
  <div id="status"></div>

  <script>
    let player;
    
    async function start() {
      try {
        player = new MP4StreamPlayer({
          videoElement: document.getElementById('video'),
          serverUrl: document.getElementById('url').value
        });
        
        await player.connect();
        
        // Use test video or request one
        player.requestFile('https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4');
        
        // Monitor status
        setInterval(() => {
          const s = player.getStatus();
          document.getElementById('status').innerHTML = \`
            ◄ \${s.currentTime.toFixed(1)}s / \${s.duration.toFixed(1)}s ►
            | Video: \${s.videoCodec}
            | Audio: \${s.audioCodec}
            | Buffered: \${s.buffered.length} ranges
          \`;
        }, 500);
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }
  </script>
</body>
</html>
`;

console.log(OPTIMIZATION_CHECKLIST);
console.log(COMPLETE_EXAMPLE);

export { OPTIMIZATION_CHECKLIST, COMPLETE_EXAMPLE };
