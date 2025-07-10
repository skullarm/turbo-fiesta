
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

        const cache = caches.default;
        let response = await cache.match(u);
        let result, data;

        if (response) {
          result = await response.json();
          result.q = requestQ;
          server.send(JSON.stringify(result));
          return;
        }


        // Add fetch timeout to avoid long-running requests
        const controller = new AbortController();
        const fetchTimeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
        try {
          const fetchOptions = {
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
          response = await fetch(u, fetchOptions);
        } catch (err) {
          clearTimeout(fetchTimeout);
          let errorMsg;
          if (err.name === 'AbortError') {
            errorMsg = jsonMsg('er', '', 'Fetch timeout (15s) exceeded', requestQ, '');
          } else {
            errorMsg = jsonMsg('er', '', `Fetch error: ${err}`, requestQ, '');
          }
          try { server.send(errorMsg); } catch {}
          return;
        }
        clearTimeout(fetchTimeout);

        if (!response.ok) {
          let errorMsg = jsonMsg(
            'er',
            '',
            `Er: ${response.status} | ${response.statusText} | ${u}`,
            requestQ,
            ''
          );
          try { server.send(errorMsg); } catch {}
          return;
        }

        contentType = response.headers.get('Content-Type')?.toLowerCase() || '';
        let ce = response.headers.get('Content-Encoding')?.toLowerCase() || '';

        if (!contentType) {
          data = await response.text();
          result = jsonMsg('r', 'n', data, requestQ, '');
        } else if (
          contentType.startsWith('video') ||
          contentType.startsWith('audio') ||
          (contentType.startsWith('image') && si === 'true')
        ) {
          server.send(jsonMsg('s', contentType, '', requestQ, ''));
          let reader = response.body.getReader();
          while (true) {
            let { done, value } = await reader.read();
            if (done) break;
            sendBinaryChunk(server, value, contentType, qbytes);
          }
          server.send(jsonMsg('e', contentType, '', requestQ, ''));
          return;
        } else if (contentType.startsWith('image') && si === 'false') {
          server.send(jsonMsg('im', contentType, '', requestQ, ''));
          data = await response.arrayBuffer();
          server.send(new Uint8Array(data));
          return;
        } else {
          if (ce === 'gzip' || ce === 'br') {
            const decompressed = await decompress(response.body, ce);
            data = await decompressed.text();
          } else {
            data = await response.text();
          }
          result = jsonMsg('r', contentType, data, requestQ, '');
        }

        await cachePut(u, result, cache);
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