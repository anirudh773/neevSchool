import { Stack, Tabs } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="screens/LoadingScreen" options={{ headerShown: false }} />
      <Stack.Screen name="screens/LoginPage" options={{ headerShown: false }} />
      {/* <Stack.Screen name="(drawer)" options={{ headerShown: false }} /> */}
      <Tabs.Screen 
        name="(tab)" 
        options={{ 
          headerShown: false, // Hide header for the tabs screen
        }} 
      />
    </Stack>
  );
}
