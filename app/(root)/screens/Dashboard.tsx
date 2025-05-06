import { View, Text, FlatList } from "react-native";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import moment from "moment";

const Dashboard = () => {
    const [totalMeals, setTotalMeals] = useState(0);
    const [totalWeight, setTotalWeight] = useState(0);
    const [topContributors, setTopContributors] = useState<any[]>([]);
    const [dailyStats, setDailyStats] = useState<any>({});

    useEffect(() => {
        fetchImpactStats();
    }, []);

    const fetchImpactStats = async () => {
        const donationsSnapshot = await getDocs(collection(db, "donations"));
        let meals = 0;
        let weight = 0;
        const contributorsMap: Record<string, { count: number; name: string }> = {};
        const trends: Record<string, number> = {};

        donationsSnapshot.forEach((doc) => {
            const data = doc.data();
            const { quantity, estimatedWeight, restaurantName, restaurantId, createdAt } = data;

            meals += quantity || 0;
            weight += estimatedWeight || 0;

            if (!contributorsMap[restaurantId]) {
                contributorsMap[restaurantId] = {
                    count: 0,
                    name: restaurantName,
                };
            }
            contributorsMap[restaurantId].count += quantity || 0;

            const date = moment(createdAt?.toDate()).format("YYYY-MM-DD");
            if (!trends[date]) trends[date] = 0;
            trends[date] += quantity;
        });

        const contributors = Object.entries(contributorsMap)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        setTotalMeals(meals);
        setTotalWeight(weight);
        setTopContributors(contributors);
        setDailyStats(trends);
    };

    return (
        <View className="flex-1 bg-white px-5 pt-12">
            <Text className="text-2xl font-bold text-center mb-6">🌍 Impact Dashboard</Text>

            <View className="bg-green-100 p-4 rounded-xl mb-4">
                <Text className="text-lg font-semibold">🍱 Total Meals Served</Text>
                <Text className="text-2xl font-bold">{totalMeals}</Text>
            </View>

            <View className="bg-yellow-100 p-4 rounded-xl mb-4">
                <Text className="text-lg font-semibold">🥗 Total Food Saved (kg)</Text>
                <Text className="text-2xl font-bold">{totalWeight}</Text>
            </View>

            <View className="bg-blue-100 p-4 rounded-xl mb-4">
                <Text className="text-lg font-semibold">🏆 Top Contributors</Text>
                <FlatList
                    data={topContributors}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item, index }) => (
                        <Text className="text-base mt-1">{index + 1}. {item.name} - {item.count} meals</Text>
                    )}
                />
            </View>

            <View className="bg-purple-100 p-4 rounded-xl">
                <Text className="text-lg font-semibold">📈 Daily Donations</Text>
                {Object.entries(dailyStats).map(([date, count]) => (
                    <Text key={date} className="text-base mt-1">
                        {moment(date).format("MMM DD")} - {count} meals
                    </Text>
                ))}
            </View>
        </View>
    );
};

export default Dashboard;
