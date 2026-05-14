import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { API } from "../../api/api";
import { COLORS } from "../../constants/theme";

type AIStatus = {
  success?: boolean;
  configured: boolean;
  model: string;
  message: string;
};

type InsightSeverity = "critical" | "warning" | "info" | "success";

type LocalInsight = {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  metricLabel: string;
  metricValue: string;
  recommendation: string;
};

type ActionPriority = "High" | "Medium" | "Low";
type RevenueImpact = "High" | "Medium" | "Low";

type ActionItem = {
  id: string;
  priority: ActionPriority;
  title: string;
  description: string;
  owner: string;
  due: string;
  impact: string;
  source: string;
};

type RevenueOpportunity = {
  id: string;
  impact: RevenueImpact;
  title: string;
  description: string;
  estimatedValue: string;
  target: string;
  recommendation: string;
  source: string;
};

type ActionCenterResponse = {
  success: boolean;
  generatedAt: string;
  summary: {
    totalRooms: number;
    availableRooms: number;
    reservedRooms: number;
    occupiedRooms: number;
    blockedRoomCount: number;
    availabilityRate: number;
    pendingReservations: number;
    confirmedReservations: number;
    openServiceCount: number;
    pendingServices: number;
    inProgressServices: number;
    lowFeedbackCount: number;
    reservationRevenue: number;
    completedServiceRevenue: number;
  };
  insights: LocalInsight[];
  actionItems: ActionItem[];
};

type RevenueResponse = {
  success: boolean;
  generatedAt: string;
  opportunities: RevenueOpportunity[];
};

const DEFAULT_QUESTION =
  "What should the hotel manager focus on today based on the current data?";

function getSeverityColor(severity: InsightSeverity) {
  if (severity === "critical") return COLORS.danger;
  if (severity === "warning") return COLORS.warning;
  if (severity === "success") return COLORS.success;
  return COLORS.primary;
}

function getPriorityColor(priority: ActionPriority | RevenueImpact) {
  if (priority === "High") return COLORS.danger;
  if (priority === "Medium") return COLORS.warning;
  return COLORS.primary;
}

function formatMoney(value: number) {
  const safeValue = Number(value || 0);
  return `$${safeValue.toFixed(2)}`;
}

