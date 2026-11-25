// @ts-nocheck
// DIHASILKAN oleh scripts/dc-to-tsx.mjs dari design/*.dc.html. Jangan diedit tangan; ubah skrip atau sumbernya.
/* eslint-disable */
import { DCLogic } from '@/dc/runtime';
import { SEN, LV, W, A0, DTT, CAT, MO, INC } from '@/data/dashboard';

export class DashboardLogic extends DCLogic {
  constructor(p) {
    super(p); p = p || {};
    const kk = p.peran === 'kkks';
    let z = p.zoom || 'nat', loc = null;
    if (z === 'loc') { z = kk ? 'own' : 'sbs'; loc = 'mub'; }
    else if (kk) z = 'own';
    if (p.statusTerbuka === '' ) p.statusTerbuka = null;
    this.state = { z, loc, lv: [1, 1, 1, 1, 1], dtt: !!p.dtt, kat: null, m: 'n', lvOpen: false, dl: !!p.menuUnduh, stOpen: p.statusTerbuka == null ? null : Number(p.statusTerbuka) };
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
    // Kategori × wilayah (pola sheet WILAYAH rekap SKK, angka demo)
    const catIdx = s.kat == null ? -1 : s.kat;
    const dttOn = skk && s.dtt;
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
    const A = A0.filter((a) => skk || a[7] === SEN).map((a) => {
      let lv = a[5].slice();
      if (catIdx >= 0 && catIdx < CAT.length) lv = alloc(Math.min(catN[a[0]] || 0, sum(a[5])), lv);
      if (catIdx === CAT.length) lv = [0, 0, 0, 0, 0];
      if (dttOn && DTT[a[0]] && (catIdx < 0 || catIdx === CAT.length)) lv[0] += DTT[a[0]];
      lv = lv.map((v, i) => (s.lv[i] ? v : 0));
      const n = sum(lv); let mx = -1; lv.forEach((v, i) => { if (v > 0) mx = i; });
      const rpv = catIdx === CAT.length ? 0 : Math.round(a[6] * (sum(a[5]) ? Math.min(1, n / sum(a[5])) : 0));
      return { id: a[0], w: a[1], name: a[2], x: a[3], y: a[4], lv, n, mx, rp: rpv, kk: a[7], wk: a[8] };
    });
    const maxN = Math.max(1, ...A.map((a) => a.n));
    const lvMax = (lv) => { let m = -1; lv.forEach((v, i) => { if (v > 0) m = i; }); return m; };
    const sevOf = (m) => m < 0 ? { sn: 'Tidak ada', sc: 'var(--border-control)', sbg: 'var(--surface-subtle)', sink: 'var(--ink-muted)' } : { sn: LV[m][0], sc: LV[m][1], sbg: LV[m][2], sink: LV[m][3] };
    const addLv = (list) => [0, 1, 2, 3, 4].map((i) => sum(list.map((a) => a.lv[i])));

    const lvAllCnt = [0, 1, 2, 3, 4].map((i) => sum(A0.filter((a) => skk || a[7] === SEN).map((a) => a[5][i])) + (i === 0 && dttOn ? 422 : 0));
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
    const detSrc = loc ? '/peta/l-' + loc.id + '.svg' : (lvl === 'area' ? '/peta/z-' + z + '.svg' : '');
    const det = { l: ((cx - 500 * fa / k) / 10).toFixed(3) + '%', t: ((cy - 200 / k) / 4).toFixed(3) + '%', w: (100 / k).toFixed(3) + '%', h: (100 / k).toFixed(3) + '%' };
    const go = (zz, ll) => () => this.setState({ z: zz, loc: ll || null });

    const inArea = (a) => lvl === 'nat' ? true : (z === 'own' ? true : a.w === z);
    const vis = A.filter((a) => a.n > 0 && (lvl === 'nat' || inArea(a)));
    const heat = lvl === 'loc' ? [] : vis.map((a) => {
      const r = Math.sqrt(a.n / maxN);
      const alpha = Math.round(30 + 60 * r);
      const C = LV[a.mx][1];
      const base = lvl === 'nat' ? 26 : 70 / k;
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
      const SITE = [[-4.2, -1.6, 'Sumur ' + code + '-07'], [3.6, -0.4, 'Stasiun pengumpul ' + code], [-0.4, 2.4, 'Jalur pipa ' + code + ' km 12']];
      const order = []; loc.lv.forEach((v, i) => { for (let j = 0; j < v; j++) order.push(i); });
      const pool = INC.filter((r) => r[1] === loc.id); const used = new Set(); const pickInc = (li) => { const qi = pool.findIndex((q, i) => q[3] === li && !used.has(i)); if (qi < 0) return null; used.add(qi); const r = pool[qi]; return { id: r[0], t: r[7], st: ['Dalam penanganan', 'Menunggu penutupan', 'Ditutup'][r[4]] }; };
      const shown = order.slice(-60).reverse();
      pts = shown.map((li, i) => { const si = i % 5 < 2 ? 0 : (i % 5 < 4 ? 1 : 2); const st = SITE[si]; const ang = i * 2.39996, rr = 0.18 + 0.32 * ((i * 7) % 5) / 5; return { x: sx(loc.x + st[0] + Math.cos(ang) * rr), y: sy(loc.y + st[1] + Math.sin(ang) * rr * 0.8), c: LV[li][1], tip: LV[li][0] + ' · ' + st[2], lvN: LV[li][0], site: st[2], inc: pickInc(li) }; });
      sites = SITE.map((t) => ({ x: sx(loc.x + t[0]), y: ((loc.y + t[1] - y0 + 0.75) * k / 4).toFixed(2) + '%', n: t[2] }));
    }
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
    if (loc) crumb.push({ t: (skk ? loc.name + ' · ' : '') + loc.wk, go: () => {}, link: false, cur: true });
    const zoomOut = () => { if (loc) this.setState({ loc: null }); else if (skk && z !== 'nat') this.setState({ z: 'nat' }); };
    const outDis = (!loc && (!skk || z === 'nat')) ? 'true' : null;
    const hint = lvl === 'nat' ? 'Klik area panas atau nama wilayah untuk zoom' : (lvl === 'area' ? 'Klik area untuk melihat titik insiden' : 'Titik = satu insiden, warna = level');

    // ===== strip =====
    const tot = (list) => ({ n: sum(list.map((a) => a.n)), r: sum(list.map((a) => a.rp)), lv: addLv(list) });
    const NAT = tot(A);
    const SC = loc ? [loc] : (lvl === 'nat' ? A : A.filter(inArea));
    const ALL = tot(SC);
    const scIds = SC.map((a) => a.id);
    const incS = INC.filter((r) => scIds.includes(r[1]) && s.lv[r[3]] && (catIdx < 0 || catIdx === r[2]));
    const stA = [0, 1, 2].map((k) => incS.filter((r) => r[4] === k).length);
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
      aCat = cc[0]; aCatS = cc[1] + ' insiden pada periode ini';
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
      incs = T.filter((t) => s.lv[t[2]]).map((t, i) => ({ id: 'INS-' + code + '-2026-00' + (41 - i * 3), t: t[0], d: t[1], ...sevOf(t[2]), st: t[3], href: skk ? 'P31-DetailSKK.dc.html' : 'I15-Detail.dc.html' }));
      incFoot = 'Menampilkan ' + incs.length + ' dari ' + loc.n + ' insiden, diurutkan dari level tertinggi. Titik dengan lokasi rahasia tidak digambar, tetap dihitung.';
    }

    // ===== KPI =====
    const isNat = skk && lvl === 'nat', isOwn = !skk && !loc;
    const prevN = isNat ? (dttOn ? 455 : 92) : (isOwn ? 21 : Math.max(1, Math.round(ALL.n * 0.86))), prevR = isNat ? 1100 : (isOwn ? 600 : Math.max(1, Math.round(ALL.r * 0.78)));
    const tk = ALL.lv[3] + ALL.lv[4];
    const up = (a, b) => (a === 0 && b <= 1) ? 'tetap' : (a >= b ? '▲ ' : '▼ ') + Math.abs(Math.round((a - b) / b * 100)) + '%';
    const kpis = [
      { label: 'Insiden terverifikasi', val: String(ALL.n), unit: 'insiden', tr: up(ALL.n, prevN), trCls: ALL.n > prevN ? 'tr-bad' : 'tr-good', cmp: 'vs Sem. II 2025 (' + prevN + ')', link: 'Lihat daftar', href: listHref },
      { label: 'Kerugian', val: rp(ALL.r), unit: '', tr: up(ALL.r, prevR), trCls: ALL.r > prevR ? 'tr-bad' : 'tr-good', cmp: 'vs Sem. II 2025 (' + rp(prevR) + ')', link: 'Rincian per wilayah', href: '#' },
      { label: 'Tinggi & Kritis', val: String(tk), unit: 'insiden', tr: incS.filter((r) => r[3] >= 3 && r[4] < 2).length + ' masih terbuka', trCls: 'tr-bad', cmp: 'sisanya sudah ditutup', link: 'Lihat yang terbuka', href: listHref },
      skk ? { label: 'KKKS melapor (Jun 2026)', val: String(lvl === 'nat' ? 14 : W[z].rep), unit: 'dari ' + (lvl === 'nat' ? 131 : W[z].kk) + ' KKKS', tr: '7–14 per bulan', trCls: 'tr-flat', cmp: 'insiden atau nihil', link: 'Lihat yang belum melapor', href: '#' }
          : { label: 'Median lama penanganan', val: String(med).replace('.', ','), unit: 'hari', tr: '▼ 1 hari', trCls: 'tr-good', cmp: 'vs Sem. II 2025 (' + String(med + 1).replace('.', ',') + ' hari)', link: 'Lihat yang lewat tenggat', href: listHref }
    ];

    { const wq = skk && lvl !== 'nat' ? '&wilayah=' + z : ''; const TO = ['/insiden?status=terverifikasi' + wq, '/insiden?urut=kerugian' + wq, '/insiden?level=tinggi,kritis&status=terbuka' + wq, skk ? '/insiden?kkks=belum-melapor' + wq : '/insiden?status=lewat-tenggat']; kpis.forEach((kp, i) => { kp.to = TO[i]; }); }
    // ===== AI ringkasan =====
    const seg = (t, g) => ({ t, plain: !g, act: !!g, go: g || (() => {}) });
    const topLoc = SC.slice().sort((a, b) => b.mx - a.mx || b.n - a.n)[0];
    const catScope = (c) => skk ? (loc ? null : (lvl === 'nat' ? sum(Object.values(c[1])) : (c[1][z] || 0))) : (loc ? (c[2][loc.id] || 0) : sum(Object.values(c[2])));
    const aiZoom = (skk && lvl !== 'nat') ? [
      seg('Di ' + (loc ? loc.name + ' (' + loc.wk + ')' : 'wilayah ' + W[z].n) + ' tercatat ' + ALL.n + ' insiden dengan kerugian ' + rp(ALL.r) + ', atau ' + (NAT.n ? Math.round(ALL.n / NAT.n * 100) : 0) + '% insiden dan ' + (NAT.r ? Math.round(ALL.r / NAT.r * 100) : 0) + '% kerugian nasional. '),
      seg(topLoc && topLoc.mx >= 0 ? 'Level tertinggi ' + LV[topLoc.mx][0] + ' ada di ' : ''), seg(topLoc && topLoc.mx >= 0 ? topLoc.name : '', topLoc && !loc ? go(z, topLoc.id) : null), seg('. '),
      seg(loc ? 'Lokasi ini berada di wilayah kerja ' + loc.kk + '.' : 'Jenis terbanyak: ' + CAT.map((c) => [c[0], c[1][z] || 0]).sort((a, b) => b[1] - a[1])[0][0] + '.')
    ] : null;
    const aiSeg = aiZoom ? aiZoom : skk ? [
      seg('Semester I 2026 mencatat ' + ALL.n + ' insiden terverifikasi dengan kerugian ' + rp(ALL.r) + (dttOn ? ', termasuk 422 kasus DTT di Jabanusa. ' : ', naik 15% dari Semester II 2025. ')),
      seg('Sumbagsel', go('sbs')), seg(' menyumbang 63% kerugian walau hanya 36% insiden; kedua insiden Kritis ada di '), seg('Musi Banyuasin', go('sbs', 'mub')), seg('. '),
      seg('Pencurian/Perampokan tetap kategori terbanyak (80), terutama di '), seg('Sumbagut', go('sbu')), seg('. '),
      seg('Pamalu belum mengirim laporan apa pun, jadi angka 0 di wilayah itu belum bisa dibaca sebagai aman.')
    ] : [
      seg('Semester I 2026 organisasi Anda mencatat ' + NAT.n + ' insiden dengan kerugian ' + rp(NAT.r) + '. '),
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
    const dttCnt = (dttOn && s.lv[0] && (catIdx < 0 || catIdx === CAT.length)) ? sum(SC.map((a) => DTT[a.id] || 0)) : 0;
    const vN = baseN.map((v) => Math.round(v * Math.max(0, ALL.n - dttCnt) / (skk ? 106 : 24)));
    const vals = N ? vN : baseR.map((v) => Math.round(v * (ALL.r / (skk ? 1412 : 730))));
    const dv = (N && dttCnt) ? dN.map((v) => Math.round(v * dttCnt / 422)) : [0, 0, 0, 0, 0, 0];
    const mx = Math.max(1, ...vals.map((v, i) => v + dv[i]));
    const curated = isNat || isOwn;
    let gI = 1, gD = -1e9; for (let i = 1; i < 6; i++) { const d = vals[i] - vals[i - 1]; if (d > gD) { gD = d; gI = i; } }
    const mkI = curated ? ((!skk && N) ? 3 : 4) : (gD > 0 ? gI : -1);
    const NOTE = !curated ? (gD > 0 ? [MO[gI] + ': ' + (N ? 'insiden' : 'kerugian') + ' naik dari ' + (N ? vals[gI - 1] : rp(vals[gI - 1])) + ' jadi ' + (N ? vals[gI] : rp(vals[gI])) + '.', 'Kenaikan terbesar dalam periode ini untuk area yang sedang dilihat.'] : ['Tidak ada kenaikan berarti.', 'Angka stabil atau turun sepanjang periode.']) : skk ? (N ? ['Mei: insiden naik 24% dari April (17 → 21).', 'Kenaikan terbesar di Sumbagsel (+3), kebanyakan Pencurian/Perampokan.'] : ['Mei: kerugian naik 1,7× dari April (Rp240 jt → Rp402 jt).', 'Penyumbang terbesar Illegal tapping di Sumbagsel.'])
      : (N ? ['April: insiden naik dari 3 jadi 5.', 'Dua di antaranya di Sumur ADR-07, WK Andalas Darat.'] : ['Mei: kerugian naik 2,2× dari April (Rp110 jt → Rp240 jt).', 'Hampir semuanya dari satu insiden Kritis di WK Andalas Darat.']);
    const tRp = baseR.map((x) => Math.round(x * (ALL.r / (skk ? 1412 : 730))));
    const trend = vals.map((v, i) => ({ bulan: i + 1, tip: MO[i] + ' 2026\nJumlah: ' + (vN[i] + dv[i]) + ' insiden\nKerugian: ' + rp(tRp[i]) + (i ? '\nDari ' + MO[i - 1] + ': ' + (N ? ((vN[i] - vN[i - 1] >= 0 ? '+' : '') + (vN[i] - vN[i - 1]) + ' insiden') : ((tRp[i] - tRp[i - 1] >= 0 ? '+' : '−') + rp(Math.abs(tRp[i] - tRp[i - 1])))) : ''), m: MO[i], lbl: N ? String(v + dv[i]) : rp(v), h: (v / mx * 150).toFixed(1) + 'px', hd: (dv[i] / mx * 150).toFixed(1) + 'px', hasD: dv[i] > 0, c: N ? 'var(--chart-series-1)' : 'var(--action-line)', hasMk: i === mkI, ring: i === mkI ? '0 0 0 2px var(--surface), 0 0 0 4px var(--ink)' : 'none' }));

    // ===== jenis terbanyak =====
    const PREVF = [0.78, 1.3, 0.7, 0.5, 1.2, 1, 1];
    let cats = CAT.map((c, i) => {
      let v = catScope(c);
      if (v == null) { const wt = wTot0[loc.w] || 1; v = Math.round((c[1][loc.w] || 0) * sum(loc.lv) / wt); }
      return { i, n: c[0], v, prev: Math.round(v * PREVF[i]) };
    });
    const dttScope = (dttOn && s.lv[0]) ? sum(SC.map((a) => DTT[a.id] || 0)) : 0;
    if (dttScope) cats.push({ i: CAT.length, n: 'Daerah Terbatas Terlarang', v: dttScope, prev: Math.round(dttScope * 0.9), dtt: true });
    cats = cats.filter((c) => c.v > 0).sort((a, b) => b.v - a.v).slice(0, 6);
    const ctot = sum(cats.map((c) => c.v)) || 1, cmax = Math.max(1, ...cats.map((c) => c.v));
    const topCat = cats.map((c) => { const d = c.v - c.prev; return { tip: c.n + '\n' + c.v + ' insiden · ' + Math.round(c.v / ctot * 100) + '% dari jenis teratas\nKerugian (perkiraan): ' + rp(ALL.r * c.v / ctot) + '\nSemester II 2025: ' + c.prev + ' insiden', n: c.n, v: String(c.v), w: (c.v / cmax * 100).toFixed(1) + '%', p: Math.round(c.v / ctot * 100) + '%', d: d > 0 ? '▲ ' + d : (d < 0 ? '▼ ' + (-d) : 'tetap'), dc: d > 0 ? 'up' : (d < 0 ? 'dn' : 'eq'), cls: (c.dtt ? 'dtt ' : '') + (s.kat === c.i ? 'sel' : ''), aria: c.n + ': ' + c.v + ' insiden', go: () => this.setState({ kat: s.kat === c.i ? null : c.i }) }; });
    const catCap = (loc ? loc.name : (skk ? (lvl === 'nat' ? 'Semua wilayah' : 'Wilayah ' + W[z].n) : 'Wilayah kerja Anda')) + ' · ' + (cats.length ? cats.length + ' jenis teratas' : 'tidak ada insiden');
    // ===== insiden vs kerawanan =====
    const fS = Math.max(0, ALL.n - dttScope) / (skk ? 106 : 24);
    const KR = (skk ? [31, 28, 35, 40, 38, 44] : [4, 5, 6, 5, 7, 6]).map((v) => Math.round(v * fS));
    const IN = (skk ? [22, 14, 15, 17, 21, 17] : [3, 4, 3, 5, 5, 4]).map((v) => Math.round(v * fS));
    const ikMax = Math.max(1, ...KR, ...IN);
    const ikBars = MO.map((m, i) => ({ tip: m + ' 2026\nInsiden: ' + IN[i] + '\nKerawanan: ' + KR[i] + '\nNaik jadi insiden: ' + Math.round(KR[i] * (skk ? 0.083 : 0.09)), m, hn: (IN[i] / ikMax * 130).toFixed(1) + 'px', hk: (KR[i] / ikMax * 130).toFixed(1) + 'px' }));
    const krT = sum(KR), inT = sum(IN), upN = Math.round(krT * (skk ? 0.083 : 0.09));
    // ===== status penanganan =====
    const stDef = [['Dalam penanganan', 'var(--chart-series-1)'], ['Menunggu penutupan', 'var(--sev-medium-dot)'], ['Ditutup', 'var(--status-success-ink)']];
    const st = stDef.map((d, i) => { const op = s.stOpen === i; const list = incS.filter((r) => r[4] === i).sort(byPrio); return { n: d[0], c: d[1], v: String(stA[i]), w: (incN ? stA[i] / incN * 100 : 0).toFixed(1) + '%', p: (incN ? Math.round(stA[i] / incN * 100) : 0) + '%', open: op, openStr: op ? 'true' : 'false', rot: op ? 'rotate(90deg)' : 'none', go: () => this.setState({ stOpen: op ? null : i }), items: list.slice(0, 5).map(incRow), more: list.length > 5 ? 'Lihat semua ' + list.length + ' di Daftar insiden →' : 'Buka di Daftar insiden →' }; });
    if (s.stOpen === 3) { st.push({ n: 'Lewat tenggat', c: 'var(--sev-critical-dot)', v: String(lateList.length), w: '0%', p: '', open: true, openStr: 'true', rot: 'rotate(90deg)', go: () => this.setState({ stOpen: null }), items: lateList.slice(0, 5).map(incRow), more: 'Buka di Daftar insiden →' }); }
    const stBar = st.slice(0, 3);
    // ===== temuan AI (pola, bukan tindakan) =====
    const nop = () => {};
    const c0 = cats[0];
    const pctN = NAT.n ? Math.round(ALL.n / NAT.n * 100) : 0, pctR = NAT.r ? Math.round(ALL.r / NAT.r * 100) : 0;
    const krUp = KR[0] ? Math.round((KR[5] - KR[0]) / KR[0] * 100) : 0;
    const topA = SC.slice().sort((x, y) => y.n - x.n)[0];
    const ins = [
      (skk && lvl === 'nat') ? { m: '2,4×', tone: 'bad', t: 'Kerugian Sumbagsel melonjak', d: 'Rp370 jt → Rp891 jt · 63% kerugian nasional dari 36% insiden', go: go('sbs') }
        : (skk ? { m: pctR + '%', tone: 'warn', t: 'Porsi dari kerugian nasional', d: 'Dari ' + pctN + '% jumlah insiden nasional', go: nop }
        : { m: '63%', tone: 'warn', t: 'Insiden terpusat di WK Andalas Darat', d: '15 dari 24 insiden, termasuk 2 Kritis', go: go('own', 'mub') }),
      (skk && lvl === 'nat') ? { m: '48%', tone: 'warn', t: 'Sumbagut paling sering terjadi insiden', d: '51 insiden, hampir semua Pencurian/Perampokan', go: go('sbu') }
        : ((skk && !loc && topA) ? { m: String(topA.n), tone: topA.mx >= 4 ? 'bad' : 'warn', t: topA.name + ' paling banyak insiden', d: 'Level tertinggi ' + (topA.mx >= 0 ? LV[topA.mx][0] : '-') + ' · ' + topA.wk, go: go(z, topA.id) } : null),
      c0 ? { m: String(c0.v), tone: 'neu', t: c0.n + ' jenis terbanyak', d: Math.round(c0.v / Math.max(1, ALL.n) * 100) + '% dari insiden pada periode ini', go: () => this.setState({ kat: c0.i }) } : null,
      { m: (krUp >= 0 ? '▲ ' : '▼ ') + Math.abs(krUp) + '%', tone: krUp > 20 ? 'warn' : 'info', t: 'Kerawanan ' + (krUp >= 0 ? 'naik' : 'turun') + ' sejak Januari', d: 'Tanda awal: ' + KR[0] + ' → ' + KR[5] + ' per bulan', go: nop }
    ].filter(Boolean);
    const aiCap = 'Semester I 2026 · ' + (loc ? loc.name : (skk ? (lvl === 'nat' ? 'seluruh wilayah' : W[z].n) : 'wilayah kerja Anda')) + ' · data 25 Nov 2026';
    // ===== matriks =====
    let mxCols, mxRows;
    if (skk) {
      const rows = CAT.map((c, i) => ({ n: c[0], i, v: WO.map((w) => c[1][w] || 0) }));
      if (dttOn) rows.push({ n: 'Daerah Terbatas Terlarang (DTT)', i: CAT.length, v: WO.map((w) => w === 'jbn' ? 422 : 0), dtt: true });
      const cm = Math.max(1, ...rows.filter((r) => !r.dtt).map((r) => Math.max(...r.v)));
      mxCols = WO.map((w) => ({ n: W[w].n, s: W[w].nr ? 'belum lapor' : (W[w].none ? 'nihil' : '') }));
      mxRows = rows.map((r) => ({ n: r.n, cls: r.dtt ? 'dtt' : '', tot: String(sum(r.v)), cells: r.v.map((v, j) => ({ v: v ? String(v) : '–', cls: v ? (s.kat === r.i && z === WO[j] ? 'sel' : '') : 'z', bg: v ? 'color-mix(in srgb, var(--chart-series-1) ' + Math.round(8 + Math.min(1, v / cm) * 52) + '%, var(--surface))' : 'var(--surface-subtle)', aria: r.n + ' di ' + W[WO[j]].n + ': ' + v, go: v ? () => this.setState({ kat: r.i, z: WO[j], loc: null }) : () => {} })) }));
    } else {
      const ws = [['mub', 'WK Andalas Darat'], ['bny', 'WK Batu Ampar']];
      mxCols = ws.map((w) => ({ n: w[1], s: '' }));
      const rows = CAT.map((c, i) => ({ n: c[0], i, v: ws.map((w) => c[2][w[0]] || 0) })).filter((r) => sum(r.v) > 0);
      const cm = Math.max(1, ...rows.map((r) => Math.max(...r.v)));
      mxRows = rows.map((r) => ({ n: r.n, cls: '', tot: String(sum(r.v)), cells: r.v.map((v, j) => ({ v: v ? String(v) : '–', cls: v ? (s.kat === r.i ? 'sel' : '') : 'z', bg: v ? 'color-mix(in srgb, var(--chart-series-1) ' + Math.round(8 + v / cm * 52) + '%, var(--surface))' : 'var(--surface-subtle)', aria: r.n + ' di ' + ws[j][1] + ': ' + v, go: v ? () => this.setState({ kat: r.i, z: 'own', loc: ws[j][0] }) : () => {} })) }));
    }

    // ===== filter aktif =====
    const af = [];
    if (s.kat != null) af.push({ l: 'Kategori: ' + (s.kat === CAT.length ? 'DTT' : CAT[s.kat][0]), clear: () => this.setState({ kat: null }) });
    if (s.lv.some((v) => !v)) af.push({ l: 'Level: ' + LV.filter((l, i) => s.lv[i]).map((l) => l[0]).join(', '), clear: () => this.setState({ lv: [1, 1, 1, 1, 1] }) });
    if (skk && lvl !== 'nat') af.push({ l: 'Wilayah: ' + W[z].n + (loc ? ' · ' + loc.name : ''), clear: () => this.setState({ z: 'nat', loc: null }) });

    return {
      isSkk: skk, isKkks: !skk,
      user: skk ? 'Hendra Wijaya' : 'Sari Wulandari', role: skk ? 'Pengawas SKK' : 'Pejabat Berwenang KKKS', tasks: skk ? '2' : '4',
      subtitle: 'Semester I 2026 · data per 25 Nov 2026, 08.00 WIB · hanya insiden terverifikasi',
      filters: skk ? [{ k: 'Wilayah', v: lvl === 'nat' ? 'Semua' : W[z].n }, { k: 'KKKS', v: 'Semua' }, { k: 'Kategori', v: s.kat == null ? 'Semua' : (s.kat === CAT.length ? 'DTT' : CAT[s.kat][0]) }] : [{ k: 'Wilayah kerja', v: loc ? loc.wk : 'Semua' }, { k: 'Kategori', v: s.kat == null ? 'Semua' : CAT[s.kat][0] }],
      lvOpen: s.lvOpen, lvOpenStr: s.lvOpen ? 'true' : 'false', toggleLv: () => this.setState({ lvOpen: !s.lvOpen }), lvAll: () => this.setState({ lv: [1, 1, 1, 1, 1] }),
      lvSum: s.lv.every(Boolean) ? 'Semua' : (s.lv.filter(Boolean).length + ' dari 5'), lvDots: LV.filter((l, i) => s.lv[i]).map((l) => ({ c: l[1] })),
      clearAll: () => this.setState({ kat: null, lv: [1, 1, 1, 1, 1], z: skk ? 'nat' : 'own', loc: null }),
      lvChips: LV.map((l, i) => ({ n: l[0], c: l[1], cnt: String(lvAllCnt[i]), on: s.lv[i] ? 'true' : 'false', pick: () => { const nl = s.lv.slice(); nl[i] = nl[i] ? 0 : 1; if (nl.some(Boolean)) this.setState({ lv: nl }); } })),
      dtt: dttOn, dttStr: dttOn ? 'true' : 'false', dttCls: dttOn ? 'on' : '', toggleDtt: () => this.setState({ dtt: !s.dtt, kat: null }),
      hasAf: af.length > 0, af,
      dlOpen: s.dl, dlStr: s.dl ? 'true' : 'false', toggleDl: () => this.setState({ dl: !s.dl }), dlScope: (loc ? loc.name : (skk ? (lvl === 'nat' ? 'seluruh wilayah' : W[z].n) : 'wilayah kerja Anda')) + (s.kat != null ? ' · ' + (s.kat === CAT.length ? 'DTT' : CAT[s.kat][0]) : '') + (s.lv.every(Boolean) ? '' : ' · level terpilih') + ' · Semester I 2026',
      ins, aiCap, aiSeg, askPh: skk ? 'Tanya data, mis. "insiden Kritis di Sumbagsel bulan Juni"' : 'Tanya data, mis. "insiden yang lewat tenggat di WK Andalas Darat"',
      kpis,
      crumb, mapT, sites, lvl, locId: loc ? loc.id : null, zKey: lvl + '|' + z + '|' + (loc ? loc.id : ''), goTo: (zz, ll) => this.setState({ z: zz, loc: ll || null }), goUp: zoomOut, fk: [s.z, s.loc, s.kat, s.lv.join(''), s.dtt, s.m].join('|'), mapK: k, mapFa: fa, mapMw: mw, baseOp: lvl === 'nat' ? '1' : '0', hasDet: !!detSrc, detSrc, det, heat, wks, lbls, pts, pills, zoomOut, outDis, zoomHome: go('nat'),
      showHint: true, hint,
      mapCap: lvl === 'nat' ? 'Area panas di lokasi insiden. Warna mengikuti level tertinggi di area itu; makin pekat makin banyak insiden.' : (lvl === 'area' ? 'Garis = batas provinsi dan kabupaten/kota. Batas WK menunggu data resmi (Q-272).' : 'Satu titik satu insiden. Lokasi rahasia tidak digambar.'),
      mapAria: 'Peta insiden ' + (lvl === 'nat' ? 'Indonesia' : aTitle) + ': ' + vis.length + ' area dengan insiden',
      legLv: LV.map((l) => ({ n: l[0], c: l[1] })),
      zNat: lvl === 'nat', zArea: lvl === 'area', zLoc: lvl === 'loc',
      wRows, aTitle, aN, aNs, aR, aRs, aLv, aLvAria: aLvAriaS, aCat, aCatS, subHead, subRows, aKkks, aWk, incs, incFoot, listHref,
      attn, attnCount: String(attn.length),
      trCap: (N ? 'Jumlah insiden' : 'Kerugian (Rp)') + ' · Semester I 2026' + (N && dttOn ? ' · abu-abu = DTT' : ''),
      measures: [['n', 'Jumlah'], ['rp', 'Kerugian']].map(([kk, l]) => ({ label: l, on: s.m === kk ? 'true' : 'false', pick: () => this.setState({ m: kk }) })),
      trNoteT: NOTE[0], trNoteD: NOTE[1],
      topCat, catCap,
      ikN: String(inT), ikK: String(krT), ikUp: upN + ' (' + (krT ? Math.round(upN / krT * 100) : 0) + '%)', ikBars, ikAria: 'Insiden dan kerawanan per bulan: ' + MO.map((m, i) => m + ' ' + IN[i] + ' insiden, ' + KR[i] + ' kerawanan').join('; '),
      ikNote: 'Kerawanan yang dinaikkan jadi insiden pindah ke hitungan insiden.' + (dttOn ? ' DTT dihitung sebagai insiden.' : ''),
      stCap: 'Klik status untuk melihat insidennya' + (dttOn ? ' · DTT tidak termasuk' : ''), st, stBar, stAria: 'Status penanganan: ' + stBar.map((v) => v.n + ' ' + v.v).join(', '), stLate: String(lateList.length), stMed: String(med).replace('.', ',') + ' hari', stClosed: String(closed.length), lateGo: () => this.setState({ stOpen: s.stOpen === 3 ? null : 3 }), lateOpenStr: s.stOpen === 3 ? 'true' : 'false',

      trend, trAria: 'Tren per bulan: ' + trend.map((b) => b.m + ' ' + b.lbl).join(', '),
      mxTitle: skk ? 'Kategori × wilayah' : 'Kategori × wilayah kerja',
      mxCap: 'Klik sel untuk menyaring seluruh halaman dan zoom ke ' + (skk ? 'wilayah' : 'wilayah kerja') + ' itu.' + (skk ? ' 11 kategori tanpa insiden disembunyikan.' : ''),
      mxCols, mxRows,
      foot: 'Angka hanya mencakup insiden yang sudah diverifikasi; draf dan laporan yang belum diperiksa tidak dihitung. Semua angka di halaman ini dan di PDF dihitung dari sumber data yang sama. ' + (skk ? 'DTT tidak dihitung kecuali sakelar "Hitung DTT" dinyalakan (keputusan terbuka). "Belum ada laporan" berbeda dengan "0 insiden": wilayah tanpa laporan insiden maupun nihil ditandai arsir. ' : '') + 'Batas wilayah: Kemendagri 2025 via cahyadsn/wilayah_boundaries (MIT). Angka demo, pola mengikuti rekap SKK Jan–Jun 2026.'
    };
  }
}

