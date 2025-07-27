import { Text, View } from "react-native";
import { useJobs } from "../../hooks/useJobs";

export default function AccountScreen() {
  const { clearCache } = useJobs();

  const handleLogout = () => {
    clearCache();
  };

  return (
    <View>
      <Text>Hello</Text>
    </View>
  );
}
