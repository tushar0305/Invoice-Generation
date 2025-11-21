import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export const haptics = {
    impact: async (style: ImpactStyle = ImpactStyle.Medium) => {
        if (isNative) {
            try {
                await Haptics.impact({ style });
            } catch (e) {
                // Ignore errors
            }
        }
    },
    notification: async (type: NotificationType = NotificationType.Success) => {
        if (isNative) {
            try {
                await Haptics.notification({ type });
            } catch (e) {
                // Ignore errors
            }
        }
    },
    vibrate: async () => {
        if (isNative) {
            try {
                await Haptics.vibrate();
            } catch (e) {
                // Ignore errors
            }
        }
    },
    selection: async () => {
        if (isNative) {
            try {
                await Haptics.selectionChanged();
            } catch (e) {
                // Ignore errors
            }
        }
    }
};
