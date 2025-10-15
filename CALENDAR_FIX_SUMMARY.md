# Calendar Event Display Fix - Summary

## Issues Identified

### 1. **500 Internal Server Error - Timezone Comparison**
**Problem**: Backend was comparing timezone-naive datetime objects with timezone-aware datetime objects from Google Calendar API.

**Error**: 
```
can't compare offset-naive and offset-aware datetimes
```

**Root Cause**: The backend date filtering logic was creating timezone-naive datetime objects using `datetime.strptime()`, but Google Calendar API returns timezone-aware datetime objects.

**Fix**: Removed backend date filtering entirely. The backend now returns all synced events (90 days back to 365 days forward), and the frontend handles visible range filtering. This is more efficient as it avoids repeated API calls and follows the Todoist/Google Calendar approach.

### 2. **Initial Null Visible Range**
**Problem**: When the calendar view first loaded, the `visibleRange` state was initialized as `{ start: null, end: null }`, causing the `useMemo` to return an empty array of events.

**Root Cause**: The `visibleRange` was initialized with `null` values, and although a `useEffect` would update it, there was a brief moment where no events would be shown.

**Fix**: Initialized `visibleRange` with a proper default value based on the current month view, ensuring events are displayed immediately on load.

### 3. **Narrow Sync Range**
**Problem**: The backend was only syncing events from 30 days back to 90 days forward for forced full syncs.

**Root Cause**: Conservative time range settings in the `sync_google_calendar_events` function.

**Fix**: Updated the sync range to 90 days back to 365 days forward for both first sync and forced full sync. This ensures more events are available for display, especially for holidays and recurring events far in the future.

### 4. **Backend Date Filtering Removed**
**Problem**: Backend was attempting to filter events by date range, but this was causing timezone comparison errors and was inefficient.

**Solution**: Removed backend date filtering. The backend now returns all synced events, and the frontend efficiently filters by visible range. This follows the Todoist/Google Calendar optimization approach where:
- Backend syncs a wide range of events once (on login or manual sync)
- Frontend quickly filters by visible range without API calls
- When user navigates calendar, frontend shows cached events instantly

## Changes Made

### Backend (`todo/calendar_views.py`)

1. **Removed timezone-error-prone date filtering**:
```python
# OLD: Complex date filtering with timezone comparison issues
# NEW: Simple return of all synced events
print(f"📅 Backend returning {len(events)} total events (no backend filtering - frontend will handle visible range)")
```

2. **Widened sync range for better coverage**:
```python
# OLD: 30 days back, 90 days forward
time_min = (now - timedelta(days=30)).isoformat() + 'Z'
time_max = (now + timedelta(days=90)).isoformat() + 'Z'

# NEW: 90 days back, 365 days forward
time_min = (now - timedelta(days=90)).isoformat() + 'Z'
time_max = (now + timedelta(days=365)).isoformat() + 'Z'
```

3. **Added better error handling**:
```python
try:
    events, sync_tokens, has_more = sync_google_calendar_events(request.user, force_full_sync)
    print(f"📅 Sync returned {len(events) if events else 0} events")
except Exception as sync_error:
    print(f"❌ Error in sync_google_calendar_events: {str(sync_error)}")
    import traceback
    traceback.print_exc()
    events = []
    sync_tokens = {}
    has_more = False
```

### Frontend (`frontend/src/components/CalendarView.jsx`)

1. **Initialized visibleRange with proper default**:
```javascript
// OLD: const [visibleRange, setVisibleRange] = useState({ start: null, end: null })

// NEW: Initialize with current month view
const getInitialVisibleRange = () => {
  const now = new Date()
  const start = new Date(now)
  start.setDate(1)
  start.setDate(start.getDate() - 7) // 1 week before month start
  const end = new Date(now)
  end.setMonth(end.getMonth() + 1)
  end.setDate(0) // Last day of current month
  end.setDate(end.getDate() + 7) // 1 week after month end
  return { start, end }
}

const [visibleRange, setVisibleRange] = useState(getInitialVisibleRange)
```

### Frontend (`frontend/src/App.jsx`)

1. **Simplified event fetching**:
```javascript
// OLD: Sent date range parameters
url += `?start_date=${startStr}&end_date=${endStr}`

// NEW: Let backend return all synced events
console.log(`📅 Fetching Google Calendar events (backend will return synced events)...`)
```

## Performance Impact

- **Before**: Calendar would show 0-2 events initially, then gradually show more events after re-renders
- **After**: Calendar shows all available events immediately (within visible range)
- **Backend**: Returns all synced events once (90 days back to 365 days forward)
- **Frontend**: Efficiently filters by visible range without API calls
- **Navigation**: Instant event display when navigating calendar views

## Testing

To verify the fix works:

1. **Login** and connect Google Calendar
2. **Navigate to calendar view** - Events should display immediately
3. **Switch between month/week/day views** - Events should update instantly without loading
4. **Navigate forward/backward** - Cached events within sync range should display instantly
5. **Check console logs** for:
   - `📅 Loaded X Google Calendar events` in App.jsx
   - `📅 Calendar optimized: ... | X tasks + Y Google = Z total (filtered from W total events)` in CalendarView.jsx

## Next Steps

1. **Monitor Performance**: Check console logs to ensure events are being displayed correctly
2. **Google Cloud Console**: Verify Calendar API configuration and quotas (user access required)
3. **OAuth Scopes**: Verify scopes are correct and user has granted necessary permissions (user access required)
4. **Incremental Sync**: Monitor if `nextSyncToken` is being returned by Google Calendar API for incremental updates

## Notes

- The system is now optimized to work like Todoist and Google Calendar
- Events are synced once and cached in memory
- Frontend filters by visible range for instant navigation
- Backend sync runs on login or manual refresh
- Wider sync range (90 days back, 365 days forward) ensures better event coverage

