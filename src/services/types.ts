import type { Severity } from '@/lib/severity';
import type { DeadlineConfig } from '@/lib/deadline';
import type { LossThresholds } from '@/lib/severity';
import type { Role } from '@/lib/rbac';

export type IncidentStatus =
  | 'draf'
  | 'review-internal'
  | 'perlu-perbaikan'
  | 'dalam-penanganan'
  | 'minta-ditutup'
  | 'ditutup'
  | 'dibatalkan'
  | 'digabung';

export const STATUS_LABEL: Record<IncidentStatus, string> = {
  draf: 'Draf',
  'review-internal': 'Menunggu pemeriksaan',
  'perlu-perbaikan': 'Perlu perbaikan',
  'dalam-penanganan': 'Dalam penanganan',
  'minta-ditutup': 'Menunggu penutupan',
  ditutup: 'Ditutup',
  dibatalkan: 'Dibatalkan',
  digabung: 'Digabung',
};
/** class Tag status dari board (t-draft, t-caution, t-info, t-ok, ...) */
export const STATUS_TAG: Record<IncidentStatus, string> = {
  draf: 't-draft',
  'review-internal': 't-info',
  'perlu-perbaikan': 't-caution',
  'dalam-penanganan': 't-info',
  'minta-ditutup': 't-info',
  ditutup: 't-ok',
  dibatalkan: 't-draft',
  digabung: 't-draft',
};

export interface TimelineEntry {
  at: string;
  by: string;
  text: string;
  /** jumlah foto progres pada catatan tindak lanjut */
  photos?: number;
}

/** Isi laporan yang dipakai layar detail/review (salinan field draf Pelapor). */
export interface IncidentDetail {
  story: string;
  securityImpact: string;
  axes: import('@/features/insiden/logic/draft').Axis[];
  ops: import('@/lib/severity').OpsImpact | null;
  opsHours: number | null;
  ongoing: boolean;
  lossIdr: number | null;
  casualties: Partial<Record<import('@/lib/severity').CasualtyKind, number>>;
  handledBy: import('@/services/ai/types').HandledBy[];
  /** tindakan awal yang sudah dilakukan (laporan lama belum punya) */
  initialAction?: string;
  patokan: string;
  lat: number | null;
  lng: number | null;
  attachments: { name: string; sizeKb: number; caption: string }[];
  /** keparahan menurut pelapor dan alasan bila beda dari saran */
  reporterSeverity: Severity | null;
  severityReason: string;
  suggestedSeverity: Severity | null;
  jenis: string | null;
  /** B-3: Temuan langsung / Laporan pihak lain */
  infoSource?: 'langsung' | 'pihak-lain';
  /** B-11: dampak yang ditandai Belum diketahui saat melapor */
  lossUnknown?: boolean;
  opsUnknown?: boolean;
  /** sebaran dampak dan besar data bocor (teks chip, termasuk "Belum diketahui") */
  envNote?: string;
  dataNote?: string;
  /** B-12: penangan lain (chip Lainnya) */
  handledOther?: string;
  /** nama lokasi dari peta (judul kartu Lokasi) */
  locationName?: string;
}

/** Hasil pengamanan (F2, wajib) dan status proses hukum (F3, opsional) pada Data penutupan. */
export type SecurityOutcome = 'digagalkan' | 'tertangkap' | 'keduanya' | 'tidak-ada';
export const SECURITY_OUTCOME_LABEL: Record<SecurityOutcome, string> = {
  digagalkan: 'Aksi digagalkan', tertangkap: 'Pelaku tertangkap', keduanya: 'Keduanya', 'tidak-ada': 'Tidak ada',
};
export type LegalStatus = 'tidak-diproses' | 'dilaporkan' | 'penyidikan' | 'penuntutan' | 'putusan' | 'dihentikan';
export const LEGAL_STATUS_LABEL: Record<LegalStatus, string> = {
  'tidak-diproses': 'Tidak diproses', dilaporkan: 'Dilaporkan ke polisi', penyidikan: 'Penyidikan',
  penuntutan: 'Penuntutan atau sidang', putusan: 'Putusan', dihentikan: 'Dihentikan',
};
export interface LegalProcess {
  status: LegalStatus;
  /** nomor laporan polisi, maks. 50 karakter */
  lpNo?: string;
  updatedAt?: string;
  updatedBy?: string;
}

