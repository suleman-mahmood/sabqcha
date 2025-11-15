// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCyi2LGMg8GV_1UXNUj5A12yE5TFgRjTmo",
    authDomain: "sabqcha.firebaseapp.com",
    projectId: "sabqcha",
    storageBucket: "sabqcha.firebasestorage.app",
    messagingSenderId: "888570058051",
    appId: "1:888570058051:web:36e10d682642848c754bf6",
    measurementId: "G-T8KEJCK3XD",
};

// Initialize Firebase only once
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const storage = getStorage(app);
export const analytics = getAnalytics(app);
