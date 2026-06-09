import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  LayoutDashboard, 
  Wallet, 
  Users, 
  FileSpreadsheet, 
  Sparkles, 
  Calendar,
  School,
  LogOut,
  Info
} from 'lucide-react';
import { Student, Transaction } from './types';
import { INITIAL_STUDENTS, INITIAL_TRANSACTIONS } from './data/mockData';
import { formatDate } from './utils';

// Import components
import Dashboard from './components/Dashboard';
import Cashier from './components/Cashier';
import StudentList from './components/StudentList';
import RekapBulanan from './components/RekapBulanan';

const LOCAL_STORAGE_KEY_STUDENTS = 'sd_pintar_students_v1';
const LOCAL_STORAGE_KEY_TRANSACTIONS = 'sd_pintar_transactions_v1';

export default function App() {
  // Navigation states: 'dashboard', 'cashier', 'students', 'rekap'
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Core records database state
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // UX Cross-communication triggers: transition student reference from dashboard click to students tab
  const [dashboardSelectedStudent, setDashboardSelectedStudent] = useState<Student | null>(null);

  // Load from local storage or fallback to mock seed data on start
  useEffect(() => {
    try {
      const storedStudents = localStorage.getItem(LOCAL_STORAGE_KEY_STUDENTS);
      const storedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);

      if (storedStudents && storedTransactions) {
        setStudents(JSON.parse(storedStudents));
        setTransactions(JSON.parse(storedTransactions));
      } else {
        // First-load bootstrap
        setStudents(INITIAL_STUDENTS);
        setTransactions(INITIAL_TRANSACTIONS);
        localStorage.setItem(LOCAL_STORAGE_KEY_STUDENTS, JSON.stringify(INITIAL_STUDENTS));
        localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      }
    } catch (error) {
      console.error('Failed to parse storage, populating mock seeds...', error);
      setStudents(INITIAL_STUDENTS);
      setTransactions(INITIAL_TRANSACTIONS);
    }
  }, []);

  // Save changes helper to persistent layer
  const saveStateToStorage = (updatedStudents: Student[], updatedTransactions: Transaction[]) => {
    try {
      setStudents(updatedStudents);
      setTransactions(updatedTransactions);
      localStorage.setItem(LOCAL_STORAGE_KEY_STUDENTS, JSON.stringify(updatedStudents));
      localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify(updatedTransactions));
    } catch (e) {
      alert('Gagal menyimpan perubahan ke browser: ' + e);
    }
  };

  // --- BUSINESS LOGIC HANDLERS ---

  // Add Transaction (Setor atau Tarik)
  const handleAddTransaction = (newTxData: Omit<Transaction, 'id' | 'date'>): Transaction => {
    const timestamp = new Date().toISOString();
    const prefix = newTxData.type === 'SETOR' ? 't-setor' : 't-tarik';
    const txId = `${prefix}-${Date.now()}`;

    const newTx: Transaction = {
      ...newTxData,
      id: txId,
      date: timestamp
    };

    // Calculate student balance adjustment
    const updatedStudents = students.map((s) => {
      if (s.id === newTxData.studentId) {
        const delta = newTxData.type === 'SETOR' ? newTxData.amount : -newTxData.amount;
        return {
          ...s,
          balance: s.balance + delta
        };
      }
      return s;
    });

    const updatedTransactions = [newTx, ...transactions];

    saveStateToStorage(updatedStudents, updatedTransactions);
    return newTx;
  };

  // Register New Student (with optional initial deposit)
  const handleAddStudent = (
    newStudentInfo: Omit<Student, 'id' | 'createdAt' | 'balance'>,
    initialDeposit: number
  ): Student => {
    const studentId = `s-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newStudent: Student = {
      ...newStudentInfo,
      id: studentId,
      balance: initialDeposit,
      createdAt: timestamp
    };

    const updatedStudents = [...students, newStudent];
    let updatedTransactions = [...transactions];

    // If an initial deposit is provided, automatically record first setoran log
    if (initialDeposit > 0) {
      const txId = `t-setor-init-${Date.now()}`;
      const firstTx: Transaction = {
        id: txId,
        studentId: studentId,
        studentName: newStudentInfo.name,
        studentGrade: newStudentInfo.grade,
        type: 'SETOR',
        amount: initialDeposit,
        date: timestamp,
        notes: 'Setoran Awal Akun Baru',
        recordedBy: 'Sistem Registrasi'
      };
      updatedTransactions = [firstTx, ...updatedTransactions];
    }

    saveStateToStorage(updatedStudents, updatedTransactions);
    return newStudent;
  };

  // Edit Student profile parameters
  const handleEditStudent = (id: string, updatedFields: Partial<Omit<Student, 'id' | 'createdAt' | 'balance'>>) => {
    const updatedStudents = students.map((s) => {
      if (s.id === id) {
        return { ...s, ...updatedFields };
      }
      return s;
    });

    // Also update student names across historical logs for consistency
    const updatedTransactions = transactions.map((t) => {
      if (t.studentId === id) {
        return {
          ...t,
          studentName: updatedFields.name || t.studentName,
          studentGrade: updatedFields.grade || t.studentGrade
        };
      }
      return t;
    });

    saveStateToStorage(updatedStudents, updatedTransactions);
  };

  // Delete Student Profile (Deletes student and purges all logs)
  const handleDeleteStudent = (id: string) => {
    const updatedStudents = students.filter(s => s.id !== id);
    const updatedTransactions = transactions.filter(t => t.studentId !== id);
    saveStateToStorage(updatedStudents, updatedTransactions);
  };

  // Master Restore/Import helper
  const handleImportData = (importedStudents: Student[], importedTransactions: Transaction[]) => {
    saveStateToStorage(importedStudents, importedTransactions);
  };

  // Wipe / Reset Database state entirely
  const handleClearDatabase = () => {
    saveStateToStorage([], []);
  };

  // Cross-component navigations (e.g., clicking top saver goes to student ledger card)
  const handleViewStudentFromDashboard = (student: Student) => {
    setDashboardSelectedStudent(student);
    setActiveTab('students');
  };

  // UI Date time string
  const currentLocalDateString = formatDate(new Date().toISOString());

  return (
    <div className="min-h-screen bg-slate-50 lg:h-screen flex flex-col lg:flex-row font-sans text-slate-800 antialiased overflow-hidden" id="school-savings-main-app">
      
      {/* 1. DESKTOP SIDEBAR NAVIGATION (Visible only on lg viewport) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex-col justify-between hidden lg:flex no-print shrink-0" id="desktop-sidebar">
        <div className="flex flex-col flex-1">
          {/* Brand Logo and title */}
          <div className="p-6 flex items-center space-x-3 border-b border-slate-100">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <School size={20} />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none block">SD Pintar</span>
              <span className="text-[10px] font-bold text-indigo-650 tracking-wider uppercase block mt-1.5">Kasir Tabungan</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 px-4 space-y-1 mt-6" id="desktop-routing-nav">
            <button
              id="nav-btn-sidebar-dashboard"
              onClick={() => { setActiveTab('dashboard'); setDashboardSelectedStudent(null); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wide transition-all cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-indigo-50 text-indigo-700 shadow-3xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/70'
              }`}
            >
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </button>
            <button
              id="nav-btn-sidebar-cashier"
              onClick={() => { setActiveTab('cashier'); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wide transition-all cursor-pointer ${
                activeTab === 'cashier' 
                  ? 'bg-indigo-50 text-indigo-700 shadow-3xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/70'
              }`}
            >
              <Wallet size={15} />
              <span>Kasir Pembayaran</span>
            </button>
            <button
              id="nav-btn-sidebar-students"
              onClick={() => { setActiveTab('students'); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wide transition-all cursor-pointer ${
                activeTab === 'students' 
                  ? 'bg-indigo-50 text-indigo-700 shadow-3xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/70'
              }`}
            >
              <Users size={15} />
              <span className="flex-1 text-left">Daftar Siswa</span>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">{students.length}</span>
            </button>
            <button
              id="nav-btn-sidebar-rekap"
              onClick={() => { setActiveTab('rekap'); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wide transition-all cursor-pointer ${
                activeTab === 'rekap' 
                  ? 'bg-indigo-50 text-indigo-700 shadow-3xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/70'
              }`}
            >
              <FileSpreadsheet size={15} />
              <span>Jurnal Rekap</span>
            </button>
          </nav>
        </div>

        {/* User / School Panel Footing */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-indigo-650 rounded-2xl p-4 text-white relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-10px] w-16 h-16 bg-white/10 rounded-full blur-sm" />
            <p className="text-[9px] opacity-80 uppercase tracking-widest font-extrabold mb-1">Status Operasional</p>
            <p className="text-xs font-bold truncate">SDN Harapan Bangsa</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] text-slate-100 font-medium">Buku Kas Luring</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE TOP BAR NAVIGATION (Visible on mobile/tablet) */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between lg:hidden sticky top-0 z-40 no-print text-slate-800 shrink-0" id="mobile-header">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
            <School size={16} />
          </div>
          <div>
            <h1 className="text-xs font-black tracking-tight text-slate-900 leading-tight">SD NEGERI HARAPAN BANGSA</h1>
            <p className="text-[10px] text-indigo-600 font-medium tracking-wide uppercase">Tabungan SD Pintar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => alert('Sesi Kasir SD Pintar telah dikunci demi keamanan. Silakan muat ulang halaman untuk membuka.')}
            className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 border border-slate-200 rounded-lg"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* 3. RIGHT HAND VIEWPORT CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Top Header Row on Desktop */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 shrink-0 hidden lg:flex items-center justify-between no-print" id="desktop-top-header">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {activeTab === 'dashboard' && 'Dashboard Keuangan'}
              {activeTab === 'cashier' && 'Kasir Tabungan Siswa'}
              {activeTab === 'students' && 'Manajemen Akun Siswa'}
              {activeTab === 'rekap' && 'Laporan Jurnal Rekapitulasi'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Hai, Admin Operasional • SDN Harapan Bangsa • Kas Terbuka</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end text-right">
              <span className="text-[10px] font-bold text-slate-400 capitalize tracking-wider flex items-center gap-1">
                <Calendar size={11} /> {currentLocalDateString}
              </span>
              <span className="text-xs font-bold text-indigo-600 font-mono mt-0.5">Operasional Kas Terbuka</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <button 
              id="logout-btn-mock-sidebar"
              onClick={() => alert('Sesi Kasir SD Pintar telah dikunci demi keamanan. Silakan muat ulang halaman untuk membuka.')}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Lock Session"
            >
              <LogOut size={13} /> Kunci Sesi
            </button>
          </div>
        </header>

        {/* 4. MAIN INNER SCROLLER CONTENT */}
        <main className="flex-1 overflow-y-auto w-full p-4 md:p-6 lg:p-8 pb-24 lg:pb-12 h-full bg-slate-50" id="routing-stage">
          
          {/* Offline status notification banner for high craft */}
          <div className="bg-slate-905 bg-slate-900 border border-slate-800 text-slate-100 p-3.5 rounded-2xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs no-print text-xs" id="offline-state-ticker">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block shrink-0" />
              <span><strong>Mode Lokasi Aktif:</strong> Laporan disimpan langsung di browser lokal Anda. Tenang, data aman walau internet terputus!</span>
            </div>
            <p className="font-mono text-[10px] text-indigo-300 font-semibold bg-slate-950 border border-slate-850 px-2.5 py-1 rounded-lg w-fit">
              DB: {students.length} Siswa | {transactions.length} Jurnal
            </p>
          </div>

          {/* Tab Selection routing */}
          <div id="tab-views-renderer" className="h-full">
            {activeTab === 'dashboard' && (
              <Dashboard 
                students={students} 
                transactions={transactions} 
                onViewStudent={handleViewStudentFromDashboard}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'cashier' && (
              <Cashier 
                students={students} 
                onAddTransaction={handleAddTransaction}
                recordedBy="Bu Rismawati, S.Pd."
              />
            )}

            {activeTab === 'students' && (
              <StudentList 
                students={students}
                transactions={transactions}
                onAddStudent={handleAddStudent}
                onEditStudent={handleEditStudent}
                onDeleteStudent={handleDeleteStudent}
                preSelectedStudent={dashboardSelectedStudent}
                onClosePreSelection={() => setDashboardSelectedStudent(null)}
              />
            )}

            {activeTab === 'rekap' && (
              <RekapBulanan 
                students={students}
                transactions={transactions}
                onImportData={handleImportData}
                onClearDatabase={handleClearDatabase}
              />
            )}
          </div>

          {/* Elegant nested footer within scroll container so it lays out naturally */}
          <footer className="py-6 mt-12 text-center border-t border-slate-205 border-slate-200 no-print" id="applet-footer">
            <div className="text-xs space-y-1.5 text-slate-400">
              <div className="flex justify-center items-center gap-1 font-semibold text-slate-500 text-[11px]">
                <School size={12} className="text-indigo-600" />
                <span>Sistem SD Pintar Tabungan Siswa v1.0.0</span>
              </div>
              <p>Didesain khusus untuk operasional guru sekolah dasar demi melatih kedisiplinan menabung anak sejak dini.</p>
              <p className="text-[10px] flex items-center justify-center gap-1 pt-1 font-mono">
                Dibuat dengan <Heart size={10} className="fill-rose-500 stroke-none" /> di Google AI Studio • Seluruh data dienkripsi luring di peranti Anda.
              </p>
            </div>
          </footer>
        </main>
      </div>

      {/* 5. MOBILE BOTTOM NAVIGATION SHEET (Visible exclusively on handheld viewports) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-2 flex justify-around lg:hidden shadow-lg no-print" id="mobile-routing-nav">
        <button
          id="mob-btn-dashboard"
          onClick={() => { setActiveTab('dashboard'); setDashboardSelectedStudent(null); }}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all flex-1 cursor-pointer ${
            activeTab === 'dashboard' ? 'text-indigo-650 bg-indigo-50/50 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[9px] mt-1">Dashboard</span>
        </button>
        <button
          id="mob-btn-cashier"
          onClick={() => setActiveTab('cashier')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all flex-1 cursor-pointer ${
            activeTab === 'cashier' ? 'text-indigo-655 bg-indigo-50/50 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <Wallet size={18} />
          <span className="text-[9px] mt-1">Kasir</span>
        </button>
        <button
          id="mob-btn-students"
          onClick={() => setActiveTab('students')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all flex-1 cursor-pointer ${
            activeTab === 'students' ? 'text-indigo-655 bg-indigo-50/50 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <Users size={18} />
          <span className="text-[9px] mt-1">Siswa</span>
        </button>
        <button
          id="mob-btn-rekap"
          onClick={() => setActiveTab('rekap')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all flex-1 cursor-pointer ${
            activeTab === 'rekap' ? 'text-indigo-655 bg-indigo-50/50 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <FileSpreadsheet size={18} />
          <span className="text-[9px] mt-1">Rekap</span>
        </button>
      </div>

    </div>
  );
}
