// Firebase configuration and initialization in plain JS
// Include this script in each HTML page that needs Firebase

// Firebase SDKs to include in HTML:
//<script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js"></script>
//<script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore-compat.js"></script>

const firebaseConfig = {
    apiKey: "AIzaSyAt3R2DgxgIF-d50_VJJX3RhqpbWEHy3JA",
    authDomain: "smartlockdoorpin.firebaseapp.com",
    projectId: "smartlockdoorpin",
    storageBucket: "",
    messagingSenderId: "907496052447",
    appId: "1:907496052447:web:3656b89ec43f8f77e77b6a"
  };
  
  // Initialize Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.firestore();
  
  // Expose db globally so other scripts can access it
  window.db = db;
  