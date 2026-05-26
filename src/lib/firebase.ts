import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD66H3icDjI6U8kyrBJrqd3MEEFAxSEyxk",
  authDomain: "spin-the-wheel-21cfd.firebaseapp.com",
  projectId: "spin-the-wheel-21cfd",
  storageBucket: "spin-the-wheel-21cfd.firebasestorage.app",
  messagingSenderId: "191234309510",
  appId: "1:191234309510:web:d40d87d31e666ed8698007",
  measurementId: "G-9SSGGVJHD7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;