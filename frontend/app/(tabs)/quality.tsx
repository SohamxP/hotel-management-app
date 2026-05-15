import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { API } from "../../api/api";
import { COLORS } from "../../constants/theme";

type QualityRisk = "High" | "Medium" | "Low";

type QualityMetric = {
  label: string;
  value: string;
  detail: string;
};

type FeedbackCase = {
  FeedbackID: number;
  ReservationID: number;
  GuestID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  MembershipLevel?: string | null;
  RoomNumber: number;
  RoomType: string;
  CheckInDate: string;
  CheckOutDate: string;
  TotalPrice: number;
  RoomRating: number;
  BreakfastRating: number;
  SafetyRating: number;
  CustSvcRating: number;
  AvgRating: number;
  WeakestCategory: string;
  Comments: string;
  SubmissionDate: string;
};

type RecoveryOpportunity = {
  id: string;
  risk: QualityRisk;
  title: string;
  description: string;
  target: string;
  source: string;
  priority: string;
  recommendation: string;
  comments?: string | null;
};

type RoomTypeQuality = {
  RoomType: string;
  feedbackCount: number;
  avgOverallRating: number;
  avgRoomRating: number;
  avgBreakfastRating: number;
  avgSafetyRating: number;
  avgCustSvcRating: number;
  lowRatingCount: number;
};

type ServiceQuality = {
  ServiceType: string;
  serviceCount: number;
  feedbackCount: number;
  serviceRevenue: number;
  avgFeedbackRating: number;
  slowMentions: number;
  averageMentions: number;
};

type QualityOverview = {
  success: boolean;
  generatedAt: string;
  summary: {
    totalFeedback: number;
    avgOverallRating: number;
    lowRatingCount: number;
    qualityRisk: QualityRisk;
    weakestRoomType: string;
    weakestRoomTypeRating: number;
    weakestServiceType: string;
    weakestServiceRating: number;
    highValueRecoveryGuests: number;
  };
  metrics: QualityMetric[];
  feedbackCases: FeedbackCase[];
  roomTypeQuality: RoomTypeQuality[];
  serviceQuality: ServiceQuality[];
  complaintPatterns: {
    slowMentions: number;
    noisyMentions: number;
    averageMentions: number;
    breakfastMentions: number;
    serviceMentions: number;
    roomSizeMentions: number;
  };
  recoveryOpportunities: RecoveryOpportunity[];
};

function riskColor(risk: QualityRisk) {
  if (risk === "High") return COLORS.danger;
  if (risk === "Medium") return COLORS.warning;
  return COLORS.success;
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function AITextBlock({ text }: { text: string }) {
  return (
    <View style={styles.aiTextBlock}>
      <Text style={styles.aiText}>{text}</Text>
    </View>
  );
}

function MetricCard({ metric }: { metric: QualityMetric }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{metric.label}</Text>
      <Text style={styles.metricValue}>{metric.value}</Text>
      <Text style={styles.metricDetail}>{metric.detail}</Text>
    </View>
  );
}

