import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { LogBox } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyAXg-6FIydsITF2sW9pxZgL0WPNryiOdzo',
  authDomain: 'neevapp-34fb9.firebaseapp.com',
  projectId: 'neevapp-34fb9',
  storageBucket: 'neevapp-34fb9.appspot.com',
  messagingSenderId: '470356874371',
  appId: '1:470356874371:web:12217f61ab50f1f41db7b6',
};

// Initialize Firebase‹
const app = initializeApp(firebaseConfig);
// const messaging = getMessaging(app);
const storage = getStorage(app);
// Export messaging service
export {storage};

// Ignore specific warnings
LogBox.ignoreLogs(['It looks like you might be using shared value']);