export default function AIScreen() {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [actionCenter, setActionCenter] = useState<ActionCenterResponse | null>(
    null
  );
  const [revenue, setRevenue] = useState<RevenueResponse | null>(null);

  const [briefing, setBriefing] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [recoveryDrafts, setRecoveryDrafts] = useState("");
  const [revenuePlan, setRevenuePlan] = useState("");
  const [question, setQuestion] = useState(DEFAULT_QUESTION);
  const [answer, setAnswer] = useState("");

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loadingActions, setLoadingActions] = useState(true);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [loadingActionPlan, setLoadingActionPlan] = useState(false);
  const [loadingRecoveryDrafts, setLoadingRecoveryDrafts] = useState(false);
  const [loadingRevenuePlan, setLoadingRevenuePlan] = useState(false);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [testingOpenAI, setTestingOpenAI] = useState(false);

  const riskCount = useMemo(() => {
    return (actionCenter?.insights || []).filter(
      (item) => item.severity === "critical" || item.severity === "warning"
    ).length;
  }, [actionCenter]);

  const highPriorityCount = useMemo(() => {
    return (actionCenter?.actionItems || []).filter(
      (item) => item.priority === "High"
    ).length;
  }, [actionCenter]);

  const highRevenueCount = useMemo(() => {
    return (revenue?.opportunities || []).filter(
      (item) => item.impact === "High"
    ).length;
  }, [revenue]);

  const loadStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await API.get("/api/ai/status");
      setStatus(res.data);
    } catch (error: any) {
      console.log("AI status error:", error.response?.data || error.message);
      setStatus({
        configured: false,
        model: "Unknown",
        message: "Could not load OpenAI status from backend.",
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  const loadActionCenter = async () => {
    try {
      setLoadingActions(true);
      const res = await API.get("/api/ai/actions");
      setActionCenter(res.data);
    } catch (error: any) {
      console.log("AI actions error:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to load AI action center");
    } finally {
      setLoadingActions(false);
    }
  };

  const loadRevenue = async () => {
    try {
      setLoadingRevenue(true);
      const res = await API.get("/api/ai/revenue");
      setRevenue(res.data);
    } catch (error: any) {
      console.log("AI revenue error:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to load revenue opportunities");
    } finally {
      setLoadingRevenue(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStatus();
      loadActionCenter();
      loadRevenue();
    }, [])
  );

  const testOpenAI = async () => {
    try {
      setTestingOpenAI(true);
      const res = await API.get("/api/ai/test");
      Alert.alert("OpenAI Test", res.data.message || "OpenAI is working.");
    } catch (error: any) {
      console.log("OpenAI test error:", error.response?.data || error.message);
      Alert.alert(
        "OpenAI Test Failed",
        error.response?.data?.error || "Could not test OpenAI."
      );
    } finally {
      setTestingOpenAI(false);
    }
  };

  const generateBriefing = async () => {
    try {
      setLoadingBriefing(true);
      setBriefing("");
      const res = await API.post("/api/ai/briefing");
      setBriefing(res.data.briefing || "No briefing returned.");
    } catch (error: any) {
      console.log("AI briefing error:", error.response?.data || error.message);
      Alert.alert(
        "Briefing failed",
        error.response?.data?.error || "Could not generate manager briefing."
      );
    } finally {
      setLoadingBriefing(false);
    }
  };

  const generateActionPlan = async () => {
    try {
      setLoadingActionPlan(true);
      setActionPlan("");
      const res = await API.post("/api/ai/action-plan");
      setActionPlan(res.data.actionPlan || "No action plan returned.");
    } catch (error: any) {
      console.log("AI action plan error:", error.response?.data || error.message);
      Alert.alert(
        "Action plan failed",
        error.response?.data?.error || "Could not generate OpenAI action plan."
      );
    } finally {
      setLoadingActionPlan(false);
    }
  };

  const generateRecoveryDrafts = async () => {
    try {
      setLoadingRecoveryDrafts(true);
      setRecoveryDrafts("");
      const res = await API.post("/api/ai/guest-recovery");
      setRecoveryDrafts(
        res.data.recoveryDrafts || "No guest recovery drafts returned."
      );
    } catch (error: any) {
      console.log(
        "Guest recovery error:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Guest recovery failed",
        error.response?.data?.error || "Could not generate recovery drafts."
      );
    } finally {
      setLoadingRecoveryDrafts(false);
    }
  };

  const generateRevenuePlan = async () => {
    try {
      setLoadingRevenuePlan(true);
      setRevenuePlan("");
      const res = await API.post("/api/ai/revenue-plan");
      setRevenuePlan(res.data.revenuePlan || "No revenue plan returned.");
    } catch (error: any) {
      console.log("Revenue plan error:", error.response?.data || error.message);
      Alert.alert(
        "Revenue plan failed",
        error.response?.data?.error || "Could not generate revenue plan."
      );
    } finally {
      setLoadingRevenuePlan(false);
    }
  };

  const askAI = async () => {
    const cleanQuestion = question.trim();

    if (!cleanQuestion) {
      Alert.alert("Missing question", "Type a question for OpenAI first.");
      return;
    }

    try {
      setLoadingAnswer(true);
      setAnswer("");
      const res = await API.post("/api/ai/ask", {
        question: cleanQuestion,
      });
      setAnswer(res.data.answer || "No answer returned.");
    } catch (error: any) {
      console.log("Ask AI error:", error.response?.data || error.message);
      Alert.alert(
        "Ask OpenAI failed",
        error.response?.data?.error || "Could not get an AI answer."
      );
    } finally {
      setLoadingAnswer(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "AI Assistant",
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.text,
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
      >
        <View style={{ marginBottom: 20 }}>
          <Text style={{ color: COLORS.text, fontSize: 30, fontWeight: "900" }}>
            AI Manager
          </Text>
          <Text style={{ color: COLORS.muted, marginTop: 6, lineHeight: 20 }}>
            Local hotel insights plus OpenAI-generated manager recommendations.
          </Text>
        </View>

        <StatusCard
          status={status}
          loading={loadingStatus}
          testing={testingOpenAI}
          onRefresh={loadStatus}
          onTest={testOpenAI}
        />

        {loadingActions ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={{ color: COLORS.muted, marginTop: 10 }}>
              Loading action center...
            </Text>
          </View>
        ) : actionCenter ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Action Center</Text>
                <Text style={styles.sectionSubtitle}>
                  Prioritized from live SQLite data
                </Text>
              </View>

              <Pressable style={styles.smallButton} onPress={loadActionCenter}>
                <Ionicons name="refresh-outline" size={16} color="#00111A" />
                <Text style={styles.smallButtonText}>Refresh</Text>
              </Pressable>
            </View>

            <View style={styles.grid}>
              <MetricCard
                label="Available"
                value={`${actionCenter.summary.availableRooms}/${actionCenter.summary.totalRooms}`}
              />
              <MetricCard
                label="Availability"
                value={`${actionCenter.summary.availabilityRate}%`}
              />
              <MetricCard
                label="Open Services"
                value={String(actionCenter.summary.openServiceCount)}
              />
              <MetricCard label="Risks" value={String(riskCount)} />
              <MetricCard
                label="High Priority"
                value={String(highPriorityCount)}
              />
              <MetricCard
                label="Service Revenue"
                value={formatMoney(actionCenter.summary.completedServiceRevenue)}
              />
            </View>

            <Text style={styles.sectionTitle}>Local AI Insights</Text>
            {actionCenter.insights.map((item) => (
              <InsightCard key={item.id} insight={item} />
            ))}

            <Text style={styles.sectionTitle}>Manager Action Items</Text>
            {actionCenter.actionItems.map((item) => (
              <ActionCard key={item.id} item={item} />
            ))}
          </>
        ) : null}

        {loadingRevenue ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={{ color: COLORS.muted, marginTop: 10 }}>
              Loading revenue opportunities...
            </Text>
          </View>
        ) : revenue ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Revenue Engine</Text>
                <Text style={styles.sectionSubtitle}>
                  Upsells and revenue opportunities
                </Text>
              </View>

              <Pressable style={styles.smallButton} onPress={loadRevenue}>
                <Ionicons name="refresh-outline" size={16} color="#00111A" />
                <Text style={styles.smallButtonText}>Refresh</Text>
              </Pressable>
            </View>

            <View style={styles.grid}>
              <MetricCard
                label="Opportunities"
                value={String(revenue.opportunities.length)}
              />
              <MetricCard label="High Impact" value={String(highRevenueCount)} />
            </View>

            {revenue.opportunities.map((item) => (
              <RevenueCard key={item.id} item={item} />
            ))}
          </>
        ) : null}

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconBubble}>
              <Ionicons name="trending-up-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>OpenAI Revenue Plan</Text>
              <Text style={styles.cardSubtitle}>
                Creates a revenue plan from rooms, reservations, guests, and services
              </Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.primaryButton,
              loadingRevenuePlan && styles.disabledButton,
            ]}
            onPress={generateRevenuePlan}
            disabled={loadingRevenuePlan}
          >
            {loadingRevenuePlan ? (
              <ActivityIndicator color="#00111A" />
            ) : (
              <>
                <Ionicons name="cash-outline" size={18} color="#00111A" />
                <Text style={styles.primaryButtonText}>
                  Generate Revenue Plan
                </Text>
              </>
            )}
          </Pressable>

          {revenuePlan ? <AITextBlock text={revenuePlan} /> : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconBubble}>
              <Ionicons name="newspaper-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Daily Manager Briefing</Text>
              <Text style={styles.cardSubtitle}>
                OpenAI summary for the manager
              </Text>
            </View>
          </View>

          <Pressable
            style={[styles.primaryButton, loadingBriefing && styles.disabledButton]}
            onPress={generateBriefing}
            disabled={loadingBriefing}
          >
            {loadingBriefing ? (
              <ActivityIndicator color="#00111A" />
            ) : (
              <>
                <Ionicons name="sparkles-outline" size={18} color="#00111A" />
                <Text style={styles.primaryButtonText}>Generate Briefing</Text>
              </>
            )}
          </Pressable>

          {briefing ? <AITextBlock text={briefing} /> : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconBubble}>
              <Ionicons name="checkbox-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>OpenAI Action Plan</Text>
              <Text style={styles.cardSubtitle}>
                Converts local actions into an execution plan
              </Text>
            </View>
          </View>

          <Pressable
            style={[styles.primaryButton, loadingActionPlan && styles.disabledButton]}
            onPress={generateActionPlan}
            disabled={loadingActionPlan}
          >
            {loadingActionPlan ? (
              <ActivityIndicator color="#00111A" />
            ) : (
              <>
                <Ionicons name="flash-outline" size={18} color="#00111A" />
                <Text style={styles.primaryButtonText}>Generate Action Plan</Text>
              </>
            )}
          </Pressable>

          {actionPlan ? <AITextBlock text={actionPlan} /> : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconBubble}>
              <Ionicons name="heart-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Guest Recovery Drafts</Text>
              <Text style={styles.cardSubtitle}>
                Creates follow-up messages for low feedback cases
              </Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.primaryButton,
              loadingRecoveryDrafts && styles.disabledButton,
            ]}
            onPress={generateRecoveryDrafts}
            disabled={loadingRecoveryDrafts}
          >
            {loadingRecoveryDrafts ? (
              <ActivityIndicator color="#00111A" />
            ) : (
              <>
                <Ionicons name="mail-outline" size={18} color="#00111A" />
                <Text style={styles.primaryButtonText}>
                  Generate Recovery Drafts
                </Text>
              </>
            )}
          </Pressable>

          {recoveryDrafts ? <AITextBlock text={recoveryDrafts} /> : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.iconBubble}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Ask OpenAI</Text>
              <Text style={styles.cardSubtitle}>
                Ask questions using the current hotel snapshot
              </Text>
            </View>
          </View>

          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Ask a hotel operations question..."
            placeholderTextColor={COLORS.muted}
            multiline
            style={styles.input}
          />

          <Pressable
            style={[styles.primaryButton, loadingAnswer && styles.disabledButton]}
            onPress={askAI}
            disabled={loadingAnswer}
          >
            {loadingAnswer ? (
              <ActivityIndicator color="#00111A" />
            ) : (
              <>
                <Ionicons name="send-outline" size={18} color="#00111A" />
                <Text style={styles.primaryButtonText}>Ask OpenAI</Text>
              </>
            )}
          </Pressable>

          {answer ? <AITextBlock text={answer} /> : null}
        </View>
      </ScrollView>
    </>
  );
}

