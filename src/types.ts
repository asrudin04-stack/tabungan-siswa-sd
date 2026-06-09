export type GradeClass = '1A' | '1B' | '2A' | '2B' | '3A' | '3B' | '4A' | '4B' | '5A' | '5B' | '6A' | '6B';

export interface Student {
  id: string; // unique uuid or auto-generated
  nis: string; // Nomor Induk Siswa, e.g. "202601001"
  name: string;
  grade: GradeClass;
  parentName?: string;
  phone?: string;
  balance: number;
  createdAt: string;
}

export type TransactionType = 'SETOR' | 'TARIK';

export interface Transaction {
  id: string;
  studentId: string;
  studentName: string;
  studentGrade: GradeClass;
  type: TransactionType;
  amount: number;
  date: string; // ISO string format YYYY-MM-DDTHH:mm:ss.sssZ
  notes?: string;
  recordedBy: string; // e.g. "Kasir Guru"
}

export interface MonthlyStats {
  monthYear: string; // "YYYY-MM"
  totalDeposits: number;
  totalWithdrawals: number;
  netSavings: number;
  transactionCount: number;
}
