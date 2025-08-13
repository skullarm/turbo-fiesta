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
        let errorMsg = jsonMsg('er', contentType, `er: ${e}`, requestQ, '');
        try { server.send(errorMsg); } catch {}
      }
    });

    return new Response(null, { status: 101, webSocket: client });
  }
};


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
    await cache.put(
      u,
      new Response(x, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public,max-age=3500'
        }
      })
    );
  } catch (e) {
    // Cache put error
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

// Helper: chunked base64 conversion for large Uint8Arrays
function uint8ToBase64(u8) {
  const CHUNK_SIZE = 0x8000; // 32KB
  let result = '';
  for (let i = 0; i < u8.length; i += CHUNK_SIZE) {
    result += String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(result);
}

// Helper: stream media and cache if under limit
// Accept contentLength as an argument (may be empty string if not available)
// Accepts additional args: rangeUsed (string), partial (bool), totalLength (number)
async function streamAndMaybeCacheMedia(response, server, contentType, qbytes, cacheChunks, cacheLimit, requestQ, cacheKey, contentLength, rangeUsed = '', partial = false, totalLength = 0) {
  // Communicate contentLength, rangeUsed, partial, and totalLength in the start message
  // We'll use the 'd' field as a JSON string for richer info
  const startInfo = JSON.stringify({
    contentLength,
    range: rangeUsed,
    partial,
    totalLength
  });
  server.send(jsonMsg('s', contentType, startInfo, requestQ, ''));
  let reader = response.body.getReader();
  let chunks = [];
  let streamedLength = 0;
  while (true) {
    let { done, value } = await reader.read();
    if (done) break;
    if (value) {
      sendBinaryChunk(server, value, contentType, qbytes);
      streamedLength += value.length || value.byteLength || 0;
    }
    if (cacheChunks && value) {
      let u8 = value instanceof Uint8Array ? value : new Uint8Array(value);
      if (streamedLength + u8.length <= cacheLimit) {
        chunks.push(u8);
        streamedLength += u8.length;
      } else {
        cacheChunks = false;
        chunks = [];
        streamedLength = 0;
      }
    }
  }
  server.send(jsonMsg('e', contentType, '', requestQ, ''));
  // Cache only if all chunks fit under limit
  if (cacheChunks && streamedLength > 0) {
    let all = new Uint8Array(streamedLength);
    let offset = 0;
    for (let c of chunks) {
      all.set(c, offset);
      offset += c.length;
    }
    let b64 = uint8ToBase64(all);
    let result = jsonMsg('r', contentType, b64, requestQ, '');
    await cachePut(cacheKey, result, caches.default);
    server.send(result);
  }
}
