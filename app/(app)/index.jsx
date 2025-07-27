import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles } from "../../constants/styles";
import { Pressable, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import JobCard from "../../components/ui/JobCard";

export default function HomeScreen() {
  return (
    <SafeAreaView style={globalStyles.safeAreaContainer}>
      <View style={[globalStyles.content, { justifyContent: "flex-start" }]}>
        {/* Header Content */}
        <View className="flex-col w-full gap-1 mb-6">
          <Text className="text-4xl font-bold">Home</Text>
          <Text className="text-base font-medium text-gray-600">
            Ready to find your perfect job match?
          </Text>
        </View>

        <JobCard />
      </View>
    </SafeAreaView>
  );
}
