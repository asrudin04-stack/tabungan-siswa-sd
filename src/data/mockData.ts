import { Student, Transaction } from '../types';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 's-1',
    nis: '202601001',
    name: 'Ahmad Rafli Hidayat',
    grade: '4A',
    parentName: 'Hidayat Santoso',
    phone: '081234567812',
    balance: 350000,
    createdAt: '2026-01-10T08:00:00.000Z'
  },
  {
    id: 's-2',
    nis: '202601002',
    name: 'Siti Aminah Azzahra',
    grade: '4A',
    parentName: 'Ahmad Fauzi',
    phone: '081398765431',
    balance: 520000,
    createdAt: '2026-01-11T08:30:00.000Z'
  },
  {
    id: 's-3',
    nis: '202602001',
    name: 'Rian Pratama Wijaya',
    grade: '5B',
    parentName: 'Bambang Wijaya',
    phone: '085699887711',
    balance: 150000,
    createdAt: '2026-02-01T09:15:00.000Z'
  },
  {
    id: 's-4',
    nis: '202601003',
    name: 'Lani Rahmawati Putri',
    grade: '3B',
    parentName: 'Supardi',
    phone: '081211223344',
    balance: 275000,
    createdAt: '2026-01-15T07:45:00.000Z'
  },
  {
    id: 's-5',
    nis: '202603001',
    name: 'Budi Hartono',
    grade: '6A',
    parentName: 'Sutrisno Hartono',
    phone: '087855663322',
    balance: 890000,
    createdAt: '2026-03-05T08:00:00.000Z'
  },
  {
    id: 's-6',
    nis: '202601004',
    name: 'Dewi Lestari Kusuma',
    grade: '4B',
    parentName: 'Putu Kusuma',
    phone: '081922334455',
    balance: 400000,
    createdAt: '2026-01-12T10:00:00.000Z'
  },
  {
    id: 's-7',
    nis: '202604001',
    name: 'Faza Al-Ghifari',
    grade: '1A',
    parentName: 'M. Shodiq',
    phone: '082155443322',
    balance: 95000,
    createdAt: '2026-04-10T08:15:00.000Z'
  },
  {
    id: 's-8',
    nis: '202604002',
    name: 'Nabila Nur Safitri',
    grade: '2A',
    parentName: 'Joko Safitri',
    phone: '085244556677',
    balance: 180000,
    createdAt: '2026-04-12T08:30:00.000Z'
  },
  {
    id: 's-9',
    nis: '202605001',
    name: 'Zhafran Khairy',
    grade: '2B',
    parentName: 'Rudi Khairy',
    phone: '081122339900',
    balance: 125000,
    createdAt: '2026-05-02T09:00:00.000Z'
  },
  {
    id: 's-10',
    nis: '202605002',
    name: 'Keisha Aurelia',
    grade: '6B',
    parentName: 'Doni Aurelia',
    phone: '081373822833',
    balance: 1050000,
    createdAt: '2026-05-05T10:30:00.000Z'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // March 2026
  {
    id: 't-1',
    studentId: 's-5',
    studentName: 'Budi Hartono',
    studentGrade: '6A',
    type: 'SETOR',
    amount: 500000,
    date: '2026-03-05T08:05:00.000Z',
    notes: 'Tabungan perdana kelas 6',
    recordedBy: 'Bu Guru Risma'
  },
  {
    id: 't-2',
    studentId: 's-1',
    studentName: 'Ahmad Rafli Hidayat',
    studentGrade: '4A',
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
    studentGrade: '4A',
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
    studentGrade: '6A',
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
    studentGrade: '4A',
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
    studentGrade: '5B',
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
    studentGrade: '3B',
    type: 'SETOR',
    amount: 150000,
    date: '2026-04-15T08:00:00.000Z',
    notes: 'Tabungan bulanan',
    recordedBy: 'Bu Guru Risma'
  },
  {
    id: 't-8',
    studentId: 's-7',
    studentName: 'Faza Al-Ghifari',
    studentGrade: '1A',
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
    studentGrade: '2A',
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
    studentGrade: '4A',
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
    studentGrade: '4A',
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
    studentGrade: '6A',
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
    studentGrade: '6B',
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
    studentGrade: '4B',
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
    studentGrade: '2B',
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
    studentGrade: '3B',
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
    studentGrade: '5B',
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
    studentGrade: '4A',
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
    studentGrade: '4A',
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
    studentGrade: '4B',
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
    studentGrade: '6B',
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
    studentGrade: '6A',
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
    studentGrade: '6B',
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
    studentGrade: '1A',
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
    studentGrade: '2B',
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
    studentGrade: '2A',
    type: 'SETOR',
    amount: 50000,
    date: '2026-06-09T10:10:00.000Z',
    notes: 'Celengan koin',
    recordedBy: 'Bu Guru Risma'
  }
];
