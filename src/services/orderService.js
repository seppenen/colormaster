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
  where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { compressImage } from '../utils/imageCompression';

const COLLECTION_NAME = 'orders';

export const ORDER_STATUS = {
  PENDING: 'Ожидание',
  WAITING_PARTS: 'Ждет запчасти',
  AVAITING_WORK: 'Готова к работе',
  IN_PROGRESS: 'В работе',
  READY: 'Готово',
  DELIVERED: 'Отдано',
  LASKUTETTU: 'Lasku OK',
  SAVAS_SENT: 'Отправлено в Саваs',
};

export const orderService = {
  async createOrder(orderData, photos, user, companyId, userData, branchId = null) {
    const photoUrls = [];

    const newOrder = {
      ...orderData,
      includeAlv: orderData.includeAlv || false,
      companyId,
      branchId,
      status: ORDER_STATUS.PENDING,
      photos: [],
      history: [
        {
          action: 'ORDER_CREATED',
          status: ORDER_STATUS.PENDING,
          userId: user.uid,
          userName: userData?.name || user.displayName || user.email,
          timestamp: new Date(),
        },
      ],
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      statusChangedAt: serverTimestamp(),
      archivedAt: null,
      deletedAt: null,
      expiresAt: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000), // 2 years
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), newOrder);

    // Upload photos and update order
    if (photos && photos.length > 0) {
      const uploadedUrls = await Promise.all(
        photos.map(async (file) => {
          const compressedFile = await compressImage(file);
          const fileRef = ref(storage, `orders/${docRef.id}/photos/${compressedFile.name}`);
          await uploadBytes(fileRef, compressedFile);
          return getDownloadURL(fileRef);
        })
      );

      await updateDoc(docRef, {
        photos: uploadedUrls,
        id: docRef.id,
      });

      photoUrls.push(...uploadedUrls);
    } else {
      await updateDoc(docRef, { id: docRef.id });
    }

    return { id: docRef.id, ...newOrder, photos: photoUrls };
  },

  async getOrders(companyId, branchId = null) {
    if (!companyId) return [];
    
    let q;
    if (branchId) {
      q = query(
        collection(db, COLLECTION_NAME),
        where('companyId', '==', companyId),
        where('branchId', '==', branchId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, COLLECTION_NAME),
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },

  async getOrder(id) {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  },

  async sendOrderEmail(order, company) {
    console.log('Attempting to send email via Firestore Extension to:', order.clientEmail);
    if (!order.clientEmail) {
      console.log('No client email found in order object');
      return;
    }

    const publicUrl = `${window.location.origin}/v/${order.id}`;
    
    try {
      // Document structure according to Firebase Trigger Email extension documentation:
      // https://firebase.google.com/docs/extensions/official/firestore-send-email
      const emailDoc = {
        to: [order.clientEmail], // Array is preferred and more reliable
        message: {
          subject: `Заказ ${order.carNumber || ''} - ${company?.name || ''}`,
          text: `Здравствуйте, ${order.clientName || 'клиент'}!\n\nВаш заказ успешно создан. Вы можете отслеживать статус работ и просматривать фотографии по следующей ссылке:\n\n${publicUrl}\n\nС уважением,\n${company?.name || 'Команда мастерской'}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
              <h2 style="color: #333;">Здравствуйте, ${order.clientName || 'клиент'}!</h2>
              <p style="font-size: 16px; color: #555;">Ваш заказ успешно создан и находится в работе.</p>
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #777; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Автомобиль</p>
                <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold;">${order.carModel || 'Не указано'}</p>
                ${order.carNumber ? `<p style="margin: 5px 0 0 0; font-family: monospace; font-size: 16px;">${order.carNumber}</p>` : ''}
              </div>
              <p style="font-size: 16px; color: #555;">Вы можете отслеживать статус работ и просматривать фотографии по ссылке ниже:</p>
              <a href="${publicUrl}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0;">Посмотреть заказ</a>
              <p style="font-size: 14px; color: #999; margin-top: 30px;">
                С уважением,<br>
                ${company?.name || 'Команда мастерской'}
              </p>
            </div>
          `
        },
        createdAt: serverTimestamp(),
        orderId: order.id,
        // Optional tracking fields
        delivery: {
          state: 'PENDING',
          attempts: 0
        }
      };

      console.log('Final Email Document structure:', JSON.stringify({
        to: emailDoc.to,
        subject: emailDoc.message.subject,
        orderId: emailDoc.orderId
      }));

      const docRef = await addDoc(collection(db, 'mail'), emailDoc);
      console.log('Email document created successfully in Firestore with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('CRITICAL: Error creating email document in Firestore:', error);
      throw error;
    }
  },

  async updateOrderStatus(id, newStatus, user, userData) {
    const orderRef = doc(db, COLLECTION_NAME, id);
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data();

    const historyEntry = {
      action: 'STATUS_CHANGED',
      from: orderData.status,
      to: newStatus,
      userId: user.uid,
      userName: userData?.name || user.displayName || user.email,
      timestamp: new Date(),
    };

    const updates = {
      status: newStatus,
      statusChangedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      history: [historyEntry, ...orderData.history],
    };

    // Time tracking logic
    const now = new Date();
    
    // If moving TO "In Progress", record start time and WHO started it
    if (newStatus === ORDER_STATUS.IN_PROGRESS) {
      updates.workStartedAt = serverTimestamp();
      updates.workStartedBy = user.uid;
    }

    // If moving FROM "In Progress", calculate duration
    if (orderData.status === ORDER_STATUS.IN_PROGRESS && orderData.workStartedAt) {
      const startTime = orderData.workStartedAt.toDate ? orderData.workStartedAt.toDate() : new Date(orderData.workStartedAt);
      const durationMs = now.getTime() - startTime.getTime();
      
      // Update total duration
      const currentTotalDuration = orderData.workDuration || 0;
      updates.workDuration = currentTotalDuration + durationMs;
      
      // Update duration for the specific worker who was working
      const workerId = orderData.workStartedBy || user.uid;
      const workerTimes = orderData.workerTimes || {};
      const currentWorkerDuration = workerTimes[workerId] || 0;
      
      updates.workerTimes = {
        ...workerTimes,
        [workerId]: currentWorkerDuration + durationMs
      };

      updates.workStartedAt = null;
      updates.workStartedBy = null;
    }

    await updateDoc(orderRef, updates);
  },

  async updateOrderPrice(id, newPrice, includeAlv, user, userData) {
    const orderRef = doc(db, COLLECTION_NAME, id);
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data();

    const historyEntry = {
      action: 'PRICE_CHANGED',
      from: orderData.price || 0,
      to: newPrice,
      includeAlv: includeAlv,
      userId: user.uid,
      userName: userData?.name || user.displayName || user.email,
      timestamp: new Date(),
    };

    await updateDoc(orderRef, {
      price: newPrice,
      includeAlv: includeAlv,
      updatedAt: serverTimestamp(),
      history: [historyEntry, ...orderData.history],
    });
  },

  async updateWorkerPrice(id, newPrice, workerId, workerName, user, userData) {
    const orderRef = doc(db, COLLECTION_NAME, id);
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data();

    const historyEntry = {
      action: 'WORKER_PRICE_CHANGED',
      from: orderData.workerPrice || 0,
      to: newPrice,
      workerName: workerName,
      userId: user.uid,
      userName: userData?.name || user.displayName || user.email,
      timestamp: new Date(),
    };

    await updateDoc(orderRef, {
      workerPrice: newPrice,
      workerId: workerId || null,
      workerName: workerName || null,
      updatedAt: serverTimestamp(),
      history: [historyEntry, ...orderData.history],
    });
  },

  async addOrderComment(id, commentText, user, userData) {
    const orderRef = doc(db, COLLECTION_NAME, id);
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data();

    const newComment = {
      id: Date.now().toString(),
      text: commentText,
      userId: user.uid,
      userName: userData?.name || user.displayName || user.email,
      timestamp: new Date(),
    };

    const historyEntry = {
      action: 'COMMENT_ADDED',
      userId: user.uid,
      userName: userData?.name || user.displayName || user.email,
      timestamp: new Date(),
    };

    const comments = orderData.comments || [];
    
    // Support legacy single comment if it exists
    if (orderData.comment && !orderData.comments) {
      // One-time migration of the old comment to the new array format could be done here, 
      // but let's keep it simple and just append to the new list.
    }

    await updateDoc(orderRef, {
      comments: [...comments, newComment],
      updatedAt: serverTimestamp(),
      history: [historyEntry, ...orderData.history],
    });

    return newComment;
  },

  async updateOrderComment(id, commentId, newText, user, userData) {
    const orderRef = doc(db, COLLECTION_NAME, id);
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data();

    const comments = (orderData.comments || []).map(c => 
      c.id === commentId ? { ...c, text: newText, updatedAt: new Date() } : c
    );

    const historyEntry = {
      action: 'COMMENT_UPDATED',
      userId: user.uid,
      userName: userData?.name || user.displayName || user.email,
      timestamp: new Date(),
    };

    await updateDoc(orderRef, {
      comments,
      updatedAt: serverTimestamp(),
      history: [historyEntry, ...orderData.history],
    });
  },

  async deleteOrderComment(id, commentId, user, userData) {
    const orderRef = doc(db, COLLECTION_NAME, id);
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data();

    const comments = (orderData.comments || []).filter(c => c.id !== commentId);

    const historyEntry = {
      action: 'COMMENT_DELETED',
      userId: user.uid,
      userName: userData?.name || user.displayName || user.email,
      timestamp: new Date(),
    };

    await updateDoc(orderRef, {
      comments,
      updatedAt: serverTimestamp(),
      history: [historyEntry, ...orderData.history],
    });
  },

  async updateOrderDescription(id, newDescription, user, userData) {
    const orderRef = doc(db, COLLECTION_NAME, id);
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data();

    const historyEntry = {
      action: 'DESCRIPTION_CHANGED',
      userId: user.uid,
      userName: userData?.name || user.displayName || user.email,
      timestamp: new Date(),
    };

    await updateDoc(orderRef, {
      description: newDescription,
      updatedAt: serverTimestamp(),
      history: [historyEntry, ...orderData.history],
    });
  },

  async updateOrderDetails(id, details, user, userData) {
    const orderRef = doc(db, COLLECTION_NAME, id);
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data();

    const historyEntry = {
      action: 'DETAILS_CHANGED',
      userId: user.uid,
      userName: userData?.name || user.displayName || user.email,
      timestamp: new Date(),
    };

    await updateDoc(orderRef, {
      ...details,
      updatedAt: serverTimestamp(),
      history: [historyEntry, ...orderData.history],
    });
  },

  async addOrderPhotos(id, photos, user, userData) {
    const orderRef = doc(db, COLLECTION_NAME, id);
    const orderSnap = await getDoc(orderRef);
    const orderData = orderSnap.data();

    const uploadedUrls = await Promise.all(
      photos.map(async (file) => {
        const compressedFile = await compressImage(file);
        const fileRef = ref(storage, `orders/${id}/photos/${Date.now()}_${compressedFile.name}`);
        await uploadBytes(fileRef, compressedFile);
        return getDownloadURL(fileRef);
      })
    );

    const historyEntry = {
      action: 'PHOTOS_ADDED',
      count: photos.length,
      userId: user.uid,
      userName: userData?.name || user.displayName || user.email,
      timestamp: new Date(),
    };

    const newPhotos = [...(orderData.photos || []), ...uploadedUrls];

    await updateDoc(orderRef, {
      photos: newPhotos,
      updatedAt: serverTimestamp(),
      history: [historyEntry, ...orderData.history],
    });

    return uploadedUrls;
  },

  async deleteOrderPhoto(id, photoUrl, user, userData) {
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
      console.error('Error deleting photo from storage', e);
    }

    // Update Firestore
    const newPhotos = orderData.photos.filter((url) => url !== photoUrl);

    const historyEntry = {
      action: 'PHOTO_DELETED',
      userId: user.uid,
      userName: userData?.name || user.displayName || user.email,
      timestamp: new Date(),
    };

    await updateDoc(orderRef, {
      photos: newPhotos,
      updatedAt: serverTimestamp(),
      history: [historyEntry, ...orderData.history],
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
          console.error('Error deleting photo', e);
        }
      }
    }

    await deleteDoc(orderRef);
  },
};
