// Ikon jenis sumber tindak lanjut: Insiden (segitiga), Kerawanan (mata), Arahan SKK (dokumen). Dipakai tabel dan Papan.
const SRC_ICON = {
  insiden: 'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01',
  kerawanan: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  arahan: 'M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9zM14 3v6h6M8 13h8M8 17h5',
};
const SRC_TITLE = { insiden: 'Sumber: Insiden', kerawanan: 'Sumber: Kerawanan', arahan: 'Sumber: Arahan SKK' };

export const SrcIc = ({ k, size = 15 }: { k: keyof typeof SRC_ICON; size?: number }) => (
  <svg className="p-ic src-ic" viewBox="0 0 24 24" aria-hidden="true" style={{ width: size, height: size }}><title>{SRC_TITLE[k]}</title><path d={SRC_ICON[k]} /></svg>
);
