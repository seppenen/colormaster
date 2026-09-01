import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  doc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  serverTimestamp,
  where,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'demo-test-key',
  authDomain: 'localhost',
  projectId: 'colormaster-test',
  storageBucket: 'colormaster-test.appspot.com',
  messagingSenderId: '0000000000',
  appId: '1:0000000000:web:0000000000000000000000',
  measurementId: 'G-0000000000',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099');

const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);

const email = 'alex.seppenen@gmail.com';
const password = '000000';

let userCredential;
try {
  userCredential = await signInWithEmailAndPassword(auth, email, password);
} catch (error) {
  if (error.code !== 'auth/invalid-credential') {
    throw error;
  }

  userCredential = await createUserWithEmailAndPassword(auth, email, password);
}

const uid = userCredential.user.uid;
const companyDocs = await getDocs(query(collection(db, 'companies'), where('ownerUid', '==', uid)));

let companyId = null;
if (!companyDocs.empty) {
  companyId = companyDocs.docs[0].id;
  await setDoc(
    doc(db, 'companies', companyId),
    {
      name: 'Test Company',
      ownerUid: uid,
      branches: [{ id: 'main', name: 'main' }],
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
} else {
  const companyRef = await addDoc(collection(db, 'companies'), {
    name: 'Test Company',
    ownerUid: uid,
    branches: [{ id: 'main', name: 'main' }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  companyId = companyRef.id;
}

await setDoc(
  doc(db, 'users', uid),
  {
    uid,
    name: 'Alex Seppenen',
    email,
    role: 'admin',
    companyId,
    branchId: 'main',
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  },
  { merge: true }
);

console.log('Seeded test user: ' + email);
console.log('Company ID: ' + companyId);
console.log('Branch: main');
