import request from "supertest";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import * as reservationRepository from "../repositories/reservationRepository";
import { prisma } from "../prismaClient";

import {
  removeTestDatabase,
  resetTestDatabase,
} from "./setup";

let app: any;
let token: string;
let cancellableReservationId: number;

beforeAll(async () => {
  await resetTestDatabase();

  const appModule = await import("../app");
  app = appModule.default;

  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      username: "admin",
      password: "admin123",
    });

  token = loginResponse.body.token;
});

afterAll(() => {
  removeTestDatabase();
});

describe("Reservations", () => {
  it("creates a valid reservation", async () => {
    const response = await request(app)
      .post("/api/reservations")
      .set(
        "Authorization",
        `Bearer ${token}`
      )
      .send({
        guestId: 91001,
        roomNumber: 90101,
        checkInDate: "2026-09-10",
        checkOutDate: "2026-09-15",
        paymentMode: "Credit Card",
      });

    expect(response.status).toBe(201);

    expect(response.body).toMatchObject({
      success: true,
      message:
        "Reservation created successfully",
    });

    expect(
      response.body.reservation
    ).toMatchObject({
      guestId: 91001,
      roomNumber: 90101,
      checkInDate: "2026-09-10",
      checkOutDate: "2026-09-15",
      nights: 5,
      status: "Confirmed",
    });
  });

  it("rejects an overlapping reservation", async () => {
    const response = await request(app)
      .post("/api/reservations")
      .set(
        "Authorization",
        `Bearer ${token}`
      )
      .send({
        guestId: 91002,
        roomNumber: 90101,
        checkInDate: "2026-09-12",
        checkOutDate: "2026-09-17",
        paymentMode: "Credit Card",
      });

    expect(response.status).toBe(409);

    expect(response.body).toMatchObject({
      success: false,
      error:
        "Room is already reserved for the selected dates",
    });
  });

  it("allows a reservation beginning on the previous checkout date", async () => {
    const response = await request(app)
      .post("/api/reservations")
      .set(
        "Authorization",
        `Bearer ${token}`
      )
      .send({
        guestId: 91002,
        roomNumber: 90101,
        checkInDate: "2026-09-15",
        checkOutDate: "2026-09-18",
        paymentMode: "Credit Card",
      });

    expect(response.status).toBe(201);
  });

  it("rejects checkout before checkin", async () => {
    const response = await request(app)
      .post("/api/reservations")
      .set(
        "Authorization",
        `Bearer ${token}`
      )
      .send({
        guestId: 91003,
        roomNumber: 90101,
        checkInDate: "2026-10-20",
        checkOutDate: "2026-10-10",
        paymentMode: "Credit Card",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Validation failed"
    );
  });

  it("rejects an unsupported payment mode", async () => {
    const response = await request(app)
      .post("/api/reservations")
      .set(
        "Authorization",
        `Bearer ${token}`
      )
      .send({
        guestId: 91003,
        roomNumber: 90101,
        checkInDate: "2026-10-10",
        checkOutDate: "2026-10-12",
        paymentMode: "Bitcoin",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Validation failed"
    );
  });

  it("rejects a nonexistent guest", async () => {
    const response = await request(app)
      .post("/api/reservations")
      .set(
        "Authorization",
        `Bearer ${token}`
      )
      .send({
        guestId: 999999,
        roomNumber: 90101,
        checkInDate: "2026-10-10",
        checkOutDate: "2026-10-12",
        paymentMode: "Credit Card",
      });

    expect(response.status).toBe(404);

    expect(response.body).toMatchObject({
      success: false,
      error: "Guest not found",
    });
  });

  it("rejects a nonexistent room", async () => {
    const response = await request(app)
      .post("/api/reservations")
      .set(
        "Authorization",
        `Bearer ${token}`
      )
      .send({
        guestId: 91003,
        roomNumber: 999999,
        checkInDate: "2026-10-10",
        checkOutDate: "2026-10-12",
        paymentMode: "Credit Card",
      });

    expect(response.status).toBe(404);

    expect(response.body).toMatchObject({
      success: false,
      error: "Room not found",
    });
  });

  it("rejects a blocked room", async () => {
    const response = await request(app)
      .post("/api/reservations")
      .set(
        "Authorization",
        `Bearer ${token}`
      )
      .send({
        guestId: 91003,
        roomNumber: 90106,
        checkInDate: "2026-10-10",
        checkOutDate: "2026-10-12",
        paymentMode: "Credit Card",
      });

    expect(response.status).toBe(400);

    expect(response.body).toMatchObject({
      success: false,
      error:
        "Room is blocked and cannot be reserved",
    });
  });

  it("creates a reservation that can later be cancelled", async () => {
    const response = await request(app)
      .post("/api/reservations")
      .set(
        "Authorization",
        `Bearer ${token}`
      )
      .send({
        guestId: 91004,
        roomNumber: 90102,
        checkInDate: "2026-11-10",
        checkOutDate: "2026-11-14",
        paymentMode: "Credit Card",
      });

    expect(response.status).toBe(201);

    cancellableReservationId =
      response.body.reservation.reservationId;

    expect(
      cancellableReservationId
    ).toBeDefined();
  });

  it("cancels an existing reservation", async () => {
    const response = await request(app)
      .patch(
        `/api/reservations/${cancellableReservationId}/cancel`
      )
      .set(
        "Authorization",
        `Bearer ${token}`
      );

    expect(response.status).toBe(200);

    expect(response.body).toMatchObject({
      success: true,
      message:
        "Reservation cancelled successfully",
      reservationId:
        cancellableReservationId,
    });
  });

  it("allows cancelled dates to be booked again", async () => {
    const response = await request(app)
      .post("/api/reservations")
      .set(
        "Authorization",
        `Bearer ${token}`
      )
      .send({
        guestId: 91005,
        roomNumber: 90102,
        checkInDate: "2026-11-10",
        checkOutDate: "2026-11-14",
        paymentMode: "Credit Card",
      });

    expect(response.status).toBe(201);
  });

  it("rolls back the reservation if linking the guest fails", async () => {
    const spy = vi
      .spyOn(
        reservationRepository,
        "addReservationGuest"
      )
      .mockRejectedValueOnce(
        new Error(
          "Forced guest-link failure"
        )
      );

    const response = await request(app)
      .post("/api/reservations")
      .set(
        "Authorization",
        `Bearer ${token}`
      )
      .send({
        guestId: 91006,
        roomNumber: 90103,
        checkInDate: "2026-12-10",
        checkOutDate: "2026-12-13",
        paymentMode: "Credit Card",
      });

    expect(response.status).toBe(500);

    spy.mockRestore();

    const reservation =
      await prisma.reservation.findFirst({
        where: {
          roomNumber: 90103,
          checkInDate: "2026-12-10",
          checkOutDate: "2026-12-13",
        },
      });

    expect(reservation).toBeNull();
  });
});