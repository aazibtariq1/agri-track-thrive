

## Plan: Organize Crops by Duration Category

### What it does
Adds a **crop duration category** system that automatically classifies crops based on the difference between planting date and harvest date (or expected harvest date). Crops are then displayed in grouped sections: **Short Season (up to 3 months)**, **Medium Season (3-6 months)**, and **Long Season (6-12+ months)**. A filter/tab lets you switch between viewing all crops or a specific duration group.

### How it works

**Duration Calculation:**
- Computed from `planting_date` and `harvest_date` (if set). If no harvest date, uses today's date or shows as "Unknown".
- Short: 0-3 months | Medium: 3-6 months | Long: 6+ months

**UI Changes to `src/pages/Crops.tsx`:**
1. Add a **Tabs bar** at the top: `All | Short Season (≤3 mo) | Medium Season (3-6 mo) | Long Season (6+ mo)`
2. Each tab filters the crop grid accordingly
3. Each crop card gets a small **duration badge** showing e.g. "3 mo" or "8 mo"
4. Within each group, crops are sorted by planting date (newest first)
5. Add a **"Crop Duration"** select field in the add/edit form with options: Short (≤3 months), Medium (3-6 months), Long (6+ months) -- this is auto-calculated from dates but can be used as a filter override

**No database changes needed** -- duration is computed client-side from the existing `planting_date` and `harvest_date` columns.

### Files to modify

| File | Change |
|------|--------|
| `src/pages/Crops.tsx` | Add duration calculation helper, Tabs component for filtering by duration, duration badge on cards |

### Technical Details
- Helper function: `getCropDuration(plantingDate, harvestDate)` returns `{ months: number, label: "Short Season" | "Medium Season" | "Long Season" }`
- Uses Shadcn `Tabs` component for the filter UI
- Filtered crops computed via `useMemo` based on active tab
- Duration badge color: blue for short, amber for medium, green for long

