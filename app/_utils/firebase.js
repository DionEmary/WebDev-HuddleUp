// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAWikTo7SQJO9Rj0vFAuMVhRUC6O7LvjUY",
  authDomain: "huddleup-38d4d.firebaseapp.com",
  projectId: "huddleup-38d4d",
  storageBucket: "huddleup-38d4d.firebasestorage.app",
  messagingSenderId: "199509230845",
  appId: "1:199509230845:web:31741e49773e103156aa94",
  measurementId: "G-7ZRVRM0DWC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);