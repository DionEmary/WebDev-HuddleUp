// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyCxdiZwwKWEnpoVGPcjvfYtLM4qWGeE4ww",
  authDomain: "huddleup-f534a.firebaseapp.com",
  projectId: "huddleup-f534a",
  storageBucket: "huddleup-f534a.firebasestorage.app",
  messagingSenderId: "755172417433",
  appId: "1:755172417433:web:ce0db9ec2f9a8f0c64fd08"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // 👈 Add this
const provider = new GoogleAuthProvider(); // 👈 And this

export { db, auth, provider };