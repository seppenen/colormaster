import { doc, getDoc, setDoc, updateDoc, collection, getDocs, deleteDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'users';

export const USER_ROLES = {
  ADMIN: "admin",
  EMPLOYEE: "employee"
};

export const userService = {
  async getUser(uid) {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  },

  async createUser(uid, userData) {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const newUser = {
      ...userData,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(docRef, newUser);
    return newUser;
  },

  async getAllUsers(companyId) {
    if (!companyId) return [];
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('companyId', '==', companyId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
  },

  async updateUser(uid, updateData) {
    const docRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
  },

  async deleteUser(uid) {
    const docRef = doc(db, COLLECTION_NAME, uid);
    await deleteDoc(docRef);
  }
};
