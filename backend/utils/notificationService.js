import admin from 'firebase-admin';
import User from '../models/User.js';

// Initialize Firebase Admin (you'll need to add your service account)
let firebaseInitialized = false;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    firebaseInitialized = true;
    console.log('✅ Firebase initialized for push notifications');
  } else {
    console.log('⚠️ Firebase credentials not found, push notifications disabled');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// Send push notification to a single device
export const sendPushNotification = async (fcmToken, notification) => {
  if (!firebaseInitialized || !fcmToken) {
    return { success: false, error: 'Firebase not initialized or no token' };
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default'
          }
        }
      },
      webpush: {
        headers: {
          Urgency: 'high'
        },
        notification: {
          icon: notification.image || '/logo192.png',
          badge: '/badge.png',
          requireInteraction: true
        }
      }
    };

    if (notification.image) {
      message.notification.image = notification.image;
    }

    const response = await admin.messaging().send(message);
    return { success: true, response };
  } catch (error) {
    console.error('Push notification error:', error);
    
    // If token is invalid, remove it from user
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      await User.findOneAndUpdate(
        { fcmToken },
        { $unset: { fcmToken: 1 } }
      );
    }
    
    return { success: false, error: error.message };
  }
};

// Send push notification to multiple devices
export const sendBulkPushNotifications = async (tokens, notification) => {
  if (!firebaseInitialized || !tokens || tokens.length === 0) {
    return { success: false, error: 'Firebase not initialized or no tokens' };
  }

  try {
    const messages = tokens.map(token => ({
      token,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      android: {
        priority: 'high'
      },
      webpush: {
        notification: {
          icon: notification.image || '/logo192.png'
        }
      }
    }));

    const response = await admin.messaging().sendAll(messages);
    return { success: true, response };
  } catch (error) {
    console.error('Bulk push notification error:', error);
    return { success: false, error: error.message };
  }
};

// Send notification to topic
export const sendTopicNotification = async (topic, notification) => {
  if (!firebaseInitialized) {
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const message = {
      topic,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {}
    };

    const response = await admin.messaging().send(message);
    return { success: true, response };
  } catch (error) {
    console.error('Topic notification error:', error);
    return { success: false, error: error.message };
  }
};

// Subscribe user to topic
export const subscribeToTopic = async (tokens, topic) => {
  if (!firebaseInitialized) {
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    return { success: true, response };
  } catch (error) {
    console.error('Subscribe to topic error:', error);
    return { success: false, error: error.message };
  }
};

// Unsubscribe user from topic
export const unsubscribeFromTopic = async (tokens, topic) => {
  if (!firebaseInitialized) {
    return { success: false, error: 'Firebase not initialized' };
  }

  try {
    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    return { success: true, response };
  } catch (error) {
    console.error('Unsubscribe from topic error:', error);
    return { success: false, error: error.message };
  }
};