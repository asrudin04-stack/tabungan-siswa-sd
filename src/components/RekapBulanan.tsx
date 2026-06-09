import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  FileSpreadsheet, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Printer, 
  Download, 
  Upload, 
  Filter, 
  Trash2, 
  RefreshCw,
  Clock,
  Database,
  Building,
  CheckCircle2,
  FileCheck2,
  AlertCircle
} from 'lucide-react';
import { Student, Transaction, GradeClass } from '../types';
import { formatCurrency, formatDate, getClassBadgeStyle, getIndonesianMonthYear } from '../utils';

interface RekapBulananProps {
  students: Student[];
  transactions: Transaction[];
  onImportData: (importedStudents: Student[], importedTransactions: Transaction[]) => void;
  onClearDatabase: () => void;
}

export default function RekapBulanan({ 
  students, 
  transactions, 
  onImportData, 
  onClearDatabase 
}: RekapBulananProps) {
  // Filtration UI states
  const [filterType, setFilterType] = useState<'ALL' | 'SETOR' | 'TARIK'>('ALL');
  const [filterGrade, setFilterGrade] = useState<string>('ALL'); // 'ALL', '1', '2'..
  const [searchName, setSearchName] = useState('');
  
  // Dynamic Month Selectors from database
  const monthOptions = useMemo(() => {
    const list = new Set<string>();
    transactions.forEach(t => {
      list.add(t.date.substring(0, 7)); // 'YYYY-MM'
    });
    return Array.from(list).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const [filterMonth, setFilterMonth] = useState<string>(monthOptions[0] || 'ALL');

  // Backup loading/success messaging
  const [backupMessage, setBackupMessage] = useState<{ text: string; success: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Apply filtrations
  const filteredLedger = useMemo(() => {
    let result = [...transactions];

    if (filterType !== 'ALL') {
      result = result.filter(t => t.type === filterType);
    }

    if (filterGrade !== 'ALL') {
      result = result.filter(t => t.studentGrade.startsWith(filterGrade));
    }

    if (filterMonth !== 'ALL') {
      result = result.filter(t => t.date.startsWith(filterMonth));
    }

    if (searchName.trim() !== '') {
      const q = searchName.toLowerCase();
      result = result.filter(
        t => t.studentName.toLowerCase().includes(q) || t.studentId.toLowerCase().includes(q)
      );
    }

    // Sort descending by date (latest first)
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, filterGrade, filterMonth, searchName]);

  // Aggregate statistics based on filtered dataset
  const aggregateSums = useMemo(() => {
    let totalDeposits = 0;
    let totalWithdrawals = 0;

    filteredLedger.forEach(t => {
      if (t.type === 'SETOR') {
        totalDeposits += t.amount;
      } else {
        totalWithdrawals += t.amount;
      }
    });

    return {
      totalDeposits,
      totalWithdrawals,
      netSavings: totalDeposits - totalWithdrawals,
      txCount: filteredLedger.length
    };
  }, [filteredLedger]);

  // JSON Export action
  const handleExportBackup = () => {
    try {
      const backupData = {
        app: 'Tabungan Siswa SD Pintar',
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

      setBackupMessage({ text: 'Data berhasil diekspor sebagai berkas JSON!', success: true });
      setTimeout(() => setBackupMessage(null), 4000);
    } catch (e) {
      setBackupMessage({ text: 'Gagal mengekspor data: ' + e, success: false });
    }
  };

  // JSON Import action
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Safety verification check on structure
        if (!parsed.students || !Array.isArray(parsed.students) || !parsed.transactions || !Array.isArray(parsed.transactions)) {
          throw new Error('Berkas tidak memiliki data "students" dan "transactions" yang valid.');
        }

        const confirmRestore = window.confirm(`Sistem mendeteksi backup mengandung:\n- ${parsed.students.length} data siswa\n- ${parsed.transactions.length} riwayat transaksi\n\nPERHATIAN: Mengimpor file backup ini akan menimpa seluruh rekaman tabungan saat ini di browser Bapak/Ibu Guru! Apakah Anda ingin melanjutkan?`);
        
        if (confirmRestore) {
          onImportData(parsed.students, parsed.transactions);
          setBackupMessage({ text: 'Database tabungan berhasil dipulihkan dari backup!', success: true });
          setTimeout(() => setBackupMessage(null), 5000);
        }
      } catch (err: any) {
        setBackupMessage({ text: 'Gagal memulihkan file: ' + err.message, success: false });
        setTimeout(() => setBackupMessage(null), 5000);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Clear Database
  const handleClearDatabaseTrigger = () => {
    if (window.confirm('PERINGATAN KRITIS: Anda akan menghapus SELURUH database tabungan siswa!\n\nSemua data murid dan riwayat tabungan akan hilang permanen dari browser ini. Harap EKSPOR backup JSON terlebih dahulu sebelum melakukan ini!\n\nApakah Anda sungguh yakin ingin mereset semuanya?')) {
      const secondCheck = window.prompt('Untuk mengonfirmasi tindakan berbahaya ini, ketik "RESET" di kolom input berikut:');
      if (secondCheck === 'RESET') {
        onClearDatabase();
        setBackupMessage({ text: 'Seluruh database berhasil dibersihkan.', success: true });
        setTimeout(() => setBackupMessage(null), 4000);
      } else {
        alert('Konfirmasi dibatalkan. Input tidak sesuai.');
      }
    }
  };

  // Printable Page Trigger
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="ledger-reports">

      {/* Header and Backup Options (Hidden in browser print layout) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm no-print animate-fade-in" id="ledger-header">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileSpreadsheet size={18} />
            </span>
            Rekap Jurnal & Ekspor Laporan
          </h2>
          <p className="text-xs text-slate-400 mt-1">Cari jurnal pembukuan, unduh data backup, atau cetak laporan fisik untuk laporan kepala sekolah.</p>
        </div>

        {/* Database backup container operations */}
        <div className="flex flex-wrap items-center gap-3 bg-indigo-50/40 border border-indigo-100 p-3 rounded-xl w-fit">
          <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
            <Database size={13} /> Panel Backup:
          </span>
          
          <button
            id="backup-export-btn"
            onClick={handleExportBackup}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
            title="Download data tabungan saat ini sebagai cadangan (.json)"
          >
            <Download size={13} /> Ekspor Data
          </button>

          <button
            id="backup-import-btn"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
            title="Muat data cadangan (.json) untuk memulihkan tabungan"
          >
            <Upload size={13} /> Impor Data
          </button>
          
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleImportBackup}
          />

          <button
            id="database-clear-trigger"
            onClick={handleClearDatabaseTrigger}
            className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
            title="Reset database (Semua Data Siswa & Transaksi Hilang!)"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Backup Notification banners */}
      {backupMessage && (
        <div className={`p-4 rounded-xl border flex items-center gap-2 shadow-sm text-xs no-print ${
          backupMessage.success 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`} id="backup-success-alert">
          {backupMessage.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{backupMessage.text}</span>
        </div>
      )}

      {/* Filtration Desk (Hidden in print) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row flex-wrap items-center gap-4 no-print" id="reports-filter-desk">
        <div className="flex items-center gap-1.5 text-slate-600 font-bold text-xs">
          <Filter size={14} className="text-indigo-600" /> Filter Jurnal:
        </div>

        {/* Filter Month */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 w-full sm:w-auto">
          <Calendar size={13} className="text-slate-400" />
          <select
            id="report-month-filter"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="bg-transparent focus:outline-none pr-2 cursor-pointer"
          >
            <option value="ALL">Semua Bulan</option>
            {monthOptions.map(my => (
              <option key={my} value={my}>{getIndonesianMonthYear(my)}</option>
            ))}
          </select>
        </div>

        {/* Filter Grade */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 w-full sm:w-auto">
          <Building size={13} className="text-slate-400" />
          <select
            id="report-class-filter"
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="bg-transparent focus:outline-none pr-2 cursor-pointer"
          >
            <option value="ALL">Semua Tingkat</option>
            <option value="1">Kelas 1</option>
            <option value="2">Kelas 2</option>
            <option value="3">Kelas 3</option>
            <option value="4">Kelas 4</option>
            <option value="5">Kelas 5</option>
            <option value="6">Kelas 6</option>
          </select>
        </div>

        {/* Filter Type */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 w-full sm:w-auto">
          <select
            id="report-type-filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'ALL' | 'SETOR' | 'TARIK')}
            className="bg-transparent focus:outline-none pr-1 pr-4 cursor-pointer"
          >
            <option value="ALL">Seluruh Transaksi</option>
            <option value="SETOR">Hanya Setoran (Kredit)</option>
            <option value="TARIK">Hanya Penarikan (Debit)</option>
          </select>
        </div>

        {/* Search Input Filter */}
        <div className="relative w-full md:w-36 lg:w-48 xl:w-60 md:ml-auto">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <Search size={13} />
          </span>
          <input
            type="text"
            id="report-search-query-field"
            placeholder="Ketik siswa/NIS..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all w-full placeholder-slate-400"
          />
        </div>

        {/* Print Master Report Button */}
        <button
          id="print-master-report-pdf-trigger"
          onClick={handlePrintReport}
          className="w-full md:w-auto px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow-md cursor-pointer"
        >
          <Printer size={14} /> Cetak Rekap
        </button>
      </div>

      {/* GRID STATS LAPORAN AKUMULASI (Beautiful in screen, styled nicely for print report summaries) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6" id="reports-bento-aggregates">
        
        {/* Aggregated Deposit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-250 transition-colors flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Setoran Keluar Masuk</span>
            <span className="text-base font-extrabold text-emerald-600 font-mono mt-0.5 inline-block">{formatCurrency(aggregateSums.totalDeposits)}</span>
          </div>
          <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <ArrowUpRight size={18} />
          </span>
        </div>

        {/* Aggregated withdrawal */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-rose-250 transition-colors flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Penarikan Total</span>
            <span className="text-base font-extrabold text-rose-600 font-mono mt-0.5 inline-block">{formatCurrency(aggregateSums.totalWithdrawals)}</span>
          </div>
          <span className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <ArrowDownRight size={18} />
          </span>
        </div>

        {/* Net Savings Difference */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Selisih Saldo Bersih</span>
            <span className={`text-base font-extrabold font-mono mt-0.5 inline-block ${aggregateSums.netSavings >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              {formatCurrency(aggregateSums.netSavings)}
            </span>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">
            {aggregateSums.txCount} Log
          </span>
        </div>

      </div>

      {/* LEDGER TABLE CONTAINER (Screen representation) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden no-print" id="reports-ledger-screen-table">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse" id="reports-main-ledger-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-450 tracking-wider uppercase">
                <th className="py-4 px-5">Hari / Tanggal</th>
                <th className="py-4 px-5">NIS</th>
                <th className="py-4 px-5">Nama Siswa</th>
                <th className="py-4 px-5">Kelas</th>
                <th className="py-4 px-5">Jenis</th>
                <th className="py-4 px-5 text-right">Nominal</th>
                <th className="py-4 px-5">Catatan</th>
                <th className="py-4 px-5">Penerima</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-650" id="ledger-table-body-screen">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Clock className="mx-auto stroke-1 text-slate-350 mb-2" size={32} />
                    Belum ada rekaman log transaksi untuk filter aktif.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((t) => {
                  const isSetor = t.type === 'SETOR';
                  const badge = getClassBadgeStyle(t.studentGrade);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors" id={`ledger-row-screen-${t.id}`}>
                      <td className="py-3 px-5 whitespace-nowrap text-slate-500">{formatDate(t.date, true)}</td>
                      <td className="py-3 px-5 font-mono text-slate-500 font-semibold">{t.studentId}</td>
                      <td className="py-3 px-5 font-bold text-slate-800">{t.studentName}</td>
                      <td className="py-3 px-5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {t.studentGrade}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSetor ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {isSetor ? 'Setoran' : 'Penarikan'}
                        </span>
                      </td>
                      <td className={`py-3 px-5 text-right font-bold font-mono ${isSetor ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isSetor ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                      <td className="py-3 px-5 text-slate-400 italic max-w-xs truncate">{t.notes || '-'}</td>
                      <td className="py-3 px-5 font-semibold text-slate-500 truncate">{t.recordedBy}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- DUPLICATE PRINT DESIGN: OPTIMIZED FOR BLACK & WHITE A4 BROWSER PRINTING --- */}
      <div className="hidden print-only" id="master-print-report-sheet">
        <div className="space-y-6 pt-4 pb-20 max-w-4xl mx-auto text-slate-900">
          
          {/* Print Letterhead Header */}
          <div className="text-center space-y-1 pb-4 border-b-2 border-slate-900 font-mono">
            <h1 className="text-xl font-bold uppercase tracking-tight">SD NEGERI 1 GEMBLENGAN</h1>
            <p className="text-xs">Alamat: Gemblengan, Kecamatan Garung, Kabupaten Wonosobo, Jawa Tengah</p>
            <p className="text-xs">Telp: (0286) 5544-3322 | NPSN: 20307080 | Kode Pos: 56351</p>
          </div>

          {/* Laporan Title */}
          <div className="text-center pt-3 space-y-1 font-sans">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight uppercase">
              LAPORAN REKAPITULASI TABUNGAN HADIRIN SISWA
            </h2>
            <p className="text-xs font-mono text-slate-600">
              Periode Dokumen: {filterMonth === 'ALL' ? 'Seluruh Masa Riwayat' : getIndonesianMonthYear(filterMonth)}
            </p>
            <p className="text-[11px] text-slate-500 uppercase font-mono">
              Filter Parameter - Jenis: {filterType === 'ALL' ? 'Semua' : filterType}, Tingkat: {filterGrade === 'ALL' ? 'Semua Kelas' : `Kelas ${filterGrade}`}
            </p>
          </div>

          {/* Aggregated Sums Table */}
          <div className="grid grid-cols-3 gap-4 border border-slate-400 p-3 rounded font-mono text-xs">
            <div>
              <p className="text-slate-500 uppercase text-[10px]">TOTAL SETORAN (KREDIT)</p>
              <p className="font-bold text-sm mt-0.5">{formatCurrency(aggregateSums.totalDeposits)}</p>
            </div>
            <div className="border-l border-slate-300 pl-4">
              <p className="text-slate-500 uppercase text-[10px]">TOTAL PENARIKAN (DEBIT)</p>
              <p className="font-bold text-sm mt-0.5">{formatCurrency(aggregateSums.totalWithdrawals)}</p>
            </div>
            <div className="border-l border-slate-300 pl-4 bg-slate-50 p-1.5 rounded">
              <p className="text-indigo-800 uppercase text-[10px] font-bold">MUTASI BERSIH (TABUNGAN)</p>
              <p className="font-bold text-sm mt-0.5 text-indigo-950">{formatCurrency(aggregateSums.netSavings)}</p>
            </div>
          </div>

          {/* Printable Data Table */}
          <table className="w-full border-collapse border border-slate-400 text-[10px] font-mono">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-400 text-left font-bold uppercase">
                <th className="border border-slate-450 py-2.5 px-3">No</th>
                <th className="border border-slate-450 py-2.5 px-3">Tanggal & Jam</th>
                <th className="border border-slate-450 py-2.5 px-3">NIS</th>
                <th className="border border-slate-450 py-2.5 px-3">Nama Lengkap</th>
                <th className="border border-slate-450 py-2.5 px-3">Kelas</th>
                <th className="border border-slate-450 py-2.5 px-3">Jenis</th>
                <th className="border border-slate-450 py-2.5 px-3 text-right">Nominal</th>
                <th className="border border-slate-450 py-2.5 px-3">Keterangan</th>
                <th className="border border-slate-450 py-2.5 px-3">Verifikator</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-slate-300 py-6 text-center text-slate-500 italic">
                    Tidak ditemukan data rekam tabungan murid untuk dicetak.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((t, index) => (
                  <tr key={t.id} className="border-b border-slate-300">
                    <td className="border border-slate-300 py-2 px-3 text-center">{index + 1}</td>
                    <td className="border border-slate-300 py-2 px-3 whitespace-nowrap">{formatDate(t.date, true)}</td>
                    <td className="border border-slate-300 py-2 px-3 font-semibold">{t.studentId}</td>
                    <td className="border border-slate-300 py-2 px-3 font-bold">{t.studentName}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center">{t.studentGrade}</td>
                    <td className="border border-slate-300 py-2 px-3 text-center font-bold">{t.type}</td>
                    <td className="border border-slate-300 py-2 px-3 text-right font-bold">{formatCurrency(t.amount)}</td>
                    <td className="border border-slate-300 py-2 px-3 italic truncate max-w-[120px]">{t.notes || '-'}</td>
                    <td className="border border-slate-300 py-2 px-3 uppercase text-center">{t.recordedBy.split(' ')[0]}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Signatures and Sign-off block at bottom of printed papers */}
          <div className="pt-12 grid grid-cols-2 text-center text-xs font-mono leading-6">
            <div>
              <p className="text-slate-500">Mengetahui,</p>
              <p className="font-bold uppercase">Kepala Sekolah SD NEGERI 1 GEMBLENGAN</p>
              <div className="h-20" />
              <p className="font-bold underline uppercase">M. Gunawan Wibisono, M.Pd.</p>
              <p className="text-[10px] text-slate-500">NIP. 19740510 200212 1 002</p>
            </div>
            <div>
              <p className="text-slate-500">Wonosobo, {formatDate(new Date().toISOString())}</p>
              <p className="font-bold uppercase">Petugas Bendahara Tabungan</p>
              <div className="h-20" />
              <p className="font-bold underline uppercase">Bu Rismawati, S.Pd.</p>
              <p className="text-[10px] text-slate-500">NIP. 19820315 200801 2 005</p>
            </div>
          </div>

          <div className="text-center text-[9px] text-slate-400 pt-16 border-t border-dashed border-slate-300 font-mono">
            <p>Dokumen Laporan Tabungan Siswa SD NEGERI 1 GEMBLENGAN diunduh secara sah melalui Sistem Aplikasi SD Pintar.</p>
            <p>ID Berkas Laporan: RKP-{new Date().toISOString().slice(0,10).replace(/-/g,'')}-{filteredLedger.length}</p>
          </div>

        </div>
      </div>

    </div>
  );
}
