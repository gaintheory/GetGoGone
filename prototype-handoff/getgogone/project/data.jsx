// Vehicle illustration placeholders — stylized SVG so we don't need real photos
// Each takes (palette) -> jsx

const VehicleArt = {
  sedan: (c1 = "#475569", c2 = "#1e293b", bg = "#cbd5e1") => `
    <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="130" fill="${bg}"/>
      <path d="M10 95 Q20 88 35 86 L60 60 Q70 50 85 50 L130 50 Q150 50 165 65 L180 80 L188 88 Q195 92 195 100 L195 105 L10 105 Z" fill="${c1}"/>
      <path d="M65 65 Q72 56 85 56 L120 56 Q135 56 145 65 L155 78 L70 78 Z" fill="#e0e7ef" opacity="0.9"/>
      <line x1="108" y1="56" x2="108" y2="78" stroke="${c2}" stroke-width="1.2"/>
      <rect x="40" y="92" width="155" height="3" fill="${c2}" opacity="0.4"/>
      <circle cx="55" cy="105" r="13" fill="#1f2937"/><circle cx="55" cy="105" r="6" fill="#94a3b8"/>
      <circle cx="160" cy="105" r="13" fill="#1f2937"/><circle cx="160" cy="105" r="6" fill="#94a3b8"/>
      <rect x="178" y="80" width="10" height="6" rx="1" fill="#fbbf24"/>
    </svg>`,
  truck: (c1 = "#1e40af", c2 = "#1e293b", bg = "#cbd5e1") => `
    <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="130" fill="${bg}"/>
      <path d="M10 105 L10 88 Q10 80 18 80 L60 80 L70 55 Q73 48 82 48 L115 48 Q123 48 127 55 L135 80 L185 80 Q195 80 195 90 L195 105 Z" fill="${c1}"/>
      <path d="M75 60 Q78 53 85 53 L112 53 Q119 53 122 60 L130 78 L72 78 Z" fill="#e0e7ef"/>
      <line x1="100" y1="53" x2="100" y2="78" stroke="${c2}" stroke-width="1.2"/>
      <rect x="138" y="63" width="50" height="20" fill="${c1}" opacity="0.9"/>
      <rect x="138" y="63" width="50" height="20" fill="none" stroke="${c2}" stroke-width="1"/>
      <circle cx="55" cy="105" r="15" fill="#1f2937"/><circle cx="55" cy="105" r="7" fill="#94a3b8"/>
      <circle cx="160" cy="105" r="15" fill="#1f2937"/><circle cx="160" cy="105" r="7" fill="#94a3b8"/>
      <rect x="178" y="82" width="12" height="6" rx="1" fill="#fbbf24"/>
    </svg>`,
  suv: (c1 = "#0f766e", c2 = "#1e293b", bg = "#cbd5e1") => `
    <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="130" fill="${bg}"/>
      <path d="M10 100 Q12 90 25 88 L45 60 Q52 50 65 50 L135 50 Q150 50 162 62 L180 80 Q192 84 192 95 L192 105 L10 105 Z" fill="${c1}"/>
      <path d="M50 65 Q56 56 68 56 L130 56 Q140 56 148 64 L158 78 L55 78 Z" fill="#e0e7ef"/>
      <line x1="90" y1="56" x2="90" y2="78" stroke="${c2}" stroke-width="1.2"/>
      <line x1="125" y1="56" x2="125" y2="78" stroke="${c2}" stroke-width="1.2"/>
      <circle cx="55" cy="105" r="14" fill="#1f2937"/><circle cx="55" cy="105" r="6.5" fill="#94a3b8"/>
      <circle cx="158" cy="105" r="14" fill="#1f2937"/><circle cx="158" cy="105" r="6.5" fill="#94a3b8"/>
      <rect x="175" y="80" width="12" height="6" rx="1" fill="#fbbf24"/>
    </svg>`,
  van: (c1 = "#9ca3af", c2 = "#1e293b", bg = "#cbd5e1") => `
    <svg viewBox="0 0 200 130" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="130" fill="${bg}"/>
      <path d="M10 105 L10 70 Q10 56 22 50 L40 45 Q48 42 60 42 L150 42 Q170 42 180 58 L188 75 Q195 78 195 88 L195 105 Z" fill="${c1}"/>
      <path d="M30 55 Q38 50 50 50 L80 50 L80 78 L25 78 L25 60 Q25 56 30 55 Z" fill="#e0e7ef"/>
      <rect x="88" y="50" width="40" height="28" fill="#e0e7ef"/>
      <rect x="134" y="50" width="40" height="28" fill="#e0e7ef"/>
      <line x1="84" y1="50" x2="84" y2="78" stroke="${c2}" stroke-width="1.2"/>
      <line x1="131" y1="50" x2="131" y2="78" stroke="${c2}" stroke-width="1.2"/>
      <circle cx="55" cy="105" r="13" fill="#1f2937"/><circle cx="55" cy="105" r="6" fill="#94a3b8"/>
      <circle cx="160" cy="105" r="13" fill="#1f2937"/><circle cx="160" cy="105" r="6" fill="#94a3b8"/>
    </svg>`,
};

