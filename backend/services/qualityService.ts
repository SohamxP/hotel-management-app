import { prisma } from "../prismaClient";
import { askOpenAI } from "./openaiService";

type QualityRisk = "High" | "Medium" | "Low";

function normalizeBigInts<T>(value: T): T {
  if (typeof value === "bigint") {
    return Number(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      normalizeBigInts(item)
    ) as T;
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const output: any = {};

    for (const [key, item] of Object.entries(
      value as any
    )) {
      output[key] =
        normalizeBigInts(item);
    }

    return output;
  }

  return value;
}

async function queryRows(
  sql: string
): Promise<any[]> {
  const result =
    await prisma.$queryRawUnsafe<any[]>(
      sql
    );

  return normalizeBigInts(result);
}

async function queryOne(
  sql: string
): Promise<any> {
  const rows =
    await queryRows(sql);

  return rows[0] ?? null;
}

function numberValue(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function money(value: unknown) {
  return `$${numberValue(value).toFixed(2)}`;
}

function ratingRisk(avgRating: number): QualityRisk {
  if (avgRating < 3.6) return "High";
  if (avgRating < 4.1) return "Medium";
  return "Low";
}

function priorityLabel(risk: QualityRisk) {
  if (risk === "High") return "Recover immediately";
  if (risk === "Medium") return "Review this week";
  return "Monitor";
}

export async function getQualityEngine() {
  const [
    feedbackSummary,
    feedbackCases,
    roomTypeQuality,
    serviceQuality,
    complaintPatterns,
    topRecoveryGuests,
  ] = await Promise.all([
    queryOne(`
      SELECT
        COUNT(*) AS "feedbackCount",

        ROUND(
          AVG(
            (
              COALESCE("RoomRating", 0) +
              COALESCE("BreakfastRating", 0) +
              COALESCE("SafetyRating", 0) +
              COALESCE("CustSvcRating", 0)
            ) / 4.0
          )::numeric,
          2
        ) AS "avgOverallRating",

        ROUND(
          AVG("RoomRating")::numeric,
          2
        ) AS "avgRoomRating",

        ROUND(
          AVG("BreakfastRating")::numeric,
          2
        ) AS "avgBreakfastRating",

        ROUND(
          AVG("SafetyRating")::numeric,
          2
        ) AS "avgSafetyRating",

        ROUND(
          AVG("CustSvcRating")::numeric,
          2
        ) AS "avgCustSvcRating",

        SUM(
          CASE
            WHEN (
              (
                COALESCE("RoomRating", 0) +
                COALESCE("BreakfastRating", 0) +
                COALESCE("SafetyRating", 0) +
                COALESCE("CustSvcRating", 0)
              ) / 4.0
            ) <= 3.6
            THEN 1
            ELSE 0
          END
        ) AS "lowRatingCount"

      FROM "Feedback"
    `),

    queryRows(`
      SELECT
        f."FeedbackID",
        f."ReservationID",

        g."GuestID",
        g."FirstName",
        g."LastName",
        g."Email",

        m."MembershipLevel"::text
          AS "MembershipLevel",

        r."RoomNumber",

        ro."RoomType"::text
          AS "RoomType",

        r."CheckInDate",
        r."CheckOutDate",
        r."TotalPrice",

        f."RoomRating",
        f."BreakfastRating",
        f."SafetyRating",
        f."CustSvcRating",

        ROUND(
          (
            (
              COALESCE(f."RoomRating", 0) +
              COALESCE(f."BreakfastRating", 0) +
              COALESCE(f."SafetyRating", 0) +
              COALESCE(f."CustSvcRating", 0)
            ) / 4.0
          )::numeric,
          2
        ) AS "AvgRating",

        CASE
          WHEN COALESCE(f."RoomRating", 5)
            <= COALESCE(f."BreakfastRating", 5)

           AND COALESCE(f."RoomRating", 5)
            <= COALESCE(f."SafetyRating", 5)

           AND COALESCE(f."RoomRating", 5)
            <= COALESCE(f."CustSvcRating", 5)

          THEN 'Room'

          WHEN COALESCE(f."BreakfastRating", 5)
            <= COALESCE(f."RoomRating", 5)

           AND COALESCE(f."BreakfastRating", 5)
            <= COALESCE(f."SafetyRating", 5)

           AND COALESCE(f."BreakfastRating", 5)
            <= COALESCE(f."CustSvcRating", 5)

          THEN 'Breakfast'

          WHEN COALESCE(f."SafetyRating", 5)
            <= COALESCE(f."RoomRating", 5)

           AND COALESCE(f."SafetyRating", 5)
            <= COALESCE(f."BreakfastRating", 5)

           AND COALESCE(f."SafetyRating", 5)
            <= COALESCE(f."CustSvcRating", 5)

          THEN 'Safety'

          ELSE 'Customer Service'
        END AS "WeakestCategory",

        f."Comments",
        f."SubmissionDate"

      FROM "Feedback" f

      JOIN "Reservation" r
        ON r."ReservationID" =
           f."ReservationID"

      JOIN "Guest" g
        ON g."GuestID" =
           r."GuestID"

      JOIN "Room" ro
        ON ro."RoomNumber" =
           r."RoomNumber"

      LEFT JOIN "Membership" m
        ON m."GuestID" =
           g."GuestID"

      WHERE
        (
          (
            COALESCE(f."RoomRating", 0) +
            COALESCE(f."BreakfastRating", 0) +
            COALESCE(f."SafetyRating", 0) +
            COALESCE(f."CustSvcRating", 0)
          ) / 4.0
        ) <= 4.0

        OR LOWER(
          COALESCE(f."Comments", '')
        ) LIKE '%slow%'

        OR LOWER(
          COALESCE(f."Comments", '')
        ) LIKE '%noisy%'

        OR LOWER(
          COALESCE(f."Comments", '')
        ) LIKE '%average%'

        OR LOWER(
          COALESCE(f."Comments", '')
        ) LIKE '%pressure%'

        OR LOWER(
          COALESCE(f."Comments", '')
        ) LIKE '%small%'

      ORDER BY
        "AvgRating" ASC,
        f."SubmissionDate" DESC

      LIMIT 12
    `),

    queryRows(`
      SELECT
        ro."RoomType"::text
          AS "RoomType",

        COUNT(f."FeedbackID")
          AS "feedbackCount",

        ROUND(
          AVG(
            (
              COALESCE(f."RoomRating", 0) +
              COALESCE(f."BreakfastRating", 0) +
              COALESCE(f."SafetyRating", 0) +
              COALESCE(f."CustSvcRating", 0)
            ) / 4.0
          )::numeric,
          2
        ) AS "avgOverallRating",

        ROUND(
          AVG(f."RoomRating")::numeric,
          2
        ) AS "avgRoomRating",

        ROUND(
          AVG(f."BreakfastRating")::numeric,
          2
        ) AS "avgBreakfastRating",

        ROUND(
          AVG(f."SafetyRating")::numeric,
          2
        ) AS "avgSafetyRating",

        ROUND(
          AVG(f."CustSvcRating")::numeric,
          2
        ) AS "avgCustSvcRating",

        SUM(
          CASE
            WHEN (
              (
                COALESCE(f."RoomRating", 0) +
                COALESCE(f."BreakfastRating", 0) +
                COALESCE(f."SafetyRating", 0) +
                COALESCE(f."CustSvcRating", 0)
              ) / 4.0
            ) <= 3.6
            THEN 1
            ELSE 0
          END
        ) AS "lowRatingCount"

      FROM "Feedback" f

      JOIN "Reservation" r
        ON r."ReservationID" =
           f."ReservationID"

      JOIN "Room" ro
        ON ro."RoomNumber" =
           r."RoomNumber"

      GROUP BY ro."RoomType"

      ORDER BY
        "avgOverallRating" ASC,
        "lowRatingCount" DESC
    `),

    queryRows(`
      SELECT
        s."ServiceType"::text
          AS "ServiceType",

        COUNT(
          DISTINCT s."ServiceID"
        ) AS "serviceCount",

        COUNT(
          DISTINCT f."FeedbackID"
        ) AS "feedbackCount",

        ROUND(
          SUM(s."ServicePrice")::numeric,
          2
        ) AS "serviceRevenue",

        ROUND(
          AVG(
            (
              COALESCE(f."RoomRating", 0) +
              COALESCE(f."BreakfastRating", 0) +
              COALESCE(f."SafetyRating", 0) +
              COALESCE(f."CustSvcRating", 0)
            ) / 4.0
          )::numeric,
          2
        ) AS "avgFeedbackRating",

        SUM(
          CASE
            WHEN LOWER(
              COALESCE(f."Comments", '')
            ) LIKE '%slow%'
            THEN 1
            ELSE 0
          END
        ) AS "slowMentions",

        SUM(
          CASE
            WHEN LOWER(
              COALESCE(f."Comments", '')
            ) LIKE '%average%'
            THEN 1
            ELSE 0
          END
        ) AS "averageMentions"

      FROM "Service" s

      JOIN "Reservation" r
        ON r."ReservationID" =
           s."ReservationID"

      LEFT JOIN "Feedback" f
        ON f."ReservationID" =
           r."ReservationID"

      WHERE s."RequestStatus"::text =
            'Completed'

      GROUP BY s."ServiceType"

      ORDER BY
        "avgFeedbackRating" ASC,
        "slowMentions" DESC
    `),

    queryOne(`
      SELECT
        SUM(
          CASE
            WHEN LOWER(
              COALESCE("Comments", '')
            ) LIKE '%slow%'
            THEN 1
            ELSE 0
          END
        ) AS "slowMentions",

        SUM(
          CASE
            WHEN LOWER(
              COALESCE("Comments", '')
            ) LIKE '%noisy%'
            THEN 1
            ELSE 0
          END
        ) AS "noisyMentions",

        SUM(
          CASE
            WHEN LOWER(
              COALESCE("Comments", '')
            ) LIKE '%average%'
            THEN 1
            ELSE 0
          END
        ) AS "averageMentions",

        SUM(
          CASE
            WHEN LOWER(
              COALESCE("Comments", '')
            ) LIKE '%breakfast%'
            THEN 1
            ELSE 0
          END
        ) AS "breakfastMentions",

        SUM(
          CASE
            WHEN LOWER(
              COALESCE("Comments", '')
            ) LIKE '%service%'
            THEN 1
            ELSE 0
          END
        ) AS "serviceMentions",

        SUM(
          CASE
            WHEN LOWER(
              COALESCE("Comments", '')
            ) LIKE '%small%'
            THEN 1
            ELSE 0
          END
        ) AS "roomSizeMentions"

      FROM "Feedback"
    `),

    queryRows(`
      SELECT
        g."GuestID",
        g."FirstName",
        g."LastName",
        g."Email",

        m."MembershipLevel"::text
          AS "MembershipLevel",

        COUNT(r."ReservationID")
          AS "reservationCount",

        ROUND(
          SUM(r."TotalPrice")::numeric,
          2
        ) AS "totalSpent",

        ROUND(
          AVG(
            (
              COALESCE(f."RoomRating", 0) +
              COALESCE(f."BreakfastRating", 0) +
              COALESCE(f."SafetyRating", 0) +
              COALESCE(f."CustSvcRating", 0)
            ) / 4.0
          )::numeric,
          2
        ) AS "avgFeedbackRating",

        MIN(
          (
            COALESCE(f."RoomRating", 0) +
            COALESCE(f."BreakfastRating", 0) +
            COALESCE(f."SafetyRating", 0) +
            COALESCE(f."CustSvcRating", 0)
          ) / 4.0
        ) AS "lowestFeedbackRating"

      FROM "Guest" g

      JOIN "Reservation" r
        ON r."GuestID" =
           g."GuestID"

      JOIN "Feedback" f
        ON f."ReservationID" =
           r."ReservationID"

      LEFT JOIN "Membership" m
        ON m."GuestID" =
           g."GuestID"

      GROUP BY
        g."GuestID",
        g."FirstName",
        g."LastName",
        g."Email",
        m."MembershipLevel"

      HAVING MIN(
        (
          COALESCE(f."RoomRating", 0) +
          COALESCE(f."BreakfastRating", 0) +
          COALESCE(f."SafetyRating", 0) +
          COALESCE(f."CustSvcRating", 0)
        ) / 4.0
      ) <= 4.0

      ORDER BY
        "totalSpent" DESC,
        "lowestFeedbackRating" ASC

      LIMIT 8
    `),
  ]);

  const avgOverallRating = numberValue(feedbackSummary?.avgOverallRating);
  const lowRatingCount = numberValue(feedbackSummary?.lowRatingCount);
  const totalFeedback = numberValue(feedbackSummary?.feedbackCount);

  const weakestRoomType = roomTypeQuality[0];
  const weakestServiceType = serviceQuality[0];

  const recoveryOpportunities = [];

  for (const item of feedbackCases.slice(0, 6)) {
    const risk = ratingRisk(numberValue(item.AvgRating));

    recoveryOpportunities.push({
      id: `Q-${item.FeedbackID}`,
      risk,
      title: `${item.FirstName} ${item.LastName} needs follow-up`,
      description: `Feedback average is ${item.AvgRating}/5. Weakest area: ${item.WeakestCategory}.`,
      target: `${item.FirstName} ${item.LastName}`,
      source: `Feedback #${item.FeedbackID}`,
      priority: priorityLabel(risk),
      recommendation:
        risk === "High"
          ? "Send a recovery message, acknowledge the exact issue, and offer a practical service recovery."
          : "Review the feedback and send a short follow-up before the guest sentiment gets worse.",
      comments: item.Comments,
    });
  }

  if (weakestRoomType) {
    const risk = ratingRisk(numberValue(weakestRoomType.avgOverallRating));

    recoveryOpportunities.push({
      id: "Q-ROOMTYPE",
      risk,
      title: `${weakestRoomType.RoomType} rooms show satisfaction risk`,
      description: `${weakestRoomType.RoomType} rooms average ${weakestRoomType.avgOverallRating}/5 across ${weakestRoomType.feedbackCount} feedback record(s).`,
      target: weakestRoomType.RoomType,
      source: "Room type satisfaction",
      priority: priorityLabel(risk),
      recommendation:
        "Inspect room readiness, maintenance issues, cleanliness, and expectation mismatch for this room type.",
      comments: null,
    });
  }

  if (weakestServiceType) {
    const risk = ratingRisk(numberValue(weakestServiceType.avgFeedbackRating));

    recoveryOpportunities.push({
      id: "Q-SERVICE",
      risk,
      title: `${weakestServiceType.ServiceType} may be affecting ratings`,
      description: `${weakestServiceType.ServiceType} is linked to an average feedback rating of ${weakestServiceType.avgFeedbackRating}/5.`,
      target: weakestServiceType.ServiceType,
      source: "Service quality correlation",
      priority: priorityLabel(risk),
      recommendation:
        "Review service timing, staffing, and handoff quality for this service type.",
      comments: null,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalFeedback,
      avgOverallRating,
      lowRatingCount,
      qualityRisk:
        avgOverallRating < 3.8 || lowRatingCount >= 5
          ? "High"
          : avgOverallRating < 4.2 || lowRatingCount >= 2
          ? "Medium"
          : "Low",
      weakestRoomType: weakestRoomType?.RoomType || "N/A",
      weakestRoomTypeRating: numberValue(weakestRoomType?.avgOverallRating),
      weakestServiceType: weakestServiceType?.ServiceType || "N/A",
      weakestServiceRating: numberValue(weakestServiceType?.avgFeedbackRating),
      highValueRecoveryGuests: topRecoveryGuests.length,
    },
    metrics: [
      {
        label: "Average Rating",
        value: `${avgOverallRating}/5`,
        detail: "Overall feedback average",
      },
      {
        label: "Low Feedback",
        value: String(lowRatingCount),
        detail: "Feedback records at or below 3.6",
      },
      {
        label: "Weakest Room Type",
        value: weakestRoomType?.RoomType || "N/A",
        detail: weakestRoomType
          ? `${weakestRoomType.avgOverallRating}/5 average`
          : "No room type data",
      },
      {
        label: "Weakest Service",
        value: weakestServiceType?.ServiceType || "N/A",
        detail: weakestServiceType
          ? `${weakestServiceType.avgFeedbackRating}/5 average`
          : "No service data",
      },
    ],
    feedbackCases,
    roomTypeQuality,
    serviceQuality,
    complaintPatterns,
    topRecoveryGuests: topRecoveryGuests.map((guest: any) => ({
      ...guest,
      totalSpentLabel: money(guest.totalSpent),
    })),
    recoveryOpportunities,
  };
}

export async function createQualityImprovementPlan() {
  const qualityData = await getQualityEngine();

  const plan = await askOpenAI(
    `Create a hotel service quality improvement plan.

Use these headings:
1. Biggest Guest Satisfaction Risks
2. Root Causes
3. Guest Recovery Actions
4. Staff / Operations Fixes
5. What To Do In The Next 24 Hours
6. What To Track This Week

Keep it practical. Do not invent numbers. Use only the provided hotel data.`,
    qualityData
  );

  return {
    generatedAt: new Date().toISOString(),
    plan,
    qualityData,
  };
}

export async function createGuestRecoveryDraft(feedbackId: number) {
  if (!feedbackId) {
    throw {
      status: 400,
      message: "Feedback ID is required",
    };
  }

  const qualityData = await getQualityEngine();

  const feedbackCase = qualityData.feedbackCases.find(
    (item: any) => Number(item.FeedbackID) === Number(feedbackId)
  );

  if (!feedbackCase) {
    throw {
      status: 404,
      message: "Feedback case not found",
    };
  }

  const draft = await askOpenAI(
    `Write a professional guest recovery email draft for this hotel guest.

Rules:
- Be specific to the complaint.
- Apologize without sounding fake.
- Mention the issue category.
- Offer a practical recovery action.
- Keep it under 180 words.
- Do not mention internal database IDs in the email body.`,
    {
      feedbackCase,
    }
  );

  return {
    generatedAt: new Date().toISOString(),
    feedbackCase,
    draft,
  };
}