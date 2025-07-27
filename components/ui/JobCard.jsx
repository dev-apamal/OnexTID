import { Pressable, Text, View } from "react-native";

export default function JobCard() {
  return (
    <Pressable className="border border-gray-300 rounded-2xl p-4 bg-white">
      {/* Title & Subtitle */}
      <View className="mb-3">
        <Text className="text-lg font-semibold ">Position Name</Text>
        {/* <Text className="text-base text-gray-700">Position</Text> */}
      </View>

      {/* Job Details Grid */}
      <View className="mb-3">
        <View className="gap-y-4">
          {/* Row 1 */}
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <Text className="text-xs text-gray-600 uppercase tracking-wide">
                Salary
              </Text>
              <Text className="text-sm font-medium">$75,000 - $95,000</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-600 uppercase tracking-wide">
                Location
              </Text>
              <Text className="text-sm font-medium">San Francisco, CA</Text>
            </View>
          </View>

          {/* Row 2 */}
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <Text className="text-xs text-gray-600 uppercase tracking-wide">
                Hospital
              </Text>
              <Text className="text-sm font-medium">General Hospital</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-600 uppercase tracking-wide">
                Schedule
              </Text>
              <Text className="text-sm font-medium">Full-time</Text>
            </View>
          </View>

          {/* Row 3 */}
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <Text className="text-xs text-gray-600 uppercase tracking-wide">
                Start Date
              </Text>
              <Text className="text-sm font-medium">Immediate</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-600 uppercase tracking-wide">
                Type
              </Text>
              <Text className="text-sm font-medium">Permanent</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Metadata */}
      <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
        <View>
          <Text className="text-xs text-gray-600">Posted by</Text>
          <Text className="text-sm font-medium text-gray-600">
            Dr. Sarah Johnson
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-gray-600">Posted on</Text>
          <Text className="text-sm font-medium text-gray-600">
            Jan 15, 2024
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
