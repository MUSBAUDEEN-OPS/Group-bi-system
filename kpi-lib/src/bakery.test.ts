import { describe, expect, it } from "vitest";
import { grossMarginPerProductLine, productionVolumeByProduct, salesPerOutlet } from "./bakery.js";
import type { RawProduction, RawSale } from "./types.js";

describe("★ Daily/Monthly Production Volume", () => {
  it("sums units_produced by product", () => {
    const production: RawProduction[] = [
      { date: "2025-01-01", outlet_id: "O1", product_id: "P1", units_produced: 100, ingredient_cost: 50 },
      { date: "2025-01-02", outlet_id: "O1", product_id: "P1", units_produced: 50, ingredient_cost: 25 },
      { date: "2025-01-01", outlet_id: "O1", product_id: "P2", units_produced: 20, ingredient_cost: 10 },
    ];
    expect(productionVolumeByProduct(production)).toEqual({ P1: 150, P2: 20 });
  });
});

describe("★ Sales per Outlet", () => {
  it("sums units_sold * unit_price grouped by outlet_id", () => {
    const sales: RawSale[] = [
      { date: "2025-01-01", outlet_id: "O1", product_id: "P1", units_sold: 10, unit_price: 5, transaction_id: "T1" },
      { date: "2025-01-01", outlet_id: "O1", product_id: "P2", units_sold: 4, unit_price: 2.5, transaction_id: "T2" },
      { date: "2025-01-01", outlet_id: "O2", product_id: "P1", units_sold: 3, unit_price: 5, transaction_id: "T3" },
    ];
    expect(salesPerOutlet(sales)).toEqual({ O1: 60, O2: 15 });
  });
});

describe("★ Gross Margin per Product Line", () => {
  it("computes (sales - ingredient_cost) / sales grouped by product", () => {
    const sales: RawSale[] = [
      { date: "2025-01-01", outlet_id: "O1", product_id: "P1", units_sold: 10, unit_price: 10, transaction_id: "T1" }, // revenue 100
    ];
    const production: RawProduction[] = [
      { date: "2025-01-01", outlet_id: "O1", product_id: "P1", units_produced: 10, ingredient_cost: 40 },
    ];
    // margin = (100 - 40) / 100 = 0.6
    expect(grossMarginPerProductLine(sales, production)).toEqual({ P1: 0.6 });
  });
});
