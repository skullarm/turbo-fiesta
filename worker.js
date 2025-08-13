export default {
  async fetch(request) {
    let client, server;
    try {
      [client, server] = Object.values(new WebSocketPair());
      server.accept();
    } catch (e) {
      return new Response('WebSocket error', { status: 500 });
    }

    const enc = new TextEncoder();

    // WebSocket keepalive: send ping every 30s
    let pingInterval = setInterval(() => {
      try { server.send(jsonMsg('ping', '', '', '', '')); } catch {}
    }, 30000);
    server.addEventListener('close', () => {
      clearInterval(pingInterval);
      server.close();
    });


    // Send initial info
    try {
      
      server.send(jsonMsg('info', '', 'Welcome Golf Gangstas!!', '', ''));
    } catch (e) {
      console.error(e);
    }

    server.addEventListener('message', async (m) => {
      // Rate limiting removed
      let contentType;
      try {
        // ...existing code for message handler, as above...
      } catch (e) {
        console.error('Proxy error:', e); // improved error logging
        let errorMessage = 'An error occurred';
        
        // More user-friendly error messages
        if (e.name === 'TypeError' && e.message.includes('fetch')) {
          errorMessage = 'Could not connect to the requested website';
        } else if (e.name === 'AbortError') {
          errorMessage = 'Request timed out';
        } else if (e.message.includes('range')) {
          errorMessage = 'Invalid range request';
        }
        
        let errorMsg = jsonMsg('er', contentType, errorMessage, requestQ, '');
        try { server.send(errorMsg); } catch {}
      }
    });

    return new Response(null, { status: 101, webSocket: client });
  }
};


function normalizeUrl(url) {
  if (typeof url !== 'string') return '';
  
  url = url.trim();
  if (!url) return '';
  
  // If protocol-relative (//host), prepend https:
  if (url.startsWith('//')) {
    return 'https:' + url;
  }
  
  // If missing protocol but has valid domain pattern, prepend https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const firstSlash = url.indexOf('/');
    const domainPart = firstSlash === -1 ? url : url.substring(0, firstSlash);
    // More thorough domain validation to ensure user experience
    if (domainPart.includes('.') && 
        /^[\w.-]+$/.test(domainPart) && // Valid chars only
        !domainPart.startsWith('.') &&   // Can't start with dot
        !domainPart.endsWith('.')) {     // Can't end with dot
      return 'https://' + url;
    }
  }
  
  return url;
}

function jsonMsg(t, c, d, q, si) {
  return JSON.stringify({ t, c, d, q, si });
}
function sendBinaryChunk(server, value, contentType, qbytes) {
  if (!value) return;
  let u8 = value instanceof Uint8Array ? value : new Uint8Array(value);
  // Always prepend qbytes for image/audio/video/pdf
  if (contentType.startsWith('image') || contentType.startsWith('audio') || contentType.startsWith('video') || contentType === 'application/pdf') {
    const ca = new Uint8Array(qbytes.length + u8.length);
    ca.set(qbytes, 0);
    ca.set(u8, qbytes.length);
    server.send(ca);
  } else {
    server.send(u8);
  }
}

async function cachePut(u, x, cache) {
  try {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'public,max-age=3500',
      'Date': new Date().toUTCString()
    });
    
    // Add ETag for validation
    const etag = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(x));
    headers.set('ETag', Array.from(new Uint8Array(etag))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(''));
    
    await cache.put(
      u,
      new Response(x, { headers })
    );
  } catch (e) {
    // Cache put error - silent fail
  }
}

async function decompress(body, encoding) {
  let format;
  if (encoding === 'gzip') {
    format = 'gzip';
  } else if (encoding === 'br') {
    format = 'brotli';
  } else {
    throw new Error(`Unsupported encoding: ${encoding}`);
  }

  const ds = new DecompressionStream(format);
  const decompressedStream = body.pipeThrough(ds);
  const textStream = decompressedStream.pipeThrough(new TextDecoderStream('utf-8'));
  const reader = textStream.getReader();
  let result = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    result += value;
  }
  return new Response(result);
}

// Helper: optimized chunked base64 conversion for large Uint8Arrays
function uint8ToBase64(u8) {
  const CHUNK_SIZE = 0x8000; // 32KB
  const chunks = Math.ceil(u8.length / CHUNK_SIZE);
  const results = new Array(chunks);
  
  for (let i = 0; i < chunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, u8.length);
    results[i] = String.fromCharCode.apply(null, u8.subarray(start, end));
  }
  
  return btoa(results.join(''));
}

// Helper: stream media and cache if under limit
// Accept contentLength as an argument (may be empty string if not available)
// Accepts additional args: rangeUsed (string), partial (bool), totalLength (number)
async function streamAndMaybeCacheMedia(response, server, contentType, qbytes, cacheChunks, cacheLimit, requestQ, cacheKey, contentLength, rangeUsed = '', partial = false, totalLength = 0) {
  // Don't collect chunks unless we're sure we'll cache
  const parsedContentLength = parseInt(contentLength, 10);
  const shouldCollectChunks = cacheChunks && (!contentLength || parsedContentLength <= cacheLimit);
  const chunks = shouldCollectChunks ? [] : null;
  let streamedLength = 0;

  // Enhanced stream info for better client progress indication
  server.send(jsonMsg('s', contentType, JSON.stringify({
    contentLength,
    range: rangeUsed,
    partial,
    totalLength,
    expectedDuration: contentType.startsWith('video') || contentType.startsWith('audio') ? 
      Math.ceil(parsedContentLength / 128000) : // Rough estimate for media
      undefined
  }), requestQ, ''));

  const reader = response.body.getReader();
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      
      if (value) {
        sendBinaryChunk(server, value, contentType, qbytes);
        
        // Only process for caching if we're collecting chunks and still under limit
        if (chunks) {
          const chunkSize = value.length || value.byteLength || 0;
          streamedLength += chunkSize;
          
          if (streamedLength <= cacheLimit) {
            chunks.push(new Uint8Array(value));
          } else {
            // Stop collecting if we exceed limit
            chunks.length = 0;
            break;
          }
        }
      }
    }
    
    // Only cache if we collected all chunks and they fit within limit
    if (chunks && chunks.length > 0) {
      const all = new Uint8Array(streamedLength);
      let offset = 0;
      for (const chunk of chunks) {
        all.set(chunk, offset);
        offset += chunk.length;
      }
      const b64 = uint8ToBase64(all);
      const result = jsonMsg('r', contentType, b64, requestQ, '');
      await cachePut(cacheKey, result, caches.default);
      server.send(result);
    }
  } finally {
    server.send(jsonMsg('e', contentType, '', requestQ, ''));
  }
}
