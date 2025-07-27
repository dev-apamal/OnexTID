import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles } from "../../constants/styles";
import { FlatList, RefreshControl, Text, View } from "react-native";
import JobCard from "../../components/ui/JobCard";
import { fetchAllJobs } from "../../services/jobs/fetch";
import React, { useEffect, useState } from "react";
import JobCardSkeleton from "../../components/ui/JobCardSkeleton";
import { useCallback } from "react";

const MemoizedJobCard = React.memo(JobCard);

export default function HomeScreen() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const jobData = await fetchAllJobs();
      setJobs(jobData);
    } catch (err) {
      setError(err.message);
      console.error("Error loading jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const jobData = await fetchAllJobs(false);
      setJobs(jobData);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const renderJob = useCallback(
    ({ item }) => <MemoizedJobCard job={item} />,
    []
  );

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
          <View className="gap-4">
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={globalStyles.safeAreaContainer}>
        <View style={[globalStyles.content, { justifyContent: "flex-start" }]}>
          <View className="flex-col w-full gap-1 mb-6">
            <Text className="text-4xl font-bold">Home</Text>
            <Text className="text-base font-medium text-gray-600">
              Ready to find your perfect job match?
            </Text>
          </View>
          <View style={[{ justifyContent: "center", alignItems: "center" }]}>
            <Text className="text-red-600 text-center mb-4">
              Error: {error}
            </Text>
            <Text className="text-blue-600 underline" onPress={loadJobs}>
              Tap to retry
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
        {jobs.length > 0 && (
          <Text className="text-sm text-gray-600 mb-4">
            {jobs.length} jobs available • Pull down to refresh
          </Text>
        )}
        <FlatList
          data={jobs}
          renderItem={renderJob}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center py-20">
              <Text className="text-gray-600 text-center mb-2">
                No jobs available
              </Text>
              <Text className="text-gray-500 text-sm text-center">
                Pull down to refresh and check for new jobs
              </Text>
            </View>
          )}
          removeClippedSubviews={true}
          maxToRenderPerBatch={8}
        />
      </View>
    </SafeAreaView>
  );
}
