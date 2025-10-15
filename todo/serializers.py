from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from .models import Task, Project, Label, UserProfile, Team, EmailVerification, Friend, FriendInvitation, Notification, ProjectShare

class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Secure user registration serializer with validation and SQL injection protection
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8, max_length=128)
    
    class Meta:
        model = User
        fields = ['email', 'password']
    
    def validate_email(self, value):
        """
        Validate email format and uniqueness
        """
        # Django's validate_email already protects against SQL injection
        # by using proper escaping and validation
        try:
            validate_email(value)
        except ValidationError:
            raise serializers.ValidationError("כתובת אימייל לא תקינה")
        
        # Check if email already exists (case-insensitive)
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("כתובת אימייל זו כבר רשומה במערכת")
        
        return value.lower()  # Store email in lowercase
    
    def validate_password(self, value):
        """
        Validate password strength using Django's built-in validators
        """
        try:
            # Django's password validators protect against common attacks
            validate_password(value)
        except ValidationError as e:
            # Convert Django validation errors to Hebrew
            error_messages = {
                'password_too_similar': 'הסיסמה דומה מדי למידע האישי שלך',
                'password_too_short': 'הסיסמה חייבת להכיל לפחות 8 תווים',
                'password_too_common': 'הסיסמה נפוצה מדי',
                'password_entirely_numeric': 'הסיסמה לא יכולה להיות מספרים בלבד'
            }
            
            hebrew_errors = []
            for error in e.messages:
                hebrew_message = error_messages.get(error.code, error.message) if hasattr(error, 'code') else str(error)
                hebrew_errors.append(hebrew_message)
            
            raise serializers.ValidationError(hebrew_errors)
        
        return value
    
    def create(self, validated_data):
        """
        Create inactive user with hashed password and send verification email
        """
        email = validated_data['email']
        password = validated_data['password']
        request = self.context.get('request')
        
        # Use email as username for simplicity
        username = email.split('@')[0]
        
        # Ensure username uniqueness by appending number if needed
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        
        # Create INACTIVE user - will be activated after email verification
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            is_active=False  # User must verify email before activation
        )
        
        # Create user profile with default settings
        UserProfile.objects.create(
            user=user,
            theme='light',
            language='he',
            timezone='Asia/Jerusalem'
        )
        
        # Create verification token and send email
        ip_address = self.get_client_ip(request) if request else None
        verification = EmailVerification.create_verification(user, ip_address=ip_address)
        
        # Send verification email
        self.send_verification_email(user, verification, request)
        
        return user
    
    def get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def send_verification_email(self, user, verification, request=None):
        """Send verification email to user"""
        try:
            verification_url = verification.get_verification_url(request)
            
            subject = 'אימות כתובת האימייל שלך - TodoFast'
            
            # Create email content
            html_message = f"""
            <!DOCTYPE html>
            <html dir="rtl" lang="he">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>אימות כתובת אימייל</title>
                <style>
                    body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                    .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                    .button {{ display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
                    .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>ברוך הבא ל-TodoFast!</h1>
                    </div>
                    <div class="content">
                        <h2>שלום {user.email},</h2>
                        <p>תודה שנרשמת ל-TodoFast! כדי להשלים את תהליך הרשמה, אנא אמת את כתובת האימייל שלך.</p>
                        
                        <p>לחץ על הכפתור הבא כדי לאמת את החשבון:</p>
                        
                        <a href="{verification_url}" class="button">אמת את האימייל שלי</a>
                        
                        <p>או העתק והדבק את הקישור הבא בדפדפן:</p>
                        <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 4px;">
                            {verification_url}
                        </p>
                        
                        <p><strong>חשוב:</strong> קישור זה תקף ל-24 שעות בלבד.</p>
                        
                        <p>אם לא ביקשת לפתוח חשבון, אנא התעלם מהודעה זו.</p>
                        
                        <div class="footer">
                            <p>הודעה זו נשלחה אוטומטית מ-TodoFast. אנא אל תשיב לכתובת זו.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Plain text version
            plain_message = f"""
            ברוך הבא ל-TodoFast!
            
            שלום {user.email},
            
            תודה שנרשמת ל-TodoFast! כדי להשלים את תהליך הרשמה, אנא אמת את כתובת האימייל שלך.
            
            לחץ על הקישור הבא כדי לאמת את החשבון:
            {verification_url}
            
            חשוב: קישור זה תקף ל-24 שעות בלבד.
            
            אם לא ביקשת לפתוח חשבון, אנא התעלם מהודעה זו.
            
            TodoFast Team
            """
            
            # Send email
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            print(f"✅ Verification email sent to {user.email}")
            print(f"🔗 Verification URL: {verification_url}")
            
        except Exception as e:
            print(f"❌ Failed to send verification email to {user.email}: {str(e)}")
            # Don't raise exception - user is still created, they can request resend

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = ['user', 'theme', 'language', 'timezone', 'avatar', 'avatar_url', 'first_time_login']
        read_only_fields = ['avatar_url']

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar and hasattr(obj.avatar, 'url'):
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None

class LabelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Label
        fields = ['id', 'name', 'color', 'owner']
        read_only_fields = ['owner']

class TeamSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    owner = UserSerializer(read_only=True)
    project_count = serializers.SerializerMethodField()
    member_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Team
        fields = ['id', 'name', 'description', 'color', 'owner', 'members', 'project_count', 'member_count', 'is_active', 'created_at']
        read_only_fields = ['owner', 'created_at']
    
    def get_project_count(self, obj):
        return obj.projects.count()
    
    def get_member_count(self, obj):
        return obj.members.count()


class FriendSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    friend = UserSerializer(read_only=True)
    friend_name = serializers.SerializerMethodField()
    friend_email = serializers.SerializerMethodField()
    is_invitation = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Friend
        fields = ['id', 'user', 'friend', 'friend_name', 'friend_email', 'status', 'is_invitation', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def get_friend_name(self, obj):
        if obj.friend:
            return obj.friend.first_name or obj.friend.username
        # Handle case where friend_email column doesn't exist
        try:
            return obj.friend_email.split('@')[0] if obj.friend_email else 'Unknown'
        except AttributeError:
            return 'Unknown'
    
    def get_friend_email(self, obj):
        if obj.friend:
            return obj.friend.email
        # Handle case where friend_email column doesn't exist
        try:
            return obj.friend_email
        except AttributeError:
            return obj.friend.email if obj.friend else 'Unknown'


class FriendInvitationSerializer(serializers.ModelSerializer):
    inviter = UserSerializer(read_only=True)
    inviter_name = serializers.SerializerMethodField()
    
    class Meta:
        model = FriendInvitation
        fields = ['id', 'inviter', 'inviter_name', 'invitee_email', 'created_at', 'is_used']
        read_only_fields = ['inviter', 'created_at', 'is_used']
    
    def get_inviter_name(self, obj):
        return obj.inviter.first_name or obj.inviter.username

class ProjectSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    owner = UserSerializer(read_only=True)
    team = TeamSerializer(read_only=True)
    tasks_count = serializers.SerializerMethodField()
    is_team_project = serializers.SerializerMethodField()
    is_shared = serializers.SerializerMethodField()
    shared_members = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'color', 'owner', 'members', 'team', 'tasks_count', 'is_team_project', 'is_favorite', 'created_at', 'is_shared', 'shared_members', 'is_owner']
        read_only_fields = ['owner', 'created_at']
    
    def get_tasks_count(self, obj):
        return obj.tasks.filter(is_completed=False).count()
    
    def get_is_team_project(self, obj):
        return obj.team is not None
    
    def get_is_shared(self, obj):
        return obj.shares.filter(status='accepted').exists()

    def get_shared_members(self, obj):
        shares = obj.shares.filter(status='accepted')
        members = [share.shared_with for share in shares]
        return UserSerializer(members, many=True, context=self.context).data

    def get_is_owner(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.owner == request.user
        return False

class TaskSerializer(serializers.ModelSerializer):
    # Map backend fields to frontend expected names with proper formatting
    completed = serializers.BooleanField(source='is_completed')
    due_time = serializers.SerializerMethodField()
    project = serializers.CharField(source='project.name', read_only=True, allow_null=True)
    
    # Keep original fields for compatibility
    project_name = serializers.CharField(source='project.name', read_only=True)
    labels = LabelSerializer(many=True, read_only=True)
    owner = UserSerializer(read_only=True)
    subtasks = serializers.SerializerMethodField()
    subtasks_count = serializers.SerializerMethodField()
    completed_subtasks_count = serializers.SerializerMethodField()
    has_subtasks = serializers.SerializerMethodField()
    is_subtask = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'due_date', 'due_time', 'priority', 
            'is_completed', 'completed', 'project', 'project_name', 'labels', 
            'owner', 'parent_task', 'subtasks', 'subtasks_count',
            'completed_subtasks_count', 'has_subtasks', 'is_subtask',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['owner', 'created_at', 'updated_at']
    
    def get_due_time(self, obj):
        """Format due_date as YYYY-MM-DD in Israel timezone to avoid off-by-one."""
        if obj.due_date:
            from zoneinfo import ZoneInfo
            israel = ZoneInfo('Asia/Jerusalem')
            local_dt = obj.due_date.astimezone(israel)
            return local_dt.strftime('%Y-%m-%d')
        return None
    
    def get_subtasks(self, obj):
        if obj.has_subtasks():
            return TaskSerializer(obj.subtasks.all(), many=True, context=self.context).data
        return []
    
    def get_subtasks_count(self, obj):
        return obj.get_subtasks_count()
    
    def get_completed_subtasks_count(self, obj):
        return obj.get_completed_subtasks_count()
    
    def get_has_subtasks(self, obj):
        return obj.has_subtasks()
    
    def get_is_subtask(self, obj):
        return obj.is_subtask()

class TaskCreateUpdateSerializer(serializers.ModelSerializer):
    # Accept frontend-friendly fields and coerce them to model fields
    due_time = serializers.CharField(write_only=True, required=False, allow_blank=True)
    project_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    completed = serializers.BooleanField(write_only=True, required=False, default=False)
    labels = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Label.objects.all(),
        required=False
    )
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'due_date', 'due_time', 'priority', 
            'is_completed', 'completed', 'project', 'project_name', 'labels', 'parent_task'
        ]
        read_only_fields = ['id']
        extra_kwargs = {
            'due_date': { 'required': False, 'allow_null': True },
        }

    def validate(self, attrs):
        """
        Accept simple YYYY-MM-DD strings for due_date (and due_time alias) and
        coerce them to an aware UTC datetime at midnight Israel time.
        """
        from datetime import datetime
        from zoneinfo import ZoneInfo
        from django.utils import timezone

        coerced_attrs = dict(attrs)

        # Prefer explicit due_time input as alias for a date
        due_time_str = self.initial_data.get('due_time')
        if isinstance(due_time_str, str):
            due_time_str = due_time_str.strip()
        else:
            due_time_str = None

        # Also accept due_date provided as a plain date string
        due_date_input = self.initial_data.get('due_date')
        if isinstance(due_date_input, str):
            due_date_input = due_date_input.strip()
        else:
            due_date_input = None

        date_str = None
        if due_time_str:
            date_str = due_time_str
        elif due_date_input:
            date_str = due_date_input

        if date_str:
            try:
                if len(date_str) == 10:
                    # YYYY-MM-DD -> treat as midnight Israel time, convert to UTC
                    naive_date = datetime.strptime(date_str, '%Y-%m-%d')
                    israel_midnight = naive_date.replace(tzinfo=ZoneInfo('Asia/Jerusalem'))
                    coerced_attrs['due_date'] = israel_midnight.astimezone(ZoneInfo('UTC'))
                else:
                    # Try full ISO string
                    parsed = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    coerced_attrs['due_date'] = timezone.make_aware(parsed) if timezone.is_naive(parsed) else parsed
            except Exception:
                # Leave as-is if parsing fails; DRF will surface validation details
                pass

        return coerced_attrs
    
    def _coerce_extra_fields(self, validated_data):
        # Map due_time (YYYY-MM-DD) -> due_date (ISO at midnight Israel time)
        due_time_str = validated_data.pop('due_time', None)
        if due_time_str:
            due_time_str = due_time_str.strip()
            if due_time_str:
                # Accept either YYYY-MM-DD or full ISO
                from datetime import datetime
                from django.utils import timezone
                from zoneinfo import ZoneInfo
                
                try:
                    if len(due_time_str) == 10:
                        # Date only - set to midnight Israel time and convert to UTC
                        naive_datetime = datetime.strptime(due_time_str, '%Y-%m-%d')
                        israel_datetime = naive_datetime.replace(tzinfo=ZoneInfo('Asia/Jerusalem'))
                        validated_data['due_date'] = israel_datetime.astimezone(ZoneInfo('UTC'))
                    else:
                        # Try ISO - assume it's already properly formatted
                        parsed = datetime.fromisoformat(due_time_str.replace('Z', '+00:00'))
                        validated_data['due_date'] = timezone.make_aware(parsed) if timezone.is_naive(parsed) else parsed
                except Exception:
                    # Leave as-is if parsing fails
                    pass

        # Map project_name -> project FK if provided and project not set
        project_name = validated_data.pop('project_name', None)
        request = self.context.get('request')
        current_user = request.user if request and getattr(request, 'user', None) else None
        if project_name and not validated_data.get('project'):
            from .models import Project
            from django.db.models import Q
            # Allow resolving to a project owned by user OR shared with user
            if current_user and not getattr(current_user, 'is_anonymous', False):
                project_obj = Project.objects.filter(
                    Q(name=project_name) & (
                        Q(owner=current_user) |
                        Q(shares__shared_with=current_user, shares__status='accepted')
                    )
                ).first()
            else:
                project_obj = None
            # If not found, leave as None to route to Inbox (no project)
            if project_obj:
                validated_data['project'] = project_obj

        # If a project FK is provided, enforce ownership or shared access; otherwise route to Inbox
        if validated_data.get('project') is not None:
            project_obj = validated_data.get('project')
            # If the provided project isn't owned by user OR shared with user, null it (Inbox)
            try:
                project_owner = getattr(project_obj, 'owner', None)
                # Check if user is owner OR project is shared with user
                has_access = False
                if current_user is not None and project_owner is not None:
                    if project_owner == current_user:
                        has_access = True
                    else:
                        # Check if project is shared with user
                        from .models import ProjectShare
                        has_access = ProjectShare.objects.filter(
                            project=project_obj,
                            shared_with=current_user,
                            status='accepted'
                        ).exists()
                
                if not has_access:
                    validated_data['project'] = None
            except Exception:
                # Any unexpected object/value -> route to Inbox
                validated_data['project'] = None

        # Map completed -> is_completed
        if 'completed' in validated_data:
            validated_data['is_completed'] = bool(validated_data.pop('completed'))

        return validated_data

    def create(self, validated_data):
        labels_data = validated_data.pop('labels', [])
        validated_data = self._coerce_extra_fields(validated_data)
        task = Task.objects.create(**validated_data)
        task.labels.set(labels_data)
        return task
    
    def update(self, instance, validated_data):
        labels_data = validated_data.pop('labels', None)
        validated_data = self._coerce_extra_fields(validated_data)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if labels_data is not None:
            instance.labels.set(labels_data)

        return instance


class NotificationSerializer(serializers.ModelSerializer):
    related_user_name = serializers.SerializerMethodField()
    related_user_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'message', 'is_read', 
                  'related_project', 'related_user', 'related_user_name', 
                  'related_user_avatar', 'action_data', 'created_at']
        read_only_fields = ['created_at']
    
    def get_related_user_name(self, obj):
        if obj.related_user:
            return obj.related_user.first_name or obj.related_user.username
        return None
    
    def get_related_user_avatar(self, obj):
        if obj.related_user and hasattr(obj.related_user, 'profile') and obj.related_user.profile.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.related_user.profile.avatar.url)
        return None


class ProjectShareSerializer(serializers.ModelSerializer):
    shared_by_name = serializers.SerializerMethodField()
    shared_with_name = serializers.SerializerMethodField()
    project_name = serializers.CharField(source='project.name', read_only=True)
    
    class Meta:
        model = ProjectShare
        fields = ['id', 'project', 'project_name', 'shared_by', 'shared_by_name', 
                  'shared_with', 'shared_with_name', 'status', 'created_at', 'accepted_at']
        read_only_fields = ['shared_by', 'created_at', 'accepted_at']
    
    def get_shared_by_name(self, obj):
        return obj.shared_by.first_name or obj.shared_by.username
    
    def get_shared_with_name(self, obj):
        return obj.shared_with.first_name or obj.shared_with.username