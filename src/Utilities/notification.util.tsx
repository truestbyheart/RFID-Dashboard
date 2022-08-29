import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';

export const sendAppNotification = async (message: string): Promise<void> => {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
    }

    if (permissionGranted) {
        sendNotification({ title: 'RFID APP', body: message });
    }
}