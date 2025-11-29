// Web-only haptics implementation (no-op for browsers)
// Capacitor has been removed - mobile app will be handled separately

export enum ImpactStyle {
    Heavy = 'HEAVY',
    Medium = 'MEDIUM',
    Light = 'LIGHT',
}

export enum NotificationType {
    Success = 'SUCCESS',
    Warning = 'WARNING',
    Error = 'ERROR',
}

const isNative = false; // Always false in web-only mode

export const triggerImpact = async (_style: ImpactStyle = ImpactStyle.Medium) => {
    // No-op for web
    return;
};

export const triggerNotification = async (_type: NotificationType = NotificationType.Success) => {
    // No-op for web
    return;
};

export const triggerSelection = async () => {
    // No-op for web
    return;
};

export const triggerVibration = async () => {
    // No-op for web - browsers can use navigator.vibrate if needed
    if ('vibrate' in navigator) {
        navigator.vibrate(10);
    }
};

export const haptics = {
    impact: triggerImpact,
    notification: triggerNotification,
    selection: triggerSelection,
    vibration: triggerVibration,
};
