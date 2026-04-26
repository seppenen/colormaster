import { db } from './services/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { USER_ROLES } from './services/userService';
import { ORDER_STATUS } from './services/orderService';

/**
 * Функция для инициализации коллекций в Firebase Firestore.
 * В Firestore коллекции создаются автоматически при добавлении первого документа.
 */
export const initializeCollections = async () => {
  console.log('Начало инициализации коллекций...');

  try {
    // 1. Создаем тестовую компанию
    const companiesRef = collection(db, 'companies');
    const testCompany = {
      name: "Тестовая Автомастерская",
      ownerUid: "system-admin",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    const companyDoc = await addDoc(companiesRef, testCompany);
    const companyId = companyDoc.id;
    console.log(`Коллекция 'companies' инициализирована. ID: ${companyId}`);

    // 2. Создаем тестового пользователя
    const usersRef = collection(db, 'users');
    const systemUser = {
      name: "Системный Администратор",
      email: "admin@colormaster.ru",
      role: USER_ROLES.ADMIN,
      companyId: companyId,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const userDoc = await addDoc(usersRef, systemUser);
    console.log(`Коллекция 'users' инициализирована. Создан тестовый пользователь с ID: ${userDoc.id}`);

    // 3. Создаем тестовый заказ
    const ordersRef = collection(db, 'orders');
    const sampleOrder = {
      carModel: "Tesla Model 3",
      carNumber: "ABC-123",
      clientName: "Тестовый Клиент",
      clientPhone: "+358 00 000 0000",
      description: "Инициализация системы",
      status: ORDER_STATUS.PENDING,
      price: 0,
      companyId: companyId,
      photos: [],
      history: [
        {
          action: "ORDER_CREATED",
          status: ORDER_STATUS.PENDING,
          userId: "system",
          userName: "System",
          timestamp: new Date().toISOString()
        }
      ],
      createdBy: "system",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      statusChangedAt: serverTimestamp(),
      archivedAt: null,
      deletedAt: null,
      expiresAt: new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000)
    };

    const orderDoc = await addDoc(ordersRef, sampleOrder);
    await setDoc(orderDoc, { id: orderDoc.id }, { merge: true });
    console.log(`Коллекция 'orders' инициализирована. Создан тестовый заказ с ID: ${orderDoc.id}`);

    console.log('Инициализация успешно завершена!');
    return true;
  } catch (error) {
    console.error('Ошибка при инициализации коллекций:', error);
    return false;
  }
};
