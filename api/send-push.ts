import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin once
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin init error:', error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { toUid, title, body, link, fcmTokens } = req.body;

  if (!toUid || !title || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    let tokens = fcmTokens;
    
    // If tokens weren't provided in the request, fetch them from Firestore
    if (!tokens || tokens.length === 0) {
      const userDoc = await admin.firestore().collection('users').doc(toUid).get();
      if (userDoc.exists) {
        tokens = userDoc.data()?.fcmTokens || [];
      }
    }

    if (!tokens || tokens.length === 0) {
      return res.status(200).json({ success: true, message: 'No active registration tokens found for user' });
    }

    // Clean up empty or invalid tokens
    const validTokens = tokens.filter((t: string) => t && typeof t === 'string' && t.length > 0);

    if (validTokens.length === 0) {
      return res.status(200).json({ success: true, message: 'No valid tokens found' });
    }

    // Construct the message payload
    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: {
        click_action: link || '/',
        notification_type: 'push'
      },
      tokens: validTokens,
    };

    // Send messages
    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`Push notification summary: ${response.successCount} success, ${response.failureCount} failure`);

    // Optionally: You could cleanup failed tokens here
    
    return res.status(200).json({ 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount 
    });
  } catch (error: any) {
    console.error('Critical FCM Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
