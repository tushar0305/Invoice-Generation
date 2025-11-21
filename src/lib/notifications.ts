import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export async function registerPushNotifications() {
    if (!Capacitor.isNativePlatform()) {
        console.log('Push notifications not available on web');
        return;
    }

    try {
        // Check permission first
        const permStatus = await PushNotifications.checkPermissions();

        // If already granted, register. Otherwise request permission
        if (permStatus.receive === 'granted') {
            await PushNotifications.register();
            console.log('Push notifications already granted, registering...');
        } else if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
            // Request permission
            const result = await PushNotifications.requestPermissions();
            if (result.receive === 'granted') {
                await PushNotifications.register();
                console.log('Push notification permission granted, registering...');
            } else {
                console.warn('Push notification permission denied');
            }
        } else {
            console.warn('Push notification permission already denied');
        }
    } catch (e) {
        console.error('Failed to register push notifications:', e);
        // Don't throw - just log the error
    }
}

export function addPushListeners() {
    if (!Capacitor.isNativePlatform()) return;

    try {
        // Remove all existing listeners first
        PushNotifications.removeAllListeners();

        // Registration success
        PushNotifications.addListener('registration', (token) => {
            console.log('Push registration success, token: ' + token.value);
            // Store token in localStorage for later use
            try {
                localStorage.setItem('fcm_token', token.value);
            } catch (e) {
                console.error('Failed to store FCM token:', e);
            }
        });

        // Registration error
        PushNotifications.addListener('registrationError', (error) => {
            console.error('Error on registration: ' + JSON.stringify(error));
        });

        // Show notification when app is open (foreground)
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
            console.log('Push received: ', notification);
            // Just log for now - don't try to show toast which might cause issues
        });

        // Action performed (e.g. user tapped notification)
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
            console.log('Push action performed: ', notification);
            // TODO: Navigate to specific page based on notification data
        });
    } catch (e) {
        console.error('Failed to add push listeners:', e);
        // Don't throw - just log the error
    }
}
