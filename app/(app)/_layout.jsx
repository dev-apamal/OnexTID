// app/(app)/_layout.tsx
import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import LoadingScreen from "../../components/ui/LoadingScreen";

export default function AppLayout() {
  const { user, isLoading } = useAuth();

  // Show loading screen while checking auth state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If user is not authenticated, redirect to sign-in
  if (!user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Show protected app routes for authenticated users
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      {/* Add more protected screens here as needed */}
    </Stack>
  );
}
