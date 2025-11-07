// public/js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";
import { getFirestore, collection, getDocs, getDoc, doc, addDoc, setDoc, query, where, orderBy, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-storage.js";

// 🔥 Configuração do seu projeto "votacao-portas-decoradas"
const firebaseConfig = {
  apiKey: "AIzaSyBudJ44QDyf7NQrQbfjsdJR-EWFbl8n56Y",
  authDomain: "votacao-portas-decoradas.firebaseapp.com",
  projectId: "votacao-portas-decoradas",
  storageBucket: "votacao-portas-decoradas.firebasestorage.app",
  messagingSenderId: "550340880775",
  appId: "1:550340880775:web:febc94ae824853f70e8b22",
  measurementId: "G-F3VK0JJH1Z"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Serviços do Firebase
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

// Exporta para uso em outros módulos
export {
  app, auth, provider, db, storage,
  signInWithPopup, signOut, onAuthStateChanged,
  collection, getDocs, getDoc, doc, addDoc, setDoc,
  query, where, orderBy, serverTimestamp, runTransaction,
  ref, uploadBytes, getDownloadURL
};
