import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyDusxb2fAWyuH3973CfNlOqtREZ2paRiwk",
  authDomain: "bathory-kiosk.firebaseapp.com",
  projectId: "bathory-kiosk",
  storageBucket: "bathory-kiosk.firebasestorage.app",
  messagingSenderId: "957591159934",
  appId: "1:957591159934:web:31d60bfce81bba3ea2842f",
  measurementId: "G-PH08VY5FC8"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };