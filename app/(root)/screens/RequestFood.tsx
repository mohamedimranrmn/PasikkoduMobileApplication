import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    RefreshControl,
    Platform
} from "react-native";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useUser } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";

const RequestFood = () => {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { user } = useUser();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const addLocationNames = async (donationList: any[]) => {
        const updatedList = await Promise.all(
            donationList.map(async (donation) => {
                try {
                    const geocode = await Location.reverseGeocodeAsync({
                        latitude: donation.location.latitude,
                        longitude: donation.location.longitude,
                    });

                    const locationName =
                        geocode[0]?.district || geocode[0]?.city || "Unknown";
                    return { ...donation, locationName };
                } catch (e) {
                    console.error("Reverse geocode failed:", e);
                    return { ...donation, locationName: "Unknown" };
                }
            })
        );
        return updatedList;
    };

    const fetchDonations = async () => {
        try {
            if (!user || !user.id) return;
            if (!refreshing) setLoading(true);

            const q = query(
                collection(db, "donations"),
                where("status", "==", "Active")
            );
            const querySnapshot = await getDocs(q);

            const donationsData = querySnapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter((donation) => donation.clerkId !== user.id);

            const withLocations = await addLocationNames(donationsData);
            setDonations(withLocations);
        } catch (error) {
            console.error("Error fetching donations:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDonations();
    }, [user]);

    const handleRequestDonation = async (donationId) => {
        Alert.alert(
            "Request Food",
            "Would you like to request this donation?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes",
                    onPress: async () => {
                        try {
                            await updateDoc(doc(db, "donations", donationId), {
                                status: "Completed",
                                requestedBy: user?.id,
                            });
                            fetchDonations();
                            Alert.alert("Success", "Donation has been marked as completed.");
                        } catch (error) {
                            console.error("Error updating donation:", error);
                            Alert.alert("Error", "Could not update donation.");
                        }
                    }
                }
            ]
        );
    };

    const renderDonationCard = ({ item }: any) => (
        <View style={styles.card}>
            <View style={styles.topRow}>
                <TouchableOpacity onPress={() => setSelectedImage(item.foodImage)} style={styles.imageContainer}>
                    {item.foodImage ? (
                        <Image
                            source={{ uri: item.foodImage }}
                            style={styles.foodImage}
                            onError={(e) => console.log("Image load error", e.nativeEvent)}
                        />
                    ) : (
                        <View style={styles.noImageContainer}>
                            <Text style={styles.noImageText}>No image found</Text>
                        </View>
                    )}
                </TouchableOpacity>
                {Platform.OS !== "web" && (
                    <MapView
                        style={{ height: 200, width: "100%", borderRadius: 10 }}
                        initialRegion={{
                            latitude: item.location.latitude,
                            longitude: item.location.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                        scrollEnabled={true}
                        zoomEnabled={true}
                        pitchEnabled={true}
                        rotateEnabled={false}
                        pointerEvents="none"
                    >
                        <Marker
                            coordinate={item.location}
                            title="Donation Location"
                        />
                    </MapView>
                )}
                {Platform.OS === "web" && (
                    <Text style={{ marginTop: 10, color: "#64748b", fontStyle: "italic" }}>
                        Map preview is not supported on web.
                    </Text>
                )}
            </View>

            <View style={styles.textContainer}>
                <Text style={styles.title}>{item.foodName}</Text>
                <Text style={styles.description}>{item.description}</Text>
                <Text style={styles.meta}>
                    Expiry: {new Date(item.expiryDate).toDateString()}
                </Text>
                <Text style={styles.meta}>Location: {item.locationName}</Text>

                <TouchableOpacity
                    style={styles.requestButton}
                    onPress={() => handleRequestDonation(item.id)}
                >
                    <Text style={styles.requestButtonText}>Request Food</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, padding: 16, backgroundColor: "#f8fafc" }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 15,textAlign:"center"}}>Request Food</Text>

            {/* Loading Modal - Direct implementation instead of component */}
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
                            Please wait, Fetching the available donations...
                        </Text>
                    </View>
                </View>
            </Modal>

            {!user ? (
                <ActivityIndicator size="large" color="#007BFF" style={{ flex: 1 }} />
            ) : donations.length === 0 && !loading ? (
                <Text>No active donations available.</Text>
            ) : (
                <FlatList
                    data={donations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderDonationCard}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => {
                            setRefreshing(true);
                            fetchDonations();
                        }} />
                    }
                />
            )}

            <Modal visible={!!selectedImage} transparent animationType="fade">
                <Pressable style={styles.modalContainer} onPress={() => setSelectedImage(null)}>
                    {selectedImage && (
                        <Image
                            source={{ uri: selectedImage }}
                            style={styles.fullscreenImage}
                        />
                    )}
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        marginBottom: 20,
        borderRadius: 12,
        overflow: "hidden",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        borderColor: "#e2e8f0",
        borderWidth: 1,
    },
    topRow: {
        flexDirection: "row",
        height: 200,
    },
    imageContainer: {
        width: "50%",
        height: "100%",
        overflow: "hidden",
    },
    foodImage: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    map: {
        width: "50%",
        height: "100%",
    },
    textContainer: {
        padding: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 10,
    },
    description: {
        color: "#4b5563",
        marginTop: 4,
    },
    meta: {
        color: "#64748b",
        marginTop: 4,
    },
    requestButton: {
        marginTop: 10,
        backgroundColor: "#10b981",
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 6,
        justifyContent:"center",
        alignItems: "center",
    },
    requestButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.9)",
        justifyContent: "center",
        alignItems: "center",
    },
    fullscreenImage: {
        width: "90%",
        height: "70%",
        resizeMode: "contain",
    },
    noImageContainer: {
        width: "100%",
        height: "100%",
        backgroundColor: "#e2e8f0",
        justifyContent: "center",
        alignItems: "center",
    },
    noImageText: {
        color: "#475569",
        fontStyle: "italic",
    },
    loadingModalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    loadingModalContent: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 12,
        alignItems: "center",
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        minWidth: 250,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: "500",
        color: "#333",
    },
});

export default RequestFood;