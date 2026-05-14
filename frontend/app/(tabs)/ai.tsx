import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
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

type OpenAIStatus = {
  configured: boolean;
  model: string;
  message: string;
};

type AIAnswer = {
  answer: string;
  model: string;
  generatedAt: string;
};

type Summary = {
  totalRooms: number;
  availableRooms: number;
  reservedRooms: number;
  occupiedRooms: number;
  blockedRooms: number;
  totalGuests: number;
  totalReservations: number;
  activeReservations: number;
  cancelledReservations: number;
  pendingServices: number;
  inProgressServices: number;
  completedServiceRevenue: number;
  reservationRevenue: number;
  avgRoomRating: number | null;
  avgCustomerServiceRating: number | null;
  avgSafetyRating: number | null;
  avgBreakfastRating: number | null;
};

type Recommendation = {
  title: string;
  priority: "High" | "Medium" | "Low";
  reason: string;
  action: string;
};

type RoomTypePerformance = {
  RoomType: string;
  totalRooms: number;
  availableRooms: number;
  reservedRooms: number;
  occupiedRooms: number;
  blockedRooms: number;
  avgRate: number;
};

type ServiceRevenue = {
  ServiceType: string;
  serviceCount: number;
  totalRevenue: number;
  avgPrice: number;
};

type TopGuest = {
  GuestID: number;
  guestName: string;
  MembershipLevel: string | null;
  reservationCount: number;
  totalSpent: number;
};

type LowFeedback = {
  FeedbackID: number;
  ReservationID: number;
  guestName: string;
  RoomType: string;
  RoomRating: number;
  BreakfastRating: number;
  SafetyRating: number;
  CustSvcRating: number;
  Comments: string;
  SubmissionDate: string;
};

type Insights = {
  generatedAt: string;
  summary: Summary;
  recommendations: Recommendation[];
  roomTypePerformance: RoomTypePerformance[];
  serviceRevenueByType: ServiceRevenue[];
  topGuests: TopGuest[];
  recentLowFeedback: LowFeedback[];
};

const SAMPLE_QUESTIONS = [
  "What should the hotel manager focus on today?",
  "Which room type should we promote?",
  "What service is making the most revenue?",
  "Which guests need follow-up?",
];

function money(value: number | string | null | undefined) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function rating(value: number | null | undefined) {
  if (!value) return "N/A";
  return `${Number(value).toFixed(2)}/5`;
}

function priorityColor(priority: Recommendation["priority"]) {
  if (priority === "High") return COLORS.danger;
  if (priority === "Medium") return COLORS.warning;
  return COLORS.success;
}

