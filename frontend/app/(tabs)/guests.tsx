import { Stack, router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { API } from "../../api/api";
import { COLORS } from "../../constants/theme";

type Guest = {
  GuestID: number;
  FirstName: string;
  LastName: string;
  DateOfBirth: string;
  PhoneNumber: string;
  Email: string;
  MembershipLevel?: string;
  PreferredRoomType?: string;
  PurposeOfVisit?: string;
  CardType?: string;
  CardLastFour?: string | null;
  BillingAddress?: string | null;
  ReservationCount?: number;
  TotalSpent?: number;
};

export default function GuestsScreen() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [search, setSearch] = useState("");
  const [membershipFilter, setMembershipFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const loadGuests = async () => {
    try {
      setLoading(true);
      const res = await API.get("/api/guests");
      setGuests(res.data);
    } catch (error: any) {
      console.log("GET guests error:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to load guests");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadGuests();
    }, [])
  );

  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const fullName = `${guest.FirstName} ${guest.LastName}`.toLowerCase();

      const matchesSearch =
        fullName.includes(search.toLowerCase()) ||
        String(guest.GuestID).includes(search) ||
        guest.Email.toLowerCase().includes(search.toLowerCase()) ||
        guest.PhoneNumber.includes(search);

      const matchesMembership =
        membershipFilter === "All" ||
        guest.MembershipLevel === membershipFilter;

      return matchesSearch && matchesMembership;
    });
  }, [guests, search, membershipFilter]);

  const totalGuests = guests.length;

  const totalReservations = guests.reduce(
    (sum, guest) => sum + Number(guest.ReservationCount || 0),
    0
  );

  const totalSpending = guests.reduce(
    (sum, guest) => sum + Number(guest.TotalSpent || 0),
    0
  );

  const goldOrAbove = guests.filter(
    (guest) =>
      guest.MembershipLevel === "Gold" || guest.MembershipLevel === "Platinum"
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

  return (
    <>
      <Stack.Screen
        options={{
          title: "Guests",
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.text,
        }}
      />

      <View style={{ flex: 1, backgroundColor: COLORS.bg, padding: 20 }}>
        <Text style={{ color: COLORS.text, fontSize: 30, fontWeight: "900" }}>
          Guests
        </Text>

        <Text style={{ color: COLORS.muted, marginTop: 6 }}>
          Guest profiles, memberships, payment info, and reservation history
        </Text>

        <Pressable
          onPress={() => router.push("/create-guest" as any)}
          style={{
            backgroundColor: COLORS.primary,
            padding: 14,
            borderRadius: 14,
            marginTop: 18,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#00111A", fontWeight: "900" }}>
            + Create New Guest
          </Text>
        </Pressable>

        <View style={{ flexDirection: "row", gap: 8, marginTop: 18 }}>
          <StatCard title="Guests" value={totalGuests} />
          <StatCard title="Reservations" value={totalReservations} />
          <StatCard title="VIP" value={goldOrAbove} />
        </View>

        <View style={{ marginTop: 10 }}>
          <StatCard
            title="Total Guest Spending"
            value={`$${Number(totalSpending).toFixed(2)}`}
            wide
          />
        </View>

        <TextInput
          placeholder="🔍 Search by name, guest ID, email, or phone..."
          placeholderTextColor={COLORS.muted}
          value={search}
          onChangeText={setSearch}
          style={{
            backgroundColor: COLORS.card,
            color: COLORS.text,
            padding: 14,
            borderRadius: 14,
            marginTop: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: COLORS.border,
          }}
        />

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {["All", "Bronze", "Silver", "Gold", "Platinum"].map((level) => {
            const isSelected = membershipFilter === level;

            return (
              <Pressable
                key={level}
                onPress={() => setMembershipFilter(level)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 13,
                  borderRadius: 20,
                  backgroundColor: isSelected ? COLORS.primary : COLORS.card,
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
                  {level}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <FlatList
          data={filteredGuests}
          keyExtractor={(item) => String(item.GuestID)}
          refreshing={loading}
          onRefresh={loadGuests}
          ListEmptyComponent={
            <Text style={{ color: COLORS.muted }}>No guests found.</Text>
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
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: COLORS.text,
                      fontSize: 20,
                      fontWeight: "900",
                    }}
                  >
                    {item.FirstName} {item.LastName}
                  </Text>

                  <Text style={{ color: COLORS.muted, marginTop: 4 }}>
                    Guest ID: {item.GuestID}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: COLORS.card2,
                    paddingVertical: 8,
                    paddingHorizontal: 10,
                    borderRadius: 12,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={{ color: COLORS.primary, fontWeight: "900" }}>
                    {item.MembershipLevel || "N/A"}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 14 }}>
                <Info label="Email" value={item.Email} />
                <Info label="Phone" value={item.PhoneNumber} />
                <Info
                  label="Preferred Room"
                  value={item.PreferredRoomType || "N/A"}
                />
                <Info
                  label="Purpose"
                  value={item.PurposeOfVisit || "N/A"}
                />
                <Info
                  label="Payment"
                  value={
                    item.CardLastFour
                      ? `${item.CardType} ending ${item.CardLastFour}`
                      : item.CardType || "N/A"
                  }
                />
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                <MiniStat
                  label="Reservations"
                  value={String(item.ReservationCount || 0)}
                />

                <MiniStat
                  label="Total Spent"
                  value={`$${Number(item.TotalSpent || 0).toFixed(2)}`}
                />
              </View>
            </View>
          )}
        />
      </View>
    </>
  );
}

function StatCard({
  title,
  value,
  wide = false,
}: {
  title: string;
  value: number | string;
  wide?: boolean;
}) {
  return (
    <View
      style={{
        flex: wide ? undefined : 1,
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
          fontSize: wide ? 22 : 24,
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
          fontSize: 18,
          fontWeight: "900",
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ color: COLORS.muted, fontSize: 12 }}>{label}</Text>

      <Text style={{ color: COLORS.text, fontSize: 15, fontWeight: "700" }}>
        {value}
      </Text>
    </View>
  );
}