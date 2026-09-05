import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../prismaClient";
import {
  createGuestWithDetails,
  findAllGuests,
  findGuestById,
} from "../repositories/guestRepository";

describe("guestRepository with Prisma", () => {
  beforeEach(async () => {
    await prisma.paymentInfo.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.reservationGuest.deleteMany();
    await prisma.reservation.deleteMany();
    await prisma.guest.deleteMany();
  });

  it("creates a guest with membership and payment details", async () => {
    const guest = await createGuestWithDetails({
      firstName: "Test",
      lastName: "Guest",
      dateOfBirth: "2000-01-01",
      phoneNumber: "5551112222",
      email: "testguest@example.com",
      membershipLevel: "Gold",
      preferredRoomType: "King",
      purposeOfVisit: "Leisure",
      cardType: "Visa",
      cardLastFour: "1234",
      billingAddress: "123 Test Street",
    });

    expect(guest).toMatchObject({
      FirstName: "Test",
      LastName: "Guest",
      MembershipLevel: "Gold",
      PreferredRoomType: "King",
      PurposeOfVisit: "Leisure",
      CardType: "Visa",
      CardLastFour: "1234",
    });
  });

  it("finds a guest by id", async () => {
    const created = await createGuestWithDetails({
      firstName: "Alice",
      lastName: "Smith",
      dateOfBirth: "1999-05-10",
      phoneNumber: "5553334444",
      email: "alice@example.com",
      membershipLevel: "Silver",
      preferredRoomType: "Queen",
      purposeOfVisit: "Business",
      cardType: "MasterCard",
      cardLastFour: "9876",
      billingAddress: "456 Main Street",
    });

    const guest = await findGuestById(created!.GuestID);

    expect(guest).toMatchObject({
      GuestID: created!.GuestID,
      FirstName: "Alice",
      LastName: "Smith",
      MembershipLevel: "Silver",
    });
  });

  it("returns undefined for a nonexistent guest", async () => {
    const guest = await findGuestById(999999);

    expect(guest).toBeUndefined();
  });

  it("returns all guests", async () => {
    await createGuestWithDetails({
      firstName: "Bob",
      lastName: "Jones",
      dateOfBirth: "1995-02-20",
      phoneNumber: "5559990000",
      email: "bob@example.com",
      membershipLevel: "Bronze",
      preferredRoomType: null,
      purposeOfVisit: null,
      cardType: "Cash",
      cardLastFour: null,
      billingAddress: null,
    });

    const guests = await findAllGuests();

    expect(guests).toHaveLength(1);
    expect(guests[0]).toMatchObject({
      FirstName: "Bob",
      LastName: "Jones",
      ReservationCount: 0,
      TotalSpent: 0,
    });
  });

  it("rejects duplicate email addresses", async () => {
    const baseGuest = {
      firstName: "First",
      lastName: "Guest",
      dateOfBirth: "2000-01-01",
      membershipLevel: "Gold",
      preferredRoomType: "King",
      purposeOfVisit: "Leisure",
      cardType: "Visa",
      cardLastFour: "1111",
      billingAddress: "Test Address",
    };

    await createGuestWithDetails({
      ...baseGuest,
      phoneNumber: "5551230001",
      email: "duplicate@example.com",
    });

    await expect(
      createGuestWithDetails({
        ...baseGuest,
        phoneNumber: "5551230002",
        email: "duplicate@example.com",
      })
    ).rejects.toThrow();
  });
});