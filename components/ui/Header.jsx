// components/ui/HomeHeader.jsx
import { Text, View } from "react-native";

export default function HomeHeader({ jobCount, showCacheInfo = false }) {
  return (
    <View className="flex-col w-full gap-1 mb-6">
      <Text className="text-4xl font-bold">Home</Text>
      <Text className="text-base font-medium text-gray-600">
        Ready to find your perfect job match?
      </Text>

      {jobCount > 0 && (
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-xs text-gray-600">
            {jobCount} jobs available • Pull down to refresh
          </Text>
        </View>
      )}
    </View>
  );
}