// Map vehicle body type to art
function vehicleSvg(body, colors) {
  const fn = VehicleArt[body] || VehicleArt.sedan;
  return fn(colors?.[0], colors?.[1], colors?.[2]);
}

const VEHICLES = [
  {
    id: "v-1428", stock: "GGG-1428",
    year: 2016, make: "Chevrolet", model: "Malibu", trim: "LT",
    body: "sedan", color: "Silver Ice",
    palette: ["#94a3b8", "#475569", "#dbeafe"],
    price: 11995, down: 1500, weekly: 89, monthly: 386,
    mileage: 78420, vin: "1G11C5SA6GU147281",
    status: "Active", campaign: "Published",
    daysIn: 12, leads: 8, photos: 14,
    features: ["Bluetooth", "Backup Camera", "Cruise Control", "Power Windows", "MyLink Audio"],
    notes: "Clean Carfax, single owner. Just serviced — new tires.",
  },
  {
    id: "v-1431", stock: "GGG-1431",
    year: 2014, make: "Ford", model: "F-150", trim: "XLT SuperCrew 4x4",
    body: "truck", color: "Tuxedo Black",
    palette: ["#1e293b", "#0f172a", "#cbd5e1"],
    price: 16995, down: 2500, weekly: 119, monthly: 519,
    mileage: 112300, vin: "1FTFW1ET8EFA21183",
    status: "Active", campaign: "Ready to Review",
    daysIn: 4, leads: 14, photos: 22,
    features: ["4WD", "Tow Package", "Bedliner", "Running Boards", "5.0L V8"],
    notes: "Work-ready. Bedliner and tow package in place.",
  },
  {
    id: "v-1432", stock: "GGG-1432",
    year: 2017, make: "Nissan", model: "Altima", trim: "2.5 SV",
    body: "sedan", color: "Pearl White",
    palette: ["#f1f5f9", "#475569", "#e2e8f0"],
    price: 12450, down: 1500, weekly: 92, monthly: 399,
    mileage: 64120, vin: "1N4AL3AP8HC289311",
    status: "Needs Photos", campaign: "Draft",
    daysIn: 2, leads: 0, photos: 3,
    features: ["Pushbutton Start", "Backup Camera", "Bluetooth", "Alloy Wheels"],
    notes: "Just arrived. Detail booked Thursday — needs full photo set.",
  },
  {
    id: "v-1419", stock: "GGG-1419",
    year: 2015, make: "Toyota", model: "Camry", trim: "LE",
    body: "sedan", color: "Attitude Black",
    palette: ["#0f172a", "#1e293b", "#cbd5e1"],
    price: 12995, down: 1500, weekly: 97, monthly: 419,
    mileage: 91240, vin: "4T1BF1FK7FU481129",
    status: "Advertised", campaign: "Published",
    daysIn: 27, leads: 11, photos: 18,
    features: ["Bluetooth", "Backup Camera", "Cruise Control", "Power Seats"],
    notes: "Reliable everyday driver. Toyota track record.",
  },
  {
    id: "v-1391", stock: "GGG-1391",
    year: 2018, make: "Dodge", model: "Grand Caravan", trim: "SXT",
    body: "van", color: "Granite Pearl",
    palette: ["#475569", "#1e293b", "#cbd5e1"],
    price: 14250, down: 2000, weekly: 105, monthly: 455,
    mileage: 88950, vin: "2C4RDGCG2JR142119",
    status: "Active", campaign: "Needs Refresh",
    daysIn: 41, leads: 5, photos: 16,
    features: ["Stow 'n Go", "3rd Row", "Backup Camera", "DVD Entertainment", "Power Doors"],
    notes: "Family-ready. Stow 'n Go seating is a strong sell.",
  },
  {
    id: "v-1402", stock: "GGG-1402",
    year: 2016, make: "Jeep", model: "Cherokee", trim: "Latitude 4x4",
    body: "suv", color: "Granite Crystal",
    palette: ["#0f766e", "#0f172a", "#cbd5e1"],
    price: 13995, down: 2000, weekly: 102, monthly: 442,
    mileage: 96810, vin: "1C4PJMCB6GW189412",
    status: "Missing Payment", campaign: "Draft",
    daysIn: 8, leads: 2, photos: 11,
    features: ["4WD", "UConnect", "Heated Seats", "Backup Camera", "Alloy Wheels"],
    notes: "Payment terms still pending — desk needs to set down/weekly.",
  },
  {
    id: "v-1378", stock: "GGG-1378",
    year: 2015, make: "Honda", model: "Civic", trim: "EX",
    body: "sedan", color: "Modern Steel",
    palette: ["#64748b", "#334155", "#cbd5e1"],
    price: 11495, down: 1500, weekly: 85, monthly: 369,
    mileage: 102450, vin: "19XFB2F89FE221193",
    status: "Active", campaign: "Paused",
    daysIn: 55, leads: 3, photos: 15,
    features: ["Sunroof", "Bluetooth", "Backup Camera", "Cruise Control"],
    notes: "Solid gas saver. Considering price reduction.",
  },
  {
    id: "v-1411", stock: "GGG-1411",
    year: 2017, make: "Hyundai", model: "Elantra", trim: "SE",
    body: "sedan", color: "Symphony Air Silver",
    palette: ["#cbd5e1", "#64748b", "#e2e8f0"],
    price: 10995, down: 1500, weekly: 82, monthly: 355,
    mileage: 85410, vin: "5NPD84LF2HH123487",
    status: "Advertised", campaign: "Published",
    daysIn: 18, leads: 6, photos: 17,
    features: ["Bluetooth", "Backup Camera", "Cruise Control"],
    notes: "Posted Facebook + Craigslist this week.",
  },
];

