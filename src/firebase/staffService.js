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
  if (!societyId) {
    console.warn('[staffService] subscribeToSecurityStaff called without societyId');
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, COLLECTION),
    where('societyId', '==', societyId),
  );
  console.log('[staffService] Subscribing to security staff', { societyId });

  return onSnapshot(
    q,
    (snapshot) => {
      const staff = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((member) => {
          const roleValue = String(member.role || '').toLowerCase();
          return roleValue.includes('security') || roleValue.includes('guard');
        })
        .map((member) => ({
          id: member.id,
          name: member.name,
          phone: member.phone,
          role: member.role,
          status: member.status,
        }));
      console.log('[staffService] Security staff snapshot', { count: staff.length });
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
