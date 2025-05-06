import { Tabs } from "expo-router";
import { Image, ImageSourcePropType, View, StyleSheet } from "react-native";
import { icons } from "@/constants";
import "../../../global.css";

const TabIcon = ({
                     source,
                     focused,
                 }: {
    source: ImageSourcePropType;
    focused: boolean;
}) => (
    <View style={styles.iconContainer}>
        <Image
            source={source}
            resizeMode="contain"
            style={[
                styles.icon,
                focused && styles.iconFocused,
            ]}
        />
    </View>
);

export default function Layout() {
    return (
        <Tabs
            initialRouteName="home"
            screenOptions={{
                tabBarShowLabel: false,
                headerShown: false,
                tabBarStyle: styles.tabBar,
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: "Home",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon source={icons.home} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="Donations"
                options={{
                    title: "Donations",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon source={icons.heart} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="MyImpact"
                options={{
                    title: "My Impact",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon source={icons.pie} focused={focused} />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ focused }) => (
                        <TabIcon source={icons.person} focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: "black",
        borderRadius: 50,
        marginHorizontal: 25,
        marginBottom: 35,
        height: 59,
        position: "absolute",
        flexDirection: "row",
        alignItems: "center", // Ensures vertical alignment of icons
        justifyContent: "space-around",
        paddingHorizontal: 10,
        paddingBottom: 20,
        elevation: 10, // Android shadow
        shadowColor: "#000", // iOS shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
    },
    iconContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    icon: {
        width: 28,
        height: 28,
        tintColor: "white",
    },
    iconFocused: {
        tintColor: "#f87171",
    },
});
