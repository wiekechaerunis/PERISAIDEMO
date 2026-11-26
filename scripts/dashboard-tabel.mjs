// Kartu "Tabel insiden" (pivot ringan + drill-down) dari canvas Desain v2 (project/Dashboard.dc.html, section.db-tb, versi
// 1795661784-3e31), menggantikan matriks "Kategori × wilayah". Dipasang oleh scripts/dc-to-tsx.mjs:
// SOURCE_PATCHES mengubah sumber design/dashboard/Dashboard.dc.html sebelum diterjemahkan (CSS + markup),
// TABLE_LOGIC_PATCHES mengubah kelas logika (state, perhitungan, kunci renderVals). Lihat DEVIATIONS.md D-T1..D-T4.
// Tautan "Buka di daftar insiden" tanpa → di teks: .lk-alink sudah menambah panah lewat ::after.

const TB_CSS = String.raw`.db-tb{gap:12px}
.db-tb .seg{display:inline-flex;padding:2px;border-radius:var(--radius-md);background:var(--surface-sunken)}
.db-tb .seg button{border:0;background:none;font:inherit;font-size:12px;font-weight:600;height:28px;padding:0 12px;border-radius:calc(var(--radius-md) - 2px);color:var(--ink-muted);cursor:pointer}
.db-tb .seg button[aria-checked="true"]{background:var(--surface);color:var(--ink);box-shadow:0 1px 2px rgba(28,29,33,.08)}
.db-tb .tbar{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.db-tb .tbar .lb{font-size:12px;font-weight:600;color:var(--ink-muted)}
.db-tb .tbar .sep{color:var(--ink-subtle);font-size:13px}
.db-tb .dd{position:relative}
.db-tb .pill{height:30px;padding:0 10px;border-radius:999px;border:0;background:var(--surface);box-shadow:inset 0 0 0 1px var(--border);font:inherit;font-size:13px;font-weight:600;color:var(--ink);display:inline-flex;align-items:center;gap:4px;cursor:pointer}
.db-tb .pill:hover{box-shadow:inset 0 0 0 1px var(--border-control)}
.db-tb .pill.ph{font-weight:500;color:var(--ink-muted);box-shadow:inset 0 0 0 1px var(--border);border:0;background:var(--surface-subtle)}
.db-tb .pop{position:absolute;top:34px;left:0;z-index:20;min-width:180px;display:flex;flex-direction:column;padding:4px;background:var(--surface);border-radius:var(--radius-md);box-shadow:0 8px 24px rgba(28,29,33,.14),0 0 0 1px var(--border-subtle)}
.db-tb .pop button{border:0;background:none;text-align:left;font:inherit;font-size:13px;padding:8px 10px;border-radius:var(--radius-sm);cursor:pointer;color:var(--ink)}
.db-tb .pop button:hover{background:var(--surface-subtle)}
.db-tb .pop button[aria-checked="true"]{font-weight:700;background:var(--action-subtle-bg)}
.db-tb .lnk{border:0;background:none;font:inherit;font-size:12px;font-weight:600;color:var(--ink-muted);cursor:pointer;padding:4px 6px;border-radius:var(--radius-sm)}
.db-tb .lnk:hover{color:var(--ink);background:var(--surface-subtle)}
.db-tb .grid{display:flex;flex-direction:column;overflow-x:auto;font-size:13px}
.db-tb .ln{display:grid;align-items:stretch;gap:3px;min-height:36px;margin-top:3px}
.db-tb .ln.hd{min-height:28px;margin-top:0}
.db-tb .ln.hd .c,.db-tb .ln.hd .nm{font-size:12px;font-weight:600;color:var(--ink-muted);display:flex;align-items:flex-end;justify-content:center;gap:5px;padding:0 4px 4px}
.db-tb .ln.hd .nm{justify-content:flex-start;padding-left:8px}
.db-tb .ln .dot,.db-tb .leaf .dot{width:8px;height:8px;border-radius:4px;flex:none;display:inline-block}
.db-tb .ln .nm{position:sticky;left:0;z-index:1;display:flex;align-items:center;gap:6px;border:0;background:var(--surface);font:inherit;text-align:left;color:var(--ink);padding:0 8px;cursor:pointer;border-radius:var(--radius-sm);min-width:0}
.db-tb .ln .nm:hover{background:var(--surface-subtle)}
.db-tb .ln .nm .tx{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.db-tb .ln .nm .cnt{font-size:11px;color:var(--ink-muted);white-space:nowrap}
.db-tb .ln .nm .car{color:var(--ink-muted);flex:none;transition:transform .15s}
.db-tb .ln.l2 .nm .tx{font-weight:500}
.db-tb .ln .c{border:0;border-radius:var(--radius-sm);font:inherit;font-weight:600;color:var(--ink);display:flex;align-items:center;justify-content:center;font-variant-numeric:tabular-nums;cursor:pointer;padding:0 4px}
.db-tb .ln .c.z{color:var(--ink-disabled);cursor:default}
.db-tb .ln .c.sel{box-shadow:inset 0 0 0 2px var(--ink)}
.db-tb .ln .c.t{background:var(--surface-sunken);font-weight:700;cursor:default}
.db-tb .ln.ft{border-top:1px solid var(--border-subtle);padding-top:3px}
.db-tb .ln.ft .nm{font-weight:700;cursor:default}
.db-tb .ln.ft .c{cursor:default;font-weight:700;color:var(--ink-muted)}
.db-tb .leaf{display:grid;grid-template-columns:8px 150px minmax(0,1fr) minmax(0,260px) 120px;gap:12px;align-items:center;min-height:34px;padding-right:8px;border-radius:var(--radius-sm);color:inherit;text-decoration:none;background:var(--surface-subtle)}
.db-tb .leaf:hover{background:var(--surface-sunken)}
.db-tb .leaf .id{font-size:11px;color:var(--ink-muted)}
.db-tb .leaf .tt{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.db-tb .leaf .d{font-size:12px;color:var(--ink-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.db-tb .leaf .st{font-size:12px;color:var(--ink-muted);text-align:right}
.db-tb .leaf .st.late{color:var(--sev-critical-ink);font-weight:600}
.db-tb .more{display:flex;align-items:center;gap:10px;min-height:30px}`;

