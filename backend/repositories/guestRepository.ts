import { prisma } from "../prismaClient";
import {
  CardType,
  MembershipLevel,
  PurposeOfVisit,
  RoomType,
} from "../generated/prisma/client";

type CreateGuestData = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  membershipLevel: string;
  preferredRoomType: string | null;
  purposeOfVisit: string | null;
  cardType: string;
  cardLastFour: string | null;
  billingAddress: string | null;
};

function membershipLevelToPrisma(value: string): MembershipLevel {
  switch (value) {
    case "Bronze":
      return MembershipLevel.BRONZE;
    case "Silver":
      return MembershipLevel.SILVER;
    case "Gold":
      return MembershipLevel.GOLD;
    case "Platinum":
      return MembershipLevel.PLATINUM;
    default:
      throw new Error(`Invalid membership level: ${value}`);
  }
}

function membershipLevelToLegacy(value: MembershipLevel): string {
  switch (value) {
    case MembershipLevel.BRONZE:
      return "Bronze";
    case MembershipLevel.SILVER:
      return "Silver";
    case MembershipLevel.GOLD:
      return "Gold";
    case MembershipLevel.PLATINUM:
      return "Platinum";
  }
}

function roomTypeToPrisma(value: string | null): RoomType | null {
  if (value === null) {
    return null;
  }

  switch (value) {
    case "King":
      return RoomType.KING;
    case "Queen":
      return RoomType.QUEEN;
    case "Deluxe":
      return RoomType.DELUXE;
    case "Accessible":
      return RoomType.ACCESSIBLE;
    default:
      throw new Error(`Invalid preferred room type: ${value}`);
  }
}

function roomTypeToLegacy(value: RoomType | null): string | null {
  if (value === null) {
    return null;
  }

  switch (value) {
    case RoomType.KING:
      return "King";
    case RoomType.QUEEN:
      return "Queen";
    case RoomType.DELUXE:
      return "Deluxe";
    case RoomType.ACCESSIBLE:
      return "Accessible";
  }
}

function purposeToPrisma(value: string | null): PurposeOfVisit | null {
  if (value === null) {
    return null;
  }

  switch (value) {
    case "Business":
      return PurposeOfVisit.BUSINESS;
    case "Leisure":
      return PurposeOfVisit.LEISURE;
    case "Travel":
      return PurposeOfVisit.TRAVEL;
    case "Nearby Attractions":
      return PurposeOfVisit.NEARBY_ATTRACTIONS;
    case "Social Gathering":
      return PurposeOfVisit.SOCIAL_GATHERING;
    default:
      throw new Error(`Invalid purpose of visit: ${value}`);
  }
}

function purposeToLegacy(value: PurposeOfVisit | null): string | null {
  if (value === null) {
    return null;
  }

  switch (value) {
    case PurposeOfVisit.BUSINESS:
      return "Business";
    case PurposeOfVisit.LEISURE:
      return "Leisure";
    case PurposeOfVisit.TRAVEL:
      return "Travel";
    case PurposeOfVisit.NEARBY_ATTRACTIONS:
      return "Nearby Attractions";
    case PurposeOfVisit.SOCIAL_GATHERING:
      return "Social Gathering";
  }
}

function cardTypeToPrisma(value: string): CardType {
  switch (value) {
    case "Visa":
      return CardType.VISA;
    case "MasterCard":
      return CardType.MASTERCARD;
    case "Amex":
      return CardType.AMEX;
    case "Discover":
      return CardType.DISCOVER;
    case "Cash":
      return CardType.CASH;
    case "Bank Transfer":
      return CardType.BANK_TRANSFER;
    default:
      throw new Error(`Invalid card type: ${value}`);
  }
}

function cardTypeToLegacy(value: CardType): string {
  switch (value) {
    case CardType.VISA:
      return "Visa";
    case CardType.MASTERCARD:
      return "MasterCard";
    case CardType.AMEX:
      return "Amex";
    case CardType.DISCOVER:
      return "Discover";
    case CardType.CASH:
      return "Cash";
    case CardType.BANK_TRANSFER:
      return "Bank Transfer";
  }
}

function reservationStatusToLegacy(value: string): string {
  switch (value) {
    case "CONFIRMED":
      return "Confirmed";
    case "PENDING":
      return "Pending";
    case "CANCELLED":
      return "Cancelled";
    case "COMPLETED":
      return "Completed";
    case "NO_SHOW":
      return "No-Show";
    default:
      return value;
  }
}

function paymentModeToLegacy(value: string): string {
  switch (value) {
    case "CREDIT_CARD":
      return "Credit Card";
    case "DEBIT_CARD":
      return "Debit Card";
    case "CASH":
      return "Cash";
    case "BANK_TRANSFER":
      return "Bank Transfer";
    case "AMEX":
      return "Amex";
    default:
      return value;
  }
}

