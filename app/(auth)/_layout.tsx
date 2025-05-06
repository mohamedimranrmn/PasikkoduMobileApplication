import { Stack } from 'expo-router';
import '../../global.css';

const Layout=()=> {
    return (
        <Stack>
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="sign-up" options={{ headerShown: false }} />
            <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        </Stack>
    );
}
export default Layout;