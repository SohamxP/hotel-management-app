import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { API } from "../../api/api";
import { COLORS } from "../../constants/theme";

type PaymentStatus =
  | "not_started"
  | "checkout_created"
  | "paid"
  | "refunded"
  | "cancelled";

type BillingReservation = {
  reservationId: number;
  guestId: number;
  firstName: string;
  lastName: string;
  email: string;
  roomNumber: number;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  roomTotal: number;
  serviceCount: number;
  serviceTotal: number;
  grandTotal: number;
  reservationStatus: string;
  originalPaymentMode: string;
  billingTransactionId?: number | null;
  stripeSessionId?: string | null;
  checkoutUrl?: string | null;
  amountCents?: number | null;
  currency?: string | null;
  paymentStatus?: PaymentStatus | null;
  billingMode?: "stripe" | "simulation" | null;
  billingCreatedAt?: string | null;
  paidAt?: string | null;
  refundedAt?: string | null;
  lastSyncedAt?: string | null;
  stripePaymentStatus?: string | null;
  stripeSessionStatus?: string | null;
};

type BillingOverview = {
  success: boolean;
  stripeReady: boolean;
  mode: "stripe" | "simulation";
  currency: string;
  successUrl?: string;
  cancelUrl?: string;
  totals: {
    reservations: number;
    activeBills: number;
    outstandingAmount: number;
    paidAmount: number;
    refundedAmount: number;
    paidCount: number;
    checkoutCreatedCount: number;
    refundedCount: number;
  };
  reservations: BillingReservation[];
};

const FILTERS = ["All", "Outstanding", "Checkout", "Paid", "Refunded", "Cancelled"];

function money(value: number, currency = "usd") {
  return `${currency.toUpperCase()} $${Number(value || 0).toFixed(2)}`;
}

function getStatus(bill: BillingReservation): PaymentStatus {
  if (bill.reservationStatus === "Cancelled" || bill.reservationStatus === "No-Show") {
    return "cancelled";
  }

  return bill.paymentStatus || "not_started";
}

function statusColor(status: PaymentStatus) {
  if (status === "paid") return COLORS.success;
  if (status === "checkout_created") return COLORS.warning;
  if (status === "refunded") return COLORS.primary;
  if (status === "cancelled") return COLORS.danger;
  return COLORS.muted;
}

function statusText(status: PaymentStatus) {
  if (status === "not_started") return "not started";
  if (status === "checkout_created") return "checkout created";
  return status;
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

function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <View style={[styles.statusBadge, { borderColor: statusColor(status) }]}>
      <Text style={[styles.statusBadgeText, { color: statusColor(status) }]}>
        {statusText(status)}
      </Text>
    </View>
  );
}

