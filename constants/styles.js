import { StyleSheet } from "react-native";

export const globalStyles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#1447e6",
  },
});
