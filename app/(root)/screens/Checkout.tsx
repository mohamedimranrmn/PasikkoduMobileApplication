import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Alert,
    StyleSheet,
    ActivityIndicator,
    Image,
    TouchableOpacity,
} from "react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const Checkout = () => {
    const { productId, productName, price } = useLocalSearchParams();
    const router = useRouter();
    const { initPaymentSheet, presentPaymentSheet } = useStripe();

    const [isSheetReady, setSheetReady] = useState(false);
    const [isInitializing, setInitializing] = useState(true);

    const productIdString = Array.isArray(productId) ? productId[0] : productId;

    const fetchPaymentSheetParams = async () => {
        try {
            const response = await fetch("https://pasikkodu-backend.onrender.com/create-payment-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: parseInt(price) * 100 }),
            });

            if (!response.ok) throw new Error("Failed to fetch payment intent");

            const { paymentIntent, ephemeralKey, customer } = await response.json();
            return { paymentIntent, ephemeralKey, customer };
        } catch (error) {
            console.error("Stripe fetch error:", error);
            Alert.alert("Error", "Could not initialize payment. Try again.");
            return null;
        }
    };

    const initializePaymentSheet = async () => {
        const params = await fetchPaymentSheetParams();
        if (!params) return;

        const { paymentIntent, ephemeralKey, customer } = params;

        const { error } = await initPaymentSheet({
            merchantDisplayName: "Pasikkodu",
            paymentIntentClientSecret: paymentIntent,
            customerEphemeralKeySecret: ephemeralKey,
            customerId: customer,
        });

        if (error) {
            console.error("Payment sheet init error:", error);
            Alert.alert("Error", error.message);
        } else {
            setSheetReady(true);
        }
        setInitializing(false);
    };

    const openPaymentSheet = async () => {
        if (!productIdString) return Alert.alert("Error", "Invalid product ID");

        const { error } = await presentPaymentSheet();

        if (error) {
            Alert.alert("Payment Failed", error.message);
        } else {
            await updateDoc(doc(db, "marketplace", productIdString), { status: "Sold" });
            Alert.alert("Success", `You purchased ${productName}`);
            router.replace({
                pathname: "/(root)/(tabs)/home",
                params: { purchaseSuccess: "true" },
            });
        }
    };

    useEffect(() => {
        initializePaymentSheet();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Image
                    source={require("../../../assets/images/payment.png")}
                    style={styles.image}
                    resizeMode="contain"
                />
                <Text style={styles.title}>Buy: {productName}</Text>
                <Text style={styles.price}>Amount: ₹{price}</Text>
            </View>

            <View style={styles.buttonContainer}>
                {isInitializing ? (
                    <ActivityIndicator size="large" color="#007bff" />
                ) : (
                    <TouchableOpacity
                        onPress={openPaymentSheet}
                        disabled={!isSheetReady}
                        style={[
                            styles.payButton,
                            !isSheetReady && { opacity: 0.5 },
                        ]}
                    >
                        <Text style={styles.payButtonText}>Proceed to Pay</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: "#f1f5f9",
        justifyContent: "center",
    },
    card: {
        backgroundColor: "#ffffff",
        padding: 24,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
        alignItems: "center",
    },
    image: {
        width: 130,
        height: 130,
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#1f2937",
        marginBottom: 10,
    },
    price: {
        fontSize: 18,
        fontWeight: "600",
        color: "#4b5563",
        marginBottom: 20,
    },
    buttonContainer: {
        marginTop: 30,
    },
    payButton: {
        backgroundColor: "#10b981",
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 9999,
        alignItems: "center",
    },
    payButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
});

export default Checkout;
