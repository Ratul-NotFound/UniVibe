// UniVibe Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDKvSsbTDClIe3Q20lFxZxnTN5Sgb1VSQ4",
  authDomain: "univibe-6d283.firebaseapp.com",
  projectId: "univibe-6d283",
  storageBucket: "univibe-6d283.firebasestorage.app",
  messagingSenderId: "639123400730",
  appId: "1:639123400730:web:a321f03f162bfb992b89a3"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'UniVibe Alert';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'Check your frequency for updates.',
    icon: '/univibe-logo.png',
    badge: '/favicon.svg',
    tag: payload.data?.chatId || 'univibe-notification',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
