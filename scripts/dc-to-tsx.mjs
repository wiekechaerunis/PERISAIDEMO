// Penerjemah template canvas desain (.dc.html) ke React TSX. Menjaga markup, kelas, style inline, dan teks persis seperti sumber.
// Jalankan: npm run convert   (membaca design/*.dc.html, menulis src/generated/ dan src/features/**; aman dijalankan ulang).
//
// Aturan terjemah (PRD §3): {{x}} → v.x · <sc-for list as> → .map · <sc-if value> → && · onClick="{{fn}}" → onClick={fn}
// <dc-import name> → komponen React · class → className · style="..." → objek · <helmet> dibuang (style-nya diekstrak).
import fs from 'node:fs';
import path from 'node:path';
import { parseDocument } from 'htmlparser2';
import { decodeHTML } from 'entities';
import { SOURCE_PATCHES, TABLE_LOGIC_PATCHES } from './dashboard-tabel.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const DESIGN = path.join(ROOT, 'design/dashboard');

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const BOOL = new Set(['disabled', 'hidden', 'checked', 'readOnly', 'autoFocus', 'multiple', 'selected', 'required']);
const ATTR = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', colspan: 'colSpan', rowspan: 'rowSpan', readonly: 'readOnly',
  maxlength: 'maxLength', autocomplete: 'autoComplete', autofocus: 'autoFocus', 'xlink:href': 'xlinkHref', onclick: 'onClick',
  onchange: 'onChange', onkeydown: 'onKeyDown', onmouseenter: 'onMouseEnter', onmouseleave: 'onMouseLeave', viewbox: 'viewBox',
};
const kebabToCamel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const attrName = (n) => ATTR[n] ?? (/^(aria|data)-/.test(n) ? n : n.includes('-') ? kebabToCamel(n) : n);
const cssProp = (p) => (p.startsWith('--') ? JSON.stringify(p) : p.startsWith('-') ? kebabToCamel(p.slice(1)).replace(/^./, (c) => c.toUpperCase()) : kebabToCamel(p));

/** Pecah string yang memuat {{x}} menjadi bagian statis dan ekspresi. */
function parts(str) {
  const out = [];
  let i = 0;
  for (const m of str.matchAll(/\{\{\s*([^}]*?)\s*\}\}/g)) {
    if (m.index > i) out.push({ s: str.slice(i, m.index) });
    out.push({ e: m[1] });
    i = m.index + m[0].length;
  }
  if (i < str.length) out.push({ s: str.slice(i) });
  return out;
}
const hasExpr = (str) => str.includes('{{');

function exprOf(e, scope) {
  const first = e.split('.')[0];
  return scope.has(first) ? e : `v.${e}`;
}