function RecoveryCard({
  item,
  onDraft,
  loading,
}: {
  item: RecoveryOpportunity;
  onDraft: () => void;
  loading: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeaderRow}>
        <View
          style={[
            styles.riskBadge,
            {
              borderColor: riskColor(item.risk),
            },
          ]}
        >
          <Text style={[styles.riskText, { color: riskColor(item.risk) }]}>
            {item.risk}
          </Text>
        </View>

        <Text style={styles.cardSource}>{item.source}</Text>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardSubtitle}>{item.description}</Text>

      {item.comments ? (
        <Text style={styles.quoteText}>“{item.comments}”</Text>
      ) : null}

      <View style={styles.recommendationBox}>
        <Text style={styles.recommendationLabel}>{item.priority}</Text>
        <Text style={styles.recommendationText}>{item.recommendation}</Text>
      </View>

      {item.source.startsWith("Feedback #") ? (
        <Pressable
          style={[styles.secondaryButton, loading && styles.disabledButton]}
          onPress={onDraft}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <>
              <Ionicons name="mail-outline" size={18} color={COLORS.text} />
              <Text style={styles.secondaryButtonText}>Generate Guest Draft</Text>
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

function RoomTypeCard({ item }: { item: RoomTypeQuality }) {
  const risk =
    Number(item.avgOverallRating || 0) < 3.6
      ? "High"
      : Number(item.avgOverallRating || 0) < 4.1
      ? "Medium"
      : "Low";

  return (
    <View style={styles.compactCard}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>{item.RoomType}</Text>
        <Text style={[styles.riskText, { color: riskColor(risk) }]}>
          {item.avgOverallRating}/5
        </Text>
      </View>

      <Text style={styles.cardSubtitle}>
        {item.feedbackCount} feedback record(s) • {item.lowRatingCount} low rating(s)
      </Text>

      <Text style={styles.smallText}>
        Room {item.avgRoomRating}/5 • Breakfast {item.avgBreakfastRating}/5 •
        Safety {item.avgSafetyRating}/5 • Service {item.avgCustSvcRating}/5
      </Text>
    </View>
  );
}

function ServiceQualityCard({ item }: { item: ServiceQuality }) {
  const risk =
    Number(item.avgFeedbackRating || 0) < 3.6
      ? "High"
      : Number(item.avgFeedbackRating || 0) < 4.1
      ? "Medium"
      : "Low";

  return (
    <View style={styles.compactCard}>
      <View style={styles.cardHeaderRow}>
        <Text style={styles.cardTitle}>{item.ServiceType}</Text>
        <Text style={[styles.riskText, { color: riskColor(risk) }]}>
          {item.avgFeedbackRating}/5
        </Text>
      </View>

      <Text style={styles.cardSubtitle}>
        {item.serviceCount} completed service(s) • {formatMoney(item.serviceRevenue)}
      </Text>

      <Text style={styles.smallText}>
        Slow mentions: {item.slowMentions || 0} • Average mentions:{" "}
        {item.averageMentions || 0}
      </Text>
    </View>
  );
}

export default function QualityScreen() {
  const [overview, setOverview] = useState<QualityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [qualityPlan, setQualityPlan] = useState("");
  const [guestDraft, setGuestDraft] = useState("");
  const [selectedGuest, setSelectedGuest] = useState("");
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingDraftId, setLoadingDraftId] = useState<number | null>(null);

  const loadQuality = async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/quality/overview");
      setOverview(res.data);
    } catch (error: any) {
      console.log("Quality overview error:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to load quality engine");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadQuality();
    }, [])
  );

  const highRiskCount = useMemo(() => {
    return (overview?.recoveryOpportunities || []).filter(
      (item) => item.risk === "High"
    ).length;
  }, [overview]);

  const generatePlan = async () => {
    try {
      setLoadingPlan(true);
      setQualityPlan("");

      const res = await API.post("/api/quality/plan");
      setQualityPlan(res.data.plan || "No quality plan returned.");
    } catch (error: any) {
      console.log("Quality plan error:", error.response?.data || error.message);
      Alert.alert(
        "Quality plan failed",
        error.response?.data?.error || "Could not generate quality plan"
      );
    } finally {
      setLoadingPlan(false);
    }
  };

  const generateDraft = async (feedbackCase: FeedbackCase) => {
    try {
      setLoadingDraftId(feedbackCase.FeedbackID);
      setGuestDraft("");
      setSelectedGuest(`${feedbackCase.FirstName} ${feedbackCase.LastName}`);

      const res = await API.post("/api/quality/guest-recovery-draft", {
        feedbackId: feedbackCase.FeedbackID,
      });

      setGuestDraft(res.data.draft || "No guest recovery draft returned.");
    } catch (error: any) {
      console.log("Guest recovery draft error:", error.response?.data || error.message);
      Alert.alert(
        "Guest draft failed",
        error.response?.data?.error || "Could not generate guest recovery draft"
      );
    } finally {
      setLoadingDraftId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={{ color: COLORS.muted, marginTop: 10 }}>
          Loading quality engine...
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Quality",
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.text,
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
      >
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.screenTitle}>AI Quality Engine</Text>
          <Text style={styles.screenSubtitle}>
            Guest satisfaction, complaint patterns, recovery actions, and
            OpenAI-generated service improvement plans.
          </Text>
        </View>

        {overview ? (
          <>
            <View style={styles.heroCard}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.heroLabel}>Overall Quality Risk</Text>
                  <Text
                    style={[
                      styles.heroRisk,
                      { color: riskColor(overview.summary.qualityRisk) },
                    ]}
                  >
                    {overview.summary.qualityRisk}
                  </Text>
                </View>

                <Pressable style={styles.smallButton} onPress={loadQuality}>
                  <Ionicons name="refresh-outline" size={16} color="#00111A" />
                  <Text style={styles.smallButtonText}>Refresh</Text>
                </Pressable>
              </View>

              <Text style={styles.heroText}>
                {overview.summary.totalFeedback} feedback record(s),{" "}
                {overview.summary.lowRatingCount} low-rating case(s), and{" "}
                {highRiskCount} high-risk recovery item(s).
              </Text>
            </View>

            <View style={styles.grid}>
              {overview.metrics.map((metric) => (
                <MetricCard key={metric.label} metric={metric} />
              ))}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconBubble}>
                  <Ionicons name="analytics-outline" size={20} color={COLORS.primary} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>OpenAI Quality Plan</Text>
                  <Text style={styles.cardSubtitle}>
                    Turns feedback and service issues into manager actions
                  </Text>
                </View>
              </View>

              <Pressable
                style={[styles.primaryButton, loadingPlan && styles.disabledButton]}
                onPress={generatePlan}
                disabled={loadingPlan}
              >
                {loadingPlan ? (
                  <ActivityIndicator color="#00111A" />
                ) : (
                  <>
                    <Ionicons name="sparkles-outline" size={18} color="#00111A" />
                    <Text style={styles.primaryButtonText}>
                      Generate Quality Plan
                    </Text>
                  </>
                )}
              </Pressable>

              {qualityPlan ? <AITextBlock text={qualityPlan} /> : null}
            </View>

            {guestDraft ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Guest Recovery Draft
                  {selectedGuest ? ` — ${selectedGuest}` : ""}
                </Text>
                <AITextBlock text={guestDraft} />
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Recovery Opportunities</Text>

            {overview.recoveryOpportunities.map((item) => {
              const feedbackId = item.source.startsWith("Feedback #")
                ? Number(item.source.replace("Feedback #", ""))
                : null;

              const feedbackCase = feedbackId
                ? overview.feedbackCases.find(
                    (caseItem) => Number(caseItem.FeedbackID) === feedbackId
                  )
                : null;

              return (
                <RecoveryCard
                  key={item.id}
                  item={item}
                  loading={
                    feedbackCase
                      ? loadingDraftId === feedbackCase.FeedbackID
                      : false
                  }
                  onDraft={() => {
                    if (feedbackCase) {
                      generateDraft(feedbackCase);
                    }
                  }}
                />
              );
            })}

            <Text style={styles.sectionTitle}>Room Type Quality</Text>

            {overview.roomTypeQuality.map((item) => (
              <RoomTypeCard key={item.RoomType} item={item} />
            ))}

            <Text style={styles.sectionTitle}>Service Quality Signals</Text>

            {overview.serviceQuality.map((item) => (
              <ServiceQualityCard key={item.ServiceType} item={item} />
            ))}

            <Text style={styles.sectionTitle}>Complaint Pattern Counts</Text>

            <View style={styles.grid}>
              <MetricCard
                metric={{
                  label: "Slow",
                  value: String(overview.complaintPatterns.slowMentions || 0),
                  detail: "Slow-service mentions",
                }}
              />

              <MetricCard
                metric={{
                  label: "Noisy",
                  value: String(overview.complaintPatterns.noisyMentions || 0),
                  detail: "Noise mentions",
                }}
              />

              <MetricCard
                metric={{
                  label: "Average",
                  value: String(overview.complaintPatterns.averageMentions || 0),
                  detail: "Average-experience mentions",
                }}
              />

              <MetricCard
                metric={{
                  label: "Breakfast",
                  value: String(overview.complaintPatterns.breakfastMentions || 0),
                  detail: "Breakfast mentions",
                }}
              />
            </View>
          </>
        ) : (
          <Text style={styles.screenSubtitle}>No quality data found.</Text>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
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
  heroLabel: {
    color: COLORS.muted,
    fontWeight: "800",
  },
  heroRisk: {
    fontSize: 30,
    fontWeight: "900",
    marginTop: 4,
  },
  heroText: {
    color: COLORS.text,
    marginTop: 12,
    lineHeight: 21,
  },
  grid: {
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
    fontSize: 22,
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
    fontSize: 21,
    fontWeight: "900",
    marginTop: 18,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  compactCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.card2,
    alignItems: "center",
    justifyContent: "center",
  },
  riskBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.card2,
  },
  riskText: {
    fontWeight: "900",
  },
  cardSource: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },
  cardSubtitle: {
    color: COLORS.muted,
    marginTop: 6,
    lineHeight: 19,
  },
  quoteText: {
    color: COLORS.text,
    fontStyle: "italic",
    marginTop: 12,
    lineHeight: 20,
  },
  recommendationBox: {
    backgroundColor: COLORS.card2,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  recommendationLabel: {
    color: COLORS.primary,
    fontWeight: "900",
    marginBottom: 5,
  },
  recommendationText: {
    color: COLORS.text,
    lineHeight: 20,
  },
  smallText: {
    color: COLORS.muted,
    marginTop: 8,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  primaryButtonText: {
    color: "#00111A",
    fontWeight: "900",
  },
  secondaryButton: {
    backgroundColor: COLORS.card2,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
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
  smallButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  smallButtonText: {
    color: "#00111A",
    fontWeight: "900",
    fontSize: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  aiTextBlock: {
    backgroundColor: COLORS.card2,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  aiText: {
    color: COLORS.text,
    lineHeight: 21,
  },
});