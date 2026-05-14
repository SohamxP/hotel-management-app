import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { Stack } from "expo-router";
import { API } from "../../api/api";
import { COLORS } from "../../constants/theme";

type Report = {
  RoomType: string;
  count: number;
  avgRate: number;
};

export default function ReportsScreen() {
  const [data, setData] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/api/reports/room-type-summary")
      .then((res) => setData(res.data))
      .catch((error) =>
        console.log("REPORT ERROR:", error.response?.data || error.message)
      )
      .finally(() => setLoading(false));
  }, []);

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
          title: "Reports",
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.text,
        }}
      />

      <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 20 }}>
        <Text style={{ color: COLORS.text, fontSize: 30, fontWeight: "900" }}>
          Reports
        </Text>

        <Text style={{ color: COLORS.muted, marginTop: 6, marginBottom: 20 }}>
          Room type summary and pricing insights
        </Text>

        <FlatList
          data={data}
          keyExtractor={(item) => item.RoomType}
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: COLORS.card,
                padding: 18,
                borderRadius: 18,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: COLORS.border,
              }}
            >
              <Text style={{ color: COLORS.text, fontSize: 22, fontWeight: "900" }}>
                {item.RoomType}
              </Text>

              <View style={{ flexDirection: "row", marginTop: 16, gap: 12 }}>
                <MiniStat label="Rooms" value={String(item.count)} />
                <MiniStat label="Avg Rate" value={`$${Number(item.avgRate).toFixed(2)}`} />
              </View>
            </View>
          )}
        />
      </View>
    </>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.card2,
        padding: 14,
        borderRadius: 14,
      }}
    >
      <Text style={{ color: COLORS.muted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: COLORS.primary, fontSize: 20, fontWeight: "900", marginTop: 4 }}>
        {value}
      </Text>
    </View>
  );
}