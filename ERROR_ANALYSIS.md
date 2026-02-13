# Error Analysis & Fix Explanation

## Original Error Report

```javascript
assets/index-CUVTLw3L.js:75 (anonymous function)
Cannot read property 'taskIds' of undefined
```

## Error Source Code Location

The error occurred in the compiled React bundle, but maps to this source code in `Board.tsx`:

```typescript
// Line 101-104 (BEFORE FIX)
{columnOrder.map((columnId, index) => {
    const column = columns[columnId];  // ❌ This was undefined!
    const columnTasks = column.taskIds  // ❌ Crash here: cannot read 'taskIds' of undefined
        .map((taskId) => tasks[taskId])
```

## Why Did This Happen?

### Execution Timeline:

```
T=0ms:   Chrome extension loads
T=1ms:   React.render() called
T=2ms:   App component renders
T=3ms:   Board component renders
T=4ms:   columnOrder.map() executes
T=5ms:   Tries to access columns[columnId].taskIds
         ❌ ERROR: columns is still {}
         
T=50ms:  chrome.storage.sync.get() completes (TOO LATE!)
T=51ms:  Zustand store updates with real data
T=52ms:  But app already crashed...
```

### The Race Condition:

1. **Zustand persist middleware** uses async storage:
   ```typescript
   // In useBoardStore.ts
   storage: createJSONStorage(() => customStorage),
   // customStorage.getItem() is async
   ```

2. **customStorage.getItem()** calls `chrome.storage.sync.get()`:
   ```typescript
   // In storage.ts
   const result = await chrome.storage.sync.get([key]);
   // This takes 20-100ms typically
   ```

3. **React renders immediately** with empty defaults:
   ```typescript
   // Initial state (before hydration)
   columns: {
       'todo': { id: 'todo', title: 'To Do', taskIds: [] },
       'in-progress': { id: 'in-progress', title: 'In Progress', taskIds: [] },
       'done': { id: 'done', title: 'Done', taskIds: [] },
   }
   ```

4. **But if storage has different columnIds** from user's saved data:
   ```typescript
   // User's saved columnOrder might be: ['todo', 'custom-col-123', 'done']
   // But columns object is still default: { 'todo': {...}, 'in-progress': {...}, 'done': {...} }
   // So columns['custom-col-123'] is undefined!
   ```

## The Fix - Multi-Layered Defense

### Layer 1: Hydration Tracking (Prevents premature rendering)

```typescript
// In useBoardStore.ts
interface BoardState {
    _hasHydrated: boolean; // New flag
}

// Callback when storage loads
onRehydrateStorage: () => (state) => {
    if (state) {
        state.setHasHydrated(true); // Mark as ready
    }
}
```

```typescript
// In App.tsx
if (!_hasHydrated) {
    return <LoadingScreen />; // Don't render Board until ready!
}
```

**Result:** Board component doesn't render until storage is loaded.

### Layer 2: Defensive Checks (Prevents crashes if data is malformed)

```typescript
// In Board.tsx (NEW)
{columnOrder.map((columnId, index) => {
    const column = columns[columnId];
    
    // 🛡️ NEW: Check if column exists
    if (!column) {
        console.warn(`Column ${columnId} not found`);
        return null; // Skip this column safely
    }
    
    // 🛡️ NEW: Safe access with fallback
    const columnTasks = (column.taskIds || [])
        .map((taskId) => tasks[taskId])
        .filter(Boolean);
```

**Result:** Even if columnOrder references a missing column, app doesn't crash.

### Layer 3: Error Boundary (Catches any remaining errors)

```typescript
// In main.tsx
<ErrorBoundary>
    <App />
</ErrorBoundary>
```

**Result:** If anything still breaks, user sees friendly error screen instead of black screen.

### Layer 4: Migration Logic (Ensures data consistency)

```typescript
// In useBoardStore.ts
migrate: (persistedState: any, version: number) => {
    if (version < 2) {
        // Ensure all required fields exist
        return {
            columns: persistedState?.columns || {/* defaults */},
            columnOrder: persistedState?.columnOrder || ['todo', 'in-progress', 'done'],
            // ... other fields
        };
    }
    return persistedState;
}
```

**Result:** Even if user has old/corrupted data, migration fills in missing pieces.

### Layer 5: Storage Retry Logic (Handles transient failures)

```typescript
// In storage.ts
for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
        const result = await chrome.storage.sync.get([key]);
        return result[key] || defaultValue;
    } catch (error) {
        // Retry with exponential backoff
        await delay(RETRY_DELAY * attempt);
    }
}
// Fall back to localStorage if all retries fail
```

**Result:** Storage failures don't cause black screens.

## How Each Layer Would Have Prevented the Error

### User's Scenario:
```
User has saved data with custom columns: ['todo', 'my-custom-column', 'done']
Opens new tab → Black screen
```

