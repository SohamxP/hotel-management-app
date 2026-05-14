import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { API } from "../../api/api";
import { COLORS } from "../../constants/theme";

type HotelService = {
  ServiceID: number;
  ReservationID: number;
  ServiceType: string;
  RequestTime: string;
  RequestStatus: string;
  ServicePrice: number;
  EmployeeID?: number | null;

  RoomNumber: number;
  RoomType: string;
  CheckInDate: string;
  CheckOutDate: string;
  ReservStatus: string;

  GuestID: number;
  GuestFirstName: string;
  GuestLastName: string;

  EmployeeFirstName?: string | null;
  EmployeeLastName?: string | null;
  EmployeePosition?: string | null;

  ItemDescription?: string | null;

  SpaServiceType?: string | null;
  DurationMinutes?: number | null;

  PickupTime?: string | null;
  DropoffTime?: string | null;
  ArrivalDestination?: string | null;
  DepartureDestination?: string | null;
  NumberOfPeople?: number | null;
};

type Reservation = {
  ReservationID: number;
  RoomNumber: number;
  RoomType: string;
  FirstName: string;
  LastName: string;
  ReservStatus: string;
};

const serviceTypes = ["Room Service", "Spa", "Shuttle"];
const statuses = ["Pending", "In Progress", "Completed", "Cancelled"];

