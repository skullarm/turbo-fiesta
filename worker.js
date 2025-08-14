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

    server.addEventListener('message', async (m) => {
      // Rate limiting removed
      let contentType;
      try {
        // Parse message once and destructure all needed fields
        const msgData = JSON.parse(m.data);
        let {
          u, a, q, au, si, method, body,
          os = 0,
          oe = null
        } = msgData;

        // Set si to 'true' by default if not provided
        if (typeof si === 'undefined') si = 'true';
        
        // Use q as the request string, not query
        const requestQ = q;
        const qbytes = enc.encode(q);
        const fetchMethod = method ? method.toUpperCase() : 'GET';
        
        // Simple daily auth
        let dt = new Date();
        let y = dt.getUTCFullYear();
        let mn = dt.getUTCMonth();
        let dd = dt.getUTCDate();
        let mAu = btoa(`${y}${mn}${dd}`);
        if (mAu !== au) {
          server.send(jsonMsg('er', '', 'Authentication failed', '', ''));
          return;
        }

        // Special endpoint: return client demo code as HTML
        if (u === 'getcodeclient') {
          server.send(jsonMsg('code', 'text/html', '<!-- client demo code here -->', '', ''));
          return;
        }
        // Special endpoint: return server code as HTML
        if (u === 'getcode') {
          server.send(jsonMsg('code', 'text/html', '<!-- server code here -->', '', ''));
          return;
        }

        // Prepare fetchOptions before using in cacheKey
        const acceptHeader = 'text/html, text/plain, application/json, image/jpeg, image/png, video/mp4, audio/mp3, */*;q=0.9';

        // Use optimized URL normalization
        const normalizedU = normalizeUrl(u);
        if (!normalizedU) {
          server.send(jsonMsg('er', '', 'Invalid URL provided', requestQ, ''));
          return;
        }

        // Handle data URLs directly (do not cache/fetch)
        if (normalizedU.startsWith('data:')) {
          // Parse data URL: data:[<mediatype>][;base64],<data>
          const match = normalizedU.match(/^data:([^;,]+)?(;base64)?,(.*)$/);
          if (!match) {
            server.send(jsonMsg('er', '', 'Invalid data URL', requestQ, ''));
            return;
          }
          let mime = match[1] || 'application/octet-stream';
          let isBase64 = !!match[2];
          let dataStr = match[3];
          let u8;
          try {
            u8 = isBase64 ? Uint8Array.from(atob(dataStr), c => c.charCodeAt(0)) : new TextEncoder().encode(decodeURIComponent(dataStr));
          } catch (e) {
            server.send(jsonMsg('er', '', 'Failed to decode data URL', requestQ, ''));
            return;
          }
          // Stream as if it were a fetched image/media
          const startInfo = JSON.stringify({
            contentLength: u8.length,
            range: '',
            partial: false,
            totalLength: u8.length
          });
          server.send(jsonMsg('s', mime, startInfo, requestQ, ''));
          const CHUNK_SIZE = 32 * 1024;
          for (let i = 0; i < u8.length; i += CHUNK_SIZE) {
            const chunk = u8.subarray(i, i + CHUNK_SIZE);
            sendBinaryChunk(server, chunk, mime, enc.encode(requestQ));
          }
          server.send(jsonMsg('e', mime, '', requestQ, ''));
          return;
        }

        // Build cache key
        let cacheUrl;
        try {
          cacheUrl = new URL(normalizedU);
        } catch {
          cacheUrl = new URL(normalizedU, 'https://dummy.local');
        }
        cacheUrl.searchParams.set('accept', fetchMethod === 'GET' ? acceptHeader : '');
        cacheUrl.searchParams.set('ua', a || '');
        const cacheKey = cacheUrl.toString();
        
        // Check cache first
        const cache = caches.default;
        const response = await cache.match(cacheKey);
        let result, data;

        // Get origin for headers with fallback
        let origin;
        try {
          origin = (new URL(normalizedU)).origin;
        } catch {
          origin = 'https://dummy.local';
        }

        // Adaptive timeout based on content type
        let timeoutMs = 15000;
        if (normalizedU.match(/\.(mp4|webm|mp3|wav|ogg)$/i)) {
          timeoutMs = 30000;
        } else if (normalizedU.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
          timeoutMs = 20000;
        }

        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), timeoutMs);
        
        // Prepare fetch options with optimized headers
        let fetchOptions = {
          method: fetchMethod,
          headers: {
            'User-Agent': a || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Encoding': 'identity',
            'X-Forwarded-Proto': request.headers.get('CF-Proto'),
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': normalizedU,
            'Origin': origin,
            'Accept': acceptHeader
          },
          signal: controller.signal,
          redirect: 'manual' // handle redirects manually to avoid subrequest chains
        };

        // Handle media resumption
        if ((os > 0 || oe !== null) && normalizedU.match(/\.(mp4|webm|mp3|wav|ogg)$/i)) {
          fetchOptions.headers['Range'] = oe !== null && !isNaN(oe) ? 
            `bytes=${os}-${oe}` : 
            `bytes=${os}-`;
        }

        // Add body for POST/PUT/PATCH requests
        if (["POST", "PUT", "PATCH"].includes(fetchMethod) && body) {
          fetchOptions.body = body;
        }

        // Process the request with proper error handling
        if (response) {
          result = await response.json();
          result.q = requestQ;
          
          // Handle cached media streams
          if (result.c && (result.c.startsWith('image') || result.c === 'application/pdf') && si === 'true' && result.d) {
            const b64 = result.d;
            const u8 = new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));
            
            server.send(jsonMsg('s', result.c, JSON.stringify({
              contentLength: u8.length,
              range: '',
              partial: false,
              totalLength: u8.length
            }), requestQ, ''));

            // Send in optimized chunks
            const CHUNK_SIZE = 32 * 1024;
            for (let i = 0; i < u8.length; i += CHUNK_SIZE) {
              sendBinaryChunk(server, u8.subarray(i, i + CHUNK_SIZE), result.c, qbytes);
            }
            
            server.send(jsonMsg('e', result.c, '', requestQ, ''));
            return;
          }
          
          server.send(JSON.stringify(result));
          return;
        }

        // Handle the actual fetch request
        let maxRedirects = 5;
        let redirectCount = 0;
        let finalUrl = normalizedU;
        let visitedUrls = new Set();

        while (true) {
          const redirectController = new AbortController();
          const redirectTimeoutMs = Math.max(5000, timeoutMs - redirectCount * 2000);
          const redirectTimeout = setTimeout(() => redirectController.abort(), redirectTimeoutMs);
          
          try {
            response = await fetch(finalUrl, { ...fetchOptions, signal: redirectController.signal });
          } catch (err) {
            clearTimeout(redirectTimeout);
            throw err;  // Let the outer catch handle this
          }
          
          clearTimeout(redirectTimeout);

          // Handle redirects
          if (response.status >= 300 && response.status < 400 && response.headers.has('Location')) {
            if (redirectCount >= maxRedirects) {
              throw new Error('Too many redirects');
            }
            
            const nextUrl = response.headers.get('Location');
            if (visitedUrls.has(finalUrl) || nextUrl === finalUrl) {
              throw new Error('Redirect loop detected');
            }

            visitedUrls.add(finalUrl);
            finalUrl = nextUrl;
            redirectCount++;
            continue;
          }
          
          break;
        }
        
        clearTimeout(fetchTimeout);

        // Handle non-OK responses
        if (!response.ok) {
          const errorHeaders = {};
          for (const [k, v] of response.headers.entries()) {
            if (k.toLowerCase().startsWith('x-') || k.toLowerCase().includes('error') || k.toLowerCase().includes('range')) {
              errorHeaders[k] = v;
            }
          }
          
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Process the response
        contentType = response.headers.get('Content-Type')?.toLowerCase() || '';
        const ce = response.headers.get('Content-Encoding')?.toLowerCase() || '';

        if (!contentType) {
          data = await response.text();
          result = jsonMsg('r', 'n', data, requestQ, '');
          await cachePut(cacheKey, result, cache);
          server.send(result);
        } 
        else if (contentType.startsWith('video') || 
                 contentType.startsWith('audio') || 
                 (contentType.startsWith('image') && si === 'true') || 
                 (contentType === 'application/pdf' && si === 'true')) {
          
          await streamAndMaybeCacheMedia(
            response,
            server,
            contentType,
            qbytes,
            true,
            10 * 1024 * 1024,  // 10MB cache limit
            requestQ,
            cacheKey,
            response.headers.get('content-length') || '',
            '',
            false,
            parseInt(response.headers.get('content-length'), 10) || 0
          );
        }
        else if (contentType.startsWith('image') && si === 'false') {
          server.send(jsonMsg('im', contentType, '', requestQ, ''));
          data = await response.arrayBuffer();
          if (data) {
            const u8 = new Uint8Array(data);
            server.send(u8);
            
            if (data.byteLength <= 10 * 1024 * 1024) {  // 10MB cache limit
              result = jsonMsg('r', contentType, uint8ToBase64(u8), requestQ, '');
              await cachePut(cacheKey, result, cache);
            }
          }
        }
        else {
          if (ce === 'gzip' || ce === 'br') {
            const decompressed = await decompress(response.body, ce);
            data = await decompressed.text();
          } else {
            data = await response.text();
          }
          
          result = jsonMsg('r', contentType, data, requestQ, '');
          await cachePut(cacheKey, result, cache);
          server.send(result);
        }
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
