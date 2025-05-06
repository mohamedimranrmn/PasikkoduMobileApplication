import {
    TextInput,
    View,
    Text,
    Image,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
} from "react-native";

import { InputFieldProps } from "@/types/type";

const InputField = ({
                        label,
                        icon,
                        secureTextEntry = false,
                        labelStyle,
                        containerStyle,
                        inputStyle,
                        iconStyle,
                        className,
                        ...props
                    }: InputFieldProps) => {
    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View className="my-2 w-full">
                    <Text className={`text-lg font-JakartaSemiBold mb-3 ${labelStyle}`}>
                        {label}
                    </Text>
                    <View
                        className={`flex flex-row items-center bg-neutral-100 
                            rounded-full border border-gray-300 
                            focus:border-primary-500 px-4 py-2 w-full ${containerStyle}`}
                    >
                        {icon && (
                            <Image source={icon} className={`w-6 h-6 mr-3 ${iconStyle}`} />
                        )}
                        <TextInput
                            className={`flex-1 font-JakartaSemiBold text-[15px] ${inputStyle} text-left`}
                            secureTextEntry={secureTextEntry}
                            placeholderTextColor="gray"
                            {...props}
                        />
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

export default InputField;
