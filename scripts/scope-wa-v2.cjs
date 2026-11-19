// Membungkus CSS desain Pemantauan WhatsApp v2 (v2.css, bundel gaya `pr-*` lengkap dengan reset dan token) di bawah `.v2-root`
// supaya tidak mengubah seluruh aplikasi. Jalankan: node scripts/scope-wa-v2.cjs (sumber: design-ref/wa-v2/v2.css).
const fs = require('fs');
const postcss = require('postcss');
const SRC = 'design-ref/wa-v2/v2.css';
const OUT = 'src/styles/features/wa-v2.css';
const ROOT = '.v2-root';
const css = fs.readFileSync(SRC, 'utf8');
const root = postcss.parse(css);
const inKeyframes = (n) => { for (let p = n.parent; p; p = p.parent) if (p.type === 'atrule' && /keyframes|font-face/.test(p.name)) return true; return false; };
root.walkRules((rule) => {
  if (inKeyframes(rule)) return;
  const out = [];
  for (const raw of rule.selectors) {
    const s = raw.trim();
    if (/^body:has\(/.test(s)) continue;
    if (/^(:root|html|body|:host)(\b|,|\[|:|$)/.test(s) || s === ':root, [data-theme="light"]') {
      out.push(s.replace(/^(:root|html|body|:host)/, ROOT));
    } else if (/^\[data-theme/.test(s)) {
      out.push(`${ROOT}${s}`);
    } else if (/^\*|^::/.test(s)) {
      out.push(`${ROOT} ${s}`, `${ROOT}${s === '*' ? '' : ''} ${s}`.trim());
    } else out.push(`${ROOT} ${s}`);
  }
  if (!out.length) { rule.remove(); return; }
  rule.selectors = [...new Set(out)];
});
fs.writeFileSync(OUT, root.toString());
console.log('ok', root.toString().length);
