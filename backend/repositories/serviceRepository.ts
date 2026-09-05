import { prisma } from "../prismaClient";
import {
  ReservationStatus,
  RoomType,
  ServiceRequestStatus,
  ServiceType,
} from "../generated/prisma/client";

type CreateServiceData = {
  reservationId: number;
  roomNumber: number;
  serviceType: string;
  requestStatus: string;
  servicePrice: number;
  employeeId: number | null;

  itemDescription: string | null;

  spaServiceType: string | null;
  durationMinutes: number | null;

  pickupTime: string | null;
  dropoffTime: string | null;
  arrivalDestination: string | null;
  departureDestination: string | null;
  numberOfPeople: number | null;
};

function serviceTypeToPrisma(value: string): ServiceType {
  switch (value) {
    case "Room Service":
      return ServiceType.ROOM_SERVICE;
    case "Spa":
      return ServiceType.SPA;
    case "Shuttle":
      return ServiceType.SHUTTLE;
    default:
      throw new Error(`Invalid service type: ${value}`);
  }
}

function serviceTypeToLegacy(value: ServiceType): string {
  switch (value) {
    case ServiceType.ROOM_SERVICE:
      return "Room Service";
    case ServiceType.SPA:
      return "Spa";
    case ServiceType.SHUTTLE:
      return "Shuttle";
  }
}

function requestStatusToPrisma(
  value: string
): ServiceRequestStatus {
  switch (value) {
    case "Pending":
      return ServiceRequestStatus.PENDING;
    case "In Progress":
      return ServiceRequestStatus.IN_PROGRESS;
    case "Completed":
      return ServiceRequestStatus.COMPLETED;
    case "Cancelled":
      return ServiceRequestStatus.CANCELLED;
    default:
      throw new Error(`Invalid service status: ${value}`);
  }
}

