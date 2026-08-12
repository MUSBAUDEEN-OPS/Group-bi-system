import type { RawProduction, RawSale, RawWaste, ReferenceProduct } from "./types.js";

export function productionVolumeByProduct(production: RawProduction[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const p of production) result[p.product_id] = (result[p.product_id] ?? 0) + p.units_produced;
  return result;
}

export function productionVolumeTotal(production: RawProduction[]): number {
  return production.reduce((sum, p) => sum + p.units_produced, 0);
}

export function salesPerOutlet(sales: RawSale[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const s of sales) {
    result[s.outlet_id] = (result[s.outlet_id] ?? 0) + s.units_sold * s.unit_price;
  }
  return result;
}

export function grossMarginPerProductLine(
  sales: RawSale[],
  production: RawProduction[],
): Record<string, number> {
  const revenueByProduct: Record<string, number> = {};
  for (const s of sales) {
    revenueByProduct[s.product_id] = (revenueByProduct[s.product_id] ?? 0) + s.units_sold * s.unit_price;
  }
  const costByProduct: Record<string, number> = {};
  for (const p of production) {
    costByProduct[p.product_id] = (costByProduct[p.product_id] ?? 0) + p.ingredient_cost;
  }
  const result: Record<string, number> = {};
  for (const productId of Object.keys(revenueByProduct)) {
    const revenue = revenueByProduct[productId];
    const cost = costByProduct[productId] ?? 0;
    result[productId] = revenue === 0 ? 0 : (revenue - cost) / revenue;
  }
  return result;
}

export function wasteRate(waste: RawWaste[], production: RawProduction[]): number {
  const produced = productionVolumeTotal(production);
  if (produced === 0) return 0;
  const wasted = waste.reduce((sum, w) => sum + w.units_wasted, 0);
  return wasted / produced;
}

export interface RankedProduct {
  product_id: string;
  product_name: string;
  value: number;
}

export function topSellingProducts(
  sales: RawSale[],
  products: ReferenceProduct[],
  topN = 10,
): { byRevenue: RankedProduct[]; byVolume: RankedProduct[] } {
  const nameById = new Map(products.map((p) => [p.product_id, p.product_name]));
  const revenueByProduct = new Map<string, number>();
  const volumeByProduct = new Map<string, number>();
  for (const s of sales) {
    revenueByProduct.set(s.product_id, (revenueByProduct.get(s.product_id) ?? 0) + s.units_sold * s.unit_price);
    volumeByProduct.set(s.product_id, (volumeByProduct.get(s.product_id) ?? 0) + s.units_sold);
  }
  const toRanked = (map: Map<string, number>): RankedProduct[] =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([product_id, value]) => ({
        product_id,
        product_name: nameById.get(product_id) ?? product_id,
        value,
      }));
  return { byRevenue: toRanked(revenueByProduct), byVolume: toRanked(volumeByProduct) };
}

export function rawMaterialCostVariance(
  production: RawProduction[],
  products: ReferenceProduct[],
): Record<string, number> {
  const standardCostById = new Map(products.map((p) => [p.product_id, p.standard_recipe_cost]));
  const actualByProduct: Record<string, number> = {};
  const expectedByProduct: Record<string, number> = {};
  for (const p of production) {
    actualByProduct[p.product_id] = (actualByProduct[p.product_id] ?? 0) + p.ingredient_cost;
    const standard = standardCostById.get(p.product_id) ?? 0;
    expectedByProduct[p.product_id] = (expectedByProduct[p.product_id] ?? 0) + standard * p.units_produced;
  }
  const result: Record<string, number> = {};
  for (const productId of Object.keys(actualByProduct)) {
    result[productId] = actualByProduct[productId] - (expectedByProduct[productId] ?? 0);
  }
  return result;
}

export function averageTransactionValue(sales: RawSale[]): number {
  const totalsByTransaction = new Map<string, number>();
  for (const s of sales) {
    totalsByTransaction.set(
      s.transaction_id,
      (totalsByTransaction.get(s.transaction_id) ?? 0) + s.units_sold * s.unit_price,
    );
  }
  if (totalsByTransaction.size === 0) return 0;
  const total = [...totalsByTransaction.values()].reduce((sum, v) => sum + v, 0);
  return total / totalsByTransaction.size;
}
