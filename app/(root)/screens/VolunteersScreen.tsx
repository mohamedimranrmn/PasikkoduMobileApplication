import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView
} from "react-native";
import RegisterVolunteer from "./RegisterVolunteer";
import VolunteersList from "./VolunteersList";

const VolunteersScreen = () => {
    const [activeTab, setActiveTab] = useState("register"); // "register" or "list"

    return (
        <SafeAreaView style={styles.container}>
            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === "register" && styles.activeTab
                    ]}
                    onPress={() => setActiveTab("register")}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === "register" && styles.activeTabText
                        ]}
                    >
                        Register
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === "list" && styles.activeTab
                    ]}
                    onPress={() => setActiveTab("list")}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === "list" && styles.activeTabText
                        ]}
                    >
                        Volunteers List
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content Area */}
            <View style={styles.content}>
                {activeTab === "register" ? (
                    <RegisterVolunteer />
                ) : (
                    <VolunteersList />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f1f5f9",
    },
    tabContainer: {
        flexDirection: "row",
        backgroundColor: "#ffffff",
        paddingTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#e2e8f0",
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: "#3b82f6",
    },
    tabText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#64748b",
    },
    activeTabText: {
        color: "#1e40af",
    },
    content: {
        flex: 1,
    },
});

export default VolunteersScreen;