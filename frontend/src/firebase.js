import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyD3d-14tf-6p1h3_3QfOsdCeaUM_I1UmsE",
    authDomain: "logqr-b3e30.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: "logqr-b3e30.firebasestorage.app",
    messagingSenderId: "779286358425",
    appId: "1:779286358425:web:263d482d88935e2f188b08",
    measurementId: "G-PLP18X8YNL"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);




/** 
 * 
 * // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD3d-14tf-6p1h3_3QfOsdCeaUM_I1UmsE",
  authDomain: "logqr-b3e30.firebaseapp.com",
  projectId: "logqr-b3e30",
  storageBucket: "logqr-b3e30.firebasestorage.app",
  messagingSenderId: "779286358425",
  appId: "1:779286358425:web:263d482d88935e2f188b08",
  measurementId: "G-PLP18X8YNL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
 */