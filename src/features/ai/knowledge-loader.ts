import fs from "fs/promises";
import path from "path";

export type KnowledgePayload = {
  brandKnowledge: string | null;
  bhphFramework: string | null;
  complianceGuide: string | null;
};

/**
 * Normalizes the vehicle brand name for safe filesystem lookups.
 */
function cleanMakeName(make: string): string {
  return make.trim().replace(/[^a-zA-Z0-9\s-]/g, "").toUpperCase();
}

/**
 * Loads brand-specific and business-wide copy knowledge from the docs/ folder.
 * Fails gracefully if files are missing or unreadable.
 */
export async function loadVehicleKnowledge(make?: string): Promise<KnowledgePayload> {
  const result: KnowledgePayload = {
    brandKnowledge: null,
    bhphFramework: null,
    complianceGuide: null,
  };

  try {
    // 1. Load BHPH Framework
    const frameworkPath = path.resolve(process.cwd(), "docs/knowledge/BHPH_FRAMEWORK.md");
    result.bhphFramework = await fs.readFile(frameworkPath, "utf8").catch(() => null);

    // 2. Load Compliance Guide
    const compliancePath = path.resolve(process.cwd(), "docs/knowledge/COMPLIANCE_2026.md");
    result.complianceGuide = await fs.readFile(compliancePath, "utf8").catch(() => null);

    // 3. Load Brand-Specific Knowledge
    if (make) {
      const cleanMake = cleanMakeName(make);
      const brandPath = path.resolve(process.cwd(), "docs/knowledge/brands", `${cleanMake}.md`);
      result.brandKnowledge = await fs.readFile(brandPath, "utf8").catch(() => null);
    }
  } catch (err) {
    console.error("Failed to load vehicle knowledge:", err);
  }

  return result;
}
