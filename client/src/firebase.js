import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyAKyQM4RKVbT5W6ObdwY_sOZDMNunhhkCY",
  authDomain: "stokvel-management-platf-f0977.firebaseapp.com",
  projectId: "stokvel-management-platf-f0977",
  storageBucket: "stokvel-management-platf-f0977.firebasestorage.app",
  messagingSenderId: "386384491583",
  appId: "1:386384491583:web:51dbdb748fc1f7ae7db48a"
}

const app = initializeApp(firebaseConfig);
const googleProvider = new GoogleAuthProvider();
const auth = getAuth(app);
export { auth, googleProvider };