/** Nilai atribut: string statis (didekode), ekspresi tunggal, atau template literal. */
function valueCode(raw, scope) {
  const ps = parts(raw);
  if (!ps.some((p) => p.e !== undefined)) return { str: decodeHTML(raw) };
  if (ps.length === 1) return { code: exprOf(ps[0].e, scope) };
  const body = ps.map((p) => (p.e !== undefined ? '${' + exprOf(p.e, scope) + '}' : decodeHTML(p.s).replace(/[`\\$]/g, '\\$&'))).join('');
  return { code: '`' + body + '`' };
}
const jsxAttrValue = (r) => (r.str !== undefined ? JSON.stringify(r.str) : `{${r.code}}`);

function splitDecls(style) {
  const out = [];
  let cur = '';
  let paren = 0;
  let brace = 0;
  for (let i = 0; i < style.length; i++) {
    const c = style[i];
    if (style.startsWith('{{', i)) brace++;
    if (style.startsWith('}}', i)) brace--;
    if (c === '(') paren++;
    if (c === ')') paren--;
    if (c === ';' && paren === 0 && brace === 0) { out.push(cur); cur = ''; } else cur += c;
  }
  if (cur.trim()) out.push(cur);
  return out.map((d) => d.trim()).filter(Boolean);
}
function styleObject(raw, scope) {
  const items = splitDecls(raw).map((d) => {
    const k = d.indexOf(':');
    const prop = d.slice(0, k).trim();
    const val = d.slice(k + 1).trim();
    const r = valueCode(val, scope);
    return `${cssProp(prop)}: ${r.str !== undefined ? JSON.stringify(r.str) : r.code}`;
  });
  const custom = splitDecls(raw).some((d) => d.startsWith('--'));
  return `{{ ${items.join(', ')} }${custom ? " as import('react').CSSProperties" : ''}}`;
}

function textCode(raw, scope, ctx) {
  const t = raw.replace(/\s+/g, ' ');
  if (!t.trim() && !hasExpr(t)) return ctx.between ? '{" "}' : '';
  const ps = parts(t);
  return ps.map((p) => {
    if (p.e !== undefined) return `{${exprOf(p.e, scope)}}`;
    const needsStr = /[{}<>&\\]/.test(p.s);
    return needsStr ? `{${JSON.stringify(decodeHTML(p.s))}}` : p.s;
  }).join('');
}

export function convertTemplate(tpl, { splits = {}, onSplit = () => {}, importName = (n) => n } = {}) {
  const doc = parseDocument(tpl, { lowerCaseAttributeNames: false, lowerCaseTags: false, decodeEntities: false });
  const loopIdx = { n: 0 };

  const children = (node, scope, pathStr) => {
    const kids = node.children.filter((c) => c.type === 'tag' || c.type === 'text');
    let idx = -1;
    return kids.map((c, k) => {
      if (c.type === 'text') {
        const prevEl = kids[k - 1]?.type === 'tag';
        const nextEl = kids[k + 1]?.type === 'tag';
        return textCode(c.data, scope, { between: prevEl && nextEl && !/\n/.test(c.data) });
      }
      if (c.name === 'helmet') return '';
      idx++;
      return gen(c, scope, pathStr === '' ? String(idx) : `${pathStr}/${idx}`);
    }).join('');
  };

  const gen = (node, scope, pathStr) => {
    if (splits[pathStr]) {
      const name = splits[pathStr];
      onSplit(name, genRaw(node, new Set(), pathStr), pathStr);
      return `<${importName(name)} v={v} />`;
    }
    return genRaw(node, scope, pathStr);
  };

  const genRaw = (node, scope, pathStr) => {
    const a = node.attribs;
    if (node.name === 'sc-for') {
      const list = exprOf(a.list.replace(/\{\{|\}\}/g, '').trim(), scope);
      const as = a.as;
      const key = `k${loopIdx.n++}`;
      const inner = children(node, new Set([...scope, as]), pathStr);
      return `{(${list} ?? []).map((${as}: any, ${key}: number) => (<Fragment key={${key}}>${inner}</Fragment>))}`;
    }
    if (node.name === 'sc-if') {
      const cond = exprOf(a.value.replace(/\{\{|\}\}/g, '').trim(), scope);
      return `{(${cond}) && (<>${children(node, scope, pathStr)}</>)}`;
    }
    if (node.name === 'dc-import') {
      const props = Object.entries(a)
        .filter(([k]) => k !== 'name' && !k.startsWith('hint-'))
        .map(([k, val]) => `${kebabToCamel(k)}=${jsxAttrValue(valueCode(val, scope))}`);
      return `<${importName(a.name)} ${props.join(' ')} />`;
    }
    const tag = node.name;
    const attrs = Object.entries(a)
      .filter(([k]) => !k.startsWith('hint-'))
      .map(([k, raw]) => {
        const n = attrName(k);
        if (n === 'style') return `style=${styleObject(raw, scope)}`;
        if (raw === '' && BOOL.has(n)) return n;
        if (tag === 'input' && n === 'value') return `defaultValue=${jsxAttrValue(valueCode(raw, scope))}`;
        if (n === 'href' && hasExpr(raw)) {
          const r = valueCode(raw, scope);
          const m = raw.match(/^\{\{\s*(\w+)\.href\s*\}\}$/);
          return `href={routeHref(${r.code}${m && scope.has(m[1]) ? `, ${m[1]}.id` : ''})}`;
        }
        if (/^(tabIndex|colSpan|rowSpan|maxLength)$/.test(n) && /^\d+$/.test(raw)) return `${n}={${raw}}`;
        return `${n}=${jsxAttrValue(valueCode(raw, scope))}`;
      });
    const inner = children(node, scope, pathStr);
    const open = `<${tag}${attrs.length ? ' ' + attrs.join(' ') : ''}`;
    return VOID.has(tag) || !inner ? `${open} />` : `${open}>${inner}</${tag}>`;
  };

  return children(doc, new Set(), '');
}

/** Ambil isi <style> dari <helmet> dan skrip class Component. */
export function extractParts(html) {
  const a = html.indexOf('<x-dc>');
  const b = html.indexOf('</x-dc>');
  const tpl = html.slice(a + 6, b);
  const style = (tpl.match(/<helmet>[\s\S]*?<style>([\s\S]*?)<\/style>/) ?? [])[1] ?? '';
  const sc = html.indexOf('<script type="text/x-dc"');
  let cls = '';
  if (sc >= 0) {
    const body = html.slice(html.indexOf('>', sc) + 1, html.lastIndexOf('</script>'));
    cls = body.slice(body.indexOf('class Component'));
  }
  return { tpl, style, cls };
}

export function pretty(code) {
  return code.replace(/></g, '>\n<');
}

const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // aset peta dari /public/peta, dengan path absolut supaya aman di rute bertingkat
  if (file.endsWith('.tsx')) content = content.replace(/"peta\//g, '"/peta/');
  fs.writeFileSync(file, content);
};
const read = (f) => fs.readFileSync(path.join(DESIGN, f), 'utf8');

/* ----------------------------------------------------------------------------------------------- */
const HEADER = '// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.\n/* eslint-disable */\n';

// Kelas komponen dari skrip desain (ported apa adanya)
function portLogic(cls, name, outFile, dataNames = [], logicPatches = []) {
  let code = cls.replace('class Component extends DCLogic', `export class ${name} extends DCLogic`);
  for (const [re, to] of logicPatches) {
    if (typeof re === 'string' ? !code.includes(re) : !re.test(code)) console.warn(`PATCH logika tidak cocok: ${re}`);
    code = typeof re === 'string' ? code.split(re).join(to) : code.replace(re, to);
  }
  // Konstanta data dipindah apa adanya ke src/data/dashboard.ts (PRD v2: data terpisah dari logika).
  const moved = [];
  for (const nm of dataNames) {
    const m = new RegExp(`^[ \\t]*const ${nm} = `, 'm').exec(code);
    if (!m) { console.warn(`konstanta ${nm} tidak ditemukan`); continue; }
    let i = m.index + m[0].length, depth = 0, q = null;
    for (; i < code.length; i++) {
      const c = code[i];
      if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
      if (c === '"' || c === "'" || c === '`') q = c;
      else if ('([{'.includes(c)) depth++;
      else if (')]}'.includes(c)) depth--;
      else if (c === ';' && depth === 0) break;
    }
    moved.push(code.slice(m.index, i + 1).trim().replace(/^const /, 'export const '));
    code = code.slice(0, m.index) + code.slice(i + 1).replace(/^\n/, '');
  }
  let imp = '';
  if (moved.length) {
    // Sebaran insiden tambahan (src/data/dashboardExtra.ts) dipasang setelah data desain
    write(path.join(ROOT, 'src/data/dashboard.ts'), `// @ts-nocheck\n// Data demo Dashboard insiden, dipindah apa adanya dari design/Dashboard.dc.html (renderVals).\nimport { extendDashboard } from './dashboardExtra';\n${moved.join('\n\n')}\n\nextendDashboard({ A0, INC, CAT, W });\n`);
    imp = `import { ${dataNames.join(', ')} } from '@/data/dashboard';\nimport { EXTRA_SITES } from '@/data/dashboardExtra';\n`;
  }
  write(outFile, `// @ts-nocheck\n${HEADER}import { DCLogic } from '@/dc/runtime';\n${imp}\n${code}\n`);
}


// Periode dashboard (tombol Periode, masukan PM): props.periode = { from, to, full, label, cap, text } dari dashPeriod.ts.
// full (rentang mencakup seluruh data Jan–Jun 2026) = angka semester apa adanya. Selain itu jumlah insiden dihitung tepat dari
// tanggal lapor INC (INC cocok 1:1 dengan level per area A0 dan pola bulanan); kerugian, jenis, matriks, kerawanan, dan DTT
// diskalakan dengan porsi insiden periode (perkiraan, diberi keterangan). Dipasang setelah patch lain, jadi teks yang dicocokkan
// adalah hasil patch sebelumnya. Lihat DEVIATIONS.md D-D1..D-D6.
const PERIOD_PATCHES = [
  ['const dttOn = skk && s.dtt;', String.raw`const dttOn = skk && s.dtt;
    // Periode (tombol Periode): jumlah insiden tepat dari tanggal lapor INC; kerugian, jenis, kerawanan, DTT diskalakan (perkiraan)
    const PD = this.props.periode || null; const pFull = !PD || PD.full;
    const MOI = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, Mei: 5, Jun: 6 };
    const pad2 = (n) => String(n).padStart(2, '0');
    const dOf = (t) => { const p = String(t).trim().split(' '); return '2026-' + pad2(MOI[p[1]] || 0) + '-' + pad2(Number(p[0])); };
    const inPd = (t) => pFull || (dOf(t) >= PD.from && dOf(t) <= PD.to);
    const INCP = INC.filter((r) => inPd(r[6]));
    const fracOf = (f) => { const all = INC.filter(f).length; return all ? INCP.filter(f).length / all : 0; };
    const aF = {}; A0.forEach((a) => { aF[a[0]] = pFull ? 1 : fracOf((r) => r[1] === a[0]); });
    const wF = {}; WO.forEach((w) => { const ids = A0.filter((a) => a[1] === w).map((a) => a[0]); wF[w] = pFull ? 1 : fracOf((r) => ids.includes(r[1])); });
    const moCov = [31, 28, 31, 30, 31, 30].map((dn, i) => { if (pFull) return 1; let c = 0; for (let d = 1; d <= dn; d++) { const t = '2026-' + pad2(i + 1) + '-' + pad2(d); if (t >= PD.from && t <= PD.to) c++; } return c / dn; });
    const dttF = pFull ? 1 : sum([35, 27, 70, 122, 66, 102].map((v, i) => v * moCov[i])) / 422;
    const PL = PD ? PD.text : 'Semester I 2026';
    const PCMP = pFull ? 'vs Sem. II 2025' : 'vs periode sebelumnya, perkiraan';`],
  ['let lv = a[5].slice();', 'let lv = pFull ? a[5].slice() : [0, 1, 2, 3, 4].map((l) => INCP.filter((r) => r[1] === a[0] && r[3] === l).length);'],
  ['lv = alloc(Math.min(catN[a[0]] || 0, sum(a[5])), lv);', 'lv = alloc(Math.min(Math.round((catN[a[0]] || 0) * aF[a[0]]), sum(lv)), lv);'],
  ['lv[0] += DTT[a[0]];', 'lv[0] += Math.round(DTT[a[0]] * dttF);'],
  ['.map((a) => a[5][i])) + (i === 0 && dttOn ? 422 : 0));', '.map((a) => pFull ? a[5][i] : INCP.filter((r) => r[1] === a[0] && r[3] === i).length)) + (i === 0 && dttOn ? Math.round(422 * dttF) : 0));'],
  ['const pool = INC.filter((r) => r[1] === loc.id);', 'const pool = INCP.filter((r) => r[1] === loc.id);'],
  ['incs = T.filter((t) => s.lv[t[2]])', "incs = T.filter((t) => s.lv[t[2]] && inPd(t[1].split(' · ')[1].replace(' 2026', '')))"],
  ['const incS = INC.filter(', 'const incS = INCP.filter('],
  ['const stA = [0, 1, 2].map(', 'const scAll = INC.filter((r) => scIds.includes(r[1])).length; const pShare = pFull ? 1 : (scAll ? INCP.filter((r) => scIds.includes(r[1])).length / scAll : 0);\n    const stA = [0, 1, 2].map('],
  ["aCatS = cc[1] + ' insiden pada periode ini';", "aCatS = Math.round(cc[1] * pShare) + ' insiden pada periode ini' + (pFull ? '' : ' (perkiraan)');"],
  ['const prevN = isNat ?', 'const prevN0 = isNat ?'],
  [', prevR = isNat ?', ', prevR0 = isNat ?'],
  ['(isOwn ? 600 : Math.max(1, Math.round(ALL.r * 0.78)));', '(isOwn ? 600 : Math.max(1, Math.round(ALL.r * 0.78)));\n    const prevN = (pFull || !(isNat || isOwn)) ? prevN0 : Math.max(1, Math.round(prevN0 * pShare)), prevR = (pFull || !(isNat || isOwn)) ? prevR0 : Math.max(1, Math.round(prevR0 * pShare));'],
  ["'vs Sem. II 2025 ('", "PCMP + ' ('"],
  ['const aiSeg = aiZoom ? aiZoom : skk ? [', String.raw`const aiSeg = aiZoom ? aiZoom : !pFull ? [
      seg(PD.text + ' mencatat ' + ALL.n + ' insiden terverifikasi dengan kerugian ' + rp(ALL.r) + ' (perkiraan). '),
      seg(topLoc && topLoc.mx >= 0 && topLoc.n ? 'Level tertinggi ' + LV[topLoc.mx][0] + ' ada di ' : (ALL.n ? '' : 'Tidak ada insiden terverifikasi pada periode ini.')), seg(topLoc && topLoc.mx >= 0 && topLoc.n ? topLoc.name : '', topLoc && topLoc.mx >= 0 && topLoc.n ? go(skk ? topLoc.w : 'own', topLoc.id) : null), seg(topLoc && topLoc.mx >= 0 && topLoc.n ? '.' : '')
    ] : skk ? [`],
  ["      (skk && lvl === 'nat') ? { m: '2,4×',", "      (!pFull && (lvl === 'nat' || !skk)) ? { m: String(ALL.n), tone: 'neu', t: 'Insiden pada periode ini', d: 'Kerugian ' + rp(ALL.r) + ' (perkiraan) · ' + PD.cap, go: nop }\n        : (skk && lvl === 'nat') ? { m: '2,4×',"],
  ["(skk && lvl === 'nat') ? { m: '48%'", "(skk && lvl === 'nat' && pFull) ? { m: '48%'"],
  ["{ m: (krUp >= 0 ? '▲ ' : '▼ ') + Math.abs(krUp) + '%', tone: krUp > 20 ? 'warn' : 'info', t: 'Kerawanan ' + (krUp >= 0 ? 'naik' : 'turun') + ' sejak Januari', d: 'Tanda awal: ' + KR[0] + ' → ' + KR[5] + ' per bulan', go: nop }",
    "(mI.length < 2 ? { m: String(krT), tone: 'info', t: 'Kerawanan pada periode ini', d: 'Perkiraan dari pola bulanan · ' + (PD ? PD.cap : ''), go: nop } : { m: (krUp >= 0 ? '▲ ' : '▼ ') + Math.abs(krUp) + '%', tone: krUp > 20 ? 'warn' : 'info', t: 'Kerawanan ' + (krUp >= 0 ? 'naik' : 'turun') + ' sejak ' + MOL[mI[0]], d: 'Tanda awal: ' + k0 + ' → ' + k1 + ' per bulan', go: nop })"],
  ['const krUp = KR[0] ? Math.round((KR[5] - KR[0]) / KR[0] * 100) : 0;', "const mI = [0, 1, 2, 3, 4, 5].filter((i) => moCov[i] > 0); const MOL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni']; const k0 = KR[mI[0]] || 0, k1 = KR[mI[mI.length - 1]] || 0;\n    const krUp = k0 ? Math.round((k1 - k0) / k0 * 100) : 0;"],
  ['const vN = baseN.map((v) => Math.round(v * Math.max(0, ALL.n - dttCnt) / (skk ? 106 : 24)));', 'const vN = pFull ? baseN.map((v) => Math.round(v * Math.max(0, ALL.n - dttCnt) / (skk ? 106 : 24))) : [0, 1, 2, 3, 4, 5].map((i) => incS.filter((r) => r[9] === i).length);\n    const rMo = pFull ? baseR.map((x) => Math.round(x * (ALL.r / (skk ? 1412 : 730)))) : vN.map((x) => Math.round(ALL.r * x / Math.max(1, sum(vN))));'],
  ['const vals = N ? vN : baseR.map((v) => Math.round(v * (ALL.r / (skk ? 1412 : 730))));', 'const vals = N ? vN : rMo;'],
  ['const tRp = baseR.map((x) => Math.round(x * (ALL.r / (skk ? 1412 : 730))));', 'const tRp = rMo;'],
  ['DTT[a.id] || 0', 'Math.round((DTT[a.id] || 0) * dttF)'],
  ['dN.map((v) => Math.round(v * dttCnt / 422))', 'dN.map((v, i) => Math.round(v * moCov[i] * dttCnt / Math.max(1, sum(dN.map((x, j) => x * moCov[j])))))'],
  ['for (let i = 1; i < 6; i++) { const d = vals[i] - vals[i - 1];', 'for (let i = 1; i < 6; i++) { if (!(moCov[i] > 0 && moCov[i - 1] > 0)) continue; const d = vals[i] - vals[i - 1];'],
  ['const curated = isNat || isOwn;', 'const curated = (isNat || isOwn) && pFull;'],
  ["0 0 0 4px var(--ink)' : 'none' }));", "0 0 0 4px var(--ink)' : 'none' })).filter((b) => moCov[b.bulan - 1] > 0);"],
  ["' · Semester I 2026' + (N && dttOn", "' · ' + PL + (N && dttOn"],
  ['let v = catScope(c);', 'let v = catScope(c); if (v != null && !pFull) v = Math.round(v * pShare);'],
  [String.raw`'\nSemester II 2025: '`, String.raw`'\n' + (pFull ? 'Semester II 2025' : 'Periode sebelumnya (perkiraan)') + ': '`],
  ['.map((v) => Math.round(v * fS));\n    const IN =', ".map((v, i) => pFull ? Math.round(v * fS) : Math.round(v / (skk ? [22, 14, 15, 17, 21, 17] : [3, 4, 3, 5, 5, 4])[i] * vN[i]));\n    const IN ="],
  ['[3, 4, 3, 5, 5, 4]).map((v) => Math.round(v * fS));', '[3, 4, 3, 5, 5, 4]).map((v, i) => pFull ? Math.round(v * fS) : vN[i]);'],
  ["(KR[i] / ikMax * 130).toFixed(1) + 'px' }));", "(KR[i] / ikMax * 130).toFixed(1) + 'px' })).filter((b, i) => moCov[i] > 0);"],
  ["' kerawanan').join('; ')", "' kerawanan').filter((x, i) => moCov[i] > 0).join('; ')"],
  ["subtitle: 'Semester I 2026 · data per", "subtitle: PL + ' · data per"],
  ["const aiCap = 'Semester I 2026 · '", "const aiCap = PL + ' · '"],
  ["' · Semester I 2026',", "' · ' + PL,"],
  ["'Angka demo. Batas wilayah", "(pFull ? '' : 'Jumlah insiden dihitung dari tanggal lapor; kerugian, jenis, kerawanan, dan DTT diskalakan (perkiraan). ') + 'Angka demo. Batas wilayah"],
  ["s.dtt, s.m].join('|')", "s.dtt, s.m, pFull ? '' : PD.from + PD.to].join('|')"],
  ['catN: CAT.length }', 'catN: CAT.length, per: pFull ? null : { from: PD.from, to: PD.to, label: PD.label } }'],
];

// Iterasi 2 (disetujui PM 25 Nov): tambahan di logika peta. Lihat CHANGELOG.md.
const LOGIC_PATCHES = [
  ['const k = Math.min(1000 / bw, 400 / bh);', "const mw = this.props.mapW || 1078; const fa = this.props.panelOpen === false ? 1 : Math.max(0.35, (mw - 376) / mw);\n    const k = Math.min(1000 * fa / bw, 400 / bh);"],
  ['500 / k', '500 * fa / k'],
  [/const lbls = [^\n]*\n/, () => "const lblAll = lvl !== 'area' ? [] : A.filter((a) => inArea(a) && (!loc || a.id === loc.id)).sort((p, q) => q.n - p.n);\n    const lbls = []; const taken = [];\n    lblAll.forEach((a) => { const t = (skk ? a.name + ' · ' : '') + a.wk; const w = t.length * 6.6; const px = ((a.x - cx) * k + 500 * fa) * mw / 1000, py = ((a.y + 40 / k - cy) * k + 200) * mw / 1000; const r = [px - w / 2 - 4, py, px + w / 2 + 4, py + 16]; if (taken.some((o) => r[0] < o[2] && r[2] > o[0] && r[1] < o[3] && r[3] > o[1])) return; taken.push(r); lbls.push({ x: pc(a.x), y: pcy(a.y + 40 / k), fs: (12 / k).toFixed(3) + 'px', t }); });\n"],
  ["x: pc(a.x), y: pcy(a.y), s: (sz / 10).toFixed(2) + '%', c: C,", "hid: lvl === 'nat' ? a.w : a.id, area: a, mxL: LV[a.mx][0], rpS: rp(a.rp), x: pc(a.x), y: pcy(a.y), s: (sz / 10).toFixed(2) + '%', c: C,"],
  ["const shown = order.slice(-60).reverse();", "const pool = INC.filter((r) => r[1] === loc.id); const used = new Set(); const pickInc = (li) => { const qi = pool.findIndex((q, i) => q[3] === li && !used.has(i)); if (qi < 0) return null; used.add(qi); const r = pool[qi]; return { id: r[0], t: r[7], st: ['Dalam penanganan', 'Menunggu penutupan', 'Ditutup'][r[4]], cat: CAT[r[2]] ? CAT[r[2]][0] : '', tgl: r[6], late: !!r[5], hari: r[8], area: loc.name, wk: loc.wk, kk: loc.kk }; };\n      const shown = order.slice(-60).reverse();"],
  ["c: LV[li][1], tip: LV[li][0] + ' · ' + st[2] };", "c: LV[li][1], tip: LV[li][0] + ' · ' + st[2], lvN: LV[li][0], site: st[2], inc: pickInc(li) };"],
  ["return { x: pc(W[w].pill[0]), y: pcy(W[w].pill[1]), n: W[w].n,", "return { hid: w, cnt: n, mxL: m < 0 ? 'Tidak ada' : LV[m][0], x: pc(W[w].pill[0]), y: pcy(W[w].pill[1]), n: W[w].n,"],
  ["return { n: W[r.w].n, go:", "return { hid: r.w, n: W[r.w].n, go:"],
  ["({ n: skk ? a.name : a.wk,", "({ hid: a.id, n: skk ? a.name : a.wk,"],
  ["'peta/", "'/peta/"],
  // E1: tooltip bar tren + bulan untuk klik
  ['const trend = vals.map((v, i) => ({ m: MO[i],', "const tRp = baseR.map((x) => Math.round(x * (ALL.r / (skk ? 1412 : 730))));\n    const trend = vals.map((v, i) => ({ bulan: i + 1, tip: MO[i] + ' 2026\\nJumlah: ' + (vN[i] + dv[i]) + ' insiden\\nKerugian: ' + rp(tRp[i]) + (i ? '\\nDari ' + MO[i - 1] + ': ' + (N ? ((vN[i] - vN[i - 1] >= 0 ? '+' : '') + (vN[i] - vN[i - 1]) + ' insiden') : ((tRp[i] - tRp[i - 1] >= 0 ? '+' : '−') + rp(Math.abs(tRp[i] - tRp[i - 1])))) : ''), m: MO[i],"],
  // E2: tooltip jenis insiden (kerugian per jenis = perkiraan proporsional, data per jenis tidak ada di desain)
  ['return { n: c.n, v: String(c.v),', "return { tip: c.n + '\\n' + c.v + ' insiden · ' + Math.round(c.v / ctot * 100) + '% dari jenis teratas\\nKerugian (perkiraan): ' + rp(ALL.r * c.v / ctot) + '\\nSemester II 2025: ' + c.prev + ' insiden', n: c.n, v: String(c.v),"],
  // E3: tooltip insiden dan kerawanan
  ['const ikBars = MO.map((m, i) => ({ m,', "const ikBars = MO.map((m, i) => ({ tip: m + ' 2026\\nInsiden: ' + IN[i] + '\\nKerawanan: ' + KR[i] + '\\nNaik jadi insiden: ' + Math.round(KR[i] * (skk ? 0.083 : 0.09)), m,"],
  // E4: kartu angka utama -> /insiden dengan filter
  ['    // ===== AI ringkasan =====', "    { const wq = skk && lvl !== 'nat' ? '&wilayah=' + z : ''; const TO = ['/insiden?status=terverifikasi' + wq, '/insiden?urut=kerugian' + wq, '/insiden?level=tinggi,kritis&status=terbuka' + wq, skk ? '/insiden?kkks=belum-melapor' + wq : '/insiden?status=lewat-tenggat']; kpis.forEach((kp, i) => { kp.to = TO[i]; }); }\n    // ===== AI ringkasan ====="],

  ["crumb, mapT, sites,", "crumb, mapT, sites, lvl, locId: loc ? loc.id : null, zKey: lvl + '|' + z + '|' + (loc ? loc.id : ''), goTo: (zz, ll) => this.setState({ z: zz, loc: ll || null }), goUp: zoomOut, fk: [s.z, s.loc, s.kat, s.lv.join(''), s.dtt, s.m].join('|'), mapK: k, mapFa: fa, mapMw: mw,"],
  // Iterasi 2b (25 Nov): semua provinsi bisa diklik -> wilayah tanpa peta detail (Kalsul, Pamalu) memakai peta dasar
  ["(lvl === 'area' ? '/peta/z-' + z + '.svg' : '')", "(lvl === 'area' && ['sbu', 'sbs', 'pst', 'jbn', 'own'].includes(z) ? '/peta/z-' + z + '.svg' : '')"],
  ["baseOp: lvl === 'nat' ? '1' : '0'", "baseOp: (lvl === 'nat' || !detSrc) ? '1' : '0'"],
  // Iterasi 2b: filter KKKS (dropdown)
  ['const A = A0.filter((a) => skk || a[7] === SEN)', 'const A = A0.filter((a) => (skk || a[7] === SEN) && (!s.kk || a[7] === s.kk))'],
  ["{ k: 'Wilayah', v: lvl === 'nat' ? 'Semua' : W[z].n }, { k: 'KKKS', v: 'Semua' }", "{ k: 'KKKS', v: s.kk ? s.kk.replace('PT ', '') : 'Semua' }, { k: 'Wilayah', v: lvl === 'nat' ? 'Semua' : W[z].n }"],
  ["    if (skk && lvl !== 'nat') af.push(", "    if (s.kk) af.push({ l: 'KKKS: ' + s.kk, clear: () => this.setState({ kk: null }) });\n    if (skk && lvl !== 'nat') af.push("],
  ['clearAll: () => this.setState({ kat: null,', 'clearAll: () => this.setState({ kk: null, kat: null,'],
  // Iterasi 2b: isi dropdown filter + jumlah insiden per area (kartu provinsi)
  ['goUp: zoomOut,', "goUp: zoomOut, areaN: Object.fromEntries(A.map((a) => [a.id, a.n])), fOpts: (() => {\n      const allA = A0.filter((a) => skk || a[7] === SEN);\n      const cnt = (f) => sum(A.filter(f).map((a) => a.n));\n      const katO = [{ n: 'Semua kategori', on: s.kat == null, go: () => this.setState({ kat: null }) }, ...CAT.map((c, i) => ({ n: c[0], on: s.kat === i, go: () => this.setState({ kat: i }) }))];\n      if (skk) {\n        const wO = [{ n: 'Semua wilayah', on: lvl === 'nat', go: () => this.setState({ z: 'nat', loc: null }) }, ...WO.map((w) => ({ n: W[w].n, sub: W[w].nr ? 'belum ada laporan' : cnt((a) => a.w === w) + ' insiden', on: lvl !== 'nat' && z === w, go: () => this.setState({ z: w, loc: null }) }))];\n        const kks = [...new Set(allA.map((a) => a[7]))].sort();\n        const kO = [{ n: 'Semua KKKS', on: !s.kk, go: () => this.setState({ kk: null }) }, ...kks.map((kn) => ({ n: kn, sub: allA.filter((a) => a[7] === kn).map((a) => a[8]).join(', '), on: s.kk === kn, go: () => this.setState({ kk: kn }) }))];\n        return [kO, wO, katO];\n      }\n      const wkO = [{ n: 'Semua wilayah kerja', on: !loc, go: () => this.setState({ z: 'own', loc: null }) }, ...A.map((a) => ({ n: a.wk, sub: a.name + ' · ' + a.n + ' insiden', on: !!loc && loc.id === a.id, go: () => this.setState({ z: 'own', loc: a.id }) }))];\n      return [wkO, katO];\n    })(),"],
  // Iterasi 2b: catatan kaki lebih pendek
  [/foot: 'Angka hanya mencakup.*?Jan–Jun 2026\.'/, () => "foot: 'Hanya insiden terverifikasi; draf tidak dihitung. ' + (skk ? 'DTT dihitung bila \"Hitung DTT\" aktif. Arsir = belum ada laporan, beda dengan 0 insiden. ' : '') + 'Angka demo. Batas wilayah: Kemendagri 2025 (MIT).'"],
  // Iterasi 3 (disetujui PM 25 Nov): mask lapisan peta memakai path absolut
  ['url(peta/', 'url(/peta/'],
  // Iterasi 3: area panas nasional 1,5x
  ["const base = lvl === 'nat' ? 26 : 70 / k;", "const base = lvl === 'nat' ? 39 : 70 / k;"],
  // Iterasi 3: hover area panas di tingkat wilayah menaikkan bidang WK yang sama ke 30%
  ["return { mask: 'url(/peta/wk-' + a.id + '.svg)', bg };", "return { id: a.id, mask: 'url(/peta/wk-' + a.id + '.svg)', bg, hov: a.n > 0 ? tint(LV[a.mx][1], 30) : 'rgba(142,146,157,.22)' };"],
  // Masukan PM setelah Iterasi 3: nasional kembali ke tampilan lama (tanpa bidang wilayah), keterangan ikut
  ["'Bidang = wilayah SKK, diwarnai level tertinggi. Area panas di lokasi insiden; makin pekat makin banyak.'", "'Area panas di lokasi insiden. Warna mengikuti level tertinggi di area itu; makin pekat makin banyak insiden.'"],
  // Tanya data (S6): filter aktif, cara memasang filter, sorotan bulan di Tren per bulan
  ['hasMk: i === mkI, ring: i === mkI ?', 'hasMk: i === mkI, ring: (s.hi || []).includes(i) || i === mkI ?'],
  ["aSaran: ak === 'saran',", "askK: ak, aSaran: ak === 'saran',"],
  ['    const SITES = {', '    const SITES = { ...EXTRA_SITES, '],
  ['goUp: zoomOut,', "goUp: zoomOut, askCtx: { skk, z: s.z, loc: s.loc, kat: s.kat, lv: s.lv, kk: s.kk || null, catN: CAT.length }, askApply: (patch) => this.setState(patch),"],
  // Tabel insiden (TabelDrill, board TD0–TD8) menggantikan matriks Kategori × wilayah: scripts/dashboard-tabel.mjs
  ...TABLE_LOGIC_PATCHES,
  ...PERIOD_PATCHES,
];

// Peta komponen ke ID bagian PRD §6a (S1..S19)
const HAND = new Set(['IncidentMap', 'MapStage', 'MapStrip', 'IncidentDrillTable']); // + MapPanel, FilterSelect (bukan hasil split)
const S_TAG = {
  AppBar: 'S1', KkksBanner: 'S2', FilterBar: 'S3', ActiveFilters: 'S4', KpiRow: 'S5', AiFindings: 'S6', ActionList: 'S7',
  IncidentMap: 'S8', MapStage: 'S8 (peta, zoom, lapisan)', MapStrip: 'S9-S11 (legenda, tabel wilayah)', TopCategories: 'S12',
  IncidentVsRisk: 'S13', TrendChart: 'S14', HandlingStatus: 'S15', IncidentDrillTable: 'S16 (Tabel insiden)', Footnote: 'S17',
};

const patches = {
  // Iterasi 2b: dropdown filter bisa dibuka
  FilterBar: [
    [/<button type="button" className="db-sel">[\s\S]*?<\/button>\s*<\/Fragment>\)\)\}/, '<FilterSelect f={f} opts={v.fOpts?.[k0] ?? []} /></Fragment>))}'],
  ],
  Footnote: [],
  // Iterasi 2 (disetujui PM 25 Nov)
  KpiRow: [
    [/<div className="p-kpi">/, '<div className="p-kpi db-kpi-link" data-flash="" role="link" tabIndex={0} onClick={(e) => { if (!(e.target as HTMLElement).closest("a")) v.ui?.go?.(k.to); }} onKeyDown={(e) => { if (e.key === "Enter") v.ui?.go?.(k.to); }}>'],
    [/<span className="k-val">\{k\.val\}<\/span>/, '<span className="k-val"><AnimNum text={k.val} /></span>'],
  ],
  AiFindings: [
    // Tanya data (board Dashboard-Tanya*): kolom bisa diketik, jawaban tampil di dalam kartu (bukan dropdown)
    [/<label className=\{`ask \$\{v\.askCls\}`\}>[\s\S]*?<\/label>/, '<AskField v={v} />'],

    [/<section className="db-ai c7"/, '<section data-flash="" className="db-ai c7"'],
    [/<div className="db-ins">/, '<div className="db-ins db-fade" key={v.fk}>'],
    [/\{g\.m\}<\/span>/, '<AnimNum text={g.m} /></span>'],
  ],
  HandlingStatus: [
    [/<section className="p-card c5">/, '<section data-flash="" className="p-card c5">'],
    [/<div style=\{\{ display: "flex", flexDirection: "column", marginTop: "10px" \}\}>/, '<div className="db-fade" key={v.fk} style={{ display: "flex", flexDirection: "column", marginTop: "10px" }}>'],
    [/<b>\{v\.v\}<\/b>/, '<b><AnimNum text={v.v} /></b>'],
  ],
  IncidentVsRisk: [
    [/<section className="p-card c6">/, '<section data-flash="" className="p-card c6">'],
    [/<b>\{v\.ikN\}<\/b>/, '<b><AnimNum text={v.ikN} /></b>'],
    [/<b>\{v\.ikK\}<\/b>/, '<b><AnimNum text={v.ikK} /></b>'],
    [/<div className="g">/g, '<div className="g" data-tip={b.tip}>'],
  ],
  TrendChart: [
    [/<div className="db-col">/, '<div className="db-col" data-tip={b.tip} role="link" tabIndex={0} onClick={() => v.ui?.go?.("/insiden?bulan=" + b.bulan)} onKeyDown={(e) => { if (e.key === "Enter") v.ui?.go?.("/insiden?bulan=" + b.bulan); }}>'],
  ],
  TopCategories: [
    [/className=\{\`db-tc \$\{c\.cls\}\`\} onClick=\{c\.go\}/, 'className={\`db-tc \${c.cls}\`} data-tip={c.tip} onClick={c.go}'],
  ],
  AppBar: [
    // Masukan PM 25 Nov: tombol periode bisa dibuka (PeriodSelect)
    [/<button type="button" className="p-input" aria-label="Periode"[\s\S]*?<\/button>/, '<PeriodSelect />'],
    // Menu Unduh: Laporan PDF membuka /laporan di tab baru; Data Excel mengunduh contoh-unduhan.xlsx (PRD §10 I2, I3)
    [/(<button type="button" role="menuitem" className="it" onClick=\{v\.toggleDl\}>)(<span className="fi pdf")/, '<button type="button" role="menuitem" className="it" onClick={() => { v.toggleDl(); window.open("/laporan", "_blank"); }}>$2'],
    [/(<button type="button" role="menuitem" className="it" onClick=\{v\.toggleDl\}>)(<span className="fi xls")/, '<button type="button" role="menuitem" className="it" onClick={() => { v.toggleDl(); downloadExcel(); }}>$2'],
  ],
  Sidebar: [
    [/<img src="logo-perisai\.png" alt="PERISAI" style=\{\{[^}]*\}\} \/>/, '<Logo />'],
  ],
};

function applyPatches(name, code) {
  let out = code;
  for (const [re, rep] of patches[name] ?? []) {
    if (!re.test(out)) console.warn(`PATCH tidak cocok: ${name} ${re}`);
    out = out.replace(re, rep);
  }
  return out;
}

function main() {
  /* Sidebar: di perisai-insiden-demo dipakai Sidebar aplikasi (src/components/layout/Sidebar.tsx), jadi tidak digenerate */
  if (false) {
    const html = read('Sidebar.dc.html');
    const { tpl, cls } = extractParts(html);
    portLogic(cls, 'SidebarLogic', path.join(ROOT, 'src/generated/SidebarLogic.ts'));
    const jsx = applyPatches('Sidebar', convertTemplate(tpl));
    write(
      path.join(ROOT, 'src/components/Sidebar.tsx'),
      `${HEADER}import { Fragment } from 'react';\nimport { useDC } from '@/dc/runtime';\nimport { routeHref } from '@/dc/route';\nimport { Logo } from './Logo';\nimport { SidebarLogic } from '@/generated/SidebarLogic';\n\n// S18\nexport interface SidebarProps { active?: string; user?: string; role?: string; taskCount?: number | string; h?: number | string; [k: string]: unknown }\n\nexport function Sidebar(props: SidebarProps) {\n  const v: any = useDC(SidebarLogic, props);\n  void routeHref;\n  return (\n    <>${pretty(jsx)}</>\n  );\n}\n`,
    );
  }

  /* Dashboard: dipecah per bagian (PRD §3: komponen per section) */
  {
    let html = read('Dashboard.dc.html');
    for (const [re, to] of SOURCE_PATCHES) {
      if (!re.test(html)) console.warn(`PATCH sumber tidak cocok: ${re}`);
      html = html.replace(re, to);
    }
    const { tpl, style, cls } = extractParts(html);
    // Aturan global desain (body, a, .lk-grid > .p-card.cN) dibatasi ke halaman dashboard (.db-page)
    // supaya tidak mengubah halaman lain di aplikasi.
    const scopedStyle = style.trim()
      .replace('body{margin:0}a{color:var(--ink)}', '.db-page a{color:var(--ink)}')
      .replace(/(^|,)\.lk-grid > /gm, '$1.db-page .lk-grid > ');
    write(path.join(ROOT, 'src/styles/dashboard.css'), scopedStyle + '\n');
    portLogic(cls, 'DashboardLogic', path.join(ROOT, 'src/generated/DashboardLogic.ts'), ['SEN', 'LV', 'W', 'A0', 'DTT', 'CAT', 'MO', 'INC'], LOGIC_PATCHES);
    const SPLITS = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/dashboard-splits.json'), 'utf8'));
    const comps = {};
    const jsx = convertTemplate(tpl, {
      splits: SPLITS,
      importName: (n) => (n === 'Sidebar' ? 'Sidebar' : n),
      onSplit: (name, code) => { comps[name] = code; },
    });
    for (const [name, code] of Object.entries(comps)) {
      if (HAND.has(name)) continue; // ditulis tangan sejak Iterasi 2
      const body = applyPatches(name, code);
      const nested = [...new Set([...body.matchAll(/<(\w+) v=\{v\} \/>/g)].map((m) => m[1]))].filter((n) => comps[n]);
      const nestedImports = nested.map((n) => `import { ${n} } from './${n}';\n`).join('');
      write(
        path.join(ROOT, `src/features/dashboard/components/${name}.tsx`),
        `${HEADER}import { Fragment } from 'react';\nimport { routeHref } from '@/dc/route';\nimport { downloadExcel } from '@/dc/download';\nimport { AnimNum } from '../anim';\n${name === 'FilterBar' ? "import { FilterSelect } from './FilterSelect';\n" : ''}${name === 'AppBar' ? "import { PeriodSelect } from './PeriodSelect';\n" : ''}${name === 'AiFindings' ? "import { AskField } from './AskField';\n" : ''}${nestedImports}\n// ${S_TAG[name] ?? ''}\nexport function ${name}({ v }: { v: any }) {\n  void routeHref; void downloadExcel; void Fragment; void AnimNum;\n  return (\n    <>${pretty(body)}</>\n  );\n}\n`,
      );
    }
    const topLevel = new Set(Object.values(SPLITS).filter((_, i) => Object.keys(SPLITS)[i].split('/').length <= 5));
    const imports = Object.keys(comps).filter((n) => topLevel.has(n)).map((n) => `import { ${n} } from './components/${n}';`).join('\n');
    write(
      path.join(ROOT, 'src/features/dashboard/DashboardView.tsx'),
      `${HEADER}import { Fragment } from 'react';\nimport { routeHref } from '@/dc/route';\nimport { Sidebar } from './DashSidebar';\n${imports}\n\n/** Kerangka halaman Dashboard; isi tiap bagian ada di ./components. \`v\` = hasil renderVals(). */\nexport function DashboardView({ v }: { v: any }) {\n  void routeHref; void Fragment;\n  return (\n    <>${pretty(jsx).replace('className="lk-app p-app"', 'className="lk-app p-app db-page"')}</>\n  );\n}\n`,
    );
  }

  /* Laporan PDF 1..5 */
  {
    let style = '';
    for (let n = 1; n <= 5; n++) {
      const html = read(`Dashboard-PDF${n}.dc.html`);
      const { tpl, style: st } = extractParts(html);
      style = st;
      const jsx = convertTemplate(tpl);
      write(
        path.join(ROOT, `src/features/laporan/Pdf${n}.tsx`),
        `${HEADER}export function Pdf${n}() {\n  return (\n    <>${pretty(jsx)}</>\n  );\n}\n`,
      );
    }
    // Gaya halaman PDF dibungkus .laporan-root supaya selektor global (.top, table, th, td) tidak mengubah dashboard.
    const scoped = style.split('\n').filter((l) => l.trim() && !/^body\{/.test(l.trim())).map((l) => {
      const i = l.indexOf('{');
      const sels = l.slice(0, i).split(',').map((x) => `.laporan-root ${x.trim()}`).join(',');
      return sels + l.slice(i);
    }).join('\n');
    write(path.join(ROOT, 'src/styles/laporan.css'), scoped + '\n');
  }
  console.log('selesai');
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1]?.endsWith('dc-to-tsx.mjs')) main();
