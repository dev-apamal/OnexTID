// PostJobScreen.js
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles } from "../../constants/styles";
import { useAuth } from "../../contexts/AuthContext";
import { postJob } from "../../services/jobs/post";
import { toTitleCase } from "../../utils/textUtils";

const PostJobScreen = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: "",
    hospital: "",
    location: "",
    position: "",
    salary: "",
    schedule: "",
    type: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  // Modal states
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);

  // Input refs for focus management
  const hospitalRef = useRef(null);
  const locationRef = useRef(null);
  const salaryRef = useRef(null);
  const scheduleRef = useRef(null);

  const authenticatedUser = user?.displayName || user?.email;
  const userId = user?.uid;

  const positionOptions = [
    "General Practitioner",
    "Casualty Duty",
    "Resident Medical Officer",
  ];

  const typeOptions = [
    { label: "Permanent", value: "permanent" },
    { label: "Relieving", value: "relieving" },
  ];

  // Handle Android back button for modals
  useEffect(() => {
    const onBackPress = () => {
      if (showPositionModal) {
        setShowPositionModal(false);
        return true;
      }
      if (showTypeModal) {
        setShowTypeModal(false);
        return true;
      }
      if (showDateModal) {
        setShowDateModal(false);
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onBackPress
    );
    return () => subscription?.remove();
  }, [showPositionModal, showTypeModal, showDateModal]);

  const handleInputChange = useCallback(
    (name, value) => {
      // Format salary input with proper number formatting
      if (name === "salary") {
        // Remove any non-numeric characters except decimal
        const numericValue = value.replace(/[^0-9.]/g, "");
        // Prevent multiple decimal points
        const parts = numericValue.split(".");
        const formattedValue =
          parts.length > 2
            ? parts[0] + "." + parts.slice(1).join("")
            : numericValue;

        setFormData((prev) => ({
          ...prev,
          [name]: formattedValue,
        }));
      } else {
        // Auto-trim hospital and location fields
        const processedValue =
          name === "hospital" || name === "location"
            ? value.replace(/\s+/g, " ") // Replace multiple spaces with single space
            : value;

        setFormData((prev) => ({
          ...prev,
          [name]: processedValue,
        }));
      }

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.date) newErrors.date = "Job date is required";
    if (!formData.hospital.trim())
      newErrors.hospital = "Hospital name is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.position) newErrors.position = "Position is required";
    if (!formData.type) newErrors.type = "Job type is required";
    if (!formData.schedule.trim()) newErrors.schedule = "Schedule is required";

    // Enhanced salary validation
    if (formData.type === "permanent") {
      const salaryNum = parseFloat(formData.salary);
      if (!formData.salary || isNaN(salaryNum) || salaryNum < 10000) {
        newErrors.salary = "Salary must be at least ₹10,000";
      }
    } else if (formData.type === "relieving") {
      const wageNum = parseFloat(formData.salary);
      if (!formData.salary || isNaN(wageNum) || wageNum < 300) {
        newErrors.salary = "Wage must be at least ₹300";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const submitData = {
        date: formData.date,
        hospital: formData.hospital.trim(),
        location: formData.location.trim(),
        position: formData.position,
        salary: parseFloat(formData.salary),
        schedule: formData.schedule.trim(),
        type: formData.type,
      };

      const result = await postJob(submitData, userId, authenticatedUser);

      if (result.success) {
        setSubmittedData(result.data);
        setFormData({
          date: "",
          hospital: "",
          location: "",
          position: "",
          salary: "",
          schedule: "",
          type: "",
        });
        setErrors({});
        Alert.alert("Success!", "Job posted successfully!");
      } else {
        Alert.alert("Error", result.message || "Failed to post job");
      }
    } catch (error) {
      console.error("Post job error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, validateForm, userId, authenticatedUser]);

  const resetForm = useCallback(() => {
    setSubmittedData(null);
    setErrors({});
  }, []);

  // Memoized date options generation for better performance
  const dateOptions = useMemo(() => {
    const options = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split("T")[0];
      const displayDate = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      options.push({ value: dateString, label: displayDate });
    }
    return options;
  }, []);

  // Focus management functions
  const focusNext = useCallback((nextRef) => {
    nextRef?.current?.focus();
  }, []);

  // Success Screen
  if (submittedData) {
    return (
      <SafeAreaView style={globalStyles.safeAreaContainer}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              globalStyles.content,
              { justifyContent: "flex-start", gap: 24 },
            ]}
          >
            <View className="flex-col gap-2 items-center">
              <MaterialIcons name="check-circle" size={24} color="green" />
              <Text className="text-2xl font-bold text-center">
                Posted Successfully!
              </Text>
              <Text className="text-base font-medium text-gray-600 text-center">
                Your job posting is now live and ready for applications.
              </Text>
            </View>
            <View className="border border-gray-300 rounded-2xl p-4 bg-white">
              {[
                { label: "Position", value: submittedData.position },
                { label: "Hospital", value: submittedData.hospital },
                { label: "Location", value: submittedData.location },
                { label: "Date", value: submittedData.date },
                { label: "Schedule", value: submittedData.schedule },
                { label: "Type", value: submittedData.type },
                {
                  label: submittedData.type === "permanent" ? "Salary" : "Wage",
                  value: `₹${submittedData.salary?.toLocaleString()}`,
                },
              ].map((item, index) => (
                <View
                  key={index}
                  className="flex-row justify-between border-b border-b-gray-100 pb-4 pt-4 mb-4"
                >
                  <Text className="text-gray-600 font-medium">
                    {item.label}
                  </Text>
                  <Text className="font-medium">{toTitleCase(item.value)}</Text>
                </View>
              ))}
            </View>

            <Pressable style={globalStyles.button} onPress={resetForm}>
              <Text className="text-lg font-bold text-white">
                Post Another Job
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={globalStyles.safeAreaContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          accessible={true}
          accessibilityLabel="Job posting form"
        >
          <View
            style={[globalStyles.content, { justifyContent: "flex-start" }]}
          >
            <View className="flex-col w-full gap-1 mb-6">
              <Text className="text-4xl font-bold">Post a Job</Text>
              <Text className="text-base font-medium text-gray-600">
                Let the right people find you.
              </Text>
            </View>

            {/* Form Container */}
            <View>
              <View className="gap-4">
                {/* Hospital */}
                <View className="gap-2">
                  <Text className="text-sm font-medium">Hospital Name</Text>
                  <View>
                    <TextInput
                      className="bg-neutral-100"
                      ref={hospitalRef}
                      style={[
                        styles.modernInput,
                        errors.hospital && styles.errorInput,
                      ]}
                      value={formData.hospital}
                      onChangeText={(value) =>
                        handleInputChange("hospital", value)
                      }
                      placeholder="Enter hospital name"
                      placeholderTextColor="#9ca3af"
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => focusNext(locationRef)}
                      editable={!isSubmitting}
                      autoCapitalize="words"
                      textContentType="organizationName"
                      accessible={true}
                      accessibilityLabel="Hospital name input"
                      accessibilityHint="Enter the name of the hospital"
                    />
                  </View>
                  {errors.hospital && (
                    <Text className="text-sm text-red-500">
                      {errors.hospital}
                    </Text>
                  )}
                </View>

                {/* Location */}
                <View className="gap-2">
                  <Text className="text-sm font-medium">Location</Text>
                  <View>
                    <TextInput
                      ref={locationRef}
                      className="bg-neutral-100"
                      style={[
                        styles.modernInput,
                        errors.location && styles.errorInput,
                      ]}
                      value={formData.location}
                      onChangeText={(value) =>
                        handleInputChange("location", value)
                      }
                      placeholder="Enter location (city, state)"
                      placeholderTextColor="#9ca3af"
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => {
                        // Focus on salary if type is selected, otherwise position
                        if (formData.type && salaryRef.current) {
                          focusNext(salaryRef);
                        }
                      }}
                      editable={!isSubmitting}
                      autoCapitalize="words"
                      textContentType="addressCity"
                      accessible={true}
                      accessibilityLabel="Location input"
                      accessibilityHint="Enter the city and state"
                    />
                  </View>
                  {errors.location && (
                    <Text className="text-sm text-red-500 ">
                      {errors.location}
                    </Text>
                  )}
                </View>

                {/* Position */}
                <View className="gap-2">
                  <Text className="text-sm font-medium ">Position</Text>
                  <Pressable
                    className="bg-neutral-100"
                    style={[
                      styles.modernInput,
                      styles.selectInput,
                      errors.position && styles.errorInput,
                    ]}
                    onPress={() => !isSubmitting && setShowPositionModal(true)}
                    disabled={isSubmitting}
                    accessible={true}
                    accessibilityLabel="Position selector"
                    accessibilityHint="Tap to select a position"
                    accessibilityValue={{
                      text: formData.position || "No position selected",
                    }}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        { color: formData.position ? "#374151" : "#9ca3af" },
                      ]}
                    >
                      {formData.position || "Select Position"}
                    </Text>
                  </Pressable>
                  {errors.position && (
                    <Text className="text-sm text-red-500 ">
                      {errors.position}
                    </Text>
                  )}
                </View>

                {/* Job Type */}
                <View className="gap-2">
                  <Text className="text-sm font-medium">Job Type</Text>
                  <Pressable
                    className="bg-neutral-100"
                    style={[
                      styles.modernInput,
                      styles.selectInput,
                      errors.type && styles.errorInput,
                    ]}
                    onPress={() => !isSubmitting && setShowTypeModal(true)}
                    disabled={isSubmitting}
                    accessible={true}
                    accessibilityLabel="Job type selector"
                    accessibilityHint="Tap to select job type"
                    accessibilityValue={{
                      text: formData.type
                        ? formData.type.charAt(0).toUpperCase() +
                          formData.type.slice(1)
                        : "No job type selected",
                    }}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        { color: formData.type ? "#374151" : "#9ca3af" },
                      ]}
                    >
                      {formData.type
                        ? formData.type.charAt(0).toUpperCase() +
                          formData.type.slice(1)
                        : "Select job type"}
                    </Text>
                  </Pressable>
                  {errors.type && (
                    <Text className="text-sm text-red-500">{errors.type}</Text>
                  )}
                </View>

                {/* Salary/Wage */}
                {formData.type && (
                  <View className="gap-2">
                    <Text className="text-sm font-medium">
                      {formData.type === "permanent" ? "Salary" : "Wage"}
                      <Text className="text-xs text-gray-500 font-normal">
                        {" "}
                        (in ₹)
                      </Text>
                    </Text>
                    <View className="relative">
                      <Text style={styles.currencyPrefix}>₹</Text>
                      <TextInput
                        className="bg-neutral-100"
                        ref={salaryRef}
                        style={[
                          styles.modernInput,
                          styles.currencyInput,
                          errors.salary && styles.errorInput,
                        ]}
                        value={formData.salary}
                        onChangeText={(value) =>
                          handleInputChange("salary", value)
                        }
                        placeholder={
                          formData.type === "permanent"
                            ? "10,000 minimum"
                            : "300 minimum"
                        }
                        keyboardType="numeric"
                        returnKeyType="next"
                        placeholderTextColor="#9ca3af"
                        blurOnSubmit={false}
                        onSubmitEditing={() => focusNext(scheduleRef)}
                        editable={!isSubmitting}
                        accessible={true}
                        accessibilityLabel={`${formData.type === "permanent" ? "Salary" : "Wage"} input`}
                        accessibilityHint={`Enter the ${formData.type === "permanent" ? "salary" : "wage"} amount in rupees`}
                      />
                    </View>
                    {errors.salary && (
                      <Text className="text-sm text-red-500">
                        {errors.salary}
                      </Text>
                    )}
                  </View>
                )}

                {/* Job Date */}
                <View className="gap-2">
                  <Text className="text-sm font-medium ">Start Date</Text>
                  <Pressable
                    className="bg-neutral-100"
                    style={[
                      styles.modernInput,
                      styles.selectInput,
                      errors.date && styles.errorInput,
                    ]}
                    onPress={() => !isSubmitting && setShowDateModal(true)}
                    disabled={isSubmitting}
                    accessible={true}
                    accessibilityLabel="Start date selector"
                    accessibilityHint="Tap to select start date"
                    accessibilityValue={{
                      text: formData.date
                        ? new Date(formData.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "No date selected",
                    }}
                  >
                    <View className="flex-row items-center">
                      <Text
                        style={[
                          styles.selectText,
                          { color: formData.date ? "#374151" : "#9ca3af" },
                        ]}
                      >
                        {formData.date
                          ? new Date(formData.date).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "Select job date"}
                      </Text>
                    </View>
                  </Pressable>
                  {errors.date && (
                    <Text className="text-sm text-red-500">{errors.date}</Text>
                  )}
                </View>

                {/* Schedule */}
                <View className="gap-2">
                  <Text className="text-sm font-medium">Schedule</Text>
                  <View>
                    <TextInput
                      className="bg-neutral-100"
                      ref={scheduleRef}
                      style={[
                        styles.modernInput,
                        errors.schedule && styles.errorInput,
                      ]}
                      value={formData.schedule}
                      onChangeText={(value) =>
                        handleInputChange("schedule", value)
                      }
                      placeholder="e.g., 9:00 AM to 5:00 PM"
                      returnKeyType="done"
                      placeholderTextColor="#9ca3af"
                      onSubmitEditing={handleSubmit}
                      editable={!isSubmitting}
                      accessible={true}
                      accessibilityLabel="Schedule input"
                      accessibilityHint="Enter the work schedule"
                    />
                  </View>
                  {errors.schedule && (
                    <Text className="text-sm text-red-500">
                      {errors.schedule}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              accessible={true}
              accessibilityLabel={isSubmitting ? "Posting job" : "Post job"}
              accessibilityHint="Submit the job posting form"
            >
              <Text className="text-lg font-bold text-white">
                {isSubmitting ? "Posting Job..." : "Post Job"}
              </Text>
            </Pressable>

            {/* Modals */}
            {/* Date Modal */}
            <Modal visible={showDateModal} animationType="slide" transparent>
              <View style={styles.modalOverlay}>
                <View
                  className="bg-white rounded-t-3xl max-h-4/5"
                  style={styles.modalShadow}
                >
                  <View className="flex-row justify-between items-center p-4 border-b border-b-gray-200 mb-2">
                    <Text className="text-lg font-semibold text-gray-800">
                      Select Job Date
                    </Text>
                    <Pressable
                      onPress={() => setShowDateModal(false)}
                      className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                      accessible={true}
                      accessibilityLabel="Close date selector"
                    >
                      <Text className="text-base font-medium text-gray-600">
                        ✕
                      </Text>
                    </Pressable>
                  </View>
                  <ScrollView className="px-4 pb-4">
                    {dateOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        className="py-4 px-4 mb-2 bg-gray-50 rounded-xl border border-gray-200"
                        onPress={() => {
                          handleInputChange("date", option.value);
                          setShowDateModal(false);
                        }}
                        accessible={true}
                        accessibilityLabel={`Select ${option.label}`}
                      >
                        <Text className="text-base font-medium text-gray-700">
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </Modal>

            {/* Position Modal */}
            <Modal
              visible={showPositionModal}
              animationType="slide"
              transparent
            >
              <View style={styles.modalOverlay}>
                <View
                  className="bg-white rounded-t-3xl max-h-4/5"
                  style={styles.modalShadow}
                >
                  <View className="flex-row justify-between items-center p-4 border-b border-b-gray-200 mb-2">
                    <Text className="text-lg font-semibold text-gray-800">
                      Select Position
                    </Text>
                    <Pressable
                      onPress={() => setShowPositionModal(false)}
                      className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                      accessible={true}
                      accessibilityLabel="Close position selector"
                    >
                      <Text className="text-base font-medium text-gray-600">
                        ✕
                      </Text>
                    </Pressable>
                  </View>
                  <ScrollView className="px-4 pb-4">
                    {positionOptions.map((option) => (
                      <Pressable
                        key={option}
                        className="py-4 px-4 mb-2 bg-gray-50 rounded-xl border border-gray-200"
                        onPress={() => {
                          handleInputChange("position", option);
                          setShowPositionModal(false);
                        }}
                        accessible={true}
                        accessibilityLabel={`Select ${option}`}
                      >
                        <Text className="text-base font-medium text-gray-700">
                          {option}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </Modal>

            {/* Type Modal */}
            <Modal visible={showTypeModal} animationType="slide" transparent>
              <View style={styles.modalOverlay}>
                <View
                  className="bg-white rounded-t-3xl max-h-4/5"
                  style={styles.modalShadow}
                >
                  <View className="flex-row justify-between items-center p-4 border-b border-b-gray-200 mb-2">
                    <Text className="text-lg font-semibold text-gray-800">
                      Select Job Type
                    </Text>
                    <Pressable
                      onPress={() => setShowTypeModal(false)}
                      className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                      accessible={true}
                      accessibilityLabel="Close job type selector"
                    >
                      <Text className="text-base font-medium text-gray-600">
                        ✕
                      </Text>
                    </Pressable>
                  </View>
                  <ScrollView className="px-4 pb-4">
                    {typeOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        className="py-4 px-4 mb-2 bg-gray-50 rounded-xl border border-gray-200"
                        onPress={() => {
                          handleInputChange("type", option.value);
                          setShowTypeModal(false);
                        }}
                        accessible={true}
                        accessibilityLabel={`Select ${option.label}`}
                      >
                        <Text className="text-base font-medium text-gray-700">
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </Modal>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Modern Airbnb-inspired styles
const styles = StyleSheet.create({
  fieldError: {
    borderBottomColor: "#dc2626",
  },
  textInput: {
    fontSize: 16,
  },
  placeholderText: {
    fontSize: 16,
  },

  // Modern Input Styles
  modernInput: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },

  selectInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  selectText: {
    fontSize: 16,
    flex: 1,
  },

  errorInput: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },

  currencyPrefix: {
    position: "absolute",
    left: 16,
    top: "50%",
    marginTop: -10,
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    zIndex: 1,
  },

  currencyInput: {
    paddingLeft: 32,
  },

  submitButton: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 16,
    marginTop: 24,
    backgroundColor: "#1447e6",
  },

  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
    shadowOpacity: 0.1,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalShadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default PostJobScreen;