const TB_SECTION = String.raw`        <section class="p-card c12 db-tb" aria-label="Tabel insiden">
          <div class="lk-card-head" style="align-items: flex-start"><div style="display: flex; flex-direction: column; gap: 2px"><h2 class="p-h2">Tabel insiden</h2><span class="p-cap">{{tbCap}}</span></div>
            <div class="seg" role="radiogroup" aria-label="Ukuran tabel"><sc-for list="{{tbMs}}" as="m" hint-placeholder-count="2"><button type="button" role="radio" aria-checked="{{m.on}}" onClick="{{m.pick}}">{{m.l}}</button></sc-for></div></div>
          <div class="tbar">
            <span class="lb">Baris</span>
            <span class="dd"><button type="button" class="pill" onClick="{{dR1.t}}" aria-expanded="{{dR1.str}}">{{dR1.l}}<svg class="p-ic" viewBox="0 0 24 24" aria-hidden="true" style="width: 12px; height: 12px"><path d="m6 9 6 6 6-6"></path></svg></button><sc-if value="{{dR1.open}}" hint-placeholder-val="{{false}}"><span class="pop" role="menu"><sc-for list="{{dR1.opts}}" as="o" hint-placeholder-count="4"><button type="button" role="menuitemradio" aria-checked="{{o.on}}" onClick="{{o.pick}}">{{o.l}}</button></sc-for></span></sc-if></span>
            <span class="sep">›</span>
            <span class="dd"><button type="button" class="pill {{dR2.cls}}" onClick="{{dR2.t}}" aria-expanded="{{dR2.str}}">{{dR2.l}}<svg class="p-ic" viewBox="0 0 24 24" aria-hidden="true" style="width: 12px; height: 12px"><path d="m6 9 6 6 6-6"></path></svg></button><sc-if value="{{dR2.open}}" hint-placeholder-val="{{false}}"><span class="pop" role="menu"><sc-for list="{{dR2.opts}}" as="o" hint-placeholder-count="4"><button type="button" role="menuitemradio" aria-checked="{{o.on}}" onClick="{{o.pick}}">{{o.l}}</button></sc-for></span></sc-if></span>
            <span class="lb" style="margin-left: 12px">Kolom</span>
            <span class="dd"><button type="button" class="pill {{dCol.cls}}" onClick="{{dCol.t}}" aria-expanded="{{dCol.str}}">{{dCol.l}}<svg class="p-ic" viewBox="0 0 24 24" aria-hidden="true" style="width: 12px; height: 12px"><path d="m6 9 6 6 6-6"></path></svg></button><sc-if value="{{dCol.open}}" hint-placeholder-val="{{false}}"><span class="pop" role="menu"><sc-for list="{{dCol.opts}}" as="o" hint-placeholder-count="4"><button type="button" role="menuitemradio" aria-checked="{{o.on}}" onClick="{{o.pick}}">{{o.l}}</button></sc-for></span></sc-if></span>
            <span style="flex: 1"></span>
            <sc-if value="{{tbAnyOpen}}" hint-placeholder-val="{{false}}"><button type="button" class="lnk" onClick="{{tbCollapse}}">Tutup semua rincian</button></sc-if>
          </div>
          <div class="grid" role="table" aria-label="Tabel insiden">
            <div class="ln hd" role="row" style="grid-template-columns: {{tbGrid}}"><span role="columnheader" class="nm">{{tbRowHead}}</span><sc-for list="{{tbCols}}" as="h" hint-placeholder-count="5"><span role="columnheader" class="c"><i class="dot" style="display: {{h.dD}}; background: {{h.dc}}"></i>{{h.l}}</span></sc-for><span role="columnheader" class="c t">Total</span></div>
            <sc-for list="{{tbLines}}" as="l" hint-placeholder-count="7">
              <sc-if value="{{l.agg}}" hint-placeholder-val="{{true}}"><div class="ln {{l.cls}}" role="row" style="grid-template-columns: {{tbGrid}}"><button type="button" class="nm" role="rowheader" onClick="{{l.tog}}" aria-expanded="{{l.exStr}}" style="padding-left: {{l.pad}}"><svg class="p-ic car" viewBox="0 0 24 24" aria-hidden="true" style="width: 14px; height: 14px; transform: {{l.rot}}"><path d="m9 6 6 6-6 6"></path></svg><span class="tx">{{l.n}}</span><span class="cnt">{{l.sub}}</span></button><sc-for list="{{l.cells}}" as="c" hint-placeholder-count="5"><button type="button" class="c {{c.cls}}" role="cell" style="background: {{c.bg}}" onClick="{{c.go}}" aria-label="{{c.aria}}">{{c.v}}</button></sc-for><span class="c t" role="cell">{{l.tot}}</span></div></sc-if>
              <sc-if value="{{l.leaf}}" hint-placeholder-val="{{false}}"><a class="ln leaf" role="row" href="{{l.href}}" style="padding-left: {{l.pad}}"><i class="dot" style="background: {{l.sc}}" title="{{l.sn}}"></i><span class="p-mono id">{{l.id}}</span><span class="tt">{{l.t}}</span><span class="d">{{l.d}}</span><span class="st {{l.xc}}">{{l.x}}</span></a></sc-if>
              <sc-if value="{{l.more}}" hint-placeholder-val="{{false}}"><div class="ln more" style="padding-left: {{l.pad}}"><span class="p-cap">{{l.mT}}</span><a href="{{l.href}}" class="lk-alink" style="font-size: 12px">{{l.mL}}</a></div></sc-if>
            </sc-for>
            <div class="ln ft" role="row" style="grid-template-columns: {{tbGrid}}"><span class="nm" role="rowheader">Total</span><sc-for list="{{tbFoot}}" as="c" hint-placeholder-count="5"><span class="c" role="cell">{{c}}</span></sc-for><span class="c t" role="cell">{{tbTot}}</span></div>
          </div>
        </section>`;

