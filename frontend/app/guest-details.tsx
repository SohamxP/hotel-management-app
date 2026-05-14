import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  View,
} from "react-native";
import { API } from "../api/api";
import { COLORS } from "../constants/theme";

type Guest = {
  GuestID: number;
  FirstName: string;
  LastName: string;
  DateOfBirth: string;
  PhoneNumber: string;
  Email: string;
  MembershipID?: number;
  MembershipLevel?: string;
  PreferredRoomType?: string;
  PurposeOfVisit?: string;
  PaymentID?: number;
  CardType?: string;
  CardLastFour?: string | null;
  BillingAddress?: string | null;
};

type Reservation = {
  ReservationID: number;
  GuestID: number;
  RoomNumber: number;
  RoomType: string;
  RatePerNight: number;
  CheckInDate: string;
  CheckInTime: string;
  CheckOutDate: string;
  TotalPrice: number;
  ReservStatus: string;
  SpecialRequest?: string | null;
  PaymentMode: string;
  ServiceCount: number;
  ServiceTotal: number;
};

export default function GuestDetailsScreen() {
  const { guestId } = useLocalSearchParams();

  const [guest, setGuest] = useState<Guest | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGuestDetails = async () => {
    try {
      setLoading(true);

      const [guestRes, reservationsRes] = await Promise.all([
        API.get(`/api/guests/${guestId}`),
        API.get(`/api/guests/${guestId}/reservations`),
      ]);

      setGuest(guestRes.data);
      setReservations(reservationsRes.data);
    } catch (error: any) {
      console.log(
        "GET guest details error:",
        error.response?.data || error.message
      );

      Alert.alert("Error", "Failed to load guest details");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadGuestDetails();
    }, [guestId])
  );

  const totalSpent = reservations.reduce(
    (sum, reservation) => sum + Number(reservation.TotalPrice || 0),
    0
  );

  const totalServices = reservations.reduce(
    (sum, reservation) => sum + Number(reservation.ServiceTotal || 0),
    0
  );

  const completedReservations = reservations.filter(
    (reservation) => reservation.ReservStatus === "Completed"
  ).length;

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

  if (!guest) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 20 }}>
        <Text style={{ color: COLORS.text }}>Guest not found.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `${guest.FirstName} ${guest.LastName}`,
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.text,
        }}
      />

      <FlatList
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        data={reservations}
        keyExtractor={(item) => String(item.ReservationID)}
        ListHeaderComponent={
          <View>
            <View
              style={{
                backgroundColor: COLORS.card,
                padding: 18,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: COLORS.border,
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 28,
                  fontWeight: "900",
                }}
              >
                {guest.FirstName} {guest.LastName}
              </Text>

              <Text style={{ color: COLORS.muted, marginTop: 4 }}>
                Guest ID: {guest.GuestID}
              </Text>

              <View style={{ marginTop: 16 }}>
                <Info label="Email" value={guest.Email} />
                <Info label="Phone" value={guest.PhoneNumber} />
                <Info label="Date of Birth" value={guest.DateOfBirth} />
                <Info
                  label="Membership"
                  value={guest.MembershipLevel || "N/A"}
                />
                <Info
                  label="Preferred Room"
                  value={guest.PreferredRoomType || "N/A"}
                />
                <Info
                  label="Purpose of Visit"
                  value={guest.PurposeOfVisit || "N/A"}
                />
                <Info
                  label="Payment"
                  value={
                    guest.CardLastFour
                      ? `${guest.CardType} ending ${guest.CardLastFour}`
                      : guest.CardType || "N/A"
                  }
                />
                <Info
                  label="Billing Address"
                  value={guest.BillingAddress || "N/A"}
                />
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              <StatCard title="Reservations" value={reservations.length} />
              <StatCard title="Completed" value={completedReservations} />
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 24 }}>
              <StatCard
                title="Room Revenue"
                value={`$${totalSpent.toFixed(2)}`}
              />
              <StatCard
                title="Service Revenue"
                value={`$${totalServices.toFixed(2)}`}
              />
            </View>

            <Text
              style={{
                color: COLORS.text,
                fontSize: 22,
                fontWeight: "900",
                marginBottom: 12,
              }}
            >
              Reservation History
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={{ color: COLORS.muted }}>
            This guest has no reservations yet.
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: COLORS.card,
              padding: 16,
              borderRadius: 16,
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
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: COLORS.text,
                    fontSize: 19,
                    fontWeight: "900",
                  }}
                >
                  Reservation #{item.ReservationID}
                </Text>

                <Text style={{ color: COLORS.muted, marginTop: 4 }}>
                  Room {item.RoomNumber} • {item.RoomType}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: getStatusBg(item.ReservStatus),
                  paddingVertical: 7,
                  paddingHorizontal: 10,
                  borderRadius: 12,
                  alignSelf: "flex-start",
                }}
              >
                <Text style={{ color: COLORS.text, fontWeight: "900" }}>
                  {item.ReservStatus}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 14 }}>
              <Info label="Check-in" value={`${item.CheckInDate} ${item.CheckInTime}`} />
              <Info label="Check-out" value={item.CheckOutDate} />
              <Info label="Payment Mode" value={item.PaymentMode} />
              <Info
                label="Special Request"
                value={item.SpecialRequest || "None"}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <MiniStat
                label="Room Total"
                value={`$${Number(item.TotalPrice).toFixed(2)}`}
              />
              <MiniStat
                label="Services"
                value={`${item.ServiceCount} • $${Number(
                  item.ServiceTotal
                ).toFixed(2)}`}
              />
            </View>
          </View>
        )}
      />
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 9 }}>
      <Text style={{ color: COLORS.muted, fontSize: 12 }}>{label}</Text>

      <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: "700" }}>
        {value}
      </Text>
    </View>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.card,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <Text style={{ color: COLORS.muted, fontSize: 12 }}>{title}</Text>

      <Text
        style={{
          color: COLORS.primary,
          fontSize: 20,
          fontWeight: "900",
          marginTop: 6,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.card2,
        padding: 12,
        borderRadius: 14,
      }}
    >
      <Text style={{ color: COLORS.muted, fontSize: 12 }}>{label}</Text>

      <Text
        style={{
          color: COLORS.primary,
          fontSize: 16,
          fontWeight: "900",
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function getStatusBg(status: string) {
  if (status === "Confirmed") return "#164E63";
  if (status === "Completed") return "#14532D";
  if (status === "Cancelled") return "#7F1D1D";
  if (status === "Pending") return "#713F12";
  return COLORS.card2;
}