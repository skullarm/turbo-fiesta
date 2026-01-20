export default {
  async fetch(request, env) {
    let client, server;
    try {
      [client, server] = Object.values(new WebSocketPair());
      server.accept();
    } catch (e) {
      return new Response('WebSocket error', { status: 500 });
    }

    const enc = new TextEncoder();


    // Safe send wrapper to avoid throwing when client disconnects
    let _wsClosed = false;
    function safeSend(payload) {
      if (_wsClosed) return false;
      try {
        server.send(payload);
        return true;
      } catch (e) {
        _wsClosed = true;
        try { server.close(); } catch (e) {}
        return false;
      }
    }

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

      // Track controllers/timeouts for cleanup in finally
      let controller = null;
      let fetchTimeout = null;
      const redirectTimeouts = [];

      try {
        // Parse message once and destructure all needed fields
        const msgData = JSON.parse(m.data);
        let {
          u, a, q, au, si, method, body,
          os = 0,
          oe = null,
          admin = false
        } = msgData;

  // Streaming-images (si) is always enabled now
  const STREAM_IMAGES = 'true';
  try{
  let clrAllTest = await env.STORE.get('CLR_ALL');
  if (clrAllTest === 'test') {
    safeSend(jsonMsg('info', 'text/plain', 'test_clr_all', q || '', ''));    
  }
  let clrCache = await env.STORE.get('CLR_CACHE');
  if(clrCache==="clr_cache"){
    safeSend(jsonMsg('info', 'text/plain', 'clr_cache', q || '', ''));
  }     
}catch(e){safeSend(jsonMsg('er', '', `KV STORE error ${e.message}`, q || '', '')); return;} 
  // Use q as the request string, not query. Default to empty string.
  const requestID = (typeof q === 'undefined' || q === null) ? '' : q;
  const qbytes = enc.encode(requestID);
        const fetchMethod = method ? method.toUpperCase() : 'GET';
        
        // Simple daily auth
        let dt = new Date();
        let y = dt.getUTCFullYear();
        let mn = dt.getUTCMonth();
        let dd = dt.getUTCDate();
        let mAu = btoa(`${y}${mn}${dd}`);
        if (mAu !== au) {
          safeSend(jsonMsg('er', '', 'Authentication failed', '', ''));
          return;
        }

        // Special endpoint: return client demo code as HTML
        if (u === 'getcodeclient') {
          safeSend(jsonMsg('info', 'text/html', '<!-- client demo code here -->', '', ''));
          return;
        }
        // Special endpoint: return server code as HTML
        if (u === 'getcode' && admin) {
          let srcText = '';
          try {
            // Try GitHub raw URL first
            const gitHubUrl = 'https://raw.githubusercontent.com/skullarm/turbo-fiesta/main/worker.js';
            const srcResp = await fetch(gitHubUrl);
            if (srcResp.ok) {
              srcText = await srcResp.text();
            } else {
              throw new Error('GitHub fetch failed');
            }
          } catch (e) {
            // Fallback: try import.meta.url
            try {
              const fallbackResp = await fetch(import.meta.url);
              if (fallbackResp.ok) {
                srcText = await fallbackResp.text();
              } else {
                srcText = 'Source unavailable in this environment.';
              }
            } catch (e2) {
              srcText = 'Source unavailable in this environment.';
            }
          }
          try {
            // Basic HTML escaping
            const esc = srcText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const html = "<!doctype html><meta charset='utf-8'><title>worker.js</title><style>body{background:#222;color:#eee;font-family:monospace;margin:0;}pre{background:#111;padding:1em;overflow:auto;margin:0;}</style><h2 style='padding:0.5em 1em;background:#333;'>Server Code</h2><pre>" + esc + "</pre>";
            safeSend(jsonMsg('info', 'text/html', html, '', ''));
          } catch (e) {
            safeSend(jsonMsg('er', '', 'Failed to fetch source: ' + (e && e.message ? e.message : String(e)), '', ''));
          }
          return;
        }

        // Special endpoint: CMD_KV?key=[keyname]&val=[value]
        // Writes provided key/value to the `STORE` KV binding using `STORE.put(key, val)`.
        // Admin-only by default: only requests with `admin: true` are allowed to write.
        if (typeof u === 'string' && u.startsWith('CMD_KV_PUT?')) {
          if (!admin) {
            safeSend(jsonMsg('er', '', 'Unauthorized: CMD_KV is admin-only', requestID, ''));
            return;
          }
          try {
            const params = new URLSearchParams(u.slice('CMD_KV_PUT?'.length));
            const k = params.get('key');
            const v = params.get('val');
            if (!k || v === null) {
              safeSend(jsonMsg('er', '', 'CMD_KV requires key and val', requestID, ''));
              return;
            }
            
            // Perform the KV write
            await env.STORE.put(k, v);
            safeSend(jsonMsg('info', 'text/plain', `Key ${k} written`, requestID, ''));
          } catch (e) {
            console.error('CMD_KV error:', e);
            safeSend(jsonMsg('er', '', 'Failed to write to STORE', requestID, ''));
          }
          return;
        }
        else if(typeof u === 'string' && u.startsWith('CMD_KV_GET?')) {
          try {
            const params = new URLSearchParams(u.slice('CMD_KV_GET?'.length));
            const k = params.get('key');
            if (!k) {
              safeSend(jsonMsg('er', '', 'CMD_KV_GET requires key', requestID, ''));
              return;
            }
            
            // Perform the KV get
            const v = await env.STORE.get(k);
            safeSend(jsonMsg('info', 'text/plain', v, requestID, ''));
          } catch (e) {
            console.error('CMD_KV_GET error:', e);
            safeSend(jsonMsg('er', '', 'Failed to read from STORE', requestID, ''));
          }
          return;
        }

        // Prepare fetchOptions before using in cacheKey
        const acceptHeader = 'text/html, text/plain, application/json, image/jpeg, image/png, video/mp4, audio/mp3, */*;q=0.9';

        // Use optimized URL normalization
        let normalizedU = normalizeUrl(u);
        if (!normalizedU) {
          safeSend(jsonMsg('er', '', 'Invalid URL provided', requestID, ''));
          return;
        }

        // Handle data URLs directly (do not cache/fetch)
        if (normalizedU.startsWith('data:')) {
          // Parse data URL: data:[<mediatype>][;base64],<data>
          const match = normalizedU.match(/^data:([^;,]+)?(;base64)?,(.*)$/);
          if (!match) {
            safeSend(jsonMsg('er', '', 'Invalid data URL', requestID, ''));
            return;
          }
          let mime = match[1] || 'application/octet-stream';
          let isBase64 = !!match[2];
          let dataStr = match[3];
          let u8;
          try {
            u8 = isBase64 ? base64ToUint8Array(dataStr) : new TextEncoder().encode(decodeURIComponent(dataStr));
          } catch (e) {
            safeSend(jsonMsg('er', '', 'Failed to decode data URL', requestID, ''));
            return;
          }
          // Stream as if it were a fetched image/media
          const startInfo = JSON.stringify({
            contentLength: u8.length,
            range: '',
            partial: false,
            totalLength: u8.length
          });
          if (!safeSend(jsonMsg('s', mime, startInfo, requestID, ''))) return;
          const CHUNK_SIZE = 32 * 1024;
          for (let i = 0; i < u8.length; i += CHUNK_SIZE) {
            const chunk = u8.subarray(i, i + CHUNK_SIZE);
            if (!sendBinaryChunk(server, chunk, mime, qbytes)) break;
          }
          safeSend(jsonMsg('e', mime, '', requestID, ''));
          return;
        }

        // If requester is not admin, apply safe, case-insensitive keyword substitutions
        // Only modify pathname/search/hash to avoid changing hostnames
        if (!admin) {
          const replacements = [
            { r: /Gwilliam/gi, v: 'williams' },
            { r: /Andrew/gi, v: 'andy' },
            { r: /A\.?J\.?/gi, v: 'jim' }
          ];
          try {
            const uo = new URL(normalizedU);
            const originalPart = uo.pathname + uo.search + uo.hash;
            let modifiedPart = originalPart;
            for (const rep of replacements) modifiedPart = modifiedPart.replace(rep.r, rep.v);
            if (modifiedPart !== originalPart) {
              // split modifiedPart into pathname, search and hash
              const hashIndex = modifiedPart.indexOf('#');
              const searchIndex = modifiedPart.indexOf('?');
              let pathname = modifiedPart;
              let search = '';
              let hash = '';
              if (searchIndex !== -1 && (hashIndex === -1 || searchIndex < hashIndex)) {
                pathname = modifiedPart.slice(0, searchIndex);
                if (hashIndex !== -1) {
                  search = modifiedPart.slice(searchIndex, hashIndex);
                  hash = modifiedPart.slice(hashIndex);
                } else {
                  search = modifiedPart.slice(searchIndex);
                }
              } else if (hashIndex !== -1) {
                pathname = modifiedPart.slice(0, hashIndex);
                hash = modifiedPart.slice(hashIndex);
              }
              uo.pathname = pathname || '/';
              uo.search = search;
              uo.hash = hash;
              normalizedU = uo.toString();
            }
          } catch (e) {
            // Fallback: simple string replacements if URL parsing fails
            let newU = normalizedU;
            for (const rep of replacements) {
              newU = newU.replace(rep.r, rep.v);
            }
            normalizedU = newU;
          }
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
        
        // Check cache first (prefer binary cache format if present)
        const cache = caches.default;
        const binaryCacheKey = cacheKey + '&cache=bin1';
        let cacheResponse = await cache.match(binaryCacheKey);
        let result, data;
        if (cacheResponse) {
          // Cached binary entry found — stream it without loading entire buffer
          const cachedContentType = cacheResponse.headers.get('Content-Type') || 'application/octet-stream';
          try {
            const contentLengthHeader = cacheResponse.headers.get('content-length');
            const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : '';
            const startInfo = JSON.stringify({ contentLength: contentLength, range: '', partial: false, totalLength: contentLength });
            if (!safeSend(jsonMsg('s', cachedContentType, startInfo, requestID, ''))) return;

            const reader = cacheResponse.body.getReader();
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              if (!sendBinaryChunk(server, value, cachedContentType, qbytes)) break;
            }
            safeSend(jsonMsg('e', cachedContentType, '', requestID, ''));
            return;
          } catch (e) {
            // If streaming cached binary fails, fall through to fetch path
          }
        }
        // Fallback to existing JSON cache format
        cacheResponse = await cache.match(cacheKey);
        let response = cacheResponse;

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

        // Use outer-scoped controller/fetchTimeout so finally can clean them up
        controller = new AbortController();
        fetchTimeout = setTimeout(() => controller.abort(), timeoutMs);
        
        // Prepare fetch options with optimized headers
        let fetchOptions = {
          method: fetchMethod,
          headers: {
            'User-Agent': a || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Encoding': 'identity',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Referer': normalizedU,
            'Origin': origin,
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="133", "Google Chrome";v="133"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1'
          },
          signal: controller.signal,
          redirect: 'manual' // handle redirects manually to avoid subrequest chains
        };

        // Handle media resumption with Range requests
        if ((os > 0 || oe !== null) && normalizedU.match(/\.(mp4|webm|mp3|wav|ogg)$/i)) {
          if(os > 0){
            fetchOptions.headers['Range'] = oe !== null && !isNaN(oe) ? 
              `bytes=${os}-${oe}` : 
              `bytes=${os}-`;           
          }
        }

        // Add body for POST/PUT/PATCH requests
        if (["POST", "PUT", "PATCH"].includes(fetchMethod) && body) {
          fetchOptions.body = body;
        }

        // Process the request with proper error handling
        if (response) {
          result = await response.json();
          result.q = requestID;
          
          // Handle cached media streams (images & PDFs always streamed)
          if (result.c && (result.c.startsWith('image') || result.c === 'application/pdf') && result.d) {
            const b64 = result.d;
            const u8 = base64ToUint8Array(b64);
            
            if (!safeSend(jsonMsg('s', result.c, JSON.stringify({
              contentLength: u8.length,
              range: '',
              partial: false,
              totalLength: u8.length
            }), requestID, ''))) return;

            // Send in optimized chunks
            const CHUNK_SIZE = 32 * 1024;
            for (let i = 0; i < u8.length; i += CHUNK_SIZE) {
              if (!sendBinaryChunk(server, u8.subarray(i, i + CHUNK_SIZE), result.c, qbytes)) break;
            }
            
            safeSend(jsonMsg('e', result.c, '', requestID, ''));
            return;
          }
          
          safeSend(JSON.stringify(result));
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
          // record redirect timeout so finally can clear any leaked timers
          redirectTimeouts.push(redirectTimeout);
          
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
        
        // fetchTimeout cleared here in normal flow, but ensure final cleanup in finally block
        if (fetchTimeout) {
          clearTimeout(fetchTimeout);
          fetchTimeout = null;
        }

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
          result = jsonMsg('r', 'n', data, requestID, '');
          await cachePut(cacheKey, result, cache);
          safeSend(result);
        } 
        else if (contentType.startsWith('video') || 
     contentType.startsWith('audio') || 
     contentType.startsWith('image') || 
     contentType === 'application/pdf') {
          
          await streamAndMaybeCacheMedia(
            response,
            server,
            contentType,
            qbytes,
            true,
            5 * 1024 * 1024,  // 5MB cache limit (reduced to save memory/CPU)
            requestID,
            cacheKey,
            response.headers.get('content-length') || '',
            '',
            false,
            parseInt(response.headers.get('content-length'), 10) || 0
          );
        }
        
        else {
          if (ce === 'gzip' || ce === 'br') {
            const decompressed = await decompress(response.body, ce);
            data = await decompressed.text();
          } else {
            data = await response.text();
          }
          
          result = jsonMsg('r', contentType, data, requestID, '');
          await cachePut(cacheKey, result, cache);
          safeSend(result);
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
        
        let errorMsg = jsonMsg('er', contentType, errorMessage, requestID, '');
        try { safeSend(errorMsg); } catch {}
      } finally {
        // Ensure timers and controllers are cleaned up to avoid leaks
        try {
          if (fetchTimeout) {
            clearTimeout(fetchTimeout);
            fetchTimeout = null;
          }
        } catch (er) {}
        try {
          for (const t of redirectTimeouts) {
            try { clearTimeout(t); } catch {}
          }
        } catch (er) {}
        try {
          if (controller) {
            try { controller.abort(); } catch {}
            controller = null;
          }
        } catch (er) {}
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

function jsonMsg(t, c = '', d = '', q = '', si = '') {
  return JSON.stringify({ t, c, d, q, si });
}
function base64ToUint8Array(b64) {
  // decode in chunks to avoid huge intermediate strings
  const binary = atob(b64);
  const len = binary.length;
  const u8 = new Uint8Array(len);
  const CHUNK = 0x8000; // 32KB
  for (let i = 0; i < len; i += CHUNK) {
    const end = Math.min(i + CHUNK, len);
    for (let j = i; j < end; j++) {
      u8[j] = binary.charCodeAt(j);
    }
  }
  return u8;
}

function sendBinaryChunk(server, value, contentType, qbytes) {
  if (!value) return true;
  let u8 = value instanceof Uint8Array ? value : new Uint8Array(value);
  try {
    // Always prepend qbytes for image/audio/video/pdf to preserve protocol
    if (contentType.startsWith('image') || contentType.startsWith('audio') || contentType.startsWith('video') || contentType === 'application/pdf') {
      const ca = new Uint8Array(qbytes.length + u8.length);
      ca.set(qbytes, 0);
      ca.set(u8, qbytes.length);
      server.send(ca);
    } else {
      server.send(u8);
    }
    return true;
  } catch (e) {
    // Caller should stop streaming when false is returned
    try { server.close(); } catch (er) {}
    return false;
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
async function streamAndMaybeCacheMedia(response, server, contentType, qbytes, cacheChunks, cacheLimit, requestID, cacheKey, contentLength, rangeUsed = '', partial = false, totalLength = 0) {
  // Don't collect chunks unless we're sure we'll cache
  const parsedContentLength = parseInt(contentLength, 10);
  const shouldCollectChunks = cacheChunks && (!contentLength || parsedContentLength <= cacheLimit);
  const chunks = shouldCollectChunks ? [] : null;
  let streamedLength = 0;

  // Enhanced stream info for better client progress indication
  try {
    if (!server) return;
  } catch (e) {}

  // local safe send using the provided server
  function localSafeSend(payload) {
    try {
      server.send(payload);
      return true;
    } catch (e) {
      try { server.close(); } catch {}
      return false;
    }
  }

  if (!localSafeSend(jsonMsg('s', contentType, JSON.stringify({
    contentLength,
    range: rangeUsed,
    partial,
    totalLength,
    expectedDuration: (contentType.startsWith('video') || contentType.startsWith('audio')) && Number.isFinite(parsedContentLength) ? 
      Math.ceil(parsedContentLength / 128000) : 
      undefined
  }), requestID, ''))) {
    return;
  }

  if (!response.body) {
    localSafeSend(jsonMsg('e', contentType, '', requestID, ''));
    return;
  }

  const reader = response.body.getReader();
  let abortedEarly = false;

  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      
      if (value) {
        if (!sendBinaryChunk(server, value, contentType, qbytes)) {
          // client closed or send failed; stop streaming
          abortedEarly = true;
          break;
        }
        
        // Only process for caching if we're collecting chunks and still under limit
        if (chunks) {
          const u8 = value instanceof Uint8Array ? value : new Uint8Array(value);
          const chunkSize = u8.length || u8.byteLength || 0;
          streamedLength += chunkSize;
          
          if (streamedLength <= cacheLimit) {
            chunks.push(u8);
          } else {
            // exceed cache limit, stop collecting further chunks
            // drop collected chunks to free memory
            // keep streaming to client but no longer cache
            // we set chunks variable to null to avoid further pushes
            // (can't reassign const, so use length = 0 + flag)
            chunks.length = 0;
            // mark so we won't try to cache later
            // note: we don't set chunks = null because it's const; instead rely on streamedLength check
          }
        }
      }
    }

    // if we aborted early, try to cancel reader to free resources
    if (abortedEarly) {
      try { await reader.cancel(); } catch (e) {}
      return;
    }

    // finished streaming; send end message
    localSafeSend(jsonMsg('e', contentType, '', requestID, ''));

    // If we collected chunks and total size within limit, cache it
    if (chunks && streamedLength > 0 && streamedLength <= cacheLimit) {
      try {
        // concatenate chunks
        const out = new Uint8Array(streamedLength);
        let pos = 0;
        for (const c of chunks) {
          out.set(c, pos);
          pos += c.length;
        }
        const b64 = uint8ToBase64(out);
        const result = jsonMsg('r', contentType, b64, requestID, '');
        await cachePut(cacheKey, result, caches.default);
      } catch (e) {
        // caching failure is non-fatal
      }
    }
  } finally {
    try { await reader.cancel(); } catch (e) {}
  }
}
