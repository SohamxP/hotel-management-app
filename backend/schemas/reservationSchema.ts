import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createReservationSchema = z
  .object({
    guestId: z.coerce
      .number()
      .int()
      .positive("guestId must be a positive integer"),

    roomNumber: z.coerce
      .number()
      .int()
      .positive("roomNumber must be a positive integer"),

    checkInDate: z
      .string()
      .regex(
        dateRegex,
        "checkInDate must be in YYYY-MM-DD format"
      ),

    checkOutDate: z
      .string()
      .regex(
        dateRegex,
        "checkOutDate must be in YYYY-MM-DD format"
      ),

    paymentMode: z.enum([
      "Credit Card",
      "Debit Card",
      "Cash",
      "Bank Transfer",
      "Amex",
    ]),

    specialRequest: z
      .string()
      .trim()
      .max(500, "specialRequest must be 500 characters or fewer")
      .optional(),
  })
  .refine(
    (data) => {
      const checkIn = new Date(data.checkInDate);
      const checkOut = new Date(data.checkOutDate);

      return (
        !Number.isNaN(checkIn.getTime()) &&
        !Number.isNaN(checkOut.getTime()) &&
        checkOut > checkIn
      );
    },
    {
      message: "Check-out date must be after check-in date",
      path: ["checkOutDate"],
    }
  );