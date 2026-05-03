import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js';
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: 'AIzaSyDtdImkXPHSl695_pbtRqGCp5pEY7rwyjo',
    authDomain: 'kanban-b477a.firebaseapp.com',
    projectId: 'kanban-b477a',
    storageBucket: 'kanban-b477a.firebasestorage.app',
    messagingSenderId: '1046969762051',
    appId: '1:1046969762051:web:5dafffb96c9ad161aaa936'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.firebaseDB = db;
window.firebaseDoc = doc;
window.firebaseSetDoc = setDoc;
window.firebaseGetDoc = getDoc;
window.firebaseOnSnapshot = onSnapshot;
window.firebaseCollection = collection;
window.firebaseQuery = query;
window.firebaseWhere = where;
window.firebaseGetDocs = getDocs;
window.firebaseReady = true;

document.dispatchEvent(new Event('firebaseReady'));
