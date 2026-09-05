import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createGuestSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "firstName is required")
    .max(100),

  lastName: z
    .string()
    .trim()
    .min(1, "lastName is required")
    .max(100),

  dateOfBirth: z
    .string()
    .regex(
      dateRegex,
      "dateOfBirth must be in YYYY-MM-DD format"
    ),

  phoneNumber: z
    .string()
    .trim()
    .min(5, "phoneNumber is required")
    .max(30),

  email: z
    .string()
    .trim()
    .email("Email must be valid")
    .transform((value) => value.toLowerCase()),

  membershipLevel: z.enum([
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
  ]),

  preferredRoomType: z
    .enum([
      "King",
      "Queen",
      "Deluxe",
      "Accessible",
    ])
    .optional(),

  purposeOfVisit: z
    .enum([
      "Business",
      "Leisure",
      "Travel",
      "Nearby Attractions",
      "Social Gathering",
    ])
    .optional(),

  cardType: z.enum([
    "Visa",
    "MasterCard",
    "Amex",
    "Discover",
    "Cash",
    "Bank Transfer",
  ]),

  cardLastFour: z
    .string()
    .regex(
      /^\d{4}$/,
      "cardLastFour must be exactly 4 digits"
    )
    .optional(),

  billingAddress: z
    .string()
    .trim()
    .max(300)
    .optional(),
});