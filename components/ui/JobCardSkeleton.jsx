import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";

// Skeleton component that exactly matches your JobCard layout
export default function JobCardSkeleton() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: false,
        }),
      ]).start(() => shimmer());
    };
    shimmer();
  }, [shimmerAnim]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  const SkeletonBox = ({ width, height, style }) => (
    <Animated.View
      style={[
        {
          backgroundColor: "#e0e0e0",
          borderRadius: 4,
          width,
          height,
          opacity: shimmerOpacity,
        },
        style,
      ]}
    />
  );

  return (
    <View className="border border-gray-300 w-full rounded-2xl p-4 bg-white">
      {/* Title & Subtitle - matches your jobData.position */}
      <View className="mb-3">
        <SkeletonBox width="75%" height={22} />
      </View>

      {/* Job Details Grid - exactly matches your 3 rows */}
      <View className="mb-3">
        <View className="gap-y-4">
          {/* Row 1 - Salary and Location */}
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <SkeletonBox
                width="50%"
                height={10}
                style={{ marginBottom: 6 }}
              />
              <SkeletonBox width="85%" height={14} />
            </View>
            <View className="flex-1">
              <SkeletonBox
                width="60%"
                height={10}
                style={{ marginBottom: 6 }}
              />
              <SkeletonBox width="90%" height={14} />
            </View>
          </View>

          {/* Row 2 - Hospital and Schedule */}
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <SkeletonBox
                width="55%"
                height={10}
                style={{ marginBottom: 6 }}
              />
              <SkeletonBox width="80%" height={14} />
            </View>
            <View className="flex-1">
              <SkeletonBox
                width="60%"
                height={10}
                style={{ marginBottom: 6 }}
              />
              <SkeletonBox width="70%" height={14} />
            </View>
          </View>

          {/* Row 3 - Start Date and Type */}
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <SkeletonBox
                width="65%"
                height={10}
                style={{ marginBottom: 6 }}
              />
              <SkeletonBox width="70%" height={14} />
            </View>
            <View className="flex-1">
              <SkeletonBox
                width="35%"
                height={10}
                style={{ marginBottom: 6 }}
              />
              <SkeletonBox width="60%" height={14} />
            </View>
          </View>
        </View>
      </View>

      {/* Metadata - matches your Posted by and Posted on */}
      <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
        <View>
          <SkeletonBox width={60} height={10} style={{ marginBottom: 4 }} />
          <SkeletonBox width={90} height={14} />
        </View>
        <View className="items-end">
          <SkeletonBox width={65} height={10} style={{ marginBottom: 4 }} />
          <SkeletonBox width={80} height={14} />
        </View>
      </View>
    </View>
  );
}

// Static version (no animation) - better performance
export function StaticJobCardSkeleton() {
  const SkeletonBox = ({ width, height, style }) => (
    <View
      style={[
        {
          backgroundColor: "#e0e0e0",
          borderRadius: 4,
          width,
          height,
        },
        style,
      ]}
    />
  );

  return (
    <View className="border border-gray-300 rounded-2xl p-4 bg-white">
      {/* Title & Subtitle */}
      <View className="mb-3">
        <SkeletonBox width="75%" height={22} />
      </View>

      {/* Job Details Grid */}
      <View className="mb-3">
        <View className="gap-y-4">
          {/* Row 1 - Salary and Location */}
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <SkeletonBox
                width="50%"
                height={10}
                style={{ marginBottom: 6 }}
              />
              <SkeletonBox width="85%" height={14} />
            </View>
            <View className="flex-1">
              <SkeletonBox
                width="60%"
                height={10}
                style={{ marginBottom: 6 }}
              />
              <SkeletonBox width="90%" height={14} />
            </View>
          </View>

          {/* Row 2 - Hospital and Schedule */}
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <SkeletonBox
                width="55%"
                height={10}
                style={{ marginBottom: 6 }}
              />
              <SkeletonBox width="80%" height={14} />
            </View>
            <View className="flex-1">
              <SkeletonBox
                width="60%"
                height={10}
                style={{ marginBottom: 6 }}
              />
              <SkeletonBox width="70%" height={14} />
            </View>
          </View>

          {/* Row 3 - Start Date and Type */}
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <SkeletonBox
                width="65%"
                height={10}
                style={{ marginBottom: 6 }}
              />
              <SkeletonBox width="70%" height={14} />
            </View>
            <View className="flex-1">
              <SkeletonBox
                width="35%"
                height={10}
                style={{ marginBottom: 6 }}
              />
              <SkeletonBox width="60%" height={14} />
            </View>
          </View>
        </View>
      </View>

      {/* Metadata */}
      <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
        <View>
          <SkeletonBox width={60} height={10} style={{ marginBottom: 4 }} />
          <SkeletonBox width={90} height={14} />
        </View>
        <View className="items-end">
          <SkeletonBox width={65} height={10} style={{ marginBottom: 4 }} />
          <SkeletonBox width={80} height={14} />
        </View>
      </View>
    </View>
  );
}

// Multiple skeleton cards
export function JobSkeletonList({ count = 3 }) {
  return (
    <View>
      {Array.from({ length: count }, (_, index) => (
        <View key={index}>
          <JobCardSkeleton />
          {index < count - 1 && <View style={{ height: 16 }} />}
        </View>
      ))}
    </View>
  );
}

// Usage Examples:
/*
// 1. Single skeleton (animated)
<JobCardSkeleton />

// 2. Multiple skeletons
<JobSkeletonList count={4} />

// 3. Static version (better performance)
<StaticJobCardSkeleton />

// 4. In your loading state:
if (loading) {
  return (
    <SafeAreaView style={globalStyles.safeAreaContainer}>
      <View style={[globalStyles.content, { justifyContent: "flex-start" }]}>
        <View className="flex-col w-full gap-1 mb-6">
          <Text className="text-4xl font-bold">Home</Text>
          <Text className="text-base font-medium text-gray-600">
            Ready to find your perfect job match?
          </Text>
        </View>
        <JobSkeletonList count={4} />
      </View>
    </SafeAreaView>
  );
}
*/
