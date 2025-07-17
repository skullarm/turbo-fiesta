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
      let contentType, requestQ;
      try {
        const { u, a, q, au, si, method, body } = JSON.parse(m.data);
        // Support offset for media resume
        let offset = 0;
        try { offset = JSON.parse(m.data).offset || 0; } catch {}
        // Use q as the request string, not query
        requestQ = q;
        const qbytes = enc.encode(q);
        const fetchMethod = method ? method.toUpperCase() : 'GET';
        // Simple daily auth
        let dt = new Date();
        let y = dt.getUTCFullYear();
        let mn = dt.getUTCMonth();
        let dd = dt.getUTCDate();
        let mAu = btoa(`${y}${mn}${dd}`);
        if (mAu !== au) {
          let msg = jsonMsg('er', contentType, 'er: auth error', requestQ, '');
          server.send(msg);
          return;
        }

        // Special endpoint: return server code as HTML if u === 'getcode'
        // Special endpoint: return client demo code as HTML if u === 'getcodeclient'
        if (u === 'getcodeclient') {
          let clientCode = '';
          try {
            clientCode = await (await fetch('https://raw.githubusercontent.com/skullarm/turbo-fiesta/main/ws-client-demo.html')).text();
          } catch (e) {
            clientCode = 'Sample client unavailable. (Could not fetch from GitHub)';
          }
          // Format as HTML (show as raw HTML for easy copy/view)
          let html = `<html><head><title>Sample Client</title><style>body{background:#222;color:#eee;font-family:monospace;}pre{background:#111;padding:1em;overflow:auto;}</style></head><body><h2>Sample Client (ws-client-demo.html)</h2><pre>${clientCode.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</pre></body></html>`;
          let result = jsonMsg('r', 'text/html', html, requestQ, '');
          server.send(result);
          return;
        }
        if (u === 'getcode') {
          // Fetch this file's source code from GitHub (public repo)
          let code = '';
          try {
            code = await (await fetch('https://raw.githubusercontent.com/skullarm/turbo-fiesta/main/worker.js')).text();
          } catch (e) {
            code = 'Source unavailable. (Could not fetch from GitHub)';
          }
          // Format as HTML
          let html = `<html><head><title>Server Code</title><style>body{background:#222;color:#eee;font-family:monospace;}pre{background:#111;padding:1em;overflow:auto;}</style></head><body><h2>Server Code</h2><pre>${code.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</pre></body></html>`;
          let result = jsonMsg('r', 'text/html', html, requestQ, '');
          server.send(result);
          return;
        }

        // Prepare fetchOptions before using in cacheKey
        // fetchOptions will be declared later, only build cacheKey here
        const acceptHeader = 'text/html, text/plain, application/json, image/jpeg, image/png, video/mp4, audio/mp3, */*;q=0.9';
        // Build a fully qualified cache key URL with variant info as query params
        let cacheUrl;
        try {
          cacheUrl = new URL(u);
        } catch {
          // fallback: if u is not a valid URL, use a dummy base
          cacheUrl = new URL(u, 'https://dummy.local');
        }
        cacheUrl.searchParams.set('accept', fetchMethod === 'GET' ? acceptHeader : '');
        cacheUrl.searchParams.set('ua', a || '');
        const cacheKey = cacheUrl.toString();
        const cache = caches.default;
        let response = await cache.match(cacheKey);
        let result, data;

        if (response) {
          result = await response.json();
          result.q = requestQ;
          server.send(JSON.stringify(result));
          return;
        }


        // Adaptive timeout: longer for video/audio, shorter for text
        let timeoutMs = 15000;
        // contentType is not known before fetch, so use u extension as a hint for media
        if (u.match(/\.(mp4|webm|mp3|wav|ogg)$/i)) {
          timeoutMs = 30000;
        } else if (u.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) {
          timeoutMs = 20000;
        }
        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), timeoutMs);
        let fetchOptions = {
          method: fetchMethod,
          headers: {
            'User-Agent': a || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Encoding': 'identity',
            'X-Forwarded-Proto': request.headers.get('CF-Proto'),
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': u,
            'Origin': (new URL(u)).origin,
            'Accept': acceptHeader
          },
          signal: controller.signal,
          redirect: 'manual' // handle redirects manually to avoid subrequest chains
        };
        // If resuming media, add Range header
        if (offset > 0 && u.match(/\.(mp4|webm|mp3|wav|ogg)$/i)) {
          fetchOptions.headers['Range'] = `bytes=${offset}-`;
        }
        if (["POST", "PUT", "PATCH"].includes(fetchMethod) && body) {
          fetchOptions.body = body;
        }
        // Logging (server-side only, can be toggled)
        const LOG_REQUESTS = false; // set true to enable
        if (LOG_REQUESTS) {
          console.log(`[Proxy] Fetching: ${u} | Method: ${fetchMethod} | UA: ${a}`);
        }
        let maxRedirects = 5;
        let redirectCount = 0;
        let finalUrl = u;
        let visitedUrls = new Set();
        while (true) {
          // Stricter timeout for each redirect
          const redirectController = new AbortController();
          const redirectTimeoutMs = Math.max(5000, timeoutMs - redirectCount * 2000); // reduce timeout per redirect
          const redirectTimeout = setTimeout(() => redirectController.abort(), redirectTimeoutMs);
          let redirectFetchOptions = { ...fetchOptions, signal: redirectController.signal };
          try {
            response = await fetch(finalUrl, redirectFetchOptions);
          } catch (err) {
            clearTimeout(redirectTimeout);
            let errorMsg;
            if (err.name === 'AbortError') {
              errorMsg = jsonMsg('er', '', `Fetch timeout (${redirectTimeoutMs / 1000}s) exceeded`, requestQ, '');
            } else {
              errorMsg = jsonMsg('er', '', `Fetch error: ${err}`, requestQ, '');
            }
            try { server.send(errorMsg); } catch {}
            return;
          }
          clearTimeout(redirectTimeout);
          // Logging for each redirect
          if (LOG_REQUESTS && response.status >= 300 && response.status < 400 && response.headers.has('Location')) {
            console.log(`[Proxy] Redirect ${redirectCount + 1}: ${finalUrl} -> ${response.headers.get('Location')}`);
          }
          // Block redirect loops
          if (visitedUrls.has(finalUrl)) {
            let errorMsg = jsonMsg('er', '', `Redirect loop detected at ${finalUrl}`, requestQ, '');
            try { server.send(errorMsg); } catch {}
            return;
          }
          visitedUrls.add(finalUrl);
          // Handle manual redirect (3xx status)
          if (response.status >= 300 && response.status < 400 && response.headers.has('Location') && redirectCount < maxRedirects) {
            let nextUrl = response.headers.get('Location');
            // Block redirect to same URL
            if (nextUrl === finalUrl) {
              let errorMsg = jsonMsg('er', '', `Redirect to same URL detected at ${finalUrl}`, requestQ, '');
              try { server.send(errorMsg); } catch {}
              return;
            }
            finalUrl = nextUrl;
            redirectCount++;
            continue;
          }
          break;
        }
        clearTimeout(fetchTimeout);

        if (!response.ok) {
          // Forward upstream error headers and status
          let errorHeaders = {};
          for (let [k, v] of response.headers.entries()) {
            if (k.toLowerCase().startsWith('x-') || k.toLowerCase().includes('error') || k.toLowerCase().includes('range')) {
              errorHeaders[k] = v;
            }
          }
          let errorMsg = jsonMsg(
            'er',
            '',
            `Er: ${response.status} | ${response.statusText} | ${u}`,
            requestQ,
            JSON.stringify(errorHeaders)
          );
          try { server.send(errorMsg); } catch {}
          return;
        }

        contentType = response.headers.get('Content-Type')?.toLowerCase() || '';
        let ce = response.headers.get('Content-Encoding')?.toLowerCase() || '';


        let shouldCache = false;
        let cacheChunks = true;
        const cacheLimit = 10 * 1024 * 1024; // 10MB
        if (!contentType) {
          data = await response.text();
          result = jsonMsg('r', 'n', data, requestQ, '');
          shouldCache = true;
        } else if (
          contentType.startsWith('video') ||
          contentType.startsWith('audio') ||
          (contentType.startsWith('image') && si === 'true')
        ) {
          // Refactored chunking/caching logic for media
          await streamAndMaybeCacheMedia(response, server, contentType, qbytes, cacheChunks, cacheLimit, requestQ, cacheKey);
          return;
        } else if (contentType.startsWith('image') && si === 'false') {
          server.send(jsonMsg('im', contentType, '', requestQ, ''));
          data = await response.arrayBuffer();
          // Only send binary if data is valid
          if (data) server.send(new Uint8Array(data));
          // Cache image as base64 if small enough
          if (data && data.byteLength <= cacheLimit) {
            let b64 = uint8ToBase64(new Uint8Array(data));
            result = jsonMsg('r', contentType, b64, requestQ, '');
            shouldCache = true;
          }
          return;
        } else {
          if (ce === 'gzip' || ce === 'br') {
            const decompressed = await decompress(response.body, ce);
            data = await decompressed.text();
          } else {
            data = await response.text();
          }
          result = jsonMsg('r', contentType, data, requestQ, '');
          shouldCache = true;
        }

        if (shouldCache) {
          await cachePut(cacheKey, result, cache);
        }
        server.send(result);

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
  // Always prepend qbytes for image/audio/video
  if (contentType.startsWith('image') || contentType.startsWith('audio') || contentType.startsWith('video')) {
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
async function streamAndMaybeCacheMedia(response, server, contentType, qbytes, cacheChunks, cacheLimit, requestQ, cacheKey) {
  server.send(jsonMsg('s', contentType, '', requestQ, ''));
  let reader = response.body.getReader();
  let chunks = [];
  let totalLength = 0;
  while (true) {
    let { done, value } = await reader.read();
    if (done) break;
    if (value) sendBinaryChunk(server, value, contentType, qbytes);
    if (cacheChunks && value) {
      let u8 = value instanceof Uint8Array ? value : new Uint8Array(value);
      if (totalLength + u8.length <= cacheLimit) {
        chunks.push(u8);
        totalLength += u8.length;
      } else {
        cacheChunks = false;
        chunks = [];
        totalLength = 0;
      }
    }
  }
  server.send(jsonMsg('e', contentType, '', requestQ, ''));
  // Cache only if all chunks fit under limit
  if (cacheChunks && totalLength > 0) {
    let all = new Uint8Array(totalLength);
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