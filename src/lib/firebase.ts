// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  "projectId": "ielts-ace-e7kcb",
  "appId": "1:443877546916:web:4280a83da42ba321457f31",
  "storageBucket": "ielts-ace-e7kcb.firebasestorage.app",
  "apiKey": "AIzaSyBRkoOLSlg0jbLRpxv9KvbcFsr9AeviDQg",
  "authDomain": "ielts-ace-e7kcb.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "443877546916"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
