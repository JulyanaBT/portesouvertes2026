import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {

  apiKey: "TA_CLE_API",

  authDomain: "portesouvertes2026.firebaseapp.com",

  projectId: "portesouvertes2026",

  storageBucket: "portesouvertes2026.firebasestorage.app",

  messagingSenderId: "817180718961",

  appId: "1:817180718961:web:dcbe2eaaec04dc929be8d0"

};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
