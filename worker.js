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

    server.addEventListener('close', (e) => {
      server.close();
    });

    try {
      server.send(j('info','','Welcome Golf Gangstas!!','',''));
    } catch (e) {
      console.error(e);
    }

    server.addEventListener('message', async (m) => { 
      let contentType, query;
      try {
        const { u, a, q, au, si} = JSON.parse(m.data);
        let dt = new Date();
        let y = dt.getUTCFullYear();
        let mn = dt.getUTCMonth();
        let dd = dt.getUTCDate();/*
        let mAu = btoa(`${y}${mn}${dt}`);*/ let mAu ='123456';
        if (mAu !== au) {
          let msg = j('er', contentType, `er: auth error`, query,'');
          
          return;
        } 
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
          headers: {
            'User-Agent': a,
            'Accept-Encoding': 'identity',
            'X-Forwarded-For': request.headers.get('CF-Connecting-IP'),
            'X-Forwarded-Proto': request.headers.get('CF-Proto'),
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept':
              'text/html, text/plain, application/json, image/jpeg, image/png, video/mp4, audio/mp3, */*;q=0.9'
          }
        });

        if (!response.ok) {
          let errorMsg = j(
            'er',
            '',
            `Er: ${response.status} | ${response.statusText} | ${u}`,
            query,''
          );
          console.log(JSON.parse(errorMsg));
          server.send(errorMsg); 
          return;
        }

        contentType = response.headers.get('Content-Type')?.toLowerCase() || '';
        let ce = response.headers.get('Content-Encoding')?.toLowerCase() || '';

        if (!contentType) {
          data = await response.text();
          result = j('r', 'n', data, q,'');
        } else if (
          contentType.startsWith('video') ||
          contentType.startsWith('audio') || (contentType.startsWith('image') && si==='true')
        ) {
          server.send(j('s', contentType, '', q,''));
          let reader = response.body.getReader();
          let n = true;
          while (true) {
            let { done, value } = await reader.read();
            if (n) {
              console.log(
                `ct: ${contentType} | t: ${value.constructor.toString()}`
              );
              n = false;
            }
            if (done) break;
            if (value instanceof Uint8Array) {
              server.send(value);
            } else if (value instanceof ArrayBuffer) {
              server.send(new Uint8Array(value));
            }
          }
          server.send(j('e', contentType, '', q,''));
          return;
        } else if (contentType.startsWith('image') && si!=='true'){/*
          data = `data:${contentType};base64,${Buffer.from(
            await response.arrayBuffer()
          ).toString('base64')}`;
          result = j('r', contentType, data, query);*/ data=await response.arrayBuffer(); server.send(data); return;
        } else {
          if (ce === 'gzip' || ce === 'br') {
            const decompressed = await decompress(response.body, ce);
            data = await decompressed.text();
          } else {
            data = await response.text();
          }
          result = j('r', contentType, data, query,'');
        }

        await z(u, result, cache);
        server.send(result);
        console.log(JSON.parse(result));
      } catch (e) {
        let errorMsg = j('er', contentType, `er: ${e}`, query,'');
        console.log(JSON.parse(errorMsg));
      }finally{ server.close();}
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

function j(t, c, d, q, si){
  return JSON.stringify({ t, c, d, q, si});
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