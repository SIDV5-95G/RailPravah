import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";
import { PravahSlotNotification, UserRole } from "../types";

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
};
export type { FirebaseUser };

/**
 * Persist an accepted AI slot notification to Firestore
 */
export async function persistSlotNotificationToFirestore(
  notification: PravahSlotNotification
): Promise<boolean> {
  try {
    const notifRef = doc(db, "notifications", notification.id);
    await setDoc(notifRef, {
      ...notification,
      firestoreCreatedAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.warn("Firestore notification persist notice (offline fallback active):", err);
    return false;
  }
}

/**
 * Fetch all slot notifications from Firestore
 */
export async function fetchSlotNotificationsFromFirestore(): Promise<PravahSlotNotification[]> {
  try {
    const notifsCol = collection(db, "notifications");
    const snapshot = await getDocs(notifsCol);
    const results: PravahSlotNotification[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as PravahSlotNotification;
      results.push({ ...data, id: d.id });
    });
    return results;
  } catch (err) {
    console.warn("Firestore notification fetch notice (fallback active):", err);
    return [];
  }
}
