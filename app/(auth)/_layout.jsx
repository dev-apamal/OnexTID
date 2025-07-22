// app/(auth)/_layout.tsx
import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import LoadingScreen from "../../components/ui/LoadingScreen";

export default function AuthLayout() {
  const { user, isLoading } = useAuth();

  // Show loading screen while checking auth state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If user is authenticated, redirect to main app
  if (user) {
    return <Redirect href="/(app)" />;
  }

  // Show auth stack for unauthenticated users
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
    </Stack>
  );
}