export default function BillingScreen() {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [workingReservationId, setWorkingReservationId] = useState<number | null>(
    null
  );

  const loadBilling = async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/billing/overview");
      setOverview(res.data);
    } catch (error: any) {
      console.log("Billing overview error:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to load billing center");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBilling();
    }, [])
  );

  const filteredReservations = useMemo(() => {
    const reservations = overview?.reservations || [];

    return reservations.filter((bill) => {
      const status = getStatus(bill);

      if (activeFilter === "All") return true;
      if (activeFilter === "Outstanding") {
        return status !== "paid" && status !== "refunded" && status !== "cancelled";
      }
      if (activeFilter === "Checkout") return status === "checkout_created";
      if (activeFilter === "Paid") return status === "paid";
      if (activeFilter === "Refunded") return status === "refunded";
      if (activeFilter === "Cancelled") return status === "cancelled";

      return true;
    });
  }, [overview, activeFilter]);

  const createCheckout = async (reservationId: number) => {
    try {
      setWorkingReservationId(reservationId);

      const res = await API.post("/api/billing/checkout", {
        reservationId,
      });

      if (res.data.checkoutUrl) {
        Alert.alert("Checkout Created", "Opening Stripe checkout.");
        await Linking.openURL(res.data.checkoutUrl);
      } else {
        Alert.alert(
          "Simulation Mode",
          res.data.message || "Simulated checkout created."
        );
      }

      loadBilling();
    } catch (error: any) {
      console.log("Create checkout error:", error.response?.data || error.message);
      Alert.alert(
        "Checkout Failed",
        error.response?.data?.error || "Could not create checkout"
      );
    } finally {
      setWorkingReservationId(null);
    }
  };

  const syncStripeStatus = async (bill: BillingReservation) => {
    if (!bill.stripeSessionId) {
      Alert.alert("Missing session", "This bill does not have a Stripe session ID.");
      return;
    }

    try {
      setWorkingReservationId(bill.reservationId);

      const res = await API.post("/api/billing/sync-session", {
        stripeSessionId: bill.stripeSessionId,
      });

      Alert.alert("Stripe Synced", res.data.message || "Stripe session synced.");
      loadBilling();
    } catch (error: any) {
      console.log("Stripe sync error:", error.response?.data || error.message);
      Alert.alert(
        "Sync Failed",
        error.response?.data?.error || "Could not sync Stripe session"
      );
    } finally {
      setWorkingReservationId(null);
    }
  };

  const markPaid = async (reservationId: number) => {
    try {
      setWorkingReservationId(reservationId);

      const res = await API.post(`/api/billing/${reservationId}/mark-paid`);

      Alert.alert("Payment Updated", res.data.message || "Payment marked as paid.");
      loadBilling();
    } catch (error: any) {
      console.log("Mark paid error:", error.response?.data || error.message);
      Alert.alert(
        "Payment Failed",
        error.response?.data?.error || "Could not mark payment as paid"
      );
    } finally {
      setWorkingReservationId(null);
    }
  };

  const refundPayment = async (reservationId: number) => {
    try {
      setWorkingReservationId(reservationId);

      const res = await API.post(`/api/billing/${reservationId}/refund`);

      Alert.alert("Refund Updated", res.data.message || "Payment marked as refunded.");
      loadBilling();
    } catch (error: any) {
      console.log("Refund error:", error.response?.data || error.message);
      Alert.alert(
        "Refund Failed",
        error.response?.data?.error || "Could not mark payment as refunded"
      );
    } finally {
      setWorkingReservationId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={{ color: COLORS.muted, marginTop: 10 }}>
          Loading billing center...
        </Text>
      </View>
    );
  }

  const currency = overview?.currency || "usd";
  const mode = overview?.mode || "simulation";

  return (
    <>
      <Stack.Screen
        options={{
          title: "Billing",
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.text,
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
      >
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Billing Center</Text>
          <Text style={styles.screenSubtitle}>
            Reservation bills, service charges, Stripe checkout sessions, redirect
            sync, and demo-safe payment status updates.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroLabel}>Payment Mode</Text>
              <Text
                style={[
                  styles.heroValue,
                  { color: overview?.stripeReady ? COLORS.success : COLORS.warning },
                ]}
              >
                {mode === "stripe" ? "Stripe Ready" : "Simulation"}
              </Text>
            </View>

            <Pressable style={styles.refreshButton} onPress={loadBilling}>
              <Ionicons name="refresh-outline" size={16} color="#00111A" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </Pressable>
          </View>

          <Text style={styles.heroText}>
            {overview?.stripeReady
              ? "Backend Stripe key found. Stripe checkout is created by the backend only. After payment, the success page syncs the session back into SQLite."
              : "No Stripe secret key found. The app will create safe simulated checkout records."}
          </Text>

          {overview?.stripeReady ? (
            <View style={styles.urlBox}>
              <Text style={styles.urlLabel}>Success redirect</Text>
              <Text style={styles.urlText}>{overview.successUrl}</Text>
              <Text style={styles.urlLabel}>Cancel redirect</Text>
              <Text style={styles.urlText}>{overview.cancelUrl}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.metricGrid}>
          <MetricCard
            label="Outstanding"
            value={money(overview?.totals.outstandingAmount || 0, currency)}
            detail="Unpaid active reservation bills"
          />

          <MetricCard
            label="Paid"
            value={money(overview?.totals.paidAmount || 0, currency)}
            detail={`${overview?.totals.paidCount || 0} paid record(s)`}
          />

          <MetricCard
            label="Refunded"
            value={money(overview?.totals.refundedAmount || 0, currency)}
            detail={`${overview?.totals.refundedCount || 0} refund record(s)`}
          />

          <MetricCard
            label="Checkouts"
            value={String(overview?.totals.checkoutCreatedCount || 0)}
            detail="Created checkout sessions"
          />
        </View>

        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => {
            const active = activeFilter === item;

            return (
              <Pressable
                onPress={() => setActiveFilter(item)}
                style={[
                  styles.filterButton,
                  active ? styles.filterButtonActive : null,
                ]}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    active ? styles.filterButtonTextActive : null,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />

        <Text style={styles.sectionTitle}>Reservation Bills</Text>

        {filteredReservations.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No bills match this filter.</Text>
          </View>
        ) : (
          filteredReservations.map((bill) => {
            const status = getStatus(bill);
            const isWorking = workingReservationId === bill.reservationId;
            const canCreateCheckout =
              status !== "paid" && status !== "refunded" && status !== "cancelled";
            const canMarkPaid =
              status !== "paid" && status !== "refunded" && status !== "cancelled";
            const canRefund = status === "paid";
            const canSyncStripe =
              bill.billingMode === "stripe" &&
              Boolean(bill.stripeSessionId) &&
              status === "checkout_created";

            return (
              <View key={bill.reservationId} style={styles.billCard}>
                <View style={styles.billTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.billTitle}>
                      Reservation #{bill.reservationId}
                    </Text>
                    <Text style={styles.billSubtitle}>
                      {bill.firstName} {bill.lastName} • Room {bill.roomNumber}
                    </Text>
                    <Text style={styles.billMuted}>
                      {bill.roomType} • {bill.checkInDate} → {bill.checkOutDate}
                    </Text>
                  </View>

                  <StatusBadge status={status} />
                </View>

                <View style={styles.divider} />

                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>Room charge</Text>
                  <Text style={styles.amountValue}>
                    {money(Number(bill.roomTotal || 0), currency)}
                  </Text>
                </View>

                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>
                    Services ({bill.serviceCount || 0})
                  </Text>
                  <Text style={styles.amountValue}>
                    {money(Number(bill.serviceTotal || 0), currency)}
                  </Text>
                </View>

                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>Total Due</Text>
                  <Text style={styles.totalValue}>
                    {money(Number(bill.grandTotal || 0), currency)}
                  </Text>
                </View>

                <Text style={styles.billMuted}>
                  Reservation status: {bill.reservationStatus} • Original mode:{" "}
                  {bill.originalPaymentMode}
                </Text>

                {bill.billingMode ? (
                  <Text style={styles.billMuted}>
                    Billing mode: {bill.billingMode}
                    {bill.billingCreatedAt ? ` • ${bill.billingCreatedAt}` : ""}
                  </Text>
                ) : null}

                {bill.stripeSessionId ? (
                  <Text style={styles.billMuted}>
                    Stripe session: {bill.stripeSessionId}
                  </Text>
                ) : null}

                {bill.stripePaymentStatus || bill.stripeSessionStatus ? (
                  <Text style={styles.billMuted}>
                    Stripe status: {bill.stripePaymentStatus || "unknown"} • Session:{" "}
                    {bill.stripeSessionStatus || "unknown"}
                  </Text>
                ) : null}

                {bill.lastSyncedAt ? (
                  <Text style={styles.billMuted}>Last synced: {bill.lastSyncedAt}</Text>
                ) : null}

                {status === "paid" && bill.paidAt ? (
                  <Text style={[styles.billMuted, { color: COLORS.success }]}>
                    Paid at {bill.paidAt}
                  </Text>
                ) : null}

                {status === "refunded" && bill.refundedAt ? (
                  <Text style={[styles.billMuted, { color: COLORS.primary }]}>
                    Refunded at {bill.refundedAt}
                  </Text>
                ) : null}

                <View style={styles.actionRow}>
                  {canCreateCheckout ? (
                    <Pressable
                      style={[styles.primaryButton, isWorking && styles.disabledButton]}
                      onPress={() => createCheckout(bill.reservationId)}
                      disabled={isWorking}
                    >
                      {isWorking ? (
                        <ActivityIndicator color="#00111A" />
                      ) : (
                        <>
                          <Ionicons
                            name="card-outline"
                            size={18}
                            color="#00111A"
                          />
                          <Text style={styles.primaryButtonText}>
                            Create Checkout
                          </Text>
                        </>
                      )}
                    </Pressable>
                  ) : null}

                  {canSyncStripe ? (
                    <Pressable
                      style={[
                        styles.secondaryButton,
                        isWorking && styles.disabledButton,
                      ]}
                      onPress={() => syncStripeStatus(bill)}
                      disabled={isWorking}
                    >
                      <Ionicons
                        name="sync-outline"
                        size={18}
                        color={COLORS.text}
                      />
                      <Text style={styles.secondaryButtonText}>Sync Stripe</Text>
                    </Pressable>
                  ) : null}

                  {canMarkPaid ? (
                    <Pressable
                      style={[
                        styles.secondaryButton,
                        isWorking && styles.disabledButton,
                      ]}
                      onPress={() => markPaid(bill.reservationId)}
                      disabled={isWorking}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={18}
                        color={COLORS.text}
                      />
                      <Text style={styles.secondaryButtonText}>Mark Paid</Text>
                    </Pressable>
                  ) : null}

                  {canRefund ? (
                    <Pressable
                      style={[
                        styles.secondaryButton,
                        isWorking && styles.disabledButton,
                      ]}
                      onPress={() => refundPayment(bill.reservationId)}
                      disabled={isWorking}
                    >
                      <Ionicons
                        name="return-down-back-outline"
                        size={18}
                        color={COLORS.text}
                      />
                      <Text style={styles.secondaryButtonText}>Refund</Text>
                    </Pressable>
                  ) : null}
                </View>

                {status === "cancelled" ? (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningText}>
                      Billing actions are disabled for cancelled or no-show
                      reservations.
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })
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
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroLabel: {
    color: COLORS.muted,
    fontWeight: "800",
  },
  heroValue: {
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
  heroText: {
    color: COLORS.text,
    marginTop: 12,
    lineHeight: 21,
  },
  urlBox: {
    backgroundColor: COLORS.card2,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  urlLabel: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 12,
    marginTop: 4,
  },
  urlText: {
    color: COLORS.muted,
    marginTop: 4,
    lineHeight: 18,
    fontSize: 12,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  refreshButtonText: {
    color: "#00111A",
    fontSize: 12,
    fontWeight: "900",
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
  filterRow: {
    gap: 10,
    marginBottom: 18,
  },
  filterButton: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    color: COLORS.text,
    fontWeight: "900",
  },
  filterButtonTextActive: {
    color: "#00111A",
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  emptyText: {
    color: COLORS.muted,
  },
  billCard: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  billTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  billTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },
  billSubtitle: {
    color: COLORS.text,
    marginTop: 6,
    fontWeight: "700",
  },
  billMuted: {
    color: COLORS.muted,
    marginTop: 5,
    lineHeight: 18,
  },
  statusBadge: {
    backgroundColor: COLORS.card2,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  amountLabel: {
    color: COLORS.muted,
  },
  amountValue: {
    color: COLORS.text,
    fontWeight: "800",
  },
  totalBox: {
    backgroundColor: COLORS.card2,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    marginTop: 6,
    marginBottom: 10,
  },
  totalLabel: {
    color: COLORS.muted,
    fontWeight: "800",
  },
  totalValue: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: "900",
    marginTop: 5,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  primaryButton: {
    flexGrow: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonText: {
    color: "#00111A",
    fontWeight: "900",
  },
  secondaryButton: {
    flexGrow: 1,
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
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontWeight: "900",
  },
  disabledButton: {
    opacity: 0.6,
  },
  warningBox: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderColor: COLORS.danger,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  warningText: {
    color: COLORS.danger,
    fontWeight: "800",
    lineHeight: 19,
  },
});