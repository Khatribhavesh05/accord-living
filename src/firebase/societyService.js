import { db } from './config';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';

const COLLECTION = 'societies';

/**
 * Create a new society document.
 * @param {object} data - { name, location, adminUid }
 * @returns {Promise<string>} societyId
 */
export const createSociety = async ({ name, location, adminUid }) => {
  const ref = await addDoc(collection(db, COLLECTION), {
    name,
    location,
    adminUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

/**
 * Get a society document once.
 * @param {string} societyId
 * @returns {Promise<object|null>}
 */
export const getSociety = async (societyId) => {
  const snap = await getDoc(doc(db, COLLECTION, societyId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

/**
 * Update a society document.
 * @param {string} societyId
 * @param {object} updates
 */
export const updateSociety = (societyId, updates) => {
  return updateDoc(doc(db, COLLECTION, societyId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Subscribe to a society document in real-time.
 * @param {string} societyId
 * @param {function} callback - called with society data
 * @returns {function} unsubscribe
 */
export const subscribeToSociety = (societyId, callback) => {
  if (!societyId) {
    callback(null);
    return () => {};
  }
  return onSnapshot(doc(db, COLLECTION, societyId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
};
