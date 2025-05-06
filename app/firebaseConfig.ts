// Import Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase Configuration (Replace with your own)
const firebaseConfig = {
    apiKey: "process.env.GOOGLE_API_KEY",
    authDomain: "pasikkodu.firebaseapp.com",
    projectId: "pasikkodu",
    storageBucket: "pasikkodu.firebasestorage.app",
    messagingSenderId: "754225814070",
    appId: "1:754225814070:android:d028b3f2c19ebf0d68d697"
};

const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app); // For authentication
export const db = getFirestore(app); // For Firestore database
export const storage = getStorage(app); // For Firebase Storage

export default app;
