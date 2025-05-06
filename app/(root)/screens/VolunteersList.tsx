import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    StyleSheet,
    FlatList,
    ActivityIndicator
} from "react-native";
import {
    collection,
    doc,
    updateDoc,
    onSnapshot,
    query,
    orderBy,
    where
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useUser } from "@clerk/clerk-expo";

const VolunteersList = () => {
    const { user, isSignedIn } = useUser();

    // State
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("All");

    // Fetch volunteers with optional filtering
    useEffect(() => {
        const volunteersRef = collection(db, "volunteers");
        let volunteersQuery = query(volunteersRef, orderBy("registeredAt", "desc"));

        if (filterStatus !== "All") {
            volunteersQuery = query(volunteersRef,
                where("status", "==", filterStatus),
                orderBy("registeredAt", "desc")
            );
        }

        const unsubscribe = onSnapshot(
            volunteersQuery,
            (snapshot) => {
                const list = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    // Format timestamp for display
                    formattedDate: doc.data().registeredAt?.toDate().toLocaleDateString() || "Unknown date"
                }));
                setVolunteers(list);
                setLoading(false);
            },
            (error) => {
                console.error("Volunteer fetch error:", error);
                setLoading(false);
                Alert.alert("Error", "Could not load volunteers. Please try again.");
            }
        );

        return () => unsubscribe();
    }, [filterStatus]);

    const updateVolunteerStatus = async (volunteerId, newStatus) => {
        if (!isSignedIn) {
            Alert.alert("Authentication Required", "Please log in to update volunteer status.");
            return;
        }

        try {
            const docRef = doc(db, "volunteers", volunteerId);
            await updateDoc(docRef, {
                status: newStatus,
                lastUpdated: new Date()
            });
            Alert.alert("Updated", `Volunteer marked as ${newStatus}.`);
        } catch (error) {
            console.error("Update error:", error);
            Alert.alert("Error", "Could not update status.");
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case "Available": return "#2563eb"; // Blue
            case "Registered": return "#10b981"; // Green
            case "Inactive": return "#ef4444"; // Red
            default: return "#6b7280"; // Gray
        }
    };

    const renderVolunteer = ({ item }) => (
        <View style={styles.volunteerCard}>
            <Text style={styles.volunteerName}>{item.name}</Text>
            <Text style={styles.volunteerInfo}>📍 {item.location}</Text>
            <Text style={styles.volunteerInfo}>📞 {item.contact}</Text>
            {item.email && <Text style={styles.volunteerInfo}>✉️ {item.email}</Text>}
            {item.preferredTime && <Text style={styles.volunteerInfo}>⏰ {item.preferredTime}</Text>}
            {item.notes && <Text style={styles.volunteerNotes}>{item.notes}</Text>}

            <View style={styles.volunteerFooter}>
                <Text style={[styles.volunteerStatus, { color: getStatusColor(item.status) }]}>
                    Status: {item.status}
                </Text>
                <Text style={styles.volunteerDate}>Registered: {item.formattedDate}</Text>
            </View>

            <View style={styles.actionButtons}>
                {item.status !== "Registered" && (
                    <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: "#10b981" }]}
                        onPress={() => updateVolunteerStatus(item.id, "Registered")}
                    >
                        <Text style={styles.statusButtonText}>Mark Registered</Text>
                    </TouchableOpacity>
                )}

                {item.status !== "Available" && (
                    <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: "#2563eb" }]}
                        onPress={() => updateVolunteerStatus(item.id, "Available")}
                    >
                        <Text style={styles.statusButtonText}>Mark Available</Text>
                    </TouchableOpacity>
                )}

                {item.status !== "Inactive" && (
                    <TouchableOpacity
                        style={[styles.statusButton, { backgroundColor: "#ef4444" }]}
                        onPress={() => updateVolunteerStatus(item.id, "Inactive")}
                    >
                        <Text style={styles.statusButtonText}>Mark Inactive</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const renderStatusFilter = () => (
        <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Filter by status:</Text>
            <View style={styles.filterButtons}>
                {["All", "Available", "Registered", "Inactive"].map(status => (
                    <TouchableOpacity
                        key={status}
                        style={[
                            styles.filterButton,
                            filterStatus === status && styles.filterButtonActive
                        ]}
                        onPress={() => setFilterStatus(status)}
                    >
                        <Text
                            style={[
                                styles.filterButtonText,
                                filterStatus === status && styles.filterButtonTextActive
                            ]}
                        >
                            {status}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Registered Volunteers</Text>

            {renderStatusFilter()}

            {loading ? (
                <ActivityIndicator size="large" color="#3b82f6" style={styles.loader} />
            ) : volunteers.length > 0 ? (
                <FlatList
                    data={volunteers}
                    keyExtractor={(item) => item.id}
                    renderItem={renderVolunteer}
                    contentContainerStyle={styles.listContainer}
                />
            ) : (
                <Text style={styles.emptyText}>
                    No volunteers found{filterStatus !== "All" ? ` with status "${filterStatus}"` : ""}.
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f1f5f9",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        color: "#1f2937",
    },
    listContainer: {
        paddingBottom: 20,
    },
    volunteerCard: {
        backgroundColor: "#ffffff",
        borderColor: "#e2e8f0",
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    volunteerName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#0f172a",
        marginBottom: 6,
    },
    volunteerInfo: {
        fontSize: 14,
        color: "#475569",
        marginBottom: 3,
    },
    volunteerNotes: {
        fontSize: 14,
        color: "#64748b",
        fontStyle: "italic",
        marginTop: 5,
        marginBottom: 5,
    },
    volunteerFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#e2e8f0",
    },
    volunteerStatus: {
        fontWeight: "bold",
    },
    volunteerDate: {
        fontSize: 12,
        color: "#64748b",
    },
    actionButtons: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginTop: 10,
        gap: 8,
    },
    statusButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 6,
        alignItems: "center",
        flex: 1,
        minWidth: 100,
    },
    statusButtonText: {
        color: "#ffffff",
        fontWeight: "600",
        fontSize: 13,
    },
    filterContainer: {
        marginBottom: 15,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
        color: "#475569",
    },
    filterButtons: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    filterButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#cbd5e1",
        backgroundColor: "#f8fafc",
    },
    filterButtonActive: {
        backgroundColor: "#3b82f6",
        borderColor: "#3b82f6",
    },
    filterButtonText: {
        color: "#475569",
        fontSize: 13,
    },
    filterButtonTextActive: {
        color: "#ffffff",
    },
    loader: {
        marginTop: 20,
    },
    emptyText: {
        textAlign: "center",
        color: "#64748b",
        marginTop: 20,
        fontStyle: "italic",
    },
});

export default VolunteersList;