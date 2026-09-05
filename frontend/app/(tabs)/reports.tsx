import {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
} from "react-native";

import {
  Redirect,
  Stack,
} from "expo-router";

import { API } from "../../api/api";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../context/AuthContext";

type Report = {
  RoomType: string;
  count: number;
  avgRate: number;
};

export default function ReportsScreen() {
  const { user } = useAuth();

  const [data, setData] =
    useState<Report[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "Manager") {
      return;
    }

    setLoading(true);
    setError(null);

    API.get(
      "/api/reports/room-type-summary"
    )
      .then((res) => {
        setData(res.data);
      })
      .catch((error) => {
        console.log(
          "REPORT ERROR:",
          error.response?.data ||
            error.message
        );

        setError(
          error.response?.data?.error ||
            "Could not load report data."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user?.role]);

  if (user?.role !== "Manager") {
    return (
      <Redirect href="/rooms" />
    );
  }

  if (loading) {
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
          Loading reports...
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
          }}
        >
          Report unavailable
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
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Reports",
          headerStyle: {
            backgroundColor:
              COLORS.bg,
          },
          headerTintColor:
            COLORS.text,
        }}
      />

      <View
        style={{
          flex: 1,
          backgroundColor:
            COLORS.bg,
          padding: 20,
        }}
      >
        <Text
          style={{
            color: COLORS.text,
            fontSize: 30,
            fontWeight: "900",
          }}
        >
          Reports
        </Text>

        <Text
          style={{
            color: COLORS.muted,
            marginTop: 6,
            marginBottom: 20,
          }}
        >
          Room type summary and pricing insights
        </Text>

        <FlatList
          data={data}
          keyExtractor={(item) =>
            item.RoomType
          }
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
                No report data available
              </Text>

              <Text
                style={{
                  color: COLORS.muted,
                  marginTop: 6,
                  textAlign: "center",
                }}
              >
                There is currently no room summary data to display.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor:
                  COLORS.card,
                padding: 18,
                borderRadius: 18,
                marginBottom: 14,
                borderWidth: 1,
                borderColor:
                  COLORS.border,
              }}
            >
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 22,
                  fontWeight: "900",
                }}
              >
                {item.RoomType}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  marginTop: 16,
                  gap: 12,
                }}
              >
                <MiniStat
                  label="Rooms"
                  value={String(
                    item.count
                  )}
                />

                <MiniStat
                  label="Avg Rate"
                  value={`$${Number(
                    item.avgRate
                  ).toFixed(2)}`}
                />
              </View>
            </View>
          )}
        />
      </View>
    </>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor:
          COLORS.card2,
        padding: 14,
        borderRadius: 14,
      }}
    >
      <Text
        style={{
          color: COLORS.muted,
          fontSize: 13,
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          color: COLORS.primary,
          fontSize: 20,
          fontWeight: "900",
          marginTop: 4,
        }}
      >
        {value}
      </Text>
    </View>
  );
}