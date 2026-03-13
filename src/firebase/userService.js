import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';

/**
 * Gets or creates a user profile document in Firestore.
 * Role and societyId come from the existing Firestore doc (set during credential generation).
 * Falls back to 'resident' for any new Google-auth user.
 */
export async function getOrCreateUserProfile(firebaseUser) {
  const ref = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    return snap.data();
  }

  // New user (e.g. first Google sign-in) — create minimal profile
  const email = firebaseUser.email?.toLowerCase() || '';
  const name = firebaseUser.displayName || email.split('@')[0] || 'User';

  const profile = {
    uid: firebaseUser.uid,
    email,
    name,
    role: 'resident',
    flatNumber: null,
    societyId: null,
    createdAt: serverTimestamp(),
  };

  await setDoc(ref, profile);
  return profile;
}

/**
 * Updates a user's profile in Firestore.
 */
export async function updateUserProfile(uid, updates) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
}
