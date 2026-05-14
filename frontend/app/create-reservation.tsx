import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { API } from "../api/api";
import { COLORS } from "../constants/theme";

type Guest = {
  GuestID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
};

export default function CreateReservationScreen() {
  const { roomNumber } = useLocalSearchParams();

  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestId, setGuestId] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [paymentMode, setPaymentMode] = useState("Credit Card");
  const [specialRequest, setSpecialRequest] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    API.get("/api/guests")
      .then((res) => setGuests(res.data))
      .catch((err) => {
        console.log(err);
        Alert.alert("Error", "Failed to load guests");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreateReservation = async () => {
    const parsedGuestId = Number(guestId);
    const parsedRoomNumber = Number(roomNumber);

    if (!parsedGuestId || !parsedRoomNumber || !checkInDate || !checkOutDate) {
      Alert.alert("Missing fields", "Guest ID, room, check-in, and check-out are required.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await API.post("/api/reservations", {
        guestId: parsedGuestId,
        roomNumber: parsedRoomNumber,
        checkInDate,
        checkOutDate,
        paymentMode,
        specialRequest,
      });

      Alert.alert("Success", res.data.message || "Reservation created successfully");
      router.back();
    } catch (error: any) {
      console.log(error);
      Alert.alert(
        "Reservation failed",
        error.response?.data?.error || "Could not create reservation"
      );
    } finally {
      setSubmitting(false);
    }
  };

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
          title: "Create Reservation",
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.text,
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: 20 }}
      >
        <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: "700", marginBottom: 8 }}>
          Reserve Room {roomNumber}
        </Text>

        <Text style={{ color: COLORS.muted, marginBottom: 20 }}>
          Enter a guest ID from the guest list and reservation dates.
        </Text>

        <Text style={{ color: COLORS.text, marginBottom: 8, fontWeight: "600" }}>
          Available Guests
        </Text>

        <View style={{ marginBottom: 20 }}>
          {guests.slice(0, 8).map((guest) => (
            <Pressable
              key={guest.GuestID}
              onPress={() => setGuestId(String(guest.GuestID))}
              style={{
                backgroundColor:
                  guestId === String(guest.GuestID) ? COLORS.primary : COLORS.card,
                padding: 12,
                borderRadius: 10,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: COLORS.text, fontWeight: "600" }}>
                {guest.GuestID} — {guest.FirstName} {guest.LastName}
              </Text>
              <Text style={{ color: COLORS.muted }}>{guest.Email}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ color: COLORS.text, marginBottom: 6 }}>Guest ID</Text>
        <TextInput
          value={guestId}
          onChangeText={setGuestId}
          placeholder="Example: 91001"
          placeholderTextColor={COLORS.muted}
          keyboardType="numeric"
          style={{
            backgroundColor: COLORS.card,
            color: COLORS.text,
            padding: 12,
            borderRadius: 10,
            marginBottom: 16,
          }}
        />

        <Text style={{ color: COLORS.text, marginBottom: 6 }}>Check-in Date</Text>
        <TextInput
          value={checkInDate}
          onChangeText={setCheckInDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={COLORS.muted}
          style={{
            backgroundColor: COLORS.card,
            color: COLORS.text,
            padding: 12,
            borderRadius: 10,
            marginBottom: 16,
          }}
        />

        <Text style={{ color: COLORS.text, marginBottom: 6 }}>Check-out Date</Text>
        <TextInput
          value={checkOutDate}
          onChangeText={setCheckOutDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={COLORS.muted}
          style={{
            backgroundColor: COLORS.card,
            color: COLORS.text,
            padding: 12,
            borderRadius: 10,
            marginBottom: 16,
          }}
        />

        <Text style={{ color: COLORS.text, marginBottom: 6 }}>Payment Mode</Text>
        <TextInput
          value={paymentMode}
          onChangeText={setPaymentMode}
          placeholder="Credit Card"
          placeholderTextColor={COLORS.muted}
          style={{
            backgroundColor: COLORS.card,
            color: COLORS.text,
            padding: 12,
            borderRadius: 10,
            marginBottom: 16,
          }}
        />

        <Text style={{ color: COLORS.text, marginBottom: 6 }}>Special Request</Text>
        <TextInput
          value={specialRequest}
          onChangeText={setSpecialRequest}
          placeholder="Optional"
          placeholderTextColor={COLORS.muted}
          multiline
          style={{
            backgroundColor: COLORS.card,
            color: COLORS.text,
            padding: 12,
            borderRadius: 10,
            minHeight: 90,
            marginBottom: 24,
          }}
        />

        <Pressable
          disabled={submitting}
          onPress={handleCreateReservation}
          style={{
            backgroundColor: submitting ? COLORS.muted : COLORS.primary,
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "700" }}>
            {submitting ? "Creating..." : "Create Reservation"}
          </Text>
        </Pressable>
      </ScrollView>
    </>
  );
}