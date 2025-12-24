const replacements = [
  { r: /\bGwilliam\b/gi, v: 'williams' },
  { r: /\bAndrew\b/gi, v: 'andy' },
  { r: /\bA\.?J\.?\b/gi, v: 'jim' }
];

function applyReplacements(normalizedU) {
  try {
    const uo = new URL(normalizedU);
    const originalPart = uo.pathname + uo.search + uo.hash;
    let modifiedPart = originalPart;
    for (const rep of replacements) modifiedPart = modifiedPart.replace(rep.r, rep.v);
    if (modifiedPart !== originalPart) {
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
      return uo.toString();
    }
    return normalizedU;
  } catch (e) {
    let newU = normalizedU;
    for (const rep of replacements) {
      newU = newU.replace(rep.r, rep.v);
    }
    return newU;
  }
}

const tests = [
  'https://example.com/AJ/profile?name=Andrew#Gwilliam',
  'https://example.com/foo?query=AJ+Andrew',
  'https://example.com/#Gwilliam',
  'https://example.com/A.J./path',
  'http://[::1]:9999/AJ', // IPv6 literal host
  'not-a-url-without-protocol/AJ?name=Andrew#Gwilliam'
];

for (const t of tests) {
  console.log(t, '->', applyReplacements(t));
}

// Malformed URL should use fallback replacement
console.log('malformed ->', applyReplacements('http://%zz/AJ#Gwilliam'));
