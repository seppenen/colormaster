import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'salaryPayments';

export const paymentService = {
  async recordPayment(companyId, userId, month, amount) {
    const payment = {
      companyId,
      userId,
      month, // Should be a string like 'YYYY-MM'
      amount,
      paidAt: serverTimestamp(),
    };
    await addDoc(collection(db, COLLECTION_NAME), payment);
  },

  async getPayments(companyId, month) {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('companyId', '==', companyId),
      where('month', '==', month)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },
};
