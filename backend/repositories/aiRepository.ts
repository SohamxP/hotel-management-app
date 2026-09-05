import { prisma } from "../prismaClient";
import {
  MembershipLevel,
  ReservationStatus,
  RoomAvailability,
  RoomType,
  ServiceRequestStatus,
  ServiceType,
} from "../generated/prisma/client";

function roomTypeToLegacy(
  value: RoomType
) {
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

function reservationStatusToLegacy(
  value: ReservationStatus
) {
  switch (value) {
    case ReservationStatus.CONFIRMED:
      return "Confirmed";
    case ReservationStatus.PENDING:
      return "Pending";
    case ReservationStatus.CANCELLED:
      return "Cancelled";
    case ReservationStatus.COMPLETED:
      return "Completed";
    case ReservationStatus.NO_SHOW:
      return "No-Show";
  }
}

function serviceStatusToLegacy(
  value: ServiceRequestStatus
) {
  switch (value) {
    case ServiceRequestStatus.PENDING:
      return "Pending";
    case ServiceRequestStatus.IN_PROGRESS:
      return "In Progress";
    case ServiceRequestStatus.COMPLETED:
      return "Completed";
    case ServiceRequestStatus.CANCELLED:
      return "Cancelled";
  }
}

function serviceTypeToLegacy(
  value: ServiceType
) {
  switch (value) {
    case ServiceType.ROOM_SERVICE:
      return "Room Service";
    case ServiceType.SPA:
      return "Spa";
    case ServiceType.SHUTTLE:
      return "Shuttle";
  }
}

function membershipToLegacy(
  value: MembershipLevel | null
) {
  if (!value) {
    return null;
  }

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

export async function getOperationalSummary() {
  const [
    totalRooms,
    availableRooms,
    reservedRooms,
    occupiedRooms,
    blockedRooms,
    totalGuests,
    totalReservations,
    activeReservations,
    cancelledReservations,
    pendingServices,
    inProgressServices,
    completedServices,
    activeRevenue,
    feedback,
  ] = await Promise.all([
    prisma.room.count(),

    prisma.room.count({
      where: {
        availStatus:
          RoomAvailability.AVAILABLE,
      },
    }),

    prisma.room.count({
      where: {
        availStatus:
          RoomAvailability.RESERVED,
      },
    }),

    prisma.room.count({
      where: {
        availStatus:
          RoomAvailability.OCCUPIED,
      },
    }),

    prisma.room.count({
      where: {
        availStatus:
          RoomAvailability.BLOCKED,
      },
    }),

    prisma.guest.count(),

    prisma.reservation.count(),

    prisma.reservation.count({
      where: {
        reservStatus: {
          in: [
            ReservationStatus.CONFIRMED,
            ReservationStatus.PENDING,
          ],
        },
      },
    }),

    prisma.reservation.count({
      where: {
        reservStatus:
          ReservationStatus.CANCELLED,
      },
    }),

    prisma.service.count({
      where: {
        requestStatus:
          ServiceRequestStatus.PENDING,
      },
    }),

    prisma.service.count({
      where: {
        requestStatus:
          ServiceRequestStatus.IN_PROGRESS,
      },
    }),

    prisma.service.aggregate({
      where: {
        requestStatus:
          ServiceRequestStatus.COMPLETED,
      },
      _sum: {
        servicePrice: true,
      },
    }),

    prisma.reservation.aggregate({
      where: {
        reservStatus: {
          not:
            ReservationStatus.CANCELLED,
        },
      },
      _sum: {
        totalPrice: true,
      },
    }),

    prisma.feedback.findMany(),
  ]);

  const avg = (
    values: Array<number | null>
  ) => {
    const valid = values.filter(
      (value): value is number =>
        value !== null
    );

    if (!valid.length) {
      return null;
    }

    return Number(
      (
        valid.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / valid.length
      ).toFixed(2)
    );
  };

  return {
    totalRooms,
    availableRooms,
    reservedRooms,
    occupiedRooms,
    blockedRooms,

    totalGuests,
    totalReservations,
    activeReservations,
    cancelledReservations,

    pendingServices,
    inProgressServices,

    completedServiceRevenue:
      completedServices._sum
        .servicePrice ?? 0,

    reservationRevenue:
      activeRevenue._sum
        .totalPrice ?? 0,

    avgRoomRating: avg(
      feedback.map(
        (item) =>
          item.roomRating
      )
    ),

    avgCustomerServiceRating:
      avg(
        feedback.map(
          (item) =>
            item.custSvcRating
        )
      ),

    avgSafetyRating: avg(
      feedback.map(
        (item) =>
          item.safetyRating
      )
    ),

    avgBreakfastRating: avg(
      feedback.map(
        (item) =>
          item.breakfastRating
      )
    ),
  };
}

export async function getRoomTypePerformance() {
  const rooms =
    await prisma.room.findMany();

  const groups = new Map<
    string,
    any
  >();

  for (const room of rooms) {
    const roomType =
      roomTypeToLegacy(
        room.roomType
      );

    if (!groups.has(roomType)) {
      groups.set(roomType, {
        RoomType: roomType,
        totalRooms: 0,
        availableRooms: 0,
        reservedRooms: 0,
        occupiedRooms: 0,
        blockedRooms: 0,
        rateTotal: 0,
      });
    }

    const group =
      groups.get(roomType);

    group.totalRooms += 1;
    group.rateTotal +=
      room.ratePerNight;

    if (
      room.availStatus ===
      RoomAvailability.AVAILABLE
    ) {
      group.availableRooms += 1;
    }

    if (
      room.availStatus ===
      RoomAvailability.RESERVED
    ) {
      group.reservedRooms += 1;
    }

    if (
      room.availStatus ===
      RoomAvailability.OCCUPIED
    ) {
      group.occupiedRooms += 1;
    }

    if (
      room.availStatus ===
      RoomAvailability.BLOCKED
    ) {
      group.blockedRooms += 1;
    }
  }

  return Array.from(
    groups.values()
  )
    .map((group) => ({
      RoomType: group.RoomType,

      totalRooms:
        group.totalRooms,

      availableRooms:
        group.availableRooms,

      reservedRooms:
        group.reservedRooms,

      occupiedRooms:
        group.occupiedRooms,

      blockedRooms:
        group.blockedRooms,

      avgRate: Number(
        (
          group.rateTotal /
          group.totalRooms
        ).toFixed(2)
      ),
    }))
    .sort(
      (a, b) =>
        b.totalRooms -
          a.totalRooms ||
        b.avgRate - a.avgRate
    );
}

export async function getReservationStatusBreakdown() {
  const reservations =
    await prisma.reservation.findMany();

  const groups = new Map<
    string,
    {
      ReservStatus: string;
      count: number;
      revenue: number;
    }
  >();

  for (const reservation of reservations) {
    const status =
      reservationStatusToLegacy(
        reservation.reservStatus
      );

    const group =
      groups.get(status) ?? {
        ReservStatus: status,
        count: 0,
        revenue: 0,
      };

    group.count += 1;
    group.revenue +=
      reservation.totalPrice;

    groups.set(status, group);
  }

  return Array.from(
    groups.values()
  ).sort(
    (a, b) =>
      b.count - a.count
  );
}

export async function getServiceStatusBreakdown() {
  const services =
    await prisma.service.findMany();

  const groups = new Map<
    string,
    {
      RequestStatus: string;
      count: number;
      revenue: number;
    }
  >();

  for (const service of services) {
    const status =
      serviceStatusToLegacy(
        service.requestStatus
      );

    const group =
      groups.get(status) ?? {
        RequestStatus: status,
        count: 0,
        revenue: 0,
      };

    group.count += 1;
    group.revenue +=
      service.servicePrice;

    groups.set(status, group);
  }

  return Array.from(
    groups.values()
  ).sort(
    (a, b) =>
      b.count - a.count
  );
}

export async function getServiceRevenueByType() {
  const services =
    await prisma.service.findMany({
      where: {
        requestStatus: {
          not:
            ServiceRequestStatus.CANCELLED,
        },
      },
    });

  const groups = new Map<
    string,
    {
      ServiceType: string;
      serviceCount: number;
      totalRevenue: number;
    }
  >();

  for (const service of services) {
    const type =
      serviceTypeToLegacy(
        service.serviceType
      );

    const group =
      groups.get(type) ?? {
        ServiceType: type,
        serviceCount: 0,
        totalRevenue: 0,
      };

    group.serviceCount += 1;

    group.totalRevenue +=
      service.servicePrice;

    groups.set(type, group);
  }

  return Array.from(
    groups.values()
  )
    .map((group) => ({
      ...group,

      avgPrice: Number(
        (
          group.totalRevenue /
          group.serviceCount
        ).toFixed(2)
      ),
    }))
    .sort(
      (a, b) =>
        b.totalRevenue -
        a.totalRevenue
    );
}

export async function getTopGuests() {
  const guests =
    await prisma.guest.findMany({
      include: {
        membership: true,

        reservations: {
          where: {
            reservStatus: {
              not:
                ReservationStatus.CANCELLED,
            },
          },
        },
      },
    });

  return guests
    .map((guest) => ({
      GuestID: guest.guestId,

      guestName:
        `${guest.firstName} ${guest.lastName}`,

      MembershipLevel:
        membershipToLegacy(
          guest.membership
            ?.membershipLevel ??
            null
        ),

      reservationCount:
        guest.reservations.length,

      totalSpent:
        guest.reservations.reduce(
          (
            sum,
            reservation
          ) =>
            sum +
            reservation.totalPrice,
          0
        ),
    }))
    .filter(
      (guest) =>
        guest.reservationCount > 0
    )
    .sort(
      (a, b) =>
        b.totalSpent -
        a.totalSpent
    )
    .slice(0, 5);
}

export async function getRecentLowFeedback() {
  const feedback =
    await prisma.feedback.findMany({
      where: {
        OR: [
          {
            roomRating: {
              lte: 3,
            },
          },
          {
            breakfastRating: {
              lte: 3,
            },
          },
          {
            safetyRating: {
              lte: 3,
            },
          },
          {
            custSvcRating: {
              lte: 3,
            },
          },
        ],
      },

      include: {
        reservation: {
          include: {
            guest: true,
            room: true,
          },
        },
      },

      orderBy: {
        submissionDate: "desc",
      },

      take: 5,
    });

  return feedback.map(
    (item) => ({
      FeedbackID:
        item.feedbackId,

      ReservationID: Number(
        item.reservationId
      ),

      guestName:
        `${item.reservation.guest.firstName} ${item.reservation.guest.lastName}`,

      RoomType:
        roomTypeToLegacy(
          item.reservation.room.roomType
        ),

      RoomRating:
        item.roomRating,

      BreakfastRating:
        item.breakfastRating,

      SafetyRating:
        item.safetyRating,

      CustSvcRating:
        item.custSvcRating,

      Comments:
        item.comments,

      SubmissionDate:
        item.submissionDate,
    })
  );
}