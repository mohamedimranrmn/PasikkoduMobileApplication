import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    StyleSheet,
    Image,
    SafeAreaView
} from "react-native";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import * as Animatable from "react-native-animatable";

const Marketplace = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();
    const router = useRouter();

    useEffect(() => {
        const fetchItems = async () => {
            try {
                if (!user?.id) return;

                // Exclude items listed by the current user
                const q = query(
                    collection(db, "marketplace"),
                    where("clerkId", "!=", user.id)
                );
                const querySnapshot = await getDocs(q);
                const itemList = querySnapshot.docs
                    .map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }))
                    .filter((item) => item.status === "Active"); // Only show active items

                setItems(itemList);
            } catch (error) {
                console.error("Error fetching marketplace items:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, [user]);

    const MarketplaceItem = ({ item, index }) => {
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
                <View style={styles.itemCard}>
                    <View style={styles.cardContent}>
                        <Text style={styles.productName}>{item.product}</Text>
                        <Text style={styles.description}>{item.description}</Text>

                        <View style={styles.detailsContainer}>
                            {/* Show expiry date only if it exists */}
                            {item.expiryDate && (
                                <View style={styles.detailItem}>
                                    <Text style={styles.detailLabel}>Expiry:</Text>
                                    <Text style={styles.detailValue}>{item.expiryDate}</Text>
                                </View>
                            )}

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Price:</Text>
                                <Text style={styles.detailValue}>₹{item.price}</Text>
                            </View>

                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>Status:</Text>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>{item.status}</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() =>
                                router.push({
                                    pathname: "/screens/Checkout",
                                    params: {
                                        productName: item.product,
                                        price: item.price,
                                        productId: item.id,
                                    },
                                })
                            }
                            disabled={item.status !== "Active"}
                            style={[
                                styles.buyButton,
                                item.status !== "Active" && styles.disabledButton
                            ]}
                        >
                            <Text style={styles.buyButtonText}>
                                Buy Product
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Animatable.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Loading Modal */}
            <Modal
                transparent={true}
                animationType="fade"
                visible={loading}
                onRequestClose={() => {}}
            >
                <View style={styles.modalBackground}>
                    <Animatable.View
                        animation="fadeIn"
                        duration={300}
                        style={styles.modalContainer}
                        useNativeDriver
                    >
                        <ActivityIndicator size="large" color="#10b981" />
                        <Text style={styles.modalText}>
                            Loading marketplace items...
                        </Text>
                    </Animatable.View>
                </View>
            </Modal>

            <Text style={styles.header}>Marketplace</Text>

            {!loading && items.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No products available in the marketplace.</Text>
                </View>
            ) : (
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item, index }) => <MarketplaceItem item={item} index={index} />}
                />
            )}
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
        marginBottom: 20,
        marginTop: 8,
        textAlign: "center",
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
    itemCard: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        marginBottom: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardContent: {
        flex: 1,
        padding: 16,
    },
    productName: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 6,
    },
    description: {
        fontSize: 15,
        color: "#64748b",
        marginBottom: 16,
        lineHeight: 22,
    },
    detailsContainer: {
        marginBottom: 16,
    },
    detailItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 15,
        fontWeight: "600",
        color: "#4b5563",
        width: 60,
    },
    detailValue: {
        fontSize: 15,
        color: "#111827",
    },
    statusBadge: {
        backgroundColor: "#ecfdf5",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
        color: "#10b981",
        fontWeight: "600",
        fontSize: 14,
    },
    buyButton: {
        backgroundColor: "#10b981",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    disabledButton: {
        backgroundColor: "#d1d5db",
    },
    buyButtonText: {
        color: "#ffffff",
        fontWeight: "700",
        fontSize: 15,
    },

    // Modal Styles
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: "80%",
        backgroundColor: "#ffffff",
        borderRadius: 20,
        padding: 24,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    modalText: {
        marginTop: 16,
        textAlign: "center",
        fontSize: 16,
        color: "#4b5563",
        fontWeight: "500",
    },
});

export default Marketplace;