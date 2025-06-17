import { Buffer } from 'node:buffer';

export default {
  async fetch(request) {
    let client, server;
    try {
      [client, server] = Object.values(new WebSocketPair());
      server.accept();
    } catch (e) {
      console.error(e);
    }

    server.addEventListener('close', (e) => {});

    try {
      server.send('golf gangsta');
    } catch (e) {
      console.error(e);
    }

    server.addEventListener('message', async (m) => {
      server.send('c');
      let contentType, query;
      try {
        const { u, a, q } = JSON.parse(m.data);
        query = q;
        let response, data, result;
        const cache = caches.default;
        response = await cache.match(u);

        if (response) {
          result = await response.json();
          result.q = q;
          server.send(JSON.stringify(result));
          return;
        }

        response = await fetch(u, {
          headers: { 'User-Agent': a, 'Accept-Encoding': 'identity' }
        });
        contentType = response.headers.get('Content-Type')?.toLowerCase() || '';
        let ce = response.headers.get('Content-Encoding')?.toLowerCase() || '';

        if (!contentType) {
          data = await response.text();
          result = j('r', 'n', data, q);
        } else if (contentType.startsWith('video') || contentType.startsWith('audio')) {
          server.send(j('s', contentType, '', q));
          let reader = response.body.getReader();
          let n = 0;
          while (true) {
            if (n === 0) {
              console.info(`c:${contentType} | t`);
              n++;
            }
            let { done, value } = await reader.read();
            if (done) break;
            if (value instanceof Uint8Array) {
              server.send(value);
            } else if (value instanceof ArrayBuffer) {
              server.send(new Uint8Array(value));
            }
          }
          server.send(j('e', contentType, '', q));
          return;
        } else if (contentType.startsWith('image')) {
          data = `data:${contentType};base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`;
          result = j('r', contentType, data, query);
        } else {
          data = await response.text();
          result = j('r', contentType, data, query);
        }
        server.send(result);
        console.log(JSON.parse(result));
      } catch (e) {
        let errorMsg = j('er', contentType, `er: ${e}`, query);
        console.log(JSON.parse(errorMsg));
      }
    });

    return new Response(null, { status: 101, webSocket: client });
  }
};

async function z(u, x, o) {
  try {
    await o.put(
      u,
      new Response(x, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public,max-age=3500'
        }
      })
    );
  } catch (e) {
    console.log({ er: `cache er: ${e}` });
  }
}

function j(t, c, d, q) {
  return JSON.stringify({ t, c, d, q });
}