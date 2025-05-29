import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyD-iD3DCmvUOHTeeM1121w3_kY0X4Q6SLQ",
    authDomain: "financelogin-35d44.firebaseapp.com",
    projectId: "financelogin-35d44",
    storageBucket: "financelogin-35d44.firebasestorage.app",
    messagingSenderId: "945371163080",
    appId: "1:945371163080:web:e88c1aeca8a6b5431a38fd",
    measurementId: "G-P4DFV25KXB"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

export { app, auth };
