import { GradeClass } from './types';

/**
 * Formats a number into Indonesian Rupiah (IDR) currency format.
 * Example: 50000 -> "Rp 50.000"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats an ISO date string into standard Indonesian format.
 * Example: "2026-06-09T03:45:15Z" -> "9 Juni 2026" or with time "9 Juni 2026, 10:45 WIB"
 */
export function formatDate(dateString: string, includeTime: boolean = false): string {
  try {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    let formatted = `${day} ${month} ${year}`;
    
    if (includeTime) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      formatted += `, ${hours}:${minutes} WIB`;
    }
    
    return formatted;
  } catch (error) {
    return dateString;
  }
}

/**
 * Returns Indonesian Month name based on Month index (0-11) or "YYYY-MM" string.
 */
export function getIndonesianMonthYear(monthYearString: string): string {
  // input form: "2026-06"
  const [yearStr, monthStr] = monthYearString.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const year = parseInt(yearStr, 10);
  
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  if (monthIdx >= 0 && monthIdx <= 11) {
    return `${months[monthIdx]} ${year}`;
  }
  return monthYearString;
}

/**
 * Assigns an elegant, school-friendly themed color badge configuration for classes 1-6
 */
export function getClassBadgeStyle(grade: GradeClass): { bg: string; text: string; border: string } {
  const num = grade.charAt(0);
  switch (num) {
    case '1':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case '2':
      return { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' };
    case '3':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' };
    case '4':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case '5':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case '6':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  }
}

/**
 * Generates a unique secure receipt ID
 */
export function generateReceiptNumber(type: 'SETOR' | 'TARIK', index: number = 1): string {
  const prefix = type === 'SETOR' ? 'STR' : 'TRK';
  const today = new Date();
  const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
  const rNum = String(index).padStart(4, '0');
  return `${prefix}-${yyyymmdd}-${rNum}`;
}
