import React, { useState, useRef } from "react";
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
    Alert,
    Image,
    KeyboardAvoidingView
} from "react-native";
import { addDoc, collection } from "firebase/firestore";
import { db, storage } from "../../firebaseConfig";
import { useUser } from "@clerk/clerk-expo";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {router} from "expo-router";

const DonateFood = () => {
    const { user, isSignedIn } = useUser();

    // Form state
    const [foodName, setFoodName] = useState("");
    const [description, setDescription] = useState("");
    const [expiryDate, setExpiryDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [location, setLocation] = useState(null);
    const [locationName, setLocationName] = useState("");
    const [foodImage, setFoodImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    const mapRef = useRef(null);

    const handleDonateFood = async () => {
        if (!isSignedIn || !user) {
            Alert.alert("Authentication Required", "Please log in to donate food.");
            return;
        }

        if (!foodName || !description || !expiryDate || !location || !locationName || !foodImage) {
            Alert.alert("Missing Information", "Please fill out all required fields and upload an image.");
            return;
        }

        try {
            setUploading(true);

            // Upload image to storage
            const response = await fetch(foodImage);
            const blob = await response.blob();
            const imageRef = ref(storage, `donationImages/${user.id}_${Date.now()}.jpg`);
            await uploadBytes(imageRef, blob);
            const imageUrl = await getDownloadURL(imageRef);

            // Save donation to Firestore
            await addDoc(collection(db, "donations"), {
                foodName,
                description,
                expiryDate: expiryDate.toISOString().split("T")[0],
                status: "Active",
                createdAt: new Date(),
                clerkId: user.id,
                location,
                locationName,
                foodImage: imageUrl,
            });

            Alert.alert(
                "Thank You!",
                "Your food donation has been added successfully.",
                [{ text: "Great!", style: "default" }]
            );

            router.push("/(root)/screens/DonateFood");
            // Reset form
            setFoodName("");
            setDescription("");
            setExpiryDate(new Date());
            setLocation(null);
            setLocationName("");
            setFoodImage(null);
        } catch (error) {
            console.error("Donation Error:", error);
            Alert.alert("Error", "Failed to donate food. Please try again later.");
        } finally {
            setUploading(false);
        }
    };

    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || expiryDate;
        setShowDatePicker(Platform.OS === "ios");
        setExpiryDate(currentDate);
    };

    const pickFoodImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setFoodImage(result.assets[0].uri);
        }
    };

    const getLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission Denied", "Unable to access location.");
            return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
        };
        setLocation(coords);

        if (mapRef.current) {
            mapRef.current.animateToRegion({
                ...coords,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 1000);
        }

        const geocode = await Location.reverseGeocodeAsync(coords);
        const readable = geocode[0]?.district || geocode[0]?.city || "Unknown";
        setLocationName(readable);
    };

    const handleMapPress = async (e) => {
        const coordinate = e.nativeEvent.coordinate;
        setLocation(coordinate);

        const geocode = await Location.reverseGeocodeAsync(coordinate);
        const readable = geocode[0]?.district || geocode[0]?.city || "Unknown";
        setLocationName(readable);
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
                        source={require('../../../assets/images/check.png')}
                        style={styles.headerImage}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>Donate Food</Text>
                    <Text style={styles.subtitle}>
                        Share your excess food with those in need
                    </Text>
                </View>

                <View style={styles.formContainer}>
                    {/* Food Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Food Name <Text style={styles.required}>*</Text>
                        </Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter the donation name"
                                placeholderTextColor="#9CA3AF"
                                value={foodName}
                                onChangeText={setFoodName}
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
                                placeholder="Add Description"
                                placeholderTextColor="#9CA3AF"
                                multiline
                                numberOfLines={4}
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>
                    </View>

                    {/* Expiry Date */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Expiry Date <Text style={styles.required}>*</Text>
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            style={styles.datePickerButton}
                        >
                            <Text style={styles.dateText}>
                                {expiryDate.toDateString()}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color="#6B7280" />
                        </TouchableOpacity>
                        {showDatePicker && (
                            <DateTimePicker
                                value={expiryDate}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                                minimumDate={new Date()}
                            />
                        )}
                    </View>

                    {/* Food Image */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Food Image <Text style={styles.required}>*</Text>
                        </Text>
                        <TouchableOpacity
                            style={styles.imagePickerButton}
                            onPress={pickFoodImage}
                        >
                            <Ionicons name="camera" size={24} color="#6B7280" />
                            <Text style={styles.imagePickerText}>
                                {foodImage ? "Change Image" : "Upload Image"}
                            </Text>
                        </TouchableOpacity>

                        {foodImage && (
                            <Image
                                source={{ uri: foodImage }}
                                style={styles.previewImage}
                                resizeMode="cover"
                            />
                        )}
                    </View>

                    {/* Location Map */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>
                            Location <Text style={styles.required}>*</Text>
                        </Text>
                        <View style={styles.mapContainer}>
                            {Platform.OS !== 'web' ? (
                                <MapView
                                    ref={mapRef}
                                    style={styles.map}
                                    initialRegion={{
                                        latitude: location ? location.latitude : 22.5937,
                                        longitude: location ? location.longitude : 78.9629,
                                        latitudeDelta: 20.0,
                                        longitudeDelta: 20.0,
                                    }}
                                    onPress={handleMapPress}
                                >
                                    {location && <Marker coordinate={location} title="Donation Location" />}
                                </MapView>
                            ) : (
                                <View style={styles.webMapPlaceholder}>
                                    <Text>MapView is not supported on web.</Text>
                                </View>
                            )}
                            <TouchableOpacity onPress={getLocation} style={styles.locationButton}>
                                <Ionicons name="locate" size={24} color="#ffffff" />
                            </TouchableOpacity>
                        </View>

                        {locationName ? (
                            <View style={styles.locationNameContainer}>
                                <Ionicons name="location" size={18} color="#10b981" />
                                <Text style={styles.locationNameText}>{locationName}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* Donate Button */}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleDonateFood}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Donate Now</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Loading Modal */}
            <Modal
                visible={uploading}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalContainer}>
                    <View style={styles.loadingModal}>
                        <ActivityIndicator size="large" color="#10b981" />
                        <Text style={styles.modalText}>Processing your donation...</Text>
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
        alignItems: "flex-start",
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 15,
        fontSize: 16,
        color: "#1f2937",
    },
    textarea: {
        height: 80,
        justifyContent:"center",
        alignItems: "center",
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
    dateText: {
        flex: 1,
        fontSize: 16,
        color: "#1f2937",
    },
    imagePickerButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
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
        marginBottom: 10,
    },
    imagePickerText: {
        fontSize: 16,
        color: "#4b5563",
        marginLeft: 8,
    },
    previewImage: {
        width: "100%",
        height: 200,
        borderRadius: 12,
        marginTop: 5,
    },
    mapContainer: {
        position: "relative",
        height: 300,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    map: {
        width: "100%",
        height: "100%",
    },
    webMapPlaceholder: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f3f4f6",
    },
    locationButton: {
        position: "absolute",
        bottom: 16,
        right: 16,
        backgroundColor: "#10b981",
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    locationNameContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginTop: 5,
    },
    locationNameText: {
        fontSize: 14,
        color: "#374151",
        marginLeft: 5,
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
    }
});

export default DonateFood;