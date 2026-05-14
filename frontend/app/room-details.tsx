import { useLocalSearchParams, router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { COLORS } from "../constants/theme";


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
  onPress={() =>
    router.push({
      pathname: "/create-reservation" as any,
      params: {
        roomNumber: roomData.RoomNumber,
      },
    })
  }
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