import { Pressable, Text, View } from "react-native";
import { toTitleCase } from "../../utils/textUtils";

export default function JobCard({ job }) {
  const jobData = {
    title: job?.title || "Position Not Specified",
    salary: job?.salary || "Salary not listed",
    location: job?.location || "Location not specified",
    hospital: job?.hospital || job?.company || "Hospital not specified",
    schedule: job?.schedule || job?.type || "Not specified",
    startDate: job?.startDate || job?.start_date || "Not specified",
    jobType: job?.jobType || job?.employment_type || "Not specified",
    postedBy: job?.postedBy || job?.posted_by || "Unknown",
    postedDate:
      job?.postedDate || job?.posted_date || job?.createdAt || "Unknown",
    ...job,
  };

  const formatDate = (date) => {
    if (!date) return "Unknown";

    try {
      // Handle Firestore timestamp
      if (date?.toDate) {
        return date.toDate().toLocaleDateString();
      }

      // Handle regular date
      if (date instanceof Date) {
        return date.toLocaleDateString();
      }

      // Handle string date
      if (typeof date === "string") {
        const parsedDate = new Date(date);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toLocaleDateString();
        }
      }

      return date.toString();
    } catch (error) {
      return "Unknown";
    }
  };

  return (
    <Pressable className=" rounded-2xl p-4 bg-neutral-100">
      {/* Title & Subtitle */}
      <View className="mb-3">
        <Text className="text-lg font-semibold ">{jobData.position}</Text>
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
              <Text className="text-sm font-medium">{jobData.salary}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-600 uppercase tracking-wide">
                Location
              </Text>
              <Text className="text-sm font-medium">
                {toTitleCase(jobData.location)}
              </Text>
            </View>
          </View>

          {/* Row 2 */}
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <Text className="text-xs text-gray-600 uppercase tracking-wide">
                Hospital
              </Text>
              <Text className="text-sm font-medium">
                {toTitleCase(jobData.hospital)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-600 uppercase tracking-wide">
                Schedule
              </Text>
              <Text className="text-sm font-medium">{jobData.schedule}</Text>
            </View>
          </View>

          {/* Row 3 */}
          <View className="flex-row gap-x-4">
            <View className="flex-1">
              <Text className="text-xs text-gray-600 uppercase tracking-wide">
                Start Date
              </Text>
              <Text className="text-sm font-medium">{jobData.date}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-600 uppercase tracking-wide">
                Type
              </Text>
              <Text className="text-sm font-medium">
                {toTitleCase(jobData.type)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Metadata */}
      <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
        <View>
          <Text className="text-xs text-gray-600">Posted by</Text>
          <Text className="text-sm font-medium text-gray-600">
            {jobData.createdBy}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-xs text-gray-600">Posted on</Text>
          <Text className="text-sm font-medium text-gray-600">
            {formatDate(jobData.createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
