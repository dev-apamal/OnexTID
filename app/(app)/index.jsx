import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles } from "../../constants/styles";
import { FlatList, RefreshControl, Text, View } from "react-native";
import JobCard from "../../components/ui/JobCard";
import React from "react";
import JobCardSkeleton from "../../components/ui/JobCardSkeleton";
import { useCallback } from "react";
import { useJobs } from "../../hooks/useJobs";
import HomeHeader from "../../components/ui/Header";
import ErrorMessage from "../../components/ui/ErrorMessage";

const MemoizedJobCard = React.memo(JobCard);

const SKELETON_COUNT = 4;
const ITEM_SEPARATOR_HEIGHT = 16;
const LIST_PADDING_BOTTOM = 16;
const MAX_RENDER_PER_BATCH = 8;

export default function HomeScreen() {
  const { jobs, loading, error, refreshing, loadJobs, onRefresh } = useJobs();

  const renderJob = useCallback(
    ({ item }) => <MemoizedJobCard job={item} />,
    []
  );

  const renderSeparator = useCallback(
    () => <View style={{ height: ITEM_SEPARATOR_HEIGHT }} />,
    []
  );

  const renderEmptyComponent = useCallback(
    () => (
      <View className="flex-1 justify-center items-center py-20">
        <Text className="text-gray-600 text-center mb-2">
          No jobs available
        </Text>
        <Text className="text-gray-600 text-sm text-center">
          Pull down to refresh and check for new jobs
        </Text>
      </View>
    ),
    []
  );

  if (loading) {
    return (
      <SafeAreaView style={globalStyles.safeAreaContainer}>
        <View style={[globalStyles.content, { justifyContent: "flex-start" }]}>
          <HomeHeader jobCount={0} />
          <View className="gap-4">
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <JobCardSkeleton key={index} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={globalStyles.safeAreaContainer}>
        <View style={[globalStyles.content, { justifyContent: "flex-start" }]}>
          <HomeHeader jobCount={0} />
          <ErrorMessage error={error} onRetry={loadJobs} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeAreaContainer}>
      <View style={[globalStyles.content, { justifyContent: "flex-start" }]}>
        {/* Header Content */}
        <HomeHeader jobCount={jobs.length} />
        <FlatList
          data={jobs}
          renderItem={renderJob}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={{ paddingBottom: LIST_PADDING_BOTTOM }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={MAX_RENDER_PER_BATCH}
        />
      </View>
    </SafeAreaView>
  );
}
