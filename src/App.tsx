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
  Info,
  Sliders,
  Cloud,
  CloudLightning,
  CloudOff
} from 'lucide-react';
import { Student, Transaction, AuthUser, UserAccount } from './types';
import { INITIAL_STUDENTS, INITIAL_TRANSACTIONS, INITIAL_USER_ACCOUNTS } from './data/mockData';
import { formatDate } from './utils';

// Import Firebase references
import { onSnapshot, getDocs, writeBatch, doc } from 'firebase/firestore';
import { 
  db, 
  studentsColRef, 
  transactionsColRef, 
  usersColRef,
  saveStudentToCloud, 
  deleteStudentFromCloud, 
  saveTransactionToCloud, 
  uploadBulkToCloud, 
  clearAllCloudDatabase,
  saveUserAccountToCloud,
  deleteUserAccountFromCloud,
  uploadBulkUsersToCloud
} from './firebase';

// Import components
import Dashboard from './components/Dashboard';
import Cashier from './components/Cashier';
import StudentList from './components/StudentList';
import RekapBulanan from './components/RekapBulanan';
import Settings from './components/Settings';
import LoginModal from './components/LoginModal';
import StudentPortal from './components/StudentPortal';

const LOCAL_STORAGE_KEY_STUDENTS = 'sd_pintar_students_v1';
const LOCAL_STORAGE_KEY_TRANSACTIONS = 'sd_pintar_transactions_v1';
const LOCAL_STORAGE_KEY_USERS = 'sd_pintar_users_v1';
const LOCAL_STORAGE_KEY_AUTH = 'sd_pintar_auth_v1';

