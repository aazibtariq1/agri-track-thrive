

## Plan: Edit Crops, Remove Inventory, Update Market Prices, and Improvements

### Overview
This plan covers four areas:
1. **Add Edit and Delete functionality to Crops** - Allow editing and deleting crops with confirmation dialogs
2. **Remove Inventory page** - Delete the page and all references
3. **Update Market Prices** - Correct Corn price to Khanpur Mandi rate, Sugarcane to Hamza Sugar Mill rate
4. **Additional Improvements** - Error boundary, crop status update shortcut, and actual yield tracking

---

## 1. Add Edit and Delete to Crops Page

### What changes
Currently the Crops page only lets you add crops. This adds:
- **Edit button** (pencil icon) on each crop card to open the same form pre-filled with crop data, then update via Supabase `.update()`
- **Delete button** (trash icon) with an AlertDialog confirmation ("Are you sure? This will also affect linked expenses/income records.")
- State tracking for `editingId` to switch between add/edit modes

### Files to modify
- `src/pages/Crops.tsx` - Add `editingId` state, `handleEdit()`, `handleDelete()`, edit/delete buttons on cards, reuse the dialog form for editing

---

## 2. Remove Inventory Page

### What changes
Completely remove the Inventory page and all references to it.

### Files to modify
- **Delete**: `src/pages/Inventory.tsx`
- `src/App.tsx` - Remove import and route for Inventory
- `src/components/Layout.tsx` - Remove Inventory from `navItems` array (line 34)
- `src/lib/validation-schemas.ts` - Remove `inventorySchema` (optional cleanup, but keeps code clean)

Note: The database table stays -- only the UI page is removed. The AI advisor references to inventory will be cleaned up as well.

---

## 3. Update Market Prices

### Corn (Maize)
Current: PKR 1,180/mand from "Sadiqabad Mandi"
Updated: PKR ~2,800/mand from "Khanpur Mandi" (based on current Feb 2026 rates of PKR 2,600-3,000 per 40kg in Punjab)

### Sugarcane
Current: PKR 380/mand from "JDW Sugar Mills RYK"
Updated: PKR ~425/mand from "Hamza Sugar Mill" (based on current mill rates of PKR 390-460 per 40kg)

### Files to modify
- `src/pages/MarketPrices.tsx` - Update Corn price base value and market name; update Sugarcane price and market name to Hamza Sugar Mill

---

## 4. Additional Improvements

### 4a. Actual Yield Field on Crop Edit
When editing a crop (especially after harvest), allow entering "Actual Yield" so farmers can compare expected vs actual performance. The `actual_yield` column already exists in the database.

### 4b. Crop Status Quick Update
Add the ability to quickly change crop status (planted -> growing -> harvested -> sold) from the crop card without opening the full edit dialog.

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/pages/Crops.tsx` | Add edit, delete, actual yield tracking, status quick-update |
| `src/pages/Inventory.tsx` | DELETE this file |
| `src/App.tsx` | Remove Inventory import and route |
| `src/components/Layout.tsx` | Remove Inventory from navigation |
| `src/pages/MarketPrices.tsx` | Update Corn to Khanpur Mandi PKR ~2,800; Sugarcane to Hamza Sugar Mill PKR ~425 |
| `src/lib/validation-schemas.ts` | Remove inventorySchema |

### Technical Notes
- Crop edit reuses the existing dialog form with `editingId` state pattern (same as Expenses and Inventory already do)
- Delete uses AlertDialog for confirmation (matching the existing pattern in Expenses page)
- Market prices are display-only hardcoded values with small random variations -- no database change needed
- The `actual_yield` column already exists in the crops database table, so no migration is needed
- Inventory database table is kept intact -- only the UI page is removed

