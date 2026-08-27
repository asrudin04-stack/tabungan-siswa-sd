import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  User, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Printer, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Trash2,
  FileText,
  BadgeAlert,
  Download,
  Edit3,
  ListFilter,
  PlusCircle,
  History,
  Calendar,
  Sparkles,
  ChevronRight,
  Info,
  Check
} from 'lucide-react';
import { Student, Transaction, TransactionType } from '../types';
import { formatCurrency, getClassBadgeStyle, formatDate, generateReceiptNumber } from '../utils';
import EditTransactionModal from './EditTransactionModal';

interface CashierProps {
  students: Student[];
  transactions: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date'> & { date?: string }) => Transaction;
  onEditTransaction: (id: string, updatedData: Partial<Transaction>) => void;
  onDeleteTransaction: (id: string) => void;
  recordedBy: string;
}

export default function Cashier({ 
  students, 
  transactions,
  onAddTransaction, 
  onEditTransaction,
  onDeleteTransaction,
  recordedBy 
}: CashierProps) {
  // Main view mode: 'FORM' (input transaksi baru) or 'HISTORY' (riwayat & koreksi)
  const [viewMode, setViewMode] = useState<'FORM' | 'HISTORY'>('FORM');

  // Search state for student selection in form
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form states
  const [txType, setTxType] = useState<TransactionType>('SETOR');
  const [amountInput, setAmountInput] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [manualAmountText, setManualAmountText] = useState('');
  const [customDate, setCustomDate] = useState<string>(''); // empty means use current time
  const [showCustomDate, setShowCustomDate] = useState<boolean>(false);

  // Operator / recordedBy teacher name
  const [operator, setOperator] = useState(recordedBy || 'Wali Kelas');

  // Success screen state after transaction is submitted
  const [printedReceipt, setPrintedReceipt] = useState<Transaction | null>(null);
  const [successAnimation, setSuccessAnimation] = useState(false);

  // Modal for editing/correcting transaction
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // History search and filter states
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'ALL' | 'SETOR' | 'TARIK'>('ALL');
  const [historyMonthFilter, setHistoryMonthFilter] = useState<string>('ALL');

  // Sync selected student from props if student array updates
  useEffect(() => {
    if (selectedStudent) {
      const refreshed = students.find(s => s.id === selectedStudent.id);
      if (refreshed) {
        setSelectedStudent(refreshed);
      }
    }
  }, [students]);

  // Filtering students for live search auto-complete
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return students.filter(
      s => s.name.toLowerCase().includes(q) || s.nis.includes(q)
    ).slice(0, 5);
  }, [students, searchQuery]);

  // Handle student selection
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery('');
    setShowDropdown(false);
    setAmountInput(0);
    setManualAmountText('');
    setNotes('');
  };

  // Preset quick insert amounts for pupils
  const quickAmounts = [2000, 5000, 10000, 20000, 50000, 100000];

  // Preset quick descriptions/notes
  const quickNotes = [
    'Sisa uang jajan harian',
    'Tabungan rutin pekanan',
    'Celengan rumah dimasukkan kasir',
    'Pemberian orang tua',
    'Sisa uang buku / fotokopi',
    'Keperluan uang kas / pramuka'
  ];

  // Pre-fill amount
  const handleQuickAmountClick = (value: number) => {
    setAmountInput(prev => prev + value);
    setManualAmountText(String(amountInput + value));
  };

  const handleClearAmount = () => {
    setAmountInput(0);
    setManualAmountText('');
  };

  // Convert text typing to number amounts safely
  const handleManualAmountChange = (val: string) => {
    const numericStr = val.replace(/[^0-9]/g, '');
    setManualAmountText(numericStr);
    const parsed = parseInt(numericStr, 10);
    setAmountInput(isNaN(parsed) ? 0 : parsed);
  };

  // Overdraft warnings
  const isOverdraft = useMemo(() => {
    if (txType !== 'TARIK' || !selectedStudent) return false;
    return amountInput > selectedStudent.balance;
  }, [txType, selectedStudent, amountInput]);

  // Validations
  const isValidTransaction = useMemo(() => {
    if (!selectedStudent) return false;
    if (amountInput <= 0) return false;
    if (isOverdraft) return false;
    return true;
  }, [selectedStudent, amountInput, isOverdraft]);

  // Submit transaction logic
  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidTransaction || !selectedStudent) return;

    try {
      const finalDate = (showCustomDate && customDate) 
        ? new Date(customDate).toISOString() 
        : undefined;

      const createdTx = onAddTransaction({
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        studentGrade: selectedStudent.grade,
        type: txType,
        amount: amountInput,
        notes: notes.trim() || undefined,
        recordedBy: operator,
        date: finalDate
      });

      // Update local selection's balance immediately for receipt simulation
      const updatedStudent = {
        ...selectedStudent,
        balance: txType === 'SETOR' 
          ? selectedStudent.balance + amountInput 
          : selectedStudent.balance - amountInput
      };
      setSelectedStudent(updatedStudent);

      // Trigger receipt printing view and animated success indicator
      setPrintedReceipt(createdTx);
      setSuccessAnimation(true);
      
      // Auto reset inputs
      setAmountInput(0);
      setManualAmountText('');
      setNotes('');
      if (!showCustomDate) {
        setCustomDate('');
      }
    } catch (error) {
      alert('Gagal memproses transaksi: ' + error);
    }
  };

  // Launch browser-native print layout exclusively for receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  // Open Edit Modal for a transaction
  const handleOpenEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsEditModalOpen(true);
  };

  // Direct delete confirmation
  const handleDirectDelete = (tx: Transaction) => {
    const confirmMsg = 
      `Apakah Anda yakin ingin MENGHAPUS data transaksi ini?\n\n` +
      `- ID: ${tx.id}\n` +
      `- Siswa: ${tx.studentName}\n` +
      `- Jenis: ${tx.type === 'SETOR' ? 'Setoran (Tabung)' : 'Penarikan'}\n` +
      `- Nominal: ${formatCurrency(tx.amount)}\n` +
      `- Tanggal: ${formatDate(tx.date, true)}\n\n` +
      `Saldo siswa akan otomatis dikembalikan (dibalik) ke rekening tabungannya.`;

    if (window.confirm(confirmMsg)) {
      onDeleteTransaction(tx.id);
      if (printedReceipt?.id === tx.id) {
        setPrintedReceipt(null);
      }
    }
  };

  // Dynamic Month List for History Tab
  const availableMonths = useMemo(() => {
    const list = new Set<string>();
    transactions.forEach(t => {
      list.add(t.date.substring(0, 7)); // 'YYYY-MM'
    });
    return Array.from(list).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Filtered History Transactions
  const filteredHistory = useMemo(() => {
    let list = [...transactions];

    if (historyTypeFilter !== 'ALL') {
      list = list.filter(t => t.type === historyTypeFilter);
    }

    if (historyMonthFilter !== 'ALL') {
      list = list.filter(t => t.date.startsWith(historyMonthFilter));
    }

    if (historySearch.trim() !== '') {
      const q = historySearch.toLowerCase();
      list = list.filter(t => 
        t.studentName.toLowerCase().includes(q) ||
        t.studentId.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        (t.recordedBy && t.recordedBy.toLowerCase().includes(q)) ||
        t.id.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, historyTypeFilter, historyMonthFilter, historySearch]);

  // History Aggregates
  const historyStats = useMemo(() => {
    let totalSetor = 0;
    let totalTarik = 0;
    filteredHistory.forEach(t => {
      if (t.type === 'SETOR') totalSetor += t.amount;
      else totalTarik += t.amount;
    });
    return {
      totalSetor,
      totalTarik,
      net: totalSetor - totalTarik,
      count: filteredHistory.length
    };
  }, [filteredHistory]);

  // Recent 5 transactions for fast side-by-side editing in form mode
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-6" id="cashier-interface">
      
      {/* Top Header Mode Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0284c7] no-print">
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="tab-cashier-form"
            onClick={() => setViewMode('FORM')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'FORM'
                ? 'bg-indigo-600 text-white shadow-[2px_2px_0px_0px_#000] border-2 border-slate-950'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <PlusCircle size={16} />
            <span>Input Transaksi Baru (Kasir)</span>
          </button>

          <button
            type="button"
            id="tab-cashier-history"
            onClick={() => setViewMode('HISTORY')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === 'HISTORY'
                ? 'bg-indigo-600 text-white shadow-[2px_2px_0px_0px_#000] border-2 border-slate-950'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <History size={16} />
            <span>Koreksi & Riwayat Transaksi</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              viewMode === 'HISTORY' ? 'bg-indigo-800 text-white' : 'bg-slate-300 text-slate-800'
            }`}>
              {transactions.length}
            </span>
          </button>
        </div>

        <div className="text-xs text-slate-600 font-bold flex items-center gap-2">
          <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 flex items-center gap-1">
            <CheckCircle size={14} />
            <span>Koreksi Data Aktif</span>
          </span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline text-[11px] text-slate-500">Edit, tambah, & hapus data otomatis sinkron ke saldo</span>
        </div>
      </div>

      {/* MODE 1: FORM INPUT TRANSAKSI (KASIR) */}
      {viewMode === 'FORM' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          
          {/* KIRI: PANEL TRANSAKSI / INPUT TRANSAKSI (ColSpan 3) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* TAHAP 1: pencarian siswa */}
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_#6366f1]">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-4">
                <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200">
                  <User size={18} />
                </span>
                Langkah 1: Cari & Pilih Siswa 🔍
              </h2>

              <div className="relative" id="student-search-container">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Search size={18} className="stroke-[2.5]" />
                </div>
                <input 
                  id="student-search-input"
                  type="text"
                  placeholder="Ketik Nama Siswa atau Nomor NIS (Contoh: Ahmad, 2026...)"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="pl-11 pr-4 py-3.5 w-full bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />

                {/* Dropdown Hasil Pencarian */}
                <AnimatePresence>
                  {showDropdown && searchQuery.trim() !== '' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute z-30 w-full bg-white mt-2 border-2 border-slate-900 rounded-xl shadow-lg divide-y divide-slate-100 overflow-hidden"
                      id="search-results-dropdown"
                    >
                      {searchResults.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-sm">
                          Siswa tidak ditemukan. Cek ejaan nama atau NIS.
                        </div>
                      ) : (
                        searchResults.map((s) => {
                          const badge = getClassBadgeStyle(s.grade);
                          return (
                            <div 
                              key={s.id}
                              id={`search-result-item-${s.id}`}
                              onClick={() => handleSelectStudent(s)}
                              className="p-3.5 flex items-center justify-between hover:bg-indigo-50/50 cursor-pointer transition-colors"
                            >
                              <div>
                                <p className="text-sm font-bold text-slate-800">{s.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">NIS: <span className="font-semibold font-mono text-slate-500">{s.nis}</span></p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                                  Kelas {s.grade}
                                </span>
                                <span className="text-xs font-bold text-slate-600 font-mono">
                                  {formatCurrency(s.balance)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quick Info Siswa Terpilih */}
              {selectedStudent && (
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-5 p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 flex items-center justify-between gap-4"
                  id="selected-student-profile-bar"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-xs">
                      {selectedStudent.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{selectedStudent.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">NIS: {selectedStudent.nis}</span>
                        <span className="text-xs text-slate-500">• Kelas {selectedStudent.grade}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Saldo Tabungan saat ini</p>
                    <p className="text-base font-extrabold text-indigo-700 font-mono mt-0.5">
                      {formatCurrency(selectedStudent.balance)}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* TAHAP 2: Detail Transaksi */}
            {selectedStudent ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_#9333ea] space-y-6"
                id="cashier-tx-form-block"
              >
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span className="p-1.5 bg-purple-100 text-purple-700 rounded-lg border border-purple-200">
                    <Wallet size={18} />
                  </span>
                  Langkah 2: Proses Transaksi Tabungan ✍️
                </h2>

                <form onSubmit={handleSubmitTransaction} className="space-y-6">
                  
                  {/* Jenis Transaksi (Tab) - 3D Styled */}
                  <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#000]" id="tx-type-tabs">
                    <button
                      type="button"
                      id="tab-select-setor"
                      onClick={() => setTxType('SETOR')}
                      className={`py-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        txType === 'SETOR'
                          ? 'bg-emerald-500 text-white border-2 border-slate-950 shadow-[2px_2px_0px_0px_#000]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      <ArrowUpRight size={18} className="stroke-[3]" />
                      TABUNG / SETOR
                    </button>
                    <button
                      type="button"
                      id="tab-select-tarik"
                      onClick={() => setTxType('TARIK')}
                      className={`py-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        txType === 'TARIK'
                          ? 'bg-rose-500 text-white border-2 border-slate-950 shadow-[2px_2px_0px_0px_#000]'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                      }`}
                    >
                      <ArrowDownRight size={18} className="stroke-[3]" />
                      TARIK TUNAI
                    </button>
                  </div>

                  {/* Jumlah Uang & Quick Actions */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Nominal Transaksi (Rp)</label>
                      {amountInput > 0 && (
                        <button 
                          type="button"
                          onClick={handleClearAmount}
                          className="text-xs text-rose-600 hover:bg-rose-100 font-extrabold flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-250 cursor-pointer"
                          id="clear-amount-btn"
                        >
                          <Trash2 size={12} className="stroke-[2.5]" /> Hapus
                        </button>
                      )}
                    </div>

                    {/* Big Currency Input */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-800 font-black text-lg font-mono">
                        Rp
                      </div>
                      <input
                        type="text"
                        id="cashier-amount-input"
                        placeholder="Contoh: 10.000"
                        value={manualAmountText ? new Intl.NumberFormat('id-ID').format(amountInput) : ''}
                        onChange={(e) => handleManualAmountChange(e.target.value)}
                        className="pl-12 pr-4 py-4 w-full bg-white border-2 border-slate-900 rounded-xl text-xl font-black text-slate-900 font-mono tracking-wide focus:outline-none focus:border-indigo-600 transition-all placeholder-slate-300 shadow-[3px_3px_0px_0px_#000]"
                      />
                    </div>

                    {/* Quick Add Buttons */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2" id="quick-amount-grid">
                      {quickAmounts.map((q) => (
                        <button
                          key={q}
                          type="button"
                          id={`quick-increment-${q}`}
                          onClick={() => handleQuickAmountClick(q)}
                          className="py-2.5 text-xs font-black bg-white hover:bg-amber-100 text-slate-800 border-2 border-slate-900 rounded-xl hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#0f172a] active:shadow-none shadow-[1px_1px_0px_0px_#000] transition-all font-mono cursor-pointer"
                        >
                          +{new Intl.NumberFormat('id-ID').format(q/1000)}rb
                        </button>
                      ))}
                    </div>

                    {/* Overdraft Alert Safeguard */}
                    {isOverdraft && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-2 text-xs"
                        id="overdraft-warning-box"
                      >
                        <BadgeAlert size={16} className="text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Saldo Tidak Mencukupi!</p>
                          <p className="text-[11px] text-rose-600 mt-0.5">
                            {selectedStudent.name} hanya memiliki saldo sebesar <strong className="font-mono text-rose-800">{formatCurrency(selectedStudent.balance)}</strong>. 
                            Besaran penarikan tidak boleh melebihi saldo tabungan.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Tanggal & Waktu Custom (Backdate / Susulan Toggle) */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showCustomDate}
                          onChange={(e) => {
                            setShowCustomDate(e.target.checked);
                            if (e.target.checked && !customDate) {
                              const d = new Date();
                              const pad = (n: number) => String(n).padStart(2, '0');
                              setCustomDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>Sesuaikan Tanggal / Jam Transaksi (Susulan/Backdate)</span>
                      </label>
                      <span className="text-[10px] font-bold font-mono text-slate-500">
                        {showCustomDate ? 'Mode Kustom' : 'Otomatis Sekarang'}
                      </span>
                    </div>

                    {showCustomDate && (
                      <div className="pt-2 border-t border-slate-200">
                        <input
                          type="datetime-local"
                          value={customDate}
                          onChange={(e) => setCustomDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Catatan Transaksi */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Catatan / Keterangan</label>
                    <input
                      type="text"
                      id="cashier-notes-input"
                      placeholder="Ketik keterangan (misal: Sisa uang jajan, beli alat tulis...)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="px-4 py-3 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />

                    {/* Quick notes selector chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2" id="quick-notes-container">
                      {quickNotes.map((noteText) => (
                        <button
                          key={noteText}
                          type="button"
                          id={`quick-note-chip-${noteText.slice(0, 10).replace(/ /g, '')}`}
                          onClick={() => setNotes(noteText)}
                          className="px-3 py-1.5 text-[11px] font-medium bg-slate-100/70 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg cursor-pointer transition-colors max-w-full truncate"
                        >
                          {noteText}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* metadata / Petugas yang bertugas */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="font-bold">Petugas / Guru Bertanggungjawab:</span>
                    <input 
                      type="text"
                      id="operator-name-input"
                      value={operator}
                      onChange={(e) => setOperator(e.target.value)}
                      className="bg-transparent text-right font-semibold text-slate-700 outline-none hover:bg-slate-200/50 focus:bg-white focus:ring-1 focus:ring-indigo-500 px-2 py-0.5 rounded transition-all w-48"
                      placeholder="Nama Bapak/Ibu Guru"
                    />
                  </div>

                  {/* Submit Button - 3D tactile button style */}
                  <button
                    type="submit"
                    id="submit-transaction-btn"
                    disabled={!isValidTransaction}
                    className={`py-4 w-full rounded-2xl font-black flex items-center justify-center gap-2 border-2 border-slate-900 transition-all cursor-pointer ${
                      isValidTransaction 
                        ? txType === 'SETOR'
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[4px_4px_0px_0px_#064e3b] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_#064e3b] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#064e3b]'
                          : 'bg-rose-500 hover:bg-rose-600 text-white shadow-[4px_4px_0px_0px_#4c0519] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_#4c0519] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_#4c0519]'
                        : 'bg-slate-200 text-slate-400 border-slate-300 shadow-none cursor-not-allowed'
                    }`}
                  >
                    {txType === 'SETOR' ? (
                      <>
                        <CheckCircle size={18} className="stroke-[2.5]" /> Simpan Setoran ({formatCurrency(amountInput)})
                      </>
                    ) : (
                      <>
                        <ArrowDownRight size={18} className="stroke-[2.5]" /> Ambil Tarikan ({formatCurrency(amountInput)})
                      </>
                    )}
                  </button>

                </form>
              </motion.div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center justify-center h-96 text-slate-400" id="empty-cashier-form">
                <Search className="stroke-1 text-slate-300 mb-3" size={48} />
                <h3 className="text-slate-700 font-bold text-base">Silakan Pilih Siswa Terlebih Dahulu</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                  Ketik nama atau nomor NIS siswa di kolom pencarian di atas untuk memuat form setoran atau penarikan uang tabungan.
                </p>
              </div>
            )}

            {/* Quick Recent Transactions Widget with Direct Edit / Delete */}
            {recentTransactions.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0284c7]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <History size={14} className="text-indigo-600" />
                    Transaksi Terakhir Dicatat:
                  </h3>
                  <button
                    type="button"
                    onClick={() => setViewMode('HISTORY')}
                    className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lihat Semua</span>
                    <ChevronRight size={12} />
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`p-1 rounded-md text-white font-black text-[9px] ${
                          tx.type === 'SETOR' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}>
                          {tx.type}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{tx.studentName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{formatDate(tx.date, true)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-black font-mono ${
                          tx.type === 'SETOR' ? 'text-emerald-700' : 'text-rose-700'
                        }`}>
                          {tx.type === 'SETOR' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(tx)}
                            className="p-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-md font-bold transition-all"
                            title="Koreksi / Edit Transaksi"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDirectDelete(tx)}
                            className="p-1 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-md font-bold transition-all"
                            title="Hapus Transaksi"
                          >
                            <Trash2 size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPrintedReceipt(tx)}
                            className="p-1 bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 rounded-md font-bold transition-all"
                            title="Cetak Ulang Struk"
                          >
                            <Printer size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* KANAN: PREVIEW STRUK SIMPANAN / THERMAL SLIP PRINT (ColSpan 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Animated Success Notification Overlay */}
            <AnimatePresence>
              {successAnimation && printedReceipt && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex items-start gap-3 shadow-xs"
                  id="success-alert-strip"
                >
                  <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={20} />
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-800">Transaksi Berhasil Disimpan!</h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      Saldo terbaru <strong>{printedReceipt.studentName}</strong> berhasil disinkronisasi. Struk siap dicetak untuk wali murid.
                    </p>
                    <button 
                      id="dismiss-success-banner"
                      onClick={() => setSuccessAnimation(false)}
                      className="mt-2.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                    >
                      Selesai & Sembunyikan
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live Struk Simulator */}
            <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border-2 border-slate-950 shadow-[5px_5px_0px_0px_#f59e0b] relative flex flex-col no-print" id="thermal-receipt-container">
              <div className="flex justify-between items-center pb-4 border-b border-slate-850 mb-5">
                <h3 className="text-sm font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FileText size={15} className="stroke-[2.5]" /> Simulator Struk
                </h3>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Ready to print" />
              </div>

              {/* Struk Fisik Thermal */}
              <div 
                className="bg-white text-slate-900 font-mono p-5 shadow-inner border border-slate-100 rounded-xs text-xs space-y-4 print-card relative" 
                id="thermal-slip-sheet"
                style={{ backgroundImage: 'radial-gradient(#fbfbfb 15%, transparent 16%)', backgroundSize: '6px 6px' }}
              >
                {/* receipt serrated jagged edges on top */}
                <div className="absolute top-[-3px] left-0 right-0 flex overflow-hidden h-2.5 opacity-90 select-none">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-slate-800 transform rotate-45 translate-y-[-10px] shrink-0" />
                  ))}
                </div>

                {/* School Header */}
                <div className="text-center pt-2 pb-1 border-b border-dashed border-slate-300">
                  <h4 className="font-extrabold text-[13px] tracking-tight">SD NEGERI 1 GEMBLENGAN</h4>
                  <p className="text-[10px] text-slate-500">Gemblengan, Kec. Garung, Kab. Wonosobo</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">Telp: (0286) 5544-3322</p>
                </div>

                {/* Receipt metadata */}
                <div className="space-y-1.5 text-[11px] pb-3 border-b border-dashed border-slate-300">
                  <div className="flex justify-between">
                    <span>RESI:</span>
                    <span className="font-bold">{printedReceipt ? printedReceipt.id : generateReceiptNumber(txType, 99)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TANGGAL:</span>
                    <span>{printedReceipt ? formatDate(printedReceipt.date, true) : formatDate(new Date().toISOString(), true)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PETUGAS:</span>
                    <span className="font-bold uppercase">{printedReceipt ? printedReceipt.recordedBy : operator || 'WALI KELAS'}</span>
                  </div>
                </div>

                {/* Student metadata */}
                <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-300 bg-slate-50/60 p-2 rounded">
                  <div className="flex justify-between">
                    <span>SISWA:</span>
                    <span className="font-bold">{printedReceipt ? printedReceipt.studentName : selectedStudent?.name || 'NAMA SISWA'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>NIS / KELAS:</span>
                    <span>{printedReceipt ? `${printedReceipt.studentId} / Kls ${printedReceipt.studentGrade}` : `${selectedStudent?.nis || 'NIS'} / Kls ${selectedStudent?.grade || 'GRADE'}`}</span>
                  </div>
                </div>

                {/* Transaction item detail */}
                <div className="space-y-3.5 py-2">
                  <div className="flex justify-between items-center text-sm font-extrabold pb-1.5 border-b border-slate-250">
                    <span>{printedReceipt ? printedReceipt.type : txType} TABUNGAN</span>
                    <span className={printedReceipt ? (printedReceipt.type === 'SETOR' ? 'text-emerald-700' : 'text-rose-700') : (txType === 'SETOR' ? 'text-emerald-700' : 'text-rose-700')}>
                      {formatCurrency(printedReceipt ? printedReceipt.amount : amountInput)}
                    </span>
                  </div>
                  
                  {/* Optional Description */}
                  <div className="text-[10px] text-slate-500 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                    Keterangan: {printedReceipt ? printedReceipt.notes || 'Penempatan kasir rutin' : notes || 'Penempatan kasir rutin'}
                  </div>
                </div>

                {/* Current Balance Summary */}
                <div className="border-t border-dashed border-slate-300 pt-3 flex justify-between items-center text-xs font-bold bg-indigo-50/40 p-2 rounded">
                  <span className="text-[10px] uppercase text-indigo-800">SALDO AKHIR:</span>
                  <span className="font-mono text-indigo-900 text-sm font-extrabold">
                    {printedReceipt 
                      ? formatCurrency(students.find(s => s.id === printedReceipt.studentId)?.balance || 0) 
                      : selectedStudent 
                        ? formatCurrency(txType === 'SETOR' ? selectedStudent.balance + amountInput : selectedStudent.balance - amountInput)
                        : formatCurrency(0)}
                  </span>
                </div>

                {/* Footer Signatures */}
                <div className="pt-8 grid grid-cols-2 gap-4 text-center text-[10px] border-t border-dashed border-slate-350">
                  <div>
                    <p className="text-slate-400">Pembayar / Wali</p>
                    <div className="h-10" />
                    <p className="border-t border-slate-300 pt-1 font-bold">....................</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Petugas Penerima</p>
                    <div className="h-10" />
                    <p className="border-t border-slate-300 pt-1 font-bold uppercase">{printedReceipt ? printedReceipt.recordedBy.split(' ')[0] : operator.split(' ')[0] || 'GURU'}</p>
                  </div>
                </div>

                {/* Small tagline of saving */}
                <div className="text-center text-[9px] text-slate-400 pt-4 border-t border-slate-200">
                  <p className="font-bold text-slate-600">"Siswa Gemar Menabung, Masa Depan Gemilang!"</p>
                  <p className="mt-0.5">sdn1gemblengan.sch.id</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  id="download-slip-txt"
                  onClick={() => {
                const textReceipt = `
=================================
     SD NEGERI 1 GEMBLENGAN
      STRUK TABUNGAN SISWA
=================================
RESI  : ${printedReceipt ? printedReceipt.id : 'DRAFT'}
TANGGAL: ${printedReceipt ? formatDate(printedReceipt.date, true) : formatDate(new Date().toISOString(), true)}
PETUGAS: ${printedReceipt ? printedReceipt.recordedBy : operator}

SISWA  : ${printedReceipt ? printedReceipt.studentName : selectedStudent?.name || 'NAMA'}
NIS/KLS: ${printedReceipt ? `${printedReceipt.studentId} / ${printedReceipt.studentGrade}` : `${selectedStudent?.nis || 'NIS'} / ${selectedStudent?.grade || 'GRADE'}`}
---------------------------------
JENIS  : ${printedReceipt ? printedReceipt.type : txType}
NOMINAL: ${formatCurrency(printedReceipt ? printedReceipt.amount : amountInput)}
NOTES  : ${printedReceipt ? printedReceipt.notes || '-' : notes || '-'}
---------------------------------
SALDO AKHIR: ${printedReceipt ? formatCurrency(students.find(s=>s.id===printedReceipt.studentId)?.balance||0) : 'DRAFT'}
=================================
Siswa Gemar Menabung, 
Masa Depan Gemilang!
=================================`;
                    const blob = new Blob([textReceipt], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `struk-${printedReceipt?.id || 'simulasi'}.txt`;
                    a.click();
                  }}
                  className="py-2.5 text-xs font-black bg-slate-800 text-white hover:bg-slate-700 rounded-xl flex items-center justify-center gap-1.5 border-2 border-slate-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all cursor-pointer"
                >
                  <Download size={14} /> Unduh Nota
                </button>

                <button
                  id="print-sheet-receipt-btn"
                  onClick={handlePrintReceipt}
                  className="py-2.5 text-xs font-black bg-indigo-500 text-white hover:bg-indigo-600 rounded-xl flex items-center justify-center gap-1.5 border-2 border-slate-950 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all cursor-pointer"
                >
                  <Printer size={14} className="stroke-[2.5]" /> Cetak Slip
                </button>
              </div>
            </div>

            {/* Hidden Area strictly optimized for system browser printing */}
            <div className="hidden print-only" id="browser-print-layout">
              <div className="p-8 max-w-sm mx-auto border border-slate-300 rounded text-xs leading-5 font-mono">
                <div className="text-center font-bold text-sm">SD NEGERI 1 GEMBLENGAN</div>
                <div className="text-center text-[10px]">Gemblengan, Kec. Garung, Kab. Wonosobo</div>
                <div className="border-b border-dashed border-slate-400 my-2" />
                
                <div>RESI: {printedReceipt ? printedReceipt.id : generateReceiptNumber(txType, 99)}</div>
                <div>TANGGAL: {printedReceipt ? formatDate(printedReceipt.date, true) : formatDate(new Date().toISOString(), true)}</div>
                <div>PETUGAS: {printedReceipt ? printedReceipt.recordedBy : operator}</div>
                
                <div className="border-b border-dashed border-slate-400 my-2" />
                
                <div>SISWA: {printedReceipt ? printedReceipt.studentName : selectedStudent?.name || 'NAMA SISWA'}</div>
                <div>NIS: {printedReceipt ? printedReceipt.studentId : selectedStudent?.nis || 'NIS'}</div>
                <div>KELAS: {printedReceipt ? printedReceipt.studentGrade : selectedStudent?.grade || 'GRADE'}</div>
                
                <div className="border-b border-dashed border-slate-400 my-2" />
                
                <div className="flex justify-between font-bold text-sm my-2">
                  <span>{printedReceipt ? printedReceipt.type : txType} TABUNGAN</span>
                  <span>{formatCurrency(printedReceipt ? printedReceipt.amount : amountInput)}</span>
                </div>
                
                <div className="text-[10px] italic">Keterangan: {printedReceipt ? printedReceipt.notes || '-' : notes || '-'}</div>
                
                <div className="border-b border-dashed border-slate-400 my-2" />
                
                <div className="flex justify-between font-bold text-xs p-1.5 bg-slate-100 rounded">
                  <span>SALDO AKHIR:</span>
                  <span>{printedReceipt 
                    ? formatCurrency(students.find(s => s.id === printedReceipt.studentId)?.balance || 0) 
                    : selectedStudent 
                      ? formatCurrency(txType === 'SETOR' ? selectedStudent.balance + amountInput : selectedStudent.balance - amountInput)
                      : formatCurrency(0)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center mt-6 text-[10px]">
                  <div>
                    <div>Wali Siswa</div>
                    <div className="h-12" />
                    <div>(................)</div>
                  </div>
                  <div>
                    <div>Petugas Guru</div>
                    <div className="h-12" />
                    <div className="uppercase">({printedReceipt ? printedReceipt.recordedBy.split(' ')[0] : operator.split(' ')[0]})</div>
                  </div>
                </div>
                
                <div className="text-center font-bold text-[9px] mt-6 italic">"Siswa Gemar Menabung, Masa Depan Gemilang!"</div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* MODE 2: DAFTAR & KOREKSI RIWAYAT TRANSAKSI */}
      {viewMode === 'HISTORY' && (
        <div className="space-y-6">
          
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a]">
              <span className="text-[10px] font-black uppercase text-slate-400">Total Transaksi</span>
              <p className="text-xl font-black text-slate-900 font-mono mt-1">{historyStats.count} Jurnal</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#10b981]">
              <span className="text-[10px] font-black uppercase text-emerald-600">Total Setoran (Masuk)</span>
              <p className="text-xl font-black text-emerald-700 font-mono mt-1">{formatCurrency(historyStats.totalSetor)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#f43f5e]">
              <span className="text-[10px] font-black uppercase text-rose-600">Total Penarikan (Keluar)</span>
              <p className="text-xl font-black text-rose-700 font-mono mt-1">{formatCurrency(historyStats.totalTarik)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#6366f1]">
              <span className="text-[10px] font-black uppercase text-indigo-600">Net Mutasi Bersih</span>
              <p className="text-xl font-black text-indigo-700 font-mono mt-1">{formatCurrency(historyStats.net)}</p>
            </div>
          </div>

          {/* Filtration & Search Bar */}
          <div className="bg-white p-5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0284c7] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari transaksi berdasarkan Nama Siswa, NIS, ID, Catatan, atau Petugas..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl font-bold text-slate-900 text-xs focus:outline-none focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value as any)}
                className="px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl font-bold text-slate-900 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Jenis (Setor & Tarik)</option>
                <option value="SETOR">Setoran Saja (+)</option>
                <option value="TARIK">Penarikan Saja (-)</option>
              </select>

              {/* Month Filter */}
              <select
                value={historyMonthFilter}
                onChange={(e) => setHistoryMonthFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl font-bold text-slate-900 text-xs focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Periode Bulan</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setViewMode('FORM')}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl border-2 border-slate-950 shadow-[2px_2px_0px_0px_#000] cursor-pointer flex items-center gap-1.5 ml-auto"
              >
                <PlusCircle size={14} />
                <span>+ Catat Transaksi</span>
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_#0f172a] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-900 text-slate-700 text-xs font-black uppercase">
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4">Tanggal & Waktu</th>
                    <th className="py-3.5 px-4">Nama Siswa & NIS</th>
                    <th className="py-3.5 px-4 text-center">Jenis</th>
                    <th className="py-3.5 px-4 text-right">Nominal</th>
                    <th className="py-3.5 px-4">Keterangan / Catatan</th>
                    <th className="py-3.5 px-4">Petugas</th>
                    <th className="py-3.5 px-4 text-center">Aksi Koreksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs font-bold text-slate-800">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <FileText size={36} className="mx-auto text-slate-300 mb-2 stroke-1" />
                        <p className="font-bold text-sm text-slate-600">Tidak ada data transaksi yang sesuai filter</p>
                        <p className="text-xs text-slate-400 mt-1">Coba bersihkan kata kunci pencarian atau ubah filter periode.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((tx, idx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-slate-800 block">{formatDate(tx.date)}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{formatDate(tx.date, true).split(' ')[1] || ''}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{tx.studentName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">NIS: {tx.studentId} • Kelas {tx.studentGrade}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                            tx.type === 'SETOR' 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {tx.type === 'SETOR' ? <ArrowUpRight size={12} className="stroke-[3]" /> : <ArrowDownRight size={12} className="stroke-[3]" />}
                            {tx.type === 'SETOR' ? 'SETOR' : 'TARIK'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-sm whitespace-nowrap">
                          <span className={tx.type === 'SETOR' ? 'text-emerald-700' : 'text-rose-700'}>
                            {tx.type === 'SETOR' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                          {tx.notes || <span className="text-slate-300 italic">-</span>}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                          {tx.recordedBy}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(tx)}
                              className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Koreksi / Edit Data Transaksi"
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDirectDelete(tx)}
                              className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Hapus Transaksi"
                            >
                              <Trash2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPrintedReceipt(tx);
                                setViewMode('FORM');
                              }}
                              className="p-1.5 bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-400 rounded-lg text-xs font-bold transition-all cursor-pointer"
                              title="Cetak Ulang Struk Thermal"
                            >
                              <Printer size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Global Edit Transaction Modal */}
      <EditTransactionModal
        isOpen={isEditModalOpen}
        transaction={editingTransaction}
        students={students}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={(id, updatedData) => {
          onEditTransaction(id, updatedData);
        }}
        onDelete={(id) => {
          onDeleteTransaction(id);
        }}
      />

    </div>
  );
}
