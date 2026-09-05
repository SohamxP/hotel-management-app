import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import {
  ActivityIndicator,
  View,
} from "react-native";

import { COLORS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

export default function TabsLayout() {
  const {
    user,
    loading,
    isAuthenticated,
  } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.bg,
        }}
      >
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const isManager =
    user?.role === "Manager";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
        },
        tabBarActiveTintColor:
          COLORS.primary,
        tabBarInactiveTintColor:
          COLORS.muted,
      }}
    >
      <Tabs.Screen
        name="rooms"
        options={{
          title: "Rooms",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="bed-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="reservations"
        options={{
          title: "Reservations",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="calendar-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="guests"
        options={{
          title: "Guests",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="people-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="services"
        options={{
          title: "Services",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="construct-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="billing"
        options={{
          title: "Billing",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="card-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          href: isManager
            ? undefined
            : null,
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="bar-chart-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="ai"
        options={{
          title: "AI",
          href: isManager
            ? undefined
            : null,
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="sparkles-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="quality"
        options={{
          title: "Quality",
          href: isManager
            ? undefined
            : null,
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="heart-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="status"
        options={{
          title: "Status",
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="pulse-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}