import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
  apiKey: 'AIzaSyAXg-6FIydsITF2sW9pxZgL0WPNryiOdzo',
  authDomain: 'neevapp-34fb9.firebaseapp.com',
  databaseURL: 'neevapp-34fb9.appspot.com',
  projectId: 'neevapp-34fb9',
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: '470356874371',
  appId: '1:470356874371:web:12217f61ab50f1f41db7b6',
};
// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Export Firebase Storage
export const storage = getStorage(app);
