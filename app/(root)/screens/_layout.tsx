import { Stack } from 'expo-router';
import '../../../global.css';
const Layout=()=> {
    return (
        <Stack>
            <Stack.Screen name="AboutUs" options={{ headerShown: false }} />
            <Stack.Screen name="Checkout" options={{ headerShown: false }} />
            <Stack.Screen name="DonateFood" options={{ headerShown: false }} />
            <Stack.Screen name="ListSurplus" options={{ headerShown: false }} />
            <Stack.Screen name="Marketplace" options={{ headerShown: false }} />
            <Stack.Screen name="RequestFood" options={{ headerShown: false }} />
            <Stack.Screen name="VolunteersScreen" options={{ headerShown: false }} />
        </Stack>
    );
}
export default Layout;