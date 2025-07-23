// app/(app)/_layout.tsx
import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import LoadingScreen from "../../components/ui/LoadingScreen";

export default function AppLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
