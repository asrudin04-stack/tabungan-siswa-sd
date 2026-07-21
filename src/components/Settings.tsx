import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Upload, 
  Download, 
  Trash2, 
  Users, 
  FileSpreadsheet, 
  AlertTriangle, 
  Check, 
  CheckCircle2, 
  RefreshCw, 
  Clipboard, 
  Info,
  HelpCircle,
  Sparkles,
  FileCheck2,
  Phone
} from 'lucide-react';
import { Student, Transaction, GradeClass } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface SettingsProps {
  students: Student[];
  transactions: Transaction[];
  onImportData: (importedStudents: Student[], importedTransactions: Transaction[]) => void;
  onClearDatabase: () => void;
  onAddStudent: (student: Omit<Student, 'id' | 'createdAt' | 'balance'>, initialDeposit: number) => Student;
  onBulkImportStudents: (newStudentsList: Array<Omit<Student, 'id' | 'createdAt' | 'balance'> & { initialDeposit: number }>) => void;
}

export default function Settings({ 
  students, 
  transactions, 
  onImportData, 
  onClearDatabase,
  onAddStudent,
  onBulkImportStudents
}: SettingsProps) {
  // Database backup actions states
  const [dbStateMsg, setDbStateMsg] = useState<{ text: string; success: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [showConfirmResetPanel, setShowConfirmResetPanel] = useState(false);

  // Raw bulk-import tab & text area states
  const [importMode, setImportMode] = useState<'TEXT' | 'FILE_JSON'>('TEXT');
  const [rawPasteText, setRawPasteText] = useState(
    "Ahmad Rafli, 5A, 12001, Sunarto, 0812345678, 50000\n" +
    "Siti Aminah, 5A, 12002, Ahmad Yani, 0812999911, 20000\n" +
    "Reza Rahadian, 5B, 12003, Bambang Tri, 0813888822, 0"
  );
  const [parsedPreviewList, setParsedPreviewList] = useState<Array<{
    name: string;
    grade: GradeClass;
    nis: string;
    parentName: string;
    phone: string;
    initialDeposit: number;
    isValid: boolean;
    errorReason?: string;
  }>>([]);
  const [isParsed, setIsParsed] = useState(false);

  // Parser helper matching typical raw text separated by Comma, Semicolon or Tab
  const handleParseText = () => {
    if (!rawPasteText.trim()) {
      setDbStateMsg({ text: 'Mohon masukkan teks daftar siswa terlebih dahulu.', success: false });
      return;
    }

    const lines = rawPasteText.split('\n');
    const parsed: typeof parsedPreviewList = [];

    // Valid Grade classes lookup map helper
    const validGrades: GradeClass[] = [
      '5A', '5B'
    ];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return; // Skip blank lines

      // Clean typical CSV/tsv delimiters
      let parts = trimmed.split(/,|\t|;/);
      
      // Filter out empty parts
      parts = parts.map(part => part.trim());

      // Try parsing values safely
      const name = parts[0] || '';
      let gradeInput = parts[1] || '';
      const nis = parts[2] || '';
      const parentName = parts[3] || '';
      const phone = parts[4] || '';
      const rawDeposit = parts[5] || '0';

      // Skip header lines optionally
      if (name.toLowerCase().includes('nama') || name.toLowerCase().includes('student') || name.toLowerCase().includes('nis')) {
        return; // skip matching header rows safely
      }

      // Fallback grade resolution (e.g. default to 5A/5B)
      let resolvedGrade: GradeClass = '5A';
      let gradeNormalized = gradeInput.toUpperCase().replace(/\s/g, '');
      
      if (validGrades.includes(gradeNormalized as GradeClass)) {
        resolvedGrade = gradeNormalized as GradeClass;
      } else {
        // Try matching letters A or B
        const isB = gradeNormalized.includes('B');
        resolvedGrade = isB ? '5B' : '5A';
      }

      // Convert deposit cleanly
      const cleanDepositString = rawDeposit.replace(/[Rp.\s-]/g, '');
      const initialDeposit = parseInt(cleanDepositString, 10) || 0;

      // Basic integrity rules check
      let isValid = true;
      let errorReason = '';

      if (!name) {
        isValid = false;
        errorReason = 'Nama kosong';
      } else if (!nis) {
        isValid = false;
        errorReason = 'NIS kosong';
      }

      // Check duplicate NIS in system or within preview
      const isDuplicateInApp = students.some(s => s.nis === nis);
      const isDuplicateInPreview = parsed.some(p => p.nis === nis);
      if (isDuplicateInApp) {
        isValid = false;
        errorReason = 'NIS sudah terdaftar';
      } else if (isDuplicateInPreview) {
        isValid = false;
        errorReason = 'NIS terduplikasi dalam daftar';
      }

      parsed.push({
        name,
        grade: resolvedGrade,
        nis,
        parentName,
        phone,
        initialDeposit,
        isValid,
        errorReason
      });
    });

    setParsedPreviewList(parsed);
    setIsParsed(true);
    setDbStateMsg({ text: `Berhasil menganalisis ${parsed.length} baris data! Silakan periksa tabel pratinjau di bawah.`, success: true });
    setTimeout(() => setDbStateMsg(null), 4000);
  };

  // Perform bulk installation of analyzed students list
  const handleExecuteImport = () => {
    const validImportItems = parsedPreviewList.filter(item => item.isValid);
    if (validImportItems.length === 0) {
      setDbStateMsg({ text: 'Tidak ada data siswa baru yang valid untuk diimpor!', success: false });
      return;
    }

    onBulkImportStudents(validImportItems);

    setDbStateMsg({ 
      text: `Alhamdulillah! Berhasil mengimpor massal ${validImportItems.length} siswa baru ke dalam database!`, 
      success: true 
    });
    
    // Clear inputs and previews
    setRawPasteText('');
    setParsedPreviewList([]);
    setIsParsed(false);
    setTimeout(() => setDbStateMsg(null), 6000);
  };

  // System level download files JSON Backup
  const handleExportSystemBackup = () => {
    try {
      const backupData = {
        app: 'Tabungan Siswa SD Negeri 1 Gemblengan',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        students,
        transactions
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      const today = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `backup-tabungan-siswa-${today}.json`;
      a.click();

      setDbStateMsg({ text: 'Seluruh database tabungan berhasil diekspor sebagai cadangan JSON!', success: true });
      setTimeout(() => setDbStateMsg(null), 4000);
    } catch (e: any) {
      setDbStateMsg({ text: 'Gagal mengekspor cadangan: ' + e.message, success: false });
    }
  };

  // Loader from JSON file restore system state
  const handleRestoreSystemBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.students || !Array.isArray(parsed.students) || !parsed.transactions || !Array.isArray(parsed.transactions)) {
          throw new Error('Berkas tidak memiliki objek data "students" dan "transactions" yang lengkap.');
        }

        const confirmed = window.confirm(
          `Apakah Anda yakin ingin memulihkan cadangan ini?\n\n` +
          `File Cadangan mengandung:\n` +
          `- ${parsed.students.length} Orang Murid\n` +
          `- ${parsed.transactions.length} Jurnal Buku Tabungan\n\n` +
          `PERINGATAN: Langkah ini akan menolak dan menghapus seluruh data tabungan di browser saat ini!`
        );

        if (confirmed) {
          onImportData(parsed.students, parsed.transactions);
          setDbStateMsg({ text: 'Database tabungan berhasil dipulihkan dengan sukses!', success: true });
          setTimeout(() => setDbStateMsg(null), 5000);
        }
      } catch (err: any) {
        setDbStateMsg({ text: 'Gagal memulihkan file: ' + err.message, success: false });
        setTimeout(() => setDbStateMsg(null), 5000);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Safe Authorized Wipe Database Clean State
  const handleExecuteWipeDatabase = () => {
    if (resetCodeInput.toUpperCase() === 'RESET') {
      onClearDatabase();
      setResetCodeInput('');
      setShowConfirmResetPanel(false);
      setDbStateMsg({ text: 'Seluruh database tabungan berhasil dibersihkan ke setelan awal pabrikan.', success: true });
      setTimeout(() => setDbStateMsg(null), 5000);
    } else {
      setDbStateMsg({ text: 'Kata kunci konfirmasi salah! Ketik kata "RESET" dengan benar.', success: false });
      setTimeout(() => setDbStateMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="settings-management-container">
      
      {/* Banner Notifikasi Floating */}
      <AnimatePresence>
        {dbStateMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3 text-sm z-50 relative ${
              dbStateMsg.success 
                ? 'bg-emerald-100 border-slate-900 text-emerald-950' 
                : 'bg-rose-100 border-slate-900 text-rose-950'
            }`}
            id="settings-state-alert"
          >
            {dbStateMsg.success ? (
              <CheckCircle2 size={20} className="text-emerald-800 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={20} className="text-rose-800 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{dbStateMsg.success ? 'Berhasil!' : 'Perhatian/Gagal'}</p>
              <p className="text-xs opacity-90 mt-0.5">{dbStateMsg.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL UTAMA: MASUKKAN DATA ANAK MASSAL (IMPORT) */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_#6366f1] lg:col-span-2 space-y-6 flex flex-col justify-between" id="bulk-import-card">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg inline-flex border border-indigo-200">
                <Users size={16} />
              </span>
              <h2 className="text-lg font-black text-slate-950">Impor Data Siswa Secara Massal</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Bapak/Ibu Guru tidak perlu memasukkan nama siswa satu per satu! Cukup salin dan tempel daftar nama dari Excel atau ketik teks format di bawah ini.
            </p>

            {/* Template format guidelines */}
            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-250 text-xs text-slate-700 space-y-2">
              <p className="font-bold text-amber-900 flex items-center gap-1.5 leading-none">
                <Info size={14} className="stroke-[2.5]" /> Format Penulisan Teks:
              </p>
              <p className="font-mono bg-white p-2.5 rounded border border-amber-200 font-bold overflow-x-auto text-[11px]">
                Nama Siswa, Kelas, NIS, Nama Wali Murid, No Handphone, Saldo Awal (Opsional)
              </p>
              <div className="space-y-1 mt-2 pl-1 leading-normal text-slate-600 font-medium">
                <p>💡 <em>Contoh:</em> <code className="font-mono text-indigo-700 font-bold bg-white px-1 py-0.2 rounded">Andika Saputra, 2A, 12009, Herman, 081234, 50000</code></p>
                <p>💡 Gunakan tanda koma (,), titik koma (;), atau tombol tab sebagai pemisah antar kolom siswa Anda.</p>
                <p>💡 Jika kelas diisi <code className="font-mono text-indigo-700 bg-white px-1">2</code> akan secara otomatis terpetakan ke <code className="font-mono text-indigo-700 bg-white px-1">2A</code>.</p>
              </div>
            </div>

            {/* Input target block */}
            <div className="mt-5 space-y-2">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">
                Salin & Tempel Roster Kelas Di Sini
              </label>
              <textarea
                value={rawPasteText}
                onChange={(e) => {
                  setRawPasteText(e.target.value);
                  setIsParsed(false);
                }}
                rows={6}
                placeholder="Andi Wijaya, 1A, 2026101, Herman, 08129999, 10000&#10;Siti Aminah, 1B, 2026102, Bambang, 08138888, 5000"
                className="w-full bg-slate-50 p-4 border-2 border-slate-900 rounded-xl text-xs font-mono font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white tracking-wide transition-all shadow-[2px_2px_0px_0px_#000]"
                id="raw-import-students-textarea"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4 pt-1">
            <button
              onClick={handleParseText}
              className="px-5 py-3 bg-white hover:bg-amber-100 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
              id="parse-import-text-btn"
            >
              <RefreshCw size={14} className="stroke-[2.5]" /> 1. Analisis Struktur Data
            </button>

            {isParsed && parsedPreviewList.length > 0 && (
              <button
                onClick={handleExecuteImport}
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#047857] hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#047857] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                id="execute-import-students-btn"
              >
                <Check size={14} className="stroke-[3]" /> 2. Impor Masal Sekarang ({parsedPreviewList.filter(p => p.isValid).length} Siswa)
              </button>
            )}
          </div>
        </div>

        {/* PANEL SAMPING: CADANGAN & PEMILIHAN (BACKUP & RESTORE) */}
        <div className="space-y-6 lg:col-span-1" id="backup-utilities-column">
          
          {/* Back Up, Restore, Clean DB panel */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_#f59e0b] space-y-5" id="backup-menu-card">
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg inline-flex border border-amber-200">
                <Database size={16} />
              </span>
              <h2 className="text-lg font-black text-slate-950">Cadangkan / Ekspor Data</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Disarankan untuk mencadangkan data tabungan secara berkala. Seluruh pembukuan tabungan saat ini akan diunduh sebagai file backup tunggal yang dapat disimpan aman di komputer Anda.
            </p>

            <div className="space-y-2.5 pt-2">
              {/* Back Up Action File */}
              <button
                onClick={handleExportSystemBackup}
                className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                id="btn-major-export-backup"
                title="Download data tabungan saat ini sebagai cadangan (.json)"
              >
                <Download size={15} className="stroke-[2.5]" /> Unduh File Cadangan (.JSON)
              </button>

              {/* Restore Action File */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                id="btn-major-import-restore"
                title="Muat data cadangan (.json) untuk memulihkan tabungan"
              >
                <Upload size={15} className="stroke-[2.5]" /> Pulihkan Cadangan dari Komputer
              </button>
              
              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleRestoreSystemBackup}
              />
            </div>
          </div>

          {/* DANGER AREA: DELETE ALL DATA */}
          <div className="bg-rose-50 p-6 rounded-2xl border-2 border-rose-900 shadow-[5px_5px_0px_0px_#e11d48] space-y-4" id="danger-wipe-card">
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg inline-flex border border-rose-200">
                <Trash2 size={16} />
              </span>
              <h2 className="text-lg font-black text-rose-950">Zona Bahaya (Risiko Tinggi)</h2>
            </div>
            <p className="text-xs text-rose-800 font-semibold leading-relaxed">
              Tindakan ini akan menghapus <strong>SELURUH data siswa dan semua riwayat transaksinya</strong> secara permanen dari peranti ini. Pastikan Anda telah mengunduh file cadangan Anda!
            </p>

            {!showConfirmResetPanel ? (
              <button
                onClick={() => setShowConfirmResetPanel(true)}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                id="show-wipe-authorizer-panel"
              >
                <Trash2 size={14} className="stroke-[2.5]" /> Hapus Seluruh Database
              </button>
            ) : (
              <div className="bg-white p-4 border border-rose-250 rounded-xl space-y-3 animate-fade-in" id="confirm-reset-sub-panel">
                <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest leading-none flex items-center gap-1">
                  <AlertTriangle size={12} /> Ketik "RESET" Untuk Melanjutkan:
                </p>
                <input
                  type="text"
                  value={resetCodeInput}
                  onChange={(e) => setResetCodeInput(e.target.value)}
                  placeholder="Ketik RESET"
                  className="w-full px-3 py-2 text-xs font-black uppercase text-center border-2 border-slate-900 rounded-lg bg-rose-50/55 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  id="reset-state-safety-code"
                />
                <div className="grid grid-cols-2 gap-2 text-center">
                  <button
                    onClick={() => {
                      setShowConfirmResetPanel(false);
                      setResetCodeInput('');
                    }}
                    className="py-1.5 bg-slate-100 border border-slate-350 text-slate-800 text-[10px] font-black rounded-lg cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleExecuteWipeDatabase}
                    className="py-1.5 bg-rose-600 font-black text-white text-[10px] rounded-lg border border-rose-950 cursor-pointer"
                  >
                    Ya, Bersihkan!
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* PRATINJAU TABEL PRATINJAU IMPOR (ONLY IF ANALYZED DATA EXISTS) */}
      <AnimatePresence>
        {isParsed && parsedPreviewList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_#10b981] space-y-4"
            id="parsed-rows-preview-block"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-md font-extrabold text-slate-900 flex items-center gap-1.5">
                  <FileCheck2 size={18} className="text-emerald-600 stroke-[2.5]" /> Pratinjau Baris Hasil Analisis Roster
                </h3>
                <p className="text-xs text-slate-500 font-medium">Bapak/Ibu Guru silakan meneliti baris di bawah sebelum mengonfirmasi penyimpanan ke dalam database.</p>
              </div>
              <div className="flex gap-2 text-[10px] font-black text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg w-fit">
                <span>Total Diurai: {parsedPreviewList.length}</span>
                <span>•</span>
                <span className="text-emerald-700">Valid: {parsedPreviewList.filter(p => p.isValid).length}</span>
                <span>•</span>
                <span className="text-rose-700">Gagal: {parsedPreviewList.filter(p => !p.isValid).length}</span>
              </div>
            </div>

            {/* Preview table */}
            <div className="overflow-x-auto max-h-[300px] border border-slate-200 rounded-xl shadow-inner">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-55 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 sticky top-0 bg-white">
                    <th className="p-3">Nama</th>
                    <th className="p-3">NIS</th>
                    <th className="p-3">Komparasi Kelas</th>
                    <th className="p-3">Wali Murid</th>
                    <th className="p-3">No. Telp</th>
                    <th className="p-3 text-right">Saldo Awal (Dana Masuk)</th>
                    <th className="p-3 text-center">Analisis Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-750">
                  {parsedPreviewList.map((item, index) => (
                    <tr 
                      key={index}
                      className={item.isValid ? `hover:bg-slate-50/55` : `bg-rose-50/30 hover:bg-rose-50/50`}
                    >
                      <td className="p-3 font-bold text-slate-900">{item.name || '---'}</td>
                      <td className="p-3 font-mono text-slate-655 text-slate-500 font-bold">{item.nis || '---'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md font-black bg-indigo-50 border border-indigo-200 text-indigo-700">
                          Kelas {item.grade}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{item.parentName || '-'}</td>
                      <td className="p-3 text-slate-600">{item.phone || '-'}</td>
                      <td className="p-3 font-mono font-bold text-slate-900 text-right">
                        {item.initialDeposit > 0 ? formatCurrency(item.initialDeposit) : '-'}
                      </td>
                      <td className="p-3 text-center">
                        {item.isValid ? (
                          <span className="inline-flex items-center gap-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 font-black text-[9px] px-2 py-0.5 rounded-full">
                            <Check size={10} className="stroke-[3]" /> Siap Impor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 bg-rose-100 border border-rose-300 text-rose-800 font-black text-[9px] px-2 py-0.5 rounded-full" title={item.errorReason}>
                            <AlertTriangle size={10} className="stroke-[3]" /> Ganti NIS / Duplikat ({item.errorReason})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
