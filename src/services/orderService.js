import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { compressImage } from '../utils/imageCompression';

const COLLECTION_NAME = 'orders';

export const ORDER_STATUS = {
  PENDING: "Ожидание",
  IN_PROGRESS: "В покраске",
  WAITING_PARTS: "Ждет запчасти",
  READY: "Готово",
  DELIVERED: "Отдано"
};

export const orderService = {
  async createOrder(orderData, photos, user, companyId) {
    const photoUrls = [];
    
    const newOrder = {
      ...orderData,
      companyId,
      status: ORDER_STATUS.PENDING,
      photos: [],
      history: [
        {
          action: "ORDER_CREATED",
          status: ORDER_STATUS.PENDING,
          userId: user.uid,
          userName: user.displayName || user.email,
          timestamp: new Date()
        }
      ],
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      statusChangedAt: serverTimestamp(),
      archivedAt: null,
      deletedAt: null,
      expiresAt: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000) // 2 years
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), newOrder);
    
    // Upload photos and update order
    if (photos && photos.length > 0) {
      const uploadedUrls = await Promise.all(photos.map(async (file) => {
        const compressedFile = await compressImage(file);
        const fileRef = ref(storage, `orders/${docRef.id}/photos/${compressedFile.name}`);
        await uploadBytes(fileRef, compressedFile);
        return getDownloadURL(fileRef);
      }));
      
      await updateDoc(docRef, {
        photos: uploadedUrls,
        id: docRef.id
      });
      
      photoUrls.push(...uploadedUrls);
    } else {
      await updateDoc(docRef, { id: docRef.id });
    }

    return { id: docRef.id, ...newOrder, photos: photoUrls };
  },

  async getOrders(companyId) {
    if (!companyId) return [];
    const q = query(
      collection(db, COLLECTION_NAME), 
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getOrder(id) {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  },

  async updateOrderStatus(id, newStatus, user) {
    const orderRef = doc(db, COLLECTION_NAME, id);
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data();

    const historyEntry = {
      action: "STATUS_CHANGED",
      from: orderData.status,
      to: newStatus,
      userId: user.uid,
      userName: user.displayName || user.email,
      timestamp: new Date()
    };

    await updateDoc(orderRef, {
      status: newStatus,
      statusChangedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      history: [historyEntry, ...orderData.history]
    });
  },

  async updateOrderPrice(id, newPrice, user) {
    const orderRef = doc(db, COLLECTION_NAME, id);
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data();

    const historyEntry = {
      action: "PRICE_CHANGED",
      from: orderData.price,
      to: newPrice,
      userId: user.uid,
      userName: user.displayName || user.email,
      timestamp: new Date()
    };

    await updateDoc(orderRef, {
      price: newPrice,
      updatedAt: serverTimestamp(),
      history: [historyEntry, ...orderData.history]
    });
  },

  async updateOrderDescription(id, newDescription, user) {
    const orderRef = doc(db, COLLECTION_NAME, id);
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data();

    const historyEntry = {
      action: "DESCRIPTION_CHANGED",
      userId: user.uid,
      userName: user.displayName || user.email,
      timestamp: new Date()
    };

    await updateDoc(orderRef, {
      description: newDescription,
      updatedAt: serverTimestamp(),
      history: [historyEntry, ...orderData.history]
    });
  },

  async addOrderPhotos(id, photos, user) {
    const orderRef = doc(db, COLLECTION_NAME, id);
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data();

    const uploadedUrls = await Promise.all(photos.map(async (file) => {
      const compressedFile = await compressImage(file);
      const fileRef = ref(storage, `orders/${id}/photos/${Date.now()}_${compressedFile.name}`);
      await uploadBytes(fileRef, compressedFile);
      return getDownloadURL(fileRef);
    }));

    const historyEntry = {
      action: "PHOTOS_ADDED",
      count: photos.length,
      userId: user.uid,
      userName: user.displayName || user.email,
      timestamp: new Date()
    };

    const newPhotos = [...(orderData.photos || []), ...uploadedUrls];

    await updateDoc(orderRef, {
      photos: newPhotos,
      updatedAt: serverTimestamp(),
      history: [historyEntry, ...orderData.history]
    });

    return uploadedUrls;
  },

  async deleteOrderPhoto(id, photoUrl, user) {
    const orderRef = doc(db, COLLECTION_NAME, id);
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data();

    // Delete from Storage
    try {
      const decodedUrl = decodeURIComponent(photoUrl);
      const pathPart = decodedUrl.split('/o/')[1].split('?')[0];
      const fileRef = ref(storage, pathPart);
      await deleteObject(fileRef);
    } catch (e) {
      console.error("Error deleting photo from storage", e);
    }

    // Update Firestore
    const newPhotos = orderData.photos.filter(url => url !== photoUrl);

    const historyEntry = {
      action: "PHOTO_DELETED",
      userId: user.uid,
      userName: user.displayName || user.email,
      timestamp: new Date()
    };

    await updateDoc(orderRef, {
      photos: newPhotos,
      updatedAt: serverTimestamp(),
      history: [historyEntry, ...orderData.history]
    });
  },

  async deleteOrder(id) {
    const orderRef = doc(db, COLLECTION_NAME, id);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) return;
    const orderData = orderSnap.data();

    // Delete photos from storage
    if (orderData.photos && orderData.photos.length > 0) {
      for (const url of orderData.photos) {
          try {
              // Firebase Storage URLs are like:
              // https://firebasestorage.googleapis.com/v0/b/project-id.appspot.com/o/orders%2ForderId%2Fphotos%2FfileName?alt=media...
              // We can use refFromURL or extract the path.
              // For robustness, it's better to store paths, but let's try to extract from URL
              const decodedUrl = decodeURIComponent(url);
              const pathPart = decodedUrl.split('/o/')[1].split('?')[0];
              const fileRef = ref(storage, pathPart);
              await deleteObject(fileRef);
          } catch (e) {
              console.error("Error deleting photo", e);
          }
      }
    }

    await deleteDoc(orderRef);
  }
};
