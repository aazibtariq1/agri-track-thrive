

## Plan: Change Weight Unit from KG to Mands + Feature Suggestions

### Overview
This plan changes the weight unit across the entire application from **kilograms (kg)** to **mands** (1 mand = 40 kg), which is the standard unit used by farmers in Punjab, Pakistan. It also includes suggested features to improve reliability and usability.

---

## Part 1: Change KG to Mands

### What is a Mand?
A "mand" (also written as "mann" or "من") is a traditional weight unit used in Pakistani agriculture. **1 mand = 40 kg**. All crop yields, market prices, and related calculations will be updated to use this unit.

### Files to Modify

**1. `src/pages/Crops.tsx`**
- Change "Expected Yield (kg)" label to "Expected Yield (mands)"
- Change "Market Price (PKR/kg)" label to "Market Price (PKR/mand)"
- Change display from `{crop.expected_yield} kg` to `{crop.expected_yield} mands`
- Change display from `PKR {crop.market_price}/kg` to `PKR {crop.market_price}/mand`

**2. `src/pages/ProfitCalculator.tsx`**
- Change "Expected Yield (kg)" to "Expected Yield (mands)"
- Change "Market Price (PKR/kg)" to "Market Price (PKR/mand)"
- Change all display references from `kg` to `mands` (revenue breakdown, break-even yield)
- Update placeholders (e.g., "e.g., 500" to "e.g., 12.5")

**3. `src/pages/MarketPrices.tsx`**
- Change `unit: "40 kg"` to `unit: "mand"` for all crop prices
- Keep input prices (fertilizer bags, fuel liters, seed packets) in their original units since those are not measured in mands

**4. `supabase/functions/farm-advisor/index.ts`**
- Change `Expected yield: ${c.expected_yield}kg` to `Expected yield: ${c.expected_yield} mands`

**5. `src/pages/Inventory.tsx`**
- Add "mand" as a unit option in the inventory unit selector alongside existing options (kg, g, L, etc.)

### Important Note
No database migration is needed. The numeric values in the database remain the same -- only the **labels and display text** change. Users entering new data will now think in mands instead of kg. Existing data will now be interpreted as mands.

---

## Part 2: Suggested Features for Better Reliability and Usability

### Feature A: Delete Confirmation Dialog
Currently, delete buttons on records likely execute immediately. Add a confirmation dialog ("Are you sure you want to delete this record?") to prevent accidental deletions.

### Feature B: Error Boundary Component
Add a React Error Boundary that catches crashes and shows a friendly "Something went wrong" screen with a retry button, instead of a blank page.

### Feature C: Crop Delete Functionality
Currently the Crops page has no delete button. Add the ability to delete crops (with confirmation), which is a basic CRUD operation that's missing.

### Feature D: Data Export (CSV)
Allow farmers to export their expenses, income, and crop data as CSV files for record-keeping or sharing with agricultural officers. A simple "Export to CSV" button on each data page.

### Feature E: Urdu/Bilingual Labels
Since this targets farmers in Punjab Pakistan, adding Urdu labels alongside English for key terms (crop names, categories, navigation) would make the app much more accessible to the target audience.

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/pages/Crops.tsx` | Labels and display: kg to mands |
| `src/pages/ProfitCalculator.tsx` | Labels, calculations display: kg to mands |
| `src/pages/MarketPrices.tsx` | Crop price unit: "40 kg" to "mand" |
| `src/pages/Inventory.tsx` | Add "mand" as unit option |
| `supabase/functions/farm-advisor/index.ts` | AI context text: kg to mands |

### Technical Notes
- 1 mand = 40 kg (this is a display-only change, no data conversion needed)
- Market prices in MarketPrices.tsx already use "per 40 kg" which is exactly 1 mand, so prices stay the same
- The profit calculator formulas remain unchanged (yield x price - expenses) since the unit is consistent
- Existing database values will now represent mands instead of kg

