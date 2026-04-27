import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    // Expo projectId is required for Expo SDK 49+
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    console.log("[Notifications] Using projectId:", projectId);
    if (!projectId) {
      console.warn('[Notifications] No EAS projectId found. If you are using Expo SDK 49+, this is required for getExpoPushTokenAsync.');
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log("[Notifications] Push Token found:", token);
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('sos-alerts', {
        name: 'SOS Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF0000',
        sound: 'default',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
      console.log("[Notifications] Android notification channel 'sos-alerts' configured.");
    }

    return token;
  } catch (error) {
    console.error("Error in registerForPushNotificationsAsync:", error);
    return null;
  }
}
