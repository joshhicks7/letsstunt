// Import Firebase compat libraries (required for service worker)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
  apiKey: "AIzaSyDfK8x3VPpBGV_18F_IHMu2OWnrWPmCTnM",
  authDomain: "test-taking.firebaseapp.com",
  projectId: "test-taking",
  storageBucket: "test-taking.firebasestorage.app",
  messagingSenderId: "67596527743",
  appId: "1:67596527743:web:9defd95a454e740b81774a",
});

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || 'Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    //icon: '/favicon.ico', // optional
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});