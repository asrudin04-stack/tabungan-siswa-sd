import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  UserPlus, 
  User, 
  Phone, 
  Trash2, 
  Edit3, 
  X, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  FileSpreadsheet,
  Check,
  Smartphone,
  Save,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Student, Transaction, GradeClass } from '../types';
import { formatCurrency, formatDate, getClassBadgeStyle } from '../utils';

interface StudentListProps {
  students: Student[];
  transactions: Transaction[];
  onAddStudent: (student: Omit<Student, 'id' | 'createdAt' | 'balance'>, initialDeposit: number) => Student;
  onEditStudent: (id: string, updated: Partial<Omit<Student, 'id' | 'createdAt' | 'balance'>>) => void;
  onDeleteStudent: (id: string) => void;
  preSelectedStudent: Student | null; // Selected student from dashboard click
  onClosePreSelection: () => void;
}

export default function StudentList({ 
  students, 
  transactions, 
  onAddStudent, 
  onEditStudent, 
  onDeleteStudent,
  preSelectedStudent,
  onClosePreSelection
}: StudentListProps) {
  // Navigation / filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassTab, setSelectedClassTab] = useState<string>('ALL'); // 'ALL', '1', '2', '3', '4', '5', '6'

  // Modals visibility states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailedStudent, setDetailedStudent] = useState<Student | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states for Add Student
  const [addForm, setAddForm] = useState({
    name: '',
    nis: '',
    grade: '1A' as GradeClass,
    parentName: '',
    phone: '',
    initialDeposit: 0
  });

  // Auto-generate NIS status
  const [autoNis, setAutoNis] = useState(true);

  // Form states for Edit Student
  const [editForm, setEditForm] = useState({
    name: '',
    grade: '1A' as GradeClass,
    parentName: '',
    phone: '',
  });

  // Listen to preSelection clicked from dashboard
  React.useEffect(() => {
    if (preSelectedStudent) {
      // Find latest reference from array
      const currentRef = students.find(s => s.id === preSelectedStudent.id);
      if (currentRef) {
        setDetailedStudent(currentRef);
      }
      onClosePreSelection(); // clear triggers so we can close details normally
    }
  }, [preSelectedStudent, students, onClosePreSelection]);

  // Generate automated NIS
  const generatedNis = useMemo(() => {
    const year = new Date().getFullYear();
    const classVal = addForm.grade.charAt(0);
    // Find count of students in grade prefix
    const countInGrade = students.filter(s => s.grade.startsWith(classVal)).length + 1;
    const formatCount = String(countInGrade).padStart(3, '0');
    return `${year}0${classVal}${formatCount}`;
  }, [addForm.grade, students]);

  // Apply automatic NIS to the form
  useEffect(() => {
    if (autoNis) {
      setAddForm(prev => ({ ...prev, nis: generatedNis }));
    }
  }, [autoNis, generatedNis]);

  // Filter students
  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Class filter (E.g. ClassTab of '5' filters grades beginning with '5', e.g. 5A, 5B)
    if (selectedClassTab !== 'ALL') {
      result = result.filter(s => s.grade.startsWith(selectedClassTab));
    }

    // Search query filter (search by name, parent name, or NIS)
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        s => s.name.toLowerCase().includes(q) || 
             s.nis.includes(q) || 
             (s.parentName && s.parentName.toLowerCase().includes(q))
      );
    }

    // Sort by name alphabetically
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedClassTab, searchQuery]);

  // Individual student operations (Detailed transactions list)
  const studentTransactions = useMemo(() => {
    if (!detailedStudent) return [];
    return transactions
      .filter(t => t.studentId === detailedStudent.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [detailedStudent, transactions]);

  // Handler to open student profile detail
  const handleOpenDetail = (student: Student) => {
    setDetailedStudent(student);
    setIsEditing(false);
    setEditForm({
      name: student.name,
      grade: student.grade,
      parentName: student.parentName || '',
      phone: student.phone || ''
    });
  };

  // Submit adding new student
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.nis.trim()) {
      alert('Nama dan NIS wajib diisi!');
      return;
    }

    // Check duplicate NIS
    const exists = students.some(s => s.nis === addForm.nis.trim());
    if (exists) {
      alert(`Waduh! Nomor NIS ${addForm.nis} sudah terdaftar di sistem.`);
      return;
    }

    try {
      onAddStudent({
        name: addForm.name.trim(),
        nis: addForm.nis.trim(),
        grade: addForm.grade,
        parentName: addForm.parentName.trim() || undefined,
        phone: addForm.phone.trim() || undefined
      }, addForm.initialDeposit);

      // Reset state and close
      setAddForm({
        name: '',
        nis: '',
        grade: '1A',
        parentName: '',
        phone: '',
        initialDeposit: 0
      });
      setIsAddModalOpen(false);
    } catch (e) {
      alert('Gagal menambah siswa: ' + e);
    }
  };

  // Submit editing student info
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailedStudent) return;
    if (!editForm.name.trim()) {
      alert('Nama siswa tidak boleh kosong!');
      return;
    }

    onEditStudent(detailedStudent.id, {
      name: editForm.name.trim(),
      grade: editForm.grade,
      parentName: editForm.parentName.trim() || undefined,
      phone: editForm.phone.trim() || undefined
    });

    // Update local detailed student ref to show updated data instantly
    setDetailedStudent(prev => prev ? {
      ...prev,
      name: editForm.name.trim(),
      grade: editForm.grade,
      parentName: editForm.parentName.trim() || undefined,
      phone: editForm.phone.trim() || undefined
    } : null);

    setIsEditing(false);
  };

  // Submit trigger deleting student
  const handleDeleteTrigger = (id: string) => {
    if (window.confirm('PERINGATAN: Apakah Bapak/Ibu YAKIN ingin menghapus data siswa ini?\nSeluruh sisa saldo dan seluruh LOG riwayat transaksi simpanan/penarikan siswa juga akan dihapus permanen!')) {
      onDeleteStudent(id);
      setDetailedStudent(null);
    }
  };

  const classTabOptions = [
    { value: 'ALL', label: 'Semua Kelas' },
    { value: '1', label: 'Kelas 1' },
    { value: '2', label: 'Kelas 2' },
    { value: '3', label: 'Kelas 3' },
    { value: '4', label: 'Kelas 4' },
    { value: '5', label: 'Kelas 5' },
    { value: '6', label: 'Kelas 6' },
  ];

  const gradeOptions: GradeClass[] = [
    '1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B'
  ];

  return (
    <div className="space-y-6" id="student-directory">
      
      {/* Search Header and Operations Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in" id="directory-header">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users size={18} />
            </span>
            Daftar Anggota Tabungan
          </h2>
          <p className="text-xs text-slate-400 mt-1">Cari, edit profil siswa, lihat mutasi tabungan pribadi, atau tambahkan siswa baru.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          {/* Live Search field */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Search size={16} />
            </span>
            <input
              type="text"
              id="student-list-search-field"
              placeholder="Cari siswa atau NIS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all w-full sm:w-60 placeholder-slate-400"
            />
          </div>

          {/* Add Student Button Trigger */}
          <button
            id="register-new-student-trigger"
            onClick={() => {
              setAutoNis(true);
              setAddForm(p => ({ ...p, name: '', parentName: '', phone: '', initialDeposit: 0 }));
              setIsAddModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <UserPlus size={15} /> Siswa Baru
          </button>
        </div>
      </div>

      {/* Class Level Tabs Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full" id="class-filter-tabs">
        {classTabOptions.map((tab) => (
          <button
            key={tab.value}
            id={`tab-grade-filter-${tab.value}`}
            onClick={() => setSelectedClassTab(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedClassTab === tab.value
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="text-xs text-slate-400 ml-auto mr-1 font-medium hidden sm:inline">Tampil {filteredStudents.length} siswa</span>
      </div>

      {/* Grid of Student Cards */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-16 text-center text-slate-400 flex flex-col items-center justify-center h-80" id="empty-student-list">
          <Users className="stroke-1 text-slate-300 mb-3" size={48} />
          <h3 className="text-slate-700 font-bold text-sm">Siswa Tidak Ditemukan</h3>
          <p className="text-xs max-w-xs mt-1 leading-relaxed">
            Tidak ada siswa terdaftar yang cocok dengan pencarian atau filter kelas ini. Silakan tambahkan siswa baru atau ubah filter Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" id="student-grid-root">
          {filteredStudents.map((student) => {
            const badge = getClassBadgeStyle(student.grade);
            return (
              <motion.div
                key={student.id}
                id={`student-profile-card-${student.id}`}
                whileHover={{ y: -3, boxShadow: '0 4px 12px -1px rgb(0 0 0 / 0.05)' }}
                onClick={() => handleOpenDetail(student)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-350 transition-all flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                      Kelas {student.grade}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-medium">NIS {student.nis}</span>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors flex items-center justify-center text-slate-500 font-bold text-sm">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-700 truncate">{student.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{student.parentName ? `Wali: ${student.parentName}` : 'Wali: -'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Saldo</span>
                    <p className="text-sm font-extrabold text-slate-800 font-mono mt-0.2">{formatCurrency(student.balance)}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-indigo-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Detail Mutasi &rarr;
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* --- MODAL 1: REGISTER SISWA BARU --- */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto no-print" id="add-student-modal-wrapper">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsAddModalOpen(false)} />
            
            {/* Modal Body */}
            <div className="flex items-center justify-center min-h-screen p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-lg p-6 relative shadow-2xl z-10 border border-slate-100"
                id="add-student-form-pane"
              >
                <button 
                  id="close-add-student-modal"
                  onClick={() => setIsAddModalOpen(false)}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>

                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <UserPlus size={18} />
                  </span>
                  Daftarkan Siswa Baru
                </h3>
                <p className="text-xs text-slate-400 mb-5 pb-3 border-b border-slate-100">
                  Isikan biodata lengkap murid di bawah ini untuk mengaktifkan rekening tabungan barunya.
                </p>

                <form onSubmit={handleAddSubmit} className="space-y-4">
                  {/* Nama lengkap */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nama Lengkap Murid *</label>
                    <input
                      type="text"
                      id="add-student-fullname"
                      required
                      placeholder="Contoh: Ahmad Rafli Hidayat"
                      value={addForm.name}
                      onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                      className="px-4.5 py-2.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all animate-none"
                    />
                  </div>

                  {/* Class and NIS Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Kelas */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kelas Murid *</label>
                      <select
                        id="add-student-grade"
                        value={addForm.grade}
                        onChange={(e) => setAddForm({...addForm, grade: e.target.value as GradeClass})}
                        className="px-4.5 py-2.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
                      >
                        {gradeOptions.map((g) => (
                          <option key={g} value={g}>Kelas {g}</option>
                        ))}
                      </select>
                    </div>

                    {/* NIS */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nomor Induk Siswa (NIS) *</label>
                        <button
                          type="button"
                          id="toggle-auto-nis"
                          onClick={() => setAutoNis(!autoNis)}
                          className={`text-[10px] font-bold ${autoNis ? 'text-indigo-600' : 'text-slate-550'}`}
                        >
                          {autoNis ? '[Kustom NIS]' : '[Otomatis NIS]'}
                        </button>
                      </div>
                      <input
                        type="text"
                        id="add-student-nis"
                        required
                        disabled={autoNis}
                        placeholder="Contoh: 202601001"
                        value={addForm.nis}
                        onChange={(e) => setAddForm({...addForm, nis: e.target.value})}
                        className={`px-4.5 py-2.5 w-full border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono ${
                          autoNis 
                            ? 'bg-slate-100 text-slate-400 border-slate-100' 
                            : 'bg-slate-50 text-slate-700 border-slate-200 focus:bg-white'
                        }`}
                      />
                    </div>

                  </div>

                  {/* parent and phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Nama Wali */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Nama Orang Tua / Wali</label>
                      <input
                        type="text"
                        id="add-student-parent"
                        placeholder="Contoh: Budi Hidayat"
                        value={addForm.parentName}
                        onChange={(e) => setAddForm({...addForm, parentName: e.target.value})}
                        className="px-4.5 py-2.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                      />
                    </div>

                    {/* No Hp */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Smartphone size={13} />
                        <label className="font-bold uppercase tracking-wider block">No HP Orang Tua</label>
                      </div>
                      <input
                        type="tel"
                        id="add-student-phone"
                        placeholder="Contoh: 0812345678"
                        value={addForm.phone}
                        onChange={(e) => setAddForm({...addForm, phone: e.target.value})}
                        className="px-4.5 py-2.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
                      />
                    </div>

                  </div>

                  {/* Initial Deposit Setoran Awal */}
                  <div className="space-y-1.5 p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 mt-2">
                    <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Setoran Awal Tabungan (Opsional)</label>
                    <p className="text-[10px] text-emerald-600 mb-2">Masukkan jumlah uang jika murid langsung menyerahkan uang saat mendaftar.</p>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-700 font-bold font-mono text-sm">
                        Rp
                      </span>
                      <input
                        type="text"
                        id="add-student-initialdeposit"
                        placeholder="0"
                        value={addForm.initialDeposit ? new Intl.NumberFormat('id-ID').format(addForm.initialDeposit) : ''}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          const parsed = parseInt(val, 10);
                          setAddForm({...addForm, initialDeposit: isNaN(parsed) ? 0 : parsed});
                        }}
                        className="pl-10 pr-4 py-2.5 w-full bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder-emerald-300"
                      />
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-3.5">
                    <button
                      type="button"
                      id="cancel-add-student"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      id="save-new-student-btn"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      <Check size={14} /> Daftarkan Siswa
                    </button>
                  </div>

                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 2: DETAIL PROFIL & MUTASI DAN EDIT SISWA (SLIDEOVER DRAWER) --- */}
      <AnimatePresence>
        {detailedStudent && (
          <div className="fixed inset-0 z-50 overflow-hidden no-print" id="student-detail-drawer-wrapper">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setDetailedStudent(null)} />

            {/* Sliding Drawer Body Container */}
            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-100 relative"
                id="student-detail-drawer"
              >
                {/* Close Button Inside Drawer */}
                <button 
                  id="close-student-detail-drawer"
                  onClick={() => setDetailedStudent(null)}
                  className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer z-10"
                >
                  <X size={16} />
                </button>

                {/* Drawer Header & Profile Card */}
                <div className="p-6 bg-gradient-to-b from-indigo-50/70 to-white border-b border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-indigo-600 text-white text-lg font-bold rounded-2xl flex items-center justify-center shadow-md">
                      {detailedStudent.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-extrabold text-slate-800 tracking-tight leading-snug">{detailedStudent.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-500 font-mono">NIS {detailedStudent.nis}</span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${getClassBadgeStyle(detailedStudent.grade).bg} ${getClassBadgeStyle(detailedStudent.grade).text} ${getClassBadgeStyle(detailedStudent.grade).border}`}>
                          Kelas {detailedStudent.grade}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Savings summary */}
                  <div className="mt-5 p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center border border-slate-800 shadow-sm">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Saldo Akhir Tabungan</span>
                      <p className="text-lg font-mono font-extrabold text-indigo-300 mt-0.5">{formatCurrency(detailedStudent.balance)}</p>
                    </div>
                    <span className="p-2 bg-slate-800 rounded-xl">
                      <TrendingUp size={18} className="text-indigo-400" />
                    </span>
                  </div>
                </div>

                {/* Scrollable Middle View */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Mode: EDIT BIODATA FORM */}
                  {isEditing ? (
                    <form onSubmit={handleEditSubmit} className="space-y-4 border border-indigo-100 p-4 rounded-2xl bg-indigo-50/20">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Ubah Biodata Siswa</h4>
                        <button 
                          type="button" 
                          id="cancel-edit-mode"
                          onClick={() => setIsEditing(false)} 
                          className="text-xs font-bold text-slate-400 hover:text-slate-600"
                        >
                          Batalkan
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-450 uppercase">Nama Lengkap Siswa</label>
                        <input
                          type="text"
                          id="edit-student-name"
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="px-3 py-2 w-full bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-450 uppercase">Pilih Kelas</label>
                        <select
                          id="edit-student-grade"
                          value={editForm.grade}
                          onChange={(e) => setEditForm({...editForm, grade: e.target.value as GradeClass})}
                          className="px-3 py-2 w-full bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {gradeOptions.map((g) => (
                            <option key={g} value={g}>Kelas {g}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-450 uppercase">Nama Orang Tua / Wali</label>
                        <input
                          type="text"
                          id="edit-student-parent"
                          value={editForm.parentName}
                          onChange={(e) => setEditForm({...editForm, parentName: e.target.value})}
                          className="px-3 py-2 w-full bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="space-y-1 font-mono">
                        <label className="text-[10px] font-bold text-slate-450 uppercase">No HP Wali</label>
                        <input
                          type="text"
                          id="edit-student-phone"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                          className="px-3 py-2 w-full bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <button
                        type="submit"
                        id="save-edit-student-btn"
                        className="py-2.5 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-all shadow-xs"
                      >
                        <Save size={13} /> Simpan Perubahan
                      </button>
                    </form>
                  ) : (
                    /* Default Mode: PROFILE METADATA & ACTIONS */
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-50">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Orang Tua / Wali</span>
                          <span className="text-xs font-bold text-slate-700 mt-1 inline-block">{detailedStudent.parentName || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. HP Wali</span>
                          <span className="text-xs font-mono font-bold text-slate-700 mt-1 inline-block">{detailedStudent.phone || '-'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          id="trigger-edit-student-biodata"
                          onClick={() => setIsEditing(true)}
                          className="px-3.5 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200/50 hover:border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1 flex-1 justify-center transition-colors cursor-pointer"
                        >
                          <Edit3 size={13} /> Ubah Biodata
                        </button>
                        <button
                          id="delete-student-btn"
                          onClick={() => handleDeleteTrigger(detailedStudent.id)}
                          className="p-2 bg-white hover:bg-rose-50 text-slate-450 hover:text-rose-600 border border-slate-200/50 hover:border-rose-200 rounded-xl transition-all cursor-pointer"
                          title="Hapus data siswa permanen"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Ledger Mutasi Section */}
                  <div className="space-y-3.5 Pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 tracking-wider uppercase flex items-center gap-1.5">
                      <FileSpreadsheet size={14} className="text-indigo-600" /> Riwayat Mutasi Buku
                    </h4>

                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1" id="student-personal-ledger-list">
                      {studentTransactions.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 text-xs">
                          Belum ada catatan mutasi tabungan untuk murid ini.
                        </div>
                      ) : (
                        studentTransactions.map((t) => {
                          const isSetor = t.type === 'SETOR';
                          return (
                            <div key={t.id} className="p-3 bg-slate-50/60 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-3.5 h-3.5 flex items-center justify-center rounded-md text-[9px] font-bold ${
                                    isSetor ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {isSetor ? 'S' : 'T'}
                                  </span>
                                  <span className="text-xs font-bold text-slate-700">{isSetor ? 'Simpan Uang' : 'Tarik Uang'}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 block mt-1">{formatDate(t.date, true)}</span>
                                {t.notes && <span className="text-[10px] text-slate-500 italic block mt-0.5 truncate max-w-[180px]">{t.notes}</span>}
                              </div>

                              <div className="text-right">
                                <p className={`text-xs font-bold font-mono ${isSetor ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {isSetor ? '+' : '-'}{formatCurrency(t.amount)}
                                </p>
                                <span className="text-[9px] text-slate-400 block mt-0.5">Oleh: {t.recordedBy.split(' ')[0]}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>

                {/* Drawer Footer info */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium">
                  Murid terdaftar sejak {formatDate(detailedStudent.createdAt)}
                </div>

              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
