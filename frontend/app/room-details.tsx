import { useLocalSearchParams, router } from "expo-router";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { API } from "../api/api";
import { COLORS } from "../constants/theme";

const DEMO_GUEST_ID = 91001;
const DEFAULT_PAYMENT_MODE = "Credit Card";
const today = new Date();
const checkOut = new Date();
checkOut.setDate(today.getDate() + 2);
type Room = {
  RoomNumber: number;
  RoomType: string;
  RatePerNight: number;
  AvailStatus: string;
  MaxOccupancy: number;
  HasBalcony?: string;
  IsSmoking?: string;
  BedCount?: number;
  BuildingNumber?: number;
  HasWifi?: string;
  HasTv?: string;
};

export default function RoomDetails() {
  const { room } = useLocalSearchParams();

  if (!room) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 20 }}>
        <Text style={{ color: COLORS.text }}>No room data found.</Text>
      </View>
    );
  }

  const roomData: Room = JSON.parse(room as string);
  const isAvailable = roomData.AvailStatus === "Available";

  const reserveRoom = async () => {
    try {
      const res = await API.post("/api/reservations", {
  guestId: DEMO_GUEST_ID,
  roomNumber: roomData.RoomNumber,
  checkInDate: today.toISOString().split("T")[0],
  checkOutDate: checkOut.toISOString().split("T")[0],
  paymentMode: DEFAULT_PAYMENT_MODE,
  specialRequest: "Mobile app reservation",
});

      if (res.data.success) {
        Alert.alert("Success", "Reservation created successfully", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error: any) {
      console.log("RESERVE ERROR:", error.response?.data || error.message);

      Alert.alert(
        "Reservation Failed",
        error.response?.data?.error || "Could not reserve room"
      );
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg, padding: 20 }}>
      <Text style={{ color: COLORS.text, fontSize: 32, fontWeight: "900" }}>
        Room {roomData.RoomNumber}
      </Text>

      <Text style={{ color: COLORS.primary, fontSize: 18, marginTop: 8 }}>
        {roomData.AvailStatus}
      </Text>

      <View
        style={{
          backgroundColor: COLORS.card,
          padding: 18,
          borderRadius: 18,
          marginTop: 24,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <Info label="Room Type" value={roomData.RoomType} />
        <Info label="Rate Per Night" value={`$${roomData.RatePerNight}`} />
        <Info label="Max Occupancy" value={roomData.MaxOccupancy} />
        <Info label="Bed Count" value={roomData.BedCount ?? "N/A"} />
        <Info label="Building" value={roomData.BuildingNumber ?? "N/A"} />
        <Info label="Balcony" value={roomData.HasBalcony ?? "N/A"} />
        <Info label="Smoking" value={roomData.IsSmoking ?? "N/A"} />
        <Info label="WiFi" value={roomData.HasWifi ?? "N/A"} />
        <Info label="TV" value={roomData.HasTv ?? "N/A"} />
      </View>

      <Pressable
        onPress={reserveRoom}
        disabled={!isAvailable}
        style={{
          backgroundColor: isAvailable ? COLORS.primary : COLORS.border,
          padding: 16,
          borderRadius: 16,
          marginTop: 24,
          opacity: isAvailable ? 1 : 0.6,
        }}
      >
        <Text
          style={{
            color: isAvailable ? "#00111A" : COLORS.muted,
            textAlign: "center",
            fontWeight: "900",
            fontSize: 16,
          }}
        >
          {isAvailable ? "Reserve Room" : "Room Not Available"}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.back()}
        style={{
          backgroundColor: COLORS.card,
          padding: 16,
          borderRadius: 16,
          marginTop: 12,
          marginBottom: 40,
        }}
      >
        <Text style={{ color: COLORS.text, textAlign: "center", fontWeight: "800" }}>
          Go Back
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: COLORS.muted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: COLORS.text, fontSize: 17, fontWeight: "700" }}>
        {value}
      </Text>
    </View>
  );
}