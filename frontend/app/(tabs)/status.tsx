import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { API, API_BASE_URL, getApiErrorMessage } from "../../api/api";
import { COLORS } from "../../constants/theme";

type CheckStatus = "ok" | "configured" | "missing_key" | "simulation_or_missing_key" | "error";

type HealthResponse = {
  success: boolean;
  status: string;
  message: string;
  checkedAt: string;
  responseTimeMs: number;
  uptimeSeconds: number;
  environment: string;
  port: number;
  checks: {
    api: {
      status: CheckStatus;
    };
    database: {
      status: CheckStatus;
      engine: string;
    };
    openai: {
      status: CheckStatus;
      configured: boolean;
      model: string;
    };
    stripe: {
      status: CheckStatus;
      configured: boolean;
      currency: string;
      successUrlConfigured: boolean;
      cancelUrlConfigured: boolean;
    };
  };
  features: string[];
};

type ServiceCheck = {
  label: string;
  status: "ok" | "warning" | "error";
  detail: string;
};

function statusColor(status: "ok" | "warning" | "error") {
  if (status === "ok") return COLORS.success;
  if (status === "warning") return COLORS.warning;
  return COLORS.danger;
}

function formatUptime(seconds: number) {
  if (!seconds) return "0s";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
  return `${remainingSeconds}s`;
}

function StatusPill({ status }: { status: "ok" | "warning" | "error" }) {
  return (
    <View style={[styles.statusPill, { borderColor: statusColor(status) }]}>
      <Text style={[styles.statusPillText, { color: statusColor(status) }]}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
}

function ServiceCard({ check }: { check: ServiceCheck }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{check.label}</Text>
        <StatusPill status={check.status} />
      </View>
      <Text style={styles.cardText}>{check.detail}</Text>
    </View>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

export default function StatusScreen() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState("");

  const loadHealth = async () => {
    try {
      setLoading(true);
      setLastError("");

      const res = await API.get("/api/health");
      setHealth(res.data);
    } catch (error: any) {
      const message = getApiErrorMessage(error);
      setLastError(message);
      setHealth(null);
      console.log("Health check error:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHealth();
    }, [])
  );

  const serviceChecks = useMemo<ServiceCheck[]>(() => {
    if (!health) {
      return [
        {
          label: "Backend API",
          status: "error",
          detail: lastError || "Could not reach backend health route.",
        },
      ];
    }

    return [
      {
        label: "Backend API",
        status: health.checks.api.status === "ok" ? "ok" : "error",
        detail: `${health.message} • ${health.responseTimeMs}ms response`,
      },
      {
        label: "SQLite Database",
        status: health.checks.database.status === "ok" ? "ok" : "error",
        detail: `${health.checks.database.engine} connection is working.`,
      },
      {
        label: "OpenAI",
        status: health.checks.openai.configured ? "ok" : "warning",
        detail: health.checks.openai.configured
          ? `Configured with model: ${health.checks.openai.model}`
          : "OPENAI_API_KEY is missing in backend/.env.",
      },
      {
        label: "Stripe",
        status: health.checks.stripe.configured ? "ok" : "warning",
        detail: health.checks.stripe.configured
          ? `Configured in ${health.checks.stripe.currency.toUpperCase()} with redirect URLs ${
              health.checks.stripe.successUrlConfigured &&
              health.checks.stripe.cancelUrlConfigured
                ? "set"
                : "partially missing"
            }.`
          : "Stripe is missing or running in simulation mode.",
      },
    ];
  }, [health, lastError]);

  const openApiInBrowser = async () => {
    try {
      await Linking.openURL(API_BASE_URL);
    } catch {
      Alert.alert("Could not open API URL", API_BASE_URL);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Status",
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.text,
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.screenTitle}>System Status</Text>
          <Text style={styles.screenSubtitle}>
            Use this before demos to confirm your phone, frontend, backend,
            database, OpenAI, and Stripe configuration are connected.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroLabel}>API Base URL</Text>
              <Text style={styles.apiUrl}>{API_BASE_URL}</Text>
            </View>

            <Pressable style={styles.refreshButton} onPress={loadHealth}>
              {loading ? (
                <ActivityIndicator color="#00111A" />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={16} color="#00111A" />
                  <Text style={styles.refreshButtonText}>Refresh</Text>
                </>
              )}
            </Pressable>
          </View>

          <Pressable style={styles.secondaryButton} onPress={openApiInBrowser}>
            <Ionicons name="open-outline" size={18} color={COLORS.text} />
            <Text style={styles.secondaryButtonText}>Open API in Browser</Text>
          </Pressable>

          {lastError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{lastError}</Text>
              <Text style={styles.errorHint}>
                If this works on Mac but not phone, your EXPO_PUBLIC_API_URL
                probably needs your Mac Wi-Fi IP.
              </Text>
            </View>
          ) : null}
        </View>

        {health ? (
          <View style={styles.metricGrid}>
            <MetricCard
              label="Backend"
              value={health.status.toUpperCase()}
              detail={health.environment}
            />

            <MetricCard
              label="Response"
              value={`${health.responseTimeMs}ms`}
              detail="Health endpoint latency"
            />

            <MetricCard
              label="Uptime"
              value={formatUptime(health.uptimeSeconds)}
              detail="Current backend process"
            />

            <MetricCard
              label="Port"
              value={String(health.port)}
              detail="Backend server port"
            />
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Connection Checks</Text>

        {serviceChecks.map((check) => (
          <ServiceCard key={check.label} check={check} />
        ))}

        {health?.features?.length ? (
          <>
            <Text style={styles.sectionTitle}>Enabled Features</Text>

            <View style={styles.featureGrid}>
              {health.features.map((feature) => (
                <View key={feature} style={styles.featureChip}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={16}
                    color={COLORS.success}
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Local phone testing rule</Text>
          <Text style={styles.noteText}>
            Your phone cannot use localhost for the backend. Keep your Mac IP in
            frontend/.env.local as EXPO_PUBLIC_API_URL, and do not commit that
            local file.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 18,
  },
  screenTitle: {
    color: COLORS.text,
    fontSize: 30,
    fontWeight: "900",
  },
  screenSubtitle: {
    color: COLORS.muted,
    marginTop: 6,
    lineHeight: 20,
  },
  heroCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  heroLabel: {
    color: COLORS.muted,
    fontWeight: "800",
    marginBottom: 8,
  },
  apiUrl: {
    color: COLORS.primary,
    fontWeight: "900",
    lineHeight: 20,
  },
  refreshButton: {
    minWidth: 92,
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  refreshButtonText: {
    color: "#00111A",
    fontSize: 12,
    fontWeight: "900",
  },
  secondaryButton: {
    backgroundColor: COLORS.card2,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontWeight: "900",
  },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: COLORS.danger,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  errorText: {
    color: COLORS.danger,
    fontWeight: "900",
  },
  errorHint: {
    color: COLORS.muted,
    marginTop: 6,
    lineHeight: 18,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    width: "47%",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  metricValue: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 8,
  },
  metricDetail: {
    color: COLORS.muted,
    marginTop: 6,
    lineHeight: 18,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 8,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },
  cardText: {
    color: COLORS.muted,
    lineHeight: 20,
  },
  statusPill: {
    backgroundColor: COLORS.card2,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "900",
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  featureChip: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  featureText: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 12,
  },
  noteCard: {
    backgroundColor: COLORS.card2,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginTop: 4,
  },
  noteTitle: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 17,
  },
  noteText: {
    color: COLORS.text,
    marginTop: 8,
    lineHeight: 20,
  },
});