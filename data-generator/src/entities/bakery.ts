import type { RawProduction, RawSale, RawWaste, ReferenceOutlet, ReferenceProduct } from "@group-bi/kpi-lib";
import type { Rng } from "../rng.js";
import { ANOMALY_MONTHS, BAKERY_SPIKE_WINDOWS, FISCAL_YEAR_END, FISCAL_YEAR_START, GROWTH_TREND_MONTHLY, VOLUME } from "../config.js";
import { eachDay, growthMultiplier, monthOf } from "../dates.js";
import { productCategoryWeight, productSellingPrices } from "./reference.js";

const WASTE_REASONS = ["Unsold - end of day", "Quality defect", "Damaged in transit", "Overproduction"];

function spikeMultiplierFor(dateIso: string): number {
  let multiplier = 1;
  for (const window of BAKERY_SPIKE_WINDOWS) {
    if (dateIso >= window.start && dateIso <= window.end) multiplier *= window.multiplier;
  }
  return multiplier;
}

function monthIndexOf(dateIso: string): number {
  return Number(monthOf(dateIso).slice(5, 7)) - 1;
}

export interface BakeryDataResult {
  production: RawProduction[];
  sales: RawSale[];
  waste: RawWaste[];
}

export function generateBakeryData(
  rng: Rng,
  outlets: ReferenceOutlet[],
  products: ReferenceProduct[],
): BakeryDataResult {
  const prices = productSellingPrices(products);
  const productWeights = products.map((p) => ({ value: p, weight: productCategoryWeight(p.category) }));

  const production: RawProduction[] = [];
  const sales: RawSale[] = [];
  const waste: RawWaste[] = [];
  let txnCounter = 1;

  for (const day of eachDay(FISCAL_YEAR_START, FISCAL_YEAR_END)) {
    const growth = growthMultiplier(monthIndexOf(day), GROWTH_TREND_MONTHLY);
    const spike = spikeMultiplierFor(day);
    const anomalous = monthOf(day) === ANOMALY_MONTHS.Bakery;

    for (const outlet of outlets) {
      const transactionCount = Math.max(
        1,
        Math.round(VOLUME.bakery.baseDailyTransactionsPerOutlet * growth * spike * rng.float(0.85, 1.15)),
      );

      const unitsSoldByProduct = new Map<string, number>();
      for (let t = 0; t < transactionCount; t++) {
        const transactionId = `TXN${String(txnCounter++).padStart(7, "0")}`;
        const lineCount = rng.int(1, 3);
        const chosenProducts = new Set<string>();
        for (let l = 0; l < lineCount; l++) {
          const product = rng.weightedPick(productWeights);
          if (chosenProducts.has(product.product_id)) continue;
          chosenProducts.add(product.product_id);
          const quantity = rng.int(1, 4);
          const basePrice = prices.get(product.product_id) ?? 500;
          const unitPrice = Math.round(basePrice * rng.float(0.97, 1.05));
          sales.push({
            date: day,
            outlet_id: outlet.outlet_id,
            product_id: product.product_id,
            units_sold: quantity,
            unit_price: unitPrice,
            transaction_id: transactionId,
          });
          unitsSoldByProduct.set(product.product_id, (unitsSoldByProduct.get(product.product_id) ?? 0) + quantity);
        }
      }

      for (const [productId, unitsSold] of unitsSoldByProduct) {
        const wasteRatio = anomalous ? rng.float(0.12, 0.24) : rng.float(0.02, 0.07);
        const unitsProduced = Math.round(unitsSold / (1 - wasteRatio));
        const unitsWasted = unitsProduced - unitsSold;
        const standardCost = products.find((p) => p.product_id === productId)?.standard_recipe_cost ?? 0;
        const costVarianceFactor = anomalous ? rng.float(0.95, 1.25) : rng.float(0.92, 1.1);

        production.push({
          date: day,
          outlet_id: outlet.outlet_id,
          product_id: productId,
          units_produced: unitsProduced,
          ingredient_cost: Math.round(unitsProduced * standardCost * costVarianceFactor),
        });

        if (unitsWasted > 0) {
          waste.push({
            date: day,
            outlet_id: outlet.outlet_id,
            product_id: productId,
            units_wasted: unitsWasted,
            reason: rng.pick(WASTE_REASONS),
          });
        }
      }
    }
  }

  return { production, sales, waste };
}
