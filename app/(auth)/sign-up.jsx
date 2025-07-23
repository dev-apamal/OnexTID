import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { globalStyles } from "../../constants/styles";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUpScreen() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "+91",
    tcmcNumber: "", // ← NEW: Added TCMC number field
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { signUp } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    // Validate each field using the same logic
    const fullNameError = validateField("fullName", formData.fullName);
    const emailError = validateField("email", formData.email);
    const phoneNumberError = validateField("phoneNumber", formData.phoneNumber);
    const tcmcNumberError = validateField("tcmcNumber", formData.tcmcNumber); // ← NEW
    const passwordError = validateField("password", formData.password);
    const confirmPasswordError = validateField(
      "confirmPassword",
      formData.confirmPassword
    );

    if (fullNameError) newErrors.fullName = fullNameError;
    if (emailError) newErrors.email = emailError;
    if (phoneNumberError) newErrors.phoneNumber = phoneNumberError;
    if (tcmcNumberError) newErrors.tcmcNumber = tcmcNumberError; // ← NEW
    if (passwordError) newErrors.password = passwordError;
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await signUp(
        formData.email.trim().toLowerCase(),
        formData.password,
        formData.fullName.trim(),
        formData.phoneNumber.trim(),
        formData.tcmcNumber.trim() // ← NEW: Pass TCMC number
      );

      if (result.success) {
        router.replace("/(auth)/verify-email");
      } else {
        Alert.alert("Sign Up Failed", result.message);
      }
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Phone number formatting function
  const formatPhoneNumber = (text) => {
    if (!text.startsWith("+91")) {
      text = "+91 " + text.replace(/^\+?91\s?/, "");
    }
    const cleaned = text.replace(/^\+91\s?/, "").replace(/\D/g, "");
    if (cleaned.length <= 5) {
      return `+91 ${cleaned}`;
    } else {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;
    }
  };

  // ← NEW: TCMC number formatting function
  const formatTcmcNumber = (text) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, "");
    // Return the cleaned number, limited to 6 digits max (120000)
    return cleaned.slice(0, 6);
  };

  const validateField = (field, value, passwordForConfirm = null) => {
    switch (field) {
      case "fullName":
        if (!value.trim()) {
          return "Full name is required";
        } else if (value.trim().length < 2) {
          return "Full name must be at least 2 characters";
        }
        return null;

      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          return "Email is required";
        } else if (!emailRegex.test(value.trim())) {
          return "Please enter a valid email address";
        }
        return null;

      case "phoneNumber":
        const cleanedPhone = value.replace(/^\+91\s?/, "").replace(/\D/g, "");

        if (!value.trim() || value.trim() === "+91") {
          return "Phone number is required";
        } else if (cleanedPhone.length < 10) {
          return "Please enter a valid 10-digit phone number";
        } else if (cleanedPhone.length > 10) {
          return "Phone number should be 10 digits";
        } else if (!cleanedPhone.match(/^[6-9]\d{9}$/)) {
          return "Please enter a valid Indian mobile number";
        }
        return null;

      // ← NEW: TCMC number validation
      case "tcmcNumber":
        const cleanedTcmc = value.replace(/\D/g, "");

        if (!value.trim()) {
          return "TCMC registration number is required";
        } else if (cleanedTcmc.length === 0) {
          return "TCMC number must contain only numbers";
        } else if (parseInt(cleanedTcmc) > 120000) {
          return "TCMC number cannot exceed 120000";
        } else if (parseInt(cleanedTcmc) < 1) {
          return "Please enter a valid TCMC number";
        }
        return null;

      case "password":
        if (!value) {
          return "Password is required";
        } else if (value.length < 6) {
          return "Password must be at least 6 characters";
        } else if (!/(?=.*[a-z])/.test(value)) {
          return "Password must contain at least one lowercase letter";
        } else if (!/(?=.*\d)/.test(value)) {
          return "Password must contain at least one number";
        }
        return null;

      case "confirmPassword":
        const passwordToCompare = passwordForConfirm || formData.password;
        if (!value) {
          return "Please confirm your password";
        } else if (value !== passwordToCompare) {
          return "Passwords do not match";
        }
        return null;

      default:
        return null;
    }
  };

  const handleFieldBlur = (field) => {
    const fieldValue = formData[field];
    const error = validateField(field, fieldValue);

    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const updateFormData = (field, value) => {
    // Special handling for phone number formatting
    if (field === "phoneNumber") {
      // Prevent deletion of +91
      if (value.length < 4) {
        value = "+91 ";
      }
      const formattedValue = formatPhoneNumber(value);
      setFormData((prev) => ({ ...prev, [field]: formattedValue }));
    }
    // ← NEW: Special handling for TCMC number formatting
    else if (field === "tcmcNumber") {
      const formattedValue = formatTcmcNumber(value);
      setFormData((prev) => ({ ...prev, [field]: formattedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    // Real-time validation - clear error when field becomes valid
    if (errors[field]) {
      let valueToValidate = value;
      if (field === "phoneNumber") {
        valueToValidate = formatPhoneNumber(value);
      } else if (field === "tcmcNumber") {
        valueToValidate = formatTcmcNumber(value);
      }

      const error = validateField(
        field,
        valueToValidate,
        field === "confirmPassword" ? formData.password : null
      );

      if (!error) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }

    if (
      field === "password" &&
      errors.confirmPassword &&
      formData.confirmPassword
    ) {
      const confirmError = validateField(
        "confirmPassword",
        formData.confirmPassword,
        value
      );
      if (!confirmError) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        });
      }
    }
  };

  const isFormValid = () => {
    // ← UPDATED: Added tcmcNumber to required fields check
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.phoneNumber.trim() ||
      formData.phoneNumber.trim() === "+91" ||
      !formData.tcmcNumber.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      return false;
    }

    if (formData.fullName.trim().length < 2) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return false;

    // Phone number validation
    const cleanedPhone = formData.phoneNumber
      .replace(/^\+91\s?/, "")
      .replace(/\D/g, "");
    if (cleanedPhone.length !== 10 || !cleanedPhone.match(/^[6-9]\d{9}$/))
      return false;

    // ← NEW: TCMC number validation
    const cleanedTcmc = formData.tcmcNumber.replace(/\D/g, "");
    if (
      !cleanedTcmc ||
      parseInt(cleanedTcmc) > 120000 ||
      parseInt(cleanedTcmc) < 1
    )
      return false;

    if (formData.password.length < 6) return false;
    if (!/(?=.*[a-z])/.test(formData.password)) return false;
    if (!/(?=.*\d)/.test(formData.password)) return false;

    if (formData.password !== formData.confirmPassword) return false;

    return true;
  };

  return (
    <SafeAreaView style={globalStyles.safeAreaContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={globalStyles.keyboardAvoidingContainer}
      >
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={globalStyles.content}>
            <View className="flex-col w-ful gap-1 mb-6">
              <Text className="text-2xl font-bold ">Create Account</Text>
              <Text className="text-base font-medium">Join OneXtID today</Text>
            </View>
            <View className="w-full gap-4">
              <View>
                <Text className="text-sm font-medium">
                  Full Name<Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.fullName && styles.inputError]}
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChangeText={(value) => updateFormData("fullName", value)}
                  onBlur={() => handleFieldBlur("fullName")}
                  autoCapitalize="words"
                  autoCorrect={false}
                  textContentType="name"
                  returnKeyType="next"
                />
                {errors.fullName && (
                  <Text className="text-sm mt-1 mb-1 text-red-500">
                    {errors.fullName}
                  </Text>
                )}
              </View>
              {/* Email Input */}
              <View>
                <Text className="text-sm font-medium">
                  Email Address<Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChangeText={(value) =>
                    updateFormData("email", value.toLowerCase())
                  }
                  onBlur={() => handleFieldBlur("email")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  returnKeyType="next"
                />
                {errors.email && (
                  <Text className="text-sm mt-1 mb-1 text-red-500">
                    {errors.email}
                  </Text>
                )}
              </View>

              {/* Phone Number Input */}
              <View>
                <Text className="text-sm font-medium">
                  Phone Number<Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.phoneNumber && styles.inputError,
                  ]}
                  placeholder="+91 98765 43210"
                  value={formData.phoneNumber}
                  onChangeText={(value) => updateFormData("phoneNumber", value)}
                  onBlur={() => handleFieldBlur("phoneNumber")}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  textContentType="telephoneNumber"
                  returnKeyType="next"
                  maxLength={17} // +91 XXXXX XXXXX = 17 characters
                />
                {errors.phoneNumber && (
                  <Text className="text-sm mt-1 mb-1 text-red-500">
                    {errors.phoneNumber}
                  </Text>
                )}
                {!errors.phoneNumber &&
                  formData.phoneNumber &&
                  formData.phoneNumber !== "+91 " && (
                    <Text style={styles.helpText}>
                      10-digit Indian mobile number
                    </Text>
                  )}
              </View>

              {/* ← NEW: TCMC Number Input */}
              <View>
                <Text className="text-sm font-medium">
                  TCMC Registration Number
                  <Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.tcmcNumber && styles.inputError]}
                  placeholder="Enter your TCMC number"
                  value={formData.tcmcNumber}
                  onChangeText={(value) => updateFormData("tcmcNumber", value)}
                  onBlur={() => handleFieldBlur("tcmcNumber")}
                  keyboardType="numeric"
                  autoCorrect={false}
                  returnKeyType="next"
                  maxLength={6} // Maximum 6 digits for 120000
                />
                {errors.tcmcNumber && (
                  <Text className="text-sm mt-1 mb-1 text-red-500">
                    {errors.tcmcNumber}
                  </Text>
                )}
                {!errors.tcmcNumber && formData.tcmcNumber && (
                  <Text style={styles.helpText}>Must not exceed 120000</Text>
                )}
              </View>

              {/* Password Input */}
              <View>
                <Text className="text-sm font-medium">
                  Password<Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChangeText={(value) => updateFormData("password", value)}
                  onBlur={() => handleFieldBlur("password")}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  returnKeyType="next"
                />
                {errors.password && (
                  <Text className="text-sm mt-1 mb-1 text-red-500">
                    {errors.password}
                  </Text>
                )}
                {!errors.password && formData.password && (
                  <Text style={styles.helpText}>
                    Password must be at least 6 characters with a number and
                    lowercase letter
                  </Text>
                )}
              </View>

              {/* Confirm Password Input */}
              <View>
                <Text className="text-sm font-medium">
                  Confirm Password<Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.confirmPassword && styles.inputError,
                  ]}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChangeText={(value) =>
                    updateFormData("confirmPassword", value)
                  }
                  onBlur={() => handleFieldBlur("confirmPassword")}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  returnKeyType="done"
                  onSubmitEditing={handleSignUp}
                />
                {errors.confirmPassword && (
                  <Text className="text-sm mt-1 mb-1 text-red-500">
                    {errors.confirmPassword}
                  </Text>
                )}
              </View>

              {/* Sign Up Button */}
              <Pressable
                style={[
                  globalStyles.button,

                  (!isFormValid() || isLoading) && styles.buttonDisabled,
                ]}
                onPress={handleSignUp}
                disabled={!isFormValid() || isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text className="text-base font-bold">
                      Creating Account...
                    </Text>
                  </View>
                ) : (
                  <Text className="text-lg font-bold text-white">
                    Create Account
                  </Text>
                )}
              </Pressable>

              <Text className="text-xs text-center">
                By creating an account, you agree to our{" "}
                <Text className="text-blue-700 underline">
                  Terms of Service
                </Text>{" "}
                and{" "}
                <Text className="text-blue-700 underline">Privacy Policy</Text>
              </Text>

              <View className="flex-row justify-center gap-1 items-center">
                <Text className="text-sm">Already have an account? </Text>
                <Link href="/(auth)/sign-in" asChild>
                  <Pressable>
                    <Text className="text-sm text-blue-700 font-bold underline">
                      Sign In
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  input: {
    borderBottomWidth: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: "#ff3b30",
  },
  errorText: {
    color: "#ff3b30",
    fontSize: 14,
    marginTop: 4,
  },
  helpText: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  signUpButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  signUpButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  termsText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 16,
  },
  linkText: {
    color: "#007AFF",
    fontWeight: "500",
  },
  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: 16,
    color: "#666",
  },
  loginLinkText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
});
