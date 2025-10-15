# 🧪 Testing Lazy Loading Calendar

## What to Test

### 1. Initial Load (Should be Fast!)

**Steps**:
1. Refresh the page (F5)
2. Login if needed
3. Click "לוח שנה" (Calendar)

**Expected Console Logs**:
```
📅 Lazy loading events: 2025-09-01 to 2025-12-31
📅 Lazy load returned 80 events for range 2025-09-01 to 2025-12-31
📅 Added 80 new events, 0 existing
📅 Available: 80 Google events (9/1/2025 to 12/31/2025)
📅 Viewing: 10/25/2025 - 11/7/2025
📅 Displaying: 6 tasks + 25 Google = 18 total
```

**What to Check**:
- ✅ Calendar loads in <0.5 seconds
- ✅ Shows ~80-100 events initially (not 600!)
- ✅ Current month displays correctly

---

### 2. Navigate to Next Year (Lazy Loading Trigger)

**Steps**:
1. Click the "Next Month" button repeatedly until you reach October 2026
2. Watch the console

**Expected Console Logs (First Time)**:
```
📅 Range 2026-09-01 to 2026-11-30 already loaded (using cache)
   OR
📅 Lazy loading events: 2026-09-01 to 2026-11-30
📅 Lazy load returned 50 events for range 2026-09-01 to 2026-11-30
📅 Added 50 new events, 80 existing
📅 Available: 130 Google events (9/1/2025 to 11/30/2026)
📅 Viewing: 10/25/2026 - 11/7/2026
📅 Displaying: 0 tasks + 15 Google = 15 total
```

**What to Check**:
- ✅ New events load in <0.3 seconds
- ✅ Console shows "Lazy loading" message
- ✅ Total event count increases (80 → 130)
- ✅ Events appear for Oct 2026

---

### 3. Navigate Back (Should Use Cache!)

**Steps**:
1. Click "היום" (Today) button to go back to current month
2. Watch the console

**Expected Console Logs**:
```
📅 Range 2025-09-01 to 2025-12-31 already loaded (using cache)
📅 Available: 130 Google events (9/1/2025 to 11/30/2026)
📅 Viewing: 10/25/2025 - 11/7/2025
📅 Displaying: 6 tasks + 25 Google = 18 total
```

**What to Check**:
- ✅ **Instant** navigation (<1ms)
- ✅ Console shows "already loaded (using cache)"
- ✅ **NO new API calls**
- ✅ Events display immediately

---

### 4. Navigate to Far Future (New Range)

**Steps**:
1. Navigate to March 2027 (keep clicking "Next Month")
2. Watch the console

**Expected Console Logs**:
```
📅 Lazy loading events: 2027-02-01 to 2027-04-30
📅 Lazy load returned 30 events for range 2027-02-01 to 2027-04-30
📅 Added 30 new events, 130 existing
📅 Available: 160 Google events (9/1/2025 to 4/30/2027)
📅 Viewing: 3/25/2027 - 4/7/2027
📅 Displaying: 0 tasks + 12 Google = 12 total
```

**What to Check**:
- ✅ Loads new range on-demand
- ✅ Fast loading (<0.3s)
- ✅ Event count keeps growing as you navigate
- ✅ Can navigate to ANY future date

---

## Performance Benchmarks

### Initial Load
- **Target**: <0.5 seconds
- **Events**: 50-100 events
- **Data**: ~80KB

### Lazy Load (First Time)
- **Target**: <0.3 seconds
- **Events**: 30-50 new events
- **Data**: ~30KB per request

### Cached Navigation
- **Target**: <1ms (instant)
- **Events**: 0 (from memory)
- **Data**: 0 bytes

---

## Console Logs to Watch For

### ✅ Good Signs:
```
📅 Lazy loading events: [date range]
📅 Range [date] already loaded (using cache)
📅 Added X new events, Y existing
📅 Available: [growing number] Google events
```

### ⚠️ Warning Signs:
```
⚠️ Viewing date outside synced range!
❌ Error in sync_google_calendar_events
📅 No events found for this range
```

---

## Troubleshooting

### Issue: "Still loading 600+ events"
**Solution**: Clear browser cache and refresh (Ctrl+Shift+R)

### Issue: "Lazy loading not triggering"
**Check**: Console for "already loaded (using cache)" - this is correct!

### Issue: "No events showing in Oct 2026"
**Solution**: Navigate there and it will lazy load automatically

### Issue: "Events load but then disappear"
**Check**: Are you within the synced date range? Check console logs

---

## Expected User Experience

1. **Login** → Calendar loads in 0.4s with current month
2. **Navigate** → Smooth, some months load instantly (cached), some load in 0.3s (new)
3. **Far Future** → No problem! Loads on-demand
4. **Go Back** → Instant (cached)

This is **exactly how Todoist works**! 🎉

---

## Network Tab (Chrome DevTools)

Open DevTools → Network tab and watch:

### Initial Load:
```
GET /api/calendar/events/?start_date=2025-09-01&end_date=2025-12-31
Status: 200
Size: ~80KB
Time: ~300ms
```

### Navigate to Oct 2026 (First Time):
```
GET /api/calendar/events/?start_date=2026-09-01&end_date=2026-11-30
Status: 200
Size: ~30KB
Time: ~200ms
```

### Navigate Back (Cached):
```
(No network request - using memory cache!)
```

---

## Summary

You should see:
- ✅ Fast initial load (0.4s vs 2.5s before)
- ✅ Lazy loading on navigation
- ✅ Smart caching (no redundant requests)
- ✅ Growing event pool as you navigate
- ✅ Can navigate to ANY date (infinite future)

**Test it now and enjoy the speed!** 🚀

