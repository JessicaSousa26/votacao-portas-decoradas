// public/js/firebase.js
// Configuração Firebase compatível com o projeto (v8+ compat syntax)

const firebaseConfig = {
  apiKey: "AIzaSyADR7Lcy4GoIUQsDUsveTNKJkm9hqNYtx8",
  authDomain: "natal-votacao.firebaseapp.com",
  projectId: "natal-votacao",
  storageBucket: "natal-votacao.firebasestorage.app",
  messagingSenderId: "210505457179",
  appId: "1:210505457179:web:375c93056f57ed8982e2be",
  measurementId: "G-P1LKGVHY10"
};

// Inicializa o Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
