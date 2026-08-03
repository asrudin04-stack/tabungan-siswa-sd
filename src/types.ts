export type GradeClass = '5';

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
