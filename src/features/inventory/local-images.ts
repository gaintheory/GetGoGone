import { readdirSync } from "node:fs";
import { join, parse } from "node:path";

const VEHICLE_IMAGE_DIR = join(process.cwd(), "public", "images", "vehicles");
const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/i;

let cachedImageMap: Map<string, string> | null = null;

export function getLocalVehicleImageMap() {
  if (cachedImageMap) return cachedImageMap;

  const imageMap = new Map<string, string>();

  try {
    for (const file of readdirSync(VEHICLE_IMAGE_DIR)) {
      const parsed = parse(file);
      const key = parsed.name.replace(/_\d+$/, "").toUpperCase();

      if (VIN_PATTERN.test(key) && !imageMap.has(key)) {
        imageMap.set(key, `/images/vehicles/${file}`);
      }
    }
  } catch {
    // Folder is optional; vehicles fall back to SVG art when no local image exists.
  }

  cachedImageMap = imageMap;
  return imageMap;
}