function StatusCard({
  status,
  loading,
  testing,
  onRefresh,
  onTest,
}: {
  status: AIStatus | null;
  loading: boolean;
  testing: boolean;
  onRefresh: () => void;
  onTest: () => void;
}) {
  const configured = Boolean(status?.configured);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: configured ? COLORS.success : COLORS.warning },
          ]}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>OpenAI Backend Status</Text>
          <Text style={styles.cardSubtitle}>
            {loading ? "Checking backend..." : status?.message || "Unknown status"}
          </Text>
        </View>
      </View>

      <View style={styles.statusLine}>
        <Text style={styles.statusLabel}>Model</Text>
        <Text style={styles.statusValue}>{status?.model || "Unknown"}</Text>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
        <Pressable style={styles.secondaryButton} onPress={onRefresh}>
          <Text style={styles.secondaryButtonText}>Refresh</Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, testing && styles.disabledButton]}
          onPress={onTest}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.secondaryButtonText}>Test</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function InsightCard({ insight }: { insight: LocalInsight }) {
  const color = getSeverityColor(insight.severity);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.pill, { borderColor: color }]}>
          <Text style={[styles.pillText, { color }]}>
            {insight.severity.toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={{ color: COLORS.primary, fontWeight: "900" }}>
          {insight.metricValue}
        </Text>
      </View>

      <Text style={styles.cardTitle}>{insight.title}</Text>
      <Text style={styles.bodyText}>{insight.description}</Text>

      <View style={styles.recommendationBox}>
        <Text style={styles.recommendationLabel}>{insight.metricLabel}</Text>
        <Text style={styles.recommendationText}>{insight.recommendation}</Text>
      </View>
    </View>
  );
}

