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
import { Student, Transaction } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID from config
export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId || '(default)');

// Firestore Collection references
export const studentsColRef = collection(db, 'students');
export const transactionsColRef = collection(db, 'transactions');

/**
 * Saves a single student to Firestore
 */
export async function saveStudentToCloud(student: Student) {
  try {
    const studentDocRef = doc(db, 'students', student.id);
    await setDoc(studentDocRef, student);
  } catch (error) {
    console.error('Error saving student to cloud:', error);
  }
}

/**
 * Deletes a single student and all their transactions from Firestore
 */
export async function deleteStudentFromCloud(studentId: string) {
  try {
    const batch = writeBatch(db);
    
    // Delete the student document
    const studentDocRef = doc(db, 'students', studentId);
    batch.delete(studentDocRef);

    // Fetch and delete all transactions associated with this student
    const q = query(transactionsColRef);
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as Transaction;
      if (data.studentId === studentId) {
        batch.delete(docSnap.ref);
      }
    });

    await batch.commit();
  } catch (error) {
    console.error('Error deleting student from cloud:', error);
  }
}

/**
 * Saves a single transaction to Firestore
 */
export async function saveTransactionToCloud(transaction: Transaction) {
  try {
    const transactionDocRef = doc(db, 'transactions', transaction.id);
    await setDoc(transactionDocRef, transaction);
  } catch (error) {
    console.error('Error saving transaction to cloud:', error);
  }
}

/**
 * Performs a batch upload of multiple students and transactions
 * This is useful for first-time seed migrations or restoration from JSON backup
 */
export async function uploadBulkToCloud(students: Student[], transactions: Transaction[]) {
  try {
    // Firestore allows up to 500 writes per batch. 
    // We will partition the bulk inserts if necessary, or execute them in parallel batches.
    const batchSize = 400;
    
    // Upload students in chunks
    for (let i = 0; i < students.length; i += batchSize) {
      const chunk = students.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((student) => {
        const docRef = doc(db, 'students', student.id);
        batch.set(docRef, student);
      });
      await batch.commit();
    }

    // Upload transactions in chunks
    for (let i = 0; i < transactions.length; i += batchSize) {
      const chunk = transactions.slice(i, i + batchSize);
      const batch = writeBatch(db);
      chunk.forEach((tx) => {
        const docRef = doc(db, 'transactions', tx.id);
        batch.set(docRef, tx);
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
 * This acts as our secure Wipe / Clear Database utility
 */
export async function clearAllCloudDatabase() {
  try {
    // Deleting students
    const studentsSnapshot = await getDocs(studentsColRef);
    const studentsBatch = writeBatch(db);
    studentsSnapshot.forEach((docSnap) => {
      studentsBatch.delete(docSnap.ref);
    });
    await studentsBatch.commit();

    // Deleting transactions
    const transactionsSnapshot = await getDocs(transactionsColRef);
    const transactionsBatch = writeBatch(db);
    transactionsSnapshot.forEach((docSnap) => {
      transactionsBatch.delete(docSnap.ref);
    });
    await transactionsBatch.commit();
  } catch (error) {
    console.error('Error clearing database from cloud:', error);
    throw error;
  }
}
