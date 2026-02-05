
## Plan: Add Weather, Edit Functionality, Profit Calculator, and AI Chat Scroll Fix

### Overview
This plan implements four enhancements to the AgriManager app:
1. **Weather Integration** - Real-time weather display for Khanpur/RYK region
2. **Edit Functionality** - Allow users to edit existing Expenses, Income, and Inventory records
3. **Profit Calculator Tool** - Dedicated calculator for profit projections
4. **AI Chat Scroll Fix** - Fix scrolling in AI chat to see full responses

---

### Feature 1: Weather Integration

**What it does:**
Displays current weather and 5-day forecast for Khanpur/Rahim Yar Khan region on the Dashboard.

**Implementation:**
- Create a new edge function `supabase/functions/get-weather/index.ts` that fetches weather from Open-Meteo API (free, no API key needed)
- Create `src/components/WeatherWidget.tsx` component showing:
  - Current temperature, humidity, wind speed
  - Weather condition (sunny, cloudy, rainy)
  - 5-day forecast with icons
  - Farming tips based on weather
- Add WeatherWidget to Dashboard page header

**Weather API (Open-Meteo - Free):**
```text
Khanpur coordinates: 28.6474°N, 70.6539°E
API: https://api.open-meteo.com/v1/forecast
No API key required
```

---

### Feature 2: Edit Functionality for Records

**What it does:**
Adds edit buttons to Expenses, Income, and Inventory records so users can update existing entries.

**Changes to Expenses.tsx:**
- Add edit state and `editingExpense` variable
- Add `handleEdit` function to populate form with existing data
- Add `handleUpdate` function to save changes
- Add Edit (Pencil) icon button in Actions column
- Modify dialog to support both Add and Edit modes

**Changes to Income.tsx:**
- Same pattern as Expenses - add edit mode to existing dialog
- Add Edit button in Actions column

**Changes to Inventory.tsx:**
- Same pattern - add edit mode
- Add Edit button in Actions column

**UI Pattern:**
```text
Actions Column: [Edit ✏️] [Delete 🗑️]
- Click Edit → Opens same dialog with pre-filled data
- Dialog title changes to "Edit Expense" / "Edit Income" etc.
- Submit button changes to "Update" instead of "Add"
```

---

### Feature 3: Profit Calculator Tool

**What it does:**
A dedicated calculator where farmers input:
- Expected yield (kg)
- Current market price (PKR/kg)
- Total expenses (PKR)

And see:
- Projected revenue
- Projected profit
- Profit margin percentage
- Break-even analysis

**Implementation:**
- Create `src/pages/ProfitCalculator.tsx` as a new page
- Add route `/profit-calculator` in App.tsx
- Add navigation item in Layout.tsx
- Calculator features:
  - Crop selector (from user's crops)
  - Manual input fields
  - Auto-populate from selected crop data
  - Real-time calculation as user types
  - Visual profit/loss indicator
  - Comparison with different scenarios

**UI Layout:**
```text
+------------------------+------------------------+
|  INPUT SECTION         |  RESULTS SECTION       |
|  - Select Crop (auto)  |  Revenue: PKR 150,000  |
|  - Yield: 500 kg       |  Expenses: PKR 80,000  |
|  - Price: PKR 300/kg   |  ─────────────────     |
|  - Expenses: PKR 80,000|  PROFIT: PKR 70,000    |
|                        |  Margin: 46.67%        |
|  [Calculate]           |  Break-even: 266.67 kg |
+------------------------+------------------------+
```

---

### Feature 4: Fix AI Chat Scroll

**Problem:**
The AI chat in `AIChat.tsx` uses `ScrollArea` component but the ref isn't properly attached to the viewport element, causing scroll issues.

**Fix:**
The issue is that `scrollRef` is attached to `ScrollArea` but we need to scroll the viewport inside it. The `ScrollArea` component from Radix doesn't expose the viewport directly via ref.

**Solution:**
- Use a wrapper div with `overflow-y-auto` instead of ScrollArea for the messages
- Or use a ref to find the viewport element after mount
- Ensure the messages container has a fixed height with `flex-1` and proper overflow

**Updated AIChat.tsx structure:**
```tsx
<div className="flex flex-col h-full">
  <div 
    ref={scrollRef}
    className="flex-1 overflow-y-auto p-4"
  >
    {/* Messages */}
  </div>
  <form>...</form>
</div>
```

---

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/get-weather/index.ts` | Edge function to fetch weather data |
| `src/components/WeatherWidget.tsx` | Weather display component |
| `src/pages/ProfitCalculator.tsx` | Profit calculator page |

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Dashboard.tsx` | Add WeatherWidget component |
| `src/pages/Expenses.tsx` | Add edit functionality |
| `src/pages/Income.tsx` | Add edit functionality |
| `src/pages/Inventory.tsx` | Add edit functionality |
| `src/components/AIChat.tsx` | Fix scroll to work properly |
| `src/components/Layout.tsx` | Add Profit Calculator nav item |
| `src/App.tsx` | Add profit calculator route |
| `supabase/config.toml` | Add get-weather function config |

---

### Technical Details

#### Weather Edge Function
- Uses Open-Meteo free API (no key needed)
- Fetches current conditions + 7-day forecast
- Coordinates: Khanpur (28.6474, 70.6539)
- Returns: temperature, humidity, wind, weather code, daily forecast

#### Edit Functionality Pattern
Each page will use a single dialog for both Add and Edit:
```typescript
const [editingId, setEditingId] = useState<string | null>(null);
const isEditing = editingId !== null;

// When editing, populate form with existing data
const handleEdit = (record: Expense) => {
  setFormData({...record});
  setEditingId(record.id);
  setOpen(true);
};

// Submit handles both insert and update
const handleSubmit = async () => {
  if (isEditing) {
    await supabase.from("expenses").update({...}).eq("id", editingId);
  } else {
    await supabase.from("expenses").insert({...});
  }
};
```

#### Profit Calculator Features
- Fetches user's crops and auto-populates data when selected
- Fetches actual expenses linked to selected crop
- Real-time calculation without submit button
- Shows visual indicators (green for profit, red for loss)
- Displays margin percentage and break-even yield

---

### Summary of Changes

1. **Weather Widget**: New edge function + component on Dashboard showing Khanpur weather
2. **Edit Records**: Add edit buttons and update logic to Expenses, Income, Inventory pages
3. **Profit Calculator**: New page accessible from navigation for profit projections
4. **AI Chat Scroll**: Fix the scroll behavior so users can see full AI responses
