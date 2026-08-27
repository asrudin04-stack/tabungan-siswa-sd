import { Student, Transaction, UserAccount, StudentFee } from '../types';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 's-1',
    nis: '202601001',
    name: 'Ahmad Rafli Hidayat',
    grade: '5',
    parentName: 'Hidayat Santoso',
    phone: '081234567812',
    balance: 350000,
    createdAt: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 's-2',
    nis: '202601002',
    name: 'Siti Aminah Azzahra',
    grade: '5',
    parentName: 'Ahmad Fauzi',
    phone: '081398765431',
    balance: 520000,
    createdAt: '2026-01-11T08:30:00.000Z'
  },
  {
    id: 's-3',
    nis: '202602001',
    name: 'Rian Pratama Wijaya',
    grade: '5',
    parentName: 'Bambang Wijaya',
    phone: '085699887711',
    balance: 150000,
    createdAt: '2026-02-01T09:15:00.000Z'
  },
  {
    id: 's-4',
    nis: '202601003',
    name: 'Lani Rahmawati Putri',
    grade: '5',
    parentName: 'Supardi',
    phone: '081211223344',
    balance: 275000,
    createdAt: '2026-01-15T07:45:00.000Z'
  },
  {
    id: 's-5',
    nis: '202603001',
    name: 'Budi Hartono',
    grade: '5',
    parentName: 'Sutrisno Hartono',
    phone: '087855663322',
    balance: 890000,
    createdAt: '2026-03-05T08:00:00.000Z'
  },
  {
    id: 's-6',
    nis: '202601004',
    name: 'Dewi Lestari Kusuma',
    grade: '5',
    parentName: 'Putu Kusuma',
    phone: '081922334455',
    balance: 400000,
    createdAt: '2026-01-12T10:00:00.000Z'
  },
  {
    id: 's-7',
    nis: '202604001',
    name: 'Faza Al-Ghifari',
    grade: '5',
    parentName: 'M. Shodiq',
    phone: '082155443322',
    balance: 95000,
    createdAt: '2026-04-10T08:15:00.000Z'
  },
  {
    id: 's-8',
    nis: '202604002',
    name: 'Nabila Nur Safitri',
    grade: '5',
    parentName: 'Joko Safitri',
    phone: '085244556677',
    balance: 180000,
    createdAt: '2026-04-12T08:30:00.000Z'
  },
  {
    id: 's-9',
    nis: '202605001',
    name: 'Zhafran Khairy',
    grade: '5',
    parentName: 'Rudi Khairy',
    phone: '081122339900',
    balance: 125000,
    createdAt: '2026-05-02T09:00:00.000Z'
  },
  {
    id: 's-10',
    nis: '202605002',
    name: 'Keisha Aurelia',
    grade: '5',
    parentName: 'Doni Aurelia',
    phone: '081373822833',
    balance: 1050000,
    createdAt: '2026-05-05T10:30:00.000Z'
  }
];

