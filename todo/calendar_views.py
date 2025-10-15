"""
Google Calendar Integration Views
"""
from django.conf import settings
from django.shortcuts import redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from datetime import datetime, timedelta, timezone as dt_timezone
import os
import json
import time
from django.utils import timezone
from django.db import transaction

from .models import GoogleCalendarToken, GoogleCalendarEvent, Task
from django.middleware.csrf import get_token

# Google Calendar OAuth scopes - Read-only access for security
SCOPES = [
    'https://www.googleapis.com/auth/calendar.events.readonly',
    'https://www.googleapis.com/auth/calendar.readonly'  # Need this to access calendar list and subscribed calendars
]

# OAuth callback redirect URI
REDIRECT_URI = 'http://localhost:8000/api/calendar/callback/'


def get_google_flow():
    """Create and return Google OAuth flow"""
    client_config = {
        "web": {
            "client_id": settings.GOOGLE_OAUTH2_CLIENT_ID,
            "client_secret": settings.GOOGLE_OAUTH2_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [REDIRECT_URI]
        }
    }
    
    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    
    return flow


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calendar_connect(request):
    """
    Initiate Google Calendar OAuth flow
    Returns the authorization URL for the user to visit
    """
    try:
        print(f"Calendar connect called by user: {request.user.email}")
        print(f"Session key: {request.session.session_key}")
        
        flow = get_google_flow()
        print("Flow created successfully")
        
        # Generate authorization URL
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent'  # Force consent to get refresh token
        )
        print(f"Authorization URL generated: {authorization_url[:100]}...")
        print(f"State generated: {state}")
        
        # Store state in session for verification
        request.session['google_calendar_state'] = state
        request.session['google_calendar_user_id'] = request.user.id
        request.session.save()  # Force save session
        
        print(f"Session saved. State: {request.session.get('google_calendar_state')}")
        print(f"User ID: {request.session.get('google_calendar_user_id')}")
        
        return Response({
            'success': True,
            'authorization_url': authorization_url
        })
        
    except Exception as e:
        print(f"Error initiating calendar OAuth: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': 'שגיאה בהתחברות ליומן Google'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def calendar_callback(request):
    """
    Handle OAuth callback from Google
    Exchange authorization code for access token
    """
    print("=" * 50)
    print("CALENDAR CALLBACK INITIATED")
    print("=" * 50)
    
    try:
        print(f"Request method: {request.method}")
        print(f"Request GET params: {dict(request.GET)}")
        print(f"Request session: {dict(request.session)}")
        print(f"Session key: {request.session.session_key}")
        print(f"User authenticated: {request.user.is_authenticated}")
        print(f"User: {request.user}")
        
        # Check for error parameters from Google
        error = request.GET.get('error')
        if error:
            print(f"Google OAuth error: {error}")
            error_description = request.GET.get('error_description', '')
            print(f"Error description: {error_description}")
            return redirect(f'http://localhost:5173?calendar_error=google_oauth_error&details={error}')
        
        # Verify state to prevent CSRF
        state = request.session.get('google_calendar_state')
        received_state = request.GET.get('state')
        print(f"Session state: {state}")
        print(f"Received state: {received_state}")
        
        if not state:
            print("ERROR: No state in session")
            return redirect('http://localhost:5173?calendar_error=no_state_in_session')
        
        if not received_state:
            print("ERROR: No state in request")
            return redirect('http://localhost:5173?calendar_error=no_state_in_request')
        
        if state != received_state:
            print("ERROR: State mismatch")
            print(f"Expected: {state}")
            print(f"Received: {received_state}")
            return redirect('http://localhost:5173?calendar_error=state_mismatch')
        
        # Get user from session
        user_id = request.session.get('google_calendar_user_id')
        print(f"User ID from session: {user_id}")
        
        if not user_id:
            print("ERROR: No user ID in session")
            return redirect('http://localhost:5173?calendar_error=no_user_in_session')
        
        from django.contrib.auth.models import User
        try:
            user = User.objects.get(id=user_id)
            print(f"Found user: {user.email}")
        except User.DoesNotExist:
            print(f"ERROR: User with ID {user_id} not found")
            return redirect('http://localhost:5173?calendar_error=user_not_found')
        
        # Exchange authorization code for credentials
        authorization_code = request.GET.get('code')
        if not authorization_code:
            print("ERROR: No authorization code in request")
            return redirect('http://localhost:5173?calendar_error=no_authorization_code')
        
        print(f"Authorization code: {authorization_code[:20]}...")
        
        try:
            flow = get_google_flow()
            print("Flow created successfully")
            
            # Disable strict scope validation to allow additional scopes from Google
            import os
            os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'
            
            flow.fetch_token(code=authorization_code)
            print("Token fetched successfully")
            
            credentials = flow.credentials
            print(f"Got credentials: {credentials.token[:20]}...")
            print(f"Credentials expiry: {credentials.expiry}")
            print(f"Credentials scopes: {credentials.scopes}")
            
        except Exception as flow_error:
            print(f"ERROR in token exchange: {str(flow_error)}")
            import traceback
            traceback.print_exc()
            return redirect('http://localhost:5173?calendar_error=token_exchange_failed')
        
        # Save credentials to database
        try:
            GoogleCalendarToken.from_credentials(user, credentials)
            print("Credentials saved to database successfully")
        except Exception as save_error:
            print(f"ERROR saving credentials: {str(save_error)}")
            import traceback
            traceback.print_exc()
            return redirect('http://localhost:5173?calendar_error=database_save_failed')
        
        # Clear session data
        request.session.pop('google_calendar_state', None)
        request.session.pop('google_calendar_user_id', None)
        print("Session data cleared")
        
        # Redirect back to frontend with success
        print("SUCCESS: Redirecting to success page")
        return redirect('http://localhost:5173?calendar_connected=true')
        
    except Exception as e:
        print(f"FATAL ERROR in calendar OAuth callback: {str(e)}")
        import traceback
        traceback.print_exc()
        return redirect('http://localhost:5173?calendar_error=callback_failed')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calendar_status(request):
    """
    Check if user has connected their Google Calendar
    """
    try:
        token = GoogleCalendarToken.objects.filter(
            user=request.user,
            is_active=True
        ).first()
        
        if token:
            return Response({
                'connected': True,
                'email': request.user.email,
                'connected_at': token.created_at
            })
        else:
            return Response({
                'connected': False
            })
            
    except Exception as e:
        print(f"Error checking calendar status: {str(e)}")
        return Response({
            'connected': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST', 'GET'])
@permission_classes([IsAuthenticated])
def calendar_disconnect(request):
    """
    Disconnect user's Google Calendar
    """
    try:
        GoogleCalendarToken.objects.filter(user=request.user).delete()
        
        return Response({
            'success': True,
            'message': 'היומן נותק בהצלחה'
        })
        
    except Exception as e:
        print(f"Error disconnecting calendar: {str(e)}")
        return Response({
            'success': False,
            'error': 'שגיאה בניתוק היומן'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@ensure_csrf_cookie
@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    """
    Get CSRF token - works for all users to set the CSRF cookie
    """
    csrf_token = get_token(request)
    return Response({
        'csrfToken': csrf_token,
        'detail': 'CSRF cookie set'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_task_to_calendar(request, task_id):
    """
    Sync a specific task to Google Calendar
    """
    try:
        # Get the user's calendar token
        calendar_token = GoogleCalendarToken.objects.filter(
            user=request.user,
            is_active=True
        ).first()
        
        if not calendar_token:
            return Response({
                'success': False,
                'error': 'לא מחובר ליומן Google'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get the task
        task = Task.objects.filter(id=task_id, owner=request.user).first()
        if not task:
            return Response({
                'success': False,
                'error': 'משימה לא נמצאה'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Build credentials
        credentials = calendar_token.to_credentials()
        
        # Refresh token if expired
        if credentials.expired and credentials.refresh_token:
            from google.auth.transport.requests import Request
            credentials.refresh(Request())
            GoogleCalendarToken.from_credentials(request.user, credentials)
        
        # Build Calendar API service
        service = build('calendar', 'v3', credentials=credentials)
        
        # Prepare event data
        event_data = {
            'summary': task.title,
            'description': task.description or '',
            'start': {},
            'end': {},
        }
        
        # Handle due_date
        if task.due_date:
            due_datetime = task.due_date
            
            # Check if it's a date-only (no time specified)
            if task.due_time is None:
                # All-day event
                event_data['start']['date'] = due_datetime.date().isoformat()
                event_data['end']['date'] = due_datetime.date().isoformat()
            else:
                # Timed event - combine date and time
                combined_datetime = datetime.combine(due_datetime.date(), task.due_time)
                event_data['start']['dateTime'] = combined_datetime.isoformat()
                event_data['start']['timeZone'] = 'Asia/Jerusalem'
                # End time is 1 hour after start
                end_time = combined_datetime + timedelta(hours=1)
                event_data['end']['dateTime'] = end_time.isoformat()
                event_data['end']['timeZone'] = 'Asia/Jerusalem'
        else:
            # No due date - create all-day event for today
            today = datetime.now().date().isoformat()
            event_data['start']['date'] = today
            event_data['end']['date'] = today
        
        # Create or update event in Google Calendar
        if hasattr(task, 'google_event_id') and task.google_event_id:
            # Update existing event
            event = service.events().update(
                calendarId='primary',
                eventId=task.google_event_id,
                body=event_data
            ).execute()
        else:
            # Create new event
            event = service.events().insert(
                calendarId='primary',
                body=event_data
            ).execute()
            
            # Store event ID in task (you may need to add this field to Task model)
            # task.google_event_id = event['id']
            # task.save()
        
        return Response({
            'success': True,
            'message': 'המשימה סונכרנה ליומן',
            'event_id': event['id'],
            'event_link': event.get('htmlLink')
        })
        
    except HttpError as e:
        print(f"Google API error: {str(e)}")
        return Response({
            'success': False,
            'error': 'שגיאה בסנכרון ליומן Google'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        print(f"Error syncing task to calendar: {str(e)}")
        return Response({
            'success': False,
            'error': 'שגיאה בסנכרון המשימה'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def sync_google_calendar_events(user, force_full_sync=False, start_date=None, end_date=None):
    """
    Sync Google Calendar events using lazy loading with date ranges
    Args:
        user: User object
        force_full_sync: Force full sync instead of incremental
        start_date: Start date for lazy loading (YYYY-MM-DD)
        end_date: End date for lazy loading (YYYY-MM-DD)
    Returns (events, sync_token, has_more)
    """
    try:
        # Get the user's calendar token
        calendar_token = GoogleCalendarToken.objects.filter(
            user=user,
            is_active=True
        ).first()
        
        if not calendar_token:
            print("❌ No Google Calendar token found for user")
            return [], None, False
        
        # Build credentials
        credentials = calendar_token.to_credentials()
        
        # Refresh token if expired
        if credentials.expired and credentials.refresh_token:
            from google.auth.transport.requests import Request
            credentials.refresh(Request())
            GoogleCalendarToken.from_credentials(user, credentials)
        
        # Build Calendar API service
        service = build('calendar', 'v3', credentials=credentials)
        
        all_events = []
        updated_sync_tokens = {}
        
        # Get list of calendars
        calendar_list = service.calendarList().list().execute()
        calendars = calendar_list.get('items', [])
        
        print(f"📅 Syncing events from {len(calendars)} calendars")
        
        # Initialize sync_tokens if not exists
        if not calendar_token.sync_tokens:
            calendar_token.sync_tokens = {}
        
        for calendar in calendars:
            calendar_id = calendar['id']
            calendar_summary = calendar.get('summary', 'Unknown Calendar')
            
            try:
                # Determine sync parameters
                sync_params = {
                    'calendarId': calendar_id,
                    'maxResults': 250,
                    'singleEvents': True,
                    'orderBy': 'startTime'
                }
                
                # Use incremental sync if available and not forcing full sync
                calendar_sync_token = calendar_token.sync_tokens.get(calendar_id)
                if not force_full_sync and calendar_sync_token:
                    # Incremental sync - use syncToken without time bounds
                    sync_params['syncToken'] = calendar_sync_token
                    print(f"📅 Using incremental sync for {calendar_summary} (token: {calendar_sync_token[:20]}...)")
                else:
                    # LAZY LOADING: Fetch only requested date range
                    from datetime import datetime, timedelta
                    
                    if start_date and end_date:
                        # Use provided date range (from frontend lazy loading)
                        time_min = datetime.strptime(start_date, '%Y-%m-%d').isoformat() + 'Z'
                        time_max = datetime.strptime(end_date, '%Y-%m-%d').isoformat() + 'Z'
                        sync_params['timeMin'] = time_min
                        sync_params['timeMax'] = time_max
                        print(f"📅 Lazy loading {calendar_summary}: {start_date} to {end_date}")
                    else:
                        # Default: Load current month ± 1 month
                        now = datetime.utcnow()
                        start = now - timedelta(days=30)
                        end = now + timedelta(days=60)
                        time_min = start.isoformat() + 'Z'
                        time_max = end.isoformat() + 'Z'
                        sync_params['timeMin'] = time_min
                        sync_params['timeMax'] = time_max
                        print(f"📅 Initial load {calendar_summary}: ±3 months from now")
                
                # Fetch events with pagination handling
                events = []
                page_token = None
                new_sync_token = None
                
                while True:
                    # Add page token if we're paginating
                    if page_token:
                        sync_params['pageToken'] = page_token
                    
                    # Make API call
                    events_result = service.events().list(**sync_params).execute()
                    page_events = events_result.get('items', [])
                    events.extend(page_events)
                    
                    # Check for sync token (only on first page)
                    if new_sync_token is None:
                        new_sync_token = events_result.get('nextSyncToken')
                    
                    # Check for pagination
                    page_token = events_result.get('nextPageToken')
                    if not page_token:
                        break
                    
                    # Remove pageToken from params for next iteration
                    sync_params.pop('pageToken', None)
                
                # Store the sync token for this calendar
                if new_sync_token:
                    updated_sync_tokens[calendar_id] = new_sync_token
                
                print(f"📅 Calendar '{calendar_summary}': {len(events)} events (new token: {new_sync_token[:20] if new_sync_token else 'None'}...)")
                
                # Process events
                for event in events:
                    event['_calendar_summary'] = calendar_summary
                    event['_calendar_id'] = calendar_id
                    all_events.append(event)
                
            except Exception as cal_error:
                print(f"❌ Error syncing calendar '{calendar_summary}': {str(cal_error)}")
                # Check if it's a sync token error (410 Gone)
                if "410" in str(cal_error) or "gone" in str(cal_error).lower():
                    print(f"🔄 Sync token expired for {calendar_summary}, will do full sync next time")
                    # Remove the invalid sync token
                    if calendar_id in calendar_token.sync_tokens:
                        del calendar_token.sync_tokens[calendar_id]
                continue
        
        # Update sync tokens for all calendars
        if updated_sync_tokens:
            calendar_token.sync_tokens.update(updated_sync_tokens)
            calendar_token.last_sync_time = timezone.now()
            calendar_token.save()
            print(f"📅 Updated sync tokens for {len(updated_sync_tokens)} calendars")
        
        return all_events, updated_sync_tokens, False
        
    except Exception as e:
        print(f"❌ Error in sync_google_calendar_events: {str(e)}")
        import traceback
        traceback.print_exc()
        return [], None, False


def cache_events(user, events):
    """
    Cache Google Calendar events in the database for faster retrieval
    Uses atomic transactions and retry logic to handle database locks
    """
    def cache_single_event_with_retry(event, max_retries=3):
        """Cache a single event with retry logic for database locks"""
        for attempt in range(max_retries):
            try:
                event_id = event.get('id', '')
                if not event_id:
                    return None, False
                    
                title = event.get('summary', 'No Title')
                description = event.get('description', '')
                html_link = event.get('htmlLink', '')
                color_id = event.get('colorId', '')
                calendar_id = event.get('_calendar_id', '')
                calendar_summary = event.get('_calendar_summary', 'Unknown Calendar')
                
                # Handle start and end times
                start_data = event.get('start', {})
                end_data = event.get('end', {})
                
                # Determine if it's an all-day event
                is_all_day = 'date' in start_data
                
                if is_all_day:
                    # All-day event
                    start_date = start_data.get('date', '')
                    end_date = end_data.get('date', '')
                    start_time = datetime.strptime(start_date, '%Y-%m-%d').replace(tzinfo=dt_timezone.utc)
                    end_time = datetime.strptime(end_date, '%Y-%m-%d').replace(tzinfo=dt_timezone.utc)
                else:
                    # Timed event
                    start_time_str = start_data.get('dateTime', '')
                    end_time_str = end_data.get('dateTime', '')
                    start_time = datetime.fromisoformat(start_time_str.replace('Z', '+00:00'))
                    end_time = datetime.fromisoformat(end_time_str.replace('Z', '+00:00'))
                
                # Use atomic transaction for database operation
                with transaction.atomic():
                    cached_event, created = GoogleCalendarEvent.objects.update_or_create(
                        user=user,
                        google_event_id=event_id,
                        defaults={
                            'calendar_id': calendar_id,
                            'calendar_summary': calendar_summary,
                            'title': title,
                            'description': description,
                            'start_time': start_time,
                            'end_time': end_time,
                            'is_all_day': is_all_day,
                            'html_link': html_link,
                            'color_id': color_id,
                            'event_data': event,
                            'is_active': True
                        }
                    )
                return cached_event, created
                
            except Exception as e:
                if 'database is locked' in str(e).lower() and attempt < max_retries - 1:
                    # Wait with exponential backoff before retrying
                    wait_time = 0.1 * (2 ** attempt)  # 0.1s, 0.2s, 0.4s
                    time.sleep(wait_time)
                    continue
                else:
                    # Log the error but don't crash the entire caching process
                    print(f"⚠️  Error caching event {event.get('id', 'unknown')}: {str(e)}")
                    return None, False
        
        return None, False
    
    try:
        cached_count = 0
        updated_count = 0
        error_count = 0
        
        # Process events in batches to reduce lock contention
        batch_size = 10
        for i in range(0, len(events), batch_size):
            batch = events[i:i + batch_size]
            
            for event in batch:
                cached_event, created = cache_single_event_with_retry(event)
                
                if cached_event:
                    if created:
                        cached_count += 1
                    else:
                        updated_count += 1
                elif cached_event is None:
                    error_count += 1
            
            # Small delay between batches to reduce lock contention
            if i + batch_size < len(events):
                time.sleep(0.05)
        
        if cached_count + updated_count > 0:
            print(f"📅 Cached {cached_count} new events, updated {updated_count} events" + 
                  (f", {error_count} errors" if error_count > 0 else ""))
        
    except Exception as e:
        print(f"❌ Error in cache_events: {str(e)}")
        import traceback
        traceback.print_exc()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_calendar_events(request):
    """
    Fetch Google Calendar events for display in the calendar view
    Uses incremental synchronization for efficiency
    Supports date range filtering for performance optimization
    """
    try:
        # Get date range parameters for filtering (Todoist approach)
        start_date = request.GET.get('start_date')  # Format: YYYY-MM-DD
        end_date = request.GET.get('end_date')      # Format: YYYY-MM-DD
        
        # Check if we should force a full sync
        force_full_sync = request.GET.get('force_full_sync', 'false').lower() == 'true'
        
        # Use lazy loading with date range (Todoist approach)
        try:
            events, sync_tokens, has_more = sync_google_calendar_events(
                request.user, 
                force_full_sync=force_full_sync,
                start_date=start_date,
                end_date=end_date
            )
            print(f"📅 Lazy load returned {len(events) if events else 0} events for range {start_date} to {end_date}")
        except Exception as sync_error:
            print(f"❌ Error in sync_google_calendar_events: {str(sync_error)}")
            import traceback
            traceback.print_exc()
            events = []
            sync_tokens = {}
            has_more = False
        
        if not events:
            # Try to get cached events if API sync fails
            cached_events = GoogleCalendarEvent.objects.filter(
                user=request.user,
                is_active=True,
                start_time__gte=timezone.now() - timedelta(days=30),
                start_time__lte=timezone.now() + timedelta(days=90)
            ).order_by('start_time')
            
            if cached_events.exists():
                print(f"📅 Using {cached_events.count()} cached events")
                formatted_events = []
                for event in cached_events:
                    formatted_events.append({
                        'id': event.google_event_id,
                        'title': event.title,
                        'description': event.description or '',
                        'start': event.start_time.isoformat() if not event.is_all_day else event.start_time.strftime('%Y-%m-%d'),
                        'end': event.end_time.isoformat() if not event.is_all_day else event.end_time.strftime('%Y-%m-%d'),
                        'is_all_day': event.is_all_day,
                        'html_link': event.html_link or '',
                        'color': event.color_id or '',
                        'calendar_summary': event.calendar_summary,
                        'calendar_id': event.calendar_id,
                        'google_event_id': event.google_event_id
                    })
                
                return Response({
                    'success': True,
                    'events': formatted_events,
                    'message': f'נטענו {len(formatted_events)} אירועים (מטמון)'
                })
            
            return Response({
                'success': True,
                'events': [],
                'message': 'לא מחובר ליומן Google או אין אירועים'
            })
        
        # Cache events for future use
        cache_events(request.user, events)
        
        # OPTIMIZATION NOTE: Backend filtering is DISABLED
        # Frontend will handle visible range filtering for better performance
        # This allows the frontend to quickly filter by visible range without API calls
        # Backend returns all synced events (default: last 30 days to next 90 days from sync)
        print(f"📅 Backend returning {len(events)} total events (no backend filtering - frontend will handle visible range)")
        
        # Format events for frontend
        formatted_events = []
        for event in events:
            # Extract event details
            event_id = event.get('id', '')
            title = event.get('summary', 'No Title')
            description = event.get('description', '')
            html_link = event.get('htmlLink', '')
            color_id = event.get('colorId', '')
            
            # Handle start and end times
            start_data = event.get('start', {})
            end_data = event.get('end', {})
            
            # Determine if it's an all-day event
            is_all_day = 'date' in start_data
            
            if is_all_day:
                # All-day event
                start_date = start_data.get('date', '')
                end_date = end_data.get('date', '')
                start_time = start_date
                end_time = end_date
            else:
                # Timed event
                start_time = start_data.get('dateTime', '')
                end_time = end_data.get('dateTime', '')
            
            # Add calendar info
            calendar_summary = event.get('_calendar_summary', 'Unknown Calendar')
            calendar_id = event.get('_calendar_id', '')
            
            formatted_events.append({
                'id': event_id,
                'title': title,
                'description': description,
                'start': start_time,
                'end': end_time,
                'is_all_day': is_all_day,
                'html_link': html_link,
                'color': color_id,
                'calendar_summary': calendar_summary,
                'calendar_id': calendar_id,
                'google_event_id': event_id
            })
        
        sync_type = "incremental" if not force_full_sync else "full"
        print(f"📅 Returning {len(formatted_events)} events ({sync_type} sync)")
        
        return Response({
            'success': True,
            'events': formatted_events,
            'message': f'נטענו {len(formatted_events)} אירועים ({sync_type})',
            'sync_tokens': sync_tokens,
            'has_more': has_more
        })
        
        # Get events from now onwards (next 90 days for calendar view)
        from datetime import datetime, timedelta
        now = datetime.utcnow().isoformat() + 'Z'
        end_date = (datetime.utcnow() + timedelta(days=90)).isoformat() + 'Z'
        
        print(f"📅 Fetching Google Calendar events from {now} to {end_date}")
        
        # First, get list of all calendars (including subscribed ones like holidays)
        try:
            calendar_list = service.calendarList().list().execute()
            calendars = calendar_list.get('items', [])
            
            print(f"📅 Found {len(calendars)} calendars")
            for cal in calendars:
                print(f"  - {cal.get('summary', 'Unknown')} ({cal.get('id', 'No ID')}) - Access: {cal.get('accessRole', 'Unknown')} - Type: {cal.get('type', 'Unknown')}")
                # Check for holiday calendars specifically
                if ('holiday' in cal.get('summary', '').lower() or 
                    'israel' in cal.get('summary', '').lower() or
                    'heb' in cal.get('summary', '').lower() or
                    'jewish' in cal.get('summary', '').lower()):
                    print(f"    🎉 Found potential holiday calendar: {cal.get('summary')} (ID: {cal.get('id')})")
        except Exception as calendar_list_error:
            print(f"❌ Error fetching calendar list: {str(calendar_list_error)}")
            # Fallback to primary calendar only
            calendars = [{'id': 'primary', 'summary': 'Primary Calendar'}]
        
        # Fetch events from all calendars (primary + subscribed)
        all_events = []
        
        for calendar in calendars:
            calendar_id = calendar['id']
            calendar_summary = calendar.get('summary', 'Unknown Calendar')
            
            try:
                events_result = service.events().list(
                    calendarId=calendar_id,
                    timeMin=now,
                    timeMax=end_date,
                    maxResults=250,
                    singleEvents=True,
                    orderBy='startTime'
                ).execute()
                
                calendar_events = events_result.get('items', [])
                print(f"📅 Calendar '{calendar_summary}': {len(calendar_events)} events")
                
                # Log first few events from each calendar for debugging
                for i, event in enumerate(calendar_events[:3]):  # Show first 3 events
                    event_title = event.get('summary', 'No title')
                    event_start = event.get('start', {})
                    print(f"    Event {i+1}: {event_title} - Start: {event_start}")
                
                # Special logging for holiday calendars
                if ('holiday' in calendar_summary.lower() or 
                    'israel' in calendar_summary.lower() or
                    'heb' in calendar_summary.lower()):
                    print(f"    🎉 HOLIDAY CALENDAR: {calendar_summary} has {len(calendar_events)} events")
                
                # Add calendar info to each event for debugging
                for event in calendar_events:
                    event['_calendar_summary'] = calendar_summary
                    event['_calendar_id'] = calendar_id
                
                all_events.extend(calendar_events)
                
            except Exception as cal_error:
                print(f"❌ Error fetching from calendar '{calendar_summary}': {str(cal_error)}")
                continue
        
        # Deduplicate events that might appear in multiple calendars
        seen_events = set()
        deduplicated_events = []
        
        for event in all_events:
            # Create a unique key based on title, start time, and calendar
            event_key = f"{event.get('summary', '')}_{event.get('start', {})}_{event.get('_calendar_id', '')}"
            
            if event_key not in seen_events:
                seen_events.add(event_key)
                deduplicated_events.append(event)
            else:
                print(f"🔄 Deduplicated event: {event.get('summary', 'No title')} from {event.get('_calendar_summary', 'Unknown')}")
        
        events = deduplicated_events
        print(f"📅 Total events found across all calendars: {len(all_events)}")
        print(f"📅 Deduplicated events: {len(events)}")
        
        # Format events for frontend display (NO TASK CREATION)
        formatted_events = []
        
        for event in events:
            try:
                # Get event details
                summary = event.get('summary', 'Untitled Event')
                description = event.get('description', '')
                event_id = event.get('id')
                html_link = event.get('htmlLink', '')  # Link to open in Google Calendar
                
                # Get start and end times
                start = event.get('start', {})
                end = event.get('end', {})
                
                if 'dateTime' in start:
                    # Timed event
                    start_datetime = start['dateTime']
                    end_datetime = end.get('dateTime', start_datetime)
                    is_all_day = False
                elif 'date' in start:
                    # All-day event
                    start_datetime = start['date']
                    end_datetime = end.get('date', start_datetime)
                    is_all_day = True
                else:
                    # No time specified, skip
                    continue
                
                formatted_events.append({
                    'id': f'gcal_{event_id}',  # Prefix to distinguish from app tasks
                    'google_event_id': event_id,
                    'title': summary,
                    'description': description,
                    'start': start_datetime,
                    'end': end_datetime,
                    'is_all_day': is_all_day,
                    'html_link': html_link,
                    'source': 'google_calendar',  # Mark as Google Calendar event
                    'color': '#4285f4',  # Google Calendar blue
                    'calendar_summary': event.get('_calendar_summary', 'Unknown Calendar'),
                    'calendar_id': event.get('_calendar_id', 'unknown'),
                })
                
            except Exception as event_error:
                print(f"❌ Error formatting event: {str(event_error)}")
                continue
        
        print(f"✅ Returning {len(formatted_events)} formatted events")
        
        return Response({
            'success': True,
            'events': formatted_events,
            'count': len(formatted_events)
        })
        
    except HttpError as e:
        print(f"Google API error: {str(e)}")
        return Response({
            'success': False,
            'error': 'שגיאה בגישה ליומן Google',
            'events': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        print(f"Error fetching calendar events: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': 'שגיאה בטעינת אירועים',
            'events': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_calendar_incremental(request):
    """
    Force an incremental sync of Google Calendar events
    """
    try:
        print(f"🔄 Starting incremental sync for user: {request.user.email}")
        
        # Force a full sync to get the latest changes
        events, sync_tokens, has_more = sync_google_calendar_events(request.user, force_full_sync=True)
        
        # Cache the events
        cache_events(request.user, events)
        
        return Response({
            'success': True,
            'message': f'סונכרנו {len(events)} אירועים',
            'events_count': len(events),
            'sync_tokens': sync_tokens
        })
        
    except Exception as e:
        print(f"❌ Error in sync_calendar_incremental: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': 'שגיאה בסנכרון אירועי יומן',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_specific_event(request, event_id):
    """
    Get a specific Google Calendar event by ID
    """
    try:
        # Get the user's calendar token
        calendar_token = GoogleCalendarToken.objects.filter(
            user=request.user,
            is_active=True
        ).first()
        
        if not calendar_token:
            return Response({
                'success': False,
                'error': 'לא מחובר ליומן Google'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # Build credentials
        credentials = calendar_token.to_credentials()
        
        # Refresh token if expired
        if credentials.expired and credentials.refresh_token:
            from google.auth.transport.requests import Request
            credentials.refresh(Request())
            GoogleCalendarToken.from_credentials(request.user, credentials)
        
        # Build Calendar API service
        service = build('calendar', 'v3', credentials=credentials)
        
        # Get the specific event
        event = service.events().get(calendarId='primary', eventId=event_id).execute()
        
        return Response({
            'success': True,
            'event': event
        })
        
    except Exception as e:
        print(f"❌ Error getting specific event: {str(e)}")
        return Response({
            'success': False,
            'error': 'שגיאה בטעינת האירוע',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_all_tasks(request):
    """
    Sync all incomplete tasks with due dates to Google Calendar
    """
    try:
        print(f"🔄 Starting sync_all_tasks for user: {request.user.email}")
        # Get the user's calendar token
        calendar_token = GoogleCalendarToken.objects.filter(
            user=request.user,
            is_active=True
        ).first()
        
        if not calendar_token:
            return Response({
                'success': False,
                'error': 'לא מחובר ליומן Google'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get all incomplete tasks with due dates
        tasks = Task.objects.filter(
            owner=request.user,
            is_completed=False,
            due_date__isnull=False
        )
        
        print(f"📋 Found {len(tasks)} tasks to sync")
        for task in tasks:
            print(f"  - Task: {task.title} (due: {task.due_date}, time: {task.due_time})")
        
        # Build credentials
        credentials = calendar_token.to_credentials()
        
        # Refresh token if expired
        if credentials.expired and credentials.refresh_token:
            from google.auth.transport.requests import Request
            credentials.refresh(Request())
            GoogleCalendarToken.from_credentials(request.user, credentials)
        
        # Build Calendar API service
        service = build('calendar', 'v3', credentials=credentials)
        
        synced_count = 0
        errors = []
        
        for task in tasks:
            try:
                # Prepare event data
                event_data = {
                    'summary': task.title,
                    'description': task.description or '',
                    'start': {},
                    'end': {},
                }
                
                # Handle due_date
                if task.due_date:
                    due_datetime = task.due_date
                    
                    # Check if it's a date-only (no time specified)
                    if task.due_time is None:
                        # All-day event
                        event_data['start']['date'] = due_datetime.date().isoformat()
                        event_data['end']['date'] = due_datetime.date().isoformat()
                    else:
                        # Timed event - combine date and time
                        if task.due_time:
                            # Combine date and time
                            combined_datetime = datetime.combine(due_datetime.date(), task.due_time)
                            event_data['start']['dateTime'] = combined_datetime.isoformat()
                            event_data['start']['timeZone'] = 'Asia/Jerusalem'
                            end_time = combined_datetime + timedelta(hours=1)
                            event_data['end']['dateTime'] = end_time.isoformat()
                            event_data['end']['timeZone'] = 'Asia/Jerusalem'
                        else:
                            # Date only, no time
                            event_data['start']['date'] = due_datetime.date().isoformat()
                            event_data['end']['date'] = due_datetime.date().isoformat()
                else:
                    # No due date - create all-day event for today
                    today = datetime.now().date().isoformat()
                    event_data['start']['date'] = today
                    event_data['end']['date'] = today
                
                # Create event
                event = service.events().insert(
                    calendarId='primary',
                    body=event_data
                ).execute()
                
                synced_count += 1
                
            except Exception as task_error:
                errors.append(f"Task {task.id}: {str(task_error)}")
                print(f"Error syncing task {task.id}: {str(task_error)}")
        
        return Response({
            'success': True,
            'message': f'סונכרנו {synced_count} משימות ליומן',
            'synced_count': synced_count,
            'total_tasks': len(tasks),
            'errors': errors if errors else None
        })
        
    except Exception as e:
        print(f"❌ Error syncing all tasks: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'error': 'שגיאה בסנכרון המשימות',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

