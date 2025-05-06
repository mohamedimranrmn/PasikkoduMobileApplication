const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { sendEmailToDonor } = require("./email");
const { sendPushNotification } = require("./pushNotification");
const { sendExpiryEmailToDonor } = require("./expiredDonation"); // ✅ NEW IMPORT

admin.initializeApp();
const db = admin.firestore();

// ✅ 1. Notify donor when a donation is marked as "Completed"
exports.notifyDonorOnRequest = functions.firestore
    .document("donations/{donationId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        if (before.status === "Active" && after.status === "Completed") {
            const donation = after;

            try {
                const donorSnapshot = await db
                    .collection("users")
                    .where("clerkId", "==", donation.clerkId)
                    .get();

                if (donorSnapshot.empty) {
                    console.log("❌ No donor found for clerkId:", donation.clerkId);
                    return;
                }

                const donor = donorSnapshot.docs[0].data();

                const receiverSnapshot = await db
                    .collection("users")
                    .where("clerkId", "==", donation.requestedBy)
                    .get();

                if (receiverSnapshot.empty) {
                    console.log("❌ No receiver found for clerkId:", donation.requestedBy);
                    return;
                }

                const receiver = receiverSnapshot.docs[0].data();

                await sendEmailToDonor(donor.email, donor.name || "Donor", {
                    name: receiver.name,
                    email: receiver.email,
                    phone: receiver.phone,
                });

                console.log("✅ Email sent to donor:", donor.email);
            } catch (error) {
                console.error("🚨 Error in notifyDonorOnRequest:", error.message);
            }
        }
    });

// ✅ 2. Send push notifications when a new donation is created
exports.sendDonationNotification = functions.firestore
    .document("donations/{donationId}")
    .onCreate(async (snap, context) => {
        const donation = snap.data();
        const donorId = donation.clerkId;

        try {
            const usersSnapshot = await db.collection("fcmTokens").get();
            const tokens = [];

            usersSnapshot.forEach((doc) => {
                const userId = doc.id;
                const token = doc.data().token;

                if (userId !== donorId && token) {
                    tokens.push(token);
                }
            });

            if (tokens.length > 0) {
                const message = {
                    notification: {
                        title: "New Donation Alert!",
                        body: `${donation.foodName || "Food"} is ready for pickup.`,
                    },
                    android: {
                        notification: {
                            sound: "default",
                            priority: "high",
                        },
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: "default",
                                contentAvailable: true,
                                priority: "high",
                            },
                        },
                    },
                    tokens,
                };

                await admin.messaging().sendMulticast(message);
                console.log("✅ Push notifications sent.");
            } else {
                console.log("ℹ️ No tokens found to send push notifications.");
            }
        } catch (error) {
            console.error("🚨 Error sending push notification:", error.message);
        }
    });

// ✅ 3. Scheduled function to delete expired donations and notify donor
exports.deleteExpiredDonations = functions.pubsub
    .schedule("every 1 hours") // Adjust timing as needed
    .onRun(async (context) => {
        const now = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
        console.log("🔍 Checking for expired donations as of", now);

        try {
            const snapshot = await db.collection("donations")
                .where("expiryDate", "<", now)
                .where("status", "!=", "Completed")
                .get();

            if (snapshot.empty) {
                console.log("✅ No expired donations found.");
                return null;
            }

            for (const doc of snapshot.docs) {
                const data = doc.data();

                // Get donor details
                const donorSnap = await db
                    .collection("users")
                    .where("clerkId", "==", data.clerkId)
                    .limit(1)
                    .get();

                if (!donorSnap.empty) {
                    const donorData = donorSnap.docs[0].data();
                    const email = donorData.email;
                    const donorName = donorData.name || "Donor";

                    // ✅ Send expiry email
                    await sendExpiryEmailToDonor(
                        email,
                        donorName,
                        data.foodName,
                        data.location?.locationName || "your location"
                    );
                }

                // ✅ Delete the expired donation
                await doc.ref.delete();
                console.log(`Deleted expired donation: ${doc.id}`);
            }

            return null;
        } catch (error) {
            console.error("Error deleting expired donations:", error.message);
        }
    });
