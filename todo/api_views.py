from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import models, transaction
from datetime import datetime, timedelta
from .models import Task, Project, Label, UserProfile, Team, Friend, FriendInvitation, Notification, ProjectShare
from io import BytesIO
from django.core.files.base import ContentFile
from django.views.decorators.csrf import csrf_exempt
try:
    from PIL import Image
except Exception:
    Image = None
from .serializers import (
    TaskSerializer, TaskCreateUpdateSerializer, ProjectSerializer, 
    LabelSerializer, UserSerializer, UserProfileSerializer, TeamSerializer,
    UserRegistrationSerializer, FriendSerializer, FriendInvitationSerializer,
    NotificationSerializer, ProjectShareSerializer
)
from django.utils.timezone import now

class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TaskCreateUpdateSerializer
        return TaskSerializer
    
    def get_queryset(self):
        user = self.request.user
        # Get tasks:
        # 1. Owned by user
        # 2. In projects owned by user (regardless of task owner)
        # 3. In projects shared with user
        return Task.objects.filter(
            models.Q(owner=user) |
            models.Q(project__owner=user) |
            models.Q(project__shares__shared_with=user, project__shares__status='accepted')
        ).distinct().order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        try:
            serializer = TaskCreateUpdateSerializer(data=request.data, context={'request': request})
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            task = serializer.save(owner=request.user)
            return Response(TaskSerializer(task, context={'request': request}).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'detail': f'Task create failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


def seed_default_data_for_user(user: User) -> None:
    """Create a small set of default projects and tasks for a brand-new user.
    Safe to call multiple times; it won't duplicate if projects already exist.
    """
    try:
        # If the user already has any project, assume seeded
        if Project.objects.filter(owner=user).exists() or Task.objects.filter(owner=user).exists():
            return

        # Create two basic projects
        inbox_project = Project.objects.create(
            name='תיבת הדואר',
            description='משימות ראשוניות והערות מהירות',
            color='#4073FF',
            owner=user
        )
        personal_project = Project.objects.create(
            name='אישי',
            description='משימות לבית וליום יום',
            color='#DB4035',
            owner=user
        )

        # Helper to create tasks with due dates
        today = now()
        Task.objects.create(
            title='ברוך הבא ל-TodoFast',
            description='התחל ביצירת משימה חדשה או עריכת משימה קיימת',
            project=inbox_project,
            owner=user,
            priority=2
        )
        Task.objects.create(
            title='בדוק את המשימות להיום',
            description='פתח את תצוגת היום כדי לראות משימות דחופות',
            project=personal_project,
            owner=user,
            priority=3,
            due_date=today
        )
        Task.objects.create(
            title='הוסף פרויקט חדש',
            description='ארגן משימות לפי פרויקטים כדי לשמור על סדר',
            project=personal_project,
            owner=user,
            priority=1
        )
    except Exception:
        # Do not block registration/login on seeding errors
        pass
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """Get today's tasks (Israel timezone)"""
        from zoneinfo import ZoneInfo
        israel_tz = ZoneInfo('Asia/Jerusalem')
        israel_now = timezone.now().astimezone(israel_tz)
        today = israel_now.date()
        
        tasks = self.get_queryset().filter(
            due_date__date=today,
            is_completed=False
        )
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming tasks"""
        today = timezone.now().date()
        tasks = self.get_queryset().filter(
            due_date__gt=today,
            is_completed=False
        ).order_by('due_date')
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def inbox(self, request):
        """Get inbox tasks (tasks without project)"""
        tasks = self.get_queryset().filter(
            project__isnull=True,
            is_completed=False
        )
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post', 'patch'])
    def toggle(self, request, pk=None):
        """Toggle task completion status"""
        try:
            task = self.get_object()
            task.is_completed = not task.is_completed
            
            # Update completed_at timestamp
            if task.is_completed:
                task.completed_at = timezone.now()
            else:
                task.completed_at = None
                
            task.save()
            serializer = self.get_serializer(task)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def create_subtask(self, request, pk=None):
        """Create a sub-task for this task"""
        parent_task = self.get_object()
        
        # Use the same owner as the parent task to maintain ownership consistency
        parent_owner = parent_task.owner
        
        # Create sub-task data
        subtask_data = request.data.copy()
        subtask_data['parent_task'] = parent_task.id
        
        # If no project specified, inherit from parent
        if not subtask_data.get('project') and parent_task.project:
            subtask_data['project'] = parent_task.project.id
        
        serializer = TaskCreateUpdateSerializer(data=subtask_data)
        if serializer.is_valid():
            subtask = serializer.save(owner=parent_owner)  # Use parent's owner
            return Response(TaskSerializer(subtask).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def subtasks(self, request, pk=None):
        """Get all sub-tasks for this task"""
        parent_task = self.get_object()
        subtasks = parent_task.subtasks.all().order_by('order', 'created_at')
        serializer = TaskSerializer(subtasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def main_tasks(self, request):
        """Get only main tasks (not sub-tasks)"""
        tasks = self.get_queryset().filter(parent_task__isnull=True)
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Return projects owned by user OR shared with user
        return Project.objects.filter(
            models.Q(owner=user) | 
            models.Q(shares__shared_with=user, shares__status='accepted')
        ).distinct().order_by('name')
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a member to the project"""
        project = self.get_object()
        
        # Check if user is owner
        if project.owner != request.user:
            return Response(
                {'error': 'Only project owner can add members'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            if user == project.owner:
                return Response(
                    {'error': 'Owner is already part of the project'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if user in project.members.all():
                return Response(
                    {'error': 'User is already a member'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            project.members.add(user)
            return Response({'message': 'Member added successfully'})
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User with this email does not exist'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        """Remove a member from the project"""
        project = self.get_object()
        
        # Check if user is owner
        if project.owner != request.user:
            return Response(
                {'error': 'Only project owner can remove members'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        user_id = request.data.get('user_id')
        if not user_id:
            return Response(
                {'error': 'User ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id)
            project.members.remove(user)
            return Response({'message': 'Member removed successfully'})
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User does not exist'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        """Get all tasks for this project"""
        project = self.get_object()
        tasks = Task.objects.filter(
            project=project,
            owner=request.user
        ).order_by('-created_at')
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """Share project with friends"""
        project = self.get_object()
        
        # Only owner can share
        if project.owner != request.user:
            return Response({'error': 'רק בעל הפרויקט יכול לשתף אותו'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        friend_ids = request.data.get('friend_ids', [])
        if not friend_ids:
            return Response({'error': 'יש לבחור לפחות חבר אחד'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        shared_count = 0
        for friend_id in friend_ids:
            try:
                friend = User.objects.get(id=friend_id)
                
                # Check if already shared
                existing_share = ProjectShare.objects.filter(
                    project=project,
                    shared_with=friend
                ).first()
                
                if existing_share:
                    if existing_share.status == 'declined':
                        # Re-share if previously declined
                        existing_share.status = 'pending'
                        existing_share.save()
                    else:
                        continue  # Skip if already pending or accepted
                else:
                    # Create new share
                    existing_share = ProjectShare.objects.create(
                        project=project,
                        shared_by=request.user,
                        shared_with=friend,
                        status='pending'
                    )
                
                # Create notification
                Notification.objects.create(
                    user=friend,
                    notification_type='project_share',
                    title='בקשת שיתוף פרויקט',
                    message=f'{request.user.first_name or request.user.username} שיתף איתך את הפרויקט "{project.name}"',
                    related_project=project,
                    related_user=request.user,
                    action_data={'share_id': existing_share.id}
                )
                shared_count += 1
                
            except User.DoesNotExist:
                continue
        
        return Response({
            'status': 'shared',
            'shared_count': shared_count,
            'message': f'הפרויקט שותף עם {shared_count} חברים'
        })

    @action(detail=True, methods=['post'])
    def leave(self, request, pk=None):
        """Leave a shared project"""
        project = self.get_object()
        
        # Owner cannot leave their own project
        if project.owner == request.user:
            return Response({'error': 'בעל הפרויקט לא יכול לעזוב את הפרויקט'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Find and remove share
        try:
            share = ProjectShare.objects.get(project=project, shared_with=request.user, status='accepted')
            share.delete()
            
            # Notify owner
            Notification.objects.create(
                user=project.owner,
                notification_type='member_left',
                title='חבר עזב פרויקט',
                message=f'{request.user.first_name or request.user.username} עזב את הפרויקט "{project.name}"',
                related_project=project,
                related_user=request.user
            )
            
            # Notify other members
            for member_share in project.shares.filter(status='accepted').exclude(shared_with=request.user):
                Notification.objects.create(
                    user=member_share.shared_with,
                    notification_type='member_left',
                    title='חבר עזב פרויקט',
                    message=f'{request.user.first_name or request.user.username} עזב את הפרויקט "{project.name}"',
                    related_project=project,
                    related_user=request.user
                )
            
            return Response({'status': 'left project'})
        except ProjectShare.DoesNotExist:
            return Response({'error': 'אינך חבר בפרויקט זה'}, 
                          status=status.HTTP_404_NOT_FOUND)

class LabelViewSet(viewsets.ModelViewSet):
    serializer_class = LabelSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Label.objects.filter(owner=user).order_by('name')
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSerializer
    permission_classes = []  # Allow unauthenticated access for some endpoints
    
    def get_queryset(self):
        # Allow filtering by email for user validation
        email = self.request.query_params.get('email', None)
        if email:
            return User.objects.filter(email=email)
        return User.objects.all()
    
    def list(self, request, *args, **kwargs):
        # Override list to handle email validation
        email = request.query_params.get('email', None)
        if email:
            try:
                user = User.objects.get(email=email)
                serializer = self.get_serializer(user)
                
                # Include profile information for onboarding status check
                try:
                    profile = user.profile
                    # Refresh profile from database to ensure latest first_time_login status
                    profile.refresh_from_db()
                    profile_serializer = UserProfileSerializer(profile, context={'request': request})
                    user_data = serializer.data
                    user_data['profile'] = profile_serializer.data
                    
                    print(f"🔍 User Email Query Debug:")
                    print(f"   User: {user.email}")
                    print(f"   Profile first_time_login: {profile.first_time_login}")
                    print(f"   Profile data: {profile_serializer.data}")
                except UserProfile.DoesNotExist:
                    # Create default profile if it doesn't exist
                    profile = UserProfile.objects.create(user=user)
                    profile_serializer = UserProfileSerializer(profile, context={'request': request})
                    user_data = serializer.data
                    user_data['profile'] = profile_serializer.data
                    
                    print(f"🔍 User Email Query Debug (new profile):")
                    print(f"   User: {user.email}")
                    print(f"   New profile first_time_login: {profile.first_time_login}")
                
                return Response({
                    'exists': True,
                    'user': user_data
                }, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                return Response({
                    'exists': False,
                    'message': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)
        
        # Return normal list if no email filter
        return super().list(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user info"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def test_endpoint(self, request):
        """Test endpoint to verify routing is working"""
        return Response({'message': 'Test endpoint working!', 'user': str(request.user)})
    
    @action(detail=False, methods=['get', 'put'])
    def profile(self, request):
        """Get or update current user profile.
        - GET: returns profile (creating defaults if needed)
        - PUT: updates basic fields and returns updated profile
        Supports demo fallback when unauthenticated.
        """
        user = request.user
        if not user or getattr(user, 'is_anonymous', False):
            try:
                user = User.objects.get(username='demo')
            except User.DoesNotExist:
                user = User.objects.create_user(username='demo', password='demo123')
        try:
            profile, _ = UserProfile.objects.get_or_create(user=user)
        except Exception:
            return Response({'error': 'Failed to load profile'}, status=status.HTTP_400_BAD_REQUEST)

        if request.method.lower() == 'put':
            # Update simple fields
            name = request.data.get('name', '').strip()
            last_name = request.data.get('last_name', '').strip()
            if name:
                user.first_name = name
                # Mark that user has manually edited their name
                profile.name_manually_edited = True
            if last_name:
                user.last_name = last_name
            if name or last_name:
                user.save()

            # Handle explicit name_manually_edited flag from frontend
            name_manually_edited = request.data.get('name_manually_edited')
            if name_manually_edited is not None:
                profile.name_manually_edited = name_manually_edited

            theme = request.data.get('theme')
            language = request.data.get('language')
            timezone_val = request.data.get('timezone')
            if theme:
                profile.theme = theme
            if language:
                profile.language = language
            if timezone_val:
                profile.timezone = timezone_val
            profile.save()

        serializer = UserProfileSerializer(profile, context={'request': request})
        data = serializer.data
        # Include convenient fields for settings UI
        data['name'] = user.first_name or user.username
        data['first_name'] = user.first_name
        data['last_name'] = user.last_name
        data['email'] = user.email
        return Response(data)

    @action(detail=False, methods=['post'])
    def upload_avatar(self, request):
        """Upload and save user avatar (max 2.5MB)."""
        user = request.user
        # Require authentication so avatar is saved per real user, not a shared demo user
        if not user or user.is_anonymous:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        try:
            profile, _ = UserProfile.objects.get_or_create(user=user)
        except Exception:
            return Response({'error': 'Failed to load profile'}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES.get('avatar')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        # Size limit 2.5 MB
        if file.size > int(2.5 * 1024 * 1024):
            return Response({'error': 'Maximum file size is 2.5MB'}, status=status.HTTP_400_BAD_REQUEST)

        # If Pillow available, compress and resize aggressively to small size
        if Image is not None:
            try:
                img = Image.open(file)
                # Ensure RGB
                if img.mode not in ('RGB', 'RGBA'):
                    img = img.convert('RGB')
                else:
                    img = img.convert('RGB')
                # Resize (keep aspect) to max 128x128
                img.thumbnail((128, 128), Image.LANCZOS)
                # Encode to WebP with good compression
                buffer = BytesIO()
                img.save(buffer, format='WEBP', quality=70, method=6)
                buffer.seek(0)
                content = ContentFile(buffer.read())
                filename = f"avatar_{user.id}.webp"
                profile.avatar.save(filename, content, save=True)
            except Exception:
                # Fallback: store original if processing fails
                profile.avatar = file
                profile.save()
        else:
            profile.avatar = file
            profile.save()
        
        # Mark that user has manually uploaded their avatar
        profile.avatar_manually_edited = True
        profile.save()
        
        data = UserProfileSerializer(profile, context={'request': request}).data
        return Response(data)
    
    @action(detail=False, methods=['post'], permission_classes=[], authentication_classes=[])
    @csrf_exempt
    def complete_onboarding(self, request):
        """Complete user onboarding process"""
        print(f"🔍 Complete Onboarding Request Debug:")
        print(f"   Method: {request.method}")
        print(f"   Path: {request.path}")
        print(f"   User: {request.user}")
        print(f"   Is authenticated: {request.user.is_authenticated}")
        print(f"   Is anonymous: {request.user.is_anonymous}")
        print(f"   Session key: {request.session.session_key}")
        print(f"   Request data: {request.data}")
        print(f"   Headers: {dict(request.headers)}")
        
        # If we reach here, the endpoint is working
        print(f"✅ Endpoint reached successfully!")
        
        user = request.user
        
        # Allow unauthenticated users to complete onboarding if they provide email
        if not user or user.is_anonymous:
            email = request.data.get('email')
            if email:
                try:
                    user = User.objects.get(email=email)
                    print(f"   Found user by email: {user.email}")
                except User.DoesNotExist:
                    print(f"   User not found for email: {email}")
                    return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            else:
                print(f"   No email provided and user not authenticated")
                return Response({'error': 'Authentication required or email must be provided'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            # Update profile with onboarding data
            name = request.data.get('name', '').strip()
            task_method = request.data.get('task_method', '')
            onboarding_completed = request.data.get('onboarding_completed', False)
            onboarding_skipped = request.data.get('onboarding_skipped', False)
            
            # Update user's display name if provided
            if name:
                # Update first name or full name based on your user model
                user.first_name = name
                user.save()
            
            # Mark onboarding as completed - set first_time_login to False
            print(f"🔍 Complete Onboarding Debug:")
            print(f"   User: {user.email}")
            print(f"   Before: first_time_login = {profile.first_time_login}")
            print(f"   Onboarding skipped: {onboarding_skipped}")
            
            profile.first_time_login = False
            profile.save()
            
            # Verify the database was actually updated
            profile.refresh_from_db()
            print(f"   After save: first_time_login = {profile.first_time_login}")
            
            # Double-check by querying the database directly
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute("SELECT first_time_login FROM todo_userprofile WHERE user_id = %s", [user.id])
                db_value = cursor.fetchone()
                print(f"   Database verification: first_time_login = {db_value[0] if db_value else 'NOT FOUND'}")
            
            serializer = UserProfileSerializer(profile, context={'request': request})
            
            message = 'Onboarding skipped' if onboarding_skipped else 'Onboarding completed successfully'
            
            return Response({
                'success': True,
                'message': message,
                'profile': serializer.data,
                'skipped': onboarding_skipped
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Onboarding completion error: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to complete onboarding'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Team.objects.filter(owner=user).order_by('name')
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a member to the team"""
        team = self.get_object()
        
        # Check if user is owner
        if team.owner != request.user:
            return Response(
                {'error': 'Only team owner can add members'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'Email is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(email=email)
            if user == team.owner:
                return Response(
                    {'error': 'Owner is already part of the team'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if user in team.members.all():
                return Response(
                    {'error': 'User is already a member'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            team.members.add(user)
            return Response({'message': 'Member added successfully'})
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User with this email does not exist'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def projects(self, request, pk=None):
        """Get all projects for this team"""
        team = self.get_object()
        projects = Project.objects.filter(team=team).order_by('name')
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)


class FriendViewSet(viewsets.ModelViewSet):
    serializer_class = FriendSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Return all friendships where the user is either the user or the friend
        return Friend.objects.filter(
            models.Q(user=user) | models.Q(friend=user)
        ).order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def send_request(self, request):
        """Send a friend request"""
        # Debug: Check if Friend model is accessible
        try:
            Friend.objects.count()
        except Exception as e:
            return Response(
                {'error': f'Friend model not accessible: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        email = request.data.get('email')
        if not email:
            return Response(
                {'error': 'אימייל נדרש'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            friend = User.objects.get(email=email)
            
            # Debug: Log the request details
            print(f"🔍 Friend request debug:")
            print(f"   From user: {request.user.email}")
            print(f"   To email: {email}")
            print(f"   Friend user: {friend.email}")
            
            # Can't friend yourself
            if friend == request.user:
                print(f"   ❌ Cannot friend self")
                return Response(
                    {'error': 'לא ניתן להוסיף את עצמך כחבר'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if friendship already exists
            existing = Friend.objects.filter(
                user=request.user, 
                friend=friend
            ).first()
            
            print(f"   Existing friendship: {existing}")
            
            if existing:
                if existing.status == 'accepted':
                    print(f"   ❌ Already friends")
                    return Response(
                        {'error': 'כבר חברים'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                elif existing.status == 'pending':
                    print(f"   ❌ Request already sent")
                    return Response(
                        {'error': 'בקשת חברות כבר נשלחה'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Create friend request
            print(f"   ✅ Creating friendship...")
            friendship = Friend.objects.create(
                user=request.user,
                friend=friend,
                status='pending'
            )
            
            print(f"   ✅ Friendship created: {friendship.id}")
            serializer = FriendSerializer(friendship)
            return Response({
                'message': 'בקשת חברות נשלחה בהצלחה',
                'friendship': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except User.DoesNotExist:
            print(f"   📧 User not found, sending invitation: {email}")
            return self.handle_invitation(request, email)
        except Exception as e:
            print(f"   ❌ Unexpected error: {str(e)}")
            return Response(
                {'error': f'שגיאה בלתי צפויה: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def handle_invitation(self, request, email):
        """Handle friend invitation to non-existing user"""
        try:
            # Check if invitation already exists
            try:
                existing_invitation = FriendInvitation.objects.filter(
                    inviter=request.user,
                    invitee_email=email,
                    is_used=False
                ).first()
                
                if existing_invitation:
                    # Check if there's also a pending friendship
                    existing_friendship = Friend.objects.filter(
                        user=request.user,
                        friend_email=email,
                        is_invitation=True
                    ).first()
                    
                    if existing_friendship:
                        # Return success with existing data
                        serializer = FriendSerializer(existing_friendship)
                        return Response({
                            'message': f'הזמנה כבר נשלחה ל-{email}',
                            'friendship': serializer.data,
                            'is_invitation': True
                        }, status=status.HTTP_200_OK)
            except Exception as e:
                print(f"   ❌ Cannot check existing invitations: {str(e)}")
                return Response({
                    'error': 'מערכת ההזמנות טרם הופעלה. יש להריץ את המיגרציה של המסד נתונים.',
                    'migration_needed': True
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            # Try to create invitation using FriendInvitation model
            invitation = None
            try:
                invitation = FriendInvitation.create_invitation(request.user, email)
            except Exception as e:
                print(f"   ⚠️ FriendInvitation model not available: {str(e)}")
                # Continue without FriendInvitation model
            
            # Create pending friend record (with fallback for missing columns)
            try:
                friendship = Friend.objects.create(
                    user=request.user,
                    friend_email=email,
                    status='pending',
                    is_invitation=True
                )
                print(f"   ✅ Friend record created with new columns")
            except Exception as e:
                print(f"   ❌ Cannot create Friend with new columns: {str(e)}")
                print(f"   🔧 Please run migration to add friend_email and is_invitation columns")
                return Response({
                    'error': 'מערכת ההזמנות טרם הופעלה. יש להריץ את המיגרציה של המסד נתונים.',
                    'migration_needed': True
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            # Send invitation email
            if invitation:
                self.send_invitation_email(request.user, email, invitation)
            else:
                # Send simple invitation email without token
                self.send_simple_invitation_email(request.user, email)
            
            print(f"   ✅ Invitation sent to: {email}")
            
            try:
                serializer = FriendSerializer(friendship)
                friendship_data = serializer.data
            except Exception as serializer_error:
                print(f"   ⚠️ Serializer error: {str(serializer_error)}")
                # Return basic data without serialization
                friendship_data = {
                    'id': friendship.id,
                    'status': friendship.status,
                    'friend_email': email,
                    'is_invitation': True
                }
            
            return Response({
                'message': f'הזמנה נשלחה ל-{email}. הם יקבלו הודעה בדוא"ל',
                'friendship': friendship_data,
                'is_invitation': True
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"   ❌ Error in handle_invitation: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # If FriendInvitation table doesn't exist, fall back to simple message
            if 'no such table' in str(e).lower() or 'friendinvitation' in str(e).lower():
                print(f"   ⚠️ FriendInvitation table not found - migration needed")
                return Response({
                    'error': 'מערכת ההזמנות טרם הופעלה. יש להריץ את המיגרציה של המסד נתונים.',
                    'migration_needed': True
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            return Response({
                'error': f'שגיאה בשליחת הזמנה: {str(e)}',
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def send_invitation_email(self, inviter, invitee_email, invitation):
        """Send friend invitation email"""
        try:
            inviter_name = inviter.first_name or inviter.username
            invitation_url = invitation.get_invitation_url()
            
            subject = f'{inviter_name} רוצה להוסיף אותך כחבר ב-ToDoFast!'
            
            html_message = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #4073FF; margin: 0;">🎉 הזמנה מ-ToDoFast</h1>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="font-size: 18px; margin: 0; color: #333;">
                        שלום! <strong>{inviter_name}</strong> רוצה להוסיף אותך כחבר ב-ToDoFast.
                    </p>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <p style="color: #666; line-height: 1.6;">
                        ToDoFast הוא אפליקציית ניהול משימות מתקדמת שמאפשרת לך לנהל פרויקטים, 
                        משימות וצוותים בצורה יעילה. כשתצטרף, תוכל לשתף פרויקטים עם {inviter_name} 
                        ולעבוד יחד על משימות משותפות.
                    </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{invitation_url}" 
                       style="background: #4073FF; color: white; padding: 15px 30px; 
                              text-decoration: none; border-radius: 8px; font-weight: bold; 
                              display: inline-block;">
                        הצטרף עכשיו - זה בחינם! 🚀
                    </a>
                </div>
                
                <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                    <p style="color: #999; font-size: 14px; margin: 0;">
                        אם הקישור לא עובד, העתק והדבק את הכתובת הבאה בדפדפן שלך:<br>
                        <a href="{invitation_url}" style="color: #4073FF;">{invitation_url}</a>
                    </p>
                </div>
            </div>
            """
            
            # Plain text version
            text_message = f"""
            שלום!
            
            {inviter_name} רוצה להוסיף אותך כחבר ב-ToDoFast.
            
            ToDoFast הוא אפליקציית ניהול משימות מתקדמת שמאפשרת לך לנהל פרויקטים, 
            משימות וצוותים בצורה יעילה.
            
            הצטרף עכשיו: {invitation_url}
            
            אם הקישור לא עובד, העתק והדבק את הכתובת בדפדפן שלך.
            """
            
            from django.core.mail import send_mail
            from django.conf import settings
            
            send_mail(
                subject=subject,
                message=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[invitee_email],
                html_message=html_message,
                fail_silently=False
            )
            
            print(f"   📧 Invitation email sent to {invitee_email}")
            
        except Exception as e:
            print(f"   ❌ Failed to send invitation email: {str(e)}")
            # Don't fail the request if email fails
    
    def send_simple_invitation_email(self, inviter, invitee_email):
        """Send simple friend invitation email without token"""
        try:
            inviter_name = inviter.first_name or inviter.username
            app_url = 'http://localhost:5173'  # Frontend URL
            
            subject = f'{inviter_name} רוצה להוסיף אותך כחבר ב-ToDoFast!'
            
            html_message = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #4073FF; margin: 0;">🎉 הזמנה מ-ToDoFast</h1>
                </div>
                
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="font-size: 18px; margin: 0; color: #333;">
                        שלום! <strong>{inviter_name}</strong> רוצה להוסיף אותך כחבר ב-ToDoFast.
                    </p>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <p style="color: #666; line-height: 1.6;">
                        ToDoFast הוא אפליקציית ניהול משימות מתקדמת שמאפשרת לך לנהל פרויקטים, 
                        משימות וצוותים בצורה יעילה. כשתצטרף, תוכל לשתף פרויקטים עם {inviter_name} 
                        ולעבוד יחד על משימות משותפות.
                    </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{app_url}" 
                       style="background: #4073FF; color: white; padding: 15px 30px; 
                              text-decoration: none; border-radius: 8px; font-weight: bold; 
                              display: inline-block;">
                        הצטרף עכשיו - זה בחינם! 🚀
                    </a>
                </div>
                
                <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                    <p style="color: #999; font-size: 14px; margin: 0;">
                        כשתצטרף עם האימייל הזה ({invitee_email}), בקשת החברות תיווצר אוטומטית!
                    </p>
                </div>
            </div>
            """
            
            # Plain text version
            text_message = f"""
            שלום!
            
            {inviter_name} רוצה להוסיף אותך כחבר ב-ToDoFast.
            
            ToDoFast הוא אפליקציית ניהול משימות מתקדמת שמאפשרת לך לנהל פרויקטים, 
            משימות וצוותים בצורה יעילה.
            
            הצטרף עכשיו: {app_url}
            
            כשתצטרף עם האימייל הזה ({invitee_email}), בקשת החברות תיווצר אוטומטית!
            """
            
            from django.core.mail import send_mail
            from django.conf import settings
            
            send_mail(
                subject=subject,
                message=text_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[invitee_email],
                html_message=html_message,
                fail_silently=False
            )
            
            print(f"   📧 Simple invitation email sent to {invitee_email}")
            
        except Exception as e:
            print(f"   ❌ Failed to send simple invitation email: {str(e)}")
            # Don't fail the request if email fails
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a friend request"""
        friendship = self.get_object()
        
        # Only the friend (receiver) can accept
        if friendship.friend != request.user:
            return Response(
                {'error': 'רק מקבל הבקשה יכול לאשר'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        friendship.accept()
        serializer = FriendSerializer(friendship)
        
        return Response({
            'message': 'בקשת חברות אושרה',
            'friendship': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        """Decline a friend request"""
        friendship = self.get_object()
        
        # Only the friend (receiver) can decline
        if friendship.friend != request.user:
            return Response(
                {'error': 'רק מקבל הבקשה יכול לדחות'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        friendship.decline()
        serializer = FriendSerializer(friendship)
        
        return Response({
            'message': 'בקשת חברות נדחתה',
            'friendship': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def list_friends(self, request):
        """Get list of accepted friends"""
        user = request.user
        friends = Friend.objects.filter(
            models.Q(user=user) | models.Q(friend=user),
            status='accepted'
        )
        
        # Extract unique friend users
        friend_users = []
        for friendship in friends:
            friend_user = friendship.friend if friendship.user == user else friendship.user
            friend_users.append({
                'id': friend_user.id,
                'username': friend_user.username,
                'email': friend_user.email,
                'first_name': friend_user.first_name,
                'last_name': friend_user.last_name,
                'name': friend_user.first_name or friend_user.username
            })
        
        return Response(friend_users)
    
    @action(detail=False, methods=['get'])
    def pending_requests(self, request):
        """Get pending friend requests (received)"""
        user = request.user
        print(f"🔍 Pending requests for user: {user.email}")
        
        # Debug: Check ALL Friend records for this user
        all_user_friends = Friend.objects.filter(
            models.Q(user=user) | models.Q(friend=user)
        )
        print(f"   Total Friend records involving user: {all_user_friends.count()}")
        for f in all_user_friends:
            print(f"   - Record: user={f.user.email}, friend={f.friend.email if f.friend else 'None'}, status={f.status}")
        
        pending = Friend.objects.filter(
            friend=user,
            status='pending'
        )
        
        print(f"   Filtered pending requests: {pending.count()}")
        for req in pending:
            print(f"   - From: {req.user.email}, Status: {req.status}")
        
        try:
            serializer = FriendSerializer(pending, many=True)
            data = serializer.data
            print(f"   Serialized data: {data}")
            return Response(data)
        except Exception as e:
            print(f"   ❌ Serialization error: {e}")
            import traceback
            traceback.print_exc()
            return Response([], status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def sent_requests(self, request):
        """Get sent friend requests (pending)"""
        user = request.user
        print(f"📤 Sent requests for user: {user.email}")
        
        sent = Friend.objects.filter(
            user=user,
            status='pending'
        )
        
        print(f"   Found {sent.count()} sent requests")
        for req in sent:
            if req.friend:
                print(f"   - To: {req.friend.email}, Status: {req.status}")
            else:
                # This is an invitation (friend is None)
                try:
                    print(f"   - To: {req.friend_email} (invitation), Status: {req.status}")
                except AttributeError:
                    print(f"   - To: Unknown (invitation), Status: {req.status}")
        
        try:
            serializer = FriendSerializer(sent, many=True)
            return Response(serializer.data)
        except Exception as serializer_error:
            print(f"   ❌ Serializer error in sent_requests: {str(serializer_error)}")
            # Return basic data without serialization
            basic_data = []
            for req in sent:
                basic_data.append({
                    'id': req.id,
                    'status': req.status,
                    'created_at': req.created_at,
                    'friend_name': req.friend.first_name if req.friend else 'Unknown',
                    'friend_email': req.friend.email if req.friend else getattr(req, 'friend_email', 'Unknown'),
                    'is_invitation': not bool(req.friend)
                })
            return Response(basic_data)
    
    @action(detail=False, methods=['get'])
    def test_model(self, request):
        """Test endpoint to check if Friend model is accessible"""
        try:
            # Try to count friends
            count = Friend.objects.count()
            return Response({
                'success': True,
                'message': 'Friend model is accessible',
                'friend_count': count,
                'user': request.user.email if request.user.is_authenticated else 'Anonymous'
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': f'Friend model not accessible: {str(e)}',
                'user': request.user.email if request.user.is_authenticated else 'Anonymous'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def check_database_status(self, request):
        """Check database status and model existence"""
        try:
            from django.db import connection
            
            results = {
                'friend_model': {'exists': False, 'count': 0, 'error': None},
                'friend_invitation_model': {'exists': False, 'count': 0, 'error': None},
                'friend_table_columns': [],
                'migration_needed': False,
                'database_info': {}
            }
            
            # Get database info
            try:
                with connection.cursor() as cursor:
                    cursor.execute("SELECT sqlite_version();")
                    db_version = cursor.fetchone()
                    results['database_info']['sqlite_version'] = db_version[0] if db_version else 'Unknown'
                    
                    # Check if todo_friend table exists
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='todo_friend';")
                    friend_table_exists = cursor.fetchone() is not None
                    results['database_info']['friend_table_exists'] = friend_table_exists
                    
                    # Check if todo_friendinvitation table exists
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='todo_friendinvitation';")
                    invitation_table_exists = cursor.fetchone() is not None
                    results['database_info']['invitation_table_exists'] = invitation_table_exists
                    
            except Exception as e:
                results['database_info']['error'] = str(e)
            
            # Check Friend model
            try:
                count = Friend.objects.count()
                results['friend_model']['exists'] = True
                results['friend_model']['count'] = count
                
                # Check Friend table columns
                with connection.cursor() as cursor:
                    cursor.execute("PRAGMA table_info(todo_friend);")
                    columns = cursor.fetchall()
                    results['friend_table_columns'] = [{'name': col[1], 'type': col[2]} for col in columns]
                    
                    # Check if new columns exist
                    column_names = [col[1] for col in columns]
                    if 'friend_email' not in column_names or 'is_invitation' not in column_names:
                        results['migration_needed'] = True
                        
            except Exception as e:
                results['friend_model']['error'] = str(e)
            
            # Check FriendInvitation model
            try:
                count = FriendInvitation.objects.count()
                results['friend_invitation_model']['exists'] = True
                results['friend_invitation_model']['count'] = count
            except Exception as e:
                results['friend_invitation_model']['error'] = str(e)
                results['migration_needed'] = True
            
            print(f"🔍 Database status check completed for user: {request.user.email}")
            return Response(results)
            
        except Exception as e:
            print(f"❌ Error in check_database_status: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return Response({
                'error': f'Database status check failed: {str(e)}',
                'traceback': str(traceback.format_exc())
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def debug_friendships(self, request):
        """Debug endpoint to see all friendships for current user"""
        user = request.user
        
        # Get all friendships where user is involved
        sent_requests = Friend.objects.filter(user=user)
        received_requests = Friend.objects.filter(friend=user)
        
        sent_data = []
        for f in sent_requests:
            sent_data.append({
                'id': f.id,
                'friend_email': f.friend.email,
                'status': f.status,
                'created_at': f.created_at.isoformat()
            })
        
        received_data = []
        for f in received_requests:
            received_data.append({
                'id': f.id,
                'user_email': f.user.email,
                'status': f.status,
                'created_at': f.created_at.isoformat()
            })
        
        return Response({
            'user': user.email,
            'sent_requests': sent_data,
            'received_requests': received_data,
            'total_sent': len(sent_data),
            'total_received': len(received_data)
        })
    
    @action(detail=False, methods=['post'])
    def clear_pending(self, request):
        """Clear all pending friend requests (for debugging)"""
        user = request.user
        deleted_count = Friend.objects.filter(
            models.Q(user=user) | models.Q(friend=user),
            status='pending'
        ).delete()
        
        return Response({
            'message': f'Cleared {deleted_count[0]} pending requests',
            'deleted_count': deleted_count[0]
        })


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        self.get_queryset().update(is_read=True)
        return Response({'status': 'all marked as read'})
    
    @action(detail=True, methods=['post'])
    def accept_share(self, request, pk=None):
        """Accept a project share request"""
        notification = self.get_object()
        
        if notification.notification_type != 'project_share':
            return Response({'error': 'הודעה זו אינה בקשת שיתוף'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        share_id = notification.action_data.get('share_id')
        if not share_id:
            return Response({'error': 'מידע חסר'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            share = ProjectShare.objects.get(id=share_id, shared_with=request.user)
            share.status = 'accepted'
            share.accepted_at = timezone.now()
            share.save()
            
            # Mark notification as read
            notification.is_read = True
            notification.save()
            
            # Create notification for project owner
            Notification.objects.create(
                user=share.shared_by,
                notification_type='project_accepted',
                title='שיתוף פרויקט התקבל',
                message=f'{request.user.first_name or request.user.username} קיבל את הזמנתך לפרויקט "{share.project.name}"',
                related_project=share.project,
                related_user=request.user
            )
            
            # Notify all other members
            for member_share in share.project.shares.filter(status='accepted').exclude(shared_with=request.user):
                Notification.objects.create(
                    user=member_share.shared_with,
                    notification_type='general',
                    title='חבר חדש בפרויקט',
                    message=f'{request.user.first_name or request.user.username} הצטרף לפרויקט "{share.project.name}"',
                    related_project=share.project,
                    related_user=request.user
                )
            
            return Response({
                'status': 'accepted',
                'project': ProjectSerializer(share.project, context={'request': request}).data
            })
        except ProjectShare.DoesNotExist:
            return Response({'error': 'שיתוף לא נמצא'}, 
                          status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def decline_share(self, request, pk=None):
        """Decline a project share request"""
        notification = self.get_object()
        
        if notification.notification_type != 'project_share':
            return Response({'error': 'הודעה זו אינה בקשת שיתוף'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        share_id = notification.action_data.get('share_id')
        if not share_id:
            return Response({'error': 'מידע חסר'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        try:
            share = ProjectShare.objects.get(id=share_id, shared_with=request.user)
            share.status = 'declined'
            share.save()
            
            # Mark notification as read
            notification.is_read = True
            notification.save()
            
            # Notify project owner
            Notification.objects.create(
                user=share.shared_by,
                notification_type='project_declined',
                title='שיתוף פרויקט נדחה',
                message=f'{request.user.first_name or request.user.username} דחה את הזמנתך לפרויקט "{share.project.name}"',
                related_project=share.project,
                related_user=request.user
            )
            
            return Response({'status': 'declined'})
        except ProjectShare.DoesNotExist:
            return Response({'error': 'שיתוף לא נמצא'}, 
                          status=status.HTTP_404_NOT_FOUND)


class ProjectShareViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectShareSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return ProjectShare.objects.filter(
            models.Q(shared_by=user) | models.Q(shared_with=user)
        )


# Simple Database Check (No Auth Required)
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def simple_db_check(request):
    """Simple database check without authentication"""
    try:
        from django.db import connection
        
        results = {
            'status': 'ok',
            'database_info': {},
            'tables': {}
        }
        
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT sqlite_version();")
            db_version = cursor.fetchone()
            results['database_info']['sqlite_version'] = db_version[0] if db_version else 'Unknown'
            
            # List all tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'todo_%';")
            tables = cursor.fetchall()
            results['tables']['todo_tables'] = [table[0] for table in tables]
            
            # Check specific tables
            friend_exists = 'todo_friend' in [table[0] for table in tables]
            invitation_exists = 'todo_friendinvitation' in [table[0] for table in tables]
            
            results['tables']['friend_table_exists'] = friend_exists
            results['tables']['invitation_table_exists'] = invitation_exists
            
            # Check Friend table columns if it exists
            if friend_exists:
                cursor.execute("PRAGMA table_info(todo_friend);")
                columns = cursor.fetchall()
                results['tables']['friend_columns'] = [col[1] for col in columns]
                results['tables']['has_new_columns'] = 'friend_email' in [col[1] for col in columns] and 'is_invitation' in [col[1] for col in columns]
        
        return Response(results)
        
    except Exception as e:
        import traceback
        return Response({
            'status': 'error',
            'error': str(e),
            'traceback': str(traceback.format_exc())
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def test_registration_logic(self, request):
        """Test registration logic for a specific email"""
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email required'}, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"🧪 Testing registration logic for: {email}")
        
        # Check for pending invitations
        try:
            pending_friendship = Friend.objects.filter(
                friend_email=email,
                is_invitation=True,
                status='pending'
            ).first()
            
            print(f"   Found pending friendship: {pending_friendship}")
            
            if pending_friendship:
                print(f"   Inviter: {pending_friendship.user.email}")
                
                # Simulate what happens during registration
                # (Don't actually modify anything, just show what would happen)
                return Response({
                    'message': 'Found pending invitation',
                    'inviter': pending_friendship.user.email,
                    'would_create_friend_requests': True
                })
            else:
                return Response({
                    'message': 'No pending invitation found',
                    'would_create_friend_requests': False
                })
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return Response({
                'error': str(e),
                'would_create_friend_requests': False
            })
    
    @action(detail=False, methods=['get'])
    def debug_all_friends(self, request):
        """Debug endpoint to see all friend records"""
        import traceback
        
        results = {
            'all_friends': [],
            'invitations': []
        }
        
        try:
            # Get all Friend records
            all_friends = Friend.objects.all()
            results['total_count'] = all_friends.count()
            
            for friend in all_friends:
                friend_data = {
                    'id': friend.id,
                    'user': friend.user.email,
                    'friend': friend.friend.email if friend.friend else None,
                    'status': friend.status,
                    'created_at': friend.created_at.isoformat(),
                }
                
                # Try to get friend_email and is_invitation
                try:
                    friend_data['friend_email'] = friend.friend_email
                    friend_data['is_invitation'] = friend.is_invitation
                    
                    if friend.is_invitation:
                        results['invitations'].append(friend_data)
                    else:
                        results['all_friends'].append(friend_data)
                except AttributeError:
                    # Columns don't exist
                    friend_data['friend_email'] = 'Column not found'
                    friend_data['is_invitation'] = 'Column not found'
                    results['all_friends'].append(friend_data)
            
            return Response(results)
            
        except Exception as e:
            return Response({
                'error': str(e),
                'traceback': str(traceback.format_exc())
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Friend Invitation Views
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_invitation_info(request):
    """Get invitation information for display during registration"""
    invite_token = request.GET.get('invite')
    if not invite_token:
        return Response({'error': 'Invitation token required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        invitation = FriendInvitation.objects.get(token=invite_token, is_used=False)
        serializer = FriendInvitationSerializer(invitation)
        return Response(serializer.data)
    except FriendInvitation.DoesNotExist:
        return Response({'error': 'Invalid or expired invitation'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def accept_invitation_on_registration(request):
    """Accept friend invitation when user registers"""
    invite_token = request.data.get('invite_token')
    user_id = request.data.get('user_id')
    
    if not invite_token or not user_id:
        return Response({'error': 'Invitation token and user ID required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        invitation = FriendInvitation.objects.get(token=invite_token, is_used=False)
        user = User.objects.get(id=user_id)
        
        # Mark invitation as used
        invitation.mark_as_used()
        
        # Find and link the pending friend request
        pending_friendship = Friend.objects.filter(
            user=invitation.inviter,
            friend_email=invitation.invitee_email,
            is_invitation=True,
            status='pending'
        ).first()
        
        if pending_friendship:
            # Link the friendship to the new user
            pending_friendship.link_to_user(user)
            
            # Create reciprocal friendship
            Friend.objects.get_or_create(
                user=user,
                friend=invitation.inviter,
                defaults={'status': 'pending'}
            )
            
            return Response({
                'message': 'Friend invitation accepted successfully',
                'friend_request_created': True
            })
        else:
            return Response({
                'message': 'Invitation accepted but no pending friend request found',
                'friend_request_created': False
            })
            
    except FriendInvitation.DoesNotExist:
        return Response({'error': 'Invalid or expired invitation'}, status=status.HTTP_404_NOT_FOUND)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': f'Unexpected error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Authentication API Views
@api_view(['POST'])
@permission_classes([permissions.AllowAny])  # Allow unauthenticated access for registration
def register_user(request):
    """
    Secure user registration endpoint with comprehensive validation
    """
    print("=" * 80)
    print("🚀 REGISTER_USER FUNCTION CALLED")
    print("=" * 80)
    
    if request.method == 'POST':
        print(f"📧 Registration request data: {request.data}")
        serializer = UserRegistrationSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            try:
                # Use database transaction to ensure atomicity
                with transaction.atomic():
                    user = serializer.save()

                    # Seed default data for this new user
                    seed_default_data_for_user(user)
                    
                    # Check for friend invitations
                    print("\n" + "=" * 80)
                    print("💌 CHECKING FOR FRIEND INVITATIONS")
                    print("=" * 80)
                    
                    friend_request_created = False
                    invitation_token = request.data.get('invite_token')
                    
                    print(f"🔍 Registration debug for {user.email}:")
                    print(f"   Invitation token: {invitation_token}")
                    print(f"   Checking database for pending invitations...")
                    
                    # Always check for pending invitations by email (even without token)
                    try:
                        print(f"   Looking for pending invitations for email: {user.email}")
                        
                        # First, check ALL Friend records to see what exists
                        all_friends = Friend.objects.all()
                        print(f"   Total Friend records in DB: {all_friends.count()}")
                        
                        for f in all_friends:
                            try:
                                print(f"   - Friend record: user={f.user.email}, friend={f.friend.email if f.friend else 'None'}, friend_email={getattr(f, 'friend_email', 'NO COLUMN')}, is_invitation={getattr(f, 'is_invitation', 'NO COLUMN')}, status={f.status}")
                            except Exception as e:
                                print(f"   - Friend record: user={f.user.email}, error reading: {e}")
                        
                        # Look for pending friendship by email
                        try:
                            pending_friendship = Friend.objects.filter(
                                friend_email=user.email,
                                is_invitation=True,
                                status='pending'
                            ).first()
                            print(f"   Query result - Found pending friendship: {pending_friendship}")
                        except Exception as query_error:
                            print(f"   ❌ Query failed: {query_error}")
                            print(f"   This means the columns don't exist in the database!")
                            pending_friendship = None
                        
                        print(f"   Final result - Found pending friendship: {pending_friendship}")
                        
                        if pending_friendship:
                            print(f"   Inviter: {pending_friendship.user.email}")
                            
                            # Link the friendship to the new user
                            pending_friendship.friend = user
                            pending_friendship.is_invitation = False
                            pending_friendship.save()
                            friend_request_created = True
                            
                            print(f"✅ Friend request created for new user: {user.email}")
                            
                            # Create reciprocal friendship (so the new user can see the request)
                            Friend.objects.get_or_create(
                                user=user,
                                friend=pending_friendship.user,
                                defaults={'status': 'pending'}
                            )
                            
                            print(f"✅ Reciprocal friend request created")
                            
                            # Mark FriendInvitation as used if it exists
                            try:
                                invitation = FriendInvitation.objects.get(
                                    invitee_email=user.email,
                                    is_used=False
                                )
                                invitation.mark_as_used()
                                print(f"✅ Marked FriendInvitation as used")
                            except FriendInvitation.DoesNotExist:
                                print(f"   No FriendInvitation record found (that's okay)")
                        else:
                            print(f"   No pending invitation found for {user.email}")
                            
                    except Exception as e:
                        print(f"❌ Error processing invitation: {str(e)}")
                        import traceback
                        traceback.print_exc()
                    
                    # Return success response with verification message
                    response_data = {
                        'success': True,
                        'message': 'ההרשמה הצליחה! נשלח אליך אימייל לאימות החשבון. אנא בדוק את תיבת הדואר שלך.',
                        'email_sent': True,
                        'user': {
                            'id': user.id,
                            'email': user.email,
                            'username': user.username,
                            'is_active': user.is_active
                        }
                    }
                    
                    if friend_request_created:
                        response_data['friend_request_created'] = True
                        response_data['message'] += ' גם נוצרה בקשת חברות עבורך!'
                    
                    return Response(response_data, status=status.HTTP_201_CREATED)
                    
            except Exception as e:
                # Log error for debugging (in production, use proper logging)
                print(f"Registration error: {str(e)}")
                return Response({
                    'success': False,
                    'message': 'שגיאה בתהליך הרשמה. אנא נסה שוב'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        else:
            # Return validation errors in Hebrew
            return Response({
                'success': False,
                'message': 'נתונים לא תקינים',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'success': False,
        'message': 'שגיאת בקשה'
    }, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_user(request):
    """
    Secure login endpoint for registered users
    """
    if request.method == 'POST':
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')
        
        if not email or not password:
            return Response({
                'success': False,
                'message': 'אנא הזן אימייל וסיסמה'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Find user by email
            user = User.objects.get(email=email)
            
            # Authenticate with username and password
            authenticated_user = authenticate(
                request=request,
                username=user.username,
                password=password
            )
            
            if authenticated_user:
                # Create a session for the authenticated user
                from django.contrib.auth import login
                login(request, authenticated_user)
                
                # Explicitly save the session to ensure the cookie is set
                try:
                    request.session.save()
                except Exception as e:
                    print(f"Session save error: {str(e)}")
                
                # Get or create user profile
                profile, created = UserProfile.objects.get_or_create(
                    user=authenticated_user,
                    defaults={
                        'theme': 'light',
                        'language': 'he',
                        'timezone': 'Asia/Jerusalem'
                    }
                )
                
                # Serialize profile data and add name field
                profile_data = UserProfileSerializer(profile).data
                profile_data['name'] = authenticated_user.first_name or authenticated_user.username
                
                # Allow login even for unverified users, but indicate verification status
                response_data = {
                    'success': True,
                    'message': 'התחברות הצליחה',
                    'user': {
                        'id': authenticated_user.id,
                        'email': authenticated_user.email,
                        'username': authenticated_user.username,
                        'first_name': authenticated_user.first_name,
                        'is_active': authenticated_user.is_active,
                        'profile': profile_data
                    },
                    'email_verified': authenticated_user.is_active,
                    'first_time_login': profile.first_time_login
                }
                
                if not authenticated_user.is_active:
                    response_data['message'] = 'התחברות הצליחה - נדרש אימות אימייל'
                
                return Response(response_data, status=status.HTTP_200_OK)
            else:
                return Response({
                    'success': False,
                    'message': 'אימייל או סיסמה שגויים'
                }, status=status.HTTP_401_UNAUTHORIZED)
                
        except User.DoesNotExist:
            return Response({
                'success': False,
                'message': 'אימייל או סיסמה שגויים'
            }, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            print(f"Login error: {str(e)}")
            return Response({
                'success': False,
                'message': 'שגיאה בתהליך ההתחברות'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response({
        'success': False,
        'message': 'שגיאת בקשה'
    }, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@csrf_exempt
def complete_onboarding_standalone(request):
    """Complete user onboarding process - standalone endpoint"""
    print(f"🔍 Complete Onboarding Standalone Debug:")
    print(f"   Method: {request.method}")
    print(f"   Path: {request.path}")
    print(f"   Request data: {request.data}")
    
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        # Update profile with onboarding data
        name = request.data.get('name', '').strip()
        onboarding_skipped = request.data.get('onboarding_skipped', False)
        
        # Update user's display name if provided
        if name:
            user.first_name = name
            user.save()
        
        # Mark onboarding as completed - set first_time_login to False
        print(f"🔍 Setting first_time_login to False for {user.email}")
        profile.first_time_login = False
        profile.save()
        
        # Verify the database was actually updated
        profile.refresh_from_db()
        print(f"   After save: first_time_login = {profile.first_time_login}")
        
        message = 'Onboarding skipped' if onboarding_skipped else 'Onboarding completed successfully'
        
        return Response({
            'success': True,
            'message': message,
            'skipped': onboarding_skipped
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Onboarding completion error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to complete onboarding'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@authentication_classes([])  # Disable SessionAuthentication to avoid CSRF enforcement
@csrf_exempt
def google_login(request):
    """
    Handle Google OAuth login and integrate with existing user system
    Uses the AutoUserCreator script for automatic user creation and management
    """
    try:
        # Get the Google credential from the request
        credential = request.data.get('credential')
        email = request.data.get('email')
        name = request.data.get('name', '')
        given_name = request.data.get('given_name', '')
        family_name = request.data.get('family_name', '')
        picture = request.data.get('picture', '')
        
        # Debug: Log what Google sent
        print(f"📛 Google Login - Received name fields:")
        print(f"   name: {name}")
        print(f"   given_name: {given_name}")
        print(f"   family_name: {family_name}")
        
        if not credential or not email:
            return Response({
                'success': False,
                'message': 'Google credential and email are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Prepare Google data for AutoUserCreator
        google_data = {
            'email': email,
            'name': name,
            'given_name': given_name,
            'family_name': family_name,
            'picture': picture,
        }
        
        # Use AutoUserCreator to handle user creation/update
        from auto_user_creation import create_user_from_google
        user, created, profile, profile_created = create_user_from_google(google_data)

        # Log the user in
        from django.contrib.auth import login
        login(request, user)
        
        # Explicitly save the session to ensure the cookie is set
        try:
            request.session.save()
        except Exception as e:
            print(f"Session save error during Google login: {str(e)}")
        
        # Serialize profile data and add name field from account settings
        profile_data = UserProfileSerializer(profile).data
        profile_data['name'] = user.first_name or user.username
        
        # Prepare response data
        response_data = {
            'success': True,
            'message': 'Google login successful',
            'user': {
                'id': user.id,
                'email': user.email,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active,
                'profile': profile_data
            },
            'email_verified': True,  # Google accounts are always verified
            'first_time_login': profile.first_time_login,
            'is_google_user': True,
        }
        
        # Debug: Log what we're sending back
        print(f"📤 Sending to frontend: first_name='{user.first_name}', last_name='{user.last_name}'")
        
        # Debug logging for onboarding status
        print(f"🔍 Google Login Debug:")
        print(f"   User: {user.email}")
        print(f"   Created: {created}")
        print(f"   Profile created: {profile_created}")
        print(f"   First time login: {profile.first_time_login}")
        print(f"   Should show onboarding: {profile.first_time_login}")
        
        # Direct database verification
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT first_time_login FROM todo_userprofile WHERE user_id = %s", [user.id])
            db_value = cursor.fetchone()
            print(f"   Database direct check: first_time_login = {db_value[0] if db_value else 'NOT FOUND'}")
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Google login failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def debug_user_names(request):
    """Debug endpoint to check what names are stored in database"""
    try:
        users = User.objects.all()[:5]  # Limit to 5 users
        user_data = []
        
        for user in users:
            first_name_bytes = None
            last_name_bytes = None
            try:
                if user.first_name:
                    first_name_bytes = user.first_name.encode('utf-8').hex()
                if user.last_name:
                    last_name_bytes = user.last_name.encode('utf-8').hex()
            except:
                pass
                
            user_data.append({
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'first_name_bytes': first_name_bytes,
                'last_name_bytes': last_name_bytes,
            })
        
        return Response({
            'success': True,
            'count': len(user_data),
            'users': user_data
        })
    except Exception as e:
        import traceback
        return Response({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }, status=500)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def fix_hebrew_user(request):
    """Delete and recreate user with proper Hebrew encoding"""
    try:
        email = request.data.get('email', 'lironatar94@gmail.com')
        
        # Delete existing user if exists
        try:
            user = User.objects.get(email=email)
            print(f"Deleting user: {user.email}, first_name: {repr(user.first_name)}, last_name: {repr(user.last_name)}")
            user.delete()
            return Response({
                'success': True,
                'message': f'User {email} deleted. Next Google login will create fresh user with proper Hebrew name.'
            })
        except User.DoesNotExist:
            return Response({
                'success': True,
                'message': f'No user found with email {email}. Ready for fresh Google login.'
            })
            
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def verify_email(request, token):
    """
    Email verification endpoint - activates user account
    """
    try:
        from .models import EmailVerification
        
        # Find the verification token
        verification = EmailVerification.objects.get(token=token)
        
        # Check if token is valid
        if not verification.is_valid():
            if verification.is_used:
                return Response({
                    'success': False,
                    'message': 'קישור האימות כבר נוצל. החשבון שלך כבר אומת.',
                    'already_used': True
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'success': False,
                    'message': 'קישור האימות פג תוקף. אנא בקש קישור חדש.',
                    'expired': True,
                    'user_email': verification.user.email
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get client IP for logging
        ip_address = get_client_ip(request)
        
        # Mark token as used and activate user
        verification.mark_as_used(ip_address=ip_address)
        
        # Log the user in automatically after email verification
        from django.contrib.auth import login
        login(request, verification.user)
        try:
            # Ensure session is persisted so the cookie is set in the response
            request.session.save()
        except Exception:
            pass
        
        # Set first_time_login to True when email is verified (user can now see onboarding)
        profile, created = UserProfile.objects.get_or_create(
            user=verification.user,
            defaults={
                'theme': 'light',
                'language': 'he',
                'timezone': 'Asia/Jerusalem',
                'first_time_login': True
            }
        )
        if not created:
            profile.first_time_login = True
            profile.save()
        
        return Response({
            'success': True,
            'message': 'החשבון אומת בהצלחה! כעת תוכל להתחבר למערכת.',
            'user': {
                'email': verification.user.email,
                'username': verification.user.username,
                'is_active': verification.user.is_active
            }
        }, status=status.HTTP_200_OK)
        
    except EmailVerification.DoesNotExist:
        return Response({
            'success': False,
            'message': 'קישור אימות לא תקין או לא קיים.',
            'invalid_token': True
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        print(f"Email verification error: {str(e)}")
        return Response({
            'success': False,
            'message': 'שגיאה בתהליך האימות. אנא נסה שוב.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def resend_verification(request):
    """
    Resend verification email endpoint
    """
    email = request.data.get('email', '').strip().lower()
    
    if not email:
        return Response({
            'success': False,
            'message': 'אנא הזן כתובת אימייל'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        
        # Check if user is already active
        if user.is_active:
            return Response({
                'success': False,
                'message': 'החשבון כבר אומת. תוכל להתחבר למערכת.',
                'already_verified': True
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check rate limiting - don't allow more than 3 verification emails per hour
        from django.utils import timezone
        from datetime import timedelta
        from .models import EmailVerification
        
        recent_verifications = EmailVerification.objects.filter(
            user=user,
            created_at__gte=timezone.now() - timedelta(hours=1)
        ).count()
        
        if recent_verifications >= 3:
            return Response({
                'success': False,
                'message': 'נשלחו יותר מדי אימיילי אימות. אנא נסה שוב בעוד שעה.',
                'rate_limited': True
            }, status=status.HTTP_429_TOO_MANY_REQUESTS)
        
        # Create new verification token and send email
        from .serializers import UserRegistrationSerializer
        serializer = UserRegistrationSerializer()
        
        ip_address = get_client_ip(request)
        verification = EmailVerification.create_verification(user, ip_address=ip_address)
        serializer.send_verification_email(user, verification, request)
        
        return Response({
            'success': True,
            'message': 'אימייל אימות חדש נשלח בהצלחה. אנא בדוק את תיבת הדואר שלך.',
            'email_sent': True
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        # Don't reveal that user doesn't exist for security
        return Response({
            'success': True,
            'message': 'אם כתובת האימייל קיימת במערכת, נשלח אליה אימייל אימות.',
            'email_sent': True
        }, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"Resend verification error: {str(e)}")
        return Response({
            'success': False,
            'message': 'שגיאה בשליחת אימייל האימות. אנא נסה שוב.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def get_client_ip(request):
    """Helper function to get client IP address"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip