import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyAuma5Vr9MwoHpo3OCK--ens6v47Y9lls0",
  authDomain: "vibes-246b2.firebaseapp.com",
  projectId: "vibes-246b2",
  storageBucket: "vibes-246b2.firebasestorage.app",
  messagingSenderId: "70840696038",
  appId: "1:70840696038:web:3a90c864367f9bb2c0cf27",
  measurementId: "G-TFCZ42V6SC"
}

// ‼️ Evita dobles inicializaciones.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
export const storage = getStorage(app)
export default app