export default function ServicesScreen() {
  const [services, setServices] = useState<HotelService[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [reservationId, setReservationId] = useState("");
  const [serviceType, setServiceType] = useState("Room Service");
  const [servicePrice, setServicePrice] = useState("45");
  const [employeeId, setEmployeeId] = useState("");

  const [itemDescription, setItemDescription] = useState("");

  const [spaServiceType, setSpaServiceType] = useState("Swedish Massage");
  const [durationMinutes, setDurationMinutes] = useState("60");

  const [pickupTime, setPickupTime] = useState("2026-06-01 09:00:00");
  const [dropoffTime, setDropoffTime] = useState("");
  const [arrivalDestination, setArrivalDestination] = useState("Hotel");
  const [departureDestination, setDepartureDestination] = useState("DFW Airport");
  const [numberOfPeople, setNumberOfPeople] = useState("1");

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const [servicesRes, reservationsRes] = await Promise.all([
        API.get("/api/services"),
        API.get("/api/reservations"),
      ]);

      setServices(servicesRes.data);
      setReservations(reservationsRes.data);
    } catch (error: any) {
      console.log("GET services error:", error.response?.data || error.message);
      Alert.alert("Error", "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesType =
        typeFilter === "All" || service.ServiceType === typeFilter;

      const matchesStatus =
        statusFilter === "All" || service.RequestStatus === statusFilter;

      return matchesType && matchesStatus;
    });
  }, [services, typeFilter, statusFilter]);

  const totalRevenue = services.reduce(
    (sum, service) => sum + Number(service.ServicePrice || 0),
    0
  );

  const pendingCount = services.filter(
    (service) => service.RequestStatus === "Pending"
  ).length;

  const inProgressCount = services.filter(
    (service) => service.RequestStatus === "In Progress"
  ).length;

  const completedCount = services.filter(
    (service) => service.RequestStatus === "Completed"
  ).length;

  const createService = async () => {
    const parsedReservationId = Number(reservationId);
    const parsedPrice = Number(servicePrice);
    const parsedEmployeeId = employeeId ? Number(employeeId) : null;

    if (!parsedReservationId || Number.isNaN(parsedPrice)) {
      Alert.alert("Missing fields", "Reservation ID and service price are required.");
      return;
    }

    try {
      setSubmitting(true);

      const body: any = {
        reservationId: parsedReservationId,
        serviceType,
        servicePrice: parsedPrice,
        employeeId: parsedEmployeeId,
      };

      if (serviceType === "Room Service") {
        body.itemDescription = itemDescription || "Room service request";
      }

      if (serviceType === "Spa") {
        body.spaServiceType = spaServiceType;
        body.durationMinutes = Number(durationMinutes);
      }

      if (serviceType === "Shuttle") {
        body.pickupTime = pickupTime;
        body.dropoffTime = dropoffTime || null;
        body.arrivalDestination = arrivalDestination;
        body.departureDestination = departureDestination;
        body.numberOfPeople = Number(numberOfPeople);
      }

      const res = await API.post("/api/services", body);

      Alert.alert("Success", res.data.message || "Service created");

      resetForm();
      setShowCreateForm(false);
      loadData();
    } catch (error: any) {
      console.log("Create service error:", error.response?.data || error.message);

      Alert.alert(
        "Create service failed",
        error.response?.data?.error || "Could not create service"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (serviceId: number, requestStatus: string) => {
    try {
      await API.patch(`/api/services/${serviceId}/status`, {
        requestStatus,
      });

      loadData();
    } catch (error: any) {
      console.log(
        "Update service status error:",
        error.response?.data || error.message
      );

      Alert.alert(
        "Update failed",
        error.response?.data?.error || "Could not update service status"
      );
    }
  };

  const resetForm = () => {
    setReservationId("");
    setServiceType("Room Service");
    setServicePrice("45");
    setEmployeeId("");
    setItemDescription("");
    setSpaServiceType("Swedish Massage");
    setDurationMinutes("60");
    setPickupTime("2026-06-01 09:00:00");
    setDropoffTime("");
    setArrivalDestination("Hotel");
    setDepartureDestination("DFW Airport");
    setNumberOfPeople("1");
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
          title: "Services",
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.text,
        }}
      />

      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => String(item.ServiceID)}
          refreshing={loading}
          onRefresh={loadData}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          ListHeaderComponent={
            <View>
              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 30,
                  fontWeight: "900",
                }}
              >
                Services
              </Text>

              <Text style={{ color: COLORS.muted, marginTop: 6 }}>
                Manage room service, spa, and shuttle requests.
              </Text>

              <Pressable
                onPress={() => setShowCreateForm((value) => !value)}
                style={{
                  backgroundColor: COLORS.primary,
                  padding: 14,
                  borderRadius: 14,
                  alignItems: "center",
                  marginTop: 18,
                }}
              >
                <Text style={{ color: "#00111A", fontWeight: "900" }}>
                  {showCreateForm ? "Hide Form" : "+ Create Service Request"}
                </Text>
              </Pressable>

              {showCreateForm && (
                <View
                  style={{
                    backgroundColor: COLORS.card,
                    padding: 16,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    marginTop: 16,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.text,
                      fontSize: 22,
                      fontWeight: "900",
                      marginBottom: 12,
                    }}
                  >
                    New Service Request
                  </Text>

                  <Text style={{ color: COLORS.muted, marginBottom: 8 }}>
                    Choose a recent reservation or type a Reservation ID.
                  </Text>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 14 }}
                  >
                    {reservations.slice(0, 12).map((reservation) => {
                      const selected =
                        reservationId === String(reservation.ReservationID);

                      return (
                        <Pressable
                          key={reservation.ReservationID}
                          onPress={() =>
                            setReservationId(String(reservation.ReservationID))
                          }
                          style={{
                            backgroundColor: selected
                              ? COLORS.primary
                              : COLORS.card2,
                            padding: 10,
                            borderRadius: 12,
                            marginRight: 8,
                            minWidth: 155,
                          }}
                        >
                          <Text
                            style={{
                              color: selected ? "#00111A" : COLORS.text,
                              fontWeight: "900",
                            }}
                          >
                            #{reservation.ReservationID}
                          </Text>

                          <Text
                            style={{
                              color: selected ? "#003047" : COLORS.muted,
                              marginTop: 3,
                            }}
                          >
                            Room {reservation.RoomNumber}
                          </Text>

                          <Text
                            style={{
                              color: selected ? "#003047" : COLORS.muted,
                            }}
                          >
                            {reservation.FirstName} {reservation.LastName}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <Field
                    label="Reservation ID"
                    value={reservationId}
                    onChangeText={setReservationId}
                    keyboardType="numeric"
                    placeholder="Example: 95001"
                  />

                  <Text
                    style={{
                      color: COLORS.text,
                      marginBottom: 8,
                      fontWeight: "800",
                    }}
                  >
                    Service Type
                  </Text>

                  <OptionRow
                    options={serviceTypes}
                    selected={serviceType}
                    onSelect={(value) => {
                      setServiceType(value);

                      if (value === "Room Service") setServicePrice("45");
                      if (value === "Spa") setServicePrice("100");
                      if (value === "Shuttle") setServicePrice("40");
                    }}
                  />

                  <Field
                    label="Service Price"
                    value={servicePrice}
                    onChangeText={setServicePrice}
                    keyboardType="numeric"
                    placeholder="Example: 45"
                  />

                  <Field
                    label="Employee ID"
                    value={employeeId}
                    onChangeText={setEmployeeId}
                    keyboardType="numeric"
                    placeholder="Optional, example: 94005"
                  />

                  {serviceType === "Room Service" && (
                    <Field
                      label="Item Description"
                      value={itemDescription}
                      onChangeText={setItemDescription}
                      placeholder="Dinner - pasta and salad"
                      multiline
                    />
                  )}

                  {serviceType === "Spa" && (
                    <>
                      <Field
                        label="Spa Service Type"
                        value={spaServiceType}
                        onChangeText={setSpaServiceType}
                        placeholder="Swedish Massage"
                      />

                      <Field
                        label="Duration Minutes"
                        value={durationMinutes}
                        onChangeText={setDurationMinutes}
                        keyboardType="numeric"
                        placeholder="60"
                      />
                    </>
                  )}

                  {serviceType === "Shuttle" && (
                    <>
                      <Field
                        label="Pickup Time"
                        value={pickupTime}
                        onChangeText={setPickupTime}
                        placeholder="2026-06-01 09:00:00"
                      />

                      <Field
                        label="Dropoff Time"
                        value={dropoffTime}
                        onChangeText={setDropoffTime}
                        placeholder="Optional"
                      />

                      <Field
                        label="Arrival Destination"
                        value={arrivalDestination}
                        onChangeText={setArrivalDestination}
                        placeholder="Hotel"
                      />

                      <Field
                        label="Departure Destination"
                        value={departureDestination}
                        onChangeText={setDepartureDestination}
                        placeholder="DFW Airport"
                      />

                      <Field
                        label="Number of People"
                        value={numberOfPeople}
                        onChangeText={setNumberOfPeople}
                        keyboardType="numeric"
                        placeholder="1"
                      />
                    </>
                  )}

                  <Pressable
                    disabled={submitting}
                    onPress={createService}
                    style={{
                      backgroundColor: submitting ? COLORS.muted : COLORS.primary,
                      padding: 14,
                      borderRadius: 14,
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
                    {submitting ? (
                      <ActivityIndicator color={COLORS.text} />
                    ) : (
                      <Text
                        style={{
                          color: "#00111A",
                          fontWeight: "900",
                          fontSize: 16,
                        }}
                      >
                        Create Service
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}

              <View style={{ flexDirection: "row", gap: 8, marginTop: 18 }}>
                <StatCard title="Pending" value={pendingCount} />
                <StatCard title="Active" value={inProgressCount} />
                <StatCard title="Done" value={completedCount} />
              </View>

              <View style={{ marginTop: 10 }}>
                <StatCard
                  title="Total Service Revenue"
                  value={`$${totalRevenue.toFixed(2)}`}
                  wide
                />
              </View>

              <Text
                style={{
                  color: COLORS.text,
                  fontWeight: "800",
                  marginTop: 18,
                  marginBottom: 8,
                }}
              >
                Filter by Type
              </Text>

              <OptionRow
                options={["All", ...serviceTypes]}
                selected={typeFilter}
                onSelect={setTypeFilter}
              />

              <Text
                style={{
                  color: COLORS.text,
                  fontWeight: "800",
                  marginTop: 12,
                  marginBottom: 8,
                }}
              >
                Filter by Status
              </Text>

              <OptionRow
                options={["All", ...statuses]}
                selected={statusFilter}
                onSelect={setStatusFilter}
              />

              <Text
                style={{
                  color: COLORS.text,
                  fontSize: 22,
                  fontWeight: "900",
                  marginTop: 18,
                  marginBottom: 12,
                }}
              >
                Service Requests
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={{ color: COLORS.muted }}>No service requests found.</Text>
          }
          renderItem={({ item }) => (
            <ServiceCard item={item} onUpdateStatus={updateStatus} />
          )}
        />
      </View>
    </>
  );
}

function ServiceCard({
  item,
  onUpdateStatus,
}: {
  item: HotelService;
  onUpdateStatus: (serviceId: number, requestStatus: string) => void;
}) {
  return (
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
            {item.ServiceType} #{item.ServiceID}
          </Text>

          <Text style={{ color: COLORS.muted, marginTop: 4 }}>
            Reservation #{item.ReservationID} • Room {item.RoomNumber}
          </Text>

          <Text style={{ color: COLORS.muted }}>
            {item.GuestFirstName} {item.GuestLastName}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: getStatusBg(item.RequestStatus),
            paddingVertical: 7,
            paddingHorizontal: 10,
            borderRadius: 12,
            alignSelf: "flex-start",
          }}
        >
          <Text style={{ color: COLORS.text, fontWeight: "900" }}>
            {item.RequestStatus}
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 14 }}>
        <Info label="Request Time" value={item.RequestTime} />
        <Info label="Room Type" value={item.RoomType} />
        <Info
          label="Employee"
          value={
            item.EmployeeID
              ? `${item.EmployeeID} — ${item.EmployeeFirstName || ""} ${
                  item.EmployeeLastName || ""
                }`
              : "Unassigned"
          }
        />

        {item.ServiceType === "Room Service" && (
          <Info
            label="Items"
            value={item.ItemDescription || "No item description"}
          />
        )}

        {item.ServiceType === "Spa" && (
          <>
            <Info label="Spa Type" value={item.SpaServiceType || "N/A"} />
            <Info
              label="Duration"
              value={`${item.DurationMinutes || 0} minutes`}
            />
          </>
        )}

        {item.ServiceType === "Shuttle" && (
          <>
            <Info label="Pickup" value={item.PickupTime || "N/A"} />
            <Info label="Dropoff" value={item.DropoffTime || "N/A"} />
            <Info
              label="Route"
              value={`${item.ArrivalDestination || "N/A"} → ${
                item.DepartureDestination || "N/A"
              }`}
            />
            <Info label="People" value={String(item.NumberOfPeople || 0)} />
          </>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        <MiniStat
          label="Price"
          value={`$${Number(item.ServicePrice || 0).toFixed(2)}`}
        />
        <MiniStat label="Reservation" value={item.ReservStatus} />
      </View>

      <Text
        style={{
          color: COLORS.text,
          fontWeight: "800",
          marginTop: 14,
          marginBottom: 8,
        }}
      >
        Update Status
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {statuses.map((status) => (
          <Pressable
            key={status}
            onPress={() => onUpdateStatus(item.ServiceID, status)}
            style={{
              backgroundColor:
                item.RequestStatus === status ? COLORS.primary : COLORS.card2,
              paddingVertical: 8,
              paddingHorizontal: 10,
              borderRadius: 16,
            }}
          >
            <Text
              style={{
                color: item.RequestStatus === status ? "#00111A" : COLORS.text,
                fontWeight: "800",
              }}
            >
              {status}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function OptionRow({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((option) => {
        const isSelected = selected === option;

        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
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
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={{ marginBottom: 14 }}>
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
          backgroundColor: COLORS.card2,
          color: COLORS.text,
          padding: 13,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
          minHeight: multiline ? 80 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

function StatCard({
  title,
  value,
  wide = false,
}: {
  title: string;
  value: string | number;
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

function getStatusBg(status: string) {
  if (status === "Completed") return "#14532D";
  if (status === "In Progress") return "#164E63";
  if (status === "Cancelled") return "#7F1D1D";
  if (status === "Pending") return "#713F12";
  return COLORS.card2;
}