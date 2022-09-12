const { initializeApp } = require('firebase/app')
const { getStorage } = require('firebase/storage')


const dotenv = require('dotenv')

dotenv.config({ path: './config.env' })

const firebaseConfig = {
  apiKey: process.env.FIREBASE_apiKey,
  authDomain: process.env.FIREBASE_authDomain,
  projectId: process.env.FIREBASE_projectId,
  storageBucket: process.env.FIREBASE_storageBucket,
  messagingSenderId: process.env.FIREBASE_messagingSenderId,
  appId: process.env.FIREBASE_appId
};

const firebaseApp = initializeApp(firebaseConfig);
const firebaseStorage = getStorage(firebaseApp)

module.exports = { firebaseApp, firebaseStorage }