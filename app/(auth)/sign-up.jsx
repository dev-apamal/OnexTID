import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

export default function SignUpScreen() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
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
    const passwordError = validateField("password", formData.password);
    const confirmPasswordError = validateField(
      "confirmPassword",
      formData.confirmPassword
    );

    if (fullNameError) newErrors.fullName = fullNameError;
    if (emailError) newErrors.email = emailError;
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
        formData.fullName.trim()
      );

      if (result.success) {
        // Don't show alert here, just navigate directly
        // The auth state will handle the redirect to verify-email
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
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Real-time validation - clear error when field becomes valid
    if (errors[field]) {
      const error = validateField(
        field,
        value,
        field === "confirmPassword" ? formData.password : null
      );

      if (!error) {
        // Field is now valid, clear the error
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }

    // Special case: if user is typing password and confirmPassword has an error,
    // revalidate confirmPassword
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
    // Basic field presence check
    if (
      !formData.fullName.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      return false;
    }

    // Quick validation without setting errors state
    // Full name check
    if (formData.fullName.trim().length < 2) return false;

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return false;

    // Password checks
    if (formData.password.length < 6) return false;
    if (!/(?=.*[a-z])/.test(formData.password)) return false;
    if (!/(?=.*\d)/.test(formData.password)) return false;

    // Password match check
    if (formData.password !== formData.confirmPassword) return false;

    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join OneXtID today</Text>
          </View>

          <View style={styles.form}>
            {/* Full Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
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
                <Text style={styles.errorText}>{errors.fullName}</Text>
              )}
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
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
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
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
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
              {!errors.password && formData.password && (
                <Text style={styles.helpText}>
                  Password must be at least 6 characters with a number and
                  lowercase letter
                </Text>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
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
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[
                styles.signUpButton,
                (!isFormValid() || isLoading) && styles.buttonDisabled,
              ]}
              onPress={handleSignUp}
              disabled={!isFormValid() || isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.signUpButtonText}>
                    Creating Account...
                  </Text>
                </View>
              ) : (
                <Text style={styles.signUpButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Terms and Privacy */}
            <Text style={styles.termsText}>
              By creating an account, you agree to our{" "}
              <Text style={styles.linkText}>Terms of Service</Text> and{" "}
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>

            {/* Login Link */}
            <View style={styles.loginLink}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <Link href="/(auth)/sign-in" asChild>
                <TouchableOpacity>
                  <Text style={styles.loginLinkText}>Sign In</Text>
                </TouchableOpacity>
              </Link>
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
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
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
