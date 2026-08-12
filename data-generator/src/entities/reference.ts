import { faker } from "@faker-js/faker";
import type {
  ReferenceAgent,
  ReferenceChartOfAccount,
  ReferenceOutlet,
  ReferencePackagePriceListEntry,
  ReferenceProduct,
  ReferenceRoomType,
} from "@group-bi/kpi-lib";
import type { Rng } from "../rng.js";
import { VOLUME } from "../config.js";

export function generateAgents(rng: Rng): ReferenceAgent[] {
  return Array.from({ length: VOLUME.hajjUmrah.agentCount }, (_, i) => ({
    agent_id: `AGT${String(i + 1).padStart(3, "0")}`,
    agent_name: faker.company.name(),
    commission_rate: rng.float(0.03, 0.08, 3),
  }));
}

// Prices in Naira (₦), per person — sized to match ~2024/2025 Nigerian
// Hajj/Umrah market rates so revenue lands on the same currency scale as
// opex/payroll (both already in ₦) instead of looking like a USD figure.
export function generatePackagePriceList(): ReferencePackagePriceListEntry[] {
  return [
    { package_tier: "Economy", season: "Hajj", base_price: 7_200_000, inclusions: "Shared room, standard transport, group guide" },
    { package_tier: "Standard", season: "Hajj", base_price: 8_800_000, inclusions: "Shared room (4), private transport, guide, 2 meals/day" },
    { package_tier: "VIP", season: "Hajj", base_price: 12_500_000, inclusions: "Private room, premium hotel, private transport, full board" },
    { package_tier: "Economy", season: "Umrah", base_price: 1_600_000, inclusions: "Shared room, standard transport" },
    { package_tier: "Standard", season: "Umrah", base_price: 2_400_000, inclusions: "Shared room (4), private transport, guide" },
    { package_tier: "VIP", season: "Umrah", base_price: 3_800_000, inclusions: "Private room, premium hotel, private transport" },
  ];
}

// Rates in Naira (₦) per night — mid-range Nigerian business hotel scale.
export function generateRoomTypes(): ReferenceRoomType[] {
  // total_rooms sums to VOLUME.hotel.totalRooms
  return [
    { room_type: "Standard", total_rooms: 30, standard_rate: 45_000 },
    { room_type: "Deluxe", total_rooms: 18, standard_rate: 75_000 },
    { room_type: "Suite", total_rooms: 12, standard_rate: 130_000 },
  ];
}

export function generateOutlets(): ReferenceOutlet[] {
  const locations = ["Ilorin GRA", "Ilorin Taiwo Road", "Offa Road", "Tanke"];
  return Array.from({ length: VOLUME.bakery.outletCount }, (_, i) => ({
    outlet_id: `OUT${String(i + 1).padStart(2, "0")}`,
    outlet_name: `Bakery Outlet ${i + 1}`,
    location: locations[i % locations.length],
  }));
}

const PRODUCT_CATALOG: Array<{ name: string; category: string; price: number; cost: number }> = [
  { name: "Agege Bread (Large)", category: "Bread", price: 1500, cost: 650 },
  { name: "Agege Bread (Small)", category: "Bread", price: 900, cost: 400 },
  { name: "Meat Pie", category: "Pastry", price: 600, cost: 220 },
  { name: "Sausage Roll", category: "Pastry", price: 500, cost: 180 },
  { name: "Doughnut", category: "Pastry", price: 300, cost: 100 },
  { name: "Chin Chin (Pack)", category: "Snacks", price: 800, cost: 320 },
  { name: "Meringue (Pack)", category: "Snacks", price: 700, cost: 250 },
  { name: "Birthday Cake (Small)", category: "Cake", price: 8000, cost: 3200 },
  { name: "Birthday Cake (Large)", category: "Cake", price: 18000, cost: 7500 },
  { name: "Cupcake (Pack of 6)", category: "Cake", price: 3000, cost: 1200 },
  { name: "Puff Puff (Pack)", category: "Snacks", price: 400, cost: 150 },
  { name: "Shawarma Bread", category: "Bread", price: 700, cost: 300 },
  { name: "Coconut Bread", category: "Bread", price: 1600, cost: 700 },
  { name: "Banana Bread", category: "Bread", price: 1800, cost: 800 },
];

export function generateProducts(): ReferenceProduct[] {
  return PRODUCT_CATALOG.slice(0, VOLUME.bakery.productCount).map((p, i) => ({
    product_id: `PRD${String(i + 1).padStart(2, "0")}`,
    product_name: p.name,
    category: p.category,
    standard_recipe_cost: p.cost,
  }));
}

// Selling price per product_id, keyed off the same catalog order used by
// generateProducts() — the standard_recipe_cost lives on ReferenceProduct,
// but the sell price is generator-internal (it varies day to day around this).
export function productSellingPrices(products: ReferenceProduct[]): Map<string, number> {
  return new Map(products.map((p, i) => [p.product_id, PRODUCT_CATALOG[i].price]));
}

export function productCategoryWeight(category: string): number {
  const weights: Record<string, number> = { Bread: 3, Pastry: 2.5, Snacks: 2, Cake: 0.8 };
  return weights[category] ?? 1;
}

export function generateChartOfAccounts(): ReferenceChartOfAccount[] {
  return [
    { account_code: "4000", account_name: "Package/Room/Product Sales", category: "Revenue" },
    { account_code: "4100", account_name: "Ancillary Revenue (F&B, extras)", category: "Revenue" },
    { account_code: "5000", account_name: "Cost of Goods/Services Sold", category: "COGS" },
    { account_code: "5100", account_name: "Visa & Permit Costs", category: "COGS" },
    { account_code: "6000", account_name: "Payroll & Benefits", category: "OpEx" },
    { account_code: "6100", account_name: "Marketing", category: "OpEx" },
    { account_code: "6200", account_name: "Utilities", category: "OpEx" },
    { account_code: "6300", account_name: "Maintenance", category: "OpEx" },
    { account_code: "6400", account_name: "Rent & Facilities", category: "OpEx" },
    { account_code: "6500", account_name: "Admin & Corporate Overhead", category: "OpEx" },
    { account_code: "9000", account_name: "Other Income/Expense", category: "Other" },
  ];
}
