// Lightweight test harness to validate CMD_KV parsing and simulate STORE binding
async function handleCmdKv(u, STORE) {
  if (typeof u !== 'string' || !u.startsWith('CMD_KV?')) return { skipped: true };
  const params = new URLSearchParams(u.slice('CMD_KV?'.length));
  const k = params.get('key');
  const v = params.get('val');
  if (!k || v === null) return { error: 'missing key or val' };
  try {
    await STORE.put(k, v);
    return { ok: true, key: k, val: v };
  } catch (e) {
    return { error: e.message || 'put-failed' };
  }
}

(async function run() {
  const mockStore = {
    calls: [],
    async put(k, v) { this.calls.push([k, v]); }
  };

  const tests = [
    'CMD_KV?key=myKey&val=myValue',
    'CMD_KV?key=emptyVal&val=',
    'CMD_KV?key=&val=val',
    'CMD_KV?key=has+space&val=some%20value',
    'NOTCMD?key=foo&val=bar'
  ];

  for (const t of tests) {
    const res = await handleCmdKv(t, mockStore);
    console.log(t, '->', res);
  }

  console.log('STORE calls:', mockStore.calls);
})();