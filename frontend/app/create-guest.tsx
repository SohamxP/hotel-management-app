import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
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

const membershipLevels = ["Bronze", "Silver", "Gold", "Platinum"];

const roomTypes = ["King", "Queen", "Deluxe", "Accessible"];

const purposes = [
  "Business",
  "Leisure",
  "Travel",
  "Nearby Attractions",
  "Social Gathering",
];

const cardTypes = [
  "Visa",
  "MasterCard",
  "Amex",
  "Discover",
  "Cash",
  "Bank Transfer",
];

export default function CreateGuestScreen() {
  const { roomNumber } = useLocalSearchParams();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [membershipLevel, setMembershipLevel] = useState("Bronze");
  const [preferredRoomType, setPreferredRoomType] = useState("King");
  const [purposeOfVisit, setPurposeOfVisit] = useState("Leisure");
  const [cardType, setCardType] = useState("Visa");
  const [cardLastFour, setCardLastFour] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const createGuest = async () => {
    if (!firstName || !lastName || !dateOfBirth || !phoneNumber || !email) {
      Alert.alert(
        "Missing fields",
        "First name, last name, date of birth, phone number, and email are required."
      );
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      Alert.alert("Invalid date", "Date of birth must be in YYYY-MM-DD format.");
      return;
    }

    if (cardLastFour && !/^\d{4}$/.test(cardLastFour)) {
      Alert.alert("Invalid card", "Card last four must be exactly 4 digits.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await API.post("/api/guests", {
        firstName,
        lastName,
        dateOfBirth,
        phoneNumber,
        email,
        membershipLevel,
        preferredRoomType,
        purposeOfVisit,
        cardType,
        cardLastFour,
        billingAddress,
      });

      const createdGuestId = String(res.data.guest.GuestID);

      Alert.alert(
        "Guest created",
        `Guest ID ${createdGuestId} was created successfully.`,
        [
          {
            text: "Use for reservation",
            onPress: () => {
              if (roomNumber) {
                router.replace({
                  pathname: "/create-reservation" as any,
                  params: {
                    roomNumber: String(roomNumber),
                    selectedGuestId: createdGuestId,
                  },
                });
              } else {
                router.back();
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.log("Create guest error:", error.response?.data || error.message);

      Alert.alert(
        "Create guest failed",
        error.response?.data?.error || "Could not create guest"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Create Guest",
          headerStyle: { backgroundColor: COLORS.bg },
          headerTintColor: COLORS.text,
        }}
      />

      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: "900" }}>
          Create Guest
        </Text>

        <Text style={{ color: COLORS.muted, marginTop: 6, marginBottom: 20 }}>
          Add guest details, membership preferences, and payment profile.
        </Text>

        <Field
          label="First Name"
          value={firstName}
          onChangeText={setFirstName}
        />

        <Field
          label="Last Name"
          value={lastName}
          onChangeText={setLastName}
        />

        <Field
          label="Date of Birth"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
          placeholder="YYYY-MM-DD"
        />

        <Field
          label="Phone Number"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="817-900-0201"
          keyboardType="phone-pad"
        />

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="guest@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <OptionGroup
          title="Membership Level"
          options={membershipLevels}
          selected={membershipLevel}
          onSelect={setMembershipLevel}
        />

        <OptionGroup
          title="Preferred Room Type"
          options={roomTypes}
          selected={preferredRoomType}
          onSelect={setPreferredRoomType}
        />

        <OptionGroup
          title="Purpose of Visit"
          options={purposes}
          selected={purposeOfVisit}
          onSelect={setPurposeOfVisit}
        />

        <OptionGroup
          title="Payment Card Type"
          options={cardTypes}
          selected={cardType}
          onSelect={setCardType}
        />

        <Field
          label="Card Last Four"
          value={cardLastFour}
          onChangeText={setCardLastFour}
          placeholder="Optional, example: 4521"
          keyboardType="numeric"
          maxLength={4}
        />

        <Field
          label="Billing Address"
          value={billingAddress}
          onChangeText={setBillingAddress}
          placeholder="Optional"
          multiline
        />

        <Pressable
          disabled={submitting}
          onPress={createGuest}
          style={{
            backgroundColor: submitting ? COLORS.muted : COLORS.primary,
            padding: 16,
            borderRadius: 14,
            alignItems: "center",
            marginTop: 8,
          }}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.text} />
          ) : (
            <Text style={{ color: "#00111A", fontWeight: "900", fontSize: 16 }}>
              Create Guest
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
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  maxLength?: number;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  autoCapitalize = "sentences",
  keyboardType = "default",
  maxLength,
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
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        maxLength={maxLength}
        style={{
          backgroundColor: COLORS.card,
          color: COLORS.text,
          padding: 14,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: COLORS.border,
          minHeight: multiline ? 85 : undefined,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}

type OptionGroupProps = {
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
};

function OptionGroup({ title, options, selected, onSelect }: OptionGroupProps) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ color: COLORS.text, marginBottom: 8, fontWeight: "700" }}>
        {title}
      </Text>

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
    </View>
  );
}