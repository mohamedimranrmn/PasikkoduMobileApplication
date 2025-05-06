import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/app/firebaseConfig";

export const registerForPushNotificationsAsync = async (userId: string) => {
    if (!Device.isDevice) {
        console.warn("Must use a physical device for Push Notifications");
        return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        console.warn("Push notification permission not granted");
        return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    if (token) {
        await setDoc(doc(db, "fcmTokens", userId), { token }); // Save token with userId
        console.log("✅ FCM token saved:", token);
    } else {
        console.warn("⚠️ Could not get FCM token");
    }

    if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
            name: "default",
            importance: Notifications.AndroidImportance.DEFAULT,
        });
    }
};
