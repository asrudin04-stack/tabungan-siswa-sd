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
  School
} from 'lucide-react';
import { Student, Transaction, GradeClass } from '../types';
import { formatCurrency, getClassBadgeStyle, getIndonesianMonthYear } from '../utils';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
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
  onViewStudent: (student: Student) => void;
  onNavigateToTab: (tab: string) => void;
}

export default function Dashboard({ students, transactions, onViewStudent, onNavigateToTab }: DashboardProps) {
  // Available Month-Year filters from transactions
  const monthFilters = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => {
      // Date in ISO format -> extract YYYY-MM
      const yyyymm = t.date.substring(0, 7);
      months.add(yyyymm);
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
    return transactions.filter(t => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // Statistics calculations
  const stats = useMemo(() => {
    // Total Pembukuan (Current cash in school bank, calculated from students' current balances)
    const schoolTotalSavings = students.reduce((sum, s) => sum + s.balance, 0);
    
    // Income and withdrawals for the selected period
    let deposits = 0;
    let withdrawals = 0;
    
    filteredTransactions.forEach(t => {
      if (t.type === 'SETOR') {
        deposits += t.amount;
      } else {
        withdrawals += t.amount;
      }
    });

    // Active students with savings > 0
    const activeSaverCount = students.filter(s => s.balance > 0).length;

    return {
      schoolTotalSavings,
      deposits,
      withdrawals,
      netTransactionAmount: deposits - withdrawals,
      activeSaverCount,
      totalStudentsCount: students.length
    };
  }, [students, filteredTransactions]);

  // Class-wise statistics (Kelas 1 - Kelas 6)
  const classSavingsData = useMemo(() => {
    const classMap: Record<string, { grade: string; total: number; count: number }> = {};
    
    // Initialize grade groupings (1-6)
    for (let i = 1; i <= 6; i++) {
      classMap[String(i)] = { grade: `Kelas ${i}`, total: 0, count: 0 };
    }

    students.forEach(s => {
      const gradeNum = s.grade.charAt(0); // "4" from "4A"
      if (classMap[gradeNum]) {
        classMap[gradeNum].total += s.balance;
        classMap[gradeNum].count += 1;
      }
    });

    return Object.values(classMap);
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
      {/* Upper Welcome and Month Filter Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm" id="welcome-banner">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg inline-flex">
              <Sparkles size={18} className="animate-pulse" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Sistem Tabungan SD Pintar</p>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight mt-1">
            Dashboard Utama Guru
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau arus tabungan siswa secara real-time, cetak rekapitulasi, dan kelola setoran siswa dengan mudah.
          </p>
        </div>

        {/* Dynamic Month Filter */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-fit">
          <span className="p-1 text-slate-500 ml-1.5">
            <Calendar size={16} />
          </span>
          <select 
            id="month-filter-dropdown"
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none pr-3 py-1 cursor-pointer"
          >
            <option value="ALL">Semua Waktu</option>
            {monthFilters.map(my => (
              <option key={my} value={my}>
                {getIndonesianMonthYear(my)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Statis / Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="bento-grid-stats">
        
        {/* Total Saldo Keseluruhan */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-6 rounded-2xl shadow-md border border-indigo-500/20"
          id="stat-box-total"
        >
          {/* Subtle decorative circles */}
          <div className="absolute right-[-10px] bottom-[-10px] w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="absolute left-[-20px] top-[-20px] w-20 h-20 bg-indigo-500/30 rounded-full blur-lg" />
          
          <div className="flex justify-between items-start">
            <span className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl">
              <Wallet size={20} className="text-indigo-100" />
            </span>
            <span className="text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-full uppercase tracking-wider text-indigo-50">
              Total Pembukuan
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-indigo-200">Saldo Gabungan Siswa</p>
            <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight font-mono whitespace-nowrap mt-1">
              {formatCurrency(stats.schoolTotalSavings)}
            </h3>
          </div>
          <div className="mt-3 text-xs flex items-center gap-1.5 text-indigo-200">
            <School size={12} />
            <span>Disimpan aman di rekening sekolah</span>
          </div>
        </motion.div>

        {/* Total Setoran */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between"
          id="stat-box-setor"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <ArrowUpRight size={20} />
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {selectedMonth === 'ALL' ? 'Total Setor' : 'Setor Bulan Ini'}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-400">Total Kredit Masuk</p>
              <h3 className="text-2x font-bold tracking-tight text-slate-800 font-mono mt-1">
                {formatCurrency(stats.deposits)}
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>Uang Masuk</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
              <TrendingUp size={12} /> Aktif
            </span>
          </div>
        </motion.div>

        {/* Total Penarikan */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between"
          id="stat-box-tarik"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                <ArrowDownRight size={20} />
              </span>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                {selectedMonth === 'ALL' ? 'Total Tarik' : 'Tarik Bulan Ini'}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-400">Total Debit Keluar</p>
              <h3 className="text-2x font-bold tracking-tight text-slate-800 font-mono mt-1">
                {formatCurrency(stats.withdrawals)}
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>Uang Diambil</span>
            <span className="text-rose-600 font-semibold">
              Kebutuhan Siswa
            </span>
          </div>
        </motion.div>

        {/* Total Siswa Berpartisipasi */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between"
          id="stat-box-siswa"
        >
          <div>
            <div className="flex justify-between items-start">
              <span className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                <Users size={20} />
              </span>
              <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Partisipasi Siswa
              </span>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-400">Rasio Siswa Menabung</p>
              <h3 className="text-2x font-bold tracking-tight text-slate-800 font-mono mt-1">
                {stats.activeSaverCount} <span className="text-xs font-normal text-slate-400">/ {stats.totalStudentsCount} Siswa</span>
              </h3>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>Tingkat Menabung</span>
            <span className="font-semibold text-slate-700">
              {stats.totalStudentsCount > 0 
                ? `${Math.round((stats.activeSaverCount / stats.totalStudentsCount) * 100)}%` 
                : '0%'}
            </span>
          </div>
        </motion.div>

      </div>

      {/* Grid Grafik Utama */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-grid">
        
        {/* Grafik Tren Tabungan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col" id="chart-card-trend">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Tren Tabungan Bulanan</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedMonth === 'ALL' 
                  ? 'Perkembangan setoran & penarikan historis' 
                  : `Grafik harian bulan ${getIndonesianMonthYear(selectedMonth)}`}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/> Setor</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"/> Tarik</span>
            </div>
          </div>
          
          <div className="h-[280px] w-full" id="trend-chart-container">
            {chartTimelineData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <Clock className="stroke-1 text-slate-300 mb-2" size={32} />
                <p className="text-sm">Belum ada transaksi di periode ini</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartTimelineData}
                  margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSetor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTarik" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                    tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}jt` : val >= 1000 ? `${val/1000}rb` : val} 
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), '']}
                    contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#1e293b' }}
                  />
                  <Area type="monotone" dataKey="Setor" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSetor)" name="Setoran" />
                  <Area type="monotone" dataKey="Tarik" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorTarik)" name="Penarikan" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Klasemen Tabungan Kelas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col" id="chart-card-class">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-800">Komparasi Antar Kelas</h2>
            <p className="text-xs text-slate-400 mt-0.5">Perolehan akumulasi tabungan tiap jenjang kelas</p>
          </div>
          
          <div className="h-[230px] w-full" id="class-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={classSavingsData}
                margin={{ top: 5, right: 0, left: -25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="grade" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10 }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 9 }}
                  tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}jt` : val >= 1000 ? `${val/1000}rb` : val} 
                />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value), 'Simpanan']}
                  contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} name="Dana Ditabung">
                  {classSavingsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-50 text-center mt-auto" id="class-chart-stats">
            {classSavingsData.slice(0, 3).map((item, idx) => (
              <div key={idx} className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">{item.grade}</p>
                <p className="text-xs font-bold text-slate-700 font-mono mt-0.5">{formatCurrency(item.total)}</p>
                <p className="text-[9px] text-slate-400 mt-0.2">{item.count} siswa</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Grid Bawah: Pemimpin Penabung & Riwayat Transaksi */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" id="dashboard-bottom-grid">
        
        {/* Top Penabung (Leaderboard) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col" id="leaderboard-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500">
                <Trophy size={18} />
              </span>
              <h2 className="text-lg font-bold text-slate-800">Top Juara Penabung</h2>
            </div>
            <button 
              id="view-all-students-from-leaderboard"
              onClick={() => onNavigateToTab('students')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Semua Siswa
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">Apresiasi khusus siswa-siswi yang paling tekun menyimpan uang jajan mereka.</p>
          
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
                  className="p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl border border-slate-100/60 flex items-center justify-between gap-3 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      index === 1 ? 'bg-slate-200 text-slate-800' :
                      index === 2 ? 'bg-amber-50 text-amber-900' :
                      'text-slate-400'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 line-clamp-1">{s.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400">NIS: {s.nis}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                          Kls {s.grade}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 font-mono">{formatCurrency(s.balance)}</p>
                    <div className="w-24 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden ml-auto">
                      <div 
                        className={`h-full rounded-full ${
                          index === 0 ? 'bg-amber-500' : 
                          index === 1 ? 'bg-slate-500' : 
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-3 flex flex-col" id="recent-activities-card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <span className="text-indigo-600">
                <Clock size={18} />
              </span>
              <h2 className="text-lg font-bold text-slate-800">Aktivitas Transaksi Terbaru</h2>
            </div>
            <button 
              id="view-all-rekap-from-dashboard"
              onClick={() => onNavigateToTab('rekap')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Semua Log
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">Catatan langsung transaksi setor dan tarik tunai tabungan hari ini.</p>
          
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
                  <div key={t.id} className="p-3 bg-white hover:bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between gap-3 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 flex items-center justify-center rounded-xl text-sm font-bold ${
                        isSetor ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {isSetor ? '+' : '-'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-700">{t.studentName}</h4>
                          <span className={`text-[9px] font-bold px-1.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                            Kls {t.studentGrade}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px] sm:max-w-xs">{t.notes || (isSetor ? 'Menabung' : 'Penarikan Dana')}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className={`text-sm font-bold font-mono ${isSetor ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isSetor ? '+' : '-'}{formatCurrency(t.amount)}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">pukul {timeString} WIB</span>
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
