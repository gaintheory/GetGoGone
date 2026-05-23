type VehicleLike = {
  id?: string;
  vin?: string | null;
  year?: string | number | null;
  make?: string | null;
  model?: string | null;
  price?: string | number | null;
  down?: string | number | null;
  down_payment?: string | number | null;
  mileage?: string | number | null;
  photos?: string | number | null;
  imageUrl?: string | null;
  notes?: string | null;
  description?: string | null;
  website_copy?: string | null;
  campaign?: string | null;
  daysIn?: string | number | null;
  body?: string | null;
  body_style?: string | null;
};

type ReadinessContext = {
  hasCampaign?: boolean;
  hasSpanishCampaign?: boolean;
  hasCreative?: boolean;
};

type ReadinessIssue = {
  id: string;
  label: string;
  severity: "high" | "medium" | "low";
  agentAction: string;
};

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 12;
}

function isCommercialFit(vehicle: VehicleLike) {
  const body = String(vehicle.body || vehicle.body_style || "").toLowerCase();
  const model = `${vehicle.make || ""} ${vehicle.model || ""}`.toLowerCase();
  return /truck|pickup|van|cargo|transit|promaster|express|f-?150|f-?250|silverado|ram/.test(`${body} ${model}`);
}

export function assessVehicleReadiness(vehicle: VehicleLike, context: ReadinessContext = {}) {
  const issues: ReadinessIssue[] = [];
  const photos = asNumber(vehicle.photos) > 0 || Boolean(vehicle.imageUrl);
  const price = asNumber(vehicle.price) > 0;
  const down = asNumber(vehicle.down ?? vehicle.down_payment) > 0;
  const mileage = asNumber(vehicle.mileage) > 0;
  const description = hasText(vehicle.notes) || hasText(vehicle.description) || hasText(vehicle.website_copy);
  const hasCampaign = context.hasCampaign ?? !["", "draft", "none", "needs refresh"].includes(String(vehicle.campaign || "").toLowerCase());
  const hasSpanishCampaign = context.hasSpanishCampaign ?? false;
  const hasCreative = context.hasCreative ?? photos;
  const daysIn = asNumber(vehicle.daysIn);

  if (!photos) {
    issues.push({
      id: "missing_photo",
      label: "Needs vehicle photo",
      severity: "high",
      agentAction: "Open Designer or add photos before creating visual ads.",
    });
  }

  if (!price) {
    issues.push({
      id: "missing_price",
      label: "Missing price",
      severity: "high",
      agentAction: "Confirm price or use call-for-price language.",
    });
  }

  if (!down) {
    issues.push({
      id: "missing_down",
      label: "Missing approved down payment",
      severity: "high",
      agentAction: "Confirm approved down payment before finance-focused ads.",
    });
  }

  if (!mileage) {
    issues.push({
      id: "missing_mileage",
      label: "Missing mileage",
      severity: "medium",
      agentAction: "Add mileage before marketplace/listing packages.",
    });
  }

  if (!description) {
    issues.push({
      id: "missing_description",
      label: "Weak or missing description",
      severity: "medium",
      agentAction: "Generate factual vehicle description.",
    });
  }

  if (!hasCampaign) {
    issues.push({
      id: "missing_campaign",
      label: "No active campaign package",
      severity: "medium",
      agentAction: "Generate channel package.",
    });
  }

  if (!hasSpanishCampaign) {
    issues.push({
      id: "missing_spanish",
      label: "No Spanish campaign coverage",
      severity: "medium",
      agentAction: "Generate Spanish or bilingual package.",
    });
  }

  if (!hasCreative) {
    issues.push({
      id: "missing_creative",
      label: "No saved creative",
      severity: "low",
      agentAction: "Create reusable visual creative.",
    });
  }

  const score = Math.max(0, 100 - issues.reduce((total, issue) => {
    if (issue.severity === "high") return total + 18;
    if (issue.severity === "medium") return total + 10;
    return total + 6;
  }, 0));

  const opportunities = [
    daysIn >= 30 ? "aging_inventory" : null,
    isCommercialFit(vehicle) ? "commercial_fit" : null,
    down ? "finance_ready" : null,
    photos ? "creative_ready" : null,
  ].filter(Boolean) as string[];

  const status = score >= 85 ? "ready" : score >= 65 ? "needs_work" : "blocked";

  return {
    score,
    status,
    issues,
    opportunities,
    summary: issues.length
      ? issues.slice(0, 2).map(issue => issue.label).join(", ")
      : "Ready for campaign package",
  };
}
