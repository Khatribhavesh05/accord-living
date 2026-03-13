import { db } from './config';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

const COLLECTION = 'emergencies';

const withTimestampsForCreate = (data) => ({
  ...data,
  status: data.status || 'ACTIVE',
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const withTimestampsForUpdate = (data) => ({
  ...data,
  updatedAt: serverTimestamp(),
});

export const triggerEmergency = (data) => {
  if (!data?.societyId) {
    throw new Error('societyId is required to trigger an emergency');
  }
  return addDoc(collection(db, COLLECTION), withTimestampsForCreate(data));
};

export const updateEmergencyStatus = (emergencyId, status, extra = {}) => {
  if (!emergencyId) {
    throw new Error('emergencyId is required to update emergency status');
  }
  return updateDoc(doc(db, COLLECTION, emergencyId), withTimestampsForUpdate({
    status,
    ...extra,
  }));
};

export const deleteEmergency = (emergencyId) => {
  return deleteDoc(doc(db, COLLECTION, emergencyId));
};

export const getEmergencyById = async (emergencyId) => {
  const snap = await getDoc(doc(db, COLLECTION, emergencyId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

export const subscribeToActiveEmergencies = (societyId, callback) => {
  const q = query(
    collection(db, COLLECTION),
    where('societyId', '==', societyId),
    where('status', '==', 'ACTIVE'),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q,
    (snapshot) => {
      const emergencies = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(emergencies);
    },
    (error) => {
      console.error('Error fetching emergencies:', error);
      callback([]);
    }
  );
};

export const subscribeToAllEmergencies = (societyId, callback) => {
  const filters = societyId
    ? [where('societyId', '==', societyId)]
    : [];

  const q = query(collection(db, COLLECTION), ...filters, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    (error) => {
      console.error('[Firestore Error] subscribeToAllEmergencies:', error);
      callback([]);
    },
  );
};

export const fetchEmergenciesOnce = async (societyId) => {
  const filters = societyId
    ? [where('societyId', '==', societyId)]
    : [];

  const q = query(collection(db, COLLECTION), ...filters, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