export const INITIAL_USER_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-admin-1',
    username: 'admin',
    password: 'admin',
    name: 'Guru / Admin Pengelola',
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  ...INITIAL_STUDENTS.map((st) => ({
    id: `usr-student-${st.id}`,
    username: st.nis,
    password: '1234',
    name: st.name,
    role: 'student' as const,
    studentId: st.id,
    studentNis: st.nis,
    status: 'active' as const,
    createdAt: st.createdAt
  }))
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // January 2026
  {
    id: 't-0-s4',
    studentId: 's-4',
    studentName: 'Lani Rahmawati Putri',
    studentGrade: '5',
    type: 'SETOR',
    amount: 25000,
    date: '2026-01-15T08:00:00.000Z',
    notes: 'Setoran awal pembukaan buku tabungan',
    recordedBy: 'Bu Guru Risma'
  },

  // February 2026
  {
    id: 't-0-s3',
    studentId: 's-3',
    studentName: 'Rian Pratama Wijaya',
    studentGrade: '5',
    type: 'SETOR',
    amount: 100000,
    date: '2026-02-01T09:20:00.000Z',
    notes: 'Setoran tabungan awal',
    recordedBy: 'Pak Guru Agus'
  },

  // March 2026
  {
    id: 't-1',
    studentId: 's-5',
    studentName: 'Budi Hartono',
    studentGrade: '5',
    type: 'SETOR',
    amount: 500000,
    date: '2026-03-05T08:05:00.000Z',
    notes: 'Tabungan perdana kelas 5',
    recordedBy: 'Bu Guru Risma'
  },
  {
    id: 't-2',
    studentId: 's-1',
    studentName: 'Ahmad Rafli Hidayat',
    studentGrade: '5',
    type: 'SETOR',
    amount: 100000,
    date: '2026-03-10T09:00:00.000Z',
    notes: 'Setoran mingguan',
    recordedBy: 'Pak Guru Agus'
  },
  {
    id: 't-3',
    studentId: 's-2',
    studentName: 'Siti Aminah Azzahra',
    studentGrade: '5',
    type: 'SETOR',
    amount: 200000,
    date: '2026-03-10T09:10:00.000Z',
    notes: 'Bagi hasil lomba',
    recordedBy: 'Pak Guru Agus'
  },
  {
    id: 't-4',
    studentId: 's-5',
    studentName: 'Budi Hartono',
    studentGrade: '5',
    type: 'TARIK',
    amount: 100000,
    date: '2026-03-25T11:00:00.000Z',
    notes: 'Beli buku tulis',
    recordedBy: 'Bu Guru Risma'
  },

  // April 2026
  {
    id: 't-5',
    studentId: 's-1',
    studentName: 'Ahmad Rafli Hidayat',
    studentGrade: '5',
    type: 'SETOR',
    amount: 150000,
    date: '2026-04-05T08:30:00.000Z',
    notes: 'Setor sisa uang jajan',
    recordedBy: 'Bu Guru Risma'
  },
  {
    id: 't-6',
    studentId: 's-3',
    studentName: 'Rian Pratama Wijaya',
    studentGrade: '5',
    type: 'SETOR',
    amount: 100000,
    date: '2026-04-08T09:15:00.000Z',
    notes: 'Menabung rutin',
    recordedBy: 'Pak Guru Agus'
  },
  {
    id: 't-7',
    studentId: 's-4',
    studentName: 'Lani Rahmawati Putri',
    studentGrade: '5',
    type: 'SETOR',
    amount: 150000,
    date: '2026-04-15T08:00:00.000Z',
    notes: 'Tabungan bulanan',
    recordedBy: 'Bu Guru Risma'
  },
  {
    id: 't-0-s7',
    studentId: 's-7',
    studentName: 'Faza Al-Ghifari',
    studentGrade: '5',
    type: 'SETOR',
    amount: 5000,
    date: '2026-04-10T08:15:00.000Z',
    notes: 'Setoran awal pembukaan tabungan',
    recordedBy: 'Bu Guru Risma'
  },
  {
    id: 't-8',
    studentId: 's-7',
    studentName: 'Faza Al-Ghifari',
    studentGrade: '5',
    type: 'SETOR',
    amount: 100000,
    date: '2026-04-10T08:30:00.000Z',
    notes: 'Celengan dirumah dimasukkan sekolah',
    recordedBy: 'Bu Guru Risma'
  },
  {
    id: 't-9',
    studentId: 's-8',
    studentName: 'Nabila Nur Safitri',
    studentGrade: '5',
    type: 'SETOR',
    amount: 130000,
    date: '2026-04-12T08:45:00.000Z',
    notes: 'Setoran awal tabungan',
    recordedBy: 'Bu Guru Risma'
  },
  {
    id: 't-10',
    studentId: 's-2',
    studentName: 'Siti Aminah Azzahra',
    studentGrade: '5',
    type: 'TARIK',
    amount: 50000,
    date: '2026-04-20T10:00:00.000Z',
    notes: 'Keperluan kerajinan tangan',
    recordedBy: 'Pak Guru Agus'
  },

  // May 2026
  {
    id: 't-11',
    studentId: 's-2',
    studentName: 'Siti Aminah Azzahra',
    studentGrade: '5',
    type: 'SETOR',
    amount: 250000,
    date: '2026-05-02T08:30:00.000Z',
    notes: 'Menabung bulanan Mei',
    recordedBy: 'Pak Guru Agus'
  },
  {
    id: 't-12',
    studentId: 's-5',
    studentName: 'Budi Hartono',
    studentGrade: '5',
    type: 'SETOR',
    amount: 350000,
    date: '2026-05-05T09:00:00.000Z',
    notes: 'Sisa uang jajan bulanan',
    recordedBy: 'Bu Guru Risma'
  },
  {
    id: 't-13',
    studentId: 's-10',
    studentName: 'Keisha Aurelia',
    studentGrade: '5',
    type: 'SETOR',
    amount: 1000000,
    date: '2026-05-05T10:45:00.000Z',
    notes: 'Uang hadiah juara kelas',
    recordedBy: 'Bu Guru Risma'
  },
  {
    id: 't-14',
    studentId: 's-6',
    studentName: 'Dewi Lestari Kusuma',
    studentGrade: '5',
    type: 'SETOR',
    amount: 300000,
    date: '2026-05-12T10:15:00.000Z',
    notes: 'Kado ultah dimasukkan celengan',
    recordedBy: 'Pak Guru Agus'
  },
  {
    id: 't-15',
    studentId: 's-9',
    studentName: 'Zhafran Khairy',
    studentGrade: '5',
    type: 'SETOR',
    amount: 100000,
    date: '2026-05-15T08:00:00.000Z',
    notes: 'Nabung pekanan',
    recordedBy: 'Bu Guru Risma'
  },
  {
    id: 't-16',
    studentId: 's-4',
    studentName: 'Lani Rahmawati Putri',
    studentGrade: '5',
    type: 'SETOR',
    amount: 100000,
    date: '2026-05-18T09:00:00.000Z',
    notes: 'Celengan bulanan',
    recordedBy: 'Pak Guru Agus'
  },
  {
    id: 't-17',
    studentId: 's-3',
    studentName: 'Rian Pratama Wijaya',
    studentGrade: '5',
    type: 'TARIK',
    amount: 50000,
    date: '2026-05-22T11:00:00.000Z',
    notes: 'Beli pensil warna',
    recordedBy: 'Pak Guru Agus'
  },

  // June 2026 (Current Month)
  {
    id: 't-18',
    studentId: 's-1',
    studentName: 'Ahmad Rafli Hidayat',
    studentGrade: '5',
    type: 'SETOR',
    amount: 100000,
    date: '2026-06-02T08:15:00.000Z',
    notes: 'Awal bulan Juni',
    recordedBy: 'Bu Guru Risma'
  },
  {
    id: 't-19',
    studentId: 's-2',
    studentName: 'Siti Aminah Azzahra',
    studentGrade: '5',
    type: 'SETOR',
    amount: 120000,
    date: '2026-06-03T08:30:00.000Z',
    notes: 'Penyisihan uang saku',
    recordedBy: 'Bu Guru Risma'
  },
  {
    id: 't-20',
    studentId: 's-6',
    studentName: 'Dewi Lestari Kusuma',
    studentGrade: '5',
    type: 'SETOR',
    amount: 100000,
    date: '2026-06-04T09:15:00.000Z',
    notes: 'Setoran rutin pekanan',
    recordedBy: 'Pak Guru Agus'
  },
  {
    id: 't-21',
    studentId: 's-10',
    studentName: 'Keisha Aurelia',
    studentGrade: '5',
    type: 'SETOR',
    amount: 100000,
    date: '2026-06-05T10:00:00.000Z',
    notes: 'Tabungan mingguan',
    recordedBy: 'Pak Guru Agus'
  },
  {
    id: 't-22',
    studentId: 's-5',
    studentName: 'Budi Hartono',
    studentGrade: '5',
    type: 'SETOR',
    amount: 140000,
    date: '2026-06-06T11:15:00.000Z',
    notes: 'Setor sisa makan siang',
    recordedBy: 'Bu Guru Risma'
  },
  {
    id: 't-23',
    studentId: 's-10',
    studentName: 'Keisha Aurelia',
    studentGrade: '5',
    type: 'TARIK',
    amount: 50000,
    date: '2026-06-08T09:30:00.000Z',
    notes: 'Beli perlengkapan pramuka',
    recordedBy: 'Bu Guru Risma'
  },
  {
    id: 't-24',
    studentId: 's-7',
    studentName: 'Faza Al-Ghifari',
    studentGrade: '5',
    type: 'TARIK',
    amount: 10000,
    date: '2026-06-09T08:00:00.000Z',
    notes: 'Beli penggaris hilang',
    recordedBy: 'Pak Guru Agus'
  },
  {
    id: 't-25',
    studentId: 's-9',
    studentName: 'Zhafran Khairy',
    studentGrade: '5',
    type: 'SETOR',
    amount: 25000,
    date: '2026-06-09T09:20:00.000Z',
    notes: 'Sisa jajan harian',
    recordedBy: 'Pak Guru Agus'
  },
  {
    id: 't-26',
    studentId: 's-8',
    studentName: 'Nabila Nur Safitri',
    studentGrade: '5',
    type: 'SETOR',
    amount: 50000,
    date: '2026-06-09T10:10:00.000Z',
    notes: 'Celengan koin',
    recordedBy: 'Bu Guru Risma'
  }
];