const TB_LOGIC = String.raw`    // ===== Tabel insiden: pivot ringan + drill-down (menggantikan matriks kategori × wilayah) =====
    const tb = s.tb;
    const setTb = (o) => this.setState({ tb: Object.assign({}, tb, o) });
    // kerugian per insiden: data demo belum punya kerugian per insiden, jadi kerugian area setelah filter (angka yang sama dengan
    // KPI Kerugian) dibagi rata ke insiden area itu. PRODUKSI: nilai kerugian per insiden dari data layer. Lihat DEVIATIONS D-T2.
    // Disimpan per baris (bukan per nomor): data demo tambahan punya nomor yang sama di dua area (INS-BJE-2026-0001..0004).
    const RPI = new Map();
    { const cnt = {}; incS.forEach((r) => { cnt[r[1]] = (cnt[r[1]] || 0) + 1; }); const aRp = {}; SC.forEach((a) => { aRp[a.id] = a.rp; }); incS.forEach((r) => { RPI.set(r, (aRp[r[1]] || 0) / cnt[r[1]]); }); }
    const DIM = { wil: ['Wilayah', (r) => W[AREA[r[1]][1]].n], kkks: ['KKKS', (r) => AREA[r[1]][7].replace(/^PT /, '')], wk: ['Wilayah kerja', (r) => AREA[r[1]][8]], kat: ['Kategori', (r) => CAT[r[2]][0]], lv: ['Level', (r) => LV[r[3]][0]] };
    const DK = skk ? ['wil', 'kkks', 'wk', 'kat', 'lv'] : ['wk', 'kat', 'lv'];
    const mVal = (list) => tb.m === 'rp' ? sum(list.map((r) => RPI.get(r) || 0)) : list.length;
    const fmtV = (v) => tb.m === 'rp' ? (v ? rp(v) : '–') : (v ? String(v) : '–');
    const ordVals = (k, list) => { const u = [...new Set(list.map(DIM[k][1]))]; if (k === 'lv') return LV.map((l) => l[0]).filter((l) => u.includes(l)); if (k === 'wil') return WO.map((w) => W[w].n).filter((n) => u.includes(n)); return u.sort((x, y) => mVal(list.filter((r) => DIM[k][1](r) === y)) - mVal(list.filter((r) => DIM[k][1](r) === x))); };
    const TB = incS;
    const colVals = tb.col ? ordVals(tb.col, TB) : [];
    const cellsOf = (list) => colVals.map((cv) => mVal(list.filter((r) => DIM[tb.col][1](r) === cv)));
    const cMaxAll = (() => { let m = 1; ordVals(tb.r1, TB).forEach((g) => { const l = TB.filter((r) => DIM[tb.r1][1](r) === g); cellsOf(l).forEach((v) => { if (v > m) m = v; }); if (!tb.col) m = Math.max(m, mVal(l)); }); return m; })();
    const tbHeat = (v) => v ? 'color-mix(in srgb, var(--chart-series-1) ' + Math.round(6 + Math.min(1, v / cMaxAll) * 46) + '%, var(--surface))' : 'var(--surface-subtle)';
    const tbLines = [];
    const leafs = (list, key, pad) => {
      const cf = tb.cf && tb.cf.k === key ? tb.cf.v : null;
      const l2 = (cf ? list.filter((r) => DIM[tb.col][1](r) === cf) : list).slice().sort(byPrio);
      l2.slice(0, 5).forEach((r) => { const ir = incRow(r); tbLines.push({ leaf: true, agg: false, more: false, pad, ...ir, d: (skk ? AREA[r[1]][7].replace(/^PT /, '') + ' · ' : '') + AREA[r[1]][8] + ' · ' + r[6], x: stName(r), xc: r[5] ? 'late' : '' }); });
      tbLines.push({ more: true, agg: false, leaf: false, pad, mT: (l2.length > 5 ? '5 dari ' : '') + l2.length + ' insiden' + (cf ? ' · ' + DIM[tb.col][0] + ' ' + cf : ''), mL: 'Buka di daftar insiden', href: listHref });
    };
    const aggLine = (name, list, key, depth, hasKids) => {
      const ex = !!tb.open[key];
      const cv = cellsOf(list);
      tbLines.push({ agg: true, leaf: false, more: false, cls: depth ? 'l2' : 'l1', n: name, sub: '', pad: (8 + depth * 22) + 'px', exStr: ex ? 'true' : 'false', rot: ex ? 'rotate(90deg)' : 'none',
        tog: () => { const o = Object.assign({}, tb.open); if (o[key]) delete o[key]; else o[key] = 1; setTb({ open: o, cf: tb.cf && tb.cf.k === key ? null : tb.cf }); },
        tot: fmtV(mVal(list)),
        cells: cv.map((v, j) => ({ v: fmtV(v), bg: tbHeat(v), cls: v ? (tb.cf && tb.cf.k === key && tb.cf.v === colVals[j] ? 'sel' : '') : 'z', aria: name + ', ' + DIM[tb.col][0] + ' ' + colVals[j] + ': ' + fmtV(v), go: v ? () => { const o = Object.assign({}, tb.open); o[key] = 1; const same = tb.cf && tb.cf.k === key && tb.cf.v === colVals[j]; setTb({ open: o, cf: same ? null : { k: key, v: colVals[j] } }); } : nop })) });
      return ex;
    };
    ordVals(tb.r1, TB).forEach((g) => {
      const l = TB.filter((r) => DIM[tb.r1][1](r) === g);
      const ex = aggLine(g, l, g, 0, !!tb.r2);
      if (!ex) return;
      const cfHere = tb.cf && tb.cf.k === g;
      if (tb.r2 && !cfHere) ordVals(tb.r2, l).forEach((h) => { const l2 = l.filter((r) => DIM[tb.r2][1](r) === h); const k2 = g + '|' + h; if (aggLine(h, l2, k2, 1, false)) leafs(l2, k2, '52px'); });
      else leafs(l, g, '30px');
    });
    const tbNcol = colVals.length;
    const tbGrid = 'minmax(220px, 1.6fr)' + (tbNcol ? ' repeat(' + tbNcol + ', minmax(72px, 1fr))' : '') + ' 88px';
    const ddOf = (slot, cur, opts, ph) => ({ l: cur ? DIM[cur][0] : ph, cls: cur ? '' : 'ph', open: tb.dd === slot, str: tb.dd === slot ? 'true' : 'false', t: () => setTb({ dd: tb.dd === slot ? null : slot }),
      opts: opts.map((k) => ({ l: k ? DIM[k][0] : (slot === 'col' ? 'Tanpa kolom' : 'Tanpa rincian'), on: k === cur ? 'true' : 'false', pick: () => { const o = { dd: null, open: {}, cf: null }; o[slot] = k; if (slot === 'r1' && k === tb.r2) o.r2 = null; if (slot !== 'col' && k && k === tb.col) o.col = null; setTb(o); } })) });
    const dR1 = ddOf('r1', tb.r1, DK, '');
    const dR2 = ddOf('r2', tb.r2, [null].concat(DK.filter((k) => k !== tb.r1 && k !== tb.col)), '+ Rincikan');
    const dCol = ddOf('col', tb.col, [null].concat(DK.filter((k) => k !== tb.r1 && k !== tb.r2)), 'Tanpa kolom');
    const tbFootV = cellsOf(TB).map(fmtV);`;

