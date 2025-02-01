import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: 'AIzaSyAXg-6FIydsITF2sW9pxZgL0WPNryiOdzo',
    authDomain: 'neevapp-34fb9.firebaseapp.com',
    projectId: 'neevapp-34fb9',
    storageBucket: 'neevapp-34fb9.appspot.com',
    messagingSenderId: '470356874371',
    appId: '1:470356874371:web:12217f61ab50f1f41db7b6',
  };

const app = initializeApp(firebaseConfig);
// Get Firebase services
const storage = getStorage(app);
// const messaging = getMessaging(app);

// Export services
export { storage };