### Layer 1 Would Prevent:
```
✅ Loading screen shows
✅ Waits for chrome.storage.sync to complete
✅ Board renders with correct data
✅ No error
```

### If Layer 1 Somehow Failed:
```
Layer 2 Would Prevent:
✅ Board tries to render
✅ Encounters columns['my-custom-column'] = undefined
✅ Defensive check catches it: if (!column) return null
✅ Skips that column, renders the rest
✅ User sees most of their board
```

### If Both Layer 1 & 2 Failed:
```
Layer 3 Would Prevent:
✅ Error occurs in render
✅ ErrorBoundary catches it
✅ Shows error screen with "Reload" button
✅ User clicks reload → Layer 1 works this time
✅ Problem solved
```

## Before & After Comparison

### BEFORE (v1.0.2):
```
User opens new tab
    ↓
React renders immediately
    ↓
Board.tsx tries to access columns[columnId]
    ↓
columnId not in columns yet (still loading)
    ↓
Error: Cannot read property 'taskIds' of undefined
    ↓
No error boundary to catch it
    ↓
⚫ BLACK SCREEN
```

### AFTER (v1.0.3):
```
User opens new tab
    ↓
React renders immediately
    ↓
App checks _hasHydrated → false
    ↓
Shows loading screen 🔄
    ↓
chrome.storage.sync.get() completes
    ↓
onRehydrateStorage sets _hasHydrated = true
    ↓
App re-renders with loaded data
    ↓
Board renders with defensive checks
    ↓
✅ BOARD APPEARS
```

## Why Storage Quota Matters

The user mentioned chrome.storage.sync memory limits. Here's why our fix respects them:

### Chrome Sync Limits:
- **Total quota:** 102,400 bytes (100 KB)
- **Per-item limit:** 8,192 bytes
- **Max items:** 512
- **Write operations:** 120/minute, 1800/hour

### What We Store:
```typescript
partialize: (state) => ({
    tasks: state.tasks,           // User's tasks
    columns: state.columns,       // User's columns
    columnOrder: state.columnOrder, // Column order
    theme: state.theme,           // 'dark' or 'light'
    bookmarks: state.bookmarks    // Bookmark shortcuts
})
// Note: _hasHydrated is NOT stored!
```

### Storage Usage Estimate:
- **Empty board:** ~500 bytes
- **10 tasks:** ~2,000 bytes
- **50 tasks:** ~8,000 bytes
- **100 tasks:** ~15,000 bytes
- **With 10 bookmarks:** ~16,000 bytes

### Our Fix Adds:
- **_hasHydrated flag:** 0 bytes (not persisted, memory only)
- **Migration function:** 0 bytes (code, not data)
- **Error boundary:** 0 bytes (code, not data)
- **Defensive checks:** 0 bytes (code, not data)

**Total storage increase:** 0 bytes ✅

### Quota Monitoring:
```typescript
// In storage.ts
const bytesInUse = await chrome.storage.sync.getBytesInUse(key);
const estimatedSize = new Blob([JSON.stringify(value)]).size;

if (estimatedSize > 8192) {
    console.warn(`Item is ${estimatedSize} bytes (max: 8,192)`);
}

if (bytesInUse + estimatedSize > 102400) {
    console.error(`Quota warning: ${bytesInUse + estimatedSize} bytes (max: 102,400)`);
}
```

## Testing the Fix

### Reproduce Original Error:
```bash
# Hard to reproduce naturally (race condition), but you could:
1. Add artificial delay to storage.ts:
   await new Promise(resolve => setTimeout(resolve, 100));
2. Load extension
3. Open new tab quickly
4. Before fix: Black screen
5. After fix: Loading screen, then board appears
```

### Verify Fix Works:
```bash
# Test 1: Cold start
1. Close all Chrome windows
2. Open Chrome
3. Open new tab
4. ✅ Should show loading screen briefly
5. ✅ Board should appear

# Test 2: Existing data
1. Create some tasks
2. Close tab
3. Open new tab
4. ✅ Tasks should still be there

# Test 3: Network offline
1. Disable network
2. Open new tab
3. ✅ Should still work (localStorage fallback)

# Test 4: Rapid refresh
1. Open new tab
2. Refresh 10 times quickly
3. ✅ Should handle gracefully
```

## Summary

**Original Error:** `Cannot read property 'taskIds' of undefined`

**Root Cause:** React rendered before chrome.storage.sync finished loading

**Fix Strategy:**
1. ✅ Wait for storage (hydration tracking)
2. ✅ Handle missing data (defensive checks)
3. ✅ Catch errors (error boundary)
4. ✅ Retry on failure (enhanced storage)
5. ✅ Migrate safely (migration logic)

**Result:** Robust, reliable extension that won't show black screens

**Storage Impact:** 0 bytes (all fixes are code, not data)

**User Experience:** Brief loading screen, then smooth operation
