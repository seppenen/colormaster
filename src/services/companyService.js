import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'companies';

export const companyService = {
  async getCompany(id) {
    if (!id) return null;
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  },

  async createCompany(companyData, ownerUid) {
    const newCompany = {
      ...companyData,
      ownerUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), newCompany);
    return { id: docRef.id, ...newCompany };
  },

  async updateCompany(id, updateData) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  },
};
