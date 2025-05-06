import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { BarChart } from "react-native-chart-kit";
import moment from "moment";
import * as Animatable from "react-native-animatable";
import { useFocusEffect } from '@react-navigation/native';
import { router } from "expo-router";

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
    backgroundGradientFrom: "#fff",
    backgroundGradientTo: "#fff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
    style: {
        borderRadius: 16,
    },
    propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: "#ef4444",
    },
};

const MyImpact = () => {
    const { user } = useUser();
    const [donationStats, setDonationStats] = useState({
        total: 0,
        totalPending: 0,
        byMonth: {} as Record<string, number>,
        byType: {} as Record<string, number>,
        last7Days: 0,
        last30Days: 0,
        last90Days: 0,
    });

    useFocusEffect(
        React.useCallback(() => {
            if (user?.id) {
                fetchDonationStats();
            }
        }, [user?.id])
    );

    const fetchDonationStats = async () => {
        try {
            const colRef = collection(db, "donations");
            const q = query(colRef, where("clerkId", "==", user.id));
            const snapshot = await getDocs(q);

            const donations = snapshot.docs.map(doc => doc.data());
            const statsByMonth: Record<string, number> = {};
            const statsByType: Record<string, number> = {};
            let totalPending = 0;

            // Initialize counters for the last 7, 30, and 90 days
            let last7DaysCount = 0;
            let last30DaysCount = 0;
            let last90DaysCount = 0;

            donations.forEach(donation => {
                const date = moment(donation.createdAt.toDate());
                const month = date.format("MMM YYYY");
                statsByMonth[month] = (statsByMonth[month] || 0) + 1;

                // Track donation types
                const foodType = donation.foodName || "Others";
                statsByType[foodType] = (statsByType[foodType] || 0) + 1;

                // Check donation status
                if (donation.status !== "Completed") {
                    totalPending += 1;
                }

                // Track donations for last 7, 30, and 90 days
                const daysAgo = moment().diff(date, 'days');
                if (daysAgo <= 7) last7DaysCount += 1;
                if (daysAgo <= 30) last30DaysCount += 1;
                if (daysAgo <= 90) last90DaysCount += 1;
            });

            setDonationStats({
                total: donations.length,
                totalPending,
                byMonth: statsByMonth,
                byType: statsByType,
                last7Days: last7DaysCount,
                last30Days: last30DaysCount,
                last90Days: last90DaysCount,
            });
        } catch (error) {
            console.error("Error fetching donation stats:", error);
        }
    };

    const months = Object.keys(donationStats.byMonth).slice(-6); // last 6 months
    const values = months.map(month => donationStats.byMonth[month]);

    const renderImpactDashboard = () => {
        if (donationStats.total === 0) {
            // Motivational message for first-time users or users with no donations
            return (
                <View style={styles.motivationalContainer}>
                    <Text style={styles.motivationalText}>
                        🌟 You haven’t donated yet. Become a hero today by making your first donation!
                    </Text>
                    <TouchableOpacity
                        style={styles.donateButton}
                        onPress={() => router.push("/screens/DonateFood")}
                    >
                        <Text style={styles.donateButtonText}>Make a Donation</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <>
                <Text style={styles.subTitle}>📈 Monthly Donation Trend</Text>
                <BarChart
                    data={{
                        labels: months,
                        datasets: [{ data: values }],
                    }}
                    width={screenWidth - 32}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={chartConfig}
                    verticalLabelRotation={30}
                    style={styles.chart}
                />

                <View style={styles.metricsContainer}>
                    <Animatable.View animation="fadeInUp" duration={500}>
                        <Text style={styles.subTitle}>🚀 Donation Frequency (Last 7, 30, 90 days)</Text>
                        <View style={styles.metricsRow}>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricLabel}>Last 7 Days</Text>
                                <Text style={styles.metricValue}>{donationStats.last7Days}</Text>
                            </View>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricLabel}>Last 30 Days</Text>
                                <Text style={styles.metricValue}>{donationStats.last30Days}</Text>
                            </View>
                            <View style={styles.metricBox}>
                                <Text style={styles.metricLabel}>Last 90 Days</Text>
                                <Text style={styles.metricValue}>{donationStats.last90Days}</Text>
                            </View>
                        </View>
                    </Animatable.View>
                </View>
            </>
        );
    };

    return (
        <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 100 }]}>
            <Text style={styles.title}>🎯 My Impact</Text>

            {renderImpactDashboard()}

            {/* My Donations Section */}
            <View style={styles.donationsSection}>
                <Text style={styles.sectionTitle}>📊 My Donations</Text>
                <Text style={styles.sectionText}>Total Donations: {donationStats.total}</Text>
            </View>

            {/* Pending Donations Section */}
            <View style={styles.donationsSection}>
                <Text style={styles.sectionTitle}>⏳ Pending Donations</Text>
                <Text style={styles.sectionText}>Total Pending: {donationStats.totalPending}</Text>
            </View>

            <View style={styles.footerNote}>
                <Text style={styles.noteText}>
                    Keep making a difference! Your generous acts feed the community and reduce waste.
                </Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        paddingBottom: 80,
        backgroundColor: "#f9fafb",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 16,
    },
    subTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#374151",
        marginTop: 24,
        marginBottom: 12,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    motivationalContainer: {
        backgroundColor: "#fee2e2",
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: "center",
    },
    motivationalText: {
        fontSize: 18,
        fontWeight: "600",
        color: "#991b1b",
        textAlign: "center",
    },
    donateButton: {
        marginTop: 20,
        padding: 15,
        backgroundColor: "#ef4444",
        borderRadius: 10,
        width: 200,
        alignItems: "center",
    },
    donateButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    metricsContainer: {
        marginTop: 24,
    },
    metricsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    metricBox: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 10,
        width: "30%",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    metricLabel: {
        fontSize: 16,
        color: "#6b7280",
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#ef4444",
    },
    donationsSection: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 10,
        marginTop: 24,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 8,
    },
    sectionText: {
        fontSize: 16,
        color: "#6b7280",
    },
    footerNote: {
        backgroundColor: "#f3f4f6",
        padding: 16,
        borderRadius: 10,
        marginTop: 32,
        alignItems: "center",
    },
    noteText: {
        fontSize: 14,
        color: "#6b7280",
        textAlign: "center",
    },
});

export default MyImpact;
