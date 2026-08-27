import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  Database, 
  Upload, 
  Download, 
  Trash2, 
  Users, 
  FileSpreadsheet, 
  AlertTriangle, 
  Check, 
  CheckCircle2, 
  RefreshCw, 
  Clipboard, 
  Info,
  HelpCircle,
  Sparkles,
  FileCheck2,
  Phone,
  UserPlus,
  Edit3,
  Key,
  ShieldCheck,
  UserCheck,
  Search,
  Filter,
  X,
  FileUp,
  FileDown,
  UserX,
  Eye,
  EyeOff,
  UserCog
} from 'lucide-react';
import { Student, Transaction, GradeClass, UserAccount } from '../types';
import { formatCurrency, formatDate } from '../utils';

interface SettingsProps {
  students: Student[];
  transactions: Transaction[];
  userAccounts: UserAccount[];
  onImportData: (importedStudents: Student[], importedTransactions: Transaction[]) => void;
  onClearDatabase: () => void;
  onAddStudent: (student: Omit<Student, 'id' | 'createdAt' | 'balance'>, initialDeposit: number) => Student;
  onBulkImportStudents: (newStudentsList: Array<Omit<Student, 'id' | 'createdAt' | 'balance'> & { initialDeposit: number }>) => void;
  onAddUserAccount: (account: Omit<UserAccount, 'id' | 'createdAt'>) => void;
  onUpdateUserAccount: (account: UserAccount) => void;
  onDeleteUserAccount: (id: string) => void;
  onImportUserAccounts: (newAccounts: UserAccount[]) => void;
  onResetUserAccounts?: () => void;
}

