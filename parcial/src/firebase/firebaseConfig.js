// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCoMV5lwTWUzXhTxcKF13xXUgwaFiloLU0",
  authDomain: "dev-soa.firebaseapp.com",
  projectId: "dev-soa",
  storageBucket: "dev-soa.firebasestorage.app",
  messagingSenderId: "180296238752",
  appId: "1:180296238752:web:a3493b8f939d3267872bc5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);