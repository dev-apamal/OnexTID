import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles } from "../../constants/styles";
import { useAuth } from "../../contexts/AuthContext";
import { useJobs } from "../../hooks/useJobs";

export default function AccountScreen() {
  const { user, userProfile } = useAuth();
  const { clearCache } = useJobs();

  const handleLogout = () => {
    clearCache();
  };

  return (
    <SafeAreaView style={globalStyles.safeAreaContainer}>
      <View style={[globalStyles.content, { justifyContent: "flex-start" }]}>
        <View className="flex-col w-full gap-1 mb-6">
          <Text className="text-4xl font-bold">My Account</Text>
          <Text className="text-base font-medium text-gray-600">
            Ready to find your perfect job match?
          </Text>
        </View>
        <View className="rounded-2xl p-4 bg-neutral-100">
          <View className="mb-3">
            <Text className="text-lg font-semibold ">{user?.displayName}</Text>
          </View>
          <View className="mb-3">
            <View className="gap-y-4">
              {/* Row 1 */}
              <View className="flex-row gap-x-4">
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 uppercase tracking-wide">
                    Email
                  </Text>
                  <Text className="text-sm font-medium">{user?.email}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 uppercase tracking-wide">
                    Phone Number
                  </Text>
                  <Text className="text-sm font-medium">
                    {userProfile?.phoneNumber}
                  </Text>
                </View>
              </View>

              {/* Row 2 */}
              <View className="flex-row gap-x-4">
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 uppercase tracking-wide">
                    TCMC Number
                  </Text>
                  <Text className="text-sm font-medium">
                    {userProfile?.tcmcNumber}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-600 uppercase tracking-wide">
                    TCMC Verified
                  </Text>
                  <Text className="text-sm font-medium">
                    {userProfile?.tcmcVerified ? "Verified" : "Pending"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
