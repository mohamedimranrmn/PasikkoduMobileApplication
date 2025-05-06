import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';
import '../../global.css';
const Layout=()=> {
    return (
        <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="screens" options={{ headerShown: false }} />
            <Toast/>
        </Stack>
    );
}
export default Layout;