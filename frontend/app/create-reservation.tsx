import {
  Stack,
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";
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
import { API } from "../api/api";
import { COLORS } from "../constants/theme";

type Guest = {
  GuestID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  MembershipLevel?: string;
  PreferredRoomType?: string;
};

const paymentModes = [
  "Credit Card",
  "Debit Card",
  "Cash",
  "Bank Transfer",
  "Amex",
];

export default function CreateReservationScreen() {
  const { roomNumber, selectedGuestId } = useLocalSearchParams();

  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestId, setGuestId] = useState(
    selectedGuestId ? String(selectedGuestId) : ""
  );
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [paymentMode, setPaymentMode] = useState("Credit Card");
  const [specialRequest, setSpecialRequest] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadGuests = useCallback(async () => {
    try {
      setLoading(true);

      const res = await API.get("/api/guests");
      setGuests(res.data);

      if (selectedGuestId) {
        setGuestId(String(selectedGuestId));
      }
    } catch (err: any) {
      console.log("GET guests error:", err.response?.data || err.message);
      Alert.alert("Error", "Failed to load guests");
    } finally {
      setLoading(false);
    }
  }, [selectedGuestId]);

  useFocusEffect(
    useCallback(() => {
      loadGuests();
    }, [loadGuests])
  );

  const handleCreateReservation = async () => {
    const parsedGuestId = Number(guestId);
    const parsedRoomNumber = Number(roomNumber);

    if (!parsedGuestId || !parsedRoomNumber || !checkInDate || !checkOutDate) {
      Alert.alert(
        "Missing fields",
        "Guest, room, check-in, and check-out are required."
      );
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkInDate)) {
      Alert.alert("Invalid date", "Check-in date must be in YYYY-MM-DD format.");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkOutDate)) {
      Alert.alert("Invalid date", "Check-out date must be in YYYY-MM-DD format.");
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

      Alert.alert(
        "Success",
        res.data.message || "Reservation created successfully",
        [
          {
            text: "View Reservations",
            onPress: () => router.replace("/reservations" as any),
          },
        ]
      );
    } catch (error: any) {
      console.log(
        "Create reservation error:",
        error.response?.data || error.message
      );

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
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: "900" }}>
          Reserve Room {roomNumber}
        </Text>

        <Text style={{ color: COLORS.muted, marginTop: 6, marginBottom: 16 }}>
          Select an existing guest or create a new guest before reserving.
        </Text>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/create-guest" as any,
              params: { roomNumber: String(roomNumber) },
            })
          }
          style={{
            backgroundColor: COLORS.primary,
            padding: 14,
            borderRadius: 14,
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <Text style={{ color: "#00111A", fontWeight: "900" }}>
            + Create New Guest
          </Text>
        </Pressable>

        <Text style={{ color: COLORS.text, marginBottom: 8, fontWeight: "700" }}>
          Select Guest
        </Text>

        <View style={{ marginBottom: 18 }}>
          {guests.slice(0, 12).map((guest) => {
            const isSelected = guestId === String(guest.GuestID);

            return (
              <Pressable
                key={guest.GuestID}
                onPress={() => setGuestId(String(guest.GuestID))}
                style={{
                  backgroundColor: isSelected ? COLORS.primary : COLORS.card,
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: isSelected ? COLORS.primary : COLORS.border,
                }}
              >
                <Text
                  style={{
                    color: isSelected ? "#00111A" : COLORS.text,
                    fontWeight: "800",
                  }}
                >
                  {guest.GuestID} — {guest.FirstName} {guest.LastName}
                </Text>

                <Text style={{ color: isSelected ? "#003047" : COLORS.muted }}>
                  {guest.Email}
                </Text>

                {!!guest.MembershipLevel && (
                  <Text style={{ color: isSelected ? "#003047" : COLORS.muted }}>
                    {guest.MembershipLevel} • Prefers{" "}
                    {guest.PreferredRoomType || "N/A"}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        <Field
          label="Guest ID"
          value={guestId}
          onChangeText={setGuestId}
          placeholder="Example: 91001"
          keyboardType="numeric"
        />

        <Field
          label="Check-in Date"
          value={checkInDate}
          onChangeText={setCheckInDate}
          placeholder="YYYY-MM-DD"
        />

        <Field
          label="Check-out Date"
          value={checkOutDate}
          onChangeText={setCheckOutDate}
          placeholder="YYYY-MM-DD"
        />

        <Text style={{ color: COLORS.text, marginBottom: 8, fontWeight: "700" }}>
          Payment Mode
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 18,
          }}
        >
          {paymentModes.map((mode) => {
            const isSelected = paymentMode === mode;

            return (
              <Pressable
                key={mode}
                onPress={() => setPaymentMode(mode)}
                style={{
                  backgroundColor: isSelected ? COLORS.primary : COLORS.card,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: isSelected ? COLORS.primary : COLORS.border,
                }}
              >
                <Text
                  style={{
                    color: isSelected ? "#00111A" : COLORS.text,
                    fontWeight: "800",
                  }}
                >
                  {mode}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Field
          label="Special Request"
          value={specialRequest}
          onChangeText={setSpecialRequest}
          placeholder="Optional"
          multiline
        />

        <Pressable
          disabled={submitting}
          onPress={handleCreateReservation}
          style={{
            backgroundColor: submitting ? COLORS.muted : COLORS.primary,
            padding: 16,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <Text style={{ color: "#00111A", fontSize: 16, fontWeight: "900" }}>
              Create Reservation
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = "default",
}: FieldProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: COLORS.text, marginBottom: 6, fontWeight: "700" }}>
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor={COLORS.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        style={{
          backgroundColor: COLORS.card,
          color: COLORS.text,
          padding: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
          minHeight: multiline ? 90 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}