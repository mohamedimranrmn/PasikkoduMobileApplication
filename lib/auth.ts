import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { db } from "@/app/firebaseConfig";
import { addDoc, collection } from "firebase/firestore";

import { fetchAPI } from "@/lib/fetch";

export const tokenCache = {
    async getToken(key: string) {
        try {
            const item = await SecureStore.getItemAsync(key);
            if (item) {
                console.log(`${key} was used 🔐 \n`);
            } else {
                console.log("No values stored under key: " + key);
            }
            return item;
        } catch (error) {
            console.error("SecureStore get item error: ", error);
            await SecureStore.deleteItemAsync(key);
            return null;
        }
    },
    async saveToken(key: string, value: string) {
        try {
            return SecureStore.setItemAsync(key, value);
        } catch (err) {
            return;
        }
    },
};

export const googleOAuth = async (startOAuthFlow: any) => {
    try {
        const { createdSessionId, setActive, signUp } = await startOAuthFlow({
            redirectUrl: Linking.createURL("/(root)/(tabs)/home"),
        });

        if (createdSessionId) {
            if (setActive) {
                await setActive({ session: createdSessionId });

                // Only add to Firestore if this is a new user (has signUp object)
                if (signUp?.createdUserId) {
                    const fullName = `${signUp?.firstName ?? ""} ${signUp?.lastName ?? ""}`.trim();
                    const email = signUp?.emailAddress;

                    await addDoc(collection(db, "users"), {
                        name: fullName || "No Name",
                        email: email || "No Email",
                        clerkId: signUp.createdUserId,
                    });
                }

                return {
                    success: true,
                    code: "success",
                    message: "You have successfully signed in with Google",
                };
            }
        }

        return {
            success: false,
            message: "An error occurred while signing in with Google",
        };
    } catch (err: any) {
        console.error(err);
        return {
            success: false,
            code: err.code,
            message: err?.errors?.[0]?.longMessage || "Unknown error occurred",
        };
    }
};
