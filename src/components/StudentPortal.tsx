import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Calendar, 
  User, 
  Phone, 
  School, 
  LogOut, 
  Sparkles, 
  Printer, 
  FileText, 
  TrendingUp, 
  Activity, 
  X,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Award,
  BookOpen,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Student, Transaction, AuthUser, StudentFee } from '../types';
import { formatCurrency, formatDate, getIndonesianMonthYear } from '../utils';

interface StudentPortalProps {
  currentUser: AuthUser;
  students: Student[];
  transactions: Transaction[];
  fees?: StudentFee[];
  onLogout: () => void;
}

export default function StudentPortal({
  currentUser,
  students,
  transactions,
  fees = [],
  onLogout
}: StudentPortalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SETOR' | 'TARIK'>('ALL');
  const [selectedTxForPrint, setSelectedTxForPrint] = useState<Transaction | null>(null);

  // Find logged in student object
  const currentStudent = useMemo(() => {
    if (currentUser.studentId) {
      return students.find(s => s.id === currentUser.studentId);
    }
    if (currentUser.studentNis) {
      return students.find(s => s.nis === currentUser.studentNis);
    }
    return students.find(s => s.name.toLowerCase() === currentUser.name.toLowerCase());
  }, [currentUser, students]);

  // Personal fees for logged-in student
  const personalFees = useMemo(() => {
    if (!currentStudent) return [];
    return fees.filter(f => f.studentId === currentStudent.id);
  }, [currentStudent, fees]);

  // Personal transactions list
  const personalTransactions = useMemo(() => {
    if (!currentStudent) return [];
    return transactions
      .filter(t => t.studentId === currentStudent.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [currentStudent, transactions]);

  // Filtered transactions based on search and type
  const filteredPersonalTx = useMemo(() => {
    let result = [...personalTransactions];

    if (typeFilter !== 'ALL') {
      result = result.filter(t => t.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        t => t.notes?.toLowerCase().includes(q) || 
             formatCurrency(t.amount).includes(q) ||
             t.date.includes(q)
      );
    }

    return result;
  }, [personalTransactions, typeFilter, searchQuery]);

  // Calculate personal metrics
  const metrics = useMemo(() => {
    let totalSetor = 0;
    let totalTarik = 0;
    let countSetor = 0;
    let countTarik = 0;

    personalTransactions.forEach(t => {
      if (t.type === 'SETOR') {
        totalSetor += t.amount;
        countSetor++;
      } else if (t.type === 'TARIK') {
        totalTarik += t.amount;
        countTarik++;
      }
    });

    const netBalance = currentStudent ? currentStudent.balance : (totalSetor - totalTarik);

    return {
      totalSetor,
      totalTarik,
      countSetor,
      countTarik,
      totalTx: personalTransactions.length,
      netBalance
    };
  }, [personalTransactions, currentStudent]);

  // Recharts trend data for this student over past 6 months
  const monthlyTrendData = useMemo(() => {
    const result: Array<{
      monthLabel: string;
      fullLabel: string;
      Setoran: number;
      Penarikan: number;
      SaldoKumulatif: number;
    }> = [];

    const now = new Date();
    let runningBalance = 0;

    // Create 6 months bucket
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const mKey = `${yyyy}-${mm}`;

      let mSetor = 0;
      let mTarik = 0;

      personalTransactions.forEach(t => {
        if (t.date && t.date.startsWith(mKey)) {
          if (t.type === 'SETOR') mSetor += t.amount;
          if (t.type === 'TARIK') mTarik += t.amount;
        }
      });

      runningBalance += (mSetor - mTarik);

      const fullLabel = getIndonesianMonthYear(mKey);
      const monthLabel = fullLabel.split(' ')[0];

      result.push({
        monthLabel,
        fullLabel,
        Setoran: mSetor,
        Penarikan: mTarik,
        SaldoKumulatif: Math.max(0, runningBalance)
      });
    }

    return result;
  }, [personalTransactions]);

  if (!currentStudent) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0284c7] text-center max-w-md">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-black text-slate-900 mb-2">Data Siswa Tidak Ditemukan</h2>
          <p className="text-xs text-slate-600 mb-4 font-medium">
            Akun siswa tidak terhubung dengan catatan di database. Silakan keluar dan pilih ulang dari daftar siswa.
          </p>
          <button
            onClick={onLogout}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 border-2 border-slate-900 rounded-xl font-black text-sm shadow-[3px_3px_0px_0px_#0284c7]"
          >
            Kembali ke Halaman Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-12 font-sans">
      {/* Top Navbar Header */}
      <header className="bg-slate-900 text-white border-b-4 border-slate-900 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400 text-slate-900 rounded-xl border-2 border-slate-900 font-bold shadow-[2px_2px_0px_0px_#0284c7]">
              <School size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Portal Siswa</span>
                <span className="px-2 py-0.5 bg-sky-500 text-white rounded-md text-[10px] font-black border border-sky-400">
                  Kelas 5 SD
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                SD NEGERI 1 GEMBLENGAN
              </h1>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="py-2 px-3.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl border-2 border-slate-900 text-xs font-black flex items-center gap-2 shadow-[2px_2px_0px_0px_#ffffff] transition-all"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Keluar Portal</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Welcome Banner Card */}
        <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-blue-700 text-white p-6 rounded-3xl border-4 border-slate-900 shadow-[6px_6px_0px_0px_#0284c7] relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 opacity-10 pointer-events-none">
            <School size={300} />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-400 rounded-2xl border-4 border-slate-900 flex items-center justify-center text-slate-900 font-black text-2xl sm:text-3xl shadow-[4px_4px_0px_0px_#0284c7] flex-shrink-0">
                {currentStudent.name.charAt(0)}
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-extrabold border border-white/20 text-amber-300 mb-1">
                  <Sparkles size={14} />
                  <span>Siswa Aktif SD Negeri 1 Gemblengan</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm">
                  {currentStudent.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-sky-100 font-bold mt-1">
                  <span className="bg-slate-900/40 px-2.5 py-1 rounded-lg border border-white/10 font-mono">
                    NIS: {currentStudent.nis}
                  </span>
                  <span>&bull;</span>
                  <span>Kelas 5 SD</span>
                  {currentStudent.parentName && (
                    <>
                      <span>&bull;</span>
                      <span>Wali: {currentStudent.parentName}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Total Balance Card Display */}
            <div className="bg-white text-slate-900 p-5 rounded-2xl border-4 border-slate-900 shadow-[4px_4px_0px_0px_#0284c7] text-right min-w-[240px]">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-end gap-1">
                <Wallet size={16} className="text-indigo-600" />
                <span>Saldo Tabungan Anda</span>
              </p>
              <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-600">
                {formatCurrency(currentStudent.balance)}
              </p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">
                Terhubung Real-time dengan Kasir Sekolah
              </p>
            </div>
          </div>
        </div>

        {/* Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_#10b981]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase text-slate-500">Total Akumulasi Setoran</span>
              <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-300">
                <ArrowUpRight size={18} />
              </span>
            </div>
            <p className="text-2xl font-black font-mono text-emerald-600">{formatCurrency(metrics.totalSetor)}</p>
            <p className="text-xs text-slate-500 font-bold mt-1">{metrics.countSetor} kali transaksi setor</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_#f43f5e]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase text-slate-500">Total Akumulasi Penarikan</span>
              <span className="p-2 bg-rose-100 text-rose-700 rounded-xl border border-rose-300">
                <ArrowDownRight size={18} />
              </span>
            </div>
            <p className="text-2xl font-black font-mono text-rose-600">{formatCurrency(metrics.totalTarik)}</p>
            <p className="text-xs text-slate-500 font-bold mt-1">{metrics.countTarik} kali penarikan</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border-3 border-slate-900 shadow-[4px_4px_0px_0px_#6366f1]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase text-slate-500">Total Transaksi Selesai</span>
              <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-300">
                <FileText size={18} />
              </span>
            </div>
            <p className="text-2xl font-black font-mono text-indigo-700">{metrics.totalTx} Record</p>
            <p className="text-xs text-slate-500 font-bold mt-1">Dicatat oleh Kasir Guru</p>
          </div>
        </div>

        {/* Status Iuran Siswa (Buku LKS & Pramuka) */}
        {personalFees.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border-3 border-slate-900 shadow-[5px_5px_0px_0px_#f59e0b] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-amber-100 text-amber-900 rounded-xl border border-amber-300">
                  <Receipt size={20} className="stroke-[2.5]" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    📘 Status Pelunasan Iuran Buku LKS & Pramuka Anda
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Pantau tagihan dan konfirmasi status pelunasan resmi dari sekolah.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {personalFees.map((fee) => {
                const isLunas = fee.status === 'LUNAS';
                const remaining = Math.max(0, fee.targetAmount - fee.paidAmount);
                return (
                  <div
                    key={fee.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isLunas
                        ? 'bg-emerald-50/60 border-emerald-500 shadow-[3px_3px_0px_0px_#10b981]'
                        : 'bg-rose-50/60 border-rose-500 shadow-[3px_3px_0px_0px_#f43f5e]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        fee.feeType === 'LKS'
                          ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}>
                        {fee.feeType === 'LKS' ? '📘 Iuran LKS' : '🏕️ Pramuka'}
                      </span>
                      {isLunas ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm">
                          <CheckCircle2 size={11} className="stroke-[3]" /> SUDAH LUNAS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
                          <AlertCircle size={11} className="stroke-[3]" /> BELUM LUNAS
                        </span>
                      )}
                    </div>

                    <h4 className="font-black text-sm text-slate-900 mt-2">{fee.title}</h4>
                    {fee.period && (
                      <p className="text-[11px] text-slate-500 font-medium">{fee.period}</p>
                    )}

                    <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500">Target: </span>
                        <span className="font-black font-mono text-slate-800">{formatCurrency(fee.targetAmount)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Terbayar: </span>
                        <span className="font-black font-mono text-emerald-700">{formatCurrency(fee.paidAmount)}</span>
                      </div>
                      {!isLunas && (
                        <div>
                          <span className="text-rose-600 font-bold font-mono">Sisa: -{formatCurrency(remaining)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recharts Chart: Grafik Tren Setoran Pribadi */}
        <div className="bg-white p-6 rounded-2xl border-3 border-slate-900 shadow-[5px_5px_0px_0px_#0284c7] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-600" />
                <span>📈 Grafik Riwayat Setoran & Tabungan (6 Bulan Terakhir)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">Visualisasi perkembangan uang tabungan Anda di sekolah.</p>
            </div>
          </div>

          <div className="h-[250px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="monthLabel" tickLine={false} axisLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 'bold' }} />
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
                          <p className="font-extrabold text-amber-400 text-sm border-b border-slate-700 pb-1">{data.fullLabel}</p>
                          <p className="text-emerald-400 font-bold pt-1 flex justify-between gap-4">
                            <span>Setoran:</span>
                            <span className="font-mono">{formatCurrency(data.Setoran)}</span>
                          </p>
                          <p className="text-rose-400 font-bold flex justify-between gap-4">
                            <span>Penarikan:</span>
                            <span className="font-mono">{formatCurrency(data.Penarikan)}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="Setoran" name="Total Setoran" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                <Line type="monotone" dataKey="Penarikan" name="Total Penarikan" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4, fill: '#f43f5e' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Personal Transaction History Table */}
        <div className="bg-white rounded-2xl border-3 border-slate-900 shadow-[5px_5px_0px_0px_#0284c7] overflow-hidden">
          {/* Table Controls */}
          <div className="p-5 bg-slate-50 border-b-2 border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileText size={20} className="text-sky-600" />
                <span>Riwayat Transaksi Tabungan Anda</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Menampilkan total {filteredPersonalTx.length} riwayat transaksi pribadi
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <div className="inline-flex bg-white p-1 rounded-xl border-2 border-slate-900 text-xs font-bold">
                <button
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${typeFilter === 'ALL' ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setTypeFilter('SETOR')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${typeFilter === 'SETOR' ? 'bg-emerald-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Setor
                </button>
                <button
                  onClick={() => setTypeFilter('TARIK')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${typeFilter === 'TARIK' ? 'bg-rose-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  Tarik
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari transaksi..."
                  className="pl-9 pr-3 py-1.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Table Render */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-xs font-black uppercase border-b-2 border-slate-900">
                  <th className="py-3 px-4">Tanggal & Waktu</th>
                  <th className="py-3 px-4">Jenis Transaksi</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4">Catatan / Keterangan</th>
                  <th className="py-3 px-4">Petugas</th>
                  <th className="py-3 px-4 text-center">Struk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs font-bold text-slate-800">
                {filteredPersonalTx.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <FileText className="w-10 h-10 mx-auto text-slate-300" />
                        <p className="font-bold text-sm text-slate-600">Belum Ada Transaksi</p>
                        <p className="text-xs text-slate-400">
                          {searchQuery ? 'Tidak ada transaksi yang cocok dengan kata kunci.' : 'Anda belum pernah melakukan setoran atau penarikan.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPersonalTx.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {formatDate(tx.date)}
                      </td>
                      <td className="py-3 px-4">
                        {tx.type === 'SETOR' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 text-[11px] font-black">
                            <ArrowUpRight size={14} />
                            <span>SETORAN</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg border border-rose-300 text-[11px] font-black">
                            <ArrowDownRight size={14} />
                            <span>PENARIKAN</span>
                          </span>
                        )}
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-black text-sm ${
                        tx.type === 'SETOR' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {tx.type === 'SETOR' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {tx.notes || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {tx.recordedBy}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedTxForPrint(tx)}
                          className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-800 border border-sky-300 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1"
                        >
                          <Printer size={13} />
                          <span>Cetak</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Printable Receipt Modal */}
      <AnimatePresence>
        {selectedTxForPrint && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0284c7] p-6 relative"
            >
              <button
                onClick={() => setSelectedTxForPrint(null)}
                className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border-2 border-slate-900"
              >
                <X size={18} />
              </button>

              <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 mb-4">
                <School className="w-10 h-10 mx-auto text-sky-600 mb-1" />
                <h3 className="font-black text-slate-900 text-base">SD NEGERI 1 GEMBLENGAN</h3>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  Bukti Transaksi Tabungan Siswa
                </p>
              </div>

              <div className="space-y-2.5 text-xs font-bold text-slate-700 mb-6">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-400">ID Transaksi:</span>
                  <span className="font-mono text-slate-900">{selectedTxForPrint.id}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-400">Nama Siswa:</span>
                  <span className="text-slate-900">{selectedTxForPrint.studentName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-400">NIS / Kelas:</span>
                  <span className="text-slate-900">{currentStudent.nis} / Kelas 5</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-400">Waktu:</span>
                  <span className="font-mono text-slate-900">{formatDate(selectedTxForPrint.date)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="text-slate-400">Jenis Transaksi:</span>
                  <span className={selectedTxForPrint.type === 'SETOR' ? 'text-emerald-600 font-black' : 'text-rose-600 font-black'}>
                    {selectedTxForPrint.type === 'SETOR' ? 'SETORAN (KREDIT)' : 'PENARIKAN (DEBIT)'}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center my-2">
                  <span className="font-black text-slate-600 uppercase text-[10px]">Nominal:</span>
                  <span className="font-mono text-lg font-black text-slate-900">
                    {formatCurrency(selectedTxForPrint.amount)}
                  </span>
                </div>
                {selectedTxForPrint.notes && (
                  <div className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-400">Catatan:</span>
                    <span className="text-slate-900">{selectedTxForPrint.notes}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Petugas Kasir:</span>
                  <span className="text-slate-900">{selectedTxForPrint.recordedBy}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 border-2 border-slate-900 rounded-xl font-black text-xs shadow-[3px_3px_0px_0px_#0284c7] flex items-center justify-center gap-2"
                >
                  <Printer size={16} />
                  <span>Cetak Struk</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