export default function App() {
  // Navigation states: 'dashboard', 'cashier', 'students', 'rekap'
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_AUTH);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY_AUTH);
  };

  // Core records database state
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_USERS);
      return stored ? JSON.parse(stored) : INITIAL_USER_ACCOUNTS;
    } catch (e) {
      return INITIAL_USER_ACCOUNTS;
    }
  });

  // Cloud Sync Statuses
  const [loadingCloud, setLoadingCloud] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error'>('synced');

  // UX Cross-communication triggers: transition student reference from dashboard click to students tab
  const [dashboardSelectedStudent, setDashboardSelectedStudent] = useState<Student | null>(null);

  // 1. Initial Cloud Data Check and Migration
  useEffect(() => {
    const initializeCloudData = async () => {
      try {
        setLoadingCloud(true);
        // Check if students collection in Firestore already has data
        const studentsSnapshot = await getDocs(studentsColRef);
        
        if (studentsSnapshot.empty) {
          console.log('Cloud database is empty. Performing initial migration...');
          setSyncStatus('saving');

          // Check if we have pre-existing localStorage to migrate
          const storedStudents = localStorage.getItem(LOCAL_STORAGE_KEY_STUDENTS);
          const storedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);

          let studentsToMigrate = INITIAL_STUDENTS;
          let transactionsToMigrate = INITIAL_TRANSACTIONS;

          if (storedStudents && storedTransactions) {
            try {
              const parsedStudents = JSON.parse(storedStudents);
              const parsedTransactions = JSON.parse(storedTransactions);
              if (parsedStudents && parsedStudents.length > 0) {
                studentsToMigrate = parsedStudents;
                transactionsToMigrate = parsedTransactions;
              }
            } catch (e) {
              console.error('Failed to parse existing localStorage data for migration:', e);
            }
          }

          // Perform bulk insert to Cloud
          await uploadBulkToCloud(studentsToMigrate, transactionsToMigrate);
          console.log('Initial cloud migration completed successfully!');
        }

        // Check user accounts collection in Firestore
        const usersSnapshot = await getDocs(usersColRef);
        if (usersSnapshot.empty) {
          await uploadBulkUsersToCloud(INITIAL_USER_ACCOUNTS);
        }

        setSyncStatus('synced');
      } catch (error) {
        console.error('Error during initial cloud initialization:', error);
        setSyncStatus('error');
      } finally {
        setLoadingCloud(false);
      }
    };

    initializeCloudData();
  }, []);

  // 2. Real-time subscriptions for auto-sync
  useEffect(() => {
    setSyncStatus('saving');
    
    // Subscribe to students list
    const unsubscribeStudents = onSnapshot(studentsColRef, (snapshot) => {
      const cloudStudents: Student[] = [];
      snapshot.forEach((docSnap) => {
        cloudStudents.push(docSnap.data() as Student);
      });
      setStudents(cloudStudents);
      localStorage.setItem(LOCAL_STORAGE_KEY_STUDENTS, JSON.stringify(cloudStudents));
      setSyncStatus('synced');
    }, (error) => {
      console.error('Firestore students subscription error:', error);
      setSyncStatus('error');
    });

    // Subscribe to transactions list
    const unsubscribeTransactions = onSnapshot(transactionsColRef, (snapshot) => {
      const cloudTxs: Transaction[] = [];
      snapshot.forEach((docSnap) => {
        cloudTxs.push(docSnap.data() as Transaction);
      });
      // Sort descending by date
      cloudTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(cloudTxs);
      localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify(cloudTxs));
      setSyncStatus('synced');
    }, (error) => {
      console.error('Firestore transactions subscription error:', error);
      setSyncStatus('error');
    });

    // Subscribe to userAccounts list
    const unsubscribeUsers = onSnapshot(usersColRef, (snapshot) => {
      const cloudUsers: UserAccount[] = [];
      snapshot.forEach((docSnap) => {
        cloudUsers.push(docSnap.data() as UserAccount);
      });
      if (cloudUsers.length > 0) {
        setUserAccounts(cloudUsers);
        localStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(cloudUsers));
      }
      setSyncStatus('synced');
    }, (error) => {
      console.error('Firestore users subscription error:', error);
    });

    return () => {
      unsubscribeStudents();
      unsubscribeTransactions();
      unsubscribeUsers();
    };
  }, []);

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

    setSyncStatus('saving');

    // Calculate student balance adjustment
    const targetStudent = students.find(s => s.id === newTxData.studentId);
    if (targetStudent) {
      const delta = newTxData.type === 'SETOR' ? newTxData.amount : -newTxData.amount;
      const updatedStudent: Student = {
        ...targetStudent,
        balance: targetStudent.balance + delta
      };
      
      // Save updated student profile and new transaction to Firestore in parallel
      Promise.all([
        saveStudentToCloud(updatedStudent),
        saveTransactionToCloud(newTx)
      ]).then(() => {
        setSyncStatus('synced');
      }).catch((e) => {
        console.error('Failed to save transaction to cloud:', e);
        setSyncStatus('error');
      });
    }

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

    setSyncStatus('saving');

    const promises: Promise<any>[] = [saveStudentToCloud(newStudent)];

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
      promises.push(saveTransactionToCloud(firstTx));
    }

    Promise.all(promises).then(() => {
      setSyncStatus('synced');
    }).catch((e) => {
      console.error('Failed to save student to cloud:', e);
      setSyncStatus('error');
    });

    return newStudent;
  };

  // Edit Student profile parameters
  const handleEditStudent = async (id: string, updatedFields: Partial<Omit<Student, 'id' | 'createdAt' | 'balance'>>) => {
    const studentToEdit = students.find(s => s.id === id);
    if (!studentToEdit) return;

    setSyncStatus('saving');

    const updatedStudent: Student = { ...studentToEdit, ...updatedFields };

    try {
      // 1. Update the student document in Firestore
      await saveStudentToCloud(updatedStudent);

      // 2. Update associated transaction logs to preserve name and grade consistency
      const transactionsToUpdate = transactions.filter(t => t.studentId === id);
      if (transactionsToUpdate.length > 0) {
        const batch = writeBatch(db);
        transactionsToUpdate.forEach((t) => {
          const docRef = doc(db, 'transactions', t.id);
          batch.update(docRef, {
            studentName: updatedFields.name || t.studentName,
            studentGrade: updatedFields.grade || t.studentGrade
          });
        });
        await batch.commit();
      }
      setSyncStatus('synced');
    } catch (e) {
      console.error('Failed to edit student profile:', e);
      setSyncStatus('error');
    }
  };

  // Delete Student Profile (Deletes student and purges all logs)
  const handleDeleteStudent = (id: string) => {
    setSyncStatus('saving');
    deleteStudentFromCloud(id).then(() => {
      setSyncStatus('synced');
    }).catch((e) => {
      console.error('Failed to delete student from cloud:', e);
      setSyncStatus('error');
    });
  };

  // Master Restore/Import helper
  const handleImportData = (importedStudents: Student[], importedTransactions: Transaction[]) => {
    setSyncStatus('saving');
    clearAllCloudDatabase().then(() => {
      return uploadBulkToCloud(importedStudents, importedTransactions);
    }).then(() => {
      setSyncStatus('synced');
    }).catch((e) => {
      console.error('Failed to restore data to cloud:', e);
      setSyncStatus('error');
      alert('Gagal memulihkan data: ' + e);
    });
  };

  // Wipe / Reset Database state entirely
  const handleClearDatabase = () => {
    setSyncStatus('saving');
    clearAllCloudDatabase().then(() => {
      setSyncStatus('synced');
    }).catch((e) => {
      console.error('Failed to clear database on cloud:', e);
      setSyncStatus('error');
    });
  };

  // Bulk Import Students Helper
  const handleBulkImportStudents = (
    newStudentsList: Array<Omit<Student, 'id' | 'createdAt' | 'balance'> & { initialDeposit: number }>
  ) => {
    setSyncStatus('saving');
    const timestamp = new Date().toISOString();
    const batchStudents: Student[] = [];
    const batchTransactions: Transaction[] = [];

    newStudentsList.forEach((item, index) => {
      const studentId = `s-bulk-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`;
      const newStudent: Student = {
        name: item.name,
        grade: item.grade,
        nis: item.nis,
        parentName: item.parentName || undefined,
        phone: item.phone || undefined,
        id: studentId,
        balance: item.initialDeposit,
        createdAt: timestamp
      };
      batchStudents.push(newStudent);

      if (item.initialDeposit > 0) {
        const txId = `t-setor-init-${Date.now()}-${index}-${Math.floor(Math.random() * 1000)}`;
        const firstTx: Transaction = {
          id: txId,
          studentId: studentId,
          studentName: item.name,
          studentGrade: item.grade,
          type: 'SETOR',
          amount: item.initialDeposit,
          date: timestamp,
          notes: 'Setoran Awal (Impor Massal)',
          recordedBy: 'Sistem Registrasi'
        };
        batchTransactions.push(firstTx);
      }
    });

    uploadBulkToCloud(batchStudents, batchTransactions).then(() => {
      setSyncStatus('synced');
    }).catch((e) => {
      console.error('Failed to bulk import to cloud:', e);
      setSyncStatus('error');
    });
  };

  // User Account Handlers
  const handleAddUserAccount = (accountData: Omit<UserAccount, 'id' | 'createdAt'>) => {
    const newAcc: UserAccount = {
      ...accountData,
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString()
    };
    const updated = [...userAccounts, newAcc];
    setUserAccounts(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(updated));
    saveUserAccountToCloud(newAcc).catch(e => console.error('Failed to save user account to cloud:', e));
  };

  const handleUpdateUserAccount = (updatedAcc: UserAccount) => {
    const updated = userAccounts.map(u => u.id === updatedAcc.id ? updatedAcc : u);
    setUserAccounts(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(updated));
    saveUserAccountToCloud(updatedAcc).catch(e => console.error('Failed to update user account to cloud:', e));
  };

  const handleDeleteUserAccount = (id: string) => {
    const updated = userAccounts.filter(u => u.id !== id);
    setUserAccounts(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(updated));
    deleteUserAccountFromCloud(id).catch(e => console.error('Failed to delete user account from cloud:', e));
  };

  const handleImportUserAccounts = (newAccounts: UserAccount[]) => {
    const combined = [...userAccounts];
    newAccounts.forEach(acc => {
      const idx = combined.findIndex(u => u.id === acc.id || u.username.toLowerCase() === acc.username.toLowerCase());
      if (idx >= 0) {
        combined[idx] = acc;
      } else {
        combined.push(acc);
      }
    });
    setUserAccounts(combined);
    localStorage.setItem(LOCAL_STORAGE_KEY_USERS, JSON.stringify(combined));
    uploadBulkUsersToCloud(newAccounts).catch(e => console.error('Failed to bulk upload user accounts to cloud:', e));
  };

  // Cross-component navigations (e.g., clicking top saver goes to student ledger card)
  const handleViewStudentFromDashboard = (student: Student) => {
    setDashboardSelectedStudent(student);
    setActiveTab('students');
  };

  // UI Date time string
  const currentLocalDateString = formatDate(new Date().toISOString());

  // 1. If not logged in, show Login Screen
  if (!currentUser) {
    return (
      <LoginModal
        students={students}
        userAccounts={userAccounts}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(user));
          } catch (e) {
            console.error('Failed to save auth state:', e);
          }
        }}
      />
    );
  }

  // 2. If logged in as Student, render Student Portal (Siswa View Only)
  if (currentUser.role === 'student') {
    return (
      <StudentPortal
        currentUser={currentUser}
        students={students}
        transactions={transactions}
        onLogout={handleLogout}
      />
    );
  }

  // 3. Admin View (Full Access)
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
              <span className="text-sm font-extrabold tracking-tight text-slate-900 leading-none block">SDN 1 Gemblengan</span>
              <span className="text-[10px] font-bold text-indigo-650 tracking-wider uppercase block mt-1.5">Tabungan Kelas 5</span>
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
              <span>Transaksi Baru</span>
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
            <button
              id="nav-btn-sidebar-settings"
              onClick={() => { setActiveTab('settings'); }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs tracking-wide transition-all cursor-pointer ${
                activeTab === 'settings' 
                  ? 'bg-indigo-50 text-indigo-700 shadow-3xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/70'
              }`}
            >
              <Sliders size={15} />
              <span>Pengaturan & Data</span>
            </button>
          </nav>
        </div>

        {/* User / School Panel Footing */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-indigo-650 rounded-2xl p-4 text-white relative overflow-hidden group">
            <div className="absolute right-[-10px] bottom-[-10px] w-16 h-16 bg-white/10 rounded-full blur-sm" />
            <p className="text-[9px] opacity-80 uppercase tracking-widest font-extrabold mb-1">Status Operasional Admin</p>
            <p className="text-xs font-bold truncate">SD NEGERI 1 GEMBLENGAN</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${syncStatus === 'error' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
              <span className="text-[9px] text-slate-100 font-medium">
                {syncStatus === 'error' ? 'Cloud Terputus (Luring)' : 'Tersinkronisasi Cloud'}
              </span>
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
            <h1 className="text-xs font-black tracking-tight text-slate-900 leading-tight">SD NEGERI 1 GEMBLENGAN</h1>
            <p className="text-[10px] text-indigo-600 font-medium tracking-wide uppercase">Tabungan Kelas 5</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleLogout}
            className="p-1.5 text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 rounded-lg flex items-center gap-1 text-xs font-bold"
            title="Keluar Admin"
          >
            <LogOut size={14} />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      {/* 3. RIGHT HAND VIEWPORT CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Top Header Row on Desktop */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 shrink-0 hidden lg:flex items-center justify-between no-print" id="desktop-top-header">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {activeTab === 'dashboard' && 'Dashboard Tabungan'}
              {activeTab === 'cashier' && 'Transaksi Tabungan Siswa'}
              {activeTab === 'students' && 'Manajemen Akun Siswa'}
              {activeTab === 'rekap' && 'Laporan Jurnal Rekapitulasi'}
              {activeTab === 'settings' && 'Pengaturan Aplikasi & Impor Massal'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Hai, {currentUser.name} • SD NEGERI 1 GEMBLENGAN • Kas Terbuka</p>
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
              onClick={handleLogout}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-100 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title="Keluar / Ganti Akun"
            >
              <LogOut size={13} /> Keluar Admin
            </button>
          </div>
        </header>

        {/* 4. MAIN INNER SCROLLER CONTENT */}
        <main className="flex-1 overflow-y-auto w-full p-4 md:p-6 lg:p-8 pb-24 lg:pb-12 h-full bg-slate-50" id="routing-stage">
          
          {/* Cloud Synchronization Status notification banner */}
          <div className={`border p-3.5 rounded-2xl mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs no-print text-xs transition-all duration-300 ${
            syncStatus === 'error' 
              ? 'bg-rose-50 border-rose-200 text-rose-800' 
              : syncStatus === 'saving'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-indigo-900 border-indigo-950 text-indigo-50'
          }`} id="cloud-sync-state-ticker">
            <div className="flex items-center gap-2.5">
              {syncStatus === 'error' ? (
                <CloudOff size={16} className="text-rose-500 animate-pulse shrink-0" />
              ) : syncStatus === 'saving' ? (
                <CloudLightning size={16} className="text-amber-500 animate-bounce shrink-0" />
              ) : (
                <Cloud size={16} className="text-sky-300 animate-pulse shrink-0" />
              )}
              
              <span>
                {syncStatus === 'error' && (
                  <><strong>Mode Offline:</strong> Gagal terhubung ke Cloud. Data dicadangkan sementara di browser ini secara aman.</>
                )}
                {syncStatus === 'saving' && (
                  <><strong>Menyinkronkan:</strong> Sedang memperbarui laporan ke database Cloud secara real-time...</>
                )}
                {syncStatus === 'synced' && (
                  <><strong>Penyimpanan Otomatis:</strong> Data siswa & jurnal kas tersinkronisasi otomatis dengan database Cloud Firebase!</>
                )}
              </span>
            </div>
            <p className={`font-mono text-[10px] font-semibold border px-2.5 py-1 rounded-lg w-fit ${
              syncStatus === 'error' 
                ? 'bg-rose-100 border-rose-300 text-rose-800' 
                : syncStatus === 'saving'
                ? 'bg-amber-100 border-amber-300 text-amber-850'
                : 'bg-indigo-950 border-indigo-800 text-sky-200'
            }`}>
              {loadingCloud ? 'Memuat Database...' : `Cloud DB: ${students.length} Siswa | ${transactions.length} Jurnal`}
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
                onNavigateToTab={(tab) => setActiveTab(tab)}
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

            {activeTab === 'settings' && (
              <Settings 
                students={students}
                transactions={transactions}
                userAccounts={userAccounts}
                onImportData={handleImportData}
                onClearDatabase={handleClearDatabase}
                onAddStudent={handleAddStudent}
                onBulkImportStudents={handleBulkImportStudents}
                onAddUserAccount={handleAddUserAccount}
                onUpdateUserAccount={handleUpdateUserAccount}
                onDeleteUserAccount={handleDeleteUserAccount}
                onImportUserAccounts={handleImportUserAccounts}
              />
            )}
          </div>

          {/* Elegant nested footer within scroll container so it lays out naturally */}
          <footer className="py-6 mt-12 text-center border-t border-slate-205 border-slate-200 no-print" id="applet-footer">
            <div className="text-xs space-y-1.5 text-slate-400">
              <div className="flex justify-center items-center gap-1 font-semibold text-slate-500 text-[11px]">
                <School size={12} className="text-indigo-600" />
                <span>Sistem Tabungan Siswa SDN 1 Gemblengan v1.0.0</span>
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
          <span className="text-[9px] mt-1">Transaksi</span>
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
        <button
          id="mob-btn-settings"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all flex-1 cursor-pointer ${
            activeTab === 'settings' ? 'text-indigo-655 bg-indigo-50/50 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <Sliders size={18} />
          <span className="text-[9px] mt-1">Pengaturan</span>
        </button>
      </div>

    </div>
  );
}
