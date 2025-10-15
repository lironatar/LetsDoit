# Google Calendar Integration - Setup Guide

## Overview
This integration allows users to connect their Google Calendar and sync tasks automatically.

## Features
✅ OAuth2 authentication with Google Calendar (read-only)  
✅ View Google Calendar events in your app's calendar  
✅ Click events to open them in Google Calendar  
✅ Sync app tasks to Google Calendar  
✅ Visual connection status indicator  
✅ Easy disconnect option  

---

## Setup Instructions

### 1. Install Required Python Packages

Run the following command to install the Google Calendar API client:

```bash
pip install -r requirements.txt
```

Or manually install:
```bash
pip install google-api-python-client>=2.0.0
```

### 2. Run Database Migrations

Create and apply the database migration for the new `GoogleCalendarToken` model:

```bash
python manage.py migrate
```

### 3. Configure Google Cloud Console

#### Step 3.1: Enable Google Calendar API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** > **Library**
4. Search for "Google Calendar API"
5. Click **Enable**

#### Step 3.2: Configure OAuth Consent Screen
1. Go to **APIs & Services** > **OAuth consent screen**
2. Add the Calendar scope (READ-ONLY):
   - Click **Add or Remove Scopes**
   - Search for and add: `https://www.googleapis.com/auth/calendar.events.readonly`
3. Save and continue

#### Step 3.3: Update Existing OAuth Credentials
Since you already have OAuth credentials for Google login, you just need to add the calendar callback URL:

1. Go to **APIs & Services** > **Credentials**
2. Click on your existing "Let's Do This" OAuth client ID
3. In the **Authorized redirect URIs** section, you'll see your existing URIs:
   - `http://localhost:8000/api/auth/google-login/`
   - `http://localhost:8000/api`
   - `http://127.0.0.1:5173`
4. Click the **"Add URI"** button
5. Add this exact URL:
   ```
   http://localhost:8000/api/calendar/callback/
   ```
6. Click **Save**

### 4. Verify Django Settings

Your credentials should be configured in `todofast/settings.py`:

```python
GOOGLE_OAUTH2_CLIENT_ID = os.getenv('GOOGLE_OAUTH2_CLIENT_ID', 'your-client-id')
GOOGLE_OAUTH2_CLIENT_SECRET = os.getenv('GOOGLE_OAUTH2_CLIENT_SECRET', 'your-client-secret')
```

**No changes needed** - these are loaded from your environment variables that work for both Google login and Calendar integration!

---

## How It Works

### User Flow
1. User clicks "התחבר ליומן שלך" (Connect to your calendar) button
2. Redirected to Google OAuth consent screen
3. User grants calendar access
4. Redirected back to app with success message
5. Button changes to "יומן מחובר" (Calendar connected)
6. User can now:
   - Sync all tasks to calendar
   - Disconnect calendar

### Backend Flow
1. **Connect**: `/api/calendar/connect/` - Generates OAuth URL
2. **Callback**: `/api/calendar/callback/` - Handles OAuth response, saves tokens
3. **Status**: `/api/calendar/status/` - Checks if user is connected
4. **Sync All**: `/api/calendar/sync-all/` - Syncs all incomplete tasks with due dates
5. **Disconnect**: `/api/calendar/disconnect/` - Removes user's calendar tokens

### Data Storage
- Calendar tokens stored in `GoogleCalendarToken` model
- Includes: access_token, refresh_token, expiry, scopes
- One-to-one relationship with User model
- Tokens automatically refreshed when expired

---

## API Endpoints

### GET `/api/calendar/connect/`
**Auth**: Required  
**Returns**: `{ authorization_url: string }`  
Initiates OAuth flow and returns Google authorization URL

### GET `/api/calendar/callback/`
**Auth**: Not required (uses session)  
**Params**: `code`, `state`  
Handles OAuth callback, exchanges code for tokens

### GET `/api/calendar/status/`
**Auth**: Required  
**Returns**: `{ connected: boolean, email?: string, connected_at?: datetime }`  
Checks calendar connection status

### POST `/api/calendar/disconnect/`
**Auth**: Required  
**Returns**: `{ success: boolean, message: string }`  
Disconnects user's calendar

### POST `/api/calendar/sync/<task_id>/`
**Auth**: Required  
**Returns**: `{ success: boolean, event_id: string, event_link: string }`  
Syncs specific task to Google Calendar

### POST `/api/calendar/sync-all/`
**Auth**: Required  
**Returns**: `{ success: boolean, synced_count: number, total_tasks: number }`  
Syncs all incomplete tasks with due dates

---

## Frontend Components

### GoogleCalendarButton Component
Located: `frontend/src/components/GoogleCalendarButton.jsx`

**Features:**
- Shows "התחבר ליומן שלך" when disconnected
- Shows "יומן מחובר" with green styling when connected
- Dropdown menu for connected state:
  - Sync all tasks
  - Disconnect calendar
- Handles OAuth callback with URL parameters
- Loading states and error handling

**Props:**
- `currentUser`: Current user email/username

---

## Testing

### Test Connection Flow
1. Start backend: `python manage.py runserver`
2. Start frontend: `cd frontend && npm run dev`
3. Login to the app
4. Click "התחבר ליומן שלך" button
5. Grant calendar permissions in Google
6. Verify you're redirected back with success message
7. Check button now shows "יומן מחובר"

### Test Sync
1. Create a task with a due date
2. Click "יומן מחובר" > "סנכרן את כל המשימות"
3. Check your Google Calendar
4. Verify task appears as calendar event

### Test Disconnect
1. Click "יומן מחובר" > "נתק יומן"
2. Confirm disconnection
3. Verify button returns to "התחבר ליומן שלך"

---

## Troubleshooting

### "OAuth error: redirect_uri_mismatch"
- Verify redirect URI in Google Console exactly matches: `http://localhost:8000/api/calendar/callback/`
- Make sure there are no trailing slashes differences

### "Access blocked: TodoFast has not completed the Google verification process"
- Your app is in testing mode - add your email to test users in OAuth consent screen
- Or publish the app (requires verification for production use)

### Tokens not refreshing
- Check that refresh_token is being saved in database
- Ensure `access_type='offline'` is set in OAuth flow (already configured)
- Try disconnecting and reconnecting

### Calendar events not appearing
- Verify user has granted `calendar.events` scope
- Check task has valid due_time field
- Look for errors in browser console and Django logs

---

## Security Notes

⚠️ **Important for Production:**
1. Store client secret in environment variables, not in code
2. Use HTTPS for all OAuth redirects
3. Regularly rotate OAuth credentials
4. Implement rate limiting on sync endpoints
5. Consider encrypting stored tokens at rest

---

## Future Enhancements

Potential features to add:
- [ ] Two-way sync (calendar changes update tasks)
- [ ] Sync task updates to existing calendar events
- [ ] Delete calendar events when tasks are deleted
- [ ] Choose which calendar to sync to
- [ ] Custom event colors based on priority
- [ ] Sync task completion status
- [ ] Add task reminders to calendar events

---

## Support

For issues or questions:
1. Check browser console for errors
2. Check Django server logs
3. Verify Google Calendar API quota hasn't been exceeded
4. Test with a fresh OAuth consent (disconnect and reconnect)

Happy syncing! 📅