function ActionCard({ item }: { item: ActionItem }) {
  const color = getPriorityColor(item.priority);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.pill, { borderColor: color }]}>
          <Text style={[styles.pillText, { color }]}>{item.priority}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={{ color: COLORS.muted, fontSize: 12 }}>{item.id}</Text>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.bodyText}>{item.description}</Text>

      <View style={styles.actionMetaGrid}>
        <Meta label="Owner" value={item.owner} />
        <Meta label="Due" value={item.due} />
      </View>

      <View style={styles.recommendationBox}>
        <Text style={styles.recommendationLabel}>{item.source}</Text>
        <Text style={styles.recommendationText}>{item.impact}</Text>
      </View>
    </View>
  );
}

function RevenueCard({ item }: { item: RevenueOpportunity }) {
  const color = getPriorityColor(item.impact);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.pill, { borderColor: color }]}>
          <Text style={[styles.pillText, { color }]}>{item.impact} Impact</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={{ color: COLORS.primary, fontWeight: "900" }}>
          {item.estimatedValue}
        </Text>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.bodyText}>{item.description}</Text>

      <View style={styles.actionMetaGrid}>
        <Meta label="Target" value={item.target} />
        <Meta label="Source" value={item.source} />
      </View>

      <View style={styles.recommendationBox}>
        <Text style={styles.recommendationLabel}>Recommendation</Text>
        <Text style={styles.recommendationText}>{item.recommendation}</Text>
      </View>
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaBox}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function AITextBlock({ text }: { text: string }) {
  return (
    <View style={styles.aiTextBlock}>
      <Text style={styles.aiText}>{text}</Text>
    </View>
  );
}