export async function findAllGuests() {
  const guests = await prisma.guest.findMany({
    include: {
      membership: true,
      paymentInfo: true,
      reservations: {
        select: {
          reservationId: true,
          totalPrice: true,
        },
      },
    },
    orderBy: [
      {
        lastName: "asc",
      },
      {
        firstName: "asc",
      },
    ],
  });

  return guests.map((guest) => {
    const payment = guest.paymentInfo[0] ?? null;

    const totalSpent = guest.reservations.reduce(
      (sum, reservation) => sum + reservation.totalPrice,
      0
    );

    return {
      GuestID: guest.guestId,
      FirstName: guest.firstName,
      LastName: guest.lastName,
      DateOfBirth: guest.dateOfBirth,
      PhoneNumber: guest.phoneNumber,
      Email: guest.email,

      MembershipLevel: guest.membership
        ? membershipLevelToLegacy(guest.membership.membershipLevel)
        : null,

      PreferredRoomType: guest.membership
        ? roomTypeToLegacy(guest.membership.preferredRoomType)
        : null,

      PurposeOfVisit: guest.membership
        ? purposeToLegacy(guest.membership.purposeOfVisit)
        : null,

      CardType: payment ? cardTypeToLegacy(payment.cardType) : null,
      CardLastFour: payment?.cardLastFour ?? null,
      BillingAddress: payment?.billingAddress ?? null,

      ReservationCount: guest.reservations.length,
      TotalSpent: totalSpent,
    };
  });
}

export async function findGuestById(guestId: number) {
  const guest = await prisma.guest.findUnique({
    where: {
      guestId,
    },
    include: {
      membership: true,
      paymentInfo: true,
    },
  });

  if (!guest) {
    return undefined;
  }

  const payment = guest.paymentInfo[0] ?? null;

  return {
    GuestID: guest.guestId,
    FirstName: guest.firstName,
    LastName: guest.lastName,
    DateOfBirth: guest.dateOfBirth,
    PhoneNumber: guest.phoneNumber,
    Email: guest.email,

    MembershipID: guest.membership?.membershipId ?? null,

    MembershipLevel: guest.membership
      ? membershipLevelToLegacy(guest.membership.membershipLevel)
      : null,

    PreferredRoomType: guest.membership
      ? roomTypeToLegacy(guest.membership.preferredRoomType)
      : null,

    PurposeOfVisit: guest.membership
      ? purposeToLegacy(guest.membership.purposeOfVisit)
      : null,

    PaymentID: payment?.paymentId ?? null,
    CardType: payment ? cardTypeToLegacy(payment.cardType) : null,
    CardLastFour: payment?.cardLastFour ?? null,
    BillingAddress: payment?.billingAddress ?? null,
  };
}

export async function createGuestWithDetails(data: CreateGuestData) {
  const guestId = await prisma.$transaction(
    async (tx) => {
      const [
        latestGuest,
        latestMembership,
        latestPayment,
      ] = await Promise.all([
        tx.guest.findFirst({
          orderBy: {
            guestId: "desc",
          },
          select: {
            guestId: true,
          },
        }),

        tx.membership.findFirst({
          orderBy: {
            membershipId: "desc",
          },
          select: {
            membershipId: true,
          },
        }),

        tx.paymentInfo.findFirst({
          orderBy: {
            paymentId: "desc",
          },
          select: {
            paymentId: true,
          },
        }),
      ]);

      const nextGuestId = Math.max(
        latestGuest?.guestId ?? 91000,
        91000
      ) + 1;

      const nextMembershipId = Math.max(
        latestMembership?.membershipId ?? 92000,
        92000
      ) + 1;

      const nextPaymentId = Math.max(
        latestPayment?.paymentId ?? 93000,
        93000
      ) + 1;

      await tx.guest.create({
        data: {
          guestId: nextGuestId,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth,
          phoneNumber: data.phoneNumber,
          email: data.email,

          membership: {
            create: {
              membershipId: nextMembershipId,
              membershipLevel: membershipLevelToPrisma(
                data.membershipLevel
              ),
              preferredRoomType: roomTypeToPrisma(
                data.preferredRoomType
              ),
              purposeOfVisit: purposeToPrisma(
                data.purposeOfVisit
              ),
            },
          },

          paymentInfo: {
            create: {
              paymentId: nextPaymentId,
              cardType: cardTypeToPrisma(data.cardType),
              cardLastFour: data.cardLastFour,
              billingAddress: data.billingAddress,
            },
          },
        },
      });

      return nextGuestId;
    },
    {
      isolationLevel: "Serializable",
    }
  );

  return findGuestById(guestId);
}

export async function findGuestReservations(guestId: number) {
  const reservations = await prisma.reservation.findMany({
    where: {
      guestId,
    },
    include: {
      room: true,
      services: true,
    },
    orderBy: {
      checkInDate: "desc",
    },
  });

  return reservations.map((reservation) => {
    const serviceTotal = reservation.services.reduce(
      (sum, service) => sum + service.servicePrice,
      0
    );

    return {
      ReservationID: Number(reservation.reservationId),
      GuestID: reservation.guestId,
      RoomNumber: reservation.roomNumber,

      RoomType: roomTypeToLegacy(
        reservation.room.roomType
      ),

      RatePerNight: reservation.room.ratePerNight,

      CheckInDate: reservation.checkInDate,
      CheckInTime: reservation.checkInTime,
      CheckOutDate: reservation.checkOutDate,
      TotalPrice: reservation.totalPrice,

      ReservStatus: reservationStatusToLegacy(
        reservation.reservStatus
      ),

      SpecialRequest: reservation.specialRequest,

      PaymentMode: paymentModeToLegacy(
        reservation.paymentMode
      ),

      ServiceCount: reservation.services.length,
      ServiceTotal: serviceTotal,
    };
  });
}