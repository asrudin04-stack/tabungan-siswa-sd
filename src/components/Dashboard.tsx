import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  ArrowDownRight, 
  ArrowUpRight, 
  Users, 
  Wallet, 
  Calendar, 
  Trophy, 
  Clock, 
  Sparkles,
  School,
  LineChart as LineChartIcon,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Scale,
  BookOpen,
  Award,
  Receipt,
  ArrowRight,
  CloudCheck,
  Cloud
} from 'lucide-react';
import { Student, Transaction, GradeClass, StudentFee } from '../types';
import { formatCurrency, getClassBadgeStyle, getIndonesianMonthYear } from '../utils';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  Cell 
} from 'recharts';

interface DashboardProps {
  students: Student[];
  transactions: Transaction[];
  fees?: StudentFee[];
  syncStatus?: 'synced' | 'saving' | 'error';
  lastSyncTime?: Date | null;
  onSyncNow?: () => void;
  onViewStudent: (student: Student) => void;
  onNavigateToTab: (tab: string) => void;
  onReconcileBalances?: () => void;
}

export default function Dashboard({ 
  students, 
  transactions, 
  fees = [],
  syncStatus = 'synced',
  lastSyncTime,
  onSyncNow,
  onViewStudent, 
  onNavigateToTab,
  onReconcileBalances 
}: DashboardProps) {
  // Manual sync loading state
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    if (onSyncNow) {
      setIsSyncing(true);
      try {
        await onSyncNow();
      } finally {
        setTimeout(() => setIsSyncing(false), 600);
      }
    }
  };
  // Available Month-Year filters from transactions
  const monthFilters = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      // Date in ISO format -> extract YYYY-MM
      if (t.date) {
        const yyyymm = t.date.substring(0, 7);
        months.add(yyyymm);
      }
    });
    // Sort descending
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Selected Month filter, defaults to the latest available month, or "ALL"
  const [selectedMonth, setSelectedMonth] = useState<string>(
    monthFilters[0] || new Date().toISOString().substring(0, 7)
  );

  // Filter transactions based on date
  const filteredTransactions = useMemo(() => {
    if (selectedMonth === 'ALL') return transactions;
    return transactions.filter(t => t.date && t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Statistics calculations
  const stats = useMemo(() => {
    // 1. All-time global ledger calculations
    let allTimeDeposits = 0;
    let allTimeWithdrawals = 0;
    transactions.forEach(t => {
      if (t.type === 'SETOR') {
        allTimeDeposits += t.amount;
      } else if (t.type === 'TARIK') {
        allTimeWithdrawals += t.amount;
      }
    });

    const allTimeNetLedger = allTimeDeposits - allTimeWithdrawals;
    // Current total student balances in school bank
    const schoolTotalSavings = students.reduce((sum, s) => sum + s.balance, 0);

    // 2. Selected period calculations
    let deposits = 0;
    let withdrawals = 0;
    let priorDeposits = 0;
    let priorWithdrawals = 0;
    
    if (selectedMonth === 'ALL') {
      deposits = allTimeDeposits;
      withdrawals = allTimeWithdrawals;
    } else {
      transactions.forEach(t => {
        const tDate = t.date || '';
        const tMonth = tDate.substring(0, 7);
        if (tMonth < selectedMonth) {
          if (t.type === 'SETOR') priorDeposits += t.amount;
          else if (t.type === 'TARIK') priorWithdrawals += t.amount;
        } else if (tMonth === selectedMonth) {
          if (t.type === 'SETOR') deposits += t.amount;
          else if (t.type === 'TARIK') withdrawals += t.amount;
        }
      });
    }

    const startingBalance = priorDeposits - priorWithdrawals;
    const netPeriodAmount = deposits - withdrawals;
    const periodEndingBalance = selectedMonth === 'ALL' ? allTimeNetLedger : (startingBalance + netPeriodAmount);

    // Discrepancy check between student balances sum and total ledger transactions
    const discrepancy = Math.abs(schoolTotalSavings - allTimeNetLedger);
    const isBalanced = discrepancy === 0;

    // Active students with savings > 0
    const activeSaverCount = students.filter(s => s.balance > 0).length;

    return {
      schoolTotalSavings,
      allTimeDeposits,
      allTimeWithdrawals,
      allTimeNetLedger,
      startingBalance,
      deposits,
      withdrawals,
      netTransactionAmount: netPeriodAmount,
      periodEndingBalance,
      discrepancy,
      isBalanced,
      activeSaverCount,
      totalStudentsCount: students.length
    };
  }, [students, transactions, selectedMonth]);

  // Fee (Iuran) Overview statistics
  const feeOverview = useMemo(() => {
    let totalTarget = 0;
    let totalPaid = 0;
    let lunasCount = 0;
    let belumLunasCount = 0;

    fees.forEach(f => {
      totalTarget += f.targetAmount;
      totalPaid += f.paidAmount;
      if (f.status === 'LUNAS') {
        lunasCount++;
      } else {
        belumLunasCount++;
      }
    });

    const lksFees = fees.filter(f => f.feeType === 'LKS');
    const lksLunas = lksFees.filter(f => f.status === 'LUNAS').length;
    const praFees = fees.filter(f => f.feeType === 'PRAMUKA');
    const praLunas = praFees.filter(f => f.status === 'LUNAS').length;
    const percentPaid = totalTarget > 0 ? Math.round((totalPaid / totalTarget) * 100) : 0;

    return {
      totalTarget,
      totalPaid,
      totalUnpaid: Math.max(0, totalTarget - totalPaid),
      lunasCount,
      belumLunasCount,
      percentPaid,
      totalCount: fees.length,
      lksLunas,
      lksTotal: lksFees.length,
      praLunas,
      praTotal: praFees.length
    };
  }, [fees]);

  // Class statistics (Kelas 5)
  const classSavingsInfo = useMemo(() => {
    const total = students.reduce((acc, s) => acc + s.balance, 0);
    const count = students.length;
    const avg = count > 0 ? Math.round(total / count) : 0;
    return {
      grade: 'Kelas 5',
      total,
      count,
      avg
    };
  }, [students]);

  // Filtered daily transaction timeline for selected month (to feed Recharts area chart)
  const chartTimelineData = useMemo(() => {
    if (selectedMonth === 'ALL') {
      // Group by month
      const monthlyGroups: Record<string, { name: string; Setor: number; Tarik: number }> = {};
      
      // Let's seed back last 6 months chronologically
      const lastMonths = [...monthFilters].reverse();
      lastMonths.forEach(mY => {
        monthlyGroups[mY] = {
          name: getIndonesianMonthYear(mY).split(' ')[0], // only month name
          Setor: 0,
          Tarik: 0
        };
      });

      transactions.forEach(t => {
        const my = t.date.substring(0, 7);
        if (monthlyGroups[my]) {
          if (t.type === 'SETOR') {
            monthlyGroups[my].Setor += t.amount;
          } else {
            monthlyGroups[my].Tarik += t.amount;
          }
        }
      });
      return Object.values(monthlyGroups);
    } else {
      // Group by day of the selected month
      const dailyGroups: Record<string, { day: number; dateStr: string; Setor: number; Tarik: number }> = {};
      
      // Get number of days in the selected month
      const [year, month] = selectedMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // Pre-populate days
      for (let day = 1; day <= daysInMonth; day++) {
        const paddedDay = String(day).padStart(2, '0');
        dailyGroups[`${selectedMonth}-${paddedDay}`] = {
          day,
          dateStr: `${day}`,
          Setor: 0,
          Tarik: 0
        };
      }

      filteredTransactions.forEach(t => {
        const datePart = t.date.substring(0, 10); // YYYY-MM-DD
        if (dailyGroups[datePart]) {
          if (t.type === 'SETOR') {
            dailyGroups[datePart].Setor += t.amount;
          } else {
            dailyGroups[datePart].Tarik += t.amount;
          }
        }
      });

      // Filter out days with zero transactions to make the charts tighter, or keep all days for continuity.
      // Keeping all days gives a smoother line.
      return Object.values(dailyGroups).map(item => ({
        name: `Tgl ${item.day}`,
        Setor: item.Setor,
        Tarik: item.Tarik
      }));
    }
  }, [transactions, filteredTransactions, selectedMonth, monthFilters]);

  // 6-Month Savings Trend Data for Recharts LineChart
  const sixMonthTrendData = useMemo(() => {
    const result: Array<{
      monthKey: string;
      monthLabel: string;
      fullLabel: string;
      Setoran: number;
      Penarikan: number;
      TabunganBersih: number;
      txCount: number;
    }> = [];

    const now = new Date();
    let refYear = now.getFullYear();
    let refMonth = now.getMonth();

    if (transactions.length > 0) {
      const dates = transactions.map(t => t.date).filter(Boolean).sort();
      if (dates.length > 0) {
        const maxDate = new Date(dates[dates.length - 1]);
        if (maxDate > now) {
          refYear = maxDate.getFullYear();
          refMonth = maxDate.getMonth();
        }
      }
    }

    for (let i = 5; i >= 0; i--) {
      const d = new Date(refYear, refMonth - i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const mKey = `${yyyy}-${mm}`;

      let setoran = 0;
      let penarikan = 0;
      let count = 0;

      transactions.forEach(t => {
        if (t.date && t.date.startsWith(mKey)) {
          count++;
          if (t.type === 'SETOR') setoran += t.amount;
          else if (t.type === 'TARIK') penarikan += t.amount;
        }
      });

      const fullLabel = getIndonesianMonthYear(mKey);
      const monthLabel = fullLabel.split(' ')[0];

      result.push({
        monthKey: mKey,
        monthLabel,
        fullLabel,
        Setoran: setoran,
        Penarikan: penarikan,
        TabunganBersih: setoran - penarikan,
        txCount: count
      });
    }

    return result;
  }, [transactions]);

  // Insights and metrics derived from 6-Month Trend Data
  const sixMonthMetrics = useMemo(() => {
    const totalSetoran = sixMonthTrendData.reduce((acc, curr) => acc + curr.Setoran, 0);
    const totalPenarikan = sixMonthTrendData.reduce((acc, curr) => acc + curr.Penarikan, 0);
    const avgMonthlySetor = Math.round(totalSetoran / (sixMonthTrendData.length || 1));
    
    // Find peak deposit month
    let peakMonth = sixMonthTrendData[0] || { fullLabel: '-', Setoran: 0 };
    sixMonthTrendData.forEach(item => {
      if (item.Setoran > peakMonth.Setoran) {
        peakMonth = item;
      }
    });

    return {
      totalSetoran,
      totalPenarikan,
      netTotal: totalSetoran - totalPenarikan,
      avgMonthlySetor,
      peakMonth
    };
  }, [sixMonthTrendData]);

  // Top 5 Savers
  const topSavers = useMemo(() => {
    return [...students]
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);
  }, [students]);

  // Recent 5 Transactions
  const recentTransactions = useMemo(() => {
    return [...filteredTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [filteredTransactions]);

  // Theme and colorful chart configurations
  const COLORS = ['#10b981', '#0ea5e9', '#6366f1', '#8b5cf6', '#f59e0b', '#f43f5e'];

  return (
    <div className="space-y-6 animate-fade-in" id="dashboard-container">
      {/* Upper Welcome and Month Filter Banner - Visual Ceria & 3D */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-amber-50 p-6 rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_#f59e0b]" id="welcome-banner">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg inline-flex neo-3d-button animate-bounce-gentle">
              <Sparkles size={18} className="animate-spin" style={{ animationDuration: '6s' }} />
            </span>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-700 font-mono">⚡ Sistem Tabungan Kelas 5 SD Negeri 1 Gemblengan</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight mt-1">
            Dashboard Tabungan 👋
          </h1>
          <p className="text-sm font-semibold text-slate-650 text-slate-600 mt-1">
            Pantau arus tabungan siswa secara real-time, cetak rekapitulasi, dan kelola setoran siswa dengan mudah.
          </p>
        </div>

        {/* Controls: Tombol Sinkronisasi Cloud + Month Filter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Tombol Sinkronisasi Cloud */}
          <button
            id="btn-sync-cloud"
            onClick={handleManualSync}
            disabled={isSyncing || syncStatus === 'saving'}
            className={`px-3.5 py-2 rounded-xl text-xs font-black border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] flex items-center gap-2 cursor-pointer transition-all hover:translate-y-[-1px] ${
              syncStatus === 'error'
                ? 'bg-rose-100 text-rose-900 hover:bg-rose-200'
                : isSyncing || syncStatus === 'saving'
                ? 'bg-amber-100 text-amber-900 cursor-wait'
                : 'bg-white hover:bg-emerald-50 text-slate-900'
            }`}
            title="Klik untuk menyinkronkan data lokal dengan Firebase Cloud Firestore"
          >
            <RefreshCw 
              size={14} 
              className={`${isSyncing || syncStatus === 'saving' ? 'animate-spin text-amber-600' : 'text-emerald-600'}`} 
            />
            <span>
              {isSyncing || syncStatus === 'saving' 
                ? 'Sinkronisasi...' 
                : syncStatus === 'error' 
                ? 'Sinkron Ulang' 
                : 'Sinkronkan Data'}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
          </button>

          {/* Dynamic Month Filter */}
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0f172a] w-fit">
            <span className="p-1 text-indigo-600 ml-1.5 animate-bounce-gentle">
              <Calendar size={16} />
            </span>
            <select 
              id="month-filter-dropdown"
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm font-black text-slate-800 focus:outline-none pr-3 py-1 cursor-pointer"
            >
              <option value="ALL">Semua Periode</option>
              {monthFilters.map(my => (
                <option key={my} value={my}>
                  {getIndonesianMonthYear(my)}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Grid Statis / Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="bento-grid-stats">
        
        {/* Total Saldo Keseluruhan */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          className="relative overflow-hidden bg-gradient-to-br from-indigo-550 via-indigo-600 to-purple-600 text-white p-6 rounded-2xl border-2 border-slate-900 shadow-[6px_6px_0px_0px_#4f46e5] group"
          id="stat-box-total"
        >
          {/* Subtle decorative circles */}
          <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
          <div className="absolute left-[-20px] top-[-20px] w-20 h-20 bg-indigo-400/30 rounded-full blur-lg" />
          
          <div className="flex justify-between items-start">
            <span className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl border border-white/20">
              <Wallet size={20} className="text-white" />
            </span>
            <span className="text-[10px] font-black bg-yellow-400 text-slate-950 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {selectedMonth === 'ALL' ? 'Total Saldo Kas' : 'Saldo Kas Sekolah'}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-indigo-100 font-bold">Total Dana Tabungan Siswa</p>
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight font-mono text-yellow-300 mt-1 drop-shadow-sm">
              {formatCurrency(stats.schoolTotalSavings)}
            </h3>
          </div>
          <div className="mt-3 text-[11px] flex items-center justify-between text-indigo-100 font-semibold border-t border-white/20 pt-2">
            <span className="flex items-center gap-1">
              <School size={12} className="text-yellow-300" />
              <span>Rekening Kas Kelas 5</span>
            </span>
            {selectedMonth !== 'ALL' && (
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-mono font-bold">
                Net Bln: {stats.netTransactionAmount >= 0 ? '+' : ''}{formatCurrency(stats.netTransactionAmount)}
              </span>
            )}
          </div>
        </motion.div>

        {/* Total Setoran */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-white p-6 rounded-2xl neo-3d-emerald flex flex-col justify-between"
          id="stat-box-setor"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-250">
                <ArrowUpRight size={20} className="stroke-[3]" />
              </span>
              <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full uppercase tracking-wider block">
                {selectedMonth === 'ALL' ? 'Total Setor' : 'Setor Bulan Ini'}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500 font-bold">
                {selectedMonth === 'ALL' ? 'Seluruh Setoran Masuk' : `Setoran (${getIndonesianMonthYear(selectedMonth).split(' ')[0]})`}
              </p>
              <h3 className="text-2xl font-black tracking-tight text-emerald-600 font-mono mt-1">
                {formatCurrency(stats.deposits)}
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>Kredit Uang Masuk</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-black flex items-center gap-0.5">
              <TrendingUp size={12} /> {filteredTransactions.filter(t => t.type === 'SETOR').length}x Setor
            </span>
          </div>
        </motion.div>

        {/* Total Penarikan */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-white p-6 rounded-2xl neo-3d-rose flex flex-col justify-between"
          id="stat-box-tarik"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="p-2.5 bg-rose-100 text-rose-800 rounded-xl border border-rose-250">
                <ArrowDownRight size={20} className="stroke-[3]" />
              </span>
              <span className="text-[10px] font-black text-rose-800 bg-rose-100 px-2.5 py-1 rounded-full uppercase tracking-wider block">
                {selectedMonth === 'ALL' ? 'Total Tarik' : 'Tarik Bulan Ini'}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500 font-bold">
                {selectedMonth === 'ALL' ? 'Seluruh Penarikan Keluar' : `Penarikan (${getIndonesianMonthYear(selectedMonth).split(' ')[0]})`}
              </p>
              <h3 className="text-2xl font-black tracking-tight text-rose-600 font-mono mt-1">
                {formatCurrency(stats.withdrawals)}
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>Debit Uang Keluar</span>
            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-black">
              {filteredTransactions.filter(t => t.type === 'TARIK').length}x Tarik
            </span>
          </div>
        </motion.div>

        {/* Arus Kas Bersih / Partisipasi Siswa */}
        <motion.div 
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-white p-6 rounded-2xl neo-3d-sky flex flex-col justify-between"
          id="stat-box-siswa"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="p-2.5 bg-sky-100 text-sky-800 rounded-xl border border-sky-250">
                {selectedMonth === 'ALL' ? <Users size={20} className="stroke-[2.5]" /> : <Scale size={20} className="stroke-[2.5]" />}
              </span>
              <span className="text-[10px] font-black text-sky-800 bg-sky-100 px-2.5 py-1 rounded-full uppercase tracking-wider block">
                {selectedMonth === 'ALL' ? 'Partisipasi Siswa' : 'Tabungan Bersih'}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500 font-bold">
                {selectedMonth === 'ALL' ? 'Rasio Siswa Menabung' : 'Mutasi Bersih (Setor - Tarik)'}
              </p>
              <h3 className={`text-2xl font-black tracking-tight font-mono mt-1 ${
                selectedMonth === 'ALL' 
                  ? 'text-slate-900' 
                  : stats.netTransactionAmount >= 0 ? 'text-indigo-600' : 'text-rose-600'
              }`}>
                {selectedMonth === 'ALL' ? (
                  <>
                    {stats.activeSaverCount} <span className="text-xs font-semibold text-slate-400">/ {stats.totalStudentsCount} Siswa</span>
                  </>
                ) : (
                  <>
                    {stats.netTransactionAmount >= 0 ? '+' : ''}{formatCurrency(stats.netTransactionAmount)}
                  </>
                )}
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-bold">
            <span>{selectedMonth === 'ALL' ? 'Tingkat Menabung' : 'Aktivitas Penabung'}</span>
            <span className="font-extrabold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md">
              {selectedMonth === 'ALL' ? (
                stats.totalStudentsCount > 0 
                  ? `${Math.round((stats.activeSaverCount / stats.totalStudentsCount) * 100)}%` 
                  : '0%'
              ) : (
                `${stats.activeSaverCount} Siswa Aktif`
              )}
            </span>
          </div>
        </motion.div>

      </div>

      {/* Baris Audit Rekonsiliasi Kas (Buku Kas Klop) */}
      <div className={`p-4 rounded-2xl border-2 border-slate-900 transition-all ${
        stats.isBalanced 
          ? 'bg-emerald-50 shadow-[4px_4px_0px_0px_#10b981]' 
          : 'bg-amber-50 shadow-[4px_4px_0px_0px_#f59e0b]'
      }`} id="reconciliation-audit-banner">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`p-2 rounded-xl border-2 border-slate-900 text-white flex-shrink-0 ${
              stats.isBalanced ? 'bg-emerald-500' : 'bg-amber-500'
            }`}>
              {stats.isBalanced ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-slate-900">
                  {stats.isBalanced ? '✅ Status Pembukuan Kas: 100% Seimbang & Klop' : '⚠️ Perlu Penyesuaian Saldo Siswa'}
                </h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  stats.isBalanced 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  {stats.isBalanced ? 'Saldo Klop' : `Selisih: ${formatCurrency(stats.discrepancy)}`}
                </span>
              </div>
              
              {/* Formula Matematika Neraca Transparan */}
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-700 flex-wrap font-medium">
                {selectedMonth !== 'ALL' ? (
                  <>
                    <span className="bg-white/80 px-2 py-0.5 rounded border border-slate-300 font-mono text-[11px]">
                      Awal: <b>{formatCurrency(stats.startingBalance)}</b>
                    </span>
                    <span className="font-bold text-slate-500">+</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300 font-mono text-[11px]">
                      Setor: <b>+{formatCurrency(stats.deposits)}</b>
                    </span>
                    <span className="font-bold text-slate-500">-</span>
                    <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded border border-rose-300 font-mono text-[11px]">
                      Tarik: <b>-{formatCurrency(stats.withdrawals)}</b>
                    </span>
                    <span className="font-bold text-slate-500">=</span>
                    <span className="bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded border border-indigo-300 font-mono text-[11px] font-bold">
                      Saldo Akhir {getIndonesianMonthYear(selectedMonth).split(' ')[0]}: <b>{formatCurrency(stats.periodEndingBalance)}</b>
                    </span>
                  </>
                ) : (
                  <p className="text-xs text-slate-600 font-medium">
                    <span className="font-bold text-slate-800">Rumus Neraca:</span> Total Seluruh Setoran ({formatCurrency(stats.allTimeDeposits)}) - Total Seluruh Penarikan ({formatCurrency(stats.allTimeWithdrawals)}) = Saldo Kas Sekolah ({formatCurrency(stats.schoolTotalSavings)}).
                  </p>
                )}
              </div>
            </div>
          </div>

          {onReconcileBalances && (
            <button
              onClick={onReconcileBalances}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] hover:translate-y-[-1px] transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Sinkronkan ulang saldo semua siswa berdasarkan seluruh riwayat mutasi transaksi"
            >
              <RefreshCw size={13} className="text-yellow-400" /> Sinkronkan & Audit Saldo
            </button>
          )}
        </div>
      </div>

      {/* Banner Status Iuran LKS & Pramuka (Quick Overview & Shortcut) */}
      <div 
        className="bg-white p-5 rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_#6366f1] flex flex-col md:flex-row md:items-center justify-between gap-4"
        id="fee-summary-banner"
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 bg-indigo-600 text-white rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] shrink-0">
            <Receipt size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-slate-900">
                📘 Status Iuran Buku LKS & Pramuka
              </h3>
              <span className="text-[10px] font-black bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-full border border-indigo-250">
                {feeOverview.percentPaid}% Terbayar
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 font-semibold mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <BookOpen size={13} className="text-indigo-600" />
                <span>LKS: <b className="text-emerald-700">{feeOverview.lksLunas}/{feeOverview.lksTotal} Lunas</b></span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Award size={13} className="text-amber-600" />
                <span>Pramuka: <b className="text-emerald-700">{feeOverview.praLunas}/{feeOverview.praTotal} Lunas</b></span>
              </span>
              <span>•</span>
              <span className="text-rose-600 font-bold">
                Tunggakan: {formatCurrency(feeOverview.totalUnpaid)}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigateToTab('iuran')}
          className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-black rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#0f172a] hover:translate-y-[-1px] transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <span>Kelola Iuran & Pelunasan</span>
          <ArrowRight size={14} />
        </button>
      </div>


      {/* Grid Grafik Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-grid">
        
        {/* Grafik Tren Tabungan */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_#8b5cf6] lg:col-span-2 flex flex-col" id="chart-card-trend">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-1.5">📈 Tren Tabungan Bulanan</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {selectedMonth === 'ALL' 
                  ? 'Perkembangan setoran & penarikan historis' 
                  : `Grafik harian bulan ${getIndonesianMonthYear(selectedMonth)}`}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/> Setor</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"/> Tarik</span>
            </div>
          </div>
          
          <div className="h-[280px] w-full" id="trend-chart-container">
            {chartTimelineData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Clock className="stroke-1 text-slate-300 mb-2 animate-spin" size={32} style={{ animationDuration: '4s' }} />
                <p className="text-sm font-semibold">Belum ada transaksi di periode ini</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartTimelineData}
                  margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSetor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTarik" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} 
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
                    tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}jt` : val >= 1000 ? `${val/1000}rb` : val} 
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), '']}
                    contentStyle={{ border: '2px solid #0f172a', borderRadius: '12px', boxShadow: '4px 4px 0px 0px #0f172a', color: '#1e293b', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="Setor" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSetor)" name="Setoran" />
                  <Area type="monotone" dataKey="Tarik" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorTarik)" name="Penarikan" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Ringkasan Kelas 5 */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_#ec4899] flex flex-col justify-between" id="chart-card-class">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <School size={20} className="text-indigo-600" /> Profil Tabungan Kelas 5
              </h2>
              <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full border border-amber-300">
                SDN 1 Gemblengan
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Informasi konsolidasi kasir tabungan tunggal Kelas 5</p>

            <div className="mt-5 space-y-3">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Total Kas Tabungan Kelas 5</p>
                <p className="text-2xl font-black text-slate-900 font-mono mt-1">{formatCurrency(classSavingsInfo.total)}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-extrabold text-slate-500 uppercase">Jumlah Siswa</p>
                  <p className="text-base font-black text-indigo-700 font-mono mt-0.5">{classSavingsInfo.count} Anak</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-extrabold text-slate-500 uppercase">Rata-Rata Saldo</p>
                  <p className="text-base font-black text-emerald-700 font-mono mt-0.5">{formatCurrency(classSavingsInfo.avg)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex gap-2">
            <button
              onClick={() => onNavigateToTab('students')}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Users size={14} /> Kelola Roster Kelas 5
            </button>
          </div>
        </div>

      </div>

      {/* Recharts Line Chart: Tren Tabungan 6 Bulan Terakhir */}
      <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_#0284c7] flex flex-col space-y-4" id="six-month-line-chart-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg border border-sky-300">
                <LineChartIcon size={18} />
              </span>
              <h2 className="text-lg font-black text-slate-900">📈 Tren & Pola Tabungan 6 Bulan Terakhir</h2>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Visualisasi historis Recharts untuk memantau fluktuasi setoran, penarikan, dan pertumbuhan tabungan bersih siswa.
            </p>
          </div>

          {/* Key Metric Pills for Teachers */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-[10px] text-emerald-800 font-extrabold uppercase">Rata-Rata Setoran/Bln</p>
              <p className="text-xs font-mono font-black text-emerald-700 mt-0.5">{formatCurrency(sixMonthMetrics.avgMonthlySetor)}</p>
            </div>
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-[10px] text-amber-800 font-extrabold uppercase">Puncak Setoran</p>
              <p className="text-xs font-mono font-black text-amber-900 mt-0.5">{sixMonthMetrics.peakMonth.monthLabel} ({formatCurrency(sixMonthMetrics.peakMonth.Setoran)})</p>
            </div>
            <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl">
              <p className="text-[10px] text-indigo-800 font-extrabold uppercase">Net 6 Bulan</p>
              <p className="text-xs font-mono font-black text-indigo-700 mt-0.5">{formatCurrency(sixMonthMetrics.netTotal)}</p>
            </div>
          </div>
        </div>

        {/* Recharts Line Chart Container */}
        <div className="h-[290px] w-full pt-2" id="six-month-recharts-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={sixMonthTrendData}
              margin={{ top: 15, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="monthLabel" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#334155', fontSize: 12, fontWeight: 'bold' }} 
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#334155', fontSize: 10, fontWeight: 'bold' }}
                tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}jt` : val >= 1000 ? `${val/1000}rb` : val} 
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl border-2 border-slate-950 shadow-xl text-xs space-y-1 font-sans">
                        <p className="font-extrabold text-amber-400 text-sm border-b border-slate-700 pb-1 flex items-center justify-between gap-4">
                          <span>{data.fullLabel}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{data.txCount} Transaksi</span>
                        </p>
                        <p className="flex justify-between items-center gap-4 text-emerald-400 font-bold pt-1">
                          <span>🟢 Total Setoran:</span>
                          <span className="font-mono text-sm">{formatCurrency(data.Setoran)}</span>
                        </p>
                        <p className="flex justify-between items-center gap-4 text-rose-400 font-bold">
                          <span>🔴 Total Penarikan:</span>
                          <span className="font-mono text-sm">{formatCurrency(data.Penarikan)}</span>
                        </p>
                        <div className="border-t border-slate-800 pt-1 flex justify-between items-center gap-4 text-indigo-300 font-extrabold">
                          <span>🔵 Tabungan Bersih:</span>
                          <span className="font-mono text-sm">{formatCurrency(data.TabunganBersih)}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 'bold' }} 
              />
              <Line 
                type="monotone" 
                dataKey="Setoran" 
                name="Total Setoran (Kredit)" 
                stroke="#10b981" 
                strokeWidth={3.5} 
                dot={{ r: 5, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }} 
                activeDot={{ r: 8, strokeWidth: 0 }} 
              />
              <Line 
                type="monotone" 
                dataKey="TabunganBersih" 
                name="Tabungan Bersih (Net)" 
                stroke="#6366f1" 
                strokeWidth={3} 
                strokeDasharray="5 5" 
                dot={{ r: 4, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }} 
                activeDot={{ r: 7 }} 
              />
              <Line 
                type="monotone" 
                dataKey="Penarikan" 
                name="Total Penarikan (Debit)" 
                stroke="#f43f5e" 
                strokeWidth={2.5} 
                dot={{ r: 4, fill: '#f43f5e', stroke: '#ffffff', strokeWidth: 2 }} 
                activeDot={{ r: 7 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pattern Analysis Footer Note */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Activity size={15} className="text-indigo-600 flex-shrink-0" />
            <span className="font-semibold">
              <strong className="text-slate-900">Catatan Analisis:</strong> Tren grafik garis membantu guru mengenali kebiasaan menabung rutin pada awal bulan serta periode peningkatan kebutuhan penarikan siswa.
            </span>
          </div>
        </div>
      </div>

      {/* Grid Bawah: Pemimpin Penabung & Riwayat Transaksi */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" id="dashboard-bottom-grid">
        
        {/* Top Penabung (Leaderboard) */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_#f59e0b] lg:col-span-2 flex flex-col" id="leaderboard-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 animate-bounce-gentle" style={{ animationDuration: '3s' }}>
              <span className="text-amber-500 bg-amber-100 p-1 rounded-lg border border-amber-300">
                <Trophy size={18} />
              </span>
              <h2 className="text-lg font-black text-slate-900">👑 Top Juara Penabung</h2>
            </div>
            <button 
              id="view-all-students-from-leaderboard"
              onClick={() => onNavigateToTab('students')}
              className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-slate-950 hover:text-white rounded-lg border-2 border-slate-900 hover:shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-all duration-150"
            >
              Semua Siswa
            </button>
          </div>
          <p className="text-xs text-slate-500 font-semibold mb-4">Apresiasi khusus siswa-siswi yang paling tekun menyimpan uang jajan mereka.</p>
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]" id="leaderboard-list">
            {topSavers.map((s, index) => {
              const badge = getClassBadgeStyle(s.grade);
              // Calculate percent of the first saver to give a beauty ratio bar
              const ratio = topSavers[0].balance > 0 ? (s.balance / topSavers[0].balance) * 100 : 0;
              
              return (
                <div 
                  key={s.id} 
                  id={`top-saver-item-${s.id}`}
                  onClick={() => onViewStudent(s)}
                  className="p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl border-2 border-slate-200 flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-black border ${
                      index === 0 ? 'bg-amber-100 text-amber-850 border-amber-400 shadow-[2px_2px_0px_0px_rgba(245,158,11,1)]' :
                      index === 1 ? 'bg-slate-200 text-slate-800 border-slate-350' :
                      index === 2 ? 'bg-amber-50 text-amber-900 border-amber-200' :
                      'text-slate-400 border-slate-200'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{s.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-bold">NIS: {s.nis}</span>
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                          Kls {s.grade}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900 font-mono">{formatCurrency(s.balance)}</p>
                    <div className="w-24 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden ml-auto border border-slate-300">
                      <div 
                        className={`h-full rounded-full ${
                          index === 0 ? 'bg-amber-500' : 
                          index === 1 ? 'bg-slate-400' : 
                          'bg-indigo-500'
                        }`}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Riwayat Aktivitas Terbaru */}
        <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_#10b981] lg:col-span-3 flex flex-col" id="recent-activities-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 animate-bounce-gentle" style={{ animationDuration: '4s' }}>
              <span className="text-emerald-600 bg-emerald-50 p-1 rounded-lg border border-emerald-250">
                <Clock size={18} />
              </span>
              <h2 className="text-lg font-black text-slate-900">🕒 Aktivitas Transaksi Terbaru</h2>
            </div>
            <button 
              id="view-all-rekap-from-dashboard"
              onClick={() => onNavigateToTab('rekap')}
              className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-slate-950 hover:text-white rounded-lg border-2 border-slate-900 hover:shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-all duration-150"
            >
              Semua Log
            </button>
          </div>
          <p className="text-xs text-slate-500 font-semibold mb-4">Catatan langsung transaksi setor dan tarik tunai tabungan hari ini.</p>
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]" id="recent-activities-list">
            {recentTransactions.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-400">
                <Clock className="stroke-1 text-slate-300 mb-2" size={32} />
                <p className="text-sm">Belum ada transaksi terekam bulan ini</p>
              </div>
            ) : (
              recentTransactions.map((t) => {
                const badge = getClassBadgeStyle(t.studentGrade);
                const isSetor = t.type === 'SETOR';
                const timeString = new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
 
                return (
                  <div key={t.id} className="p-3 bg-white hover:bg-slate-50/80 rounded-xl border-2 border-slate-200 flex items-center justify-between gap-3 transition-all duration-75">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-black border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${
                        isSetor ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isSetor ? '+' : '-'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-800">{t.studentName}</h4>
                          <span className={`text-[9px] font-black px-1.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                            Kls {t.studentGrade}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5 truncate max-w-[200px] sm:max-w-xs">{t.notes || (isSetor ? 'Menabung' : 'Penarikan Dana')}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-sm font-black font-mono ${isSetor ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isSetor ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                      <span className="text-[10px] text-slate-400 font-bold">pukul {timeString} WIB</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
