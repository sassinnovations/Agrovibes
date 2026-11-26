export const RENTAL_LOCATIONS = [
  "Telangana",
  "Andhra Pradesh",
  "Karnataka",
  "Maharashtra",
  "Tamil Nadu",
  "Madhya Pradesh"
] as const;

export type RentalCategory = {
  id: string;
  title: string;
  blurb: string;
  wash: string;
  image: string;
};

export type RentalVisual = {
  id: string;
  categoryId: string;
  title: string;
  image: string;
};

export const RENTAL_CATEGORIES: RentalCategory[] = [
  {
    id: "drivers",
    title: "Drivers / Operators",
    blurb: "Licensed operators for tractors, harvesters, and other farm machines.",
    wash: "#243028",
    image: "/rentals/operator.png"
  },
  {
    id: "drone",
    title: "Drone Services",
    blurb: "Certified pilots for crop spraying and field scouting.",
    wash: "#1e2c33",
    image: "/rentals/drone-spraying.png"
  },
  {
    id: "machinery",
    title: "Machinery & Tools",
    blurb: "Tractors, rotavators, sprayers, and tools rented by the day.",
    wash: "#2a2e1e",
    image: "/rentals/tractor-rental.png"
  },
  {
    id: "land",
    title: "Land",
    blurb: "Farmland and plots available to rent.",
    wash: "#1c2b22",
    image: "/rentals/crop.png"
  },
  {
    id: "labour",
    title: "Farm Labour",
    blurb: "Field crews for sowing, weeding, and harvest.",
    wash: "#2c261e",
    image: "/rentals/labour.png"
  },
  {
    id: "soil",
    title: "Soil & Crop Care",
    blurb: "Sample pickup and a nutrient report for the next season.",
    wash: "#1e2a28",
    image: "/rentals/soil-kit.png"
  },
  {
    id: "transplanting",
    title: "Transplanting",
    blurb: "Teams and machines for paddy and seedling transplanting.",
    wash: "#1c2b22",
    image: "/rentals/crop.png"
  }
];

export const RENTAL_VISUALS: RentalVisual[] = [
  { id: "tractors", categoryId: "machinery", title: "Tractors", image: "/rentals/tractor-rental.png" },
  { id: "tools", categoryId: "machinery", title: "Tools", image: "/rentals/tools.png" },
  { id: "used", categoryId: "machinery", title: "Used equipment", image: "/rentals/used-gear.png" },
  { id: "spray", categoryId: "drone", title: "Crop spray drone", image: "/rentals/drone-spraying.png" },
  { id: "report", categoryId: "drone", title: "Spray report", image: "/rentals/spray-report.png" },
  { id: "operators", categoryId: "drivers", title: "Operators", image: "/rentals/operator.png" },
  { id: "slots", categoryId: "drivers", title: "Time slots", image: "/rentals/timeslot.png" },
  { id: "crew", categoryId: "labour", title: "Field crew", image: "/rentals/labour.png" },
  { id: "call", categoryId: "labour", title: "On-call labour", image: "/rentals/on-call.png" },
  { id: "kit", categoryId: "soil", title: "Soil test kit", image: "/rentals/soil-kit.png" },
  { id: "field", categoryId: "soil", title: "Field nutrient map", image: "/rentals/field-map.png" },
  { id: "paddy", categoryId: "transplanting", title: "Paddy transplanting", image: "/rentals/crop.png" },
  { id: "nursery", categoryId: "transplanting", title: "Seedling transplant", image: "/rentals/greenhouse.png" }
];

const FEATURED = ["machinery", "land", "drone", "labour", "soil", "drivers", "transplanting"];

export function rentalCategoryById(id: string) {
  return RENTAL_CATEGORIES.find((item) => item.id === id);
}

export function featuredRentalCategories() {
  return FEATURED.map((id) => rentalCategoryById(id)).filter((item): item is RentalCategory => Boolean(item));
}

export function portalCategoryForListing(category: string, title: string) {
  const text = `${category} ${title}`.toLowerCase();
  if (text.includes("land") || text.includes("farmland") || text.includes("acre")) return "land";
  if (text.includes("drone")) return "drone";
  if (text.includes("driver") || text.includes("operator")) return "drivers";
  if (/(labour|labor|manual)/.test(text)) return "labour";
  if (text.includes("soil")) return "soil";
  if (text.includes("transplant")) return "transplanting";
  return "machinery";
}
