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
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

const COLLECTION = 'staff';

const withTimestampsForCreate = (data) => ({
  ...data,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

const withTimestampsForUpdate = (data) => ({
  ...data,
  updatedAt: serverTimestamp(),
});

export const createStaff = (data) => {
  if (!data?.societyId) {
    throw new Error('societyId is required to create staff');
  }
  return addDoc(collection(db, COLLECTION), withTimestampsForCreate(data));
};

export const getStaffById = async (id) => {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

export const updateStaff = (id, updates) => {
  return updateDoc(doc(db, COLLECTION, id), withTimestampsForUpdate(updates));
};

export const deleteStaff = (id) => {
  return deleteDoc(doc(db, COLLECTION, id));
};

export const subscribeToStaff = (societyId, callback) => {
  const q = societyId
    ? query(collection(db, COLLECTION), where('societyId', '==', societyId))
    : query(collection(db, COLLECTION));

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    (error) => {
      console.error('[Firestore Error] subscribeToStaff:', error);
      callback([]);
    },
  );
};

export const subscribeToSecurityStaff = (societyId, callback) => {
  const q = query(
    collection(db, COLLECTION),
    where('societyId', '==', societyId),
    where('role', '==', 'Security')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const staff = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        phone: doc.data().phone,
        role: doc.data().role,
        status: doc.data().status // "On Duty" or "Off Duty"
      }));
      callback(staff);
    },
    (error) => {
      console.error('Error fetching security staff:', error);
      callback([]);
    }
  );
};

export const fetchStaffOnce = async (societyId) => {
  const q = societyId
    ? query(collection(db, COLLECTION), where('societyId', '==', societyId))
    : query(collection(db, COLLECTION));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

