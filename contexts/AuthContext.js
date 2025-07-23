import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth, firestore } from "../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // Monitor authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log(
        "Auth state changed:",
        firebaseUser?.email,
        "Verified:",
        firebaseUser?.emailVerified
      );
      setUser(firebaseUser);

      if (initializing) {
        setInitializing(false);
      }
      setIsLoading(false);
    });

    return unsubscribe; // unsubscribe on unmount
  }, [initializing]);

  // Create user account and send verification email
  const signUp = async (email, password, fullName, phoneNumber, tcmcNumber) => {
    try {
      setIsLoading(true);

      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Update user profile with display name
      if (fullName) {
        await updateProfile(user, {
          displayName: fullName,
        });
      }

      await setDoc(doc(firestore, "users", user.uid), {
        fullName,
        email,
        phoneNumber,
        tcmcNumber,
        createdAt: new Date().toISOString(),
      });
      // Send email verification immediately after account creation
      await sendEmailVerification(user);

      return {
        success: true,
        message:
          "Account created successfully! Please check your email to verify your account.",
        user: user,
      };
    } catch (error) {
      console.error("Sign up error:", error);

      let errorMessage = "An error occurred during sign up";
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "An account with this email already exists";
          break;
        case "auth/weak-password":
          errorMessage = "Password should be at least 6 characters";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "Email/password sign-up is not enabled";
          break;
        default:
          errorMessage = error.message;
      }

      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in existing user
  const login = async (email, password) => {
    try {
      setIsLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      return {
        success: true,
        user: user,
        isVerified: user.emailVerified,
      };
    } catch (error) {
      console.error("Login error:", error);

      let errorMessage = "Invalid email or password";
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email";
          break;
        case "auth/wrong-password":
        case "auth/invalid-credential":
          errorMessage = "Incorrect email or password";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later";
          break;
        default:
          errorMessage = error.message;
      }

      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification email
  const resendVerificationEmail = async () => {
    try {
      if (!user) {
        return { success: false, message: "No user found" };
      }

      await sendEmailVerification(user);

      return { success: true, message: "Verification email sent successfully" };
    } catch (error) {
      console.error("Resend verification error:", error);

      let errorMessage = "Failed to send verification email";
      switch (error.code) {
        case "auth/too-many-requests":
          errorMessage =
            "Too many requests. Please wait before requesting again";
          break;
        case "auth/user-token-expired":
          errorMessage = "Session expired. Please log in again";
          break;
        default:
          errorMessage = error.message;
      }

      return { success: false, message: errorMessage };
    }
  };

  // Send password reset email
  const forgotPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: "Password reset email sent successfully",
      };
    } catch (error) {
      console.error("Forgot password error:", error);

      let errorMessage = "Failed to send password reset email";
      switch (error.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many requests. Please try again later";
          break;
        default:
          errorMessage = error.message;
      }

      return { success: false, message: errorMessage };
    }
  };

  // Reload user to check verification status
  const reloadUser = async () => {
    try {
      if (user) {
        await user.reload();
        // Force a state update by getting the fresh user from auth
        const refreshedUser = auth.currentUser;
        setUser(refreshedUser);
        return {
          success: true,
          isVerified: refreshedUser?.emailVerified || false,
        };
      }
      return { success: false, message: "No user found" };
    } catch (error) {
      console.error("Reload user error:", error);
      return { success: false, message: error.message };
    }
  };

  // Sign out user
  const logout = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, message: error.message };
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isVerified: user?.emailVerified || false,
    signUp,
    login,
    logout,
    resendVerificationEmail,
    forgotPassword,
    reloadUser,
  };

  // Don't render anything while initializing
  if (initializing) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