const CAMPAIGN_TYPES = [
  { id: "fresh", title: "Fresh Arrival", desc: "Just hit the lot — drive traffic in week one.", icon: "Sparkles", tone: "blue" },
  { id: "lowdown", title: "Low Down Payment", desc: "Lead with $1,500 down to drive walk-ins.", icon: "Dollar", tone: "green" },
  { id: "credit", title: "Bad Credit / No Credit", desc: "Compliance-safe credit second-chance pitch.", icon: "Users", tone: "cyan" },
  { id: "work", title: "Work Truck", desc: "Tow, haul, job-site ready messaging.", icon: "Truck", tone: "gray" },
  { id: "family", title: "Family SUV", desc: "Roomy, safe, kid-friendly seating story.", icon: "Car", tone: "blue" },
  { id: "tax", title: "Tax Refund Special", desc: "Seasonal — use refund as down payment.", icon: "Star", tone: "amber" },
  { id: "reduced", title: "Recently Reduced", desc: "Price drop alert to drive urgency.", icon: "Tag", tone: "red" },
  { id: "still", title: "Still Available", desc: "Re-engage on aging inventory.", icon: "Refresh", tone: "gray" },
  { id: "last", title: "Last Chance", desc: "Final push before sending to auction.", icon: "AlertTriangle", tone: "red" },
];

const CHANNELS = [
  { id: "fb", name: "Facebook", short: "Fb", color: "#1877F2", kind: "social", on: true },
  { id: "ig", name: "Instagram", short: "Ig", color: "#E1306C", kind: "social", on: true },
  { id: "gbp", name: "Google Business Profile", short: "Gb", color: "#34A853", kind: "search", on: true },
  { id: "gads", name: "Google Ads", short: "Ga", color: "#4285F4", kind: "search", on: false },
  { id: "cl", name: "Craigslist", short: "Cl", color: "#5C3D7E", kind: "marketplace", on: true },
  { id: "cars", name: "Cars.com", short: "Ca", color: "#A71930", kind: "marketplace", on: true },
  { id: "at", name: "Autotrader", short: "At", color: "#1B4F8B", kind: "marketplace", on: false },
  { id: "cg", name: "CarGurus", short: "Cg", color: "#1F8245", kind: "marketplace", on: true },
  { id: "tt", name: "TikTok", short: "Tt", color: "#111", kind: "social", on: false },
  { id: "yt", name: "YouTube Shorts", short: "Yt", color: "#FF0000", kind: "social", on: false },
  { id: "email", name: "Email Blast", short: "Em", color: "#0891B2", kind: "direct", on: true },
  { id: "sms", name: "SMS Campaign", short: "SM", color: "#64748B", kind: "direct", on: false },
];

