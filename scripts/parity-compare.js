// Pembanding paritas visual: board desain asli vs aplikasi. Tempel di konsol browser pada http://localhost:5173 (npm run dev).
// Board disajikan middleware dev di /__ref (lihat vite.config.ts; butuh design-ref/project/support.js = artifact-type/dc-runtime.js).
//
// Pemakaian:
//   await __cmp2([
//     { name: 'Main', ref: 'Main.dc.html', app: '/insiden', role: 'pelapor' },
//     { name: 'P12', ref: 'P12-Penanganan.dc.html', app: '/insiden/INS-SEN-2026-0007', role: 'pic', scen: 'approved' },
//     { name: 'MS07', ref: 'MS07-TarikKembali.dc.html', app: '/insiden/INS-SEN-2026-0007', w: 390, act: (d) => d.querySelector('[aria-label^="Aksi lain"]').click() },
//   ])
// Opsi kasus: role, scen (fresh | approved | closure | waDraft), w (lebar; 390 = mobile), act(doc) (klik untuk membuka sheet/dialog), wait, max.
// Hasil: cover = % baris teks board yang juga ada di app; geo = jumlah elemen (kartu, appbar, tabel, stepper) yang posisi/ukurannya
// beda > 3 px (angka tidak bermakna di mobile); miss = contoh teks board yang tidak ada di app.
// Catatan: state yang ditumpuk dalam satu artboard (tersembunyi) dan teks yang terpecah node ikut terhitung "miss".
(() => {
  const KEY = 'perisai-insiden-demo/v1';
  const put = (s, ns, role) => localStorage.setItem(KEY, JSON.stringify({ state: { ...s, ...ns, role }, version: 4 }));
  window.__scen = {
    async fresh(role) {
      const { seedState } = await import('/src/services/mock/seed.ts');
      put(seedState(), {}, role);
    },
    /** INS-0007 disetujui Pejabat: PIC Andi Pratama, tenggat dari konfigurasi. */
    async approved(role) {
      const { seedState } = await import('/src/services/mock/seed.ts');
      const { approve } = await import('/src/services/mock/workflow.ts');
      const s = seedState();
      const r = approve({ incidents: s.incidents, kerawanan: s.kerawanan, config: s.config }, 'INS-SEN-2026-0007', {
        by: 'Sari Wulandari', category: 'Pencurian/Perampokan', severity: 'tinggi', priority: 'tinggi', pic: 'Andi Pratama', picKind: 'perorangan', steps: ['Ganti kabel dan pastikan pengamanan panel.'],
      });
      put(s, { incidents: r.state.incidents }, role);
    },
    /** Insiden Minta ditutup (INS-SEN-2026-0012) dengan data penutupan lengkap. */
    async closure(role) {
      const { seedState } = await import('/src/services/mock/seed.ts');
      const { closureDemoIncident } = await import('/src/services/mock/seedClosure.ts');
      const s = seedState();
      put(s, { incidents: [closureDemoIncident(), ...s.incidents] }, role);
    },
    /** Draf WhatsApp dari pesan WAM-003 (WAD-003). */
    async waDraft(role) {
      const { seedState } = await import('/src/services/mock/seed.ts');
      const W = await import('/src/services/mock/workflow.wa.ts');
      const E = await import('/src/features/whatsapp/logic/extract.ts');
      const M = await import('/src/services/ai/mock.ts');
      const s = seedState();
      const sl = { incidents: s.incidents, kerawanan: s.kerawanan, config: s.config, followUps: s.followUps, waMessages: s.waMessages, waDrafts: s.waDrafts };
      const msg = s.waMessages.find((m) => m.id === 'WAM-003');
      const sg = E.buildSuggestion(msg, M.extractStory(msg.text));
      const r = W.createWaDraft(sl, { messageId: 'WAM-003', by: 'Budi Santoso', form: sg.form, ai: sg.ai, aiState: 'ok' });
      put(s, r.ok ? { ...sl, ...r.state } : sl, role);
    },
  };
  window.__cmp2 = async function (cases) {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const lines = (doc) => {
      const root = doc.querySelector('.lk-main') || doc.querySelector('.in-m') || doc.body;
      const out = [];
      const w = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = w.nextNode())) {
        const t = n.nodeValue.replace(/\s+/g, ' ').trim();
        if (t && n.parentElement && !['STYLE', 'SCRIPT'].includes(n.parentElement.tagName)) out.push(t);
      }
      return out;
    };
    const geo = (doc) =>
      [...doc.querySelectorAll('.p-card,.p-appbar,.p-stepper,.lk-ffoot,.p-table')].map((e) => {
        const r = e.getBoundingClientRect();
        return [e.className.split(' ')[0], Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
      });
    const load = (src, w) =>
      new Promise((res) => {
        const f = document.createElement('iframe');
        f.style.cssText = `position:fixed;left:-5000px;top:0;width:${w}px;height:1000px;border:0`;
        f.onload = () => res(f);
        f.src = src;
        document.body.appendChild(f);
      });
    const results = [];
    for (const c of cases) {
      await window.__scen[c.scen || 'fresh'](c.role || 'pelapor');
      const w = c.w || 1366;
      const rf = await load('/__ref/' + c.ref, w);
      const af = await load(c.app, w);
      await sleep(c.wait || 1500);
      try {
        if (c.act) {
          await c.act(af.contentDocument, rf.contentDocument);
          await sleep(500);
        }
        const rl = lines(rf.contentDocument);
        const aset = new Set(lines(af.contentDocument));
        const g1 = geo(rf.contentDocument);
        const g2 = geo(af.contentDocument);
        const geoDiffs = g1.length === g2.length ? g1.filter((a, i) => [1, 2, 3, 4].some((k) => Math.abs(a[k] - g2[i][k]) > 3)).length : `n${g1.length}/${g2.length}`;
        results.push({ name: c.name, cover: rl.length ? Math.round((100 * (rl.length - rl.filter((x) => !aset.has(x)).length)) / rl.length) : 0, geo: geoDiffs, miss: [...new Set(rl.filter((x) => !aset.has(x)))].slice(0, c.max || 6) });
      } catch (e) {
        results.push({ name: c.name, error: String(e).slice(0, 120) });
      }
      rf.remove();
      af.remove();
    }
    return results;
  };
})();
