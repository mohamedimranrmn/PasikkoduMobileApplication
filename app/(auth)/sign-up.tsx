import { Text, ScrollView, View, Image, Alert } from "react-native";
import { icons, images } from "@/constants";
import InputField from "@/components/InputField";
import { useState } from "react";
import CustomButton from "@/components/CustomButton";
import { Link, router } from "expo-router";
import { useSignUp } from "@clerk/clerk-expo";
import { ReactNativeModal } from "react-native-modal";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/app/firebaseConfig";
import OAuth from "@/components/OAuth";

const SignUp = () => {
    const { isLoaded, signUp, setActive } = useSignUp();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [verification, setVerification] = useState({
        state: "default",
        error: "",
        code: "",
    });

    const onSignUpPress = async () => {
        if (!isLoaded) return;
        try {
            await signUp.create({
                emailAddress: form.email,
                password: form.password,
            });
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setVerification({ ...verification, state: "pending", error: "" });
        } catch (err: any) {
            Alert.alert("Error", err.errors[0].longMessage);
        }
    };

    const onPressVerify = async () => {
        if (!isLoaded) return;
        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code: verification.code,
            });
            if (completeSignUp.status === "complete") {
                await addDoc(collection(db, "users"), {
                    name: form.name,
                    email: form.email,
                    clerkId: completeSignUp.createdUserId,
                });

                await setActive({ session: completeSignUp.createdSessionId });

                setVerification({ ...verification, state: "completed", error: "" });
                setShowSuccessModal(true);
            } else {
                setVerification({
                    ...verification,
                    error: "Verification failed. Please try again.",
                    state: "failed",
                });
            }
        } catch (err: any) {
            setVerification({
                ...verification,
                error: err.errors[0].longMessage,
                state: "failed",
            });
        }
    };

    return (
        <ScrollView className="flex-1 bg-white">
            <View className="flex-1 bg-white">
                <View className="relative w-full h-[250px]">
                    <Image source={images.pasikkodu} className="z-0 w-full h-[250px]" />
                </View>
                <View className="p-5">
                    <InputField
                        label="Name"
                        placeholder="Enter your name"
                        icon={icons.person}
                        value={form.name}
                        onChangeText={(value) => setForm({ ...form, name: value })}
                    />
                    <InputField
                        label="Email"
                        placeholder="Enter your email"
                        icon={icons.email}
                        value={form.email}
                        onChangeText={(value) => setForm({ ...form, email: value })}
                    />
                    <InputField
                        label="Password"
                        placeholder="Enter your password"
                        icon={icons.lock}
                        secureTextEntry={true}
                        value={form.password}
                        onChangeText={(value) => setForm({ ...form, password: value })}
                    />
                    <CustomButton title="Sign Up" onPress={onSignUpPress} className="mt-6" />
                    <OAuth/>
                    <Link href="/sign-in" className="text-lg text-center text-general-200 mt-10">
                        <Text>
                            Already have an account?{" "}
                            <Text className="text-primary-500">Log In</Text>
                        </Text>
                    </Link>
                </View>

                {/* Verification Modal */}
                <ReactNativeModal isVisible={verification.state === "pending"}>
                    <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
                        <Text className="text-2xl font-JakartaExtraBold mb-2">Verification</Text>
                        <Text className="font-Jakarta mb-5">
                            We've sent a verification code to {form.email}
                        </Text>
                        <InputField
                            label="Code"
                            icon={icons.lock}
                            placeholder="Enter the 6-digit code"
                            value={verification.code}
                            keyboardType="numeric"
                            onChangeText={(code) =>
                                setVerification({ ...verification, code })
                            }
                        />
                        {verification.error && (
                            <Text className="text-red-500 text-sm mt-1">
                                {verification.error}
                            </Text>
                        )}
                        <CustomButton title="Verify Email" onPress={onPressVerify} className="mt-5 bg-success-500" />
                    </View>
                </ReactNativeModal>

                {/* Success Modal */}
                <ReactNativeModal isVisible={showSuccessModal}>
                    <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
                        <Image source={images.check} className="w-[110px] h-[110px] mx-auto my-5" />
                        <Text className="text-3xl font-JakartaBold text-center">Verified!</Text>
                        <Text className="text-base text-gray-400 font-Jakarta text-center mt-2">
                            You have successfully verified your account
                        </Text>
                        <CustomButton
                            title="Browse Home"
                            onPress={() => {
                                setShowSuccessModal(false);
                                router.push("/(root)/(tabs)/home");
                            }}
                            className="mt-5"
                        />
                    </View>
                </ReactNativeModal>
            </View>
        </ScrollView>
    );
};

export default SignUp;