/** Data penutupan yang diisi PIC (P16) dan dikonfirmasi Pejabat (P22). Semua opsional sampai PIC mengisi. */
export interface Closure {
  /** Tim terlibat (mitra); wajib diisi PIC, tanpa nama personel */
  partners: import('@/services/ai/types').HandledBy[];
  /** rincian korban per tingkat cedera (PIC) */
  casualtiesFinal: Partial<Record<import('@/lib/severity').CasualtyKind, number>>;
  lossFinalIdr: number | null;
  opsHoursFinal: number | null;
  cause: string;
  actions: string;
  outcome: string;
  /** waktu PIC mengajukan penutupan */
  requestedAt?: string;
  /** pilihan "Diperiksa oleh" saat mengajukan; null/kosong = semua Pejabat */
  reviewers?: string[] | null;
  /** alasan bila Pejabat mengembalikan ke PIC */
  returnReason?: string;
  closedAt?: string;
  closedBy?: string;
  /** kontrak mitra yang dikonfirmasi Pejabat saat tinjau penutupan */
  confirmedContracts?: boolean;
  /** nama mitra terpilih (P16), mis. "PT Garda Nusantara Sejahtera · BUJP"; `partners` memuat jenisnya */
  partnerNames?: string[];
  /** penjelasan penyebab (opsional) */
  causeDetail?: string;
  /** faktor penyebab (wajib, satu atau lebih) */
  factors?: string[];
  /** bukti penyelesaian (wajib, minimal 1 file) */
  evidence?: { name: string; sizeKb: number; caption: string }[];
  /** (layar Pejabat) PIC yang mengajukan penutupan */
  requestedBy?: string;
  /** ringkasan hasil yang tampil di Data penutupan; bila kosong dipakai `outcome` */
  summary?: string;
  /** kontrak mitra (diisi awal dari kontrak aktif, dikonfirmasi Pejabat) */
  contracts?: { partner: string; ref: string }[];
  closureNote?: string;
  followUpChoice?: 'lanjut' | 'batal';
  followUpCancelReason?: string;
  /** klaim di Data penutupan yang harus cocok dengan tindak lanjut tertentu (bahan "Belum cocok") */
  claims?: { text: string; followUpTitle: string }[];
  /** langkah penanganan hasil ringkasan AI (bahan pertimbangan Pejabat); `at` = waktu entri sumber */
  aiSteps?: { at: string; text: string; source: string; orig?: string }[];
  /** waktu operasi pulih menurut teks Data penutupan (AI, perlu dicek) */
  aiRestoredAt?: string;
  /** F1 (opsional): waktu operasi pulih, ISO lokal zona WK */
  restoredAt?: string;
  /** F2 (wajib): hasil pengamanan */
  result?: SecurityOutcome;
  /** F3 (opsional): proses hukum; bisa diperbarui setelah insiden Ditutup */
  legal?: LegalProcess;
}

export interface FollowUpItem {
  id: string;
  title: string;
  dueAt: string;
  status: 'belum-dimulai' | 'dikerjakan' | 'selesai' | 'dibatalkan';
  owner: string;
  /** bila berasal dari modul Tindak lanjut: nomor TL dan status aslinya */
  tl?: string;
  tlStatus?: FollowUpStatus;
}

export interface Directive {
  at: string;
  by: string;
  text: string;
  /** sudah dijadikan tindak lanjut */
  followUp?: boolean;
}

/** Data penanganan (PIC, penutupan, eskalasi, arahan SKK). Undefined = belum ada. */
export interface HandlingData {
  /** catatan kerja PIC (halaman Tangani) */
  notes: TimelineEntry[];
  closure?: Closure;
  /** tujuan eskalasi bila dieskalasi manual/otomatis */
  escalatedTo?: 'pejabat' | 'skk';
  escalationReason?: string;
  directives: Directive[];
  /** PIC grup: anggota yang sudah mengambil alih */
  takenBy?: string;
  reopenedAt?: string;
  dueChangeReason?: string;
  /** daftar langkah (saran dari insiden serupa) yang dicentang PIC */
  stepsDone?: string[];
  /** saran langkah yang diabaikan PIC */
  stepsIgnored?: string[];
  /** nama penerima eskalasi manual */
  escalatedName?: string;
  /** tindak lanjut (dibangun fase 6); layar Pejabat hanya menampilkan dan membatalkan */
  followUps?: FollowUpItem[];
  /** lampiran per catatan/entri riwayat, kunci = waktu entri */
  noteFiles?: Record<string, string[]>;
  /** PIC lama yang tidak aktif lagi */
  picPrev?: string;
  picInactiveSince?: string;
  /** tenggat sebelum diubah Pejabat */
  dueDefaultAt?: string;
}

