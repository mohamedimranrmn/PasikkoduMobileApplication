import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useUser } from "@clerk/clerk-expo";

const RegisterVolunteer = () => {
    const { user, isSignedIn } = useUser();

    // Form state
    const [name, setName] = useState("");
    const [location, setLocation] = useState("");
    const [contact, setContact] = useState("");
    const [preferredTime, setPreferredTime] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const validateForm = () => {
        if (!name.trim()) {
            Alert.alert("Missing Info", "Please enter your full name.");
            return false;
        }
        if (!location.trim()) {
            Alert.alert("Missing Info", "Please enter your location.");
            return false;
        }
        if (!contact.trim()) {
            Alert.alert("Missing Info", "Please enter your contact number.");
            return false;
        }

        // Basic phone number validation
        const phonePattern = /^\d{10,15}$/;
        if (!phonePattern.test(contact.replace(/[^0-9]/g, ''))) {
            Alert.alert("Invalid Input", "Please enter a valid phone number.");
            return false;
        }

        return true;
    };

    const handleRegister = async () => {
        if (!isSignedIn || !user) {
            Alert.alert("Authentication Required", "Please log in to register as a volunteer.");
            return;
        }

        if (!validateForm()) return;

        try {
            setSubmitting(true);

            await addDoc(collection(db, "volunteers"), {
                name: name.trim(),
                location: location.trim(),
                contact: contact.trim(),
                preferredTime: preferredTime.trim(),
                notes: notes.trim(),
                userId: user.id,
                registeredAt: new Date(),
                status: "Available",
                email: user.primaryEmailAddress?.emailAddress || "",
            });

            // Reset form
            setName("");
            setLocation("");
            setContact("");
            setPreferredTime("");
            setNotes("");

            Alert.alert(
                "Thank you!",
                "You've been registered as a volunteer. We'll contact you soon."
            );
        } catch (error) {
            console.error("Registration error:", error);
            Alert.alert("Error", "Could not register. Please try again later.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.title}>Volunteer Registration</Text>

                <View style={styles.formContainer}>
                    <Text style={styles.label}>Full Name*</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholder="Enter your full name"
                        autoCapitalize="words"
                    />

                    <Text style={styles.label}>Location*</Text>
                    <TextInput
                        style={styles.input}
                        value={location}
                        onChangeText={setLocation}
                        placeholder="Your city or area"
                    />

                    <Text style={styles.label}>Contact Number*</Text>
                    <TextInput
                        style={styles.input}
                        value={contact}
                        onChangeText={setContact}
                        placeholder="Phone or WhatsApp number"
                        keyboardType="phone-pad"
                    />

                    <Text style={styles.label}>Preferred Time</Text>
                    <TextInput
                        style={styles.input}
                        value={preferredTime}
                        onChangeText={setPreferredTime}
                        placeholder="e.g., Evenings, Weekends"
                    />

                    <Text style={styles.label}>Additional Notes</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Any special info or availability"
                        multiline
                        numberOfLines={4}
                    />

                    <TouchableOpacity
                        style={[styles.button, submitting && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text style={styles.buttonText}>Register as Volunteer</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: "#f1f5f9",
        flexGrow: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
        color: "#1f2937",
    },
    formContainer: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 6,
        color: "#334155",
    },
    input: {
        backgroundColor: "#ffffff",
        borderColor: "#cbd5e1",
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: "top",
    },
    button: {
        backgroundColor: "#10b981",
        padding: 15,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: "#93c5fd",
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default RegisterVolunteer;