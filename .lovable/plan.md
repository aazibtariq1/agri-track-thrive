

## Plan: Excel Export + Feature Improvements

### Overview
Add Excel/CSV export functionality across all data pages (Crops, Expenses, Income, Reports) and implement several improvements to make the app more reliable and user-friendly.

---

## Part 1: Excel/CSV Data Export

### What it does
Adds a "Download Excel" button on the Crops, Expenses, Income, and Reports pages. Clicking it exports all the user's data into a `.csv` file (which opens directly in Excel, Google Sheets, etc.) with proper column headers and formatted values.

### Implementation

**New File: `src/lib/export-utils.ts`**
- A utility with a `exportToCSV(filename, headers, rows)` function
- Converts data arrays into CSV format with proper escaping (commas in descriptions, PKR values, etc.)
- Triggers a browser download of the `.csv` file
- No external library needed -- uses built-in browser APIs

**Changes to `src/pages/Crops.tsx`**
- Add a "Download Excel" button next to "Add Crop"
- Exports: Crop Name, Type, Status, Planting Date, Harvest Date, Expected Yield (mands), Actual Yield (mands), Market Price (PKR/mand), Notes

**Changes to `src/pages/Expenses.tsx`**
- Add a "Download Excel" button next to "Add Expense"
- Exports: Date, Category, Crop Name, Amount (PKR), Description

**Changes to `src/pages/Income.tsx`**
- Add a "Download Excel" button next to "Add Income"
- Exports: Date, Source, Crop Name, Amount (PKR), Description

**Changes to `src/pages/Reports.tsx`**
- Add a "Download Report" button
- Exports the summary data (period, income, expenses, net profit)

---

## Part 2: Suggested Improvements (Will Be Implemented)

### Improvement A: Date Range Filters on Expenses and Income
Currently all records are shown without filtering. Add "From Date" and "To Date" filter inputs so farmers can view records for a specific season or month. The export will also respect these filters.

### Improvement B: Dashboard Summary Cards Enhancement
Add a "This Month" vs "Last Month" comparison showing percentage change arrows on the dashboard stat cards, so farmers can quickly see if they're doing better or worse.

### Improvement C: Crop Financial Summary on Each Crop Card
Show a quick summary on each crop card: total expenses spent on that crop, total income earned, and net profit/loss -- giving farmers an at-a-glance view of each crop's financial performance. (This may already exist via `CropFinancialCard` -- will enhance if needed.)

### Improvement D: Search/Filter on Data Tables
Add a search box above the Expenses and Income tables to quickly find records by description, category, or crop name.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/export-utils.ts` | CSV export utility function |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Crops.tsx` | Add export button |
| `src/pages/Expenses.tsx` | Add export button, date filters, search box |
| `src/pages/Income.tsx` | Add export button, date filters, search box |
| `src/pages/Reports.tsx` | Add export button |
| `src/pages/Dashboard.tsx` | Add month-over-month comparison on stat cards |

---

## Technical Details

### CSV Export Utility
```text
exportToCSV(filename, headers, rows)
  - filename: "crops_2026-02-21.csv"
  - headers: ["Date", "Category", "Amount (PKR)", ...]
  - rows: [["2026-02-21", "Seeds", "5000.00", ...], ...]
  - Handles: comma escaping, newline escaping, UTF-8 BOM for Excel compatibility
  - Uses: Blob + URL.createObjectURL + anchor click download
```

### Date Filter State
```text
Expenses/Income pages will add:
  - fromDate state (default: empty = show all)
  - toDate state (default: empty = show all)
  - Filtered data computed from the full dataset
  - Export respects the active filters
```

### Search Filter
```text
  - searchQuery state
  - Filters table rows by matching description, category/source, or crop name
  - Case-insensitive partial matching
```

