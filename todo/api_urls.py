from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    TaskViewSet, ProjectViewSet, LabelViewSet, UserViewSet, TeamViewSet, FriendViewSet,
    NotificationViewSet, ProjectShareViewSet,
    register_user, login_user, google_login, verify_email, resend_verification,
    complete_onboarding_standalone, debug_user_names, fix_hebrew_user,
    get_invitation_info, accept_invitation_on_registration, simple_db_check, debug_auth_status
)
from .calendar_views import (
    calendar_connect, calendar_callback, calendar_status, calendar_disconnect,
    sync_task_to_calendar, sync_all_tasks, get_calendar_events, get_csrf_token,
    sync_calendar_incremental, get_specific_event
)

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'teams', TeamViewSet, basename='team')
router.register(r'labels', LabelViewSet, basename='label')
router.register(r'users', UserViewSet, basename='user')
router.register(r'friends', FriendViewSet, basename='friend')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'project-shares', ProjectShareViewSet, basename='projectshare')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', register_user, name='register'),
    path('auth/login/', login_user, name='login'),
    path('auth/google-login/', google_login, name='google_login'),
    path('auth/verify-email/<str:token>/', verify_email, name='verify_email'),
    path('auth/resend-verification/', resend_verification, name='resend_verification'),
    path('auth/complete-onboarding/', complete_onboarding_standalone, name='complete_onboarding_standalone'),
    path('debug/user-names/', debug_user_names, name='debug_user_names'),
    path('debug/fix-hebrew-user/', fix_hebrew_user, name='fix_hebrew_user'),
    # Google Calendar integration
    path('calendar/connect/', calendar_connect, name='calendar_connect'),
    path('calendar/callback/', calendar_callback, name='calendar_callback'),
    path('calendar/status/', calendar_status, name='calendar_status'),
    path('calendar/disconnect/', calendar_disconnect, name='calendar_disconnect'),
    path('calendar/sync/<int:task_id>/', sync_task_to_calendar, name='sync_task'),
    path('calendar/sync-all/', sync_all_tasks, name='sync_all_tasks'),
    path('calendar/events/', get_calendar_events, name='get_calendar_events'),
    path('calendar/sync-incremental/', sync_calendar_incremental, name='sync_calendar_incremental'),
    path('calendar/events/<str:event_id>/', get_specific_event, name='get_specific_event'),
    path('csrf-token/', get_csrf_token, name='get_csrf_token'),
    
    # Friend invitation endpoints
    path('invitations/info/', get_invitation_info, name='get_invitation_info'),
    path('invitations/accept/', accept_invitation_on_registration, name='accept_invitation_on_registration'),
    
    # Database check endpoint
    path('db-check/', simple_db_check, name='simple_db_check'),
    
    # Debug endpoints
    path('debug/auth-status/', debug_auth_status, name='debug_auth_status'),
]
