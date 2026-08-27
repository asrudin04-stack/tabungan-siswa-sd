import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Edit3, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  User, 
  Wallet, 
  AlertTriangle, 
  Check, 
  Trash2,
  Info,
  Clock
} from 'lucide-react';
import { Student, Transaction, TransactionType } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  students: Student[];
  onClose: () => void;
  onSave: (id: string, updatedData: Partial<Transaction>) => void;
  onDelete?: (id: string) => void;
}

export default function EditTransactionModal({
  isOpen,
  transaction,
  students,
  onClose,
  onSave,
  onDelete
}: EditTransactionModalProps) {
  // Form states
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [txType, setTxType] = useState<TransactionType>('SETOR');
  const [amount, setAmount] = useState<number>(0);
  const [amountText, setAmountText] = useState<string>('');
  const [dateInput, setDateInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [recordedBy, setRecordedBy] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Sync state when modal opens or transaction changes
  useEffect(() => {
    if (transaction && isOpen) {
      setSelectedStudentId(transaction.studentId);
      setTxType(transaction.type);
      setAmount(transaction.amount);
      setAmountText(String(transaction.amount));
      // Convert ISO date string to datetime-local input format (YYYY-MM-DDTHH:mm)
      try {
        const d = new Date(transaction.date);
        const pad = (n: number) => String(n).padStart(2, '0');
        const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setDateInput(formattedDate);
      } catch (e) {
        setDateInput('');
      }
      setNotes(transaction.notes || '');
      setRecordedBy(transaction.recordedBy || 'Wali Kelas');
      setShowDeleteConfirm(false);
    }
  }, [transaction, isOpen]);

  // Selected student object
  const targetStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  // Original student from old transaction
  const originalStudent = useMemo(() => {
    if (!transaction) return null;
    return students.find(s => s.id === transaction.studentId) || null;
  }, [students, transaction]);

  // Calculate estimated balance impact on target student
  const balancePreview = useMemo(() => {
    if (!transaction || !targetStudent) return null;

    const isSameStudent = transaction.studentId === selectedStudentId;
    const oldDelta = transaction.type === 'SETOR' ? transaction.amount : -transaction.amount;
    const newDelta = txType === 'SETOR' ? amount : -amount;

    if (isSameStudent) {
      // Reverting old and applying new
      const projectedBalance = targetStudent.balance - oldDelta + newDelta;
      const netChange = newDelta - oldDelta;
      return {
        currentBalance: targetStudent.balance,
        projectedBalance,
        netChange,
        isOverdraft: projectedBalance < 0
      };
    } else {
      // Different student selected:
      // Old student gets oldDelta subtracted (reversed)
      // Target student gets newDelta added directly
      const projectedBalance = targetStudent.balance + newDelta;
      return {
        currentBalance: targetStudent.balance,
        projectedBalance,
        netChange: newDelta,
        isOverdraft: projectedBalance < 0
      };
    }
  }, [transaction, targetStudent, selectedStudentId, txType, amount]);

  // Handle amount text typing
  const handleAmountChange = (val: string) => {
    const numericStr = val.replace(/[^0-9]/g, '');
    setAmountText(numericStr);
    const parsed = parseInt(numericStr, 10);
    setAmount(isNaN(parsed) ? 0 : parsed);
  };

  // Quick amount addition
  const handleAddAmount = (addVal: number) => {
    const next = amount + addVal;
    setAmount(next);
    setAmountText(String(next));
  };

  // Quick preset amounts
  const quickPills = [5000, 10000, 20000, 50000, 100000];

  // Submit edit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction || !targetStudent) return;
    if (amount <= 0) {
      alert('Nominal transaksi harus lebih besar dari 0!');
      return;
    }
    if (balancePreview?.isOverdraft) {
      alert('Koreksi tidak dapat disimpan karena akan menyebabkan saldo siswa bernilai minus/overdraft!');
      return;
    }

    let finalDate = transaction.date;
    if (dateInput) {
      try {
        finalDate = new Date(dateInput).toISOString();
      } catch (e) {
        finalDate = transaction.date;
      }
    }

    onSave(transaction.id, {
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      studentGrade: targetStudent.grade,
      type: txType,
      amount,
      date: finalDate,
      notes: notes.trim() || undefined,
      recordedBy: recordedBy.trim() || 'Wali Kelas'
    });

    onClose();
  };

  // Handle delete execution
  const handleDeleteExecute = () => {
    if (!transaction || !onDelete) return;
    onDelete(transaction.id);
    onClose();
  };

  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl border-2 border-slate-900 shadow-[6px_6px_0px_0px_#0f172a] max-w-lg w-full overflow-hidden my-6"
        id="edit-transaction-modal-dialog"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-amber-350 bg-amber-400 border-b-2 border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-white text-slate-900 rounded-xl border border-slate-900 shadow-[2px_2px_0px_0px_#000]">
              <Edit3 size={18} />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">Koreksi Data Transaksi</h3>
              <p className="text-[11px] font-bold text-slate-800 font-mono">ID: {transaction.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl border border-slate-900 transition-all shadow-[2px_2px_0px_0px_#000] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Siswa Terkait */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Siswa Terkait *</span>
              {targetStudent && (
                <span className="text-[11px] font-bold font-mono text-indigo-700">
                  Saldo Saat Ini: {formatCurrency(targetStudent.balance)}
                </span>
              )}
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-indigo-600 transition-all cursor-pointer shadow-[2px_2px_0px_0px_#000]"
            >
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} (NIS: {st.nis} - Kelas {st.grade}) - Saldo: {formatCurrency(st.balance)}
                </option>
              ))}
            </select>
            {transaction.studentId !== selectedStudentId && originalStudent && (
              <p className="text-[11px] text-amber-700 font-bold mt-1 bg-amber-50 p-2 rounded-lg border border-amber-200">
                ⚠️ Memindahkan transaksi dari <strong>{originalStudent.name}</strong> ke <strong>{targetStudent?.name}</strong>. Saldo kedua siswa akan disesuaikan otomatis.
              </p>
            )}
          </div>

          {/* Jenis Transaksi */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
              Jenis Transaksi *
            </label>
            <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-100 rounded-2xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000]">
              <button
                type="button"
                onClick={() => setTxType('SETOR')}
                className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  txType === 'SETOR'
                    ? 'bg-emerald-500 text-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight size={16} className="stroke-[3]" />
                SETORAN (TABUNG)
              </button>
              <button
                type="button"
                onClick={() => setTxType('TARIK')}
                className={`py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  txType === 'TARIK'
                    ? 'bg-rose-500 text-white border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000]'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight size={16} className="stroke-[3]" />
                PENARIKAN (TARIK)
              </button>
            </div>
          </div>

          {/* Nominal Transaksi */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
              Nominal Transaksi (Rp) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-800 font-black text-base font-mono">
                Rp
              </div>
              <input
                type="text"
                value={amountText ? new Intl.NumberFormat('id-ID').format(amount) : ''}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                className="pl-11 pr-4 py-2.5 w-full bg-white border-2 border-slate-900 rounded-xl text-lg font-black text-slate-900 font-mono focus:outline-none focus:border-indigo-600 shadow-[2px_2px_0px_0px_#000]"
              />
            </div>
            {/* Quick amount pills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickPills.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleAddAmount(p)}
                  className="px-2.5 py-1 text-[11px] font-extrabold bg-slate-100 hover:bg-amber-100 text-slate-700 border border-slate-300 rounded-lg transition-all cursor-pointer font-mono"
                >
                  +{new Intl.NumberFormat('id-ID').format(p / 1000)}rb
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setAmount(0); setAmountText(''); }}
                className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg cursor-pointer ml-auto"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Tanggal & Waktu Transaksi (Backdate / Real Date) */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center gap-1">
              <Calendar size={13} className="text-indigo-600" />
              Tanggal & Waktu Transaksi *
            </label>
            <input
              type="datetime-local"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-indigo-600 shadow-[2px_2px_0px_0px_#000]"
            />
            <p className="text-[10px] text-slate-500 font-medium mt-1">
              * Anda dapat menyesuaikan tanggal jika transaksi dicatat susulan.
            </p>
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
              Catatan / Keterangan Transaksi
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Tabungan mingguan, sisa uang jajan, dll."
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl font-medium text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-indigo-600 shadow-[2px_2px_0px_0px_#000]"
            />
          </div>

          {/* Petugas Pencatat */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1.5">
              Petugas / Guru Pencatat
            </label>
            <input
              type="text"
              value={recordedBy}
              onChange={(e) => setRecordedBy(e.target.value)}
              placeholder="Nama Guru / Petugas Kasir"
              className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl font-bold text-slate-800 text-sm focus:outline-none focus:bg-white focus:border-indigo-600 shadow-[2px_2px_0px_0px_#000]"
            />
          </div>

          {/* Live Balance Impact Preview */}
          {balancePreview && targetStudent && (
            <div className={`p-3.5 rounded-2xl border-2 ${
              balancePreview.isOverdraft 
                ? 'bg-rose-50 border-rose-500 text-rose-900' 
                : 'bg-indigo-50/70 border-indigo-300 text-slate-800'
            }`}>
              <div className="flex items-center gap-1.5 text-xs font-extrabold mb-1">
                {balancePreview.isOverdraft ? (
                  <AlertTriangle size={15} className="text-rose-600" />
                ) : (
                  <Info size={15} className="text-indigo-600" />
                )}
                <span>Simulasi Penyesuaian Saldo Siswa ({targetStudent.name}):</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono mt-2">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Saldo Sebelumnya:</span>
                  <span className="font-bold text-slate-700">{formatCurrency(balancePreview.currentBalance)}</span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Saldo Setelah Koreksi:</span>
                  <span className={`font-black ${balancePreview.isOverdraft ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {formatCurrency(balancePreview.projectedBalance)}
                  </span>
                </div>
              </div>
              {balancePreview.isOverdraft && (
                <p className="text-[11px] font-bold text-rose-700 mt-2">
                  Saldo akhir tidak mencukupi (minus). Kurangi nominal penarikan!
                </p>
              )}
            </div>
          )}

          {/* Delete confirmation section */}
          {showDeleteConfirm && (
            <div className="p-4 bg-rose-50 border-2 border-rose-500 rounded-2xl text-rose-950 space-y-2">
              <p className="text-xs font-black flex items-center gap-1.5">
                <Trash2 size={15} className="text-rose-600" />
                Konfirmasi Hapus Transaksi #{transaction.id}
              </p>
              <p className="text-[11px] leading-relaxed text-rose-800">
                Data transaksi senilai <strong>{formatCurrency(transaction.amount)}</strong> ({transaction.type}) akan dihapus permanen. Saldo siswa <strong>{transaction.studentName}</strong> akan otomatis dikembalikan (dibalik).
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDeleteExecute}
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black border border-rose-900 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                >
                  Ya, Hapus Transaksi
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            {onDelete && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-300 hover:border-rose-500 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Hapus</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-xl text-xs border border-slate-300 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={amount <= 0 || balancePreview?.isOverdraft}
                className="py-2.5 px-5 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-200 text-slate-950 disabled:text-slate-400 border-2 border-slate-900 rounded-xl text-xs font-black shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check size={16} className="stroke-[3]" />
                Simpan Koreksi
              </button>
            </div>
          </div>

        </form>
      </motion.div>
    </div>
  );
}
