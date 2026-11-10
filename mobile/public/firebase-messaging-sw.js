importScripts(
    "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);
importScripts(
    "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
    apiKey: "AIzaSyD7GVIfmYn24TX3_P88QK7EAP1hPpZ4Y88",
    authDomain: "vetexoticos.firebaseapp.com",
    projectId: "vetexoticos",
    storageBucket: "vetexoticos.firebasestorage.app",
    messagingSenderId: "797755522020",
    appId: "1:797755522020:web:e500ef18824249996065f1"
});

firebase.messaging();