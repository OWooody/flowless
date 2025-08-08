import { PrismaClient } from '@prisma/client';
import * as webpush from 'web-push';

const prisma = new PrismaClient();

// Firebase Admin SDK configuration
// Note: You'll need to add FIREBASE_SERVICE_ACCOUNT_KEY to your .env
const FIREBASE_CONFIG = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

interface SendNotificationResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  errors: string[];
}

class PushNotificationService {
  private firebaseAdmin: any = null;

  constructor() {
    this.initializeFirebase();
    this.initializeWebPush();
  }

  private async initializeFirebase() {
    try {
      // Dynamically import firebase-admin to avoid issues in development
      const admin = await import('firebase-admin');
      
      if (!admin.apps.length) {
        this.firebaseAdmin = admin.initializeApp({
          credential: admin.credential.cert(FIREBASE_CONFIG as any),
        });
      } else {
        this.firebaseAdmin = admin.app();
      }
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
      // For development, we'll use a mock implementation
      this.firebaseAdmin = null;
    }
  }

  private initializeWebPush() {
    try {
      // Set VAPID details for web push
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
      
      if (vapidPublicKey && vapidPrivateKey) {
        webpush.setVapidDetails(
          'mailto:your-email@example.com', // Replace with your email
          vapidPublicKey,
          vapidPrivateKey
        );
        console.log('Web Push VAPID configured');
      } else {
        console.log('VAPID keys not configured, web push will use mock implementation');
      }
    } catch (error) {
      console.error('Failed to initialize Web Push:', error);
    }
  }

  async sendNotificationToUsers(
    userIds: string[],
    payload: PushNotificationPayload,
    campaignId?: string
  ): Promise<SendNotificationResult> {
    const result: SendNotificationResult = {
      success: false,
      sentCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      // Get push subscriptions for the users
      const subscriptions = await prisma.pushSubscription.findMany({
        where: {
          userId: { in: userIds },
          isActive: true,
        },
      });

      if (subscriptions.length === 0) {
        result.errors.push('No active push subscriptions found for the target users');
        return result;
      }

      // Create delivery records only if campaignId is provided
      if (campaignId) {
        const deliveryRecords = userIds.map(userId => ({
          campaignId,
          userId,
          status: 'pending' as const,
        }));

        await prisma.campaignDelivery.createMany({
          data: deliveryRecords,
        });
      }

      // Send notifications
      const sendPromises = subscriptions.map(async (subscription) => {
        try {
          await this.sendToSubscription(subscription, payload);
          
          // Update delivery record only if campaignId is provided
          if (campaignId) {
            await prisma.campaignDelivery.updateMany({
              where: {
                userId: subscription.userId,
                campaignId,
              },
              data: {
                status: 'sent',
                sentAt: new Date(),
                pushEndpoint: subscription.endpoint,
              },
            });
          }

          result.sentCount++;
        } catch (error) {
          console.error(`Failed to send notification to ${subscription.userId}:`, error);
          
          // Update delivery record with error only if campaignId is provided
          if (campaignId) {
            await prisma.campaignDelivery.updateMany({
              where: {
                userId: subscription.userId,
                campaignId,
              },
              data: {
                status: 'failed',
                sentAt: new Date(),
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                pushEndpoint: subscription.endpoint,
              },
            });
          }

          result.failedCount++;
          result.errors.push(`User ${subscription.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      await Promise.all(sendPromises);
      result.success = true;

    } catch (error) {
      console.error('Error sending notifications:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  private async sendToSubscription(subscription: { userId: string; endpoint: string; p256dh: string; auth: string }, payload: PushNotificationPayload) {
    console.log('Attempting to send notification to subscription:', subscription.endpoint);
    console.log('Payload:', payload);
    
    // Check if this is a web push subscription (starts with https://)
    const isWebPushSubscription = subscription.endpoint.startsWith('https://');
    
    if (isWebPushSubscription) {
      // For web push subscriptions, we need to use the Web Push API
      console.log('Detected web push subscription, using Web Push API');
      
      if (!this.firebaseAdmin) {
        // Mock implementation for development
        console.log('Using MOCK implementation (Firebase not configured)');
        console.log('Mock sending web push notification:', {
          endpoint: subscription.endpoint,
          payload,
        });
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Simulate 95% success rate
        if (Math.random() < 0.95) {
          console.log('Mock web push notification sent successfully');
          return;
        } else {
          console.log('Mock web push notification failed');
          throw new Error('Mock delivery failure');
        }
      }
      
      // For web push, use the web-push library
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        const notificationPayload = JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: payload.icon,
          badge: payload.badge,
          tag: payload.tag,
          data: payload.data || {},
          actions: payload.actions || [],
        });

        console.log('Sending web push notification to:', subscription.endpoint);
        
        // Check if VAPID is configured
        if (!process.env.VAPID_PRIVATE_KEY) {
          console.log('VAPID not configured, using mock web push');
          // Simulate web push for development
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log('Mock web push notification sent successfully');
          return;
        }
        
        const result = await webpush.sendNotification(pushSubscription, notificationPayload);
        console.log('Web push notification sent successfully:', result.statusCode);
      } catch (error) {
        console.error('Error sending web push notification:', error);
        throw error;
      }
    } else {
      // This is an FCM token (mobile app)
      console.log('Detected FCM token, using Firebase Admin SDK');
      
      if (!this.firebaseAdmin) {
        console.log('Firebase not configured, cannot send to FCM token');
        throw new Error('Firebase not configured for FCM tokens');
      }

      // FCM v1 API implementation for mobile
      const message = {
        message: {
          token: subscription.endpoint, // FCM token
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: payload.data || {},
        },
      };

      try {
        // Use FCM v1 API
        const response = await this.firebaseAdmin.messaging().send(message);
        console.log('Successfully sent FCM v1 message:', response);
      } catch (error) {
        console.error('Error sending FCM v1 message:', error);
        throw error;
      }
    }
  }

  async trackNotificationOpen(userId: string, campaignId?: string) {
    if (!campaignId) return;
    
    await prisma.campaignDelivery.updateMany({
      where: {
        userId,
        campaignId,
        status: { in: ['sent', 'delivered'] },
      },
      data: {
        status: 'opened',
        openedAt: new Date(),
      },
    });
  }

  async trackNotificationClick(userId: string, campaignId?: string) {
    if (!campaignId) return;
    
    await prisma.campaignDelivery.updateMany({
      where: {
        userId,
        campaignId,
        status: { in: ['sent', 'delivered', 'opened'] },
      },
      data: {
        status: 'clicked',
        clickedAt: new Date(),
      },
    });
  }
}

export const pushNotificationService = new PushNotificationService();
export type { PushNotificationPayload, SendNotificationResult }; 