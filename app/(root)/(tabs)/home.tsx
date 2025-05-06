import React, { useEffect, useState, useRef, useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Dimensions,
    Alert,
    SafeAreaView, ImageSourcePropType, Image,
    StyleSheet
} from "react-native";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/app/firebaseConfig";
import { registerForPushNotificationsAsync } from "@/utils/notifications";
import * as Notifications from "expo-notifications";
import Toast from "react-native-toast-message";
import logOutIcon from "@/assets/icons/logout.png";

const HomeScreen = () => {
    const router = useRouter();
    const { user } = useUser();
    const { signOut } = useAuth();
    const scaleValue = useRef(new Animated.Value(1)).current;
    const [firestoreName, setFirestoreName] = useState("");
    const [loading, setLoading] = useState(true);

    const handlePress = (route: string) => {
        Animated.sequence([
            Animated.timing(scaleValue, { toValue: 0.95, duration: 100, useNativeDriver: true }),
            Animated.timing(scaleValue, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start(() => router.push(route as any));
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return;

            try {
                const q = query(collection(db, "users"), where("clerkId", "==", user.id));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const userDoc = snapshot.docs[0].data();
                    setFirestoreName(userDoc.name || "Friend");
                } else {
                    setFirestoreName("Guest");
                }

                await registerForPushNotificationsAsync(user.id);
            } catch (err) {
                console.error("Error:", err);
                setFirestoreName("Guest");
                Toast.show({
                    type: "error",
                    text1: "Error fetching data",
                    text2: "Please try again later.",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        const sub = Notifications.addNotificationReceivedListener((notification) => {
            Toast.show({
                type: "info",
                text1: notification.request.content.title || "New Notification",
                text2: notification.request.content.body || "",
            });
        });

        return () => sub.remove();
    }, [user]);

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                onPress: async () => {
                    try {
                        await signOut();
                        router.replace("/(auth)/sign-up");
                    } catch (error) {
                        console.error("Logout error:", error);
                        Toast.show({
                            type: "error",
                            text1: "Logout failed",
                            text2: "Please try again later.",
                        });
                    }
                },
            },
        ]);
    };

    const screenWidth = Dimensions.get("window").width;

    const menuItems = useMemo(() => [
        { icon: "hand-holding-heart", label: "Donate", color: "#E63946", route: "/screens/DonateFood" },
        { icon: "handshake", label: "Receive", color: "#1D3557", route: "/screens/RequestFood" },
        { icon: "map-marker-alt", label: "Sell", color: "#E63946", route: "/screens/ListSurplus" },
        { icon: "shopping-bag", label: "Buy", color: "#1D3557", route: "/screens/Marketplace" },
        { icon: "group-add", label: "Volunteer", color: "#2A9D8F", route: "/screens/VolunteersScreen", type: "MaterialIcons" },
        { icon: "users", label: "About Us", color: "#E63946", route: "/screens/AboutUs" },
    ], []);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LinearGradient colors={["#f5f8f7", "#ffffff"]} style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 20, paddingTop: 10 }}>
                    <TouchableOpacity onPress={handleLogout}>
                        <Image
                            source={logOutIcon}
                            style={{ width: 36, height: 36, marginRight:5}}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>
                </View>

                <View style={{ paddingHorizontal: 24 }}>
                    <Text style={{ fontSize: 25, fontWeight: "bold", color: "#1D3557", textAlign: "center", marginTop: 30, marginBottom: 10 }}>
                        Let's fight hunger together,{" "}
                        <Text style={{ color: "#E63946"}}>{firestoreName || "Friend"}</Text>!
                    </Text>
                    <Text style={{ fontSize: 16, color: "#6c757d", textAlign: "center", marginTop: 8 }}>
                        Welcome to{" "}
                        <Text style={{ fontWeight: "bold", color: "#1E90FF", fontSize: 20 }}>Pasikkodu!</Text>
                    </Text>
                </View>

                <View style={{ flex: 1, paddingTop: 30, paddingBottom: 20 }}>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-evenly" }}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.85}
                                onPress={() => handlePress(item.route)}
                                style={{
                                    width: screenWidth * 0.4,
                                    backgroundColor: "#fff",
                                    borderRadius: 20,
                                    paddingVertical: 22,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 20,
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 5 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 8,
                                    elevation: 6,
                                }}
                            >
                                {item.type === "MaterialIcons" ? (
                                    <MaterialIcons name={item.icon} size={36} color={item.color} />
                                ) : (
                                    <FontAwesome5 name={item.icon} size={36} color={item.color} />
                                )}
                                <Text style={{ fontSize: 16, fontWeight: "600", marginTop: 10, color: "#333", textAlign: "center" }}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </LinearGradient>
        </SafeAreaView>
    );
};
const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: "black",
        borderRadius: 50,
        marginHorizontal: 25,
        marginBottom: 35,
        height: 59,
        position: "absolute",
        flexDirection: "row",
        alignItems: "center", // Ensures vertical alignment of icons
        justifyContent: "space-around",
        paddingHorizontal: 10,
        paddingBottom: 20,
        elevation: 10, // Android shadow
        shadowColor: "#000", // iOS shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    iconContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    icon: {
        width: 28,
        height: 28,
        tintColor: "white",
    },
    iconFocused: {
        tintColor: "#f87171",
    },
});

export default HomeScreen;
