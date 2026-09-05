import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { API } from "../api/api";
import { COLORS } from "../constants/theme";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const {login, isAuthenticated, loading: authLoading} = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (
      !authLoading &&
      isAuthenticated
    ) {
      router.replace(
        "/rooms" as any
      );
    }
  }, [
    authLoading,
    isAuthenticated,
  ]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await API.post("/api/auth/login", {
        username,
        password,
      });

      await login(
      res.data.token,
      res.data.user
    );
      router.replace("/rooms" as any);
    } catch (err: any) {
      console.log(err);

      setError(
        err?.response?.data?.error ||
          "Invalid username or password"
      );
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.bg,
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Text style={{ color: COLORS.text, fontSize: 34, fontWeight: "900" }}>
        Hotel Login
      </Text>

      <Text style={{ color: COLORS.muted, marginTop: 8, marginBottom: 24 }}>
        Sign in to manage rooms and reports
      </Text>

      <TextInput
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
        placeholderTextColor={COLORS.muted}
        autoCapitalize="none"
        style={{
          backgroundColor: COLORS.card,
          color: COLORS.text,
          padding: 16,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: COLORS.border,
          marginBottom: 12,
        }}
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        placeholderTextColor={COLORS.muted}
        secureTextEntry
        style={{
          backgroundColor: COLORS.card,
          color: COLORS.text,
          padding: 16,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: COLORS.border,
          marginBottom: 12,
        }}
      />

      {error ? (
        <Text style={{ color: COLORS.danger, marginBottom: 12 }}>{error}</Text>
      ) : null}

      <Pressable
        onPress={handleLogin}
        disabled={loading}
        style={{
          backgroundColor: COLORS.primary,
          padding: 16,
          borderRadius: 16,
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#00111A" />
        ) : (
          <Text
            style={{
              color: "#00111A",
              textAlign: "center",
              fontWeight: "900",
              fontSize: 16,
            }}
          >
            Login
          </Text>
        )}
      </Pressable>

      <Text style={{ color: COLORS.muted, marginTop: 18 }}>
        Demo login: admin / admin123
      </Text>
    </View>
  );
}