export type Priority = 'tinggi' | 'normal' | 'rendah';

export interface Incident {
  no: string;
  title: string;
  category: string;
  /** lokasi singkat untuk daftar Pelapor, mis. "Terminal Arunika · pagar utara" */
  location: string;
  /** kabupaten · WK untuk daftar Pejabat/SKK */
  area: string;
  wk: string;
  org: string;
  severity: Severity | null;
  occurredAt: string;
  status: IncidentStatus;
  /** nama PIC atau null */
  pic: string | null;
  reporter: string;
  /** tenggat pemeriksaan (Menunggu pemeriksaan) */
  verifyDueAt?: string;
  /** tenggat penanganan */
  handleDueAt?: string;
  /** hari kerja tenggat yang dipakai saat Setujui (konfigurasi, atau nilai yang diubah Pejabat) */
  handleDays?: number;
  late?: boolean;
  escalated?: boolean;
  possibleDuplicate?: boolean;
  /** nomor induk bila digabung */
  mergedInto?: string;
  /** nomor KRW asal bila dinaikkan dari kerawanan */
  fromKrw?: string;
  source?: 'form' | 'wa';
  /** ASSUMPTION: peran yang tidak melihat insiden ini di daftarnya (menyelaraskan seed dengan hitungan board Main = 6) */
  detail?: IncidentDetail;
  handling?: HandlingData;
  timeline?: TimelineEntry[];
  /** keputusan Pejabat saat Setujui */
  priority?: Priority;
  picKind?: 'perorangan' | 'grup';
  /** saran langkah dari insiden serupa yang dikirim ke PIC */
  forwardedSteps?: string[];
  /** alasan bila keparahan resmi beda dari pelapor */
  officialSeverityReason?: string;
  revisionReason?: string;
  cancelReason?: string;
  restricted?: boolean;
  /** SKK sudah diberi tahu (Tinggi/Kritis) */
  skkNotified?: boolean;
  hiddenFor?: import('@/lib/rbac').Role[];
  /** Dinaikkan dari kerawanan (fase 5): alasan, pelaku, waktu; `verifiedBy` terisi bila langsung disetujui */
  raisedReason?: string;
  raisedBy?: string;
  raisedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface Kerawanan {
  no: string;
  title: string;
  category: string;
  location: string;
  wk: string;
  org: string;
  reporter: string;
  observedAt: string;
  worsening?: boolean;
  /** nomor insiden bila sudah dinaikkan */
  raisedTo?: string;
  /** nomor insiden asal bila kerawanan ini hasil Jadikan kerawanan */
  convertedFrom?: string;
  convertReason?: string;
  /** Fase 5 (alur Kerawanan setelah tercatat). Semua opsional; tampilan memakai `resolveKerawanan`. */
  /** jenis kerawanan: Kondisi rawan | Kejadian tanpa dampak | Upaya digagalkan */
  kind?: string;
  /** "Kondisi yang ditemukan" */
  story?: string;
  patokan?: string;
  /** sumber informasi, mis. Patroli */
  source?: string;
  lat?: number | null;
  lng?: number | null;
  /** baris kedua lokasi, mis. "Kab. Musi Banyuasin · Dalam WK Andalas Darat" */
  area?: string;
  /** waktu tercatat di sistem (berbeda dari `observedAt` = waktu diketahui) */
  recordedAt?: string;
  attachments?: { name: string; sizeKb: number; caption: string }[];
  /** perkembangan yang ditambahkan setelah tercatat (KD6); `worsening` = tanda Makin rawan */
  progress?: KerawananProgress[];
}

export interface KerawananProgress {
  at: string;
  by: string;
  text: string;
  worsening: boolean;
  photos?: string[];
}

/** Entri riwayat perubahan Konfigurasi Modul (Tenggat penanganan, Matriks keparahan). */
export interface ConfigChange {
  key: 'tenggat' | 'matriks';
  /** ISO tanpa zona, dianggap WIB */
  at: string;
  by: string;
  /** label peran, mis. "Admin SKK" */
  role?: string;
  /** ringkasan: "Kritis 1 → 2 hari" atau keterangan versi matriks */
  text: string;
  /** hanya matriks: nomor versi dan tanggal mulai berlaku (YYYY-MM-DD) */
  version?: number;
  effectiveFrom?: string;
  /** dasar perubahan (matriks) */
  basis?: string;
}

export interface ModuleConfig {
  deadlines: DeadlineConfig;
  lossThresholdsUsd: LossThresholds;
  /** ASSUMPTION: kurs tunggal untuk demo; board memakai kurs per tanggal kejadian */
  kursIdrPerUsd: number;
  /** riwayat perubahan, terbaru di depan; opsional agar state lama tetap valid */
  history?: ConfigChange[];
}

/** Tindak lanjut (fase 6, modul INS-06): tugas lanjutan ber-PIC dan bertenggat sendiri yang bersumber dari insiden. */
export type FollowUpStatus = 'belum-dimulai' | 'berjalan' | 'menunggu-verifikasi' | 'dikembalikan' | 'selesai' | 'dibatalkan';
export type FollowUpSource = 'manual' | 'arahan-skk' | 'saran-verifikator';

export const FOLLOWUP_LABEL: Record<FollowUpStatus, string> = {
  'belum-dimulai': 'Belum dimulai',
  berjalan: 'Dikerjakan',
  'menunggu-verifikasi': 'Menunggu pemeriksaan',
  dikembalikan: 'Dikembalikan',
  selesai: 'Selesai',
  dibatalkan: 'Dibatalkan',
};
export const FOLLOWUP_TAG: Record<FollowUpStatus, string> = {
  'belum-dimulai': 't-muted',
  berjalan: 't-info',
  'menunggu-verifikasi': 't-caution',
  dikembalikan: 't-caution',
  selesai: 't-ok',
  dibatalkan: 't-muted',
};

export interface FollowUpFile {
  name: string;
  sizeKb: number;
  /** waktu diunggah (ISO lokal) */
  at?: string;
}

export interface FollowUp {
  /** TL-SEN-2026-NNNN */
  no: string;
  incidentNo: string;
  /** "Tindakan" (maks. 300 karakter) */
  action: string;
  /** nama PIC tindak lanjut */
  pic: string;
  /** tenggat, ISO tanpa zona (hari, jam 17:00) */
  dueAt: string;
  status: FollowUpStatus;
  source: FollowUpSource;
  /** keterangan sumber, mis. nama pemeriksa atau pengirim arahan */
  sourceLabel?: string;
  /** pemberi tugas dan pemeriksa saat dibuat (pemeriksa sebenarnya = PIC insiden saat ini) */
  createdBy: string;
  createdAt: string;
  /** bukti yang diharapkan dari PIC (opsional, maks. 200 karakter) */
  expectedEvidence?: string;
  evidence: FollowUpFile[];
  notes: TimelineEntry[];
  submittedAt?: string;
  completionNote?: string;
  returnReason?: string;
  returnedAt?: string;
  returnedBy?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  /** jenis sumber (bawaan insiden); kerawanan memakai krwNo, arahan memakai arahan */
  sourceKind?: 'insiden' | 'kerawanan' | 'arahan';
  krwNo?: string;
  arahan?: { date: string; channel: string; giver: string; title: string; doc?: string };
  /** tenggat awal bila pernah diubah (KPI memakai ini) */
  dueAtOriginal?: string;
  /** tanggal selesai = tanggal pengajuan */
  finishedAt?: string;
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  history: TimelineEntry[];
}

/** Insiden dari pesan WhatsApp (modul INS-05). Foto pesan ikut sebagai lampiran draf. */
export interface WaPhoto {
  id: string;
  name: string;
  sizeKb: number;
}

/** Satu tautan pesan → insiden. `kind` 'laporan' = pesan sumber laporan (tidak bisa dilepas), 'tautan' = kabar lanjutan. */
export interface WaLinkRecord {
  incidentNo: string;
  kind: 'laporan' | 'tautan';
  by: string;
  at: string;
  releasedBy?: string;
  releasedAt?: string;
  releaseReason?: string;
}

/** Syarat aturan penangkapan (PRD WhatsApp Sitrep Capture §7). Semua opsional; kelompok kosong = tanpa syarat. */
export interface WaRuleCond {
  groupIds?: string[];
  senders?: string[];
  startsWith?: string[];
  containsAny?: string[];
  containsAll?: string[];
  kinds?: string[];
  minLen?: number;
  maxLen?: number;
}
export interface WaRule {
  id: string;
  name: string;
  enabled: boolean;
  /** aturan bawaan tidak bisa dihapus, hanya dimatikan */
  builtin?: boolean;
  priority: boolean;
  ignore: WaRuleCond;
  capture: WaRuleCond;
  /** sertakan pesan lanjutan: maksimal `count` pesan dalam `minutes` menit */
  followUp?: { count: number; minutes: number };
  /** saran jenis laporan (hanya di aturan) */
  suggestKind?: 'insiden' | 'kerawanan';
}
export type WaNumberStatus = 'terhubung' | 'menunggu' | 'terputus' | 'ditangguhkan';
/** Nomor WhatsApp organisasi yang ditautkan (maks. 3 per KKKS, parameter wa_max_numbers_per_org). */
export interface WaNumber {
  id: string;
  label: string;
  phone: string;
  status: WaNumberStatus;
  linkedAt?: string;
  /** perangkat tertaut di ponsel (maks. 4) */
  devices: string[];
  suspendedReason?: string;
}
/** Anggota grup (nomor disamarkan). Nomor milik organisasi sendiri tidak disimpan di sini, ditampilkan sebagai "Nomor ini". */
export interface WaMember { name?: string; phone: string }
export interface WaGroup {
  id: string;
  numberId: string;
  name: string;
  monitored: boolean;
  wk?: string;
  area?: string;
  /** grup baru di ponsel yang belum dipantau */
  isNew?: boolean;
  /** nomor dikeluarkan dari grup */
  removed?: boolean;
  /** anggota selain nomor organisasi (board V2-56) */
  members?: WaMember[];
  /** ISO tanpa zona: kapan daftar anggota terakhir diperbarui */
  membersAt?: string;
  tags?: string[];
  description?: string;
  /** ISO tanpa zona: kapan mulai dipantau */
  monitoredSince?: string;
  /** jumlah pesan yang diperiksa hari ini (contoh) */
  checkedToday?: number;
}
export const WA_MAX_NUMBERS = 3;

/** Pesan masuk dari grup WhatsApp pengamanan (Pemantauan WhatsApp). Status: baru → draf → diproses; lepas tautan → baru. */
export interface WaMessage {
  id: string;
  sender: string;
  /** mis. "Danru BUJP" */
  senderRole: string;
  group: string;
  text: string;
  /** waktu pesan masuk, ISO tanpa zona (WIB) */
  at: string;
  photos: WaPhoto[];
  /** baru = Perlu ditinjau; prioritas ditandai lewat `priority` */
  status: 'baru' | 'draf' | 'diproses' | 'rutin' | 'tidak-relevan';
  draftId?: string;
  /** id grup dan nomor sumber (Pemantauan WhatsApp v2) */
  groupId?: string;
  numberId?: string;
  priority?: boolean;
  /** id aturan yang menangkap */
  ruleIds?: string[];
  /** bubble lanjutan (teks) yang bergabung ke pesan ini */
  bubbles?: { text: string; at: string }[];
  irrelevantReason?: string;
  /** catatan jejak: ditandai/diproses oleh siapa dan kapan */
  handledBy?: string;
  handledAt?: string;
  /** riwayat tautan; yang aktif = terakhir tanpa `releasedAt` */
  links: WaLinkRecord[];
}

export interface WaAiField {
  /** kutipan pesan yang jadi dasar saran */
  src: string;
  confidence: 'hi' | 'md';
  /** keyakinan sedang atau isian bebas: diberi tanda "Perlu dicek" sampai Pelapor menekan "Sudah sesuai" */
  needsCheck: boolean;
  checked?: boolean;
}

/** Draf laporan yang dibuat dari satu pesan WhatsApp. `form` memakai bentuk draf form lapor desktop. */
export interface WaDraft {
  id: string;
  messageId: string;
  createdAt: string;
  createdBy: string;
  form: import('@/features/insiden/logic/draft').ReportDraft;
  /** saran AI per isian (kunci: kind, time, title, patokan, category, securityImpact, axes, handledBy, caption:<id>) */
  ai: Record<string, WaAiField>;
  /** 'gagal' = saran AI tidak tersedia; Pelapor mengisi manual */
  aiState: 'ok' | 'gagal';
  /** keputusan kemungkinan ganda: null = belum, 'tetap' = ajukan sebagai insiden baru */
  dupChoice: 'tetap' | null;
}

export interface DemoState {
  role: Role;
  incidents: Incident[];
  kerawanan: Kerawanan[];
  config: ModuleConfig;
  followUps: FollowUp[];
  waMessages: WaMessage[];
  waDrafts: WaDraft[];
  waNumbers: WaNumber[];
  waGroups: WaGroup[];
  waRules: WaRule[];
  /** nama pengguna yang sudah menyetujui ketentuan pemakaian Pemantauan WhatsApp */
  waTerms: string[];
}
