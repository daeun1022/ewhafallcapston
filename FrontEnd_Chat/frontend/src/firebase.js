// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyA_wIJbRt56PgmaXUN-fvfu94jVLLELiGA",
    authDomain: "capstonedesign-c1036.firebaseapp.com",
    projectId: "capstonedesign-c1036",
    storageBucket: "capstonedesign-c1036.firebasestorage.app",
    messagingSenderId: "567013390532",
    appId: "1:567013390532:web:4458ed678475a78c29b191",
    measurementId: "G-JJJPM1Q59N"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };