import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
    Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, query, where, getDocs, collection } from "firebase/firestore";
import { useUser, useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import InputField from "@/components/InputField";
import { db, storage } from "@/app/firebaseConfig";

const Profile = () => {
    const { user } = useUser();
    const { signOut } = useAuth();
    const router = useRouter();

    const [userInfo, setUserInfo] = useState<any>(null);
    const [userDocId, setUserDocId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [userNotFound, setUserNotFound] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            if (!user?.id) return;

            try {
                const q = query(collection(db, "users"), where("clerkId", "==", user.id));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const docSnap = snapshot.docs[0];
                    setUserDocId(docSnap.id);
                    setUserInfo(docSnap.data());
                    setUserNotFound(false);
                } else {
                    setUserNotFound(true);
                    Alert.alert("Error", "No user found in database.");
                }
            } catch (err) {
                console.error("Error fetching user:", err);
                Alert.alert("Error", "Failed to fetch user.");
                setUserNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [user]);

    const pickImageAndUpload = async () => {
        if (!user?.id || !userDocId) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            const image = result.assets[0];
            const response = await fetch(image.uri);
            const blob = await response.blob();

            const imageRef = ref(storage, `profileImages/${user.id}.jpg`);

            try {
                setUploading(true);
                await uploadBytes(imageRef, blob);
                const downloadURL = await getDownloadURL(imageRef);

                await updateDoc(doc(db, "users", userDocId), {
                    profileImage: downloadURL,
                });

                setUserInfo((prev: any) => ({ ...prev, profileImage: downloadURL }));
                Alert.alert("Success", "Profile image updated!");
            } catch (error) {
                console.error("Upload error:", error);
                Alert.alert("Error", "Failed to upload image.");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            setUserInfo(null);
            router.replace("/(auth)/sign-up");
        }catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to log out.");
        }
    };

    const profileImageUri = userInfo?.profileImage || user?.imageUrl;

    // Load UI with user not found message when appropriate
    const renderContent = () => {
        if (userNotFound) {
            return (
                <View className="flex-1 items-center justify-center p-5">
                    <Ionicons name="alert-circle-outline" size={64} color="#f87171" />
                    <Text className="text-xl font-bold text-center mt-4 text-gray-800">User Not Found</Text>
                    <Text className="text-center mt-2 text-gray-600">
                        We couldn't find your profile information in our database.
                    </Text>
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="bg-red-500 flex-row items-center justify-center px-5 py-3 rounded-full mt-8"
                        style={{
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 3,
                            elevation: 4,
                        }}
                    >
                        <Ionicons name="log-out-outline" size={22} color="white" />
                        <Text className="text-white font-medium text-lg ml-2">Logout</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <ScrollView className="px-5" contentContainerStyle={{ paddingBottom: 100 }}>
                <Text className="text-3xl font-bold text-center mt-6 text-gray-800">My Profile</Text>

                <View className="items-center my-6">
                    <TouchableOpacity onPress={pickImageAndUpload} disabled={uploading}>
                        <View className="relative">
                            <Image
                                source={{ uri: profileImageUri }}
                                style={{ width: 120, height: 120, borderRadius: 60 }}
                                className="border-4 border-white shadow-md"
                            />
                            <View className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow">
                                <Feather name="edit-2" size={16} color="#555" />
                            </View>
                        </View>
                        {uploading && (
                            <Text className="text-xs text-gray-400 mt-2">Uploading...</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View className="bg-white rounded-xl shadow-md px-5 py-4 space-y-4">
                    <InputField
                        label="Name"
                        placeholder={userInfo?.name || "Not Found"}
                        containerStyle="w-full"
                        inputStyle="p-3.5 text-base"
                        editable={false}
                    />
                    <InputField
                        label="Email"
                        placeholder={userInfo?.email || "Not Found"}
                        containerStyle="w-full"
                        inputStyle="p-3.5 text-base"
                        editable={false}
                    />
                </View>

                <View className="items-center mt-10">
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="bg-red-500 flex-row items-center justify-center px-5 py-3 rounded-full w-2/3"
                        style={{
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 3,
                            elevation: 4,
                        }}
                    >
                        <Ionicons name="log-out-outline" size={22} color="white" />
                        <Text className="text-white font-medium text-lg ml-2">Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Loading Modal */}
            <Modal
                visible={loading}
                transparent={true}
                animationType="fade"
            >
                <View style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                }}>
                    <View style={{
                        backgroundColor: "white",
                        borderRadius: 10,
                        padding: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                    }}>
                        <ActivityIndicator size="large" color="#10b981" />
                        <Text style={{
                            marginTop: 15,
                            fontSize: 16,
                            textAlign: "center",
                            color: "#374151",
                        }}>
                            Please wait while fetching your information...
                        </Text>
                    </View>
                </View>
            </Modal>

            {!loading && renderContent()}
        </SafeAreaView>
    );
};

export default Profile;