export default function Settings({ 
  students, 
  transactions, 
  userAccounts,
  onImportData, 
  onClearDatabase,
  onAddStudent,
  onBulkImportStudents,
  onAddUserAccount,
  onUpdateUserAccount,
  onDeleteUserAccount,
  onImportUserAccounts,
  onResetUserAccounts
}: SettingsProps) {
  // Main Settings Section Tab
  const [activeSettingSection, setActiveSettingSection] = useState<'USERS' | 'IMPORT_STUDENTS' | 'BACKUP'>('USERS');

  // Database backup actions states
  const [dbStateMsg, setDbStateMsg] = useState<{ text: string; success: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [showConfirmResetPanel, setShowConfirmResetPanel] = useState(false);

  // User Management States
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilterRole, setUserFilterRole] = useState<'ALL' | 'admin' | 'student'>('ALL');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // User Form Modal Fields
  const [userFormUsername, setUserFormUsername] = useState('');
  const [userFormPassword, setUserFormPassword] = useState('');
  const [userFormName, setUserFormName] = useState('');
  const [userFormRole, setUserFormRole] = useState<'admin' | 'student'>('student');
  const [userFormStudentId, setUserFormStudentId] = useState('');
  const [userFormStatus, setUserFormStatus] = useState<'active' | 'inactive'>('active');
  const [userFormError, setUserFormError] = useState('');

  const userInputRef = useRef<HTMLInputElement>(null);

  // Raw bulk-import tab & text area states
  const [importMode, setImportMode] = useState<'EXCEL' | 'TEXT'>('EXCEL');
  const studentExcelInputRef = useRef<HTMLInputElement>(null);
  const [rawPasteText, setRawPasteText] = useState(
    "Ahmad Rafli, 5, 202601001, Hidayat Santoso, 081234567812, 50000\n" +
    "Siti Aminah, 5, 202601002, Ahmad Fauzi, 081398765431, 20000\n" +
    "Rian Pratama, 5, 202602001, Bambang Tri, 0813888822, 0"
  );
  const [parsedPreviewList, setParsedPreviewList] = useState<Array<{
    name: string;
    grade: GradeClass;
    nis: string;
    parentName: string;
    phone: string;
    initialDeposit: number;
    isValid: boolean;
    errorReason?: string;
  }>>([]);
  const [isParsed, setIsParsed] = useState(false);

  // --- USER MANAGEMENT HANDLERS ---
  const handleOpenAddUserModal = () => {
    setEditingUser(null);
    setUserFormUsername('');
    setUserFormPassword('1234');
    setUserFormName('');
    setUserFormRole('student');
    setUserFormStudentId('');
    setUserFormStatus('active');
    setUserFormError('');
    setShowUserModal(true);
  };

  const handleOpenEditUserModal = (acc: UserAccount) => {
    setEditingUser(acc);
    setUserFormUsername(acc.username);
    setUserFormPassword(acc.password);
    setUserFormName(acc.name);
    setUserFormRole(acc.role);
    setUserFormStudentId(acc.studentId || '');
    setUserFormStatus(acc.status);
    setUserFormError('');
    setShowUserModal(true);
  };

  const handleSaveUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');

    const username = userFormUsername.trim();
    const password = userFormPassword.trim();
    const name = userFormName.trim();

    if (!username || !password || !name) {
      setUserFormError('Username, Password/PIN, dan Nama Lengkap wajib diisi.');
      return;
    }

    // Check duplicate username if adding new or changing username
    const existingWithSameUser = userAccounts.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.id !== editingUser?.id
    );
    if (existingWithSameUser) {
      setUserFormError(`Username "${username}" sudah digunakan oleh akun lain.`);
      return;
    }

    const selectedStudent = students.find(s => s.id === userFormStudentId);

    if (editingUser) {
      onUpdateUserAccount({
        ...editingUser,
        username,
        password,
        name,
        role: userFormRole,
        studentId: userFormRole === 'student' ? userFormStudentId || undefined : undefined,
        studentNis: userFormRole === 'student' ? (selectedStudent?.nis || username) : undefined,
        status: userFormStatus
      });
      setDbStateMsg({ text: `Berhasil memperbarui data akun ${name}.`, success: true });
    } else {
      onAddUserAccount({
        username,
        password,
        name,
        role: userFormRole,
        studentId: userFormRole === 'student' ? userFormStudentId || undefined : undefined,
        studentNis: userFormRole === 'student' ? (selectedStudent?.nis || username) : undefined,
        status: userFormStatus
      });
      setDbStateMsg({ text: `Berhasil menambahkan akun user ${name}.`, success: true });
    }

    setShowUserModal(false);
    setEditingUser(null);
    setTimeout(() => setDbStateMsg(null), 3000);
  };

  const handleToggleUserStatus = (acc: UserAccount) => {
    const updatedStatus = acc.status === 'active' ? 'inactive' : 'active';
    onUpdateUserAccount({
      ...acc,
      status: updatedStatus
    });
    setDbStateMsg({ 
      text: `Status akun ${acc.name} diubah menjadi ${updatedStatus === 'active' ? 'Aktif' : 'Nonaktif'}.`, 
      success: true 
    });
    setTimeout(() => setDbStateMsg(null), 3000);
  };

  const handleDeleteUser = (acc: UserAccount) => {
    if (userAccounts.filter(u => u.role === 'admin' && u.status === 'active').length <= 1 && acc.role === 'admin') {
      alert('Tidak dapat menghapus akun Admin aktif terakhir demi keamanan sistem!');
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus akun login "${acc.name}" (${acc.username})?`)) {
      onDeleteUserAccount(acc.id);
      setDbStateMsg({ text: `Akun ${acc.name} telah dihapus dari sistem.`, success: true });
      setTimeout(() => setDbStateMsg(null), 3000);
    }
  };

  const handleQuickResetSingleUserPin = (acc: UserAccount) => {
    const defaultPin = acc.role === 'admin' ? 'admin' : '1234';
    if (window.confirm(`Reset Password/PIN untuk user "${acc.name}" (${acc.username}) ke default (${defaultPin})?`)) {
      onUpdateUserAccount({
        ...acc,
        password: defaultPin
      });
      setDbStateMsg({ text: `Password/PIN ${acc.name} berhasil direset ke "${defaultPin}".`, success: true });
      setTimeout(() => setDbStateMsg(null), 3000);
    }
  };

  const handleResetAllUsers = () => {
    const confirmMessage = 
      `Apakah Anda yakin ingin RESET ULANG SELURUH DATA USER LOGIN ke setelan default?\n\n` +
      `- Akun Admin Pengelola akan direset ke: admin / admin\n` +
      `- Seluruh Akun Siswa akan direset ke NIS / 1234\n` +
      `- Password, PIN, dan status aktif user akan disegarkan kembali.`;

    if (window.confirm(confirmMessage)) {
      if (onResetUserAccounts) {
        onResetUserAccounts();
      } else {
        const defaultUsers: UserAccount[] = [
          {
            id: 'usr-admin-1',
            username: 'admin',
            password: 'admin',
            name: 'Guru / Admin Pengelola',
            role: 'admin',
            status: 'active',
            createdAt: '2026-01-01T00:00:00.000Z'
          },
          ...students.map((st) => ({
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
        onImportUserAccounts(defaultUsers);
      }
      setDbStateMsg({ text: 'Seluruh data user login dan PIN siswa berhasil direset ke setelan awal!', success: true });
      setTimeout(() => setDbStateMsg(null), 4000);
    }
  };

  const handleExportUsersExcel = () => {
    const exportData = userAccounts.map((acc, index) => ({
      'No': index + 1,
      'Username / ID': acc.username,
      'Password / PIN': acc.password,
      'Nama Lengkap': acc.name,
      'Peran Akses': acc.role === 'admin' ? 'Administrator' : 'Siswa',
      'NIS Siswa': acc.studentNis || '-',
      'Status Akun': acc.status === 'active' ? 'Aktif' : 'Nonaktif',
      'Tanggal Dibuat': formatDate(acc.createdAt)
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daftar User Login');
    XLSX.writeFile(workbook, `Daftar_User_Login_SDN1Gemblengan_${new Date().toISOString().slice(0, 10)}.xlsx`);

    setDbStateMsg({ text: 'Berhasil mengunduh daftar akun user dalam format Excel!', success: true });
    setTimeout(() => setDbStateMsg(null), 3000);
  };

  const handleImportUsersFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            const validUsers: UserAccount[] = parsed.map((item, idx) => ({
              id: item.id || `usr-imp-${Date.now()}-${idx}`,
              username: String(item.username || item.NIS || `user_${idx}`).trim(),
              password: String(item.password || item.PIN || '1234').trim(),
              name: String(item.name || item.Nama || 'User Impor').trim(),
              role: (item.role === 'admin' || item.role === 'Administrator') ? 'admin' : 'student',
              studentId: item.studentId || undefined,
              studentNis: item.studentNis || item.NIS || undefined,
              status: item.status === 'inactive' || item.status === 'Nonaktif' ? 'inactive' : 'active',
              createdAt: item.createdAt || new Date().toISOString()
            }));

            onImportUserAccounts(validUsers);
            setDbStateMsg({ text: `Alhamdulillah! Berhasil mengimpor ${validUsers.length} akun user login dari file JSON.`, success: true });
            setTimeout(() => setDbStateMsg(null), 4000);
          } else {
            setDbStateMsg({ text: 'Format file JSON user tidak valid. Diharapkan array JSON.', success: false });
          }
        } catch (err) {
          setDbStateMsg({ text: 'Gagal membaca file JSON user.', success: false });
        }
      };
      reader.readAsText(file);
    } else {
      // Excel / CSV file
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

          if (jsonData.length === 0) {
            setDbStateMsg({ text: 'File Excel kosong atau format tidak sesuai.', success: false });
            return;
          }

          const newAccounts: UserAccount[] = jsonData.map((row, idx) => {
            const username = String(row['Username / ID'] || row['Username'] || row['NIS'] || row['nis'] || `user_${idx}`).trim();
            const password = String(row['Password / PIN'] || row['Password'] || row['PIN'] || '1234').trim();
            const name = String(row['Nama Lengkap'] || row['Nama'] || row['name'] || 'User Impor').trim();
            const rawRole = String(row['Peran Akses'] || row['Role'] || row['role'] || 'student').toLowerCase();
            const role = rawRole.includes('admin') ? 'admin' as const : 'student' as const;
            const nis = String(row['NIS Siswa'] || row['NIS'] || row['nis'] || '').trim();
            
            const matchedStudent = students.find(s => s.nis === nis);

            return {
              id: `usr-xl-${Date.now()}-${idx}`,
              username,
              password,
              name,
              role,
              studentId: matchedStudent?.id,
              studentNis: nis || matchedStudent?.nis,
              status: 'active' as const,
              createdAt: new Date().toISOString()
            };
          });

          onImportUserAccounts(newAccounts);
          setDbStateMsg({ text: `Alhamdulillah! Berhasil mengimpor ${newAccounts.length} akun user dari Excel.`, success: true });
          setTimeout(() => setDbStateMsg(null), 4000);
        } catch (err: any) {
          setDbStateMsg({ text: 'Gagal menguraikan file Excel user: ' + err.message, success: false });
        }
      };
      reader.readAsArrayBuffer(file);
    }

    if (e.target) e.target.value = '';
  };

  const handleAutoGenerateStudentAccounts = () => {
    const missingStudents = students.filter(
      s => !userAccounts.some(u => u.studentId === s.id || u.studentNis === s.nis || u.username === s.nis)
    );

    if (missingStudents.length === 0) {
      setDbStateMsg({ text: 'Semua siswa sudah memiliki akun login aktif di sistem!', success: true });
      setTimeout(() => setDbStateMsg(null), 3000);
      return;
    }

    const generatedUsers: UserAccount[] = missingStudents.map(st => ({
      id: `usr-gen-${st.id}`,
      username: st.nis,
      password: '1234',
      name: st.name,
      role: 'student' as const,
      studentId: st.id,
      studentNis: st.nis,
      status: 'active' as const,
      createdAt: new Date().toISOString()
    }));

    onImportUserAccounts(generatedUsers);
    setDbStateMsg({ 
      text: `Berhasil membuat ${generatedUsers.length} akun login baru untuk siswa secara otomatis dengan PIN default "1234".`, 
      success: true 
    });
    setTimeout(() => setDbStateMsg(null), 5000);
  };

  // Parser helper matching typical raw text separated by Comma, Semicolon or Tab
  const handleParseText = () => {
    if (!rawPasteText.trim()) {
      setDbStateMsg({ text: 'Mohon masukkan teks daftar siswa terlebih dahulu.', success: false });
      return;
    }

    const lines = rawPasteText.split('\n');
    const parsed: typeof parsedPreviewList = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return; // Skip blank lines

      // Clean typical CSV/tsv delimiters
      let parts = trimmed.split(/,|\t|;/).map(part => part.trim());

      // Skip header lines
      const firstPart = (parts[0] || '').toLowerCase();
      if (firstPart.includes('nama') || firstPart.includes('student') || firstPart.includes('nis')) {
        return;
      }

      // Detect if column order is [Nama, Kelas, NIS...] or [Nama, NIS, Kelas...] or [NIS, Nama...]
      let name = '';
      let nis = '';
      let parentName = '';
      let phone = '';
      let rawDeposit = '0';

      if (parts.length >= 2) {
        // Case 1: First column is NIS (numeric string length >= 4)
        if (/^\d{4,}$/.test(parts[0])) {
          nis = parts[0];
          name = parts[1] || '';
          // parts[2] could be class or parent
          if (parts[2] && !/^\d+$/.test(parts[2]) && parts[2].length <= 3) { // Grade '5' or '5A'
            parentName = parts[3] || '';
            phone = parts[4] || '';
            rawDeposit = parts[5] || '0';
          } else {
            parentName = parts[2] || '';
            phone = parts[3] || '';
            rawDeposit = parts[4] || '0';
          }
        } else {
          // Case 2: First column is Name
          name = parts[0];
          
          // Check if second column is NIS (digits >= 4) or Grade ('5', '5A')
          if (/^\d{4,}$/.test(parts[1])) {
            nis = parts[1];
            // parts[2] could be grade or parent
            if (parts[2] && parts[2].length <= 3) {
              parentName = parts[3] || '';
              phone = parts[4] || '';
              rawDeposit = parts[5] || '0';
            } else {
              parentName = parts[2] || '';
              phone = parts[3] || '';
              rawDeposit = parts[4] || '0';
            }
          } else {
            // Second column is Grade (e.g., '5')
            if (parts[2] && /^\d{4,}$/.test(parts[2])) {
              nis = parts[2];
              parentName = parts[3] || '';
              phone = parts[4] || '';
              rawDeposit = parts[5] || '0';
            } else {
              nis = parts[2] || `${new Date().getFullYear()}05${String(index + 1).padStart(3, '0')}`;
              parentName = parts[3] || '';
              phone = parts[4] || '';
              rawDeposit = parts[5] || '0';
            }
          }
        }
      }

      // Format Phone number
      if (phone.startsWith('8') && phone.length >= 9) {
        phone = '0' + phone;
      }

      // Grade resolution for single class 5
      const resolvedGrade: GradeClass = '5';

      // Convert deposit cleanly
      const cleanDepositString = rawDeposit.replace(/[Rp.\s-]/g, '');
      const initialDeposit = parseInt(cleanDepositString, 10) || 0;

      // Basic integrity rules check
      let isValid = true;
      let errorReason = '';

      if (!name) {
        isValid = false;
        errorReason = 'Nama kosong';
      } else if (!nis) {
        isValid = false;
        errorReason = 'NIS kosong';
      }

      // Check duplicate NIS in system or within preview
      const isDuplicateInApp = students.some(s => s.nis === nis);
      const isDuplicateInPreview = parsed.some(p => p.nis === nis);
      if (isDuplicateInApp) {
        isValid = false;
        errorReason = 'NIS sudah terdaftar di sistem';
      } else if (isDuplicateInPreview) {
        isValid = false;
        errorReason = 'NIS terduplikasi dalam daftar';
      }

      parsed.push({
        name,
        grade: resolvedGrade,
        nis,
        parentName,
        phone,
        initialDeposit,
        isValid,
        errorReason
      });
    });

    setParsedPreviewList(parsed);
    setIsParsed(true);
    setDbStateMsg({ text: `Berhasil menganalisis ${parsed.length} baris data! Silakan periksa tabel pratinjau di bawah.`, success: true });
    setTimeout(() => setDbStateMsg(null), 4000);
  };

  // Perform bulk installation of analyzed students list
  const handleExecuteImport = () => {
    const validImportItems = parsedPreviewList.filter(item => item.isValid);
    if (validImportItems.length === 0) {
      setDbStateMsg({ text: 'Tidak ada data siswa baru yang valid untuk diimpor!', success: false });
      return;
    }

    onBulkImportStudents(validImportItems);

    setDbStateMsg({ 
      text: `Alhamdulillah! Berhasil mengimpor massal ${validImportItems.length} siswa baru ke dalam database!`, 
      success: true 
    });
    
    // Clear inputs and previews
    setRawPasteText('');
    setParsedPreviewList([]);
    setIsParsed(false);
    setTimeout(() => setDbStateMsg(null), 6000);
  };

  // Download empty template for student import
  const handleDownloadTemplate = () => {
    try {
      const wb = XLSX.utils.book_new();
      const templateData = [
        {
          'NIS': '202601001',
          'Nama Siswa': 'Ahmad Rafli Hidayat',
          'Kelas': '5',
          'Nama Orang Tua': 'Hidayat Santoso',
          'No Telepon': '081234567812',
          'Setoran Awal': 50000
        },
        {
          'NIS': '202601002',
          'Nama Siswa': 'Siti Aminah Azzahra',
          'Kelas': '5',
          'Nama Orang Tua': 'Ahmad Fauzi',
          'No Telepon': '081398765431',
          'Setoran Awal': 25000
        }
      ];
      const ws = XLSX.utils.json_to_sheet(templateData);
      
      // Auto-fit column widths
      const maxLens = { NIS: 12, 'Nama Siswa': 25, 'Kelas': 8, 'Nama Orang Tua': 20, 'No Telepon': 15, 'Setoran Awal': 15 };
      ws['!cols'] = Object.values(maxLens).map(w => ({ wch: w }));

      XLSX.utils.book_append_sheet(wb, ws, 'Template Impor');
      XLSX.writeFile(wb, 'template-impor-siswa-kelas-5.xlsx');
      
      setDbStateMsg({ text: 'Template impor siswa Excel berhasil diunduh!', success: true });
      setTimeout(() => setDbStateMsg(null), 3000);
    } catch (e: any) {
      setDbStateMsg({ text: 'Gagal mengunduh template: ' + e.message, success: false });
    }
  };

  // Parser helper for student Excel file
  const handleExcelStudentImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const json: any[] = XLSX.utils.sheet_to_json(ws);

        if (json.length === 0) {
          throw new Error('File Excel kosong atau tidak terbaca.');
        }

        const parsed: typeof parsedPreviewList = [];

        json.forEach((row, index) => {
          const rowKeys = Object.keys(row);

          // Robust value getter with exact key match priority
          const getVal = (possibleKeys: string[]) => {
            // 1. Try exact match first
            for (const pk of possibleKeys) {
              const matchedKey = rowKeys.find(k => k.toLowerCase().replace(/[\s_.:-]/g, '') === pk);
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
                return row[matchedKey];
              }
            }
            // 2. Try substring match, excluding parent keys when looking for student name
            for (const pk of possibleKeys) {
              const matchedKey = rowKeys.find(k => {
                const norm = k.toLowerCase().replace(/[\s_.:-]/g, '');
                if ((pk === 'nama' || pk === 'student') && (norm.includes('orang') || norm.includes('wali') || norm.includes('ortu') || norm.includes('parent'))) {
                  return false;
                }
                return norm.includes(pk);
              });
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
                return row[matchedKey];
              }
            }
            return undefined;
          };

          const name = String(getVal(['namasiswa', 'namalengkap', 'namamurid', 'nama', 'studentname', 'student']) || row['Nama Siswa'] || row['Nama'] || '').trim();
          let nis = String(getVal(['nisn', 'nis', 'idnumber', 'nomorinduk']) || row['NIS'] || '').trim().replace(/\.0$/, '');
          const parentName = String(getVal(['namaorangtua', 'namaorang', 'namawali', 'namaortu', 'orangtua', 'wali', 'parentname', 'parent']) || row['Nama Orang Tua'] || '').trim();
          let phone = String(getVal(['notelepon', 'notelp', 'telepon', 'nohp', 'hp', 'phone', 'phonenumber', 'whatsapp']) || row['No Telepon'] || '').trim().replace(/\.0$/, '');
          const initialDeposit = Number(getVal(['setoranawal', 'saldoawal', 'saldo', 'deposit', 'initialdeposit', 'initial']) || row['Setoran Awal'] || 0);

          if (!name && !nis) return; // skip empty rows

          // Auto-generate NIS if missing
          if (!nis && name) {
            nis = `${new Date().getFullYear()}05${String(index + 1).padStart(3, '0')}`;
          }

          // Format phone number
          if (phone.startsWith('8') && phone.length >= 9) {
            phone = '0' + phone;
          }

          // Resolve Grade to single class 5
          const resolvedGrade: GradeClass = '5';

          let isValid = true;
          let errorReason = '';

          if (!name) {
            isValid = false;
            errorReason = 'Nama kosong';
          } else if (!nis) {
            isValid = false;
            errorReason = 'NIS kosong';
          }

          // Check duplicate NIS
          const isDuplicateInApp = students.some(s => s.nis === nis);
          const isDuplicateInPreview = parsed.some(p => p.nis === nis);
          if (isDuplicateInApp) {
            isValid = false;
            errorReason = 'NIS sudah terdaftar di sistem';
          } else if (isDuplicateInPreview) {
            isValid = false;
            errorReason = 'NIS terduplikasi dalam file';
          }

          parsed.push({
            name,
            grade: resolvedGrade,
            nis,
            parentName,
            phone,
            initialDeposit,
            isValid,
            errorReason
          });
        });

        if (parsed.length === 0) {
          throw new Error('Tidak ada baris siswa yang berhasil diuraikan. Periksa apakah header kolom cocok (NIS, Nama Siswa, Kelas, dll).');
        }

        setParsedPreviewList(parsed);
        setIsParsed(true);
        setDbStateMsg({ text: `Berhasil mengurai ${parsed.length} data siswa dari Excel! Silakan periksa tabel pratinjau di bawah.`, success: true });
        setTimeout(() => setDbStateMsg(null), 4000);
      } catch (err: any) {
        setDbStateMsg({ text: 'Gagal mengurai file Excel: ' + err.message, success: false });
        setTimeout(() => setDbStateMsg(null), 5000);
      }
    };
    reader.readAsArrayBuffer(file);
    if (e.target) e.target.value = '';
  };

  // System level download files Excel Backup (.xlsx)
  const handleExportSystemBackup = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Daftar Siswa
      const studentsExportData = students.map(s => ({
        'ID Siswa': s.id,
        'NIS': s.nis,
        'Nama Lengkap': s.name,
        'Kelas': s.grade,
        'Nama Wali Murid': s.parentName || '-',
        'No Handphone': s.phone || '-',
        'Saldo (Rp)': s.balance,
        'Tanggal Pendaftaran': s.createdAt
      }));
      const wsStudents = XLSX.utils.json_to_sheet(studentsExportData);
      XLSX.utils.book_append_sheet(wb, wsStudents, 'Daftar Siswa');

      // Sheet 2: Riwayat Transaksi
      const transactionsExportData = transactions.map(t => ({
        'ID Transaksi': t.id,
        'ID Siswa': t.studentId,
        'Nama Siswa': t.studentName,
        'Kelas': t.studentGrade,
        'Tipe Transaksi': t.type,
        'Jumlah (Rp)': t.amount,
        'Tanggal Transaksi': t.date,
        'Catatan': t.notes || '-',
        'Petugas Pencatat': t.recordedBy
      }));
      const wsTransactions = XLSX.utils.json_to_sheet(transactionsExportData);
      XLSX.utils.book_append_sheet(wb, wsTransactions, 'Riwayat Transaksi');

      const today = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `backup-tabungan-siswa-${today}.xlsx`);

      setDbStateMsg({ text: 'Seluruh database tabungan berhasil diekspor sebagai cadangan Excel (.xlsx)!', success: true });
      setTimeout(() => setDbStateMsg(null), 4000);
    } catch (e: any) {
      setDbStateMsg({ text: 'Gagal mengekspor cadangan Excel: ' + e.message, success: false });
    }
  };

  // Loader from Excel file restore system state
  const handleRestoreSystemBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Case-insensitive sheet search for "Daftar Siswa" and "Riwayat Transaksi"
        const findSheetName = (candidates: string[]) => {
          return workbook.SheetNames.find(sn => 
            candidates.some(c => sn.toLowerCase().replace(/[\s_.:-]/g, '').includes(c))
          );
        };

        const studentSheetName = findSheetName(['daftarsiswa', 'siswa', 'students']) || workbook.SheetNames[0];
        const txSheetName = findSheetName(['riwayattransaksi', 'transaksi', 'journal', 'transactions']) || workbook.SheetNames[1];

        if (!studentSheetName) {
          throw new Error('Berkas tidak memiliki sheet data siswa yang valid.');
        }

        // Parse Daftar Siswa
        const wsStudents = workbook.Sheets[studentSheetName];
        const rawStudentsJson: any[] = XLSX.utils.sheet_to_json(wsStudents);
        const importedStudents: Student[] = rawStudentsJson.map((row, index) => {
          const name = String(row['Nama Lengkap'] || row['Nama Siswa'] || row['Nama'] || '').trim();
          let nis = String(row['NIS'] || row['Nis'] || row['Nomor Induk'] || '').trim().replace(/\.0$/, '');
          const id = String(row['ID Siswa'] || row['ID'] || `s-restored-${Date.now()}-${index}`);
          const grade: GradeClass = '5';
          const parentName = String(row['Nama Wali Murid'] || row['Nama Orang Tua'] || row['Wali'] || '').trim();
          let phone = String(row['No Handphone'] || row['No Telepon'] || row['No. Telp'] || '').trim().replace(/\.0$/, '');
          if (phone.startsWith('8') && phone.length >= 9) phone = '0' + phone;
          const balance = Number(row['Saldo (Rp)'] || row['Saldo'] || row['Saldo Tabungan'] || 0);
          const createdAt = String(row['Tanggal Pendaftaran'] || row['Tanggal'] || new Date().toISOString());

          if (!nis && name) {
            nis = `${new Date().getFullYear()}05${String(index + 1).padStart(3, '0')}`;
          }

          return {
            id,
            nis,
            name,
            grade,
            parentName: parentName || undefined,
            phone: phone || undefined,
            balance,
            createdAt
          };
        }).filter(s => s.name && s.nis);

        // Parse Riwayat Transaksi (if available)
        let importedTransactions: Transaction[] = [];
        if (txSheetName && workbook.Sheets[txSheetName]) {
          const wsTransactions = workbook.Sheets[txSheetName];
          const rawTransactionsJson: any[] = XLSX.utils.sheet_to_json(wsTransactions);
          importedTransactions = rawTransactionsJson.map((row, index) => {
            const id = String(row['ID Transaksi'] || row['ID'] || `t-restored-${Date.now()}-${index}`);
            let studentId = String(row['ID Siswa'] || '').trim();
            const studentName = String(row['Nama Siswa'] || row['Nama'] || '').trim();

            // Match student ID if missing
            if (!studentId && studentName) {
              const matchedStudent = importedStudents.find(s => s.name.toLowerCase() === studentName.toLowerCase());
              if (matchedStudent) {
                studentId = matchedStudent.id;
              }
            }

            const typeStr = String(row['Tipe Transaksi'] || row['Tipe'] || row['Jenis Transaksi'] || 'SETOR').toUpperCase();
            const type: 'SETOR' | 'TARIK' = (typeStr.includes('TARIK') || typeStr.includes('DEBIT')) ? 'TARIK' : 'SETOR';
            const amount = Number(row['Jumlah (Rp)'] || row['Jumlah'] || row['Nominal (Rp)'] || row['Nominal'] || 0);
            const date = String(row['Tanggal Transaksi'] || row['Tanggal'] || new Date().toISOString());
            const notes = String(row['Catatan'] || row['Keterangan'] || '');
            const recordedBy = String(row['Petugas Pencatat'] || row['Petugas'] || 'Sistem');

            return {
              id,
              studentId: studentId || `s-gen-${index}`,
              studentName,
              studentGrade: '5' as GradeClass,
              type,
              amount,
              date,
              notes,
              recordedBy
            };
          }).filter(t => t.amount > 0 && t.studentName);
        }

        const confirmed = window.confirm(
          `Apakah Anda yakin ingin memulihkan cadangan Excel ini?\n\n` +
          `File Cadangan mengandung:\n` +
          `- ${importedStudents.length} Orang Murid\n` +
          `- ${importedTransactions.length} Jurnal Buku Tabungan\n\n` +
          `PERINGATAN: Langkah ini akan menolak dan menghapus seluruh data tabungan saat ini!`
        );

        if (confirmed) {
          onImportData(importedStudents, importedTransactions);
          setDbStateMsg({ text: 'Database tabungan berhasil dipulihkan dari file Excel!', success: true });
          setTimeout(() => setDbStateMsg(null), 5000);
        }
      } catch (err: any) {
        setDbStateMsg({ text: 'Gagal memulihkan file Excel: ' + err.message, success: false });
        setTimeout(() => setDbStateMsg(null), 5000);
      }
    };
    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Safe Authorized Wipe Database Clean State
  const handleExecuteWipeDatabase = () => {
    if (resetCodeInput.toUpperCase() === 'RESET') {
      onClearDatabase();
      setResetCodeInput('');
      setShowConfirmResetPanel(false);
      setDbStateMsg({ text: 'Seluruh database tabungan berhasil dibersihkan ke setelan awal pabrikan.', success: true });
      setTimeout(() => setDbStateMsg(null), 5000);
    } else {
      setDbStateMsg({ text: 'Kata kunci konfirmasi salah! Ketik kata "RESET" dengan benar.', success: false });
      setTimeout(() => setDbStateMsg(null), 4000);
    }
  };

  // Filtered User Accounts list
  const filteredUsers = userAccounts.filter(acc => {
    const matchesRole = userFilterRole === 'ALL' || acc.role === userFilterRole;
    const matchesQuery = !userSearchQuery.trim() || 
      acc.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      acc.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (acc.studentNis && acc.studentNis.includes(userSearchQuery));
    return matchesRole && matchesQuery;
  });

  return (
    <div className="space-y-6 animate-fade-in" id="settings-management-container">
      
      {/* Banner Notifikasi Floating */}
      <AnimatePresence>
        {dbStateMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-3 text-sm z-50 relative ${
              dbStateMsg.success 
                ? 'bg-emerald-100 border-slate-900 text-emerald-950' 
                : 'bg-rose-100 border-slate-900 text-rose-950'
            }`}
            id="settings-state-alert"
          >
            {dbStateMsg.success ? (
              <CheckCircle2 size={20} className="text-emerald-800 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle size={20} className="text-rose-800 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{dbStateMsg.success ? 'Berhasil!' : 'Perhatian/Gagal'}</p>
              <p className="text-xs opacity-90 mt-0.5">{dbStateMsg.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Section Tabs */}
      <div className="bg-white p-2 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0284c7] flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveSettingSection('USERS')}
          className={`py-2.5 px-4 rounded-xl border-2 font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeSettingSection === 'USERS'
              ? 'bg-amber-400 text-slate-900 border-slate-900 shadow-[2px_2px_0px_0px_#0284c7]'
              : 'bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100'
          }`}
        >
          <UserCog size={16} />
          <span>Kelola User Login</span>
          <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md text-[10px] font-mono">
            {userAccounts.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingSection('IMPORT_STUDENTS')}
          className={`py-2.5 px-4 rounded-xl border-2 font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeSettingSection === 'IMPORT_STUDENTS'
              ? 'bg-indigo-600 text-white border-slate-900 shadow-[2px_2px_0px_0px_#0284c7]'
              : 'bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100'
          }`}
        >
          <Users size={16} />
          <span>Impor Massal Siswa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSettingSection('BACKUP')}
          className={`py-2.5 px-4 rounded-xl border-2 font-black text-xs transition-all flex items-center gap-2 cursor-pointer ${
            activeSettingSection === 'BACKUP'
              ? 'bg-sky-500 text-white border-slate-900 shadow-[2px_2px_0px_0px_#0284c7]'
              : 'bg-slate-50 text-slate-600 border-transparent hover:bg-slate-100'
          }`}
        >
          <Database size={16} />
          <span>Pencadangan & Cloud</span>
        </button>
      </div>

      {/* SECTION 1: MANAJEMEN USER LOGIN */}
      {activeSettingSection === 'USERS' && (
        <div className="space-y-6">
          {/* User Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0284c7]">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Akun Register</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{userAccounts.length}</span>
              <span className="text-[10px] text-slate-500 font-bold mt-1 block">Akun aktif terdaftar</span>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#d97706]">
              <span className="text-[10px] font-extrabold uppercase text-amber-700 block flex items-center gap-1">
                <ShieldCheck size={12} /> Admin / Guru
              </span>
              <span className="text-2xl font-black text-amber-950 font-mono mt-1 block">
                {userAccounts.filter(u => u.role === 'admin').length}
              </span>
              <span className="text-[10px] text-amber-800 font-bold mt-1 block">Akses Administrator</span>
            </div>
            <div className="bg-sky-50 p-4 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#0284c7]">
              <span className="text-[10px] font-extrabold uppercase text-sky-700 block flex items-center gap-1">
                <UserCheck size={12} /> Akun Siswa
              </span>
              <span className="text-2xl font-black text-sky-950 font-mono mt-1 block">
                {userAccounts.filter(u => u.role === 'student').length}
              </span>
              <span className="text-[10px] text-sky-800 font-bold mt-1 block">Portal Siswa Kelas 5</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-900 shadow-[3px_3px_0px_0px_#64748b]">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 block flex items-center gap-1">
                <UserX size={12} /> Status Nonaktif
              </span>
              <span className="text-2xl font-black text-slate-700 font-mono mt-1 block">
                {userAccounts.filter(u => u.status === 'inactive').length}
              </span>
              <span className="text-[10px] text-slate-500 font-bold mt-1 block">Dikunci sementara</span>
            </div>
          </div>

          {/* User Controls Action Bar */}
          <div className="bg-white p-4 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_0px_#0284c7] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Cari username, nama, atau NIS..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl font-bold text-xs focus:outline-none focus:bg-white focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-50 border-2 border-slate-900 rounded-xl px-2.5 py-1.5">
                <Filter size={14} className="text-slate-500" />
                <select
                  value={userFilterRole}
                  onChange={(e) => setUserFilterRole(e.target.value as any)}
                  className="bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Semua Peran</option>
                  <option value="admin">Administrator</option>
                  <option value="student">Akses Siswa</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenAddUserModal}
                className="py-2 px-3.5 bg-amber-400 hover:bg-amber-300 text-slate-900 border-2 border-slate-900 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#0284c7] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              >
                <UserPlus size={15} />
                <span>Tambah User</span>
              </button>

              <button
                type="button"
                onClick={handleExportUsersExcel}
                className="py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-white border-2 border-slate-900 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#0284c7] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                title="Ekspor daftar user ke file Excel"
              >
                <FileDown size={15} />
                <span>Ekspor Excel</span>
              </button>

              <button
                type="button"
                onClick={() => userInputRef.current?.click()}
                className="py-2 px-3.5 bg-sky-500 hover:bg-sky-400 text-white border-2 border-slate-900 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#0284c7] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                title="Impor user dari Excel (.xlsx) atau JSON"
              >
                <FileUp size={15} />
                <span>Impor User</span>
              </button>

              <button
                type="button"
                onClick={handleAutoGenerateStudentAccounts}
                className="py-2 px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-2 border-slate-900 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#0284c7] cursor-pointer"
                title="Buat PIN login otomatis untuk semua siswa yang belum memiliki akun"
              >
                <Sparkles size={15} className="text-amber-500" />
                <span>Auto-Buat Akun Siswa</span>
              </button>

              <button
                type="button"
                onClick={handleResetAllUsers}
                className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border-2 border-slate-900 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#0284c7] cursor-pointer"
                title="Reset ulang seluruh akun user login dan PIN ke setelan default"
              >
                <RefreshCw size={15} className="text-rose-600" />
                <span>Reset Data User</span>
              </button>

              <input
                type="file"
                ref={userInputRef}
                className="hidden"
                accept=".xlsx, .xls, .json, .csv"
                onChange={handleImportUsersFile}
              />
            </div>
          </div>

          {/* User Accounts Table */}
          <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_#0284c7] overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-black text-sm flex items-center gap-2">
                <UserCog size={18} className="text-amber-400" />
                Daftar Akun User Login SD Negeri 1 Gemblengan
              </h3>
              <span className="text-xs font-bold text-amber-300 font-mono">
                {filteredUsers.length} Akun Ditampilkan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-900 font-black text-slate-800">
                    <th className="p-3">Username / ID Login</th>
                    <th className="p-3">Nama Lengkap</th>
                    <th className="p-3">Peran Akses</th>
                    <th className="p-3">Password / PIN</th>
                    <th className="p-3">Siswa Terhubung</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-bold text-slate-800">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                        Tidak ada data akun user yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((acc) => {
                      const isPassVisible = !!showPasswords[acc.id];
                      return (
                        <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono text-slate-900 font-extrabold">
                            <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-300">
                              {acc.username}
                            </span>
                          </td>
                          <td className="p-3 text-slate-900">{acc.name}</td>
                          <td className="p-3">
                            {acc.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-400 text-amber-950 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                                <ShieldCheck size={12} className="text-amber-600" /> Administrator
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-sky-100 border border-sky-400 text-sky-950 px-2.5 py-0.5 rounded-full text-[10px] font-black">
                                <UserCheck size={12} className="text-sky-600" /> Siswa Kelas 5
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 min-w-[60px] inline-block text-center text-slate-900 font-black">
                                {isPassVisible ? acc.password : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, [acc.id]: !prev[acc.id] }))}
                                className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200"
                                title={isPassVisible ? 'Sembunyikan' : 'Tampilkan PIN'}
                              >
                                {isPassVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-slate-600">
                            {acc.studentNis ? (
                              <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                                NIS: {acc.studentNis}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">-</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(acc)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black border transition-all cursor-pointer ${
                                acc.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-400 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-900 border-rose-400 hover:bg-rose-200'
                              }`}
                              title="Klik untuk mengubah status aktif/nonaktif"
                            >
                              {acc.status === 'active' ? '● Aktif' : '○ Nonaktif'}
                            </button>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleQuickResetSingleUserPin(acc)}
                                className="p-1.5 bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-400 rounded-lg font-bold transition-all"
                                title={`Reset PIN / Password ke default (${acc.role === 'admin' ? 'admin' : '1234'})`}
                              >
                                <Key size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditUserModal(acc)}
                                className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-400 rounded-lg font-bold transition-all"
                                title="Edit Akun User"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUser(acc)}
                                className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-400 rounded-lg font-bold transition-all"
                                title="Hapus Akun User"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FORM TAMBAH / EDIT USER */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-3xl border-4 border-slate-900 shadow-[8px_8px_0px_0px_#0284c7] overflow-hidden my-8"
            >
              <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b-4 border-slate-900">
                <div className="flex items-center gap-2">
                  <UserCog className="text-amber-400" size={20} />
                  <h3 className="font-black text-base">
                    {editingUser ? 'Edit Akun User Login' : 'Tambah Akun User Baru'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveUserForm} className="p-6 space-y-4">
                {userFormError && (
                  <div className="bg-rose-50 border-2 border-rose-300 p-3 rounded-2xl flex items-center gap-2 text-xs text-rose-800 font-bold">
                    <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
                    <span>{userFormError}</span>
                  </div>
                )}

                {/* Peran Akses */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                    Peran / Hak Akses (Role)
                  </label>
                  <div className="grid grid-cols-2 gap-2 font-bold text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setUserFormRole('admin');
                        if (!userFormUsername) setUserFormUsername('admin');
                      }}
                      className={`py-2.5 px-3 rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all ${
                        userFormRole === 'admin'
                          ? 'bg-amber-400 border-slate-900 text-slate-900 font-black shadow-[2px_2px_0px_0px_#0284c7]'
                          : 'bg-slate-50 border-slate-300 text-slate-600'
                      }`}
                    >
                      <ShieldCheck size={16} /> Admin / Guru
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserFormRole('student')}
                      className={`py-2.5 px-3 rounded-xl border-2 flex items-center justify-center gap-1.5 transition-all ${
                        userFormRole === 'student'
                          ? 'bg-sky-400 border-slate-900 text-slate-900 font-black shadow-[2px_2px_0px_0px_#0284c7]'
                          : 'bg-slate-50 border-slate-300 text-slate-600'
                      }`}
                    >
                      <UserCheck size={16} /> Siswa Kelas 5
                    </button>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                    Username / NIS Login *
                  </label>
                  <input
                    type="text"
                    value={userFormUsername}
                    onChange={(e) => setUserFormUsername(e.target.value)}
                    placeholder={userFormRole === 'admin' ? 'Contoh: admin' : 'Masukkan NIS / Username Siswa...'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Password / PIN */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-black uppercase text-slate-700">
                      Password / PIN Login *
                    </label>
                    <button
                      type="button"
                      onClick={() => setUserFormPassword(userFormRole === 'admin' ? 'admin' : '1234')}
                      className="text-[10px] font-extrabold text-sky-700 hover:text-sky-900 bg-sky-100 hover:bg-sky-200 px-2 py-0.5 rounded-md border border-sky-300 transition-all cursor-pointer"
                    >
                      Reset Default ({userFormRole === 'admin' ? 'admin' : '1234'})
                    </button>
                  </div>
                  <input
                    type="text"
                    value={userFormPassword}
                    onChange={(e) => setUserFormPassword(e.target.value)}
                    placeholder="Masukkan password / PIN..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-amber-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-500 font-medium mt-1">
                    * Password admin default: <code className="bg-slate-100 px-1 rounded font-mono font-bold text-slate-800">admin</code> | PIN siswa default: <code className="bg-slate-100 px-1 rounded font-mono font-bold text-slate-800">1234</code>
                  </p>
                </div>

                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                    Nama Lengkap Pemilik Akun *
                  </label>
                  <input
                    type="text"
                    value={userFormName}
                    onChange={(e) => setUserFormName(e.target.value)}
                    placeholder="Contoh: Pak Guru Agus / Ahmad Rafli..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-amber-500"
                  />
                </div>

                {/* Linking Student if Role === 'student' */}
                {userFormRole === 'student' && (
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                      Hubungkan dengan Siswa (Opsional)
                    </label>
                    <select
                      value={userFormStudentId}
                      onChange={(e) => {
                        setUserFormStudentId(e.target.value);
                        const sel = students.find(s => s.id === e.target.value);
                        if (sel) {
                          if (!userFormName) setUserFormName(sel.name);
                          if (!userFormUsername) setUserFormUsername(sel.nis);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-sky-500"
                    >
                      <option value="">-- Pilih Siswa Kelas 5 --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} (NIS: {s.nis})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Status */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={userFormStatus}
                    onChange={(e) => setUserFormStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl font-bold text-slate-900 text-sm focus:outline-none focus:bg-white focus:border-amber-500"
                  >
                    <option value="active">Aktif (Dapat Login)</option>
                    <option value="inactive">Nonaktif (Dikunci Sementara)</option>
                  </select>
                </div>

                <div className="pt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border-2 border-slate-900 rounded-2xl font-black text-xs cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 border-2 border-slate-900 rounded-2xl font-black text-xs shadow-[3px_3px_0px_0px_#0284c7] cursor-pointer"
                  >
                    Simpan User
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SECTION 2 & 3: IMPOR SISWA MASSAL / BACKUP DATABASE */}
      {(activeSettingSection === 'IMPORT_STUDENTS' || activeSettingSection === 'BACKUP') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PANEL UTAMA: MASUKKAN DATA ANAK MASSAL (IMPORT) */}
          <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_#6366f1] lg:col-span-2 space-y-6 flex flex-col justify-between" id="bulk-import-card">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg inline-flex border border-indigo-200">
                  <Users size={16} />
                </span>
                <h2 className="text-lg font-black text-slate-950">Impor Data Siswa Secara Massal</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Bapak/Ibu Guru tidak perlu memasukkan nama siswa satu per satu! Unggah file roster Excel kelas Anda atau tempel salinan data di sini.
              </p>

              {/* Tab Switcher */}
              <div className="flex border-b border-slate-200 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setImportMode('EXCEL');
                    setIsParsed(false);
                    setParsedPreviewList([]);
                  }}
                  className={`py-2 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    importMode === 'EXCEL'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileSpreadsheet size={14} /> Unggah File Excel (.xlsx / .xls)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setImportMode('TEXT');
                    setIsParsed(false);
                    setParsedPreviewList([]);
                  }}
                  className={`py-2 px-4 text-xs font-black border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    importMode === 'TEXT'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-xl'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clipboard size={14} /> Tempel Teks Manual (CSV)
                </button>
              </div>

              {importMode === 'EXCEL' ? (
                <div className="space-y-4 mt-4 animate-fade-in">
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 text-xs text-slate-750 space-y-3">
                    <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                      <Info size={14} className="stroke-[2.5]" /> Petunjuk Impor Excel:
                    </p>
                    <p className="leading-relaxed text-xs">
                      Sistem akan mencocokkan kolom secara otomatis. Pastikan file Excel Anda minimal berisi kolom <strong>NIS</strong>, <strong>Nama Siswa</strong>, dan <strong>Kelas</strong> (5A atau 5B). Klik tombol di bawah ini untuk mengunduh template Excel siap pakai.
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="px-4 py-2 bg-white hover:bg-slate-100 text-indigo-700 font-bold border border-indigo-300 rounded-lg shadow-sm transition-all text-[11px] cursor-pointer flex items-center gap-1.5"
                    >
                      <Download size={12} className="stroke-[2.5]" /> Unduh Template Impor Excel (.xlsx)
                    </button>
                  </div>

                  <div 
                    onClick={() => studentExcelInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30 p-8 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group shadow-sm"
                  >
                    <span className="p-3 bg-white text-indigo-600 rounded-full border border-slate-250 group-hover:scale-105 transition-transform shadow-inner">
                      <FileSpreadsheet size={24} />
                    </span>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">Klik untuk memilih atau jatuhkan file Excel Anda</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">Format dokumen yang didukung: .xlsx atau .xls</p>
                    </div>
                  </div>

                  <input 
                    type="file"
                    ref={studentExcelInputRef}
                    className="hidden"
                    accept=".xlsx, .xls"
                    onChange={handleExcelStudentImport}
                  />
                </div>
              ) : (
                <div className="space-y-4 mt-4 animate-fade-in">
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-slate-700 space-y-2">
                    <p className="font-bold text-amber-900 flex items-center gap-1.5 leading-none">
                      <Info size={14} className="stroke-[2.5]" /> Format Penulisan Teks:
                    </p>
                    <p className="font-mono bg-white p-2.5 rounded border border-amber-200 font-bold overflow-x-auto text-[11px]">
                      Nama Siswa, Kelas, NIS, Nama Wali Murid, No Handphone, Saldo Awal (Opsional)
                    </p>
                    <div className="space-y-1 mt-2 pl-1 leading-normal text-slate-600 font-medium">
                      <p>💡 <em>Contoh:</em> <code className="font-mono text-indigo-700 font-bold bg-white px-1 py-0.2 rounded">Andika Saputra, 5, 2026101, Herman, 081234, 50000</code></p>
                      <p>💡 Gunakan tanda koma (,), titik koma (;), atau tombol tab sebagai pemisah antar kolom siswa Anda.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">
                      Salin & Tempel Roster Kelas Di Sini
                    </label>
                    <textarea
                      value={rawPasteText}
                      onChange={(e) => {
                        setRawPasteText(e.target.value);
                        setIsParsed(false);
                      }}
                      rows={6}
                      placeholder="Andi Wijaya, 5, 2026101, Herman, 08129999, 10000&#10;Siti Aminah, 5, 2026102, Bambang, 08138888, 5000"
                      className="w-full bg-slate-50 p-4 border-2 border-slate-900 rounded-xl text-xs font-mono font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white tracking-wide transition-all shadow-[2px_2px_0px_0px_#000]"
                      id="raw-import-students-textarea"
                    />
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleParseText}
                      className="px-5 py-3 bg-white hover:bg-amber-100 text-slate-900 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                      id="parse-import-text-btn"
                    >
                      <RefreshCw size={14} className="stroke-[2.5]" /> Analisis Struktur Data Teks
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-4 pt-1">
              {isParsed && parsedPreviewList.length > 0 && (
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#047857] hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#047857] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                  id="execute-import-students-btn"
                >
                  <Check size={14} className="stroke-[3]" /> Simpan Hasil Impor ({parsedPreviewList.filter(p => p.isValid).length} Siswa Baru)
                </button>
              )}
            </div>
          </div>

          {/* PANEL SAMPING: CADANGAN & PEMILIHAN (BACKUP & RESTORE) */}
          <div className="space-y-6 lg:col-span-1" id="backup-utilities-column">
            
            <div className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_#f59e0b] space-y-5" id="backup-menu-card">
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg inline-flex border border-amber-200">
                  <Database size={16} />
                </span>
                <h2 className="text-lg font-black text-slate-950">Cadangkan / Ekspor Data</h2>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Disarankan untuk mencadangkan data tabungan secara berkala. Seluruh pembukuan tabungan saat ini akan diunduh sebagai file backup Excel (.xlsx) tunggal yang dapat disimpan aman di komputer Anda.
              </p>

              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleExportSystemBackup}
                  className="w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                  id="btn-major-export-backup"
                  title="Download data tabungan saat ini sebagai file Excel (.xlsx)"
                >
                  <Download size={15} className="stroke-[2.5]" /> Unduh File Cadangan (.XLSX)
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                  id="btn-major-import-restore"
                  title="Muat data cadangan Excel untuk memulihkan tabungan"
                >
                  <Upload size={15} className="stroke-[2.5]" /> Pulihkan Cadangan dari Excel
                </button>
                
                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".xlsx, .xls"
                  onChange={handleRestoreSystemBackup}
                />
              </div>
            </div>

            {/* DANGER AREA: DELETE ALL DATA */}
            <div className="bg-rose-50 p-6 rounded-2xl border-2 border-rose-900 shadow-[5px_5px_0px_0px_#e11d48] space-y-4" id="danger-wipe-card">
              <div className="flex items-center gap-2 mb-1">
                <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg inline-flex border border-rose-200">
                  <Trash2 size={16} />
                </span>
                <h2 className="text-lg font-black text-rose-950">Zona Bahaya (Risiko Tinggi)</h2>
              </div>
              <p className="text-xs text-rose-800 font-semibold leading-relaxed">
                Tindakan ini akan menghapus <strong>SELURUH data siswa dan semua riwayat transaksinya</strong> secara permanen dari peranti ini. Pastikan Anda telah mengunduh file cadangan Anda!
              </p>

              {!showConfirmResetPanel ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmResetPanel(true)}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_0px_#000] hover:-translate-y-0.5 active:translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
                  id="show-wipe-authorizer-panel"
                >
                  <Trash2 size={14} className="stroke-[2.5]" /> Hapus Seluruh Database
                </button>
              ) : (
                <div className="bg-white p-4 border border-rose-250 rounded-xl space-y-3 animate-fade-in" id="confirm-reset-sub-panel">
                  <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest leading-none flex items-center gap-1">
                    <AlertTriangle size={12} /> Ketik "RESET" Untuk Melanjutkan:
                  </p>
                  <input
                    type="text"
                    value={resetCodeInput}
                    onChange={(e) => setResetCodeInput(e.target.value)}
                    placeholder="Ketik RESET"
                    className="w-full px-3 py-2 text-xs font-black uppercase text-center border-2 border-slate-900 rounded-lg bg-rose-50/55 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    id="reset-state-safety-code"
                  />
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowConfirmResetPanel(false);
                        setResetCodeInput('');
                      }}
                      className="py-1.5 bg-slate-100 border border-slate-350 text-slate-800 text-[10px] font-black rounded-lg cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteWipeDatabase}
                      className="py-1.5 bg-rose-600 font-black text-white text-[10px] rounded-lg border border-rose-950 cursor-pointer"
                    >
                      Ya, Bersihkan!
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* PRATINJAU TABEL PRATINJAU IMPOR (ONLY IF ANALYZED DATA EXISTS & IN IMPORT_STUDENTS SECTION) */}
      <AnimatePresence>
        {activeSettingSection === 'IMPORT_STUDENTS' && isParsed && parsedPreviewList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-white p-6 rounded-2xl border-2 border-slate-900 shadow-[5px_5px_0px_0px_#10b981] space-y-4"
            id="parsed-rows-preview-block"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-md font-extrabold text-slate-900 flex items-center gap-1.5">
                  <FileCheck2 size={18} className="text-emerald-600 stroke-[2.5]" /> Pratinjau Baris Hasil Analisis Roster
                </h3>
                <p className="text-xs text-slate-500 font-medium">Bapak/Ibu Guru silakan meneliti baris di bawah sebelum mengonfirmasi penyimpanan ke dalam database.</p>
              </div>
              <div className="flex gap-2 text-[10px] font-black text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg w-fit">
                <span>Total Diurai: {parsedPreviewList.length}</span>
                <span>•</span>
                <span className="text-emerald-700">Valid: {parsedPreviewList.filter(p => p.isValid).length}</span>
                <span>•</span>
                <span className="text-rose-700">Gagal: {parsedPreviewList.filter(p => !p.isValid).length}</span>
              </div>
            </div>

            {/* Preview table */}
            <div className="overflow-x-auto max-h-[300px] border border-slate-200 rounded-xl shadow-inner">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-55 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 sticky top-0 bg-white">
                    <th className="p-3">Nama</th>
                    <th className="p-3">NIS</th>
                    <th className="p-3">Komparasi Kelas</th>
                    <th className="p-3">Wali Murid</th>
                    <th className="p-3">No. Telp</th>
                    <th className="p-3 text-right">Saldo Awal (Dana Masuk)</th>
                    <th className="p-3 text-center">Analisis Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-750">
                  {parsedPreviewList.map((item, index) => (
                    <tr 
                      key={index}
                      className={item.isValid ? `hover:bg-slate-50/55` : `bg-rose-50/30 hover:bg-rose-50/50`}
                    >
                      <td className="p-3 font-bold text-slate-900">{item.name || '---'}</td>
                      <td className="p-3 font-mono text-slate-655 text-slate-500 font-bold">{item.nis || '---'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md font-black bg-indigo-50 border border-indigo-200 text-indigo-700">
                          Kelas {item.grade}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{item.parentName || '-'}</td>
                      <td className="p-3 text-slate-600">{item.phone || '-'}</td>
                      <td className="p-3 font-mono font-bold text-slate-900 text-right">
                        {item.initialDeposit > 0 ? formatCurrency(item.initialDeposit) : '-'}
                      </td>
                      <td className="p-3 text-center">
                        {item.isValid ? (
                          <span className="inline-flex items-center gap-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 font-black text-[9px] px-2 py-0.5 rounded-full">
                            <Check size={10} className="stroke-[3]" /> Siap Impor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 bg-rose-100 border border-rose-300 text-rose-800 font-black text-[9px] px-2 py-0.5 rounded-full" title={item.errorReason}>
                            <AlertTriangle size={10} className="stroke-[3]" /> Ganti NIS / Duplikat ({item.errorReason})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
