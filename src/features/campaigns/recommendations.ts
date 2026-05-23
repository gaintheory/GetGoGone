import { activeChannelModules } from "./channel-modules";
import { assessVehicleReadiness } from "../inventory/readiness";

type VehicleLike = Parameters<typeof assessVehicleReadiness>[0];
type Readiness = ReturnType<typeof assessVehicleReadiness>;

type Recommendation = {
  channelId: string;
  score: number;
  priority: "high" | "medium" | "low";
  reason: string;
  blocked?: boolean;
};

function hasBlocker(readiness: Readiness, issueId: string) {
  return readiness.issues.some((issue) => issue.id === issueId && issue.severity === "high");
}

function bodyText(vehicle: VehicleLike) {
  return `${vehicle.body || ""} ${vehicle.body_style || ""} ${vehicle.make || ""} ${vehicle.model || ""}`.toLowerCase();
}

function baseRecommendation(channelId: string, score: number, reason: string): Recommendation {
  return {
    channelId,
    score,
    priority: score >= 85 ? "high" : score >= 68 ? "medium" : "low",
    reason,
  };
}

export function recommendCampaignChannels(vehicle: VehicleLike, readiness = assessVehicleReadiness(vehicle)) {
  const recommendations: Recommendation[] = [];
  const missingPhoto = hasBlocker(readiness, "missing_photo");
  const missingDown = hasBlocker(readiness, "missing_down");
  const missingPrice = hasBlocker(readiness, "missing_price");
  const text = bodyText(vehicle);

  if (readiness.status !== "blocked") {
    recommendations.push(baseRecommendation("google_business", 96, "Free local visibility and strong fit for every marketable vehicle."));
    recommendations.push(baseRecommendation("craigslist", 82, "Low-cost local demand and manual assisted publishing is available now."));
    recommendations.push(baseRecommendation("cars_com", 76, "Good marketplace package for shoppers comparing inventory."));
    recommendations.push(baseRecommendation("autotrader", 72, "Useful assisted package for higher-intent marketplace shoppers."));
  }

  if (!missingDown && !missingPrice) {
    recommendations.push(baseRecommendation("google_ads", 90, "Finance and availability details are strong enough for paid search planning."));
    recommendations.push(baseRecommendation("meta_paid", missingPhoto ? 62 : 88, missingPhoto ? "Paid social needs creative before launch." : "Good fit for paid reach, leads, and Spanish/bilingual campaigns."));
  }

  if (!missingPhoto) {
    recommendations.push(baseRecommendation("instagram_organic", 78, "Photo-ready vehicle can support visual social posts and stories."));
    recommendations.push(baseRecommendation("short_video", 70, "Photo/video assets can support a script, shot list, and short-form package."));
  }

  if (/truck|pickup|van|cargo|transit|promaster|express|f-?150|f-?250|silverado|ram/.test(text)) {
    recommendations.push(baseRecommendation("linkedin_commercial", 74, "Work-use vehicle can be positioned for business buyers."));
  }

  recommendations.push(baseRecommendation("sms_email", 58, "Useful later for existing leads once consent and lead segments are available."));

  const blocked = activeChannelModules
    .filter((module) => !recommendations.some((item) => item.channelId === module.id))
    .map((module) => ({
      channelId: module.id,
      score: 35,
      priority: "low" as const,
      reason: missingPhoto || missingDown || missingPrice
        ? "Fix vehicle readiness blockers before prioritizing this channel."
        : "Available, but not a top recommendation for this vehicle.",
      blocked: missingPhoto || missingDown || missingPrice,
    }));

  return [...recommendations, ...blocked]
    .filter((item, index, list) => list.findIndex((match) => match.channelId === item.channelId) === index)
    .sort((a, b) => b.score - a.score)
    .map((item) => ({
      ...item,
      module: activeChannelModules.find((module) => module.id === item.channelId) || null,
    }));
}

export function topRecommendedChannelIds(vehicle: VehicleLike, readiness = assessVehicleReadiness(vehicle), limit = 7) {
  return recommendCampaignChannels(vehicle, readiness)
    .filter((item) => !item.blocked && item.score >= 68)
    .slice(0, limit)
    .map((item) => item.channelId);
}
