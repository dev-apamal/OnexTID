import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { router } from "expo-router";
import "react-native-reanimated";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import "../global.css";

// Create a separate component for navigation logic
function NavigationHandler({ children }) {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // No user, redirect to sign-in
        router.replace("/(auth)/sign-in");
      } else if (!user.emailVerified) {
        // User exists but not verified, redirect to verify-email
        router.replace("/(auth)/verify-email");
      } else {
        // User verified, redirect to main app
        router.replace("/(app)/");
      }
    }
  }, [user, isLoading]);

  // Show loading while determining auth state
  if (isLoading) {
    return null; // or a loading screen
  }

  return children;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NavigationHandler>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Auth routes */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          {/* Main app routes */}
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          {/* Error route */}
        </Stack>
      </NavigationHandler>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
