import {
  Redirect,
  router,
  useFocusEffect,
} from "expo-router";

import {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import { API } from "../../api/api";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

type Room = {
  RoomNumber: number;
  RoomType: string;
  RatePerNight: number;
  AvailStatus: string;
  MaxOccupancy: number;
  HasWifi: string;
  HasTv: string;
};

export default function Dashboard() {
  const { token, user, logout } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRooms = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await API.get("/api/rooms");
      setRooms(res.data);
    } catch (error: any) {
      console.log(
        "ROOM API ERROR:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.error ||
          "Could not load rooms."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadRooms();
    }, [loadRooms])
  );

  if (!token) {
    return <Redirect href="/login" />;
  }

  if (loading && rooms.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text
          style={{
            color: COLORS.muted,
            marginTop: 12,
          }}
        >
          Loading rooms...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text
          style={{
            color: COLORS.text,
            fontSize: 20,
            fontWeight: "800",
            textAlign: "center",
          }}
        >
          Could not load rooms
        </Text>

        <Text
          style={{
            color: COLORS.muted,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          {error}
        </Text>

        <Pressable
          onPress={loadRooms}
          style={{
            backgroundColor: COLORS.primary,
            paddingVertical: 12,
            paddingHorizontal: 22,
            borderRadius: 12,
            marginTop: 18,
          }}
        >
          <Text
            style={{
              color: "#00111A",
              fontWeight: "800",
            }}
          >
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  const available = rooms.filter(
    (room) => room.AvailStatus === "Available"
  ).length;

  const reserved = rooms.filter(
    (room) => room.AvailStatus === "Reserved"
  ).length;

  const occupied = rooms.filter(
    (room) => room.AvailStatus === "Occupied"
  ).length;

  const blocked = rooms.filter(
    (room) => room.AvailStatus === "Blocked"
  ).length;

  const filteredRooms = rooms.filter((room) => {
    const matchesFilter =
      filter === "All" ||
      room.AvailStatus === filter;

    const matchesSearch =
      room.RoomNumber.toString().includes(search) ||
      room.RoomType.toLowerCase().includes(
        search.toLowerCase()
      );

    return matchesFilter && matchesSearch;
  });

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.bg,
        padding: 20,
      }}
    >
      <Text
        style={{
          color: COLORS.text,
          fontSize: 30,
          fontWeight: "800",
        }}
      >
        Hotel Dashboard
      </Text>

      <Text
        style={{
          color: COLORS.muted,
          marginTop: 6,
        }}
      >
        Room availability and operations overview
      </Text>

      {user && (
        <Text
          style={{
            color: COLORS.primary,
            marginTop: 8,
            fontWeight: "700",
          }}
        >
          {user.firstName} {user.lastName} • {user.role}
        </Text>
      )}

      <Pressable
        onPress={async () => {
          await logout();
          router.replace("/login" as any);
        }}
        style={{
          backgroundColor: COLORS.danger,
          padding: 12,
          borderRadius: 14,
          marginTop: 16,
        }}
      >
        <Text
          style={{
            color: COLORS.text,
            textAlign: "center",
            fontWeight: "800",
          }}
        >
          Logout
        </Text>
      </Pressable>

      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginTop: 20,
        }}
      >
        <StatCard
          title="Total"
          value={rooms.length}
        />

        <StatCard
          title="Available"
          value={available}
          color={COLORS.success}
        />

        <StatCard
          title="Reserved"
          value={reserved}
          color={COLORS.warning}
        />

        <StatCard
          title="Occupied"
          value={occupied}
          color={COLORS.primary}
        />

        <StatCard
          title="Blocked"
          value={blocked}
          color={COLORS.danger}
        />
      </View>

      {user?.role === "Manager" && (
        <Pressable
          onPress={() =>
            router.push("/reports")
          }
          style={{
            backgroundColor: COLORS.primary,
            padding: 14,
            borderRadius: 14,
            marginTop: 18,
          }}
        >
          <Text
            style={{
              color: "#00111A",
              textAlign: "center",
              fontWeight: "800",
            }}
          >
            View Reports
          </Text>
        </Pressable>
      )}

      <TextInput
        placeholder="🔍 Search by room number or type..."
        placeholderTextColor={COLORS.muted}
        value={search}
        onChangeText={setSearch}
        style={{
          backgroundColor: COLORS.card,
          color: COLORS.text,
          padding: 14,
          borderRadius: 14,
          marginTop: 14,
          marginBottom: 6,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      />

      <View
        style={{
          flexDirection: "row",
          gap: 8,
          marginVertical: 20,
        }}
      >
        {[
          "All",
          "Available",
          "Reserved",
          "Occupied",
          "Blocked",
        ].map((item) => (
          <Pressable
            key={item}
            onPress={() => setFilter(item)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 13,
              borderRadius: 20,
              backgroundColor:
                filter === item
                  ? COLORS.primary
                  : COLORS.card,
            }}
          >
            <Text
              style={{
                color:
                  filter === item
                    ? "#00111A"
                    : COLORS.text,
                fontWeight: "700",
              }}
            >
              {item}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredRooms}
        keyExtractor={(item) =>
          item.RoomNumber.toString()
        }
        refreshing={loading}
        onRefresh={loadRooms}
        ListEmptyComponent={
          <View
            style={{
              alignItems: "center",
              paddingVertical: 40,
            }}
          >
            <Text
              style={{
                color: COLORS.text,
                fontWeight: "800",
                fontSize: 18,
              }}
            >
              No rooms found
            </Text>

            <Text
              style={{
                color: COLORS.muted,
                marginTop: 6,
                textAlign: "center",
              }}
            >
              Try changing your search or availability filter.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname:
                  "/room-details",
                params: {
                  room: JSON.stringify(item),
                },
              })
            }
            style={{
              backgroundColor: COLORS.card,
              padding: 18,
              borderRadius: 18,
              marginBottom: 14,
              borderWidth: 1,
              borderColor: COLORS.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent:
                  "space-between",
              }}
            >
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 20,
                  fontWeight: "800",
                }}
              >
                Room {item.RoomNumber}
              </Text>

              <Text
                style={{
                  color: COLORS.primary,
                  fontWeight: "800",
                }}
              >
                {item.AvailStatus}
              </Text>
            </View>

            <Text
              style={{
                color: COLORS.muted,
                marginTop: 8,
              }}
            >
              {item.RoomType} • $
              {item.RatePerNight}/night
            </Text>

            <Text
              style={{
                color: COLORS.muted,
                marginTop: 4,
              }}
            >
              Max {item.MaxOccupancy} guests • WiFi{" "}
              {item.HasWifi} • TV {item.HasTv}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function StatCard({
  title,
  value,
  color = COLORS.primary,
}: {
  title: string;
  value: number;
  color?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.card,
        padding: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
      }}
    >
      <Text
        style={{
          color: COLORS.muted,
          fontSize: 12,
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          color,
          fontSize: 24,
          fontWeight: "900",
          marginTop: 6,
        }}
      >
        {value}
      </Text>
    </View>
  );
}