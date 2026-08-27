import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Award, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Printer, 
  Download, 
  DollarSign, 
  Wallet, 
  Users, 
  Filter, 
  FileText, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  X,
  CreditCard,
  Building,
  School,
  Receipt,
  Calendar,
  Layers,
  ChevronRight,
  Trash2,
  Edit2,
  Check,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { Student, StudentFee, FeePayment, FeeType, FeeStatus, Transaction } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface IuranTagihanProps {
  students: Student[];
  fees: StudentFee[];
  transactions: Transaction[];
  currentUserName: string;
  onAddFee: (fee: StudentFee) => Promise<void>;
  onBulkAddFee: (fees: StudentFee[]) => Promise<void>;
  onPayFee: (
    feeId: string, 
    payment: Omit<FeePayment, 'id'>, 
    deductFromSavings?: boolean
  ) => Promise<void>;
  onEditFee: (fee: StudentFee) => Promise<void>;
  onDeleteFee: (feeId: string) => Promise<void>;
  onNavigateToTab?: (tab: string) => void;
}

export default function IuranTagihan({
  students,
  fees,
  transactions,
  currentUserName,
  onAddFee,
  onBulkAddFee,
  onPayFee,
  onEditFee,
  onDeleteFee,
  onNavigateToTab
}: IuranTagihanProps) {
  // Navigation tabs within Iuran
  const [selectedFeeType, setSelectedFeeType] = useState<'ALL' | 'LKS' | 'PRAMUKA' | 'LAINNYA'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'LUNAS' | 'BELUM_LUNAS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<StudentFee | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<{ fee: StudentFee; payment: FeePayment } | null>(null);
  const [editingFee, setEditingFee] = useState<StudentFee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Bulk Creation
  const [bulkFeeType, setBulkFeeType] = useState<FeeType>('LKS');
  const [bulkTitle, setBulkTitle] = useState('Paket LKS Semester Ganjil (Tema 1-5 & Agama)');
  const [bulkPeriod, setBulkPeriod] = useState('Semester 1 2026/2027');
  const [bulkAmount, setBulkAmount] = useState('65000');
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkSelectedStudentIds, setBulkSelectedStudentIds] = useState<string[]>([]);

  // Form states for Single Creation
  const [singleStudentId, setSingleStudentId] = useState('');
  const [singleFeeType, setSingleFeeType] = useState<FeeType>('LKS');
  const [singleTitle, setSingleTitle] = useState('');
  const [singlePeriod, setSinglePeriod] = useState('Semester 1 2026/2027');
  const [singleAmount, setSingleAmount] = useState('');
  const [singleNotes, setSingleNotes] = useState('');

  // Form states for Payment
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'TUNAI' | 'POTONG_TABUNGAN'>('TUNAI');
  const [payNotes, setPayNotes] = useState('');

  // Quick preset loader for bulk creation
  const handleBulkTypeChange = (type: FeeType) => {
    setBulkFeeType(type);
    if (type === 'LKS') {
      setBulkTitle('Paket LKS Semester Ganjil (Tema 1-5 & Agama)');
      setBulkPeriod('Semester 1 2026/2027');
      setBulkAmount('65000');
    } else if (type === 'PRAMUKA') {
      setBulkTitle('Iuran Kegiatan Pramuka & Kemah Persami');
      setBulkPeriod('Agustus 2026');
      setBulkAmount('25000');
    } else {
      setBulkTitle('Iuran Kas Kelas 5');
      setBulkPeriod('Tahun Ajaran 2026/2027');
      setBulkAmount('10000');
    }
  };

  // Open Bulk Modal initialized with all active students
  const handleOpenBulkModal = () => {
    setBulkSelectedStudentIds(students.map(s => s.id));
    handleBulkTypeChange('LKS');
    setShowBulkModal(true);
  };

  // Filtered Fees List
  const filteredFees = useMemo(() => {
    let result = [...fees];

    if (selectedFeeType !== 'ALL') {
      result = result.filter(f => f.feeType === selectedFeeType);
    }

    if (selectedStatus !== 'ALL') {
      result = result.filter(f => f.status === selectedStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f => 
        f.studentName.toLowerCase().includes(q) ||
        f.studentNis.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.period?.toLowerCase().includes(q) ||
        f.notes?.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => {
      // Sort: BELUM_LUNAS first, then by student name
      if (a.status !== b.status) {
        return a.status === 'BELUM_LUNAS' ? -1 : 1;
      }
      return a.studentName.localeCompare(b.studentName);
    });
  }, [fees, selectedFeeType, selectedStatus, searchQuery]);

  // Overall Statistics
  const stats = useMemo(() => {
    // Current fee scope based on selectedFeeType
    const scopedFees = selectedFeeType === 'ALL' ? fees : fees.filter(f => f.feeType === selectedFeeType);

    let totalTarget = 0;
    let totalPaid = 0;
    let lunasCount = 0;
    let belumLunasCount = 0;

    scopedFees.forEach(f => {
      totalTarget += f.targetAmount;
      totalPaid += f.paidAmount;
      if (f.status === 'LUNAS') {
        lunasCount++;
      } else {
        belumLunasCount++;
      }
    });

    const totalUnpaid = Math.max(0, totalTarget - totalPaid);
    const percentPaid = totalTarget > 0 ? Math.round((totalPaid / totalTarget) * 100) : 0;

    // LKS specific
    const lksFees = fees.filter(f => f.feeType === 'LKS');
    const lksTarget = lksFees.reduce((s, f) => s + f.targetAmount, 0);
    const lksPaid = lksFees.reduce((s, f) => s + f.paidAmount, 0);
    const lksLunasCount = lksFees.filter(f => f.status === 'LUNAS').length;

    // Pramuka specific
    const praFees = fees.filter(f => f.feeType === 'PRAMUKA');
    const praTarget = praFees.reduce((s, f) => s + f.targetAmount, 0);
    const praPaid = praFees.reduce((s, f) => s + f.paidAmount, 0);
    const praLunasCount = praFees.filter(f => f.status === 'LUNAS').length;

    return {
      totalTarget,
      totalPaid,
      totalUnpaid,
      lunasCount,
      belumLunasCount,
      percentPaid,
      totalFeesCount: scopedFees.length,
      lksTarget,
      lksPaid,
      lksLunasCount,
      lksTotalCount: lksFees.length,
      praTarget,
      praPaid,
      praLunasCount,
      praTotalCount: praFees.length
    };
  }, [fees, selectedFeeType]);

  // Handle Pay Fee Submit
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal) return;

    const amountNum = Number(payAmount);
    if (!amountNum || amountNum <= 0) {
      alert('Masukkan nominal pembayaran yang valid.');
      return;
    }

    const remaining = showPaymentModal.targetAmount - showPaymentModal.paidAmount;
    if (amountNum > remaining) {
      alert(`Nominal bayar (${formatCurrency(amountNum)}) melebihi sisa tagihan (${formatCurrency(remaining)}).`);
      return;
    }

    // Check student savings balance if payment method is POTONG_TABUNGAN
    const student = students.find(s => s.id === showPaymentModal.studentId);
    if (payMethod === 'POTONG_TABUNGAN') {
      if (!student) {
        alert('Data siswa tidak ditemukan.');
        return;
      }
      if (student.balance < amountNum) {
        alert(`Saldo tabungan ${student.name} saat ini (${formatCurrency(student.balance)}) tidak mencukupi untuk pembayaran sebesar ${formatCurrency(amountNum)}.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const receiptNo = `KW-${showPaymentModal.feeType}-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      const newPayment: Omit<FeePayment, 'id'> = {
        feeId: showPaymentModal.id,
        studentId: showPaymentModal.studentId,
        amount: amountNum,
        date: new Date().toISOString(),
        method: payMethod,
        recordedBy: currentUserName || 'Guru Kelas 5',
        receiptNo,
        notes: payNotes || (payMethod === 'POTONG_TABUNGAN' ? 'Potong dari saldo tabungan siswa' : 'Pembayaran tunai')
      };

      await onPayFee(showPaymentModal.id, newPayment, payMethod === 'POTONG_TABUNGAN');
      
      // Open receipt modal
      const createdPayment: FeePayment = {
        ...newPayment,
        id: `pay-${Date.now()}`
      };
      
      const updatedFeeForReceipt: StudentFee = {
        ...showPaymentModal,
        paidAmount: showPaymentModal.paidAmount + amountNum,
        status: (showPaymentModal.paidAmount + amountNum >= showPaymentModal.targetAmount) ? 'LUNAS' : 'BELUM_LUNAS'
      };

      setShowPaymentModal(null);
      setPayAmount('');
      setPayNotes('');
      setShowReceiptModal({ fee: updatedFeeForReceipt, payment: createdPayment });
    } catch (err) {
      console.error('Failed to submit payment:', err);
      alert('Gagal menyimpan pembayaran: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Bulk Creation Submit
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(bulkAmount);
    if (!amountNum || amountNum <= 0) {
      alert('Masukkan nominal tagihan yang valid.');
      return;
    }
    if (bulkSelectedStudentIds.length === 0) {
      alert('Pilih minimal satu siswa untuk menerima tagihan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newFees: StudentFee[] = [];
      const now = new Date().toISOString();

      bulkSelectedStudentIds.forEach(studentId => {
        const student = students.find(s => s.id === studentId);
        if (student) {
          newFees.push({
            id: `fee-${bulkFeeType.toLowerCase()}-${student.id}-${Date.now().toString(36)}`,
            studentId: student.id,
            studentName: student.name,
            studentNis: student.nis,
            studentGrade: student.grade,
            feeType: bulkFeeType,
            title: bulkTitle.trim(),
            period: bulkPeriod.trim(),
            categoryName: bulkFeeType === 'LKS' ? 'Buku LKS' : bulkFeeType === 'PRAMUKA' ? 'Kepramukaan' : 'Lainnya',
            targetAmount: amountNum,
            paidAmount: 0,
            status: 'BELUM_LUNAS',
            createdAt: now,
            updatedAt: now,
            notes: bulkNotes.trim(),
            payments: []
          });
        }
      });

      await onBulkAddFee(newFees);
      setShowBulkModal(false);
      setBulkNotes('');
      alert(`Berhasil membuat ${newFees.length} tagihan ${bulkFeeType === 'LKS' ? 'Iuran LKS' : 'Iuran Pramuka'} untuk siswa Kelas 5!`);
    } catch (err) {
      console.error('Failed bulk fee creation:', err);
      alert('Gagal membuat tagihan: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Single Creation Submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleStudentId) {
      alert('Pilih siswa terlebih dahulu.');
      return;
    }
    const amountNum = Number(singleAmount);
    if (!amountNum || amountNum <= 0) {
      alert('Masukkan nominal tagihan yang valid.');
      return;
    }
    const student = students.find(s => s.id === singleStudentId);
    if (!student) return;

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const newFee: StudentFee = {
        id: `fee-${singleFeeType.toLowerCase()}-${student.id}-${Date.now().toString(36)}`,
        studentId: student.id,
        studentName: student.name,
        studentNis: student.nis,
        studentGrade: student.grade,
        feeType: singleFeeType,
        title: singleTitle.trim() || (singleFeeType === 'LKS' ? 'Buku LKS Semester 1' : 'Iuran Pramuka'),
        period: singlePeriod.trim(),
        categoryName: singleFeeType === 'LKS' ? 'Buku LKS' : singleFeeType === 'PRAMUKA' ? 'Kepramukaan' : 'Lainnya',
        targetAmount: amountNum,
        paidAmount: 0,
        status: 'BELUM_LUNAS',
        createdAt: now,
        updatedAt: now,
        notes: singleNotes.trim(),
        payments: []
      };

      await onAddFee(newFee);
      setShowSingleModal(false);
      setSingleStudentId('');
      setSingleTitle('');
      setSingleAmount('');
      setSingleNotes('');
      alert('Berhasil menambahkan tagihan untuk ' + student.name);
    } catch (err) {
      console.error('Failed single fee creation:', err);
      alert('Gagal membuat tagihan: ' + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Print Summary Report Handler
  const handlePrintSummary = () => {
    window.print();
  };

  // Export CSV Report Handler
  const handleExportCSV = () => {
    const headers = ['No', 'NIS', 'Nama Siswa', 'Kategori', 'Judul Iuran', 'Periode', 'Target Nominal (Rp)', 'Terbayar (Rp)', 'Sisa Tunggakan (Rp)', 'Status Pelunasan', 'Catatan'];
    
    const rows = filteredFees.map((f, idx) => [
      idx + 1,
      `'${f.studentNis}`,
      `"${f.studentName}"`,
      f.feeType,
      `"${f.title}"`,
      `"${f.period || '-'}"`,
      f.targetAmount,
      f.paidAmount,
      Math.max(0, f.targetAmount - f.paidAmount),
      f.status === 'LUNAS' ? 'SUDAH LUNAS' : 'BELUM LUNAS',
      `"${f.notes || '-'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Iuran_LKS_Pramuka_Kelas5_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="iuran-tagihan-container">
      
      {/* 1. Header Banner & Actions */}
      <div className="bg-white p-6 rounded-2xl neo-3d-slate flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 border-2 border-slate-900 text-white flex items-center justify-center shadow-[3px_3px_0px_0px_#0f172a] shrink-0">
            <Receipt size={24} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Manajemen Iuran & Tagihan Siswa
              </h1>
              <span className="bg-indigo-100 text-indigo-800 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-indigo-250 uppercase">
                Kelas 5
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Kelola pelunasan Iuran Buku LKS, Iuran Pramuka, dan kas siswa dengan status <b>SUDAH LUNAS</b> dan <b>BELUM LUNAS</b>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] flex items-center gap-1.5 cursor-pointer"
            title="Ekspor rekapitulasi ke format Excel/CSV"
          >
            <Download size={14} /> Ekspor CSV
          </button>
          
          <button
            onClick={handlePrintSummary}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] flex items-center gap-1.5 cursor-pointer"
            title="Cetak Laporan Rekapitulasi Iuran"
          >
            <Printer size={14} /> Cetak Laporan
          </button>

          <button
            onClick={() => setShowSingleModal(true)}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} /> + Per Siswa
          </button>

          <button
            onClick={handleOpenBulkModal}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-xl text-xs font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] flex items-center gap-1.5 cursor-pointer hover:translate-y-[-1px] transition-transform"
          >
            <Sparkles size={14} /> + Tagihan Massal Se-Kelas
          </button>
        </div>
      </div>

      {/* 2. Ringkasan Statistik Kartu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="iuran-stats-grid">
        
        {/* Total Tagihan */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl neo-3d-slate flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
              <DollarSign size={20} className="stroke-[2.5]" />
            </span>
            <span className="text-[10px] font-black bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-full uppercase">
              Target Tagihan
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xs text-slate-500 font-bold">Total Nilai Tagihan</p>
            <h3 className="text-2xl font-black text-slate-900 font-mono mt-0.5">
              {formatCurrency(stats.totalTarget)}
            </h3>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Jumlah Tagihan</span>
            <span className="font-bold text-slate-800 font-mono">{stats.totalFeesCount} item</span>
          </div>
        </motion.div>

        {/* Terbayar (Lunas) */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl neo-3d-emerald flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300">
              <CheckCircle2 size={20} className="stroke-[2.5]" />
            </span>
            <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full uppercase">
              Terkumpul ({stats.percentPaid}%)
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xs text-slate-500 font-bold">Total Dana Terbayar</p>
            <h3 className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
              {formatCurrency(stats.totalPaid)}
            </h3>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Sudah Lunas</span>
            <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              {stats.lunasCount} Siswa
            </span>
          </div>
        </motion.div>

        {/* Belum Lunas (Tunggakan) */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-2xl neo-3d-rose flex flex-col justify-between"
        >
          <div className="flex justify-between items-start">
            <span className="p-2.5 bg-rose-100 text-rose-800 rounded-xl border border-rose-300">
              <AlertCircle size={20} className="stroke-[2.5]" />
            </span>
            <span className="text-[10px] font-black bg-rose-100 text-rose-900 px-2 py-0.5 rounded-full uppercase">
              Sisa Tagihan
            </span>
          </div>
          <div className="mt-3">
            <p className="text-xs text-slate-500 font-bold">Total Belum Terbayar</p>
            <h3 className="text-2xl font-black text-rose-600 font-mono mt-0.5">
              {formatCurrency(stats.totalUnpaid)}
            </h3>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Belum Lunas</span>
            <span className="font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
              {stats.belumLunasCount} Siswa
            </span>
          </div>
        </motion.div>

        {/* Rasio LKS vs Pramuka */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-gradient-to-br from-indigo-700 to-indigo-900 p-5 rounded-2xl border-2 border-slate-900 text-white shadow-[4px_4px_0px_0px_#0f172a] flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="p-2 bg-white/20 rounded-xl">
                <Layers size={18} className="text-yellow-300" />
              </span>
              <span className="text-[10px] font-black bg-yellow-400 text-slate-950 px-2.5 py-0.5 rounded-full uppercase">
                Pos Utama
              </span>
            </div>
            <div className="mt-2.5 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-indigo-200 flex items-center gap-1">
                  <BookOpen size={13} className="text-yellow-300" /> Iuran LKS:
                </span>
                <span className="font-bold font-mono text-yellow-300">
                  {stats.lksLunasCount}/{stats.lksTotalCount} Lunas
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-indigo-200 flex items-center gap-1">
                  <Award size={13} className="text-emerald-300" /> Iuran Pramuka:
                </span>
                <span className="font-bold font-mono text-emerald-300">
                  {stats.praLunasCount}/{stats.praTotalCount} Lunas
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/20 text-[10px] text-indigo-100 flex items-center justify-between font-semibold">
            <span>Tingkat Pelunasan</span>
            <span className="font-black text-yellow-300">{stats.percentPaid}%</span>
          </div>
        </motion.div>

      </div>

      {/* 3. Filter Kategori Tab & Status Filter */}
      <div className="bg-white p-4 rounded-2xl neo-3d-slate flex flex-col lg:flex-row justify-between items-center gap-4 no-print" id="iuran-filter-bar">
        
        {/* Fee Type Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0">
          <button
            onClick={() => setSelectedFeeType('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedFeeType === 'ALL'
                ? 'bg-slate-900 text-white shadow-[2px_2px_0px_0px_#000]'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers size={14} /> Semua Iuran ({fees.length})
          </button>
          
          <button
            onClick={() => setSelectedFeeType('LKS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedFeeType === 'LKS'
                ? 'bg-indigo-600 text-white shadow-[2px_2px_0px_0px_#000]'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <BookOpen size={14} /> Iuran LKS ({fees.filter(f => f.feeType === 'LKS').length})
          </button>

          <button
            onClick={() => setSelectedFeeType('PRAMUKA')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedFeeType === 'PRAMUKA'
                ? 'bg-amber-600 text-white shadow-[2px_2px_0px_0px_#000]'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Award size={14} /> Iuran Pramuka ({fees.filter(f => f.feeType === 'PRAMUKA').length})
          </button>

          <button
            onClick={() => setSelectedFeeType('LAINNYA')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              selectedFeeType === 'LAINNYA'
                ? 'bg-emerald-600 text-white shadow-[2px_2px_0px_0px_#000]'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Iuran Lainnya
          </button>
        </div>

        {/* Status Filter & Search Bar */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto">
          
          {/* Status filter dropdown */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-250">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition-all ${
                selectedStatus === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setSelectedStatus('LUNAS')}
              className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition-all flex items-center gap-1 ${
                selectedStatus === 'LUNAS' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 size={11} /> Sudah Lunas
            </button>
            <button
              onClick={() => setSelectedStatus('BELUM_LUNAS')}
              className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition-all flex items-center gap-1 ${
                selectedStatus === 'BELUM_LUNAS' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <AlertCircle size={11} /> Belum Lunas
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 lg:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari siswa / tagihan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>

        </div>

      </div>

      {/* 4. Tabel Daftar Tagihan & Pelunasan */}
      <div className="bg-white rounded-2xl neo-3d-slate overflow-hidden border-2 border-slate-900" id="iuran-table-container">
        
        {/* Table Print Header */}
        <div className="hidden print:block p-6 border-b border-slate-900 text-center">
          <h2 className="text-xl font-black uppercase">SD NEGERI 1 GEMBLENGAN</h2>
          <h3 className="text-base font-bold text-slate-700">LAPORAN REKAPITULASI PELUNASAN IURAN SISWA KELAS 5</h3>
          <p className="text-xs text-slate-500 mt-1">Dicetak pada: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="fees-master-table">
            <thead>
              <tr className="bg-slate-100/90 border-b-2 border-slate-900 text-slate-700 text-xs font-black uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Nama Siswa & NIS</th>
                <th className="py-3.5 px-4">Jenis & Judul Iuran</th>
                <th className="py-3.5 px-4 text-right">Target Tagihan</th>
                <th className="py-3.5 px-4 text-right">Terbayar</th>
                <th className="py-3.5 px-4 text-right">Sisa Tagihan</th>
                <th className="py-3.5 px-4 text-center">Status Pelunasan</th>
                <th className="py-3.5 px-4 text-center no-print w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
              {filteredFees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Receipt size={36} className="text-slate-300 stroke-[1.5]" />
                      <p className="font-bold text-sm text-slate-600">Tidak ada data tagihan yang sesuai filter</p>
                      <p className="text-xs text-slate-400">Klik tombol "+ Tagihan Massal Se-Kelas" untuk membuat tagihan baru</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFees.map((fee, idx) => {
                  const student = students.find(s => s.id === fee.studentId);
                  const remaining = Math.max(0, fee.targetAmount - fee.paidAmount);
                  const isLunas = fee.status === 'LUNAS';

                  return (
                    <tr 
                      key={fee.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isLunas ? 'bg-emerald-50/20' : 'bg-rose-50/20'
                      }`}
                    >
                      {/* No */}
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Siswa & NIS */}
                      <td className="py-3 px-4">
                        <div className="font-black text-slate-900">{fee.studentName}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <span>NIS: {fee.studentNis}</span>
                          <span>•</span>
                          <span className="text-indigo-600 font-bold">Saldo: {formatCurrency(student?.balance || 0)}</span>
                        </div>
                      </td>

                      {/* Jenis & Judul */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            fee.feeType === 'LKS'
                              ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                              : fee.feeType === 'PRAMUKA'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          }`}>
                            {fee.feeType === 'LKS' ? '📘 Iuran LKS' : fee.feeType === 'PRAMUKA' ? '🏕️ Pramuka' : '🏷️ Lainnya'}
                          </span>
                          {fee.period && (
                            <span className="text-[10px] text-slate-500 font-medium">({fee.period})</span>
                          )}
                        </div>
                        <div className="font-bold text-slate-800 mt-1">{fee.title}</div>
                        {fee.notes && (
                          <div className="text-[11px] text-slate-400 italic mt-0.5">{fee.notes}</div>
                        )}
                      </td>

                      {/* Target Tagihan */}
                      <td className="py-3 px-4 text-right font-black font-mono text-slate-900">
                        {formatCurrency(fee.targetAmount)}
                      </td>

                      {/* Terbayar */}
                      <td className="py-3 px-4 text-right font-black font-mono text-emerald-600">
                        {formatCurrency(fee.paidAmount)}
                      </td>

                      {/* Sisa Tagihan */}
                      <td className="py-3 px-4 text-right font-black font-mono">
                        {remaining > 0 ? (
                          <span className="text-rose-600">-{formatCurrency(remaining)}</span>
                        ) : (
                          <span className="text-slate-400">Rp 0</span>
                        )}
                      </td>

                      {/* Status Pelunasan */}
                      <td className="py-3 px-4 text-center">
                        {isLunas ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500 text-white font-black text-[11px] px-3 py-1 rounded-full shadow-[1.5px_1.5px_0px_0px_#065f46] border border-emerald-600">
                            <CheckCircle2 size={12} className="stroke-[3]" /> SUDAH LUNAS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-rose-500 text-white font-black text-[11px] px-3 py-1 rounded-full shadow-[1.5px_1.5px_0px_0px_#881337] border border-rose-600 animate-pulse">
                            <AlertTriangle size={12} className="stroke-[3]" /> BELUM LUNAS
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-4 text-center no-print">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isLunas ? (
                            <button
                              onClick={() => {
                                setShowPaymentModal(fee);
                                setPayAmount(String(remaining));
                                setPayMethod('TUNAI');
                              }}
                              className="px-2.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-lg text-xs font-black border border-slate-900 shadow-[1.5px_1.5px_0px_0px_#0f172a] flex items-center gap-1 cursor-pointer"
                              title="Catat Pembayaran / Pelunasan"
                            >
                              <CreditCard size={12} /> Bayar
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const lastPayment = fee.payments && fee.payments.length > 0
                                  ? fee.payments[fee.payments.length - 1]
                                  : {
                                      id: `pay-${fee.id}`,
                                      feeId: fee.id,
                                      studentId: fee.studentId,
                                      amount: fee.paidAmount,
                                      date: fee.updatedAt || fee.createdAt,
                                      method: 'TUNAI' as const,
                                      recordedBy: 'Guru Kelas 5',
                                      receiptNo: `KW-${fee.feeType}-001`
                                    };
                                setShowReceiptModal({ fee, payment: lastPayment });
                              }}
                              className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300 flex items-center gap-1 cursor-pointer"
                              title="Lihat & Cetak Kuitansi"
                            >
                              <Printer size={12} /> Kuitansi
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm(`Hapus tagihan "${fee.title}" untuk ${fee.studentName}?`)) {
                                onDeleteFee(fee.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Tagihan"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footing Summary */}
            {filteredFees.length > 0 && (
              <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-black text-xs text-slate-900">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right uppercase">Total Rekapitulasi:</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-900">{formatCurrency(stats.totalTarget)}</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-600">{formatCurrency(stats.totalPaid)}</td>
                  <td className="py-3 px-4 text-right font-mono text-rose-600">-{formatCurrency(stats.totalUnpaid)}</td>
                  <td className="py-3 px-4 text-center font-mono text-emerald-700 font-black">
                    {stats.lunasCount} Lunas / {stats.belumLunasCount} Belum
                  </td>
                  <td className="py-3 px-4 no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* 5. MODAL: CATAT PEMBAYARAN / PELUNASAN IURAN */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-2xl neo-3d-slate p-6 border-2 border-slate-900 shadow-2xl relative"
            >
              <button
                onClick={() => setShowPaymentModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-yellow-400 text-slate-950 rounded-xl border border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
                  <CreditCard size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Pembayaran / Pelunasan Iuran</h3>
                  <p className="text-xs text-slate-500 font-medium">{showPaymentModal.studentName} ({showPaymentModal.studentNis})</p>
                </div>
              </div>

              {/* Detail Tagihan Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Judul Tagihan:</span>
                  <span className="font-bold text-slate-800">{showPaymentModal.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kategori / Pos:</span>
                  <span className="font-bold text-indigo-700">
                    {showPaymentModal.feeType === 'LKS' ? 'Buku LKS' : showPaymentModal.feeType === 'PRAMUKA' ? 'Kegiatan Pramuka' : 'Lainnya'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Tagihan:</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(showPaymentModal.targetAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sudah Terbayar:</span>
                  <span className="font-mono font-bold text-emerald-600">{formatCurrency(showPaymentModal.paidAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black">
                  <span className="text-rose-600">Sisa Tagihan:</span>
                  <span className="font-mono text-rose-600">
                    {formatCurrency(Math.max(0, showPaymentModal.targetAmount - showPaymentModal.paidAmount))}
                  </span>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4 mt-4">
                
                {/* Nominal Bayar */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Nominal Pembayaran (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">Rp</span>
                    <input
                      type="number"
                      required
                      min="1000"
                      max={showPaymentModal.targetAmount - showPaymentModal.paidAmount}
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="Masukkan nominal bayar..."
                      className="w-full pl-9 pr-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-sm font-mono font-black text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setPayAmount(String(showPaymentModal.targetAmount - showPaymentModal.paidAmount))}
                      className="text-[11px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                    >
                      Bayar Lunas Semua ({formatCurrency(showPaymentModal.targetAmount - showPaymentModal.paidAmount)})
                    </button>
                  </div>
                </div>

                {/* Metode Pembayaran */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Metode Pembayaran <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayMethod('TUNAI')}
                      className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        payMethod === 'TUNAI'
                          ? 'border-slate-900 bg-indigo-50 text-indigo-900 shadow-[2px_2px_0px_0px_#0f172a]'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400'
                      }`}
                    >
                      <DollarSign size={16} className="text-indigo-600" />
                      <span>Uang Tunai (Cash)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayMethod('POTONG_TABUNGAN')}
                      className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        payMethod === 'POTONG_TABUNGAN'
                          ? 'border-slate-900 bg-yellow-50 text-yellow-950 shadow-[2px_2px_0px_0px_#0f172a]'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400'
                      }`}
                    >
                      <Wallet size={16} className="text-yellow-600" />
                      <span>Potong Dari Tabungan</span>
                    </button>
                  </div>

                  {payMethod === 'POTONG_TABUNGAN' && (
                    <div className="mt-2 p-2.5 bg-yellow-50 rounded-xl border border-yellow-300 text-[11px] text-yellow-900 font-medium">
                      💡 <b>Auto-Debit:</b> Saldo tabungan siswa (saat ini: <b>{formatCurrency(students.find(s => s.id === showPaymentModal.studentId)?.balance || 0)}</b>) akan otomatis terpotong dan tercatat di buku tabungan.
                    </div>
                  )}
                </div>

                {/* Catatan */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                  <input
                    type="text"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    placeholder="Contoh: Lunas saat pembagian buku / titip wali murid"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                {/* Tombol Simpan */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} /> {isSubmitting ? 'Menyimpan...' : 'Simpan & Lunasi'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MODAL: BUAT TAGIHAN MASSAL SE-KELAS */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-xl rounded-2xl neo-3d-slate p-6 border-2 border-slate-900 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowBulkModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-yellow-400 text-slate-950 rounded-xl border border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
                  <Sparkles size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Buat Tagihan Massal Se-Kelas</h3>
                  <p className="text-xs text-slate-500 font-medium">Generate tagihan serentak untuk seluruh siswa Kelas 5</p>
                </div>
              </div>

              <form onSubmit={handleBulkSubmit} className="space-y-4 mt-4">
                
                {/* Pilihan Jenis Iuran */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">Pilih Jenis Iuran:</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleBulkTypeChange('LKS')}
                      className={`p-3 rounded-xl border-2 font-black text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        bulkFeeType === 'LKS'
                          ? 'border-slate-900 bg-indigo-50 text-indigo-900 shadow-[2px_2px_0px_0px_#0f172a]'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400'
                      }`}
                    >
                      <BookOpen size={16} className="text-indigo-600" />
                      <span>📘 Iuran LKS</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBulkTypeChange('PRAMUKA')}
                      className={`p-3 rounded-xl border-2 font-black text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        bulkFeeType === 'PRAMUKA'
                          ? 'border-slate-900 bg-amber-50 text-amber-950 shadow-[2px_2px_0px_0px_#0f172a]'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400'
                      }`}
                    >
                      <Award size={16} className="text-amber-600" />
                      <span>🏕️ Pramuka</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleBulkTypeChange('LAINNYA')}
                      className={`p-3 rounded-xl border-2 font-black text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        bulkFeeType === 'LAINNYA'
                          ? 'border-slate-900 bg-emerald-50 text-emerald-950 shadow-[2px_2px_0px_0px_#0f172a]'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400'
                      }`}
                    >
                      <Receipt size={16} className="text-emerald-600" />
                      <span>🏷️ Lainnya</span>
                    </button>
                  </div>
                </div>

                {/* Judul Tagihan */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Judul Tagihan / Nama Paket <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bulkTitle}
                    onChange={(e) => setBulkTitle(e.target.value)}
                    placeholder="Contoh: Paket Buku LKS Tema 1 s.d 5"
                    className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Periode & Nominal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">Periode / Semester</label>
                    <input
                      type="text"
                      value={bulkPeriod}
                      onChange={(e) => setBulkPeriod(e.target.value)}
                      placeholder="Semester 1 2026/2027"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      Nominal per Siswa (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">Rp</span>
                      <input
                        type="number"
                        required
                        min="1000"
                        value={bulkAmount}
                        onChange={(e) => setBulkAmount(e.target.value)}
                        placeholder="65000"
                        className="w-full pl-9 pr-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-mono font-black text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Pilih Siswa Checklist */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-black text-slate-700">
                      Pilih Siswa Penerima ({bulkSelectedStudentIds.length}/{students.length} terpilih):
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (bulkSelectedStudentIds.length === students.length) {
                          setBulkSelectedStudentIds([]);
                        } else {
                          setBulkSelectedStudentIds(students.map(s => s.id));
                        }
                      }}
                      className="text-[11px] font-black text-indigo-700 hover:underline cursor-pointer"
                    >
                      {bulkSelectedStudentIds.length === students.length ? 'Batal Pilih Semua' : 'Pilih Semua Siswa'}
                    </button>
                  </div>
                  
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50 space-y-1 divide-y divide-slate-100">
                    {students.map((student) => {
                      const isChecked = bulkSelectedStudentIds.includes(student.id);
                      return (
                        <label 
                          key={student.id} 
                          className="flex items-center justify-between p-1.5 hover:bg-white rounded-lg cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setBulkSelectedStudentIds([...bulkSelectedStudentIds, student.id]);
                                } else {
                                  setBulkSelectedStudentIds(bulkSelectedStudentIds.filter(id => id !== student.id));
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="font-bold text-slate-800">{student.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">NIS: {student.nis}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Catatan */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Catatan Tambahan</label>
                  <input
                    type="text"
                    value={bulkNotes}
                    onChange={(e) => setBulkNotes(e.target.value)}
                    placeholder="Contoh: Pembayaran paling lambat akhir bulan Agustus"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || bulkSelectedStudentIds.length === 0}
                    className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-black rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Check size={14} /> {isSubmitting ? 'Memproses...' : `Buat ${bulkSelectedStudentIds.length} Tagihan`}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. MODAL: BUAT TAGIHAN PER SISWA */}
      <AnimatePresence>
        {showSingleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl neo-3d-slate p-6 border-2 border-slate-900 shadow-2xl relative"
            >
              <button
                onClick={() => setShowSingleModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-indigo-100 text-indigo-900 rounded-xl border border-slate-900 shadow-[2px_2px_0px_0px_#0f172a]">
                  <Plus size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Tambah Tagihan Per Siswa</h3>
                  <p className="text-xs text-slate-500 font-medium">Buat tagihan khusus untuk satu orang siswa</p>
                </div>
              </div>

              <form onSubmit={handleSingleSubmit} className="space-y-3.5 mt-4">
                
                {/* Pilih Siswa */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Pilih Siswa <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={singleStudentId}
                    onChange={(e) => setSingleStudentId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  >
                    <option value="">-- Pilih Siswa Kelas 5 --</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (NIS: {s.nis})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Jenis Iuran */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Jenis Iuran</label>
                  <select
                    value={singleFeeType}
                    onChange={(e) => setSingleFeeType(e.target.value as FeeType)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    <option value="LKS">📘 Iuran Buku LKS</option>
                    <option value="PRAMUKA">🏕️ Iuran Kegiatan Pramuka</option>
                    <option value="LAINNYA">🏷️ Iuran Lainnya</option>
                  </select>
                </div>

                {/* Judul Tagihan */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Judul Tagihan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={singleTitle}
                    onChange={(e) => setSingleTitle(e.target.value)}
                    placeholder="Contoh: Paket Buku LKS Semester Ganjil"
                    className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Nominal */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    Nominal Tagihan (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">Rp</span>
                    <input
                      type="number"
                      required
                      min="1000"
                      value={singleAmount}
                      onChange={(e) => setSingleAmount(e.target.value)}
                      placeholder="65000"
                      className="w-full pl-9 pr-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-mono font-black text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Periode */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Periode</label>
                  <input
                    type="text"
                    value={singlePeriod}
                    onChange={(e) => setSinglePeriod(e.target.value)}
                    placeholder="Semester 1 2026/2027"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Catatan */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">Catatan</label>
                  <input
                    type="text"
                    value={singleNotes}
                    onChange={(e) => setSingleNotes(e.target.value)}
                    placeholder="Catatan tambahan..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowSingleModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] cursor-pointer disabled:opacity-50"
                  >
                    Simpan Tagihan
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. MODAL: KUITANSI RESMI PELUNASAN IURAN (SIAP CETAK) */}
      <AnimatePresence>
        {showReceiptModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-2xl neo-3d-slate p-6 border-2 border-slate-900 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 no-print">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                  <span className="font-black text-slate-900 text-sm">Bukti Pembayaran / Kuitansi</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Printer size={13} /> Cetak Kuitansi
                  </button>
                  <button
                    onClick={() => setShowReceiptModal(null)}
                    className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Tampilan Struk / Kuitansi Resmi */}
              <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl mt-4 font-mono text-xs text-slate-800 space-y-3">
                <div className="text-center border-b border-slate-200 pb-2">
                  <h4 className="font-black text-sm uppercase">SD NEGERI 1 GEMBLENGAN</h4>
                  <p className="text-[10px] text-slate-500">KUITANSI RESMI PEMBAYARAN IURAN KELAS 5</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">No: {showReceiptModal.payment.receiptNo || 'KW-2026-001'}</p>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tanggal:</span>
                    <span className="font-bold">{formatDate(showReceiptModal.payment.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Siswa:</span>
                    <span className="font-bold">{showReceiptModal.fee.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">NIS Siswa:</span>
                    <span className="font-bold">{showReceiptModal.fee.studentNis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pos / Jenis Iuran:</span>
                    <span className="font-bold text-indigo-700">
                      {showReceiptModal.fee.feeType === 'LKS' ? 'Iuran Lembar Kerja Siswa (LKS)' : 'Iuran Kegiatan Pramuka'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Keterangan Tagihan:</span>
                    <span className="font-bold">{showReceiptModal.fee.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Metode Bayar:</span>
                    <span className="font-bold">{showReceiptModal.payment.method === 'POTONG_TABUNGAN' ? 'Potong Tabungan' : 'Tunai (Cash)'}</span>
                  </div>
                </div>

                <div className="border-t border-b border-slate-200 py-2.5 my-2 flex justify-between items-center text-sm font-black">
                  <span>JUMLAH DIBAYAR:</span>
                  <span className="text-emerald-700 font-bold">{formatCurrency(showReceiptModal.payment.amount)}</span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Status Tagihan:</span>
                  <span className={`font-black px-2 py-0.5 rounded ${
                    showReceiptModal.fee.status === 'LUNAS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                  }`}>
                    {showReceiptModal.fee.status === 'LUNAS' ? 'SUDAH LUNAS' : 'BELUM LUNAS (SEBAGIAN)'}
                  </span>
                </div>

                <div className="pt-4 flex justify-between items-end text-[10px] text-slate-500">
                  <div>
                    <p>Penyetor,</p>
                    <p className="mt-8 font-bold text-slate-700">{showReceiptModal.fee.studentName}</p>
                  </div>
                  <div className="text-right">
                    <p>Bendahara / Guru Kelas,</p>
                    <p className="mt-8 font-bold text-slate-700">{showReceiptModal.payment.recordedBy}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center no-print">
                <button
                  onClick={() => setShowReceiptModal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Tutup
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