const styles = {
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  loadingCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 22,
    marginBottom: 16,
    alignItems: "center" as const,
  },
  cardHeaderRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginTop: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900" as const,
    marginTop: 10,
    marginBottom: 10,
  },
  sectionSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900" as const,
  },
  cardSubtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  bodyText: {
    color: COLORS.muted,
    marginTop: 8,
    lineHeight: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 99,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: COLORS.card2,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  statusLine: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    backgroundColor: COLORS.card2,
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
  },
  statusLabel: {
    color: COLORS.muted,
    fontSize: 13,
  },
  statusValue: {
    color: COLORS.text,
    fontWeight: "800" as const,
  },
  grid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 10,
    marginBottom: 8,
  },
  metricCard: {
    width: "48%" as const,
    backgroundColor: COLORS.card2,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: 12,
  },
  metricValue: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: "900" as const,
    marginTop: 6,
  },
  pill: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "900" as const,
  },
  recommendationBox: {
    backgroundColor: COLORS.card2,
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  recommendationLabel: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900" as const,
    marginBottom: 4,
  },
  recommendationText: {
    color: COLORS.text,
    lineHeight: 19,
  },
  actionMetaGrid: {
    flexDirection: "row" as const,
    gap: 10,
    marginTop: 12,
  },
  metaBox: {
    flex: 1,
    backgroundColor: COLORS.card2,
    borderRadius: 14,
    padding: 12,
  },
  metaValue: {
    color: COLORS.text,
    fontWeight: "800" as const,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    gap: 8,
    marginTop: 12,
  },
  primaryButtonText: {
    color: "#00111A",
    fontWeight: "900" as const,
  },
  secondaryButton: {
    flex: 1,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center" as const,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: "900" as const,
  },
  smallButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  smallButtonText: {
    color: "#00111A",
    fontWeight: "900" as const,
    fontSize: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  input: {
    minHeight: 110,
    backgroundColor: COLORS.card2,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    color: COLORS.text,
    textAlignVertical: "top" as const,
    lineHeight: 20,
  },
  aiTextBlock: {
    backgroundColor: COLORS.card2,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aiText: {
    color: COLORS.text,
    lineHeight: 21,
  },
};