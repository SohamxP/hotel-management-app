import * as guestRepository from "../repositories/guestRepository";

const MEMBERSHIP_LEVELS = ["Bronze", "Silver", "Gold", "Platinum"];

const ROOM_TYPES = ["King", "Queen", "Deluxe", "Accessible"];

const PURPOSES = [
  "Business",
  "Leisure",
  "Travel",
  "Nearby Attractions",
  "Social Gathering",
];

const CARD_TYPES = [
  "Visa",
  "MasterCard",
  "Amex",
  "Discover",
  "Cash",
  "Bank Transfer",
];

type CreateGuestInput = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  membershipLevel: string;
  preferredRoomType?: string;
  purposeOfVisit?: string;
  cardType: string;
  cardLastFour?: string;
  billingAddress?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function requireEnum(value: string, allowed: string[], fieldName: string) {
  if (!allowed.includes(value)) {
    throw {
      status: 400,
      message: `${fieldName} must be one of: ${allowed.join(", ")}`,
    };
  }
}

export async function getAllGuests() {
  return guestRepository.findAllGuests();
}

export async function getGuestById(guestId: number) {
  if (!guestId) {
    throw {
      status: 400,
      message: "Guest ID is required",
    };
  }

  const guest = await guestRepository.findGuestById(guestId);

  if (!guest) {
    throw {
      status: 404,
      message: "Guest not found",
    };
  }

  return guest;
}

export async function createGuest(input: CreateGuestInput) {
  const firstName = clean(input.firstName);
  const lastName = clean(input.lastName);
  const dateOfBirth = clean(input.dateOfBirth);
  const phoneNumber = clean(input.phoneNumber);
  const email = clean(input.email).toLowerCase();
  const membershipLevel = clean(input.membershipLevel);
  const preferredRoomType = clean(input.preferredRoomType) || null;
  const purposeOfVisit = clean(input.purposeOfVisit) || null;
  const cardType = clean(input.cardType);
  const cardLastFour = clean(input.cardLastFour) || null;
  const billingAddress = clean(input.billingAddress) || null;

  if (!firstName || !lastName || !dateOfBirth || !phoneNumber || !email) {
    throw {
      status: 400,
      message:
        "firstName, lastName, dateOfBirth, phoneNumber, and email are required",
    };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    throw {
      status: 400,
      message: "dateOfBirth must be in YYYY-MM-DD format",
    };
  }

  if (!email.includes("@")) {
    throw {
      status: 400,
      message: "Email must be valid",
    };
  }

  requireEnum(membershipLevel, MEMBERSHIP_LEVELS, "membershipLevel");

  if (preferredRoomType) {
    requireEnum(preferredRoomType, ROOM_TYPES, "preferredRoomType");
  }

  if (purposeOfVisit) {
    requireEnum(purposeOfVisit, PURPOSES, "purposeOfVisit");
  }

  requireEnum(cardType, CARD_TYPES, "cardType");

  if (cardLastFour && !/^\d{4}$/.test(cardLastFour)) {
    throw {
      status: 400,
      message: "cardLastFour must be exactly 4 digits",
    };
  }

  try {
    const guest = await guestRepository.createGuestWithDetails({
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

    return {
      success: true,
      message: "Guest created successfully",
      guest,
    };
  } catch (error: any) {
    if (String(error?.message || "").includes("UNIQUE")) {
      throw {
        status: 409,
        message: "A guest with this email or phone number already exists",
      };
    }

    throw error;
  }
}