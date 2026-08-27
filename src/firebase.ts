import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch, 
  getDocs,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { Student, Transaction, UserAccount, StudentFee } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with ignoreUndefinedProperties setting
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true
}, firebaseConfig.firestoreDatabaseId || '(default)');

// Firestore Collection references
export const studentsColRef = collection(db, 'students');
export const transactionsColRef = collection(db, 'transactions');
export const usersColRef = collection(db, 'userAccounts');
export const studentFeesColRef = collection(db, 'studentFees');

/**
 * Sanitizes objects to remove undefined properties before saving to Firestore
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      clean[key] = val;
    }
  });
  return clean;
}

/**
 * Saves a single student to Firestore
 */
export async function saveStudentToCloud(student: Student) {
  try {
    const studentDocRef = doc(db, 'students', student.id);
    await setDoc(studentDocRef, sanitizeForFirestore(student));
  } catch (error) {
    console.error('Error saving student to cloud:', error);
    throw error;
  }
}

/**
 * Deletes a single student and all their transactions from Firestore
 */
export async function deleteStudentFromCloud(studentId: string) {
  try {
    const studentDocRef = doc(db, 'students', studentId);

    // Fetch and collect all transactions associated with this student
    const q = query(transactionsColRef);
    const querySnapshot = await getDocs(q);
    
    const refsToDelete = [
      studentDocRef,
      ...querySnapshot.docs
        .filter((docSnap) => (docSnap.data() as Transaction).studentId === studentId)
        .map((docSnap) => docSnap.ref)
    ];

    // Batch delete in chunks of 400 (Firestore max batch is 500)
    for (let i = 0; i < refsToDelete.length; i += 400) {
      const chunk = refsToDelete.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
  } catch (error) {
    console.error('Error deleting student from cloud:', error);
    throw error;
  }
}

/**
 * Saves a single transaction to Firestore
 */
export async function saveTransactionToCloud(transaction: Transaction) {
  try {
    const transactionDocRef = doc(db, 'transactions', transaction.id);
    await setDoc(transactionDocRef, sanitizeForFirestore(transaction));
  } catch (error) {
    console.error('Error saving transaction to cloud:', error);
    throw error;
  }
}

/**
 * Deletes a single transaction from Firestore
 */
export async function deleteTransactionFromCloud(transactionId: string) {
  try {
    const transactionDocRef = doc(db, 'transactions', transactionId);
    await deleteDoc(transactionDocRef);
  } catch (error) {
    console.error('Error deleting transaction from cloud:', error);
    throw error;
  }
}

/**
 * Performs a batch upload of multiple students and transactions
 * Useful for first-time seed migrations or restoration from JSON/Excel backup
 */
export async function uploadBulkToCloud(students: Student[], transactions: Transaction[]) {
  try {
    const batchSize = 400;
    
    // Upload students in chunks
    for (let i = 0; i < students.length; i += batchSize) {
      const chunk = students.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((student) => {
        const docRef = doc(db, 'students', student.id);
        batch.set(docRef, sanitizeForFirestore(student));
      });
      await batch.commit();
    }

    // Upload transactions in chunks
    for (let i = 0; i < transactions.length; i += batchSize) {
      const chunk = transactions.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((tx) => {
        const docRef = doc(db, 'transactions', tx.id);
        batch.set(docRef, sanitizeForFirestore(tx));
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error uploading bulk to cloud:', error);
    throw error;
  }
}

/**
 * Deletes all documents in both collections
 * Acts as secure Wipe / Clear Database utility
 */
export async function clearAllCloudDatabase() {
  try {
    // Delete students in chunks
    const studentsSnapshot = await getDocs(studentsColRef);
    const studentDocs = studentsSnapshot.docs;
    for (let i = 0; i < studentDocs.length; i += 400) {
      const chunk = studentDocs.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
    }

    // Delete transactions in chunks
    const transactionsSnapshot = await getDocs(transactionsColRef);
    const txDocs = transactionsSnapshot.docs;
    for (let i = 0; i < txDocs.length; i += 400) {
      const chunk = txDocs.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();
    }
  } catch (error) {
    console.error('Error clearing database from cloud:', error);
    throw error;
  }
}

/**
 * Saves a single user account to Firestore
 */
export async function saveUserAccountToCloud(user: UserAccount) {
  try {
    const userDocRef = doc(db, 'userAccounts', user.id);
    await setDoc(userDocRef, sanitizeForFirestore(user));
  } catch (error) {
    console.error('Error saving user account to cloud:', error);
    throw error;
  }
}

/**
 * Deletes a user account from Firestore
 */
export async function deleteUserAccountFromCloud(userId: string) {
  try {
    const userDocRef = doc(db, 'userAccounts', userId);
    await deleteDoc(userDocRef);
  } catch (error) {
    console.error('Error deleting user account from cloud:', error);
    throw error;
  }
}

/**
 * Performs a batch upload of user accounts
 */
export async function uploadBulkUsersToCloud(users: UserAccount[]) {
  try {
    const batchSize = 400;
    for (let i = 0; i < users.length; i += batchSize) {
      const chunk = users.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((u) => {
        const docRef = doc(db, 'userAccounts', u.id);
        batch.set(docRef, sanitizeForFirestore(u));
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error uploading bulk user accounts to cloud:', error);
    throw error;
  }
}

/**
 * Saves a single student fee to Firestore
 */
export async function saveStudentFeeToCloud(fee: StudentFee) {
  try {
    const feeDocRef = doc(db, 'studentFees', fee.id);
    await setDoc(feeDocRef, sanitizeForFirestore(fee));
  } catch (error) {
    console.error('Error saving student fee to cloud:', error);
    throw error;
  }
}

/**
 * Deletes a single student fee from Firestore
 */
export async function deleteStudentFeeFromCloud(feeId: string) {
  try {
    const feeDocRef = doc(db, 'studentFees', feeId);
    await deleteDoc(feeDocRef);
  } catch (error) {
    console.error('Error deleting student fee from cloud:', error);
    throw error;
  }
}

/**
 * Performs a batch upload of student fees
 */
export async function uploadBulkFeesToCloud(fees: StudentFee[]) {
  try {
    const batchSize = 400;
    for (let i = 0; i < fees.length; i += batchSize) {
      const chunk = fees.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((fee) => {
        const docRef = doc(db, 'studentFees', fee.id);
        batch.set(docRef, sanitizeForFirestore(fee));
      });
      await batch.commit();
    }
  } catch (error) {
    console.error('Error uploading bulk student fees to cloud:', error);
    throw error;
  }
}

