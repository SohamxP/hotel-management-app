import {
  ActivityIndicator,
  View,
} from "react-native";

import { Redirect } from "expo-router";

import { useAuth } from "../context/AuthContext";
import { COLORS } from "../constants/theme";

export default function StartScreen() {
  const {
    loading,
    isAuthenticated,
  } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent:
            "center",
          alignItems: "center",
          backgroundColor:
            COLORS.bg,
        }}
      >
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      </View>
    );
  }

  if (isAuthenticated) {
    return (
      <Redirect
        href={"/rooms" as any}
      />
    );
  }

  return (
    <Redirect
      href={"/login" as any}
    />
  );
}