const LEADS = [
  { id: "L-2188", name: "Marcus Williams", phone: "(317) 555-0142", source: "Facebook", vehicle: "2014 Ford F-150", vid: "v-1431", status: "New", when: "12 min ago", note: "Asked about down payment for F-150." },
  { id: "L-2187", name: "Tasha Rodriguez", phone: "(317) 555-0118", source: "Website", vehicle: "2018 Grand Caravan", vid: "v-1391", status: "Appointment Set", when: "1 hr ago", appt: "Tue 5:30pm", note: "Bringing co-signer. Wants Stow 'n Go demo." },
  { id: "L-2186", name: "Devon Carter", phone: "(317) 555-0193", source: "Craigslist", vehicle: "2016 Chevy Malibu", vid: "v-1428", status: "Contacted", when: "2 hr ago", note: "Working night shift — call back after 7pm." },
  { id: "L-2185", name: "Brianna Hill", phone: "(317) 555-0177", source: "Phone", vehicle: "2015 Toyota Camry", vid: "v-1419", status: "Showed", when: "Yesterday", note: "Test drove — needs to bring proof of income." },
  { id: "L-2184", name: "Jose Mendoza", phone: "(317) 555-0164", source: "Facebook", vehicle: "2014 Ford F-150", vid: "v-1431", status: "New", when: "Yesterday", note: "Spanish preferred. Looking for work truck under $300/mo." },
  { id: "L-2183", name: "Kevin O'Brien", phone: "(317) 555-0125", source: "Google", vehicle: "2017 Nissan Altima", vid: "v-1432", status: "Lost", when: "2 days ago", note: "Went with another lot." },
  { id: "L-2182", name: "Latoya Brooks", phone: "(317) 555-0149", source: "Text", vehicle: "2016 Chevy Malibu", vid: "v-1428", status: "Sold", when: "3 days ago", note: "Closed at $1,500 down, $89/wk. Trade-in 2008 Impala." },
  { id: "L-2181", name: "Ryan Foster", phone: "(317) 555-0181", source: "Marketplace", vehicle: "2016 Jeep Cherokee", vid: "v-1402", status: "Contacted", when: "3 days ago", note: "First-time buyer, needs co-signer help." },
];

const TEMPLATES = [
  { id: "t1", name: "Family SUV — $1500 Down", type: "SUV", buyer: "Family", platforms: ["fb","ig","cl"], season: "All Year", uses: 18, swatch: "blue" },
  { id: "t2", name: "Work Truck Ready", type: "Truck", buyer: "Tradesperson", platforms: ["fb","cl","cars"], season: "All Year", uses: 24, swatch: "gray" },
  { id: "t3", name: "Tax Refund Down Payment", type: "Any", buyer: "First-Time", platforms: ["fb","ig","gbp"], season: "Jan–Apr", uses: 41, swatch: "amber" },
  { id: "t4", name: "First Car, First Credit", type: "Sedan", buyer: "First-Time", platforms: ["fb","ig","tt"], season: "Spring", uses: 12, swatch: "green" },
  { id: "t5", name: "Fresh Arrival — Sedan", type: "Sedan", buyer: "Commuter", platforms: ["fb","ig","cars"], season: "All Year", uses: 33, swatch: "blue" },
  { id: "t6", name: "Auto Nuevo, Pago Bajo", type: "Any", buyer: "Spanish-First", platforms: ["fb","cl"], season: "All Year", uses: 9, swatch: "cyan" },
  { id: "t7", name: "Price Just Dropped", type: "Any", buyer: "Bargain Hunter", platforms: ["fb","cl","cars"], season: "All Year", uses: 28, swatch: "red" },
  { id: "t8", name: "Aging Inventory Push", type: "Any", buyer: "Bargain Hunter", platforms: ["fb","cl"], season: "All Year", uses: 16, swatch: "gray" },
];

const fmt$ = (n) => "$" + n.toLocaleString();
const fmtMi = (n) => n.toLocaleString() + " mi";

function statusPill(s) {
  const map = {
    "Active": "blue", "Advertised": "blue",
    "Needs Photos": "amber", "Needs Refresh": "amber", "Missing Payment": "red",
    "Sold": "green", "Published": "green", "Showed": "green",
    "Draft": "gray", "Paused": "gray",
    "Ready to Review": "amber",
    "New": "blue", "Contacted": "cyan", "Appointment Set": "blue", "Lost": "red",
  };
  return map[s] || "gray";
}

window.GGG = {
  VehicleArt, vehicleSvg,
  VEHICLES, CAMPAIGN_TYPES, CHANNELS, LEADS, TEMPLATES,
  fmt$, fmtMi, statusPill
};
