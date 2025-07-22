import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

export default function VerifyEmailScreen() {
  const { user, reloadUser, resendVerificationEmail, logout } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const result = await resendVerificationEmail();
      if (result.success) {
        Alert.alert(
          "Email Sent! 📧",
          "We've sent a new verification email to your inbox. Please check your email and spam folder."
        );
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to send verification email. Please try again."
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    try {
      const result = await reloadUser();
      if (result.success && result.isVerified) {
        Alert.alert(
          "Email Verified! ✅",
          "Your email has been verified successfully. Welcome to OneXtID!",
          [
            {
              text: "Continue",
              onPress: () => router.replace("/(app)"),
            },
          ]
        );
      } else {
        Alert.alert(
          "Not Verified Yet",
          "Your email hasn't been verified yet. Please check your email and click the verification link."
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to check verification status.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/(auth)/sign-in");
    } catch (error) {
      Alert.alert("Error", "Failed to logout.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>📧</Text>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification link to{"\n"}
            <Text style={styles.email}>{user?.email}</Text>
          </Text>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            1. Check your email inbox (and spam folder)
          </Text>
          <Text style={styles.instructionText}>
            2. Click the verification link in the email
          </Text>
          <Text style={styles.instructionText}>
            3. Come back and tap "I've Verified My Email"
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, isChecking && styles.buttonDisabled]}
            onPress={handleCheckVerification}
            disabled={isChecking}
          >
            {isChecking ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.primaryButtonText}>Checking...</Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>
                I've Verified My Email
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              isResending && styles.buttonDisabled,
            ]}
            onPress={handleResendEmail}
            disabled={isResending}
          >
            {isResending ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.secondaryButtonText}>Sending...</Text>
              </View>
            ) : (
              <Text style={styles.secondaryButtonText}>Resend Email</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 50,
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  email: {
    fontWeight: "500",
    color: "#007AFF",
  },
  instructions: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
  },
  instructionText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
    lineHeight: 22,
  },
  actions: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#666",
    fontSize: 16,
  },
});
