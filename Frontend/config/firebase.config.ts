import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDXW9qrWr2NFtP1pT43bnInzaZF8T0GLxg",
  authDomain: "casual-coach.firebaseapp.com",
  projectId: "casual-coach",
  storageBucket: "casual-coach.firebasestorage.app",
  messagingSenderId: "196125987174",
  appId: "1:196125987174:web:906a2a499a7b51542db8a7",
  measurementId: "G-GCH5674D7B"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth };
export default app;