const TB_RETURN = String.raw`      tbCap: TB.length + ' insiden terverifikasi · klik baris untuk merinci, klik angka untuk melihat insidennya' + (dttOn ? ' · DTT tidak termasuk' : ''),
      tbMs: [['n', 'Jumlah'], ['rp', 'Kerugian']].map(([k, l]) => ({ l, on: tb.m === k ? 'true' : 'false', pick: () => setTb({ m: k }) })),
      dR1, dR2, dCol, tbGrid, tbRowHead: DIM[tb.r1][0] + (tb.r2 ? ' › ' + DIM[tb.r2][0] : ''), tbCols: colVals.map((v) => { const li = LV.findIndex((l) => l[0] === v); return { l: v, dD: tb.col === 'lv' ? 'inline-block' : 'none', dc: li >= 0 ? LV[li][1] : 'transparent' }; }),
      tbLines, tbFoot: tbFootV, tbTot: fmtV(mVal(TB)), tbAnyOpen: Object.keys(tb.open).length > 0, tbCollapse: () => setTb({ open: {}, cf: null }),`;

/** [cari, ganti] pada teks .dc.html */
export const SOURCE_PATCHES = [
  [/\.db-mx\{[^\n]*\n(?:\.db-mx [^\n]*\n)*/, () => TB_CSS + '\n'],
  [/        <section class="p-card c12">\n          <div class="lk-card-head"><div style="display: flex; flex-direction: column; gap: 2px"><h2 class="p-h2">\{\{mxTitle\}\}[\s\S]*?<\/section>/, () => TB_SECTION],
];

/** [cari, ganti] pada kelas logika (dipasang sebelum PERIOD_PATCHES) */
export const TABLE_LOGIC_PATCHES = [
  ["ask: p.tanya === true ? 'kkks' : (p.tanya || null), askAll: false };", "ask: p.tanya === true ? 'kkks' : (p.tanya || null), askAll: false, tb: { r1: 'kat', r2: null, col: kk ? 'lv' : 'wil', m: 'n', open: {}, cf: null, dd: null } };"],
  [/    \/\/ ===== matriks =====[\s\S]*?\n    \}\n\n(    \/\/ ===== filter aktif =====)/, (_, tail) => TB_LOGIC + '\n\n' + tail],
  [/      mxTitle:[^\n]*\n      mxCap:[^\n]*\n      mxCols, mxRows,/, () => TB_RETURN],
];
