import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    StyleSheet,
    Linking,
    Modal,
    Image,
    Pressable,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import {
    collection,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";

const Donations = () => {
    const { user } = useUser();
    const [tab, setTab] = useState<"donations" | "requests">("donations");
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [receiverInfo, setReceiverInfo] = useState<{ fullName: string; email: string } | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState("");

    const fetchData = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const colRef = collection(db, "donations");
            const q = query(
                colRef,
                where(tab === "donations" ? "clerkId" : "requestedBy", "==", user.id)
            );
            const snapshot = await getDocs(q);
            const items = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setData(items);
        } catch (err) {
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [tab]);

    const openInMaps = (location: any) => {
        if (location?.latitude && location?.longitude) {
            const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
            Linking.openURL(url);
        } else {
            Alert.alert("No Location", "No location data available for this item.");
        }
    };

    const handleDonationPress = async (item: any) => {
        if (tab === "donations") {
            if (item.status === "Completed" && item.requestedBy) {
                try {
                    // Query the users collection where clerkId is equal to requestedBy
                    const usersRef = collection(db, "users");
                    const q = query(usersRef, where("clerkId", "==", item.requestedBy));
                    const snapshot = await getDocs(q);

                    // Check if we found any user data
                    if (!snapshot.empty) {
                        const userData = snapshot.docs[0].data(); // Get the first matching user document
                        setReceiverInfo({
                            fullName: userData.name || "N/A", // Display name from the user document
                            email: userData.email || "N/A",  // Display email from the user document
                        });
                        setModalMessage("Receiver Information");
                    } else {
                        // In case no user data is found
                        setModalMessage("Receiver not found.");
                    }
                } catch (err) {
                    console.error("Error fetching receiver info:", err);
                    setReceiverInfo({ fullName: "Error", email: "Error" });
                    setModalMessage("Error fetching receiver information.");
                }
            } else {
                // For active donations, show message that donation is still active
                setReceiverInfo(null);
                setModalMessage("Donation is Active");
            }
            setModalVisible(true); // Display the modal with the message and receiver details
        }
    };

    const handleOutsidePress = () => {
        setModalVisible(false); // Close the modal when clicking outside
    };

    const DonationCard = ({ item, index }: { item: any; index: number }) => {
        const fadeIn = {
            from: { opacity: 0, translateY: 20 },
            to: { opacity: 1, translateY: 0 },
        };

        return (
            <Animatable.View
                animation={fadeIn}
                duration={500}
                delay={index * 100}
                useNativeDriver
            >
                <TouchableOpacity onPress={() => handleDonationPress(item)} activeOpacity={0.8}>
                    <View style={[styles.card, styles.cardShadow]}>
                        {item.foodImage && (
                            <Image
                                source={{ uri: item.foodImage }}
                                style={styles.foodImage}
                                resizeMode="cover"
                            />
                        )}
                        <View style={styles.cardContent}>
                            <Text style={styles.foodName}>{item.foodName}</Text>
                            <Text style={styles.description}>{item.description}</Text>
                            <View style={styles.expiryContainer}>
                                <Text style={styles.label}>Expiry:</Text>
                                <Text style={styles.value}>{new Date(item.expiryDate).toDateString()}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => openInMaps(item.location)}
                                style={styles.mapButton}
                            >
                                <Text style={styles.buttonText}>View Location</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Animatable.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, tab === "donations" && styles.activeTab]}
                    onPress={() => setTab("donations")}
                >
                    <Text style={[styles.tabText, tab === "donations" && styles.activeTabText]}>
                        My Donations
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, tab === "requests" && styles.activeTab]}
                    onPress={() => setTab("requests")}
                >
                    <Text style={[styles.tabText, tab === "requests" && styles.activeTabText]}>
                        My Requests
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#10b981" />
                </View>
            ) : data.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No {tab} found.</Text>
                </View>
            ) : (
                <FlatList
                    data={data}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    renderItem={({ item, index }) => <DonationCard item={item} index={index} />}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Modal for Receiver Info */}
            <Modal
                animationType="fade"
                transparent
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable style={styles.modalBackground} onPress={handleOutsidePress}>
                    <Animatable.View
                        animation="zoomIn"
                        duration={300}
                        style={styles.modalContainer}
                        useNativeDriver
                        onStartShouldSetResponder={() => true}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{modalMessage}</Text>
                        </View>
                        {receiverInfo ? (
                            <View style={styles.modalBody}>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Name:</Text>
                                    <Text style={styles.infoValue}>{receiverInfo?.fullName}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Email:</Text>
                                    <Text style={styles.infoValue}>{receiverInfo?.email}</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.modalBody}>
                                <Text style={styles.modalText}>
                                    This donation is currently active and waiting for someone to request it.
                                </Text>
                            </View>
                        )}
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </Animatable.View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9fafb",
        padding: 16,
    },
    header: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 16,
        marginTop: 8,
        marginLeft:15
    },
    tabContainer: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 24,
        backgroundColor: "#f1f5f9",
        borderRadius: 30,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 25,
    },
    activeTab: {
        backgroundColor: "#10b981",
    },
    tabText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#64748b",
    },
    activeTabText: {
        color: "#ffffff",
        fontWeight: "700",
    },
    loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        fontSize: 16,
        color: "#64748b",
        textAlign: "center",
    },
    listContainer: {
        paddingBottom: 100,
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 20,
        marginBottom: 16,
        overflow: "hidden",
    },
    cardShadow: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    foodImage: {
        width: "100%",
        height: 180,
    },
    cardContent: {
        padding: 16,
    },
    foodName: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 6,
    },
    description: {
        fontSize: 15,
        color: "#64748b",
        marginBottom: 12,
        lineHeight: 22,
    },
    expiryContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    label: {
        fontSize: 15,
        fontWeight: "600",
        color: "#4b5563",
        marginRight: 6,
    },
    value: {
        fontSize: 15,
        color: "#111827",
    },
    mapButton: {
        backgroundColor: "#10b981",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    buttonText: {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 15,
    },

    // Modal Styles
    modalBackground: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContainer: {
        width: "85%",
        backgroundColor: "#ffffff",
        borderRadius: 20,
        overflow: "hidden",
    },
    modalHeader: {
        backgroundColor: "#10b981",
        padding: 16,
        alignItems: "center",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#ffffff",
    },
    modalBody: {
        padding: 20,
    },
    infoRow: {
        flexDirection: "row",
        marginBottom: 10,
    },
    infoLabel: {
        fontSize: 16,
        fontWeight: "600",
        color: "#4b5563",
        width: 60,
    },
    infoValue: {
        fontSize: 16,
        color: "#111827",
        flex: 1,
    },
    modalText: {
        fontSize: 16,
        color: "#4b5563",
        textAlign: "center",
        lineHeight: 24,
    },
    closeButton: {
        backgroundColor: "#f3f4f6",
        padding: 14,
        alignItems: "center",
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    closeButtonText: {
        color: "#10b981",
        fontWeight: "700",
        fontSize: 16,
    },
});

export default Donations;