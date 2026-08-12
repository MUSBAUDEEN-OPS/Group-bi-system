// Fixed Raw_Expenses.category vocabulary the summarization pipeline
// recognizes for COGS vs OpEx classification — both the synthetic
// generator and real Sheets-entered data must use these exact category
// strings (documented in docs/schema.md's expense-category table) for
// gross_profit/net_profit to compute correctly.
export const OPEX_CATEGORY_NAMES = ["Marketing", "Utilities", "Maintenance", "Rent & Facilities"] as const;
export const COGS_CATEGORY_NAMES = ["Package Delivery Costs", "F&B Cost of Goods"] as const;
