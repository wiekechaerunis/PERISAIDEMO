// @ts-nocheck
// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
import { DCLogic } from '@/dc/runtime';
import { SEN, LV, W, A0, DTT, CAT, MO, INC } from '@/data/dashboard';
import { EXTRA_SITES } from '@/data/dashboardExtra';
import { aggInc } from '@/analytics/incAgg';

export class DashboardLogic extends DCLogic {
  constructor(p) {
    super(p); p = p || {};
    const kk = p.peran === 'kkks';
    let z = p.zoom || 'nat', loc = null;
    if (z === 'loc') { z = kk ? 'own' : 'sbs'; loc = 'mub'; }
    else if (kk) z = 'own';
    if (p.statusTerbuka === '' ) p.statusTerbuka = null;
    this.state = { z, loc, lv: [1, 1, 1, 1, 1], dtt: !!p.dtt, kat: null, m: 'n', lvOpen: false, layOpen: false, lay: { wk: true, fas: true, adm: true }, dl: !!p.menuUnduh, stOpen: p.statusTerbuka == null ? null : Number(p.statusTerbuka), ask: p.tanya === true ? 'kkks' : (p.tanya || null), askAll: false };
  }
  renderVals() {
    const skk = (this.props.peran ?? 'skk') !== 'kkks';
    const s = this.state;
    const rp = (jt) => { if (!jt) return 'Rp0'; if (jt >= 1000) return 'Rp' + (jt / 1000).toFixed(2).replace('.', ',') + ' M'; return 'Rp' + Math.round(jt) + ' jt'; };
    const sum = (a) => a.reduce((x, y) => x + y, 0);
    const pc = (v) => (v / 10).toFixed(2) + '%';
    const pcy = (v) => (v / 4).toFixed(2) + '%';
    // Wilayah SKK: kotak zoom di koordinat peta 1000x400 (angka demo, pola rekap SKK Jan–Jun 2026)
    const WO = ['pst', 'sbu', 'sbs', 'kls', 'jbn', 'pml'];
    // Area insiden: [id, wilayah, nama, x, y, level SR..K, kerugian jt, KKKS, WK]
    // Lokasi area buatan sendiri per WK (koordinat peta). PRODUKSI: dari modul Wilayah kerja > Buat area sendiri.
    const SITES = { ...EXTRA_SITES, "ace": [[65.78, 43.31, "fas"], [65.64, 34.08, "sta"], [65.71, 38.7, "pipa"]], "lgk": [[79.8, 55.54, "fas"], [73.17, 57.87, "sta"], [76.49, 56.71, "pipa"]], "bkl": [[140.34, 107.49, "fas"], [148.02, 111.49, "sta"], [144.18, 109.49, "pipa"]], "sik": [[152.56, 114.56, "fas"], [153.36, 124.16, "sta"], [152.96, 119.36, "pipa"]], "mub": [[202.28, 190.45, "fas"], [188.64, 194.6, "sta"], [195.46, 192.53, "pipa"]], "bny": [[222.07, 188.94, "fas"], [217.44, 197.6, "sta"], [219.76, 193.27, "pipa"]], "mre": [[204.14, 213.91, "fas"], [197.37, 217.23, "sta"], [200.76, 215.57, "pipa"]], "tjb": [[202.98, 163.51, "fas"], [196.82, 162.7, "sta"], [199.9, 163.1, "pipa"]], "idm": [[292.67, 275.85, "fas"], [289.95, 273.19, "sta"], [291.31, 274.52, "pipa"]], "krw": [[272.19, 270.86, "fas"], [274.88, 272.35, "sta"], [273.53, 271.6, "pipa"]], "bjn": [[365.54, 290.04, "fas"], [368.18, 293.15, "sta"], [366.86, 291.59, "pipa"]], "grs": [[385.74, 289.68, "fas"], [383.17, 289.34, "sta"], [384.5, 281.0, "off"]]};
    // WK lain tanpa insiden pada periode ini (konteks di zoom wilayah, SKK saja). Cakupan = kecamatan terpilih (contoh).
    const WKX = [['x-oki', 'sbs', 'WK Komering Rawa'], ['x-mjb', 'sbs', 'WK Batang Hilir'], ['x-sbd', 'sbu', 'WK Bedagai Pesisir'], ['x-mer', 'sbu', 'WK Meranti Selat'], ['x-sbg', 'pst', 'WK Pantura Tengah'], ['x-tbn', 'jbn', 'WK Bengawan Utara']];
    // Kategori × wilayah (pola sheet WILAYAH rekap SKK, angka demo)
    const catIdx = s.kat == null ? -1 : s.kat;
    const dttOn = skk && s.dtt;
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
    // Pembanding = periode yang sama tahun lalu, ikut pilihan periode (masukan PM 26 Nov)
    const PCMP = 'vs ' + (PD ? PD.prev : 'Sem. I 2025'), PRVL = PD ? PD.prevLong : 'Semester I 2025';
    const wTot0 = {}; WO.forEach((w) => { wTot0[w] = sum(A0.filter((a) => a[1] === w).map((a) => sum(a[5]))); });
    // area setelah filter level, kategori, DTT
    // bagi bilangan bulat secara proporsional (largest remainder) supaya total tetap cocok
    const alloc = (tot, ws) => { const t = sum(ws); if (!t || !tot) return ws.map(() => 0); const raw = ws.map((w) => w * tot / t); const out = raw.map(Math.floor); let rest = tot - sum(out); raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (rest > 0 && ws[i] > 0) { out[i]++; rest--; } }); return out; };
    const catN = {};
    if (catIdx >= 0 && catIdx < CAT.length) {
      const c = CAT[catIdx];
      if (skk) WO.forEach((w) => { const bl = A0.filter((a) => a[1] === w); const al = alloc(c[1][w] || 0, bl.map((a) => sum(a[5]))); bl.forEach((a, i) => { catN[a[0]] = al[i]; }); });
      else A0.forEach((a) => { catN[a[0]] = c[2][a[0]] || 0; });
    }
    const A = A0.filter((a) => (skk || a[7] === SEN) && (!s.kk || a[7] === s.kk)).map((a) => {
      let lv = aggInc(INCP.filter((r) => r[1] === a[0] && (catIdx < 0 || catIdx >= CAT.length || r[2] === catIdx)), undefined, CAT.length).byLv;
      if (catIdx === CAT.length) lv = [0, 0, 0, 0, 0];
      if (dttOn && DTT[a[0]] && (catIdx < 0 || catIdx === CAT.length)) lv[0] += Math.round(DTT[a[0]] * dttF);
      lv = lv.map((v, i) => (s.lv[i] ? v : 0));
      const n = sum(lv); let mx = -1; lv.forEach((v, i) => { if (v > 0) mx = i; });
      const rpv = catIdx === CAT.length ? 0 : Math.round(a[6] * (sum(a[5]) ? Math.min(1, n / sum(a[5])) : 0));
      return { id: a[0], w: a[1], name: a[2], x: a[3], y: a[4], lv, n, mx, rp: rpv, kk: a[7], wk: a[8] };
    });
    const maxN = Math.max(1, ...A.map((a) => a.n));
    const lvMax = (lv) => { let m = -1; lv.forEach((v, i) => { if (v > 0) m = i; }); return m; };
    const sevOf = (m) => m < 0 ? { sn: 'Tidak ada', sc: 'var(--border-control)', sbg: 'var(--surface-subtle)', sink: 'var(--ink-muted)' } : { sn: LV[m][0], sc: LV[m][1], sbg: LV[m][2], sink: LV[m][3] };
    const addLv = (list) => [0, 1, 2, 3, 4].map((i) => sum(list.map((a) => a.lv[i])));

    const lvAllCnt = [0, 1, 2, 3, 4].map((i) => sum(A0.filter((a) => skk || a[7] === SEN).map((a) => pFull ? a[5][i] : INCP.filter((r) => r[1] === a[0] && r[3] === i).length)) + (i === 0 && dttOn ? Math.round(422 * dttF) : 0));
    // ===== zoom =====
    const z = s.z; const loc = s.loc ? A.find((a) => a.id === s.loc) : null;
    const own = A; // KKKS: hanya area milik sendiri
    let bb, lvl;
    if (loc) { bb = [loc.x - 16, loc.y - 9, loc.x + 16, loc.y + 9]; lvl = 'loc'; }
    else if (z === 'own') { bb = [172, 172, 242, 214]; lvl = 'area'; }
    else if (z !== 'nat') { bb = W[z].bb; lvl = 'area'; }
    else { bb = [0, 0, 1000, 400]; lvl = 'nat'; }
    const bw = bb[2] - bb[0], bh = bb[3] - bb[1];
    const mw = this.props.mapW || 1078; const fa = this.props.panelOpen === false ? 1 : Math.max(0.35, (mw - 376) / mw);
    const k = Math.min(1000 * fa / bw, 400 / bh);
    const cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2;
    const tx = 500 * fa / k - cx, ty = 200 / k - cy;
    const mapT = 'scale(' + k.toFixed(3) + ') translate(' + (tx / 10).toFixed(3) + '%, ' + (ty / 4).toFixed(3) + '%)';
    const detSrc = loc ? '/peta/l-' + loc.id + '.svg' : (lvl === 'area' && ['sbu', 'sbs', 'pst', 'jbn', 'own'].includes(z) ? '/peta/z-' + z + '.svg' : '');
    const det = { l: ((cx - 500 * fa / k) / 10).toFixed(3) + '%', t: ((cy - 200 / k) / 4).toFixed(3) + '%', w: (100 / k).toFixed(3) + '%', h: (100 / k).toFixed(3) + '%' };
    const go = (zz, ll) => () => this.setState({ z: zz, loc: ll || null });

    const inArea = (a) => lvl === 'nat' ? true : (z === 'own' ? true : a.w === z);
    const vis = A.filter((a) => a.n > 0 && (lvl === 'nat' || inArea(a)));
    const heat = lvl === 'loc' ? [] : vis.map((a) => {
      const r = Math.sqrt(a.n / maxN);
      const alpha = Math.round(30 + 60 * r);
      const C = LV[a.mx][1];
      const base = lvl === 'nat' ? 39 : 70 / k;
      const sz = base * (0.85 + 0.6 * r);
      return {
        hid: lvl === 'nat' ? a.w : a.id, area: a, mxL: LV[a.mx][0], rpS: rp(a.rp), x: pc(a.x), y: pcy(a.y), s: (sz / 10).toFixed(2) + '%', c: C,
        bg: 'radial-gradient(circle closest-side, color-mix(in srgb, ' + C + ' ' + alpha + '%, transparent) 0%, color-mix(in srgb, ' + C + ' ' + Math.round(alpha * 0.55) + '%, transparent) 55%, transparent 100%)',
        tip: a.name + ': ' + a.n + ' insiden, level tertinggi ' + LV[a.mx][0] + ', kerugian ' + rp(a.rp),
        go: lvl === 'nat' ? go(a.w) : go(z, a.id)
      };
    });
    const wks = []; const _wk = lvl === 'nat' ? [] : A.filter((a) => inArea(a) && (!loc || a.id === loc.id)).map((a) => ({ x: pc(a.x), y: pcy(a.y), w: (15 / k).toFixed(3) + '%', h: (27 / k).toFixed(3) + '%', bw: (1.5 / k).toFixed(3) + 'px' }));
    const lblAll = lvl !== 'area' ? [] : A.filter((a) => inArea(a) && (!loc || a.id === loc.id)).sort((p, q) => q.n - p.n);
    const lbls = []; const taken = [];
    lblAll.forEach((a) => { const t = (skk ? a.name + ' · ' : '') + a.wk; const w = t.length * 6.6; const px = ((a.x - cx) * k + 500 * fa) * mw / 1000, py = ((a.y + 40 / k - cy) * k + 200) * mw / 1000; const r = [px - w / 2 - 4, py, px + w / 2 + 4, py + 16]; if (taken.some((o) => r[0] < o[2] && r[2] > o[0] && r[1] < o[3] && r[3] > o[1])) return; taken.push(r); lbls.push({ x: pc(a.x), y: pcy(a.y + 40 / k), fs: (12 / k).toFixed(3) + 'px', t }); });
    // Titik insiden (zoom titik): dikelompokkan di 3 lokasi aset demo, digambar di ruang layar (tidak ikut di-scale)
    // PRODUKSI: posisi titik = koordinat yang diisi pelapor; nama aset dari master lokasi KKKS.
    let pts = [], sites = [];
    if (loc) {
      const x0 = cx - 500 * fa / k, y0 = cy - 200 / k;
      const sx = (x) => ((x - x0) * k / 10).toFixed(2) + '%', sy = (y) => ((y - y0) * k / 4).toFixed(2) + '%';
      const code = loc.id === 'mub' ? 'ADR' : loc.wk.replace('WK ', '').split(' ').map((w) => w[0]).join('').toUpperCase();
      const NM = { fas: 'Sumur ' + code + '-07', sta: 'Stasiun pengumpul ' + code, pipa: 'Jalur pipa ' + code + ' km 12', off: 'Anjungan lepas pantai ' + code };
      const SITE = SITES[loc.id].map((t) => [t[0] - loc.x, t[1] - loc.y, NM[t[2]], t[2]]);
      const order = []; loc.lv.forEach((v, i) => { for (let j = 0; j < v; j++) order.push(i); });
      const pool = INCP.filter((r) => r[1] === loc.id); const used = new Set(); const pickInc = (li) => { const qi = pool.findIndex((q, i) => q[3] === li && !used.has(i)); if (qi < 0) return null; used.add(qi); const r = pool[qi]; return { id: r[0], t: r[7], st: ['Dalam penanganan', 'Menunggu penutupan', 'Ditutup'][r[4]], cat: CAT[r[2]] ? CAT[r[2]][0] : '', tgl: r[6], late: !!r[5], hari: r[8], area: loc.name, wk: loc.wk, kk: loc.kk }; };
      const shown = order.slice(-60).reverse();
      pts = shown.map((li, i) => { const si = i % 5 < 2 ? 0 : (i % 5 < 4 ? 1 : 2); const st = SITE[si]; const ang = i * 2.39996, rr = 0.18 + 0.32 * ((i * 7) % 5) / 5; return { x: sx(loc.x + st[0] + Math.cos(ang) * rr), y: sy(loc.y + st[1] + Math.sin(ang) * rr * 0.8), c: LV[li][1], tip: LV[li][0] + ' · ' + st[2], lvN: LV[li][0], site: st[2], inc: pickInc(li) }; });
      const ICS = { fas: 'M12 2v20M8 6h8M7 22h10M9 10h6', sta: 'M3 21V9l9-6 9 6v12H3zM9 21v-6h6v6', pipa: 'M3 12h18M7 8v8M17 8v8', off: 'M4 20h16M6 20l2-8h8l2 8M12 12V4M9 7h6' };
      sites = s.lay.fas ? SITE.map((t) => ({ x: sx(loc.x + t[0]), y: ((loc.y + t[1] - y0 + 0.8) * k / 4).toFixed(2) + '%', n: t[2], ic: ICS[t[3]] })) : [];
    }
    // Bidang wilayah SKK (nasional) dan cakupan WK (zoom)
    const tint = (c, a) => 'color-mix(in srgb, ' + c + ' ' + a + '%, transparent)';
    const HATCH = 'repeating-linear-gradient(135deg, rgba(142,146,157,.24) 0 3px, transparent 3px 7px)';
    const regs = lvl === 'nat' ? WO.map((w) => {
      const m = lvMax(addLv(A.filter((a) => a.w === w)));
      return { mask: 'url(/peta/reg-' + w + '.svg)', bg: W[w].nr ? HATCH : (m < 0 ? 'rgba(142,146,157,.10)' : tint(LV[m][1], 16)) };
    }) : [];
    const wkm = (lvl === 'nat' || !s.lay.wk) ? [] : A.filter((a) => (z === 'own' || a.w === z)).map((a) => {
      const sel = loc && a.id === loc.id;
      const bg = a.n > 0 ? tint(LV[a.mx][1], loc ? (sel ? 12 : 5) : 18) : 'rgba(142,146,157,.10)';
      return { id: a.id, mask: 'url(/peta/wk-' + a.id + '.svg)', bg, hov: a.n > 0 ? tint(LV[a.mx][1], 30) : 'rgba(142,146,157,.22)' };
    }).concat(skk && !loc ? WKX.filter((x) => x[1] === z).map((x) => ({ mask: 'url(/peta/wk-' + x[0] + '.svg)', bg: 'rgba(142,146,157,.12)' })) : []);
    // pill wilayah (hanya tingkat nasional, SKK)
    const pills = (skk && lvl === 'nat') ? WO.map((w) => {
      const list = A.filter((a) => a.w === w); const n = sum(list.map((a) => a.n)); const m = lvMax(addLv(list));
      const nr = !!W[w].nr, none = !nr && n === 0;
      return { hid: w, cnt: n, mxL: m < 0 ? 'Tidak ada' : LV[m][0], x: pc(W[w].pill[0]), y: pcy(W[w].pill[1]), n: W[w].n, m: nr ? 'belum ada laporan' : (n ? n + ' insiden' : '0 insiden'), c: m < 0 ? 'var(--border-control)' : LV[m][1], cls: nr ? 'nr' : (none ? 'none' : ''), aria: W[w].n + ': ' + (nr ? 'belum ada laporan' : n + ' insiden'), go: (nr || none) ? () => {} : go(w) };
    }) : [];

    // ===== crumb =====
    const crumb = [];
    if (skk) crumb.push({ t: 'Indonesia', go: go('nat'), link: lvl !== 'nat', cur: lvl === 'nat' });
    if (!skk) crumb.push({ t: 'Wilayah kerja ' + SEN, go: go('own'), link: lvl === 'loc', cur: lvl !== 'loc' });
    if (skk && lvl !== 'nat') crumb.push({ t: W[z].n, go: go(z), link: lvl === 'loc', cur: lvl === 'area' });
    if (loc) crumb.push({ t: loc.wk + (skk ? ' · ' + loc.name : ''), go: () => {}, link: false, cur: true });
    const zoomOut = () => { if (loc) this.setState({ loc: null }); else if (skk && z !== 'nat') this.setState({ z: 'nat' }); };
    const outDis = (!loc && (!skk || z === 'nat')) ? 'true' : null;
    const hint = lvl === 'nat' ? 'Klik area panas atau nama wilayah untuk zoom' : (lvl === 'area' ? 'Klik WK untuk melihat titik insiden' : 'Titik = satu insiden, warna = level');

    // ===== strip =====
    const tot = (list) => ({ n: sum(list.map((a) => a.n)), r: sum(list.map((a) => a.rp)), lv: addLv(list) });
    const NAT = tot(A);
    const SC = loc ? [loc] : (lvl === 'nat' ? A : A.filter(inArea));
    const ALL = tot(SC);
    const scIds = SC.map((a) => a.id);
    const incS = INCP.filter((r) => scIds.includes(r[1]) && s.lv[r[3]] && (catIdx < 0 || catIdx === r[2]));
    // Kerugian per insiden: data demo belum punya kerugian per insiden, jadi kerugian area setelah filter (angka yang sama
    // dengan KPI Kerugian) dibagi rata ke insiden area itu. Disimpan per baris, bukan per nomor. PRODUKSI: dari data layer.
    const tdRp = new Map();
    { const cnt = {}; incS.forEach((r) => { cnt[r[1]] = (cnt[r[1]] || 0) + 1; }); const aRp = {}; SC.forEach((a) => { aRp[a.id] = a.rp; }); incS.forEach((r) => { tdRp.set(r, (aRp[r[1]] || 0) / cnt[r[1]]); }); }
    // Satu sumber (src/analytics/incAgg.ts): Tren per bulan, Insiden dan kerawanan, Status penanganan, Tabel insiden = incS.
    // Jenis terbanyak memakai cakupan yang sama tanpa filter Kategori (supaya jenis lain tetap terlihat).
    const AG = aggInc(incS, (r) => tdRp.get(r) || 0, CAT.length);
    const AGc = aggInc(INCP.filter((r) => scIds.includes(r[1]) && s.lv[r[3]]), undefined, CAT.length);
    const scAll = INC.filter((r) => scIds.includes(r[1])).length; const pShare = pFull ? 1 : (scAll ? INCP.filter((r) => scIds.includes(r[1])).length / scAll : 0);
    const stA = AG.byStatus;
    const incN = incS.length;
    const AREA = {}; A0.forEach((a) => { AREA[a[0]] = a; });
    const incRow = (r) => ({ id: r[0], t: r[7], d: AREA[r[1]][7].replace('PT ', '') + ' · ' + AREA[r[1]][8] + ' · lapor ' + r[6], ...sevOf(r[3]), x: r[5] ? 'Lewat tenggat' : (r[4] === 2 ? r[8] + ' hari' : 'Sesuai tenggat'), xc: r[5] ? 'late' : '', href: skk ? 'P31-DetailSKK.dc.html' : 'I15-Detail.dc.html' });
    const byPrio = (a, b) => b[5] - a[5] || b[3] - a[3];
    const lateList = incS.filter((r) => r[5]).sort(byPrio);
    const closed = incS.filter((r) => r[4] === 2).map((r) => r[8]).sort((a, b) => a - b);
    const med = closed.length ? (closed.length % 2 ? closed[(closed.length - 1) / 2] : (closed[closed.length / 2 - 1] + closed[closed.length / 2]) / 2) : 0;
    const lvStack = (lv) => { const t = sum(lv) || 1; return lv.map((v, i) => ({ w: (v / t * 100).toFixed(1) + '%', c: LV[i][1] })); };
    const lvAria = (lv) => lv.map((v, i) => v ? LV[i][0] + ' ' + v : '').filter(Boolean).join(' · ') || 'Tidak ada insiden';
    const wRowsRaw = WO.map((w) => { const list = A.filter((a) => a.w === w); return { w, ...tot(list) }; });
    const nMax = Math.max(1, ...wRowsRaw.map((r) => r.n)), rMax = Math.max(1, ...wRowsRaw.map((r) => r.r));
    const wRows = wRowsRaw.slice().sort((a, b) => b.n - a.n).map((r) => {
      const nr = !!W[r.w].nr; const sv = sevOf(lvMax(r.lv));
      const pN = NAT.n ? Math.round(r.n / NAT.n * 100) : 0, pR = NAT.r ? Math.round(r.r / NAT.r * 100) : 0;
      return { hid: r.w, n: W[r.w].n, go: (nr || !r.n) ? () => {} : go(r.w), cls: (nr || !r.n) ? 'mute' : '', note: nr ? 'Tidak ada laporan insiden maupun nihil' : (r.n ? '' : 'KKKS yang melapor menyatakan nihil'), nw: (r.n / nMax * 100).toFixed(1) + '%', nL: nr ? '–' : String(r.n), nP: nr ? '' : pN + '%', rw: (r.r / rMax * 100).toFixed(1) + '%', rL: nr ? '–' : rp(r.r), rP: nr ? '' : pR + '%', ...(nr ? { sn: 'Belum ada laporan', sc: 'var(--border-control)', sbg: 'var(--surface-subtle)', sink: 'var(--ink-muted)' } : sv), rep: W[r.w].rep + ' / ' + W[r.w].kk, repP: Math.round(W[r.w].rep / W[r.w].kk * 100) + '%', repW: (W[r.w].rep / W[r.w].kk * 100).toFixed(1) + '%' };
    });
    let aTitle = '', aN = '', aNs = '', aR = '', aRs = '', aLv = [], aLvAriaS = '', aCat = '', aCatS = '', subRows = [], subHead = '', aKkks = '', aWk = '', incs = [], incFoot = '', listHref = skk ? 'I31-DaftarSKK.dc.html' : 'Main.dc.html';
    if (lvl === 'area') {
      const list = A.filter(inArea); const T = tot(list);
      aTitle = skk ? 'Wilayah ' + W[z].n : 'Wilayah kerja Anda';
      aN = String(T.n); aNs = skk ? (NAT.n ? Math.round(T.n / NAT.n * 100) : 0) + '% dari nasional' : 'insiden terverifikasi';
      aR = rp(T.r); aRs = skk ? (NAT.r ? Math.round(T.r / NAT.r * 100) : 0) + '% dari kerugian nasional' : 'perkiraan + final';
      aLv = lvStack(T.lv); aLvAriaS = lvAria(T.lv);
      const cc = CAT.map((c, i) => [c[0], skk ? (c[1][z] || 0) : sum(Object.values(c[2]))]).sort((a, b) => b[1] - a[1])[0];
      aCat = cc[0]; aCatS = Math.round(cc[1] * pShare) + ' insiden pada periode ini' + (pFull ? '' : ' (perkiraan)');
      subHead = skk ? 'Lokasi · KKKS' : 'Wilayah kerja';
      const sm = Math.max(1, ...list.map((a) => a.n)), sr = Math.max(1, ...list.map((a) => a.rp));
      subRows = list.slice().sort((a, b) => b.n - a.n).map((a) => ({ hid: a.id, n: skk ? a.name : a.wk, sub: skk ? a.kk + ' · ' + a.wk : a.name, nw: (a.n / sm * 100).toFixed(1) + '%', nL: String(a.n), rw: (a.rp / sr * 100).toFixed(1) + '%', rL: rp(a.rp), ...sevOf(a.mx), go: go(z, a.id) }));
    }
    if (loc) {
      aTitle = loc.wk + ' · ' + loc.name; aN = String(loc.n); aNs = 'titik di peta = 1 insiden'; aR = rp(loc.rp); aRs = 'termasuk kerugian akhir saat ditutup';
      aLv = lvStack(loc.lv); aLvAriaS = lvAria(loc.lv); aKkks = loc.kk; aWk = loc.wk;
      const code = loc.kk === SEN ? 'SEN' : loc.kk.split(' ').slice(1).map((w) => w[0]).join('').slice(0, 3).toUpperCase();
      const T = [
        ['Pencurian kabel instrumen di ' + (loc.kk === SEN ? 'Sumur ADR-07' : 'area sumur ' + loc.name), 'Pencurian/Perampokan · 12 Jun 2026', 4, 'Dalam penanganan · lewat tenggat'],
        ['Pemotongan pipa alir untuk pengambilan minyak', 'Illegal tapping · 3 Jun 2026', 4, 'Dalam penanganan'],
        ['Penghadangan truk logistik di jalan akses', 'Penghentian kegiatan/operasi · 28 Mei 2026', 3, 'Menunggu penutupan'],
        ['Perusakan pagar area sumur', 'Perusakan material · 19 Mei 2026', 2, 'Ditutup']
      ];
      incs = T.filter((t) => s.lv[t[2]] && inPd(t[1].split(' · ')[1].replace(' 2026', ''))).map((t, i) => ({ id: 'INS-' + code + '-2026-00' + (41 - i * 3), t: t[0], d: t[1], ...sevOf(t[2]), st: t[3], href: skk ? 'P31-DetailSKK.dc.html' : 'I15-Detail.dc.html' }));
      incFoot = 'Menampilkan ' + incs.length + ' dari ' + loc.n + ' insiden, diurutkan dari level tertinggi. Titik dengan lokasi rahasia tidak digambar, tetap dihitung.';
    }

    // ===== KPI =====
    const isNat = skk && lvl === 'nat', isOwn = !skk && !loc;
    const prevN0 = isNat ? (dttOn ? 455 : 92) : (isOwn ? 21 : Math.max(1, Math.round(ALL.n * 0.86))), prevR0 = isNat ? 1100 : (isOwn ? 600 : Math.max(1, Math.round(ALL.r * 0.78)));
    const prevN = (pFull || !(isNat || isOwn)) ? prevN0 : Math.max(1, Math.round(prevN0 * pShare)), prevR = (pFull || !(isNat || isOwn)) ? prevR0 : Math.max(1, Math.round(prevR0 * pShare));
    const tk = ALL.lv[3] + ALL.lv[4];
    const up = (a, b) => (a === 0 && b <= 1) ? 'tetap' : (a >= b ? '▲ ' : '▼ ') + Math.abs(Math.round((a - b) / b * 100)) + '%';
    const kpis = [
      { label: 'Insiden terverifikasi', val: String(ALL.n), unit: 'insiden', tr: up(ALL.n, prevN), trCls: ALL.n > prevN ? 'tr-bad' : 'tr-good', cmp: PCMP + ' (' + prevN + ')', link: 'Lihat daftar', href: listHref },
      { label: 'Kerugian', val: rp(ALL.r), unit: '', tr: up(ALL.r, prevR), trCls: ALL.r > prevR ? 'tr-bad' : 'tr-good', cmp: PCMP + ' (' + rp(prevR) + ')', link: 'Rincian per wilayah', href: '#' },
      { label: 'Tinggi & Kritis', val: String(tk), unit: 'insiden', tr: incS.filter((r) => r[3] >= 3 && r[4] < 2).length + ' masih terbuka', trCls: 'tr-bad', cmp: 'sisanya sudah ditutup', link: 'Lihat yang terbuka', href: listHref },
      skk ? { label: 'KKKS melapor (Jun 2026)', val: String(lvl === 'nat' ? 14 : W[z].rep), unit: 'dari ' + (lvl === 'nat' ? 131 : W[z].kk) + ' KKKS', tr: '7–14 per bulan', trCls: 'tr-flat', cmp: 'mengirim laporan insiden atau kerawanan', link: 'Lihat per KKKS', href: '#' }
          : { label: 'Median lama penanganan', val: String(med).replace('.', ','), unit: 'hari', tr: '▼ 1 hari', trCls: 'tr-good', cmp: PCMP + ' (' + String(med + 1).replace('.', ',') + ' hari)', link: 'Lihat yang lewat tenggat', href: listHref }
    ];

    { const wq = skk && lvl !== 'nat' ? '&wilayah=' + z : ''; const TO = ['/insiden?status=terverifikasi' + wq, '/insiden?urut=kerugian' + wq, '/insiden?level=tinggi,kritis&status=terbuka' + wq, skk ? '/insiden?kkks=belum-melapor' + wq : '/insiden?status=lewat-tenggat']; kpis.forEach((kp, i) => { kp.to = TO[i]; }); }
    // ===== AI ringkasan =====
    const chgTo = (a, b) => a === b ? 'sama dengan' : (a > b ? 'naik ' : 'turun ') + Math.abs(Math.round((a - b) / Math.max(1, b) * 100)) + '% dari';
    const seg = (t, g) => ({ t, plain: !g, act: !!g, go: g || (() => {}) });
    const topLoc = SC.slice().sort((a, b) => b.mx - a.mx || b.n - a.n)[0];
    const catScope = (c) => skk ? (loc ? null : (lvl === 'nat' ? sum(Object.values(c[1])) : (c[1][z] || 0))) : (loc ? (c[2][loc.id] || 0) : sum(Object.values(c[2])));
    const aiZoom = (skk && lvl !== 'nat') ? [
      seg('Di ' + (loc ? loc.name + ' (' + loc.wk + ')' : 'wilayah ' + W[z].n) + ' tercatat ' + ALL.n + ' insiden dengan kerugian ' + rp(ALL.r) + ', atau ' + (NAT.n ? Math.round(ALL.n / NAT.n * 100) : 0) + '% insiden dan ' + (NAT.r ? Math.round(ALL.r / NAT.r * 100) : 0) + '% kerugian nasional. '),
      seg(topLoc && topLoc.mx >= 0 ? 'Level tertinggi ' + LV[topLoc.mx][0] + ' ada di ' : ''), seg(topLoc && topLoc.mx >= 0 ? topLoc.name : '', topLoc && !loc ? go(z, topLoc.id) : null), seg('. '),
      seg(loc ? 'Lokasi ini berada di wilayah kerja ' + loc.kk + '.' : 'Jenis terbanyak: ' + CAT.map((c) => [c[0], c[1][z] || 0]).sort((a, b) => b[1] - a[1])[0][0] + '.')
    ] : null;
    const aiSeg = aiZoom ? aiZoom : !pFull ? [
      seg(PD.text + ' mencatat ' + ALL.n + ' insiden terverifikasi, ' + chgTo(ALL.n, prevN) + ' ' + PRVL + ' (' + prevN + '), dengan kerugian ' + rp(ALL.r) + ' (perkiraan). '),
      seg(topLoc && topLoc.mx >= 0 && topLoc.n ? 'Level tertinggi ' + LV[topLoc.mx][0] + ' ada di ' : (ALL.n ? '' : 'Tidak ada insiden terverifikasi pada periode ini.')), seg(topLoc && topLoc.mx >= 0 && topLoc.n ? topLoc.name : '', topLoc && topLoc.mx >= 0 && topLoc.n ? go(skk ? topLoc.w : 'own', topLoc.id) : null), seg(topLoc && topLoc.mx >= 0 && topLoc.n ? '.' : '')
    ] : skk ? [
      seg(PL + ' mencatat ' + ALL.n + ' insiden terverifikasi dengan kerugian ' + rp(ALL.r) + (dttOn ? ', termasuk 422 kasus DTT di Jabanusa. ' : ', ' + chgTo(ALL.n, prevN) + ' ' + PRVL + ' (' + prevN + '). ')),
      seg('Sumbagsel', go('sbs')), seg(' menyumbang 63% kerugian walau hanya 36% insiden; kedua insiden Kritis ada di '), seg('Musi Banyuasin', go('sbs', 'mub')), seg('. '),
      seg('Pencurian/Perampokan tetap kategori terbanyak (80), terutama di '), seg('Sumbagut', go('sbu')), seg('. '),
      seg('Pamalu belum mengirim laporan apa pun, jadi angka 0 di wilayah itu belum bisa dibaca sebagai aman.')
    ] : [
      seg(PL + ' organisasi Anda mencatat ' + NAT.n + ' insiden dengan kerugian ' + rp(NAT.r) + ', ' + chgTo(NAT.n, prevN) + ' ' + PRVL + ' (' + prevN + '). '),
      seg('WK Andalas Darat', go('own', 'mub')), seg(' menyumbang dua pertiga insiden, termasuk kedua insiden Kritis. '),
      seg('Pencurian/Perampokan masih terbanyak (13). Satu insiden Kritis sudah lewat tenggat penanganan.')
    ];

    // ===== perlu perhatian =====
    const IC = { c: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01', w: 'M12 8v4l3 2M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z', a: 'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z' };
    const attn = (skk ? [
      { k: 'c', t: '2 insiden Kritis belum selesai', d: 'Musi Banyuasin · 1 lewat tenggat 3 hari', go: go('sbs', 'mub') },
      (() => { const hl = INC.filter((r) => r[3] === 3 && r[5]); const by = {}; hl.forEach((r) => { const w = W[AREA[r[1]][1]].n; by[w] = (by[w] || 0) + 1; }); return { k: 'w', t: hl.length + ' insiden Tinggi lewat tenggat', d: Object.entries(by).map(([w, n]) => w + ' ' + n).join(' · '), go: () => this.setState({ stOpen: 3 }) }; })(),
      { k: 'w', t: 'Pamalu belum melapor', d: '0 dari 12 KKKS sejak Jan 2026', go: () => {} },
      { k: 'a', t: 'Lokasi berulang di Langkat', d: '17 insiden dalam 6 bulan', go: go('sbu', 'lgk') }
    ] : [
      { k: 'c', t: '1 insiden Kritis lewat tenggat', d: 'INS-SEN-2026-0041 · Sumur ADR-07', go: go('own', 'mub') },
      { k: 'w', t: '2 laporan belum diperiksa', d: 'Lebih dari 3 hari · belum masuk angka', go: () => {} },
      { k: 'a', t: 'Lokasi berulang: Sumur ADR-07', d: '4 insiden dalam 90 hari', go: go('own', 'mub') }
    ]).map((a) => ({ ...a, ic: IC[a.k] }));

    // ===== tren =====
    const baseN = skk ? [22, 14, 15, 17, 21, 17] : [3, 4, 3, 5, 5, 4];
    const dN = [35, 27, 70, 122, 66, 102];
    const baseR = skk ? [180, 95, 310, 240, 402, 185] : [60, 45, 160, 110, 240, 115];
    const N = s.m === 'n';
    const dttCnt = (dttOn && s.lv[0] && (catIdx < 0 || catIdx === CAT.length)) ? sum(SC.map((a) => Math.round((DTT[a.id] || 0) * dttF))) : 0;
    const vN = AG.byMonth.slice();
    const rMo = AG.byMonthRp.map((x) => Math.round(x));
    const vals = N ? vN : rMo;
    const dv = (N && dttCnt) ? dN.map((v, i) => Math.round(v * moCov[i] * dttCnt / Math.max(1, sum(dN.map((x, j) => x * moCov[j]))))) : [0, 0, 0, 0, 0, 0];
    const mx = Math.max(1, ...vals.map((v, i) => v + dv[i]));
    const curated = false;
    let gI = 1, gD = -1e9; for (let i = 1; i < 6; i++) { if (!(moCov[i] > 0 && moCov[i - 1] > 0)) continue; const d = vals[i] - vals[i - 1]; if (d > gD) { gD = d; gI = i; } }
    const mkI = curated ? ((!skk && N) ? 3 : 4) : (gD > 0 ? gI : -1);
    const NOTE = !curated ? (gD > 0 ? [MO[gI] + ': ' + (N ? 'insiden' : 'kerugian') + ' naik dari ' + (N ? vals[gI - 1] : rp(vals[gI - 1])) + ' jadi ' + (N ? vals[gI] : rp(vals[gI])) + '.', 'Kenaikan terbesar dalam periode ini untuk area yang sedang dilihat.'] : ['Tidak ada kenaikan berarti.', 'Angka stabil atau turun sepanjang periode.']) : skk ? (N ? ['Mei: insiden naik 24% dari April (17 → 21).', 'Kenaikan terbesar di Sumbagsel (+3), kebanyakan Pencurian/Perampokan.'] : ['Mei: kerugian naik 1,7× dari April (Rp240 jt → Rp402 jt).', 'Penyumbang terbesar Illegal tapping di Sumbagsel.'])
      : (N ? ['April: insiden naik dari 3 jadi 5.', 'Dua di antaranya di Sumur ADR-07, WK Andalas Darat.'] : ['Mei: kerugian naik 2,2× dari April (Rp110 jt → Rp240 jt).', 'Hampir semuanya dari satu insiden Kritis di WK Andalas Darat.']);
    const tRp = rMo;
    const trend = vals.map((v, i) => ({ bulan: i + 1, tip: MO[i] + ' 2026\nJumlah: ' + (vN[i] + dv[i]) + ' insiden\nKerugian: ' + rp(tRp[i]) + (i ? '\nDari ' + MO[i - 1] + ': ' + (N ? ((vN[i] - vN[i - 1] >= 0 ? '+' : '') + (vN[i] - vN[i - 1]) + ' insiden') : ((tRp[i] - tRp[i - 1] >= 0 ? '+' : '−') + rp(Math.abs(tRp[i] - tRp[i - 1])))) : ''), m: MO[i], lbl: N ? String(v + dv[i]) : rp(v), h: (v / mx * 150).toFixed(1) + 'px', hd: (dv[i] / mx * 150).toFixed(1) + 'px', hasD: dv[i] > 0, c: N ? 'var(--chart-series-1)' : 'var(--action-line)', hasMk: i === mkI, ring: (s.hi || []).includes(i) || i === mkI ? '0 0 0 2px var(--surface), 0 0 0 4px var(--ink)' : 'none' })).filter((b) => moCov[b.bulan - 1] > 0);

    // ===== jenis terbanyak =====
    const PREVF = [0.78, 1.3, 0.7, 0.5, 1.2, 1, 1];
    let cats = CAT.map((c, i) => {
      const v = AGc.byCat[i];
      return { i, n: c[0], v, prev: Math.round(v * PREVF[i]) };
    });
    const dttScope = (dttOn && s.lv[0]) ? sum(SC.map((a) => Math.round((DTT[a.id] || 0) * dttF))) : 0;
    if (dttScope) cats.push({ i: CAT.length, n: 'Daerah Terbatas Terlarang', v: dttScope, prev: Math.round(dttScope * 0.9), dtt: true });
    cats = cats.filter((c) => c.v > 0).sort((a, b) => b.v - a.v).slice(0, 6);
    const ctot = sum(cats.map((c) => c.v)) || 1, cmax = Math.max(1, ...cats.map((c) => c.v));
    const topCat = cats.map((c) => { const d = c.v - c.prev; return { tip: c.n + '\n' + c.v + ' insiden · ' + Math.round(c.v / ctot * 100) + '% dari jenis teratas\nKerugian (perkiraan): ' + rp(ALL.r * c.v / ctot) + '\n' + PRVL + (pFull ? '' : ' (perkiraan)') + ': ' + c.prev + ' insiden', n: c.n, v: String(c.v), w: (c.v / cmax * 100).toFixed(1) + '%', p: Math.round(c.v / ctot * 100) + '%', d: d > 0 ? '▲ ' + d : (d < 0 ? '▼ ' + (-d) : 'tetap'), dc: d > 0 ? 'up' : (d < 0 ? 'dn' : 'eq'), cls: (c.dtt ? 'dtt ' : '') + (s.kat === c.i ? 'sel' : ''), aria: c.n + ': ' + c.v + ' insiden', go: () => this.setState({ kat: s.kat === c.i ? null : c.i }) }; });
    const catCap = (loc ? loc.name : (skk ? (lvl === 'nat' ? 'Semua wilayah' : 'Wilayah ' + W[z].n) : 'Wilayah kerja Anda')) + ' · ' + (cats.length ? cats.length + ' jenis teratas' : 'tidak ada insiden');
    // ===== insiden vs kerawanan =====
    const IN0 = skk ? [22, 14, 15, 17, 21, 17] : [3, 4, 3, 5, 5, 4];
    const KR = (skk ? [31, 28, 35, 40, 38, 44] : [4, 5, 6, 5, 7, 6]).map((v, i) => Math.round(v / IN0[i] * vN[i]));
    const IN = vN.slice();
    const ikMax = Math.max(1, ...KR, ...IN);
    const ikBars = MO.map((m, i) => ({ tip: m + ' 2026\nInsiden: ' + IN[i] + '\nKerawanan: ' + KR[i] + '\nNaik jadi insiden: ' + Math.round(KR[i] * (skk ? 0.083 : 0.09)), m, hn: (IN[i] / ikMax * 130).toFixed(1) + 'px', hk: (KR[i] / ikMax * 130).toFixed(1) + 'px' })).filter((b, i) => moCov[i] > 0);
    const krT = sum(KR), inT = sum(IN), upN = Math.round(krT * (skk ? 0.083 : 0.09));
    // ===== status penanganan =====
    const stDef = [['Dalam penanganan', 'var(--chart-series-1)'], ['Menunggu penutupan', 'var(--sev-medium-dot)'], ['Ditutup', 'var(--status-success-ink)']];
    const st = stDef.map((d, i) => { const op = s.stOpen === i; const list = incS.filter((r) => r[4] === i).sort(byPrio); return { n: d[0], c: d[1], v: String(stA[i]), w: (incN ? stA[i] / incN * 100 : 0).toFixed(1) + '%', p: (incN ? Math.round(stA[i] / incN * 100) : 0) + '%', open: op, openStr: op ? 'true' : 'false', rot: op ? 'rotate(90deg)' : 'none', go: () => this.setState({ stOpen: op ? null : i }), items: list.slice(0, 5).map(incRow), more: list.length > 5 ? 'Lihat semua ' + list.length + ' di Daftar insiden →' : 'Buka di Daftar insiden →' }; });
    if (s.stOpen === 3) { st.push({ n: 'Lewat tenggat', c: 'var(--sev-critical-dot)', v: String(lateList.length), w: '0%', p: '', open: true, openStr: 'true', rot: 'rotate(90deg)', go: () => this.setState({ stOpen: null }), items: lateList.slice(0, 5).map(incRow), more: 'Buka di Daftar insiden →' }); }
    const stBar = st.slice(0, 3);
    // ===== temuan AI (pola, bukan tindakan) =====
    const nop = () => {};
    // ===== Tanya data: jawaban menggantikan isi kartu Temuan AI (4 pertanyaan demo) =====
    const ak = s.ask || '';
    const askOn = !!ak;
    const QS = [['kritis', skk ? 'insiden Kritis di Sumbagsel bulan Juni' : 'insiden Kritis bulan Juni', 'daftar'], ['kkks', skk ? 'KKKS dengan kerugian terbesar' : 'WK dengan kerugian terbesar', 'peringkat'], ['banding', 'pencurian Maret vs Juni', 'perbandingan'], ['telat', 'insiden lewat tenggat', 'daftar']];
    const qOf = (k) => (QS.find((q) => q[0] === k) || [k, 'kebakaran kilang bulan depan'])[1];
    const pick = (k) => () => this.setState({ ask: k, askAll: false });
    const sugs = QS.map(([k, l, kind]) => ({ l, k: kind, go: pick(k) }));
    const res = ['kkks', 'kritis', 'banding', 'telat'].includes(ak);
    const askScopeL = loc ? loc.name : (skk ? (lvl === 'nat' ? 'Seluruh wilayah' : W[z].n) : 'Wilayah kerja Anda');
    const mine = (r) => skk || AREA[r[1]][7] === SEN;
    // peringkat KKKS/WK
    const askBase = loc ? A.filter((a) => a.id === loc.id) : (skk && lvl !== 'nat' ? A.filter((a) => a.w === z) : A);
    const agg = {}, top = {};
    askBase.forEach((a) => { const k = skk ? a.kk : a.wk; agg[k] = (agg[k] || 0) + a.rp; if (!top[k] || a.rp > top[k].rp) top[k] = a; });
    const aRows = Object.entries(agg).filter((r) => r[1] > 0).sort((a, b) => b[1] - a[1]);
    const aTot = sum(aRows.map((r) => r[1])) || 1, aMax = aRows.length ? aRows[0][1] : 1;
    const ansRows = aRows.slice(0, s.askAll ? 99 : 4).map(([k, v], i) => ({ no: String(i + 1), name: k.replace(/^PT /, ''), v: rp(v), p: Math.round(v / aTot * 100) + '% dari total', w: (v / aMax * 100).toFixed(1) + '%', go: skk ? go(top[k].w, top[k].id) : go(z, top[k].id) }));
    // daftar insiden
    const stName = (r) => r[5] ? 'Lewat tenggat' : stDef[r[4]][0];
    const kritL = INC.filter((r) => mine(r) && r[3] === 4 && r[9] === 5 && (!skk || AREA[r[1]][1] === 'sbs'));
    const kritMei = INC.filter((r) => mine(r) && r[3] === 4 && r[9] === 4 && (!skk || AREA[r[1]][1] === 'sbs')).length;
    const lateA = lateList;
    const lSrc = ak === 'kritis' ? kritL : lateA;
    const lRows = lSrc.slice(0, s.askAll ? 99 : 4).map((r) => ({ ...incRow(r), x: stName(r), xc: r[5] ? 'late' : '' }));
    const lateBy = {}; lateA.forEach((r) => { const w = skk ? W[AREA[r[1]][1]].n : AREA[r[1]][8]; lateBy[w] = (lateBy[w] || 0) + 1; });
    // perbandingan pencurian per bulan
    const pcI = INC.filter((r) => mine(r) && r[2] === 0);
    const perM = [0, 1, 2, 3, 4, 5].map((m) => pcI.filter((r) => r[9] === m).length);
    const cMax = Math.max(1, ...perM);
    const dlt = (a, b) => b === a ? { t: 'tetap', cls: 'eq' } : { t: (b > a ? '▲ ' : '▼ ') + Math.abs(Math.round((b - a) / (a || 1) * 100)) + '%', cls: b > a ? 'up' : 'dn' };
    const cRows = (skk ? WO.map((w) => [W[w].n, (r) => AREA[r[1]][1] === w]) : A0.filter((a) => a[7] === SEN).map((a) => [a[8], (r) => r[1] === a[0]])).map(([n, f]) => { const x = pcI.filter((r) => r[9] === 2 && f(r)).length, y = pcI.filter((r) => r[9] === 5 && f(r)).length; return { n, a: String(x), b: String(y), ...(() => { const d = y - x; return { d: d === 0 ? '0' : (d > 0 ? '+' : '−') + Math.abs(d), cls: d > 0 ? 'up' : (d < 0 ? 'dn' : 'eq') }; })(), s: Math.abs(y - x) }; }).filter((r) => r.a !== '0' || r.b !== '0').sort((p, q) => q.s - p.s).slice(0, 3);
    const CHIPS = { kkks: [skk ? 'Per KKKS' : 'Per WK', 'Kerugian terbesar', askScopeL, pFull ? PL : PD.label], kritis: ['Level Kritis', skk ? 'Wilayah Sumbagsel' : 'Wilayah kerja Anda', 'Juni 2026'], banding: ['Pencurian/Perampokan', 'Maret vs Juni 2026', skk ? 'Seluruh wilayah' : 'Wilayah kerja Anda'], telat: ['Lewat tenggat', 'Belum ditutup', askScopeL] };
    const nAll = ak === 'kkks' ? aRows.length : (ak === 'kritis' || ak === 'telat' ? lSrc.length : 0);
    const c0 = cats[0];
    const pctN = NAT.n ? Math.round(ALL.n / NAT.n * 100) : 0, pctR = NAT.r ? Math.round(ALL.r / NAT.r * 100) : 0;
    const mI = [0, 1, 2, 3, 4, 5].filter((i) => moCov[i] > 0); const MOL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni']; const k0 = KR[mI[0]] || 0, k1 = KR[mI[mI.length - 1]] || 0;
    const krUp = k0 ? Math.round((k1 - k0) / k0 * 100) : 0;
    const topA = SC.slice().sort((x, y) => y.n - x.n)[0];
    const ins = [
      (!pFull && (lvl === 'nat' || !skk)) ? { m: String(ALL.n), tone: 'neu', t: 'Insiden pada periode ini', d: 'Kerugian ' + rp(ALL.r) + ' (perkiraan) · ' + PD.cap, go: nop }
        : (skk && lvl === 'nat') ? { m: '2,4×', tone: 'bad', t: 'Kerugian Sumbagsel melonjak', d: 'Rp370 jt → Rp891 jt · 63% kerugian nasional dari 36% insiden', go: go('sbs') }
        : (skk ? { m: pctR + '%', tone: 'warn', t: 'Porsi dari kerugian nasional', d: 'Dari ' + pctN + '% jumlah insiden nasional', go: nop }
        : { m: '63%', tone: 'warn', t: 'Insiden terpusat di WK Andalas Darat', d: '15 dari 24 insiden, termasuk 2 Kritis', go: go('own', 'mub') }),
      (skk && lvl === 'nat' && pFull) ? { m: '48%', tone: 'warn', t: 'Sumbagut paling sering terjadi insiden', d: '51 insiden, hampir semua Pencurian/Perampokan', go: go('sbu') }
        : ((skk && !loc && topA) ? { m: String(topA.n), tone: topA.mx >= 4 ? 'bad' : 'warn', t: topA.name + ' paling banyak insiden', d: 'Level tertinggi ' + (topA.mx >= 0 ? LV[topA.mx][0] : '-') + ' · ' + topA.wk, go: go(z, topA.id) } : null),
      c0 ? { m: String(c0.v), tone: 'neu', t: c0.n + ' jenis terbanyak', d: Math.round(c0.v / Math.max(1, ALL.n) * 100) + '% dari insiden pada periode ini', go: () => this.setState({ kat: c0.i }) } : null,
      (mI.length < 2 ? { m: String(krT), tone: 'info', t: 'Kerawanan pada periode ini', d: 'Perkiraan dari pola bulanan · ' + (PD ? PD.cap : ''), go: nop } : { m: (krUp >= 0 ? '▲ ' : '▼ ') + Math.abs(krUp) + '%', tone: krUp > 20 ? 'warn' : 'info', t: 'Kerawanan ' + (krUp >= 0 ? 'naik' : 'turun') + ' sejak ' + MOL[mI[0]], d: 'Tanda awal: ' + k0 + ' → ' + k1 + ' per bulan', go: nop })
    ].filter(Boolean);
    const aiCap = PL + ' · ' + (loc ? loc.name : (skk ? (lvl === 'nat' ? 'seluruh wilayah' : W[z].n) : 'wilayah kerja Anda')) + ' · data 25 Nov 2026';
    // ===== Tabel insiden (TabelDrill): insiden dalam cakupan filter halaman, untuk src/analytics/tabelDrill.ts =====
    const tdInc = incS.map((r) => { const a = AREA[r[1]]; return { id: r[0], t: r[7], katI: r[2], kat: CAT[r[2]][0], wilKey: a[1], wil: W[a[1]].n, kk: a[7], wk: a[8], areaId: a[0], area: a[2], lv: r[3], st: r[4], tgl: r[6], m: r[9], rp: tdRp.get(r) || 0 }; });

    // ===== filter aktif =====
    const af = [];
    if (s.kat != null) af.push({ l: 'Kategori: ' + (s.kat === CAT.length ? 'DTT' : CAT[s.kat][0]), clear: () => this.setState({ kat: null }) });
    if (s.lv.some((v) => !v)) af.push({ l: 'Level: ' + LV.filter((l, i) => s.lv[i]).map((l) => l[0]).join(', '), clear: () => this.setState({ lv: [1, 1, 1, 1, 1] }) });
    if (s.kk) af.push({ l: 'KKKS: ' + s.kk, clear: () => this.setState({ kk: null }) });
    if (skk && lvl !== 'nat') af.push({ l: 'Wilayah: ' + W[z].n + (loc ? ' · ' + loc.name : ''), clear: () => this.setState({ z: 'nat', loc: null }) });

    return {
      isSkk: skk, isKkks: !skk,
      user: skk ? 'Hendra Wijaya' : 'Sari Wulandari', role: skk ? 'Pengawas SKK' : 'Pejabat Berwenang KKKS', tasks: skk ? '2' : '4',
      subtitle: PL + ' · data per 25 Nov 2026, 08.00 WIB · hanya insiden terverifikasi',
      filters: skk ? [{ k: 'KKKS', v: s.kk ? s.kk.replace('PT ', '') : 'Semua' }, { k: 'Wilayah', v: lvl === 'nat' ? 'Semua' : W[z].n }, { k: 'Kategori', v: s.kat == null ? 'Semua' : (s.kat === CAT.length ? 'DTT' : CAT[s.kat][0]) }] : [{ k: 'Wilayah kerja', v: loc ? loc.wk : 'Semua' }, { k: 'Kategori', v: s.kat == null ? 'Semua' : CAT[s.kat][0] }],
      lvOpen: s.lvOpen, lvOpenStr: s.lvOpen ? 'true' : 'false', toggleLv: () => this.setState({ lvOpen: !s.lvOpen }), lvAll: () => this.setState({ lv: [1, 1, 1, 1, 1] }),
      lvSum: s.lv.every(Boolean) ? 'Semua' : (s.lv.filter(Boolean).length + ' dari 5'), lvDots: LV.filter((l, i) => s.lv[i]).map((l) => ({ c: l[1] })),
      clearAll: () => this.setState({ kk: null, kat: null, lv: [1, 1, 1, 1, 1], z: skk ? 'nat' : 'own', loc: null }),
      lvChips: LV.map((l, i) => ({ n: l[0], c: l[1], cnt: String(lvAllCnt[i]), on: s.lv[i] ? 'true' : 'false', pick: () => { const nl = s.lv.slice(); nl[i] = nl[i] ? 0 : 1; if (nl.some(Boolean)) this.setState({ lv: nl }); } })),
      dtt: dttOn, dttStr: dttOn ? 'true' : 'false', dttCls: dttOn ? 'on' : '', toggleDtt: () => this.setState({ dtt: !s.dtt, kat: null }),
      hasAf: af.length > 0, af,
      dlOpen: s.dl, dlStr: s.dl ? 'true' : 'false', toggleDl: () => this.setState({ dl: !s.dl }), dlScope: (loc ? loc.name : (skk ? (lvl === 'nat' ? 'seluruh wilayah' : W[z].n) : 'wilayah kerja Anda')) + (s.kat != null ? ' · ' + (s.kat === CAT.length ? 'DTT' : CAT[s.kat][0]) : '') + (s.lv.every(Boolean) ? '' : ' · level terpilih') + ' · ' + PL,
      ins, tcCmp: PRVL + (pFull ? '' : ' (perkiraan)'), aiCap, aiSeg, aiHd: !askOn ? 'Temuan AI' : (res ? 'Jawaban AI' : 'Tanya data'), askOn, askOff: !askOn, askCls: askOn ? 'on' : '', askTxt: (askOn && ak !== 'saran') ? qOf(ak) : (skk ? 'Tanya data, mis. "insiden Kritis di Sumbagsel bulan Juni"' : 'Tanya data, mis. "insiden yang lewat tenggat di WK Andalas Darat"'), askGo: () => this.setState({ ask: ak && ak !== 'saran' ? ak : 'saran', askAll: false }), askClr: () => this.setState({ ask: null, askAll: false }),
      askK: ak, aSaran: ak === 'saran', aBlank: ak === 'tidakpaham', aRes: res, aRank: ak === 'kkks', aList: ak === 'kritis' || ak === 'telat', aCmp: ak === 'banding', sugs,
      askChips: (CHIPS[ak] || []).map((l) => ({ l })), ansRows, lRows,
      lN: lSrc.length + ' insiden', lS: ak === 'kritis' ? (lSrc.length ? (kritMei ? kritMei + ' insiden Kritis lain pada Mei' : 'tidak ada insiden Kritis lain pada Mei') : 'tidak ada insiden Kritis pada Juni') : Object.entries(lateBy).map(([w, n]) => w + ' ' + n).join(' · '),
      cA: { l: 'Maret', v: String(perM[2]) }, cB: { l: 'Juni', v: String(perM[5]) }, cD: dlt(perM[2], perM[5]), cMon: MO.map((l, i) => ({ l, v: String(perM[i]), h: Math.max(4, perM[i] / cMax * 40) + 'px', cls: i === 2 || i === 5 ? 'on' : '' })), cAria: 'Pencurian per bulan: ' + MO.map((l, i) => l + ' ' + perM[i]).join(', '), cRows,
      ansMore: (ak === 'kkks' || ak === 'kritis' || ak === 'telat') && nAll > 4 && !s.askAll, ansMoreL: 'Lihat semua (' + nAll + ')', ansAll: () => this.setState({ askAll: true }),
      ansFoot: ak === 'kkks' ? (aRows.length ? 'Dibuat AI dari data pada filter ini · klik baris untuk lihat di peta' : 'Tidak ada kerugian tercatat pada filter ini.') : ak === 'banding' ? 'Dibuat AI dari data insiden terverifikasi · per tanggal kejadian' : (lSrc.length ? 'Dibuat AI dari data pada filter ini · klik baris untuk buka insiden' : 'Tidak ada insiden yang cocok.'),
      actOn: ak === 'kritis' || ak === 'telat' || ak === 'banding', actL: ak === 'kritis' ? 'Terapkan sebagai filter' : ak === 'telat' ? 'Lihat di Status penanganan' : 'Lihat tren', actGo: ak === 'kritis' ? () => this.setState({ ask: null, z: skk ? 'sbs' : z, loc: null, lv: [0, 0, 0, 0, 1] }) : ak === 'telat' ? () => this.setState({ ask: null, stOpen: 3 }) : () => this.setState({ ask: null, kat: 0, m: 'n' }), askPh: skk ? 'Tanya data, mis. "insiden Kritis di Sumbagsel bulan Juni"' : 'Tanya data, mis. "insiden yang lewat tenggat di WK Andalas Darat"',
      kpis,
      crumb, mapT, sites, lvl, locId: loc ? loc.id : null, zKey: lvl + '|' + z + '|' + (loc ? loc.id : ''), goTo: (zz, ll) => this.setState({ z: zz, loc: ll || null }), goUp: zoomOut, askCtx: { skk, z: s.z, loc: s.loc, kat: s.kat, lv: s.lv, kk: s.kk || null, catN: CAT.length, per: pFull ? null : { from: PD.from, to: PD.to, label: PD.label } }, askApply: (patch) => this.setState(patch), areaN: Object.fromEntries(A.map((a) => [a.id, a.n])), fOpts: (() => {
      const allA = A0.filter((a) => skk || a[7] === SEN);
      const cnt = (f) => sum(A.filter(f).map((a) => a.n));
      const katO = [{ n: 'Semua kategori', on: s.kat == null, go: () => this.setState({ kat: null }) }, ...CAT.map((c, i) => ({ n: c[0], on: s.kat === i, go: () => this.setState({ kat: i }) }))];
      if (skk) {
        const wO = [{ n: 'Semua wilayah', on: lvl === 'nat', go: () => this.setState({ z: 'nat', loc: null }) }, ...WO.map((w) => ({ n: W[w].n, sub: W[w].nr ? 'belum ada laporan' : cnt((a) => a.w === w) + ' insiden', on: lvl !== 'nat' && z === w, go: () => this.setState({ z: w, loc: null }) }))];
        const kks = [...new Set(allA.map((a) => a[7]))].sort();
        const kO = [{ n: 'Semua KKKS', on: !s.kk, go: () => this.setState({ kk: null }) }, ...kks.map((kn) => ({ n: kn, sub: allA.filter((a) => a[7] === kn).map((a) => a[8]).join(', '), on: s.kk === kn, go: () => this.setState({ kk: kn }) }))];
        return [kO, wO, katO];
      }
      const wkO = [{ n: 'Semua wilayah kerja', on: !loc, go: () => this.setState({ z: 'own', loc: null }) }, ...A.map((a) => ({ n: a.wk, sub: a.name + ' · ' + a.n + ' insiden', on: !!loc && loc.id === a.id, go: () => this.setState({ z: 'own', loc: a.id }) }))];
      return [wkO, katO];
    })(), fk: [s.z, s.loc, s.kat, s.lv.join(''), s.dtt, s.m, pFull ? '' : PD.from + PD.to].join('|'), mapK: k, mapFa: fa, mapMw: mw, regs, wkm, showRegLines: lvl === 'nat', admOp: s.lay.adm ? '1' : '0', showWkLine: !!loc && s.lay.wk, wkLineSrc: loc ? '/peta/wkl-' + loc.id + '.svg' : '', showAreas: !!loc && s.lay.fas, areasSrc: loc ? '/peta/wka-' + loc.id + '.svg' : '',
      layOpen: s.layOpen, layOpenStr: s.layOpen ? 'true' : 'false', toggleLay: () => this.setState({ layOpen: !s.layOpen }),
      layers: [['wk', 'Wilayah kerja', 'Cakupan WK dari modul Wilayah kerja'], ['fas', 'Fasilitas & jalur pipa', 'Area buatan sendiri di dalam WK'], ['adm', 'Batas administrasi', 'Kabupaten/kota dan kecamatan']].map(([kk, n, d]) => ({ n, d, on: s.lay[kk] ? 'true' : 'false', pick: () => this.setState({ lay: { ...s.lay, [kk]: !s.lay[kk] } }) })), baseOp: (lvl === 'nat' || !detSrc) ? '1' : '0', hasDet: !!detSrc, detSrc, det, heat, wks, lbls, pts, pills, zoomOut, outDis, zoomHome: go('nat'),
      showHint: true, hint,
      mapCap: lvl === 'nat' ? 'Area panas di lokasi insiden. Warna mengikuti level tertinggi di area itu; makin pekat makin banyak insiden.' : (lvl === 'area' ? 'Bidang berwarna = cakupan WK (dari modul Wilayah kerja, contoh). Abu-abu = WK tanpa insiden.' : 'Garis putus-putus = batas WK. Kotak biru = fasilitas, garis hijau = jalur pipa. Satu titik satu insiden.'),
      mapAria: 'Peta insiden ' + (lvl === 'nat' ? 'Indonesia' : aTitle) + ': ' + vis.length + ' area dengan insiden',
      legLv: LV.map((l) => ({ n: l[0], c: l[1] })),
      zNat: lvl === 'nat', zArea: lvl === 'area', zLoc: lvl === 'loc',
      wRows, aTitle, aN, aNs, aR, aRs, aLv, aLvAria: aLvAriaS, aCat, aCatS, subHead, subRows, aKkks, aWk, incs, incFoot, listHref,
      attn, attnCount: String(attn.length),
      trCap: (N ? 'Jumlah insiden' : 'Kerugian (Rp)') + ' · ' + PL + (N && dttOn ? ' · abu-abu = DTT' : ''),
      measures: [['n', 'Jumlah'], ['rp', 'Kerugian']].map(([kk, l]) => ({ label: l, on: s.m === kk ? 'true' : 'false', pick: () => this.setState({ m: kk }) })),
      trNoteT: NOTE[0], trNoteD: NOTE[1],
      topCat, catCap,
      ikN: String(inT), ikK: String(krT), ikUp: upN + ' (' + (krT ? Math.round(upN / krT * 100) : 0) + '%)', ikBars, ikAria: 'Insiden dan kerawanan per bulan: ' + MO.map((m, i) => m + ' ' + IN[i] + ' insiden, ' + KR[i] + ' kerawanan').filter((x, i) => moCov[i] > 0).join('; '),
      ikNote: 'Kerawanan yang dinaikkan jadi insiden pindah ke hitungan insiden.' + (dttOn ? ' DTT dihitung sebagai insiden.' : ''),
      stCap: 'Klik status untuk melihat insidennya' + (dttOn ? ' · DTT tidak termasuk' : ''), st, stBar, stAria: 'Status penanganan: ' + stBar.map((v) => v.n + ' ' + v.v).join(', '), stLate: String(lateList.length), stMed: String(med).replace('.', ',') + ' hari', stClosed: String(closed.length), lateGo: () => this.setState({ stOpen: s.stOpen === 3 ? null : 3 }), lateOpenStr: s.stOpen === 3 ? 'true' : 'false',

      trend, trAria: 'Tren per bulan: ' + trend.map((b) => b.m + ' ' + b.lbl).join(', '),
      tdInc, tdSkk: skk, tdApply: (patch) => this.setState(patch),
      foot: 'Hanya insiden terverifikasi · ' + (skk ? 'Arsir = belum ada laporan · ' : '') + (pFull ? '' : 'Angka selain jumlah insiden = perkiraan · ') + 'Data demo · Batas wilayah Kemendagri 2025'
    };
  }
}

