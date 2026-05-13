// firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup,       // Required for Google Login
    GoogleAuthProvider,    // Required for Google Login
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs,
    serverTimestamp,
    orderBy,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAIw4bffdj0pw0-ft9XZR_VBZKh4Vn6v2g",
  authDomain: "glamora-house.firebaseapp.com",
  projectId: "glamora-house",
  storageBucket: "glamora-house.firebasestorage.app",
  messagingSenderId: "3066529892",
  appId: "1:3066529892:web:3d4e9dd141b9de5717f771"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Admin Isolation Context ---
const adminApp = initializeApp(firebaseConfig, "AdminApp");
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);

// Export everything needed across all pages
export { 
    auth, 
    db, 
    adminAuth,
    adminDb,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    onAuthStateChanged, 
    signOut,
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs,
    serverTimestamp,
    orderBy,
    deleteDoc
};