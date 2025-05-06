import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Modal,
    ActivityIndicator,
    Switch,
    Alert,
    Image,
    KeyboardAvoidingView
} from "react-native";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useUser } from "@clerk/clerk-expo";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

const ListSurplus = () => {
    const { user, isSignedIn } = useUser();

    const [product, setProduct] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [expiryDate, setExpiryDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [hasExpiryDate, setHasExpiryDate] = useState(true);
    const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);

    const handleListSurplus = async () => {
        if (!isSignedIn || !user) {
            Alert.alert("Authentication Error", "Please log in to list products.");
            return;
        }

        // Validate the form fields
        if (!product || !description || !price) {
            Alert.alert("Missing Information", "Please fill out all required fields.");
            return;
        }

        // Ask for confirmation if expiry date is soon (within 3 days)
        if (hasExpiryDate) {
            const today = new Date();
            const timeDiff = expiryDate.getTime() - today.getTime();
            const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

            if (dayDiff <= 3) {
                setConfirmationModalVisible(true);
                return;
            }
        }

        // If no need for confirmation, proceed with upload
        uploadProduct();
    };

    const uploadProduct = async () => {
        try {
            setUploading(true);

            // Create document data object
            const productData = {
                product,
                description,
                price,
                status: "Active",
                createdAt: new Date(),
                clerkId: user.id,
                isPerishable: hasExpiryDate
            };

            // Only add expiry date if the product is perishable
            if (hasExpiryDate) {
                productData.expiryDate = expiryDate.toISOString().split('T')[0];
            }

            await addDoc(collection(db, "marketplace"), productData);

            // Close confirmation modal if open
            setConfirmationModalVisible(false);

            Alert.alert(
                "Success!",
                "Your product has been added to the marketplace.",
                [{ text: "Great!", style: "default" }]
            );

            // Reset form
            setProduct("");
            setDescription("");
            setExpiryDate(new Date());
            setPrice("");
            setHasExpiryDate(true);
        } catch (error) {
            console.error("Upload Error:", error);
            Alert.alert("Error", "Failed to add product. Please try again later.");
        } finally {
            setUploading(false);
        }
    };

    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || expiryDate;
        setShowPicker(Platform.OS === "ios");
        setExpiryDate(currentDate);
    };

    const formatCurrency = (text) => {
        // Remove any non-numeric characters except decimal point
        const cleanText = text.replace(/[^0-9.]/g, '');

        // Ensure only one decimal point
        const parts = cleanText.split('.');
        if (parts.length > 2) {
            return parts[0] + '.' + parts.slice(1).join('');
        }

        return cleanText;
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Header with illustration */}
                <View style={styles.header}>
                    <Image
                        source={require('../../../assets/images/payment.png')}
                        style={styles.headerImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>Add Your Product</Text>
                    <Text style={styles.subtitle}>
                        Sell your products at a great price
                    </Text>
                </View>

                <View style={styles.formContainer}>
                    {/* Product Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Product Name <Text style={styles.required}>*</Text>
                        </Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter Product Name"
                                placeholderTextColor="#9CA3AF"
                                value={product}
                                onChangeText={setProduct}
                            />
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Description <Text style={styles.required}>*</Text>
                        </Text>
                        <View style={[styles.inputWrapper, styles.textareaWrapper]}>
                            <TextInput
                                style={[styles.input, styles.textarea]}
                                placeholder="Add Product Description"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={4}
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>
                    </View>
                    <View style={styles.toggleContainer}>
                        <View style={styles.toggleTextContainer}>
                            <Ionicons name="calendar-outline" size={22} color="#6B7280" />
                            <Text style={styles.toggleLabel}>Has expiry date?</Text>
                        </View>
                        <Switch
                            value={hasExpiryDate}
                            onValueChange={setHasExpiryDate}
                            trackColor={{ false: "#d1d5db", true: "#10b981" }}
                            thumbColor={hasExpiryDate ? "#ffffff" : "#f3f4f6"}
                            ios_backgroundColor="#d1d5db"
                            style={styles.switch}
                        />
                    </View>
                    {hasExpiryDate && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>
                                Expiry Date <Text style={styles.required}>*</Text>
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowPicker(true)}
                                style={styles.datePickerButton}
                            >
                                <Text style={styles.dateText}>
                                    {expiryDate.toDateString()}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#6B7280" />
                            </TouchableOpacity>
                            {showPicker && (
                                <DateTimePicker
                                    value={expiryDate}
                                    mode="date"
                                    display="default"
                                    onChange={handleDateChange}
                                    minimumDate={new Date()}
                                />
                            )}
                        </View>
                    )}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Price (₹) <Text style={styles.required}>*</Text>
                        </Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter price"
                                placeholderTextColor="#9CA3AF"
                                keyboardType="decimal-pad"
                                returnKeyType="done"
                                value={price}
                                onChangeText={(text) => setPrice(formatCurrency(text))}
                            />
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleListSurplus}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Add Product</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <Modal
                visible={uploading}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.loadingModal}>
                        <ActivityIndicator size="large" color="#10b981" />
                        <Text style={styles.modalText}>Adding your product...</Text>
                    </View>
                </View>
            </Modal>
            <Modal
                visible={confirmationModalVisible}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.confirmationModal}>
                        <View style={styles.warningIconContainer}>
                            <Ionicons name="warning" size={40} color="#f59e0b" />
                        </View>

                        <Text style={styles.confirmationTitle}>Short Expiry Date</Text>

                        <Text style={styles.confirmationText}>
                            Your product will expire within 3 days. Are you sure you want to list it?
                        </Text>

                        <View style={styles.confirmationButtons}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setConfirmationModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={uploadProduct}
                            >
                                <Text style={styles.confirmButtonText}>Yes, List It</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#f9fafb",
        paddingBottom: 40,
    },
    header: {
        backgroundColor: "#10b981",
        padding: 30,
        alignItems: "center",
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
    },
    headerImage: {
        width: 80,
        height: 80,
        marginBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#ffffff",
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: "#e6fffa",
        textAlign: "center",
        paddingHorizontal: 20,
    },
    formContainer: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
        color: "#374151",
    },
    required: {
        color: "#ef4444",
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    textareaWrapper: {
        alignItems: "center",
    },
    inputIcon: {
        paddingLeft: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 9,
        paddingHorizontal: 10,
        fontSize: 16,
        color: "#1f2937",
    },
    textarea: {
        height: 80,
        justifyContent: "center",
        alignItems: "center",
    },
    toggleContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleTextContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    toggleLabel: {
        fontSize: 16,
        color: "#374151",
        fontWeight: "500",
        marginLeft: 10,
    },
    switch: {
        transform: Platform.OS === 'ios' ? [{ scaleX: 0.8 }, { scaleY: 0.8 }] : [],
    },
    datePickerButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    dateIcon: {
        marginRight: 10,
    },
    dateText: {
        flex: 1,
        fontSize: 16,
        color: "#1f2937",
    },
    button: {
        backgroundColor: "#10b981",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        padding: 16,
        borderRadius: 12,
        shadowColor: "#047857",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
        marginTop: 10,
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "700",
    },
    buttonIcon: {
        marginLeft: 10,
    },
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    loadingModal: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
        width: "80%",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 8,
    },
    modalText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: "500",
        textAlign: "center",
        color: "#374151",
    },
    confirmationModal: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 24,
        width: "85%",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 8,
    },
    warningIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#fef3c7",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    confirmationTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 12,
    },
    confirmationText: {
        fontSize: 16,
        color: "#4b5563",
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
    },
    confirmationButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
    },
    cancelButton: {
        flex: 1,
        padding: 14,
        backgroundColor: "#f3f4f6",
        borderRadius: 10,
        marginRight: 8,
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#4b5563",
        fontSize: 16,
        fontWeight: "600",
    },
    confirmButton: {
        flex: 1,
        padding: 14,
        backgroundColor: "#10b981",
        borderRadius: 10,
        marginLeft: 8,
        alignItems: "center",
    },
    confirmButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "600",
    },
});

export default ListSurplus;