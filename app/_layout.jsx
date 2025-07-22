// app/_layout.tsx
import { Stack, SplashScreen } from "expo-router";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { useEffect } from "react";

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

// Splash screen controller component
function SplashScreenController() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Hide splash screen once auth state is determined
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SplashScreenController />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Authentication Routes */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        {/* Protected App Routes */}
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
