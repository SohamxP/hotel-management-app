import * as aiRepository from "../repositories/aiRepository";

type Recommendation = {
  title: string;
  priority: "High" | "Medium" | "Low";
  reason: string;
  action: string;
};

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function money(value: number) {
  return `$${value.toFixed(2)}`;
}

function buildRecommendations(input: {
  summary: any;
  roomTypePerformance: any[];
  serviceStatusBreakdown: any[];
  serviceRevenueByType: any[];
  recentLowFeedback: any[];
}): Recommendation[] {
  const recommendations: Recommendation[] = [];

  const totalRooms = numberValue(input.summary.totalRooms);
  const availableRooms = numberValue(input.summary.availableRooms);
  const blockedRooms = numberValue(input.summary.blockedRooms);
  const pendingServices = numberValue(input.summary.pendingServices);
  const inProgressServices = numberValue(input.summary.inProgressServices);
  const avgBreakfastRating = numberValue(input.summary.avgBreakfastRating);
  const avgCustomerServiceRating = numberValue(
    input.summary.avgCustomerServiceRating
  );

  const availabilityRate = percent(availableRooms, totalRooms);

  if (availabilityRate < 25) {
    recommendations.push({
      title: "Availability is getting tight",
      priority: "High",
      reason: `Only ${availabilityRate}% of rooms are currently available.`,
      action:
        "Review cancelled/no-show reservations, release rooms that are ready, and avoid blocking extra rooms unless maintenance requires it.",
    });
  } else {
    recommendations.push({
      title: "Use available rooms to drive bookings",
      priority: "Medium",
      reason: `${availableRooms} of ${totalRooms} rooms are still available.`,
      action:
        "Prioritize selling the available room types with lower demand before peak check-in hours.",
    });
  }

  if (blockedRooms > 0) {
    recommendations.push({
      title: "Blocked rooms need review",
      priority: blockedRooms >= 3 ? "High" : "Medium",
      reason: `${blockedRooms} room${blockedRooms === 1 ? " is" : "s are"} blocked and cannot be reserved.`,
      action:
        "Check whether these rooms are still under maintenance. Move finished rooms back to Available.",
    });
  }

  if (pendingServices + inProgressServices > 0) {
    recommendations.push({
      title: "Service queue needs attention",
      priority: pendingServices >= 5 ? "High" : "Medium",
      reason: `${pendingServices} service request${pendingServices === 1 ? " is" : "s are"} pending and ${inProgressServices} in progress.`,
      action:
        "Assign pending requests to employees and update completed requests so the service dashboard stays accurate.",
    });
  }

  const topService = input.serviceRevenueByType[0];

  if (topService) {
    recommendations.push({
      title: `${topService.ServiceType} is the strongest service revenue source`,
      priority: "Low",
      reason: `${topService.ServiceType} generated ${money(
        numberValue(topService.totalRevenue)
      )} across ${topService.serviceCount} requests.`,
      action:
        "Feature this service during check-in and suggest it to guests with matching reservation types.",
    });
  }

  const weakestRoomType = [...input.roomTypePerformance].sort(
    (a, b) => numberValue(b.availableRooms) - numberValue(a.availableRooms)
  )[0];

  if (weakestRoomType && numberValue(weakestRoomType.availableRooms) > 0) {
    recommendations.push({
      title: `${weakestRoomType.RoomType} rooms have the most open inventory`,
      priority: "Medium",
      reason: `${weakestRoomType.availableRooms} ${weakestRoomType.RoomType} room${
        Number(weakestRoomType.availableRooms) === 1 ? " is" : "s are"
      } available at an average rate of ${money(
        numberValue(weakestRoomType.avgRate)
      )}.`,
      action:
        "Use this room type for upgrade offers, discounts, or front-desk recommendations.",
    });
  }

  if (avgBreakfastRating > 0 && avgBreakfastRating < 4) {
    recommendations.push({
      title: "Breakfast experience is below target",
      priority: "Medium",
      reason: `Average breakfast rating is ${avgBreakfastRating}/5.`,
      action:
        "Review low-rating feedback comments and improve breakfast timing, variety, or quality.",
    });
  }

  if (avgCustomerServiceRating > 0 && avgCustomerServiceRating < 4.2) {
    recommendations.push({
      title: "Customer service ratings need improvement",
      priority: "Medium",
      reason: `Average customer service rating is ${avgCustomerServiceRating}/5.`,
      action:
        "Use recent low feedback to coach front desk, room service, and concierge staff.",
    });
  }

  if (input.recentLowFeedback.length > 0) {
    recommendations.push({
      title: "Follow up with unhappy guests",
      priority: "High",
      reason: `${input.recentLowFeedback.length} recent feedback record${
        input.recentLowFeedback.length === 1 ? " has" : "s have"
      } at least one rating of 3 or below.`,
      action:
        "Contact these guests, log the issue, and offer a service recovery action if appropriate.",
    });
  }

  return recommendations.slice(0, 7);
}

export async function getInsights() {
  const [
    summary,
    roomTypePerformance,
    reservationStatusBreakdown,
    serviceStatusBreakdown,
    serviceRevenueByType,
    topGuests,
    recentLowFeedback,
  ] = await Promise.all([
    aiRepository.getOperationalSummary(),
    aiRepository.getRoomTypePerformance(),
    aiRepository.getReservationStatusBreakdown(),
    aiRepository.getServiceStatusBreakdown(),
    aiRepository.getServiceRevenueByType(),
    aiRepository.getTopGuests(),
    aiRepository.getRecentLowFeedback(),
  ]);

  const recommendations = buildRecommendations({
    summary,
    roomTypePerformance,
    serviceStatusBreakdown,
    serviceRevenueByType,
    recentLowFeedback,
  });

  return {
    generatedAt: new Date().toISOString(),
    summary,
    roomTypePerformance,
    reservationStatusBreakdown,
    serviceStatusBreakdown,
    serviceRevenueByType,
    topGuests,
    recentLowFeedback,
    recommendations,
  };
}