import { router } from "expo-router";
import { useRef, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Swiper from "react-native-swiper";
import { onboarding } from "@/constants";
import CustomButton from "@/components/CustomButton";

const Onboarding = () => {
    const swiperRef = useRef<Swiper>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const isLastSlide = activeIndex === onboarding.length - 1;

    return (
        <SafeAreaView className="flex-1 bg-white justify-between">
            {/* Skip button - Only show if not on the last slide */}
            {!isLastSlide && (
                <TouchableOpacity
                    onPress={() => router.replace("/(auth)/sign-up")}
                    className="w-full flex justify-end items-end p-5"
                >
                    <Text className="text-lg font-JakartaBold text-gray-500">Skip</Text>
                </TouchableOpacity>
            )}

            {/* Swiper */}
            <Swiper
                ref={swiperRef}
                loop={false}
                dot={<View className="w-[32px] h-[4px] mx-1 bg-[#E2E8F0] rounded-full" />}
                activeDot={<View className="w-[32px] h-[4px] mx-1 bg-[#0286FF] rounded-full" />}
                onIndexChanged={(index) => setActiveIndex(index)}
            >
                {onboarding.map((item) => (
                    <View key={item.id} className="flex-1 items-center justify-center px-5">
                        <Image
                            source={item.image}
                            className="w-full h-[300px]"
                            resizeMode="contain"
                        />
                        <View className="w-full mt-10">
                            <Text className="text-black text-3xl font-bold text-center">{item.title}</Text>
                            <Text className="text-lg font-JakartaSemiBold text-center text-[#858585] mt-3">
                                {item.description}
                            </Text>
                        </View>
                    </View>
                ))}
            </Swiper>

            {/* Button */}
            <View className="w-full px-6 mb-10">
                <CustomButton
                    title={isLastSlide ? "Get Started" : "Next"}
                    onPress={() =>
                        isLastSlide
                            ? router.replace("/(auth)/sign-up")
                            : swiperRef.current?.scrollBy(1)
                    }
                />
            </View>
        </SafeAreaView>
    );
};

export default Onboarding;