export default function AIInsightsScreen() {
  const [status, setStatus] = useState<OpenAIStatus | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [aiAnswer, setAIAnswer] = useState<AIAnswer | null>(null);
  const [briefing, setBriefing] = useState<AIAnswer | null>(null);

  const [question, setQuestion] = useState(
    "What should the hotel manager focus on today?"
  );

  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [asking, setAsking] = useState(false);
  const [briefingLoading, setBriefingLoading] = useState(false);

  const getErrorMessage = (error: any) => {
    const statusCode = error.response?.status;
    const backendMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";

    return statusCode ? `Status ${statusCode}: ${backendMessage}` : backendMessage;
  };

  const loadAIPage = async () => {
    try {
      setLoading(true);

      const [statusRes, insightsRes] = await Promise.all([
        API.get("/api/ai/status"),
        API.get("/api/ai/insights"),
      ]);

      setStatus(statusRes.data);
      setInsights(insightsRes.data);
    } catch (error: any) {
      console.log("AI PAGE LOAD ERROR:", error.response?.data || error.message);
      Alert.alert("AI Page Error", getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const testOpenAI = async () => {
    try {
      setTesting(true);

      const res = await API.get("/api/ai/test");

      setAIAnswer({
        answer: res.data.answer,
        model: res.data.model,
        generatedAt: res.data.generatedAt,
      });

      Alert.alert("OpenAI Test Passed", res.data.answer);
    } catch (error: any) {
      console.log("OPENAI TEST ERROR:", error.response?.data || error.message);
      Alert.alert("OpenAI Test Failed", getErrorMessage(error));
    } finally {
      setTesting(false);
    }
  };

  const generateBriefing = async () => {
    try {
      setBriefingLoading(true);

      const res = await API.post("/api/ai/briefing");

      setBriefing({
        answer: res.data.answer,
        model: res.data.model,
        generatedAt: res.data.generatedAt,
      });
    } catch (error: any) {
      console.log("BRIEFING ERROR:", error.response?.data || error.message);
      Alert.alert("Briefing Error", getErrorMessage(error));
    } finally {
      setBriefingLoading(false);
    }
  };

  const askOpenAI = async (customQuestion?: string) => {
    const finalQuestion = (customQuestion || question).trim();

    if (!finalQuestion) {
      Alert.alert("Missing Question", "Type a question first.");
      return;
    }

    try {
      setAsking(true);
      setQuestion(finalQuestion);

      const res = await API.post("/api/ai/ask", {
        question: finalQuestion,
      });

      setAIAnswer(res.data);
    } catch (error: any) {
      console.log("OPENAI ASK ERROR:", error.response?.data || error.message);
      Alert.alert("OpenAI Error", getErrorMessage(error));
    } finally {
      setAsking(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAIPage();
    }, [])
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!insights) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 20 }}>
        <Stack.Screen
          options={{
            title: "AI",
            headerStyle: { backgroundColor: COLORS.bg },
            headerTintColor: COLORS.text,
          }}
        />

        <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: "900" }}>
          AI
        </Text>

        <Text style={{ color: COLORS.muted, marginTop: 10 }}>
          Insights could not be loaded. Check the backend terminal.
        </Text>

        <Pressable
          onPress={loadAIPage}
          style={{
            backgroundColor: COLORS.primary,
            padding: 14,
            borderRadius: 14,
            alignItems: "center",
            marginTop: 18,
          }}
        >
          <Text style={{ color: "#00111A", fontWeight: "900" }}>
            Try Again
          </Text>
        </Pressable>
      </View>
    );
  }

  const summary = insights.summary;

  return (
    <>
      <Stack.Screen
        options={{
          title: "AI",
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.text,
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <Text style={{ color: COLORS.text, fontSize: 30, fontWeight: "900" }}>
          AI Hotel Assistant
        </Text>

        <Text style={{ color: COLORS.muted, marginTop: 6 }}>
          Ask OpenAI questions using your hotel database insights.
        </Text>

        <View
          style={{
            backgroundColor: COLORS.card,
            padding: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: COLORS.border,
            marginTop: 18,
          }}
        >
          <Text style={{ color: COLORS.text, fontSize: 21, fontWeight: "900" }}>
            OpenAI Status
          </Text>

          <View
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 14,
              backgroundColor: status?.configured ? "#0F2A1A" : "#2A1616",
              borderWidth: 1,
              borderColor: status?.configured ? COLORS.success : COLORS.danger,
            }}
          >
            <Text
              style={{
                color: status?.configured ? COLORS.success : COLORS.danger,
                fontWeight: "900",
                fontSize: 16,
              }}
            >
              {status?.configured ? "Configured" : "Not Configured"}
            </Text>

            <Text style={{ color: COLORS.text, marginTop: 6 }}>
              Model: {status?.model || "Unknown"}
            </Text>

            <Text style={{ color: COLORS.muted, marginTop: 6 }}>
              {status?.message || "No status message received."}
            </Text>
          </View>

          <Pressable
            onPress={testOpenAI}
            disabled={testing}
            style={{
              backgroundColor: testing ? COLORS.muted : COLORS.primary,
              padding: 14,
              borderRadius: 14,
              alignItems: "center",
              marginTop: 14,
            }}
          >
            {testing ? (
              <ActivityIndicator color="#00111A" />
            ) : (
              <Text style={{ color: "#00111A", fontWeight: "900" }}>
                Test OpenAI Connection
              </Text>
            )}
          </Pressable>
        </View>

        <View
          style={{
            backgroundColor: COLORS.card,
            padding: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: COLORS.border,
            marginTop: 18,
          }}
        >
          <Text style={{ color: COLORS.text, fontSize: 21, fontWeight: "900" }}>
            Daily Manager Briefing
          </Text>

          <Text style={{ color: COLORS.muted, marginTop: 8, lineHeight: 20 }}>
            Generates a structured manager summary using rooms, reservations,
            services, revenue, guests, and feedback.
          </Text>

          <Pressable
            onPress={generateBriefing}
            disabled={briefingLoading}
            style={{
              backgroundColor: briefingLoading ? COLORS.muted : COLORS.primary,
              padding: 14,
              borderRadius: 14,
              alignItems: "center",
              marginTop: 14,
            }}
          >
            {briefingLoading ? (
              <ActivityIndicator color="#00111A" />
            ) : (
              <Text style={{ color: "#00111A", fontWeight: "900" }}>
                Generate Daily Briefing
              </Text>
            )}
          </Pressable>

          {briefing && (
            <View
              style={{
                backgroundColor: COLORS.bg,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: COLORS.border,
                marginTop: 14,
              }}
            >
              <Text
                style={{
                  color: COLORS.primary,
                  fontWeight: "900",
                  marginBottom: 8,
                }}
              >
                Model: {briefing.model}
              </Text>

              <Text style={{ color: COLORS.text, lineHeight: 21 }}>
                {briefing.answer}
              </Text>
            </View>
          )}
        </View>

        <View
          style={{
            backgroundColor: COLORS.card,
            padding: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: COLORS.border,
            marginTop: 18,
          }}
        >
          <Text style={{ color: COLORS.text, fontSize: 21, fontWeight: "900" }}>
            Ask OpenAI
          </Text>

          <TextInput
            value={question}
            onChangeText={setQuestion}
            multiline
            placeholder="Ask something about hotel operations..."
            placeholderTextColor={COLORS.muted}
            style={{
              minHeight: 95,
              color: COLORS.text,
              backgroundColor: COLORS.bg,
              borderColor: COLORS.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: 12,
              marginTop: 12,
              textAlignVertical: "top",
            }}
          />

          <Pressable
            onPress={() => askOpenAI()}
            disabled={asking}
            style={{
              backgroundColor: asking ? COLORS.muted : COLORS.primary,
              padding: 14,
              borderRadius: 14,
              alignItems: "center",
              marginTop: 12,
            }}
          >
            {asking ? (
              <ActivityIndicator color="#00111A" />
            ) : (
              <Text style={{ color: "#00111A", fontWeight: "900" }}>
                Generate OpenAI Answer
              </Text>
            )}
          </Pressable>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 8,
              marginTop: 12,
            }}
          >
            {SAMPLE_QUESTIONS.map((item) => (
              <Pressable
                key={item}
                onPress={() => askOpenAI(item)}
                disabled={asking}
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 999,
                }}
              >
                <Text style={{ color: COLORS.primary, fontWeight: "800" }}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>

          {aiAnswer && (
            <View
              style={{
                backgroundColor: COLORS.bg,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: COLORS.border,
                marginTop: 14,
              }}
            >
              <Text
                style={{
                  color: COLORS.primary,
                  fontWeight: "900",
                  marginBottom: 8,
                }}
              >
                Model: {aiAnswer.model}
              </Text>

              <Text style={{ color: COLORS.text, lineHeight: 21 }}>
                {aiAnswer.answer}
              </Text>
            </View>
          )}
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
          <StatCard title="Rooms" value={summary.totalRooms} />
          <StatCard title="Available" value={summary.availableRooms} />
          <StatCard title="Guests" value={summary.totalGuests} />
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
          <StatCard title="Active Res." value={summary.activeReservations} />
          <StatCard title="Pending Svc." value={summary.pendingServices} />
          <StatCard title="Blocked" value={summary.blockedRooms} />
        </View>

        <View
          style={{
            backgroundColor: COLORS.card,
            padding: 16,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: COLORS.border,
            marginTop: 18,
          }}
        >
          <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "900" }}>
            Revenue + Ratings
          </Text>

          <View style={{ marginTop: 14 }}>
            <Info
              label="Reservation Revenue"
              value={money(summary.reservationRevenue)}
            />
            <Info
              label="Completed Service Revenue"
              value={money(summary.completedServiceRevenue)}
            />
            <Info
              label="Average Room Rating"
              value={rating(summary.avgRoomRating)}
            />
            <Info
              label="Average Customer Service Rating"
              value={rating(summary.avgCustomerServiceRating)}
            />
            <Info
              label="Average Safety Rating"
              value={rating(summary.avgSafetyRating)}
            />
            <Info
              label="Average Breakfast Rating"
              value={rating(summary.avgBreakfastRating)}
            />
          </View>
        </View>

        <SectionTitle title="Rule-Based Recommendations" />

        {insights.recommendations.map((item, index) => (
          <View
            key={`${item.title}-${index}`}
            style={{
              backgroundColor: COLORS.card,
              padding: 16,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 14,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 19,
                  fontWeight: "900",
                  flex: 1,
                }}
              >
                {item.title}
              </Text>

              <View
                style={{
                  backgroundColor: priorityColor(item.priority),
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 999,
                  alignSelf: "flex-start",
                }}
              >
                <Text style={{ color: "#00111A", fontWeight: "900" }}>
                  {item.priority}
                </Text>
              </View>
            </View>

            <Text style={{ color: COLORS.muted, marginTop: 10 }}>
              {item.reason}
            </Text>

            <Text style={{ color: COLORS.text, marginTop: 10, lineHeight: 20 }}>
              {item.action}
            </Text>
          </View>
        ))}

        <SectionTitle title="Room Type Performance" />

        {insights.roomTypePerformance.map((item) => (
          <View
            key={item.RoomType}
            style={{
              backgroundColor: COLORS.card,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 12,
            }}
          >
            <Text
              style={{ color: COLORS.text, fontSize: 18, fontWeight: "900" }}
            >
              {item.RoomType}
            </Text>

            <Text style={{ color: COLORS.muted, marginTop: 6 }}>
              {item.availableRooms} available • {item.reservedRooms} reserved •{" "}
              {item.occupiedRooms} occupied • {item.blockedRooms} blocked
            </Text>

            <Text
              style={{
                color: COLORS.primary,
                marginTop: 6,
                fontWeight: "800",
              }}
            >
              Average rate: {money(item.avgRate)}
            </Text>
          </View>
        ))}

        <SectionTitle title="Service Revenue" />

        {insights.serviceRevenueByType.map((item) => (
          <View
            key={item.ServiceType}
            style={{
              backgroundColor: COLORS.card,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 12,
            }}
          >
            <Text
              style={{ color: COLORS.text, fontSize: 18, fontWeight: "900" }}
            >
              {item.ServiceType}
            </Text>

            <Text style={{ color: COLORS.muted, marginTop: 6 }}>
              {item.serviceCount} requests • Avg {money(item.avgPrice)}
            </Text>

            <Text
              style={{
                color: COLORS.primary,
                marginTop: 6,
                fontWeight: "800",
              }}
            >
              Total: {money(item.totalRevenue)}
            </Text>
          </View>
        ))}

        <SectionTitle title="Top Guests" />

        {insights.topGuests.map((item) => (
          <View
            key={item.GuestID}
            style={{
              backgroundColor: COLORS.card,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: COLORS.border,
              marginBottom: 12,
            }}
          >
            <Text
              style={{ color: COLORS.text, fontSize: 18, fontWeight: "900" }}
            >
              {item.guestName}
            </Text>

            <Text style={{ color: COLORS.muted, marginTop: 6 }}>
              {item.MembershipLevel || "No membership"} •{" "}
              {item.reservationCount} reservations
            </Text>

            <Text
              style={{
                color: COLORS.primary,
                marginTop: 6,
                fontWeight: "800",
              }}
            >
              Total spent: {money(item.totalSpent)}
            </Text>
          </View>
        ))}

        <SectionTitle title="Recent Low Feedback" />

        {insights.recentLowFeedback.length === 0 ? (
          <Text style={{ color: COLORS.muted }}>No low feedback found.</Text>
        ) : (
          insights.recentLowFeedback.map((item) => (
            <View
              key={item.FeedbackID}
              style={{
                backgroundColor: COLORS.card,
                padding: 16,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
                marginBottom: 12,
              }}
            >
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 18,
                  fontWeight: "900",
                }}
              >
                {item.guestName} • {item.RoomType}
              </Text>

              <Text style={{ color: COLORS.muted, marginTop: 6 }}>
                Room {item.RoomRating}/5 • Breakfast {item.BreakfastRating}/5 •
                Safety {item.SafetyRating}/5 • Service {item.CustSvcRating}/5
              </Text>

              <Text style={{ color: COLORS.text, marginTop: 8 }}>
                {item.Comments}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.card,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <Text style={{ color: COLORS.muted, fontSize: 12 }}>{title}</Text>

      <Text
        style={{
          color: COLORS.primary,
          fontSize: 23,
          fontWeight: "900",
          marginTop: 6,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: COLORS.muted, fontSize: 13 }}>{label}</Text>

      <Text
        style={{
          color: COLORS.text,
          fontSize: 17,
          fontWeight: "800",
          marginTop: 3,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text
      style={{
        color: COLORS.text,
        fontSize: 22,
        fontWeight: "900",
        marginTop: 24,
        marginBottom: 12,
      }}
    >
      {title}
    </Text>
  );
}