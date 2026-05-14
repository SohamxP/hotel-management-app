import * as serviceRepository from "../repositories/serviceRepository";

const SERVICE_TYPES = ["Room Service", "Spa", "Shuttle"];

const SERVICE_STATUSES = [
  "Pending",
  "In Progress",
  "Completed",
  "Cancelled",
];

type CreateServiceInput = {
  reservationId: number;
  serviceType: string;
  servicePrice: number;
  employeeId?: number | null;

  itemDescription?: string;

  spaServiceType?: string;
  durationMinutes?: number;

  pickupTime?: string;
  dropoffTime?: string;
  arrivalDestination?: string;
  departureDestination?: string;
  numberOfPeople?: number;
};

type UpdateServiceStatusInput = {
  requestStatus: string;
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

export async function getAllServices() {
  return serviceRepository.findAllServices();
}

export async function createService(input: CreateServiceInput) {
  const reservationId = Number(input.reservationId);
  const serviceType = clean(input.serviceType);
  const servicePrice = Number(input.servicePrice);
  const employeeId =
    input.employeeId === undefined || input.employeeId === null || input.employeeId === 0
      ? null
      : Number(input.employeeId);

  if (!reservationId || !serviceType || Number.isNaN(servicePrice)) {
    throw {
      status: 400,
      message: "reservationId, serviceType, and servicePrice are required",
    };
  }

  requireEnum(serviceType, SERVICE_TYPES, "serviceType");

  if (servicePrice < 0) {
    throw {
      status: 400,
      message: "servicePrice cannot be negative",
    };
  }

  const reservation = await serviceRepository.findReservationById(reservationId);

  if (!reservation) {
    throw {
      status: 404,
      message: "Reservation not found",
    };
  }

  if (employeeId) {
    const employee = await serviceRepository.findEmployeeById(employeeId);

    if (!employee) {
      throw {
        status: 404,
        message: "Employee not found",
      };
    }
  }

  if (serviceType === "Spa") {
    if (!clean(input.spaServiceType)) {
      throw {
        status: 400,
        message: "spaServiceType is required for Spa service",
      };
    }

    if (!input.durationMinutes || Number(input.durationMinutes) <= 0) {
      throw {
        status: 400,
        message: "durationMinutes must be greater than 0 for Spa service",
      };
    }
  }

  if (serviceType === "Shuttle") {
    if (
      !clean(input.pickupTime) ||
      !clean(input.arrivalDestination) ||
      !clean(input.departureDestination) ||
      !input.numberOfPeople
    ) {
      throw {
        status: 400,
        message:
          "pickupTime, arrivalDestination, departureDestination, and numberOfPeople are required for Shuttle service",
      };
    }

    if (Number(input.numberOfPeople) < 1) {
      throw {
        status: 400,
        message: "numberOfPeople must be at least 1",
      };
    }
  }

  const service = await serviceRepository.createServiceWithSubtype({
    reservationId,
    roomNumber: reservation.RoomNumber,
    serviceType,
    requestStatus: "Pending",
    servicePrice,
    employeeId,

    itemDescription: clean(input.itemDescription) || null,

    spaServiceType: clean(input.spaServiceType) || null,
    durationMinutes: input.durationMinutes ? Number(input.durationMinutes) : null,

    pickupTime: clean(input.pickupTime) || null,
    dropoffTime: clean(input.dropoffTime) || null,
    arrivalDestination: clean(input.arrivalDestination) || null,
    departureDestination: clean(input.departureDestination) || null,
    numberOfPeople: input.numberOfPeople ? Number(input.numberOfPeople) : null,
  });

  return {
    success: true,
    message: "Service request created successfully",
    service,
  };
}

export async function updateServiceStatus(
  serviceId: number,
  input: UpdateServiceStatusInput
) {
  const requestStatus = clean(input.requestStatus);

  if (!serviceId) {
    throw {
      status: 400,
      message: "Service ID is required",
    };
  }

  requireEnum(requestStatus, SERVICE_STATUSES, "requestStatus");

  const service = await serviceRepository.findServiceById(serviceId);

  if (!service) {
    throw {
      status: 404,
      message: "Service not found",
    };
  }

  await serviceRepository.updateServiceStatus(serviceId, requestStatus);

  return {
    success: true,
    message: "Service status updated successfully",
    serviceId,
    requestStatus,
  };
}