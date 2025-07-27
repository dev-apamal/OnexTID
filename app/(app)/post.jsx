// PostJobScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { postJob } from "../../services/jobs/post";
import { useAuth } from "../../contexts/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles } from "../../constants/styles";

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

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) newErrors.date = "Job date is required";
    if (!formData.hospital.trim())
      newErrors.hospital = "Hospital name is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.position) newErrors.position = "Position is required";
    if (!formData.type) newErrors.type = "Job type is required";
    if (!formData.schedule.trim()) newErrors.schedule = "Schedule is required";

    // Validate salary/wage
    if (formData.type === "permanent") {
      if (!formData.salary || parseFloat(formData.salary) < 10000) {
        newErrors.salary = "Salary must be at least ₹10,000";
      }
    } else if (formData.type === "relieving") {
      if (!formData.salary || parseFloat(formData.salary) < 300) {
        newErrors.salary = "Wage must be at least ₹300";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

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
        Alert.alert("Success!", "Job posted successfully!");
      } else {
        Alert.alert("Error", result.message || "Failed to post job");
      }
    } catch (error) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedData(null);
    setErrors({});
  };

  // Generate date options (next 7 days)
  const generateDateOptions = () => {
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
  };

  // Success Screen
  if (submittedData) {
    return (
      <ScrollView>
        <View>
          <View>
            <Text>✅</Text>
          </View>
          <Text>Job Posted Successfully!</Text>
          <Text>Your job posting is now live and ready for applications.</Text>
        </View>

        <View>
          <Text>Job Summary</Text>

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
            <View key={index}>
              <Text>{item.label}:</Text>
              <Text>{item.value}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={resetForm}>
          <Text>Post Another Job</Text>
        </TouchableOpacity>
      </ScrollView>
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
        >
          <View
            style={[globalStyles.content, { justifyContent: "flex-start" }]}
          >
            <View>
              <Text>Post a Job</Text>
              <Text>Ready to find your perfect job match?</Text>
            </View>
          </View>

          <View>
            {/* Job Date */}
            <View>
              <Text>Start Date</Text>
              <Pressable
                style={[errors.date && styles.fieldError]}
                onPress={() => setShowDateModal(true)}
              >
                <Text>
                  {formData.date
                    ? new Date(formData.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Select job date"}
                </Text>
                <Text>▼</Text>
              </Pressable>
              {errors.date && (
                <Text style={styles.errorText}>{errors.date}</Text>
              )}
            </View>

            {/* Hospital */}
            <View>
              <Text>🏥 Hospital</Text>
              <TextInput
                style={[errors.hospital && styles.fieldError]}
                value={formData.hospital}
                onChangeText={(value) => handleInputChange("hospital", value)}
                placeholder="Enter hospital name"
                returnKeyType="next"
                blurOnSubmit={false}
              />
              {errors.hospital && (
                <Text style={styles.errorText}>{errors.hospital}</Text>
              )}
            </View>

            {/* Location */}
            <View>
              <Text>📍 Location</Text>
              <TextInput
                style={[errors.location && styles.fieldError]}
                value={formData.location}
                onChangeText={(value) => handleInputChange("location", value)}
                placeholder="Enter location (city, state)"
                returnKeyType="next"
                blurOnSubmit={false}
              />
              {errors.location && (
                <Text style={styles.errorText}>{errors.location}</Text>
              )}
            </View>

            {/* Position */}
            <View>
              <Text>💼 Position</Text>
              <TouchableOpacity
                style={[errors.position && styles.fieldError]}
                onPress={() => setShowPositionModal(true)}
              >
                <Text>{formData.position || "Select position"}</Text>
                <Text>▼</Text>
              </TouchableOpacity>
              {errors.position && (
                <Text style={styles.errorText}>{errors.position}</Text>
              )}
            </View>

            {/* Job Type */}
            <View>
              <Text>📋 Job Type</Text>
              <TouchableOpacity
                style={[errors.type && styles.fieldError]}
                onPress={() => setShowTypeModal(true)}
              >
                <Text>
                  {formData.type
                    ? formData.type.charAt(0).toUpperCase() +
                      formData.type.slice(1)
                    : "Select job type"}
                </Text>
                <Text>▼</Text>
              </TouchableOpacity>
              {errors.type && (
                <Text style={styles.errorText}>{errors.type}</Text>
              )}
            </View>

            {/* Salary/Wage */}
            {formData.type && (
              <View>
                <Text>
                  💰 {formData.type === "permanent" ? "Salary" : "Wage"}
                </Text>
                <TextInput
                  style={[errors.salary && styles.fieldError]}
                  value={formData.salary}
                  onChangeText={(value) => handleInputChange("salary", value)}
                  placeholder={
                    formData.type === "permanent"
                      ? "Enter salary amount (min ₹10,000)"
                      : "Enter wage amount (min ₹300)"
                  }
                  keyboardType="numeric"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
                {errors.salary && (
                  <Text style={styles.errorText}>{errors.salary}</Text>
                )}
              </View>
            )}

            {/* Schedule */}
            <View>
              <Text>🕐 Schedule</Text>
              <TextInput
                style={[errors.schedule && styles.fieldError]}
                value={formData.schedule}
                onChangeText={(value) => handleInputChange("schedule", value)}
                placeholder="e.g., 9:00 AM to 5:00 PM"
                returnKeyType="done"
              />
              {errors.schedule && (
                <Text style={styles.errorText}>{errors.schedule}</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
              <Text>{isSubmitting ? "Posting Job..." : "Post Job"}</Text>
            </TouchableOpacity>
          </View>

          {/* Date Modal */}
          <Modal visible={showDateModal} animationType="slide" transparent>
            <View>
              <View>
                <View>
                  <Text>Select Job Date</Text>
                  <TouchableOpacity onPress={() => setShowDateModal(false)}>
                    <Text>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {generateDateOptions().map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        handleInputChange("date", option.value);
                        setShowDateModal(false);
                      }}
                    >
                      <Text>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Position Modal */}
          <Modal visible={showPositionModal} animationType="slide" transparent>
            <View>
              <View>
                <View>
                  <Text>Select Position</Text>
                  <TouchableOpacity onPress={() => setShowPositionModal(false)}>
                    <Text>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {positionOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => {
                        handleInputChange("position", option);
                        setShowPositionModal(false);
                      }}
                    >
                      <Text>{option}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Type Modal */}
          <Modal visible={showTypeModal} animationType="slide" transparent>
            <View>
              <View>
                <View>
                  <Text>Select Job Type</Text>
                  <TouchableOpacity onPress={() => setShowTypeModal(false)}>
                    <Text>✕</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView>
                  {typeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        handleInputChange("type", option.value);
                        setShowTypeModal(false);
                      }}
                    >
                      <Text>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Only error-related styles kept
const styles = StyleSheet.create({
  fieldError: {
    borderBottomColor: "#dc2626",
  },
  errorText: {
    fontSize: 15,
    color: "#dc2626",
    marginTop: 8,
  },
});

export default PostJobScreen;
