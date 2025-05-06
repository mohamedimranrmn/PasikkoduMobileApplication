const { Expo } = require("expo-server-sdk");

const expo = new Expo();

const sendPushNotification = async (expoPushToken, title, body) => {
    if (!Expo.isExpoPushToken(expoPushToken)) {
        console.log("❌ Invalid Expo push token:", expoPushToken);
        return;
    }

    const messages = [{
        to: expoPushToken,
        sound: "default",
        title,
        body,
    }];

    try {
        const chunks = expo.chunkPushNotifications(messages);
        for (let chunk of chunks) {
            const tickets = await expo.sendPushNotificationsAsync(chunk);
            console.log("✅ Push notification sent:", tickets);
        }
    } catch (error) {
        console.error("🚨 Expo push notification error:", error.message);
    }
};

module.exports = {
    sendPushNotification,
};