export const INITIAL_STUDENT_FEES: StudentFee[] = [
  // 1. Iuran LKS Semester Ganjil (Kelas 5) - Target Rp 65.000
  {
    id: 'fee-lks-s1',
    studentId: 's-1',
    studentName: 'Ahmad Rafli Hidayat',
    studentNis: '202601001',
    studentGrade: '5',
    feeType: 'LKS',
    title: 'Paket LKS Semester Ganjil (Tema 1-5 & Agama)',
    categoryName: 'Buku LKS',
    period: 'Semester 1 2026/2027',
    targetAmount: 65000,
    paidAmount: 65000,
    status: 'LUNAS',
    createdAt: '2026-07-15T08:00:00.000Z',
    updatedAt: '2026-07-20T09:30:00.000Z',
    notes: 'Lunas saat pembagian buku',
    payments: [
      {
        id: 'pay-lks-1',
        feeId: 'fee-lks-s1',
        studentId: 's-1',
        amount: 65000,
        date: '2026-07-20T09:30:00.000Z',
        method: 'TUNAI',
        recordedBy: 'Bu Guru Risma',
        receiptNo: 'KW-LKS-2026-001'
      }
    ]
  },
  {
    id: 'fee-lks-s2',
    studentId: 's-2',
    studentName: 'Siti Aminah Azzahra',
    studentNis: '202601002',
    studentGrade: '5',
    feeType: 'LKS',
    title: 'Paket LKS Semester Ganjil (Tema 1-5 & Agama)',
    categoryName: 'Buku LKS',
    period: 'Semester 1 2026/2027',
    targetAmount: 65000,
    paidAmount: 65000,
    status: 'LUNAS',
    createdAt: '2026-07-15T08:00:00.000Z',
    updatedAt: '2026-07-18T10:00:00.000Z',
    notes: 'Lunas transfer wali murid',
    payments: [
      {
        id: 'pay-lks-2',
        feeId: 'fee-lks-s2',
        studentId: 's-2',
        amount: 65000,
        date: '2026-07-18T10:00:00.000Z',
        method: 'TUNAI',
        recordedBy: 'Bu Guru Risma',
        receiptNo: 'KW-LKS-2026-002'
      }
    ]
  },
  {
    id: 'fee-lks-s3',
    studentId: 's-3',
    studentName: 'Rian Pratama Wijaya',
    studentNis: '202602001',
    studentGrade: '5',
    feeType: 'LKS',
    title: 'Paket LKS Semester Ganjil (Tema 1-5 & Agama)',
    categoryName: 'Buku LKS',
    period: 'Semester 1 2026/2027',
    targetAmount: 65000,
    paidAmount: 35000,
    status: 'BELUM_LUNAS',
    createdAt: '2026-07-15T08:00:00.000Z',
    updatedAt: '2026-07-22T08:45:00.000Z',
    notes: 'Kurang Rp 30.000 (Cicilan 1)',
    payments: [
      {
        id: 'pay-lks-3',
        feeId: 'fee-lks-s3',
        studentId: 's-3',
        amount: 35000,
        date: '2026-07-22T08:45:00.000Z',
        method: 'TUNAI',
        recordedBy: 'Pak Guru Agus',
        receiptNo: 'KW-LKS-2026-003'
      }
    ]
  },
  {
    id: 'fee-lks-s4',
    studentId: 's-4',
    studentName: 'Lani Rahmawati Putri',
    studentNis: '202601003',
    studentGrade: '5',
    feeType: 'LKS',
    title: 'Paket LKS Semester Ganjil (Tema 1-5 & Agama)',
    categoryName: 'Buku LKS',
    period: 'Semester 1 2026/2027',
    targetAmount: 65000,
    paidAmount: 65000,
    status: 'LUNAS',
    createdAt: '2026-07-15T08:00:00.000Z',
    updatedAt: '2026-07-19T09:15:00.000Z',
    notes: 'Lunas potong tabungan siswa',
    payments: [
      {
        id: 'pay-lks-4',
        feeId: 'fee-lks-s4',
        studentId: 's-4',
        amount: 65000,
        date: '2026-07-19T09:15:00.000Z',
        method: 'POTONG_TABUNGAN',
        recordedBy: 'Bu Guru Risma',
        receiptNo: 'KW-LKS-2026-004'
      }
    ]
  },
  {
    id: 'fee-lks-s5',
    studentId: 's-5',
    studentName: 'Budi Hartono',
    studentNis: '202603001',
    studentGrade: '5',
    feeType: 'LKS',
    title: 'Paket LKS Semester Ganjil (Tema 1-5 & Agama)',
    categoryName: 'Buku LKS',
    period: 'Semester 1 2026/2027',
    targetAmount: 65000,
    paidAmount: 0,
    status: 'BELUM_LUNAS',
    createdAt: '2026-07-15T08:00:00.000Z',
    updatedAt: '2026-07-15T08:00:00.000Z',
    notes: 'Belum bayar sama sekali',
    payments: []
  },
  {
    id: 'fee-lks-s6',
    studentId: 's-6',
    studentName: 'Dewi Lestari',
    studentNis: '202602002',
    studentGrade: '5',
    feeType: 'LKS',
    title: 'Paket LKS Semester Ganjil (Tema 1-5 & Agama)',
    categoryName: 'Buku LKS',
    period: 'Semester 1 2026/2027',
    targetAmount: 65000,
    paidAmount: 65000,
    status: 'LUNAS',
    createdAt: '2026-07-15T08:00:00.000Z',
    updatedAt: '2026-07-21T08:00:00.000Z',
    notes: 'Lunas',
    payments: [
      {
        id: 'pay-lks-6',
        feeId: 'fee-lks-s6',
        studentId: 's-6',
        amount: 65000,
        date: '2026-07-21T08:00:00.000Z',
        method: 'TUNAI',
        recordedBy: 'Bu Guru Risma',
        receiptNo: 'KW-LKS-2026-005'
      }
    ]
  },
  {
    id: 'fee-lks-s7',
    studentId: 's-7',
    studentName: 'Faza Al-Ghifari',
    studentNis: '202603002',
    studentGrade: '5',
    feeType: 'LKS',
    title: 'Paket LKS Semester Ganjil (Tema 1-5 & Agama)',
    categoryName: 'Buku LKS',
    period: 'Semester 1 2026/2027',
    targetAmount: 65000,
    paidAmount: 50000,
    status: 'BELUM_LUNAS',
    createdAt: '2026-07-15T08:00:00.000Z',
    updatedAt: '2026-07-25T10:15:00.000Z',
    notes: 'Kurang Rp 15.000',
    payments: [
      {
        id: 'pay-lks-7',
        feeId: 'fee-lks-s7',
        studentId: 's-7',
        amount: 50000,
        date: '2026-07-25T10:15:00.000Z',
        method: 'TUNAI',
        recordedBy: 'Pak Guru Agus',
        receiptNo: 'KW-LKS-2026-006'
      }
    ]
  },
  {
    id: 'fee-lks-s8',
    studentId: 's-8',
    studentName: 'Nabila Nur Safitri',
    studentNis: '202601004',
    studentGrade: '5',
    feeType: 'LKS',
    title: 'Paket LKS Semester Ganjil (Tema 1-5 & Agama)',
    categoryName: 'Buku LKS',
    period: 'Semester 1 2026/2027',
    targetAmount: 65000,
    paidAmount: 65000,
    status: 'LUNAS',
    createdAt: '2026-07-15T08:00:00.000Z',
    updatedAt: '2026-07-17T09:00:00.000Z',
    notes: 'Lunas tunai',
    payments: [
      {
        id: 'pay-lks-8',
        feeId: 'fee-lks-s8',
        studentId: 's-8',
        amount: 65000,
        date: '2026-07-17T09:00:00.000Z',
        method: 'TUNAI',
        recordedBy: 'Bu Guru Risma',
        receiptNo: 'KW-LKS-2026-007'
      }
    ]
  },
  {
    id: 'fee-lks-s9',
    studentId: 's-9',
    studentName: 'Zhafran Khairy',
    studentNis: '202603003',
    studentGrade: '5',
    feeType: 'LKS',
    title: 'Paket LKS Semester Ganjil (Tema 1-5 & Agama)',
    categoryName: 'Buku LKS',
    period: 'Semester 1 2026/2027',
    targetAmount: 65000,
    paidAmount: 65000,
    status: 'LUNAS',
    createdAt: '2026-07-15T08:00:00.000Z',
    updatedAt: '2026-07-16T08:30:00.000Z',
    notes: 'Lunas',
    payments: [
      {
        id: 'pay-lks-9',
        feeId: 'fee-lks-s9',
        studentId: 's-9',
        amount: 65000,
        date: '2026-07-16T08:30:00.000Z',
        method: 'TUNAI',
        recordedBy: 'Pak Guru Agus',
        receiptNo: 'KW-LKS-2026-008'
      }
    ]
  },
  {
    id: 'fee-lks-s10',
    studentId: 's-10',
    studentName: 'Keisha Aurelia',
    studentNis: '202602003',
    studentGrade: '5',
    feeType: 'LKS',
    title: 'Paket LKS Semester Ganjil (Tema 1-5 & Agama)',
    categoryName: 'Buku LKS',
    period: 'Semester 1 2026/2027',
    targetAmount: 65000,
    paidAmount: 65000,
    status: 'LUNAS',
    createdAt: '2026-07-15T08:00:00.000Z',
    updatedAt: '2026-07-20T10:00:00.000Z',
    notes: 'Lunas tunai',
    payments: [
      {
        id: 'pay-lks-10',
        feeId: 'fee-lks-s10',
        studentId: 's-10',
        amount: 65000,
        date: '2026-07-20T10:00:00.000Z',
        method: 'TUNAI',
        recordedBy: 'Bu Guru Risma',
        receiptNo: 'KW-LKS-2026-009'
      }
    ]
  },

  // 2. Iuran Kegiatan Pramuka & Kemah Persami - Target Rp 25.000
  {
    id: 'fee-pra-s1',
    studentId: 's-1',
    studentName: 'Ahmad Rafli Hidayat',
    studentNis: '202601001',
    studentGrade: '5',
    feeType: 'PRAMUKA',
    title: 'Iuran Kegiatan Pramuka & Kemah Persami',
    categoryName: 'Kepramukaan',
    period: 'Agustus 2026',
    targetAmount: 25000,
    paidAmount: 25000,
    status: 'LUNAS',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-05T09:00:00.000Z',
    notes: 'Lunas tunai',
    payments: [
      {
        id: 'pay-pra-1',
        feeId: 'fee-pra-s1',
        studentId: 's-1',
        amount: 25000,
        date: '2026-08-05T09:00:00.000Z',
        method: 'TUNAI',
        recordedBy: 'Pak Guru Agus',
        receiptNo: 'KW-PRA-2026-001'
      }
    ]
  },
  {
    id: 'fee-pra-s2',
    studentId: 's-2',
    studentName: 'Siti Aminah Azzahra',
    studentNis: '202601002',
    studentGrade: '5',
    feeType: 'PRAMUKA',
    title: 'Iuran Kegiatan Pramuka & Kemah Persami',
    categoryName: 'Kepramukaan',
    period: 'Agustus 2026',
    targetAmount: 25000,
    paidAmount: 25000,
    status: 'LUNAS',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-08T08:30:00.000Z',
    notes: 'Lunas',
    payments: [
      {
        id: 'pay-pra-2',
        feeId: 'fee-pra-s2',
        studentId: 's-2',
        amount: 25000,
        date: '2026-08-08T08:30:00.000Z',
        method: 'TUNAI',
        recordedBy: 'Bu Guru Risma',
        receiptNo: 'KW-PRA-2026-002'
      }
    ]
  },
  {
    id: 'fee-pra-s3',
    studentId: 's-3',
    studentName: 'Rian Pratama Wijaya',
    studentNis: '202602001',
    studentGrade: '5',
    feeType: 'PRAMUKA',
    title: 'Iuran Kegiatan Pramuka & Kemah Persami',
    categoryName: 'Kepramukaan',
    period: 'Agustus 2026',
    targetAmount: 25000,
    paidAmount: 0,
    status: 'BELUM_LUNAS',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z',
    notes: 'Belum bayar',
    payments: []
  },
  {
    id: 'fee-pra-s4',
    studentId: 's-4',
    studentName: 'Lani Rahmawati Putri',
    studentNis: '202601003',
    studentGrade: '5',
    feeType: 'PRAMUKA',
    title: 'Iuran Kegiatan Pramuka & Kemah Persami',
    categoryName: 'Kepramukaan',
    period: 'Agustus 2026',
    targetAmount: 25000,
    paidAmount: 25000,
    status: 'LUNAS',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-10T09:10:00.000Z',
    notes: 'Lunas potong tabungan',
    payments: [
      {
        id: 'pay-pra-4',
        feeId: 'fee-pra-s4',
        studentId: 's-4',
        amount: 25000,
        date: '2026-08-10T09:10:00.000Z',
        method: 'POTONG_TABUNGAN',
        recordedBy: 'Bu Guru Risma',
        receiptNo: 'KW-PRA-2026-003'
      }
    ]
  },
  {
    id: 'fee-pra-s5',
    studentId: 's-5',
    studentName: 'Budi Hartono',
    studentNis: '202603001',
    studentGrade: '5',
    feeType: 'PRAMUKA',
    title: 'Iuran Kegiatan Pramuka & Kemah Persami',
    categoryName: 'Kepramukaan',
    period: 'Agustus 2026',
    targetAmount: 25000,
    paidAmount: 15000,
    status: 'BELUM_LUNAS',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-12T08:15:00.000Z',
    notes: 'Kurang Rp 10.000',
    payments: [
      {
        id: 'pay-pra-5',
        feeId: 'fee-pra-s5',
        studentId: 's-5',
        amount: 15000,
        date: '2026-08-12T08:15:00.000Z',
        method: 'TUNAI',
        recordedBy: 'Pak Guru Agus',
        receiptNo: 'KW-PRA-2026-004'
      }
    ]
  },
  {
    id: 'fee-pra-s6',
    studentId: 's-6',
    studentName: 'Dewi Lestari',
    studentNis: '202602002',
    studentGrade: '5',
    feeType: 'PRAMUKA',
    title: 'Iuran Kegiatan Pramuka & Kemah Persami',
    categoryName: 'Kepramukaan',
    period: 'Agustus 2026',
    targetAmount: 25000,
    paidAmount: 25000,
    status: 'LUNAS',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-14T09:40:00.000Z',
    notes: 'Lunas',
    payments: [
      {
        id: 'pay-pra-6',
        feeId: 'fee-pra-s6',
        studentId: 's-6',
        amount: 25000,
        date: '2026-08-14T09:40:00.000Z',
        method: 'TUNAI',
        recordedBy: 'Bu Guru Risma',
        receiptNo: 'KW-PRA-2026-005'
      }
    ]
  },
  {
    id: 'fee-pra-s7',
    studentId: 's-7',
    studentName: 'Faza Al-Ghifari',
    studentNis: '202603002',
    studentGrade: '5',
    feeType: 'PRAMUKA',
    title: 'Iuran Kegiatan Pramuka & Kemah Persami',
    categoryName: 'Kepramukaan',
    period: 'Agustus 2026',
    targetAmount: 25000,
    paidAmount: 25000,
    status: 'LUNAS',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-15T08:20:00.000Z',
    notes: 'Lunas tunai',
    payments: [
      {
        id: 'pay-pra-7',
        feeId: 'fee-pra-s7',
        studentId: 's-7',
        amount: 25000,
        date: '2026-08-15T08:20:00.000Z',
        method: 'TUNAI',
        recordedBy: 'Pak Guru Agus',
        receiptNo: 'KW-PRA-2026-006'
      }
    ]
  },
  {
    id: 'fee-pra-s8',
    studentId: 's-8',
    studentName: 'Nabila Nur Safitri',
    studentNis: '202601004',
    studentGrade: '5',
    feeType: 'PRAMUKA',
    title: 'Iuran Kegiatan Pramuka & Kemah Persami',
    categoryName: 'Kepramukaan',
    period: 'Agustus 2026',
    targetAmount: 25000,
    paidAmount: 25000,
    status: 'LUNAS',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-16T10:00:00.000Z',
    notes: 'Lunas',
    payments: [
      {
        id: 'pay-pra-8',
        feeId: 'fee-pra-s8',
        studentId: 's-8',
        amount: 25000,
        date: '2026-08-16T10:00:00.000Z',
        method: 'TUNAI',
        recordedBy: 'Bu Guru Risma',
        receiptNo: 'KW-PRA-2026-007'
      }
    ]
  },
  {
    id: 'fee-pra-s9',
    studentId: 's-9',
    studentName: 'Zhafran Khairy',
    studentNis: '202603003',
    studentGrade: '5',
    feeType: 'PRAMUKA',
    title: 'Iuran Kegiatan Pramuka & Kemah Persami',
    categoryName: 'Kepramukaan',
    period: 'Agustus 2026',
    targetAmount: 25000,
    paidAmount: 0,
    status: 'BELUM_LUNAS',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-01T08:00:00.000Z',
    notes: 'Belum bayar',
    payments: []
  },
  {
    id: 'fee-pra-s10',
    studentId: 's-10',
    studentName: 'Keisha Aurelia',
    studentNis: '202602003',
    studentGrade: '5',
    feeType: 'PRAMUKA',
    title: 'Iuran Kegiatan Pramuka & Kemah Persami',
    categoryName: 'Kepramukaan',
    period: 'Agustus 2026',
    targetAmount: 25000,
    paidAmount: 25000,
    status: 'LUNAS',
    createdAt: '2026-08-01T08:00:00.000Z',
    updatedAt: '2026-08-18T09:30:00.000Z',
    notes: 'Lunas tunai',
    payments: [
      {
        id: 'pay-pra-10',
        feeId: 'fee-pra-s10',
        studentId: 's-10',
        amount: 25000,
        date: '2026-08-18T09:30:00.000Z',
        method: 'TUNAI',
        recordedBy: 'Bu Guru Risma',
        receiptNo: 'KW-PRA-2026-008'
      }
    ]
  }
];

