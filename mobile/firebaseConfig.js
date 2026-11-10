// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD7GVIfmYn24TX3_P88QK7EAP1hPpZ4Y88",
    authDomain: "vetexoticos.firebaseapp.com",
    projectId: "vetexoticos",
    storageBucket: "vetexoticos.firebasestorage.app",
    messagingSenderId: "797755522020",
    appId: "1:797755522020:web:e500ef18824249996065f1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export { app, firebaseConfig };