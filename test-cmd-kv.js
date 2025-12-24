// Lightweight test harness to validate CMD_KV parsing and simulate STORE binding
async function handleCmdKv(u, STORE, admin = false) {
  if (typeof u !== 'string' || !u.startsWith('CMD_KV?')) return { skipped: true };
  if (!admin) return { error: 'unauthorized' };
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
    { u: 'CMD_KV?key=myKey&val=myValue', admin: true },
    { u: 'CMD_KV?key=emptyVal&val=', admin: true },
    { u: 'CMD_KV?key=&val=val', admin: true },
    { u: 'CMD_KV?key=has+space&val=some%20value', admin: true },
    { u: 'CMD_KV?key=myKey&val=shouldFail', admin: false },
    { u: 'NOTCMD?key=foo&val=bar', admin: false }
  ];

  for (const t of tests) {
    const res = await handleCmdKv(t.u, mockStore, t.admin);
    console.log(t.u, '(admin=' + t.admin + ') ->', res);
  }

  console.log('STORE calls:', mockStore.calls);
})();