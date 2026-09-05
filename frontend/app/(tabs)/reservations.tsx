import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { API } from "../../api/api";
import { COLORS } from "../../constants/theme";

type Reservation = {
  ReservationID: number;
  GuestID: number;
  RoomNumber: number;
  CheckInDate: string;
  CheckOutDate: string;
  TotalPrice: number;
  ReservStatus: string;
  FirstName: string;
  LastName: string;
  RoomType: string;
  RatePerNight: number;
};

export default function ReservationsScreen() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReservations = useCallback(async () => {
  try {
    setLoading(true);
    const res = await API.get("/api/reservations");
    setReservations(res.data);
  } catch (error: any) {
    console.log("GET reservations error:", error.response?.data || error.message);
    Alert.alert("Error", "Failed to load reservations");
  } finally {
    setLoading(false);
  }
}, []);

  const cancelReservation = async (reservationId: number) => {
    try {
      await API.patch(`/api/reservations/${reservationId}/cancel`);
      Alert.alert("Success", "Reservation cancelled");
      loadReservations();
    } catch (error: any) {
      console.log("Cancel error:", error.response?.data || error.message);
      Alert.alert(
        "Cancel failed",
        error.response?.data?.error || "Could not cancel reservation"
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReservations();
    }, [loadReservations])
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: "center" }}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Reservations",
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.text,
        }}
      />

      <FlatList
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: 20 }}
        data={reservations}
        keyExtractor={(item) => String(item.ReservationID)}
        ListEmptyComponent={
          <Text style={{ color: COLORS.muted }}>No reservations found.</Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: COLORS.card,
              padding: 16,
              borderRadius: 16,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "800" }}>
              #{item.ReservationID} — {item.FirstName} {item.LastName}
            </Text>

            <Text style={{ color: COLORS.muted, marginTop: 6 }}>
              Room {item.RoomNumber} • {item.RoomType}
            </Text>

            <Text style={{ color: COLORS.muted, marginTop: 4 }}>
              {item.CheckInDate} → {item.CheckOutDate}
            </Text>

            <Text style={{ color: COLORS.primary, marginTop: 8, fontWeight: "800" }}>
              ${item.TotalPrice} • {item.ReservStatus}
            </Text>

            {item.ReservStatus !== "Cancelled" && (
              <Pressable
                onPress={() => cancelReservation(item.ReservationID)}
                style={{
                  backgroundColor: COLORS.border,
                  padding: 12,
                  borderRadius: 12,
                  marginTop: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: COLORS.text, fontWeight: "800" }}>
                  Cancel Reservation
                </Text>
              </Pressable>
            )}
          </View>
        )}
      />
    </>
  );
}