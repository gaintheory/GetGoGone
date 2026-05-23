import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const envPath = path.resolve(".env.local");
if (!fs.existsSync(envPath)) {
  console.log("No .env.local found");
  process.exit(1);
}

const env = {};
const lines = fs.readFileSync(envPath, "utf-8").split("\n");
lines.forEach(l => {
  const parts = l.split("=");
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join("=").trim();
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.log("Missing credentials");
  process.exit(1);
}

const supabase = createClient(url, key);

// 1. Get all dealerships
const { data: dealerships, error: dErr } = await supabase.from("dealerships").select("id, name");
if (dErr) {
  console.error("Failed to fetch dealerships:", dErr);
  process.exit(1);
}

console.log("Dealerships & Vehicle Counts:");
console.log("=========================================");

for (const d of dealerships) {
  const { count, error: vErr } = await supabase
    .from("vehicles")
    .select("*", { count: "exact", head: true })
    .eq("dealership_id", d.id);
    
  if (vErr) {
    console.error(`Failed to get count for ${d.name}:`, vErr);
  } else {
    console.log(`- ${d.name} (${d.id}): ${count} vehicles`);
  }
}
console.log("=========================================");
