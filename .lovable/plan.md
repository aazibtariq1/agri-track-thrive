

## Plan: Offline Support, Mandatory Crop Selection, and Additional Improvements

### Overview
This plan covers three areas:
1. **Offline Support** - Queue expenses/income entries when offline, sync when back online
2. **Mandatory Crop Selection** - Make crop selection required for expenses and income
3. **Additional Improvements** - Online/offline status indicator, empty crop warning, and better navigation UX

---

## Feature 1: Offline Support with Local Queue

### What it does
When a farmer has no internet connection, they can still add expenses and income. The entries are saved locally and automatically synced to the database when the connection is restored.

### Implementation

**New File: `src/lib/offline-queue.ts`**
- Creates an offline queue system using `localStorage`
- Stores pending entries as JSON with table name, data, and timestamp
- Provides functions: `addToQueue()`, `getQueue()`, `removeFromQueue()`, `syncQueue()`
- Listens for `online` event to trigger automatic sync

**New File: `src/hooks/useOnlineStatus.ts`**
- Custom hook that tracks `navigator.onLine` status
- Listens to `online`/`offline` browser events
- Returns `{ isOnline: boolean }`

**New File: `src/components/OfflineIndicator.tsx`**
- A small banner/badge that appears when the user is offline
- Shows "You're offline - data will sync when connected" message
- Shows pending queue count
- Disappears when back online

**Changes to `src/pages/Expenses.tsx`:**
- When offline and user submits a form, save to localStorage queue instead of database
- Show toast: "Saved offline - will sync when connected"
- Display pending offline entries in the table with an "offline" badge

**Changes to `src/pages/Income.tsx`:**
- Same offline queue pattern as Expenses

**Changes to `src/components/Layout.tsx`:**
- Add the `OfflineIndicator` component to the header area
- Show a small wifi-off icon when offline

**Update `vite.config.ts` Workbox config:**
- Add runtime caching for the Supabase API calls so previously loaded data is viewable offline
- Cache the app shell (HTML, CSS, JS) for offline access

---

## Feature 2: Mandatory Crop Selection for Expenses and Income

### What it does
Currently, crop selection is optional when adding expenses or income. This change makes it **required** so every financial record is linked to a crop for better tracking.

### Implementation

**Changes to `src/lib/validation-schemas.ts`:**
- Update `expenseSchema`: Change `crop_id` from `.optional()` to `.min(1, 'Please select a crop')`
- Update `incomeSchema`: Change `crop_id` from `.optional()` to `.min(1, 'Please select a crop')`

**Changes to `src/pages/Expenses.tsx`:**
- Change label from "Crop (Optional)" to "Crop *"
- Remove "optional" from placeholder text
- Add validation check: if no crops exist, show a warning message with link to add crops first
- Pass `crop_id` as required in validation

**Changes to `src/pages/Income.tsx`:**
- Same changes as Expenses - make crop required
- Show warning if no crops exist yet

**No database migration needed** - the `crop_id` column already exists and is nullable in the database. The validation is enforced at the form level, ensuring users always select a crop. Existing records without a crop remain valid.

---

## Feature 3: Additional Improvements

### 3a. No-Crops Warning
When a user tries to add an expense or income but has no crops yet, show a helpful card:
"You need to add a crop first before recording expenses/income"
with a button linking to the Crops page.

### 3b. Online Status in Header
Add a small green/red dot next to the app name in the header showing connection status.

### 3c. Sync Notification
When the app comes back online and syncs queued entries, show a toast:
"X entries synced successfully"

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/offline-queue.ts` | LocalStorage-based queue for offline entries |
| `src/hooks/useOnlineStatus.ts` | Hook to track online/offline status |
| `src/components/OfflineIndicator.tsx` | Banner showing offline status and pending items |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Expenses.tsx` | Offline queue support, mandatory crop, no-crops warning |
| `src/pages/Income.tsx` | Offline queue support, mandatory crop, no-crops warning |
| `src/lib/validation-schemas.ts` | Make crop_id required in expense and income schemas |
| `src/components/Layout.tsx` | Add OfflineIndicator and online status dot |
| `vite.config.ts` | Enhanced Workbox caching for Supabase API |

---

## Technical Details

### Offline Queue Structure
```typescript
interface QueueEntry {
  id: string;           // temp UUID for tracking
  table: 'expenses' | 'income';
  data: Record<string, any>;
  created_at: string;
}

// localStorage key: 'agri_offline_queue'
// On 'online' event -> iterate queue, insert each, remove on success
```

### Workbox Caching Strategy
```typescript
// Cache Supabase REST API responses (GET only)
{
  urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
  handler: "NetworkFirst",
  options: {
    cacheName: "supabase-data-cache",
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 24 * 60 * 60, // 24 hours
    },
    networkTimeoutSeconds: 5,
  },
}
```

### Validation Schema Changes
```typescript
// Before (optional):
crop_id: z.string().optional()

// After (required):
crop_id: z.string().min(1, 'Please select a crop')
```

### Online Status Hook
```typescript
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);
  return { isOnline };
}
```

---

## Summary

1. **Offline Queue**: Farmers can add expenses/income without internet - entries auto-sync when connection returns
2. **Mandatory Crop**: Every expense and income entry must be linked to a crop for proper financial tracking
3. **Status Indicators**: Visual feedback showing online/offline status and pending sync count
4. **Enhanced Caching**: Previously loaded data viewable offline via service worker caching
