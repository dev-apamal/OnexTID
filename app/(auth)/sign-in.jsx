import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";
import { globalStyles } from "../../constants/styles";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignInScreen() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login, forgotPassword } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    // Validate each field using the same logic
    const emailError = validateField("email", formData.email);
    const passwordError = validateField("password", formData.password);

    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await login(
        formData.email.trim().toLowerCase(),
        formData.password
      );

      if (result.success) {
        if (result.isVerified) {
          // User is verified, redirect to main app
          router.replace("(app)");
        } else {
          // User needs to verify email
          Alert.alert(
            "Email Verification Required",
            "Please verify your email address to continue. We've sent a verification link to your email.",
            [
              {
                text: "OK",
                onPress: () => router.replace("/(auth)/verify-email"),
              },
            ]
          );
        }
      } else {
        Alert.alert("Sign In Failed", result.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!formData.email.trim()) {
      Alert.alert(
        "Email Required",
        'Please enter your email address first, then tap "Forgot Password?" again.',
        [{ text: "OK" }]
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address first.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Reset Password",
      `Send password reset instructions to ${formData.email}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: async () => {
            try {
              const result = await forgotPassword(
                formData.email.trim().toLowerCase()
              );
              if (result.success) {
                Alert.alert(
                  "Email Sent! 📧",
                  "Password reset instructions have been sent to your email. Please check your inbox and spam folder.",
                  [{ text: "OK" }]
                );
              } else {
                Alert.alert("Error", result.message);
              }
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to send reset email. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const validateField = (field, value) => {
    switch (field) {
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          return "Email is required";
        } else if (!emailRegex.test(value.trim())) {
          return "Please enter a valid email address";
        }
        return null;

      case "password":
        if (!value) {
          return "Password is required";
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
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Real-time validation - clear error when field becomes valid
    if (errors[field]) {
      const error = validateField(field, value);

      if (!error) {
        // Field is now valid, clear the error
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  };

  const isFormValid = () => {
    // Basic field presence check
    if (!formData.email.trim() || !formData.password) {
      return false;
    }

    // Quick email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return false;
    }

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
              <Text className="text-2xl font-bold ">Welcome Back</Text>
              <Text className="text-base font-medium">
                Sign in to your OneXtID account
              </Text>
            </View>

            <View className="w-full gap-4">
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

              {/* Password Input */}
              <View>
                <Text className="text-sm font-medium">
                  Password<Text className="text-red-500">*</Text>
                </Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChangeText={(value) => updateFormData("password", value)}
                  onBlur={() => handleFieldBlur("password")}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                {errors.password && (
                  <Text className="text-sm mt-1 mb-1 text-red-500">
                    {errors.password}
                  </Text>
                )}
              </View>

              {/* Forgot Password Link */}
              <Pressable
                className="self-end mb-4"
                onPress={handleForgotPassword}
              >
                <Text className="text-sm font-bold text-blue-700 underline">
                  Forgot Password?
                </Text>
              </Pressable>

              {/* Login Button */}
              <Pressable
                style={[
                  globalStyles.button,
                  (!isFormValid() || isLoading) && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={!isFormValid() || isLoading}
              >
                {isLoading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#fff" />
                    <Text className="text-base font-bold">Signing In...</Text>
                  </View>
                ) : (
                  <Text className="text-lg font-bold text-white">Sign In</Text>
                )}
              </Pressable>
              {/* Sign Up Link */}

              <View className="flex-row justify-center gap-1 items-center">
                <Text className="text-sm">Don't have an account?</Text>
                <Link href="/(auth)/sign-up" asChild>
                  <Pressable>
                    <Text className="text-sm text-blue-700 font-bold underline">
                      Create Account
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
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
    textAlign: "center",
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
    marginBottom: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 30,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: "#666",
  },
  signUpLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signUpText: {
    fontSize: 16,
    color: "#666",
  },
  signUpLinkText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
});