function requestStatusToLegacy(
  value: ServiceRequestStatus
): string {
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

function reservationStatusToLegacy(
  value: ReservationStatus
): string {
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

function roomTypeToLegacy(value: RoomType): string {
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

function serviceToLegacy(service: any) {
  return {
    ServiceID: service.serviceId,
    ReservationID: Number(service.reservationId),
    ServiceType: serviceTypeToLegacy(
      service.serviceType
    ),
    RequestTime: service.requestTime,
    RequestStatus: requestStatusToLegacy(
      service.requestStatus
    ),
    ServicePrice: service.servicePrice,
    EmployeeID: service.employeeId,
  };
}

export async function findAllServices() {
  const services = await prisma.service.findMany({
    include: {
      reservation: {
        include: {
          guest: true,
          room: true,
        },
      },
      employee: true,
      roomService: true,
      spaService: true,
      shuttleService: true,
    },
    orderBy: [
      {
        requestTime: "desc",
      },
      {
        serviceId: "desc",
      },
    ],
  });

  return services.map((service) => ({
    ServiceID: service.serviceId,
    ReservationID: Number(
      service.reservationId
    ),
    ServiceType: serviceTypeToLegacy(
      service.serviceType
    ),
    RequestTime: service.requestTime,
    RequestStatus: requestStatusToLegacy(
      service.requestStatus
    ),
    ServicePrice: service.servicePrice,
    EmployeeID: service.employeeId,

    RoomNumber:
      service.reservation.roomNumber,
    CheckInDate:
      service.reservation.checkInDate,
    CheckOutDate:
      service.reservation.checkOutDate,
    ReservStatus:
      reservationStatusToLegacy(
        service.reservation.reservStatus
      ),

    RoomType: roomTypeToLegacy(
      service.reservation.room.roomType
    ),

    GuestID:
      service.reservation.guestId,
    GuestFirstName:
      service.reservation.guest.firstName,
    GuestLastName:
      service.reservation.guest.lastName,

    EmployeeFirstName:
      service.employee?.firstName ?? null,
    EmployeeLastName:
      service.employee?.lastName ?? null,
    EmployeePosition:
      service.employee?.position ?? null,

    ItemDescription:
      service.roomService?.itemDescription ??
      null,

    SpaServiceType:
      service.spaService?.spaServiceType ??
      null,

    DurationMinutes:
      service.spaService?.durationMinutes ??
      null,

    PickupTime:
      service.shuttleService?.pickupTime ??
      null,

    DropoffTime:
      service.shuttleService?.dropoffTime ??
      null,

    ArrivalDestination:
      service.shuttleService
        ?.arrivalDestination ?? null,

    DepartureDestination:
      service.shuttleService
        ?.departureDestination ?? null,

    NumberOfPeople:
      service.shuttleService?.numberOfPeople ??
      null,
  }));
}

export async function findServiceById(
  serviceId: number
) {
  const service = await prisma.service.findUnique({
    where: {
      serviceId,
    },
  });

  return service
    ? serviceToLegacy(service)
    : undefined;
}

export async function findReservationById(
  reservationId: number
) {
  const reservation =
    await prisma.reservation.findUnique({
      where: {
        reservationId: BigInt(
          reservationId
        ),
      },
    });

  if (!reservation) {
    return undefined;
  }

  return {
    ReservationID: Number(
      reservation.reservationId
    ),
    GuestID: reservation.guestId,
    RoomNumber: reservation.roomNumber,
    CheckInDate: reservation.checkInDate,
    CheckInTime: reservation.checkInTime,
    CheckOutDate: reservation.checkOutDate,
    TotalPrice: reservation.totalPrice,
    ReservStatus:
      reservationStatusToLegacy(
        reservation.reservStatus
      ),
    SpecialRequest:
      reservation.specialRequest,
  };
}

export async function findEmployeeById(
  employeeId: number
) {
  const employee =
    await prisma.employee.findUnique({
      where: {
        employeeId,
      },
    });

  if (!employee) {
    return undefined;
  }

  return {
    EmployeeID: employee.employeeId,
    FirstName: employee.firstName,
    LastName: employee.lastName,
    DateOfBirth: employee.dateOfBirth,
    SSN: employee.ssn,
    Salary: employee.salary,
    Position: employee.position,
    HoursWorked: employee.hoursWorked,
  };
}

export async function createServiceWithSubtype(
  data: CreateServiceData
) {
  const serviceId =
    await prisma.$transaction(
      async (tx) => {
        const latest =
          await tx.service.findFirst({
            orderBy: {
              serviceId: "desc",
            },
            select: {
              serviceId: true,
            },
          });

        const nextServiceId =
          Math.max(
            latest?.serviceId ?? 96000,
            96000
          ) + 1;

        await tx.service.create({
          data: {
            serviceId: nextServiceId,
            reservationId: BigInt(
              data.reservationId
            ),
            serviceType:
              serviceTypeToPrisma(
                data.serviceType
              ),
            requestStatus:
              requestStatusToPrisma(
                data.requestStatus
              ),
            servicePrice:
              data.servicePrice,
            employeeId: data.employeeId,
          },
        });

        if (
          data.serviceType ===
          "Room Service"
        ) {
          await tx.roomService.create({
            data: {
              serviceId: nextServiceId,
              roomNumber:
                data.roomNumber,
              itemDescription:
                data.itemDescription,
            },
          });
        }

        if (data.serviceType === "Spa") {
          await tx.spaService.create({
            data: {
              serviceId: nextServiceId,
              spaServiceType:
                data.spaServiceType!,
              durationMinutes:
                data.durationMinutes,
            },
          });
        }

        if (
          data.serviceType === "Shuttle"
        ) {
          await tx.shuttleService.create({
            data: {
              serviceId: nextServiceId,
              pickupTime:
                data.pickupTime!,
              dropoffTime:
                data.dropoffTime,
              arrivalDestination:
                data.arrivalDestination!,
              departureDestination:
                data.departureDestination!,
              numberOfPeople:
                data.numberOfPeople!,
            },
          });
        }

        return nextServiceId;
      },
      {
        isolationLevel: "Serializable",
      }
    );

  return findServiceById(serviceId);
}

export async function updateServiceStatus(
  serviceId: number,
  requestStatus: string
) {
  const service =
    await prisma.service.update({
      where: {
        serviceId,
      },
      data: {
        requestStatus:
          requestStatusToPrisma(
            requestStatus
          ),
      },
    });

  return {
    changes: 1,
    serviceId: service.serviceId,
  };
}