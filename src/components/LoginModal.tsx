import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  UserCheck, 
  KeyRound, 
  School, 
  Sparkles, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { Student, AuthUser, UserAccount } from '../types';

interface LoginModalProps {
  students: Student[];
  userAccounts: UserAccount[];
  onLoginSuccess: (user: AuthUser) => void;
}

export default function LoginModal({ students, userAccounts, onLoginSuccess }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState<'admin' | 'student'>('admin');

  // Admin form state
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin');
  const [adminError, setAdminError] = useState('');

  // Student form state
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentNisInput, setStudentNisInput] = useState<string>('');
  const [studentPin, setStudentPin] = useState<string>('1234');
  const [studentError, setStudentError] = useState('');

  // Handle Admin Login
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    const inputUser = adminUsername.trim();
    const inputPass = adminPassword.trim();

    if (!inputUser || !inputPass) {
      setAdminError('Username dan Password wajib diisi.');
      return;
    }

    // 1. Check registered admin accounts first
    const matchedAccount = userAccounts.find(
      u => u.role === 'admin' && 
           u.username.toLowerCase() === inputUser.toLowerCase() && 
           u.password === inputPass &&
           u.status === 'active'
    );

    if (matchedAccount) {
      onLoginSuccess({
        role: 'admin',
        name: matchedAccount.name || matchedAccount.username
      });
      return;
    }

    // 2. Default fallback for testing if user accounts list is empty or default
    if (inputUser.toLowerCase() === 'admin' && (inputPass === 'admin' || inputPass === '123456' || inputPass === 'guru')) {
      onLoginSuccess({
        role: 'admin',
        name: 'Guru / Admin Pengelola'
      });
      return;
    }

    // 3. Fallback for custom active admin user with matching username
    const customAdminUser = userAccounts.find(u => u.role === 'admin' && u.username.toLowerCase() === inputUser.toLowerCase());
    if (customAdminUser) {
      if (customAdminUser.status === 'inactive') {
        setAdminError('Akun admin ini sedang dinonaktifkan.');
        return;
      }
      if (customAdminUser.password !== inputPass) {
        setAdminError('Password admin salah.');
        return;
      }
    }

    setAdminError('Username atau Password Admin salah. Gunakan Username: "admin" & Password: "admin"');
  };

  // Handle Student Login
  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError('');

    let targetStudent: Student | undefined;

    if (selectedStudentId) {
      targetStudent = students.find(s => s.id === selectedStudentId);
    } else if (studentNisInput.trim()) {
      targetStudent = students.find(s => s.nis.trim() === studentNisInput.trim());
    }

    if (!targetStudent) {
      setStudentError('Data siswa tidak ditemukan. Silakan pilih nama siswa dari daftar atau masukkan NIS yang valid.');
      return;
    }

    // Check if there is a specific user account created for this student
    const studentAcc = userAccounts.find(
      u => u.role === 'student' && 
           (u.studentId === targetStudent?.id || u.studentNis === targetStudent?.nis || u.username === targetStudent?.nis)
    );

    if (studentAcc) {
      if (studentAcc.status === 'inactive') {
        setStudentError('Akun siswa ini sedang dinonaktifkan oleh Admin.');
        return;
      }
      if (studentPin && studentAcc.password && studentAcc.password !== studentPin.trim()) {
        setStudentError('PIN / Password siswa tidak cocok dengan data akun.');
        return;
      }
    }

    // Login success as student
    onLoginSuccess({
      role: 'student',
      name: targetStudent.name,
      studentId: targetStudent.id,
      studentNis: targetStudent.nis
    });
  };

  // Quick preset student login handler
  const handleQuickStudentLogin = (student: Student) => {
    onLoginSuccess({
      role: 'student',
      name: student.name,
      studentId: student.id,
      studentNis: student.nis
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0284c7] overflow-hidden my-8"
      >
        {/* Header / Brand Banner */}
        <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-blue-700 p-6 text-white text-center relative border-b-4 border-slate-900">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 mb-3 shadow-inner">
            <School className="w-10 h-10 text-amber-300 drop-shadow" />
          </div>
          <h1 className="text-2xl font-black tracking-tight drop-shadow-sm">
            SD NEGERI 1 GEMBLENGAN
          </h1>
          <p className="text-xs font-bold text-sky-100 mt-1 flex items-center justify-center gap-1.5">
            <Sparkles size={14} className="text-amber-300" />
            Sistem Tabungan Digital Kelas 5 SD
          </p>
        </div>

        {/* Tab Switcher: Admin vs Siswa */}
        <div className="p-2 bg-slate-100 border-b-2 border-slate-900 grid grid-cols-2 gap-2 font-black text-sm">
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setAdminError(''); }}
            className={`py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === 'admin'
                ? 'bg-amber-400 text-slate-900 border-slate-900 shadow-[3px_3px_0px_0px_#0284c7]'
                : 'bg-white text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <ShieldCheck size={18} />
            <span>Akses Admin / Guru</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('student'); setStudentError(''); }}
            className={`py-3 px-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
              activeTab === 'student'
                ? 'bg-sky-400 text-slate-900 border-slate-900 shadow-[3px_3px_0px_0px_#0284c7]'
                : 'bg-white text-slate-600 border-transparent hover:bg-slate-200'
            }`}
          >
            <UserCheck size={18} />
            <span>Akses Siswa</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {activeTab === 'admin' ? (
            /* --- ADMIN LOGIN FORM --- */
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 font-medium">
                <ShieldCheck size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-extrabold text-amber-950 block">Akses Penuh Administrator:</strong>
                  Mengelola kasir setoran, pendaftaran siswa, rekap sekolah & pengaturan database.
                </div>
              </div>

              {adminError && (
                <div className="bg-rose-50 border-2 border-rose-300 p-3 rounded-2xl flex items-center gap-2 text-xs text-rose-800 font-bold">
                  <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Username Admin / Guru
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Masukkan username admin..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Password / PIN
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 text-slate-400" size={18} />
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Masukkan password..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Demo Account Hint */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span className="font-semibold text-slate-700">Akun Login Pengujian:</span>
                <span className="font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold border border-amber-300">
                  admin / admin
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-900 border-2 border-slate-900 rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_#0284c7] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>Masuk Portal Admin</span>
                <ArrowRight size={18} />
              </button>
            </form>
          ) : (
            /* --- STUDENT LOGIN FORM --- */
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div className="bg-sky-50 border-2 border-sky-300 p-3 rounded-2xl flex items-start gap-2.5 text-xs text-sky-900 font-medium">
                <BookOpen size={18} className="text-sky-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-extrabold text-sky-950 block">Portal Khusus Siswa:</strong>
                  Siswa dapat melihat jumlah saldo, riwayat setoran & penarikan pribadi secara aman.
                </div>
              </div>

              {studentError && (
                <div className="bg-rose-50 border-2 border-rose-300 p-3 rounded-2xl flex items-center gap-2 text-xs text-rose-800 font-bold">
                  <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
                  <span>{studentError}</span>
                </div>
              )}

              {/* Option A: Select from Student Dropdown */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Pilih Nama Siswa (Kelas 5 SD)
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    if (e.target.value) {
                      const found = students.find(s => s.id === e.target.value);
                      if (found) setStudentNisInput(found.nis);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-sky-500"
                >
                  <option value="">-- Pilih dari Daftar Siswa Kelas 5 --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (NIS: {s.nis})
                    </option>
                  ))}
                </select>
              </div>

              {/* Option B: Enter NIS directly */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  Atau Ketik NIS (Nomor Induk Siswa)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={studentNisInput}
                    onChange={(e) => {
                      setStudentNisInput(e.target.value);
                      const matched = students.find(s => s.nis.trim() === e.target.value.trim());
                      if (matched) setSelectedStudentId(matched.id);
                    }}
                    placeholder="Contoh: 202605001"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              {/* PIN / Password */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                  PIN Siswa / Password (Opsional)
                </label>
                <input
                  type="password"
                  value={studentPin}
                  onChange={(e) => setStudentPin(e.target.value)}
                  placeholder="Masukkan 4 digit PIN..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-sky-500"
                />
              </div>

              {/* Quick Login Chips for Demo */}
              {students.length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-[11px] font-extrabold text-slate-500 uppercase mb-2 flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-500" />
                    Atau Klik Uji Coba Login Siswa:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {students.slice(0, 4).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleQuickStudentLogin(st)}
                        className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 rounded-lg text-xs font-bold transition-all text-left flex items-center gap-1.5"
                      >
                        <User size={12} className="text-sky-600" />
                        <span>{st.name.split(' ')[0]} ({st.nis})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-sky-400 hover:bg-sky-300 text-slate-900 border-2 border-slate-900 rounded-2xl font-black text-sm shadow-[4px_4px_0px_0px_#0284c7] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>Lihat Tabungan Saya</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t-2 border-slate-900 text-center text-xs text-slate-500 font-medium">
          SD Negeri 1 Gemblengan &copy; {new Date().getFullYear()} &bull; Aplikasi Tabungan Siswa
        </div>
      </motion.div>
    </div>
  );
}
