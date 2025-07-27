// Create: components/ui/ErrorMessage.jsx
import { Text, View, Pressable } from "react-native";

export default function ErrorMessage({ error, onRetry }) {
  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      <Text className="text-red-600 text-center mb-4">Error: {error}</Text>
      <Pressable onPress={onRetry}>
        <Text className="text-blue-600 underline">Tap to retry</Text>
      </Pressable>
    </View>
  );
}
