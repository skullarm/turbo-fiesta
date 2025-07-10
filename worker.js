
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

    server.addEventListener('close', () => {
      try { server.close(); } catch {}
    });

    // Send initial info
    try {
      server.send(jsonMsg('su', '', getGG(), '', ''));
      server.send(jsonMsg('info', '', 'Welcome Golf Gangstas!!', '', ''));
    } catch (e) {
      console.error(e);
    }

    server.addEventListener('message', async (m) => {
      let contentType, requestQ;
      try {
        const { u, a, q, au, si, method, body } = JSON.parse(m.data);
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
        if (u === 'getcode') {
          // Read this file's source code
          let code = '';
          try {
            code = await (await fetch('https://raw.githubusercontent.com/' + (typeof GITHUB_REPO !== 'undefined' ? GITHUB_REPO : '') + 'turbo-fiesta/main/worker.js')).text();
          } catch (e) {
            code = 'Source unavailable in this environment.';
          }
          // Fallback: try to use import.meta.url if available (for local dev)
          if (!code || code.startsWith('Source unavailable')) {
            try {
              code = (typeof __filename !== 'undefined') ? require('fs').readFileSync(__filename, 'utf8') : '';
            } catch {}
          }
          // Format as HTML
          let html = `<html><head><title>Server Code</title><style>body{background:#222;color:#eee;font-family:monospace;}pre{background:#111;padding:1em;overflow:auto;}</style></head><body><h2>Server Code</h2><pre>${code.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</pre></body></html>`;
          let result = jsonMsg('r', 'text/html', html, requestQ, '');
          server.send(result);
          return;
        }

        // Smarter cache key: include Accept and User-Agent for variant separation
        const cacheKey = `${u}|accept=${fetchMethod === 'GET' ? (fetchOptions && fetchOptions.headers && fetchOptions.headers['Accept']) : ''}|ua=${a || ''}`;
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
        if (contentType && (contentType.startsWith('video') || contentType.startsWith('audio'))) {
          timeoutMs = 30000; // 30s for media
        } else if (contentType && contentType.startsWith('image')) {
          timeoutMs = 20000; // 20s for images
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
            'Accept': 'text/html, text/plain, application/json, image/jpeg, image/png, video/mp4, audio/mp3, */*;q=0.9'
          },
          signal: controller.signal
        };
        if (["POST", "PUT", "PATCH"].includes(fetchMethod) && body) {
          fetchOptions.body = body;
        }
        // Logging (server-side only, can be toggled)
        const LOG_REQUESTS = false; // set true to enable
        if (LOG_REQUESTS) {
          console.log(`[Proxy] Fetching: ${u} | Method: ${fetchMethod} | UA: ${a}`);
        }
        try {
          response = await fetch(u, fetchOptions);
        } catch (err) {
          clearTimeout(fetchTimeout);
          let errorMsg;
          if (err.name === 'AbortError') {
            errorMsg = jsonMsg('er', '', `Fetch timeout (${timeoutMs / 1000}s) exceeded`, requestQ, '');
          } else {
            errorMsg = jsonMsg('er', '', `Fetch error: ${err}`, requestQ, '');
          }
          try { server.send(errorMsg); } catch {}
          return;
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
          server.send(jsonMsg('s', contentType, '', requestQ, ''));
          let reader = response.body.getReader();
          let chunks = [];
          let totalLength = 0;
          while (true) {
            let { done, value } = await reader.read();
            if (done) break;
            sendBinaryChunk(server, value, contentType, qbytes);
            // Only accumulate for caching if under limit
            if (cacheChunks && value) {
              let u8 = value instanceof Uint8Array ? value : new Uint8Array(value);
              if (totalLength + u8.length <= cacheLimit) {
                chunks.push(u8);
                totalLength += u8.length;
              } else {
                cacheChunks = false; // Stop accumulating if over limit
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
            let b64 = btoa(String.fromCharCode(...all));
            result = jsonMsg('r', contentType, b64, requestQ, '');
            shouldCache = true;
          }
          return;
        } else if (contentType.startsWith('image') && si === 'false') {
          server.send(jsonMsg('im', contentType, '', requestQ, ''));
          data = await response.arrayBuffer();
          server.send(new Uint8Array(data));
          // Cache image as base64 if small enough
          if (data && data.byteLength <= cacheLimit) {
            let b64 = btoa(String.fromCharCode(...new Uint8Array(data)));
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
        let errorMsg = jsonMsg('er', contentType, `er: ${e}`, requestQ, '');
        try { server.send(errorMsg); } catch {}
      }
    });

    return new Response(null, { status: 101, webSocket: client });
  }
};

function getGG() {
  return "let chunks =[]; let hist=[]; let stream=false; let ind=-1; const si='true'; let au; const d = document; const a = navigator.userAgent; const wsp = 'wss://turbo-fiesta.skullarm8387.workers.dev'; let ws, curl, ct; let burl = null; ";
}

function jsonMsg(t, c, d, q, si) {
  return JSON.stringify({ t, c, d, q, si });
}

function sendBinaryChunk(server, value, contentType, qbytes) {
  if (!value) return;
  if (value instanceof Uint8Array) {
    if (contentType.startsWith('image')) {
      const ca = new Uint8Array(qbytes.length + value.length);
      ca.set(qbytes, 0);
      ca.set(value, qbytes.length);
      server.send(ca);
    } else {
      server.send(value);
    }
  } else if (value instanceof ArrayBuffer) {
    const u8 = new Uint8Array(value);
    if (contentType.startsWith('image')) {
      const ca = new Uint8Array(qbytes.length + u8.length);
      ca.set(qbytes, 0);
      ca.set(u8, qbytes.length);
      server.send(ca);
    } else {
      server.send(u8);
    }
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