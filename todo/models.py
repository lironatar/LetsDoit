from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime, timedelta
import secrets
import string


class Team(models.Model):
    name = models.CharField(max_length=200, verbose_name='שם הצוות')
    description = models.TextField(blank=True, verbose_name='תיאור')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_teams', verbose_name='בעלים')
    members = models.ManyToManyField(User, related_name='teams', blank=True, verbose_name='חברי צוות')
    color = models.CharField(max_length=7, default='#4073FF', verbose_name='צבע')
    is_active = models.BooleanField(default=True, verbose_name='פעיל')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='נוצר בתאריך')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='עודכן בתאריך')
    
    class Meta:
        verbose_name = 'צוות'
        verbose_name_plural = 'צוותים'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def get_project_count(self):
        return self.projects.count()
    
    def get_member_count(self):
        return self.members.count()


class Project(models.Model):
    COLORS = [
        ('#DB4035', 'אדום'),  # Red
        ('#FF9933', 'כתום'),  # Orange  
        ('#FAD000', 'צהוב'),  # Yellow
        ('#7ECC49', 'ירוק'),  # Green
        ('#299438', 'ירוק כהה'),  # Dark Green
        ('#6ACCBC', 'טורקיז'),  # Turquoise
        ('#158FAD', 'כחול'),  # Blue
        ('#14AAF5', 'כחול בהיר'),  # Light Blue
        ('#96C3EB', 'כחול פסטל'),  # Pastel Blue
        ('#4073FF', 'כחול רויאל'),  # Royal Blue
        ('#884DFF', 'סגול'),  # Purple
        ('#AF38EB', 'סגול בהיר'),  # Light Purple
        ('#EB96EB', 'ורוד'),  # Pink
        ('#E05194', 'ורוד כהה'),  # Dark Pink
        ('#FF8D85', 'אדום בהיר'),  # Light Red
        ('#808080', 'אפור'),  # Gray
    ]
    
    name = models.CharField(max_length=200, verbose_name='שם הפרויקט')
    description = models.TextField(blank=True, verbose_name='תיאור')
    color = models.CharField(max_length=7, choices=COLORS, default='#DB4035', verbose_name='צבע')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_projects', verbose_name='בעלים')
    members = models.ManyToManyField(User, related_name='projects', blank=True, verbose_name='חברים')
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='projects', null=True, blank=True, verbose_name='צוות')
    is_favorite = models.BooleanField(default=False, verbose_name='מועדף')
    is_archived = models.BooleanField(default=False, verbose_name='בארכיון')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='נוצר בתאריך')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='עודכן בתאריך')
    
    class Meta:
        verbose_name = 'פרויקט'
        verbose_name_plural = 'פרויקטים'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def get_task_count(self):
        return self.tasks.filter(is_completed=False).count()
    
    def is_team_project(self):
        return self.team is not None
    
    def is_shared_with_user(self, user):
        """Check if project is shared with a specific user"""
        return self.shares.filter(shared_with=user, status='accepted').exists()

    def get_all_members(self):
        """Get all users who have access (owner + accepted shares)"""
        member_ids = [self.owner.id]
        member_ids.extend(
            self.shares.filter(status='accepted').values_list('shared_with_id', flat=True)
        )
        return User.objects.filter(id__in=member_ids)

    def can_user_delete(self, user):
        """Only owner can delete project"""
        return self.owner == user


class Label(models.Model):
    name = models.CharField(max_length=100, verbose_name='שם התווית')
    color = models.CharField(max_length=7, default='#808080', verbose_name='צבע')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='labels', verbose_name='בעלים')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='נוצר בתאריך')
    
    class Meta:
        verbose_name = 'תווית'
        verbose_name_plural = 'תוויות'
        unique_together = ['name', 'owner']
        ordering = ['name']
    
    def __str__(self):
        return f"#{self.name}"


class Task(models.Model):
    PRIORITY_CHOICES = [
        (1, 'נמוכה'),
        (2, 'בינונית'),
        (3, 'גבוהה'),
        (4, 'דחופה'),
    ]
    
    title = models.CharField(max_length=500, verbose_name='כותרת')
    description = models.TextField(blank=True, verbose_name='תיאור')
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True, verbose_name='פרויקט')
    labels = models.ManyToManyField(Label, blank=True, verbose_name='תוויות')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks', verbose_name='בעלים')
    assignee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tasks', null=True, blank=True, verbose_name='מוקצה ל')
    
    # Sub-task relationship
    parent_task = models.ForeignKey('self', on_delete=models.CASCADE, related_name='subtasks', null=True, blank=True, verbose_name='משימה אב')
    
    # Task properties
    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=1, verbose_name='עדיפות')
    due_date = models.DateTimeField(null=True, blank=True, verbose_name='תאריך יעד')
    due_time = models.TimeField(null=True, blank=True, verbose_name='שעת יעד')
    
    # Completion
    is_completed = models.BooleanField(default=False, verbose_name='הושלמה')
    completed_at = models.DateTimeField(null=True, blank=True, verbose_name='הושלמה בתאריך')
    
    # Recurring tasks
    is_recurring = models.BooleanField(default=False, verbose_name='חוזרת')
    recurring_pattern = models.CharField(max_length=100, blank=True, verbose_name='תבנית חזרה')  # daily, weekly, monthly, etc.
    
    # Order for sorting
    order = models.IntegerField(default=0, verbose_name='סדר')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='נוצר בתאריך')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='עודכן בתאריך')
    
    class Meta:
        verbose_name = 'משימה'
        verbose_name_plural = 'משימות'
        ordering = ['order', '-priority', 'due_date', 'created_at']
    
    def __str__(self):
        return self.title
    
    def is_overdue(self):
        if self.due_date and not self.is_completed:
            return timezone.now() > self.due_date
        return False
    
    def is_today(self):
        if self.due_date:
            today = timezone.now().date()
            return self.due_date.date() == today
        return False
    
    def is_upcoming(self):
        if self.due_date and not self.is_completed:
            today = timezone.now().date()
            return self.due_date.date() > today
        return False
    
    def get_priority_color(self):
        colors = {
            1: '#808080',  # Gray - Low
            2: '#FAD000',  # Yellow - Medium  
            3: '#FF9933',  # Orange - High
            4: '#DB4035',  # Red - Urgent
        }
        return colors.get(self.priority, '#808080')
    
    def complete(self):
        self.is_completed = True
        self.completed_at = timezone.now()
        self.save()
        
        # Handle recurring tasks
        if self.is_recurring and self.recurring_pattern:
            self.create_next_occurrence()
    
    def create_next_occurrence(self):
        """Create next occurrence for recurring tasks"""
        if not self.is_recurring:
            return
            
        next_due_date = None
        if self.due_date:
            if self.recurring_pattern == 'daily':
                next_due_date = self.due_date + timedelta(days=1)
            elif self.recurring_pattern == 'weekly':
                next_due_date = self.due_date + timedelta(weeks=1)
            elif self.recurring_pattern == 'monthly':
                next_due_date = self.due_date + timedelta(days=30)
        
        if next_due_date:
            Task.objects.create(
                title=self.title,
                description=self.description,
                project=self.project,
                owner=self.owner,
                assignee=self.assignee,
                priority=self.priority,
                due_date=next_due_date,
                due_time=self.due_time,
                is_recurring=True,
                recurring_pattern=self.recurring_pattern,
                order=self.order
            )
    
    def has_subtasks(self):
        """Check if this task has sub-tasks"""
        return self.subtasks.exists()
    
    def get_subtasks_count(self):
        """Get the number of sub-tasks"""
        return self.subtasks.count()
    
    def get_completed_subtasks_count(self):
        """Get the number of completed sub-tasks"""
        return self.subtasks.filter(is_completed=True).count()
    
    def is_subtask(self):
        """Check if this task is a sub-task"""
        return self.parent_task is not None
    
    def get_root_task(self):
        """Get the root parent task"""
        if self.parent_task:
            return self.parent_task.get_root_task()
        return self


class Comment(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments', verbose_name='משימה')
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='מחבר')
    content = models.TextField(verbose_name='תוכן')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='נוצר בתאריך')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='עודכן בתאריך')
    
    class Meta:
        verbose_name = 'הערה'
        verbose_name_plural = 'הערות'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.author.username}: {self.content[:50]}..."


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name='משתמש')
    theme = models.CharField(max_length=10, choices=[('light', 'בהיר'), ('dark', 'כהה')], default='light', verbose_name='ערכת נושא')
    language = models.CharField(max_length=10, default='he', verbose_name='שפה')
    timezone = models.CharField(max_length=50, default='Asia/Jerusalem', verbose_name='אזור זמן')
    date_format = models.CharField(max_length=20, default='DD/MM/YYYY', verbose_name='פורמט תאריך')
    start_of_week = models.IntegerField(default=0, verbose_name='תחילת השבוע')  # 0=Sunday, 1=Monday
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True, verbose_name='תמונת פרופיל')
    first_time_login = models.BooleanField(default=True, verbose_name='התחברות ראשונה')
    name_manually_edited = models.BooleanField(default=False, verbose_name='שם נערך ידנית')
    avatar_manually_edited = models.BooleanField(default=False, verbose_name='תמונת פרופיל נערכה ידנית')
    
    class Meta:
        verbose_name = 'פרופיל משתמש'
        verbose_name_plural = 'פרופילי משתמשים'
    
    def __str__(self):
        return f"פרופיל של {self.user.username}"


class EmailVerification(models.Model):
    """
    Model for email verification tokens with security best practices
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_verifications', verbose_name='משתמש')
    token = models.CharField(max_length=64, unique=True, verbose_name='טוקן')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='נוצר בתאריך')
    expires_at = models.DateTimeField(verbose_name='פג תוקף בתאריך')
    is_used = models.BooleanField(default=False, verbose_name='בשימוש')
    used_at = models.DateTimeField(null=True, blank=True, verbose_name='נוצל בתאריך')
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='כתובת IP')
    
    class Meta:
        verbose_name = 'אימות אימייל'
        verbose_name_plural = 'אימותי אימייל'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', 'is_used']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"אימות עבור {self.user.email} - {self.token[:8]}..."
    
    @classmethod
    def generate_secure_token(cls):
        """Generate a cryptographically secure token"""
        # Use 48 bytes (384 bits) for very high security
        return secrets.token_urlsafe(48)
    
    @classmethod
    def create_verification(cls, user, expires_hours=24, ip_address=None):
        """Create a new verification token for a user"""
        # Deactivate old tokens for the same user
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        
        # Create new token
        token = cls.generate_secure_token()
        expires_at = timezone.now() + timedelta(hours=expires_hours)
        
        return cls.objects.create(
            user=user,
            token=token,
            expires_at=expires_at,
            ip_address=ip_address
        )
    
    def is_valid(self):
        """Check if token is valid (not expired, not used)"""
        if self.is_used:
            return False
        if timezone.now() > self.expires_at:
            return False
        return True
    
    def mark_as_used(self, ip_address=None):
        """Mark token as used"""
        self.is_used = True
        self.used_at = timezone.now()
        if ip_address:
            self.ip_address = ip_address
        self.save()
        
        # Activate the user account
        self.user.is_active = True
        self.user.save()
    
    def get_verification_url(self, request=None):
        """Get the full verification URL"""
        # Always point to the React frontend, not the Django backend
        base_url = 'http://localhost:5173'  # Frontend URL
        
        return f"{base_url}?verify={self.token}"
    
    @classmethod
    def cleanup_expired(cls):
        """Clean up expired tokens (run this periodically)"""
        expired_count = cls.objects.filter(
            expires_at__lt=timezone.now()
        ).count()
        
        cls.objects.filter(expires_at__lt=timezone.now()).delete()
        return expired_count


class GoogleCalendarToken(models.Model):
    """Store Google Calendar OAuth tokens for users"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='calendar_token')
    access_token = models.TextField()
    refresh_token = models.TextField(null=True, blank=True)
    token_uri = models.CharField(max_length=255, default='https://oauth2.googleapis.com/token')
    client_id = models.CharField(max_length=255)
    client_secret = models.CharField(max_length=255)
    scopes = models.JSONField(default=list)
    expiry = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    last_sync_token = models.TextField(null=True, blank=True, help_text="Token for incremental sync")
    last_sync_time = models.DateTimeField(null=True, blank=True, help_text="Last successful sync timestamp")
    sync_tokens = models.JSONField(default=dict, help_text="Per-calendar sync tokens")
    
    class Meta:
        verbose_name = 'Google Calendar Token'
        verbose_name_plural = 'Google Calendar Tokens'
    
    def __str__(self):
        return f"Calendar token for {self.user.email}"
    
    def is_expired(self):
        """Check if the token is expired"""
        if not self.expiry:
            return False
        return timezone.now() >= self.expiry
    
    def to_credentials(self):
        """Convert to google.oauth2.credentials.Credentials object"""
        from google.oauth2.credentials import Credentials
        
        return Credentials(
            token=self.access_token,
            refresh_token=self.refresh_token,
            token_uri=self.token_uri,
            client_id=self.client_id,
            client_secret=self.client_secret,
            scopes=self.scopes
        )
    
    @classmethod
    def from_credentials(cls, user, credentials):
        """Create or update token from credentials object"""
        token, created = cls.objects.update_or_create(
            user=user,
            defaults={
                'access_token': credentials.token,
                'refresh_token': credentials.refresh_token,
                'token_uri': credentials.token_uri,
                'client_id': credentials.client_id,
                'client_secret': credentials.client_secret,
                'scopes': credentials.scopes,
                'expiry': credentials.expiry,
                'is_active': True
            }
        )
        return token


class GoogleCalendarEvent(models.Model):
    """Cache Google Calendar events for efficient retrieval"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cached_events')
    google_event_id = models.CharField(max_length=255, unique=True)
    calendar_id = models.CharField(max_length=255)
    calendar_summary = models.CharField(max_length=255)
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_all_day = models.BooleanField(default=False)
    html_link = models.URLField(blank=True, null=True)
    color_id = models.CharField(max_length=50, blank=True, null=True)
    event_data = models.JSONField(default=dict, help_text="Full event data from Google API")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Google Calendar Event'
        verbose_name_plural = 'Google Calendar Events'
        indexes = [
            models.Index(fields=['user', 'start_time']),
            models.Index(fields=['google_event_id']),
            models.Index(fields=['calendar_id']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.user.email})"


class FriendInvitation(models.Model):
    """
    Model for friend invitations to non-existing users
    """
    inviter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations', verbose_name='מזמין')
    invitee_email = models.EmailField(verbose_name='אימייל מוזמן')
    token = models.CharField(max_length=64, unique=True, verbose_name='טוקן')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='נוצר בתאריך')
    is_used = models.BooleanField(default=False, verbose_name='בשימוש')
    used_at = models.DateTimeField(null=True, blank=True, verbose_name='נוצל בתאריך')
    
    class Meta:
        verbose_name = 'הזמנת חבר'
        verbose_name_plural = 'הזמנות חברים'
        unique_together = ['inviter', 'invitee_email']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invitation from {self.inviter.email} to {self.invitee_email}"
    
    @classmethod
    def generate_token(cls):
        """Generate a secure invitation token"""
        return secrets.token_urlsafe(32)
    
    @classmethod
    def create_invitation(cls, inviter, invitee_email):
        """Create a new friend invitation"""
        # Check if invitation already exists
        existing = cls.objects.filter(
            inviter=inviter,
            invitee_email=invitee_email,
            is_used=False
        ).first()
        
        if existing:
            return existing
        
        token = cls.generate_token()
        return cls.objects.create(
            inviter=inviter,
            invitee_email=invitee_email,
            token=token
        )
    
    def mark_as_used(self):
        """Mark invitation as used when user registers"""
        self.is_used = True
        self.used_at = timezone.now()
        self.save()
    
    def get_invitation_url(self):
        """Get the invitation URL"""
        base_url = 'http://localhost:5173'  # Frontend URL
        return f"{base_url}?invite={self.token}"


class Friend(models.Model):
    """
    Friend relationship model - represents a friendship between two users
    """
    STATUS_CHOICES = [
        ('pending', 'ממתין'),
        ('accepted', 'אושר'),
        ('declined', 'נדחה'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friendships', verbose_name='משתמש')
    friend = models.ForeignKey(User, on_delete=models.CASCADE, related_name='friend_of', verbose_name='חבר', null=True, blank=True)
    friend_email = models.EmailField(verbose_name='אימייל חבר', null=True, blank=True)  # For pending invitations
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending', verbose_name='סטטוס')
    is_invitation = models.BooleanField(default=False, verbose_name='הזמנה')  # True if friend doesn't exist yet
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='נוצר בתאריך')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='עודכן בתאריך')
    
    class Meta:
        verbose_name = 'חבר'
        verbose_name_plural = 'חברים'
        unique_together = [['user', 'friend'], ['user', 'friend_email']]
        ordering = ['-created_at']
    
    def __str__(self):
        if self.friend:
            return f"{self.user.username} - {self.friend.username} ({self.status})"
        else:
            return f"{self.user.username} - {self.friend_email} ({self.status})"
    
    def accept(self):
        """Accept friend request"""
        self.status = 'accepted'
        self.save()
        
        # Create reciprocal friendship if it doesn't exist
        if self.friend:
            Friend.objects.get_or_create(
                user=self.friend,
                friend=self.user,
                defaults={'status': 'accepted'}
            )
    
    def decline(self):
        """Decline friend request"""
        self.status = 'declined'
        self.save()
    
    def link_to_user(self, user):
        """Link this invitation to a newly registered user"""
        self.friend = user
        self.is_invitation = False
        self.save()


class Notification(models.Model):
    """Persistent notification system for user alerts"""
    TYPE_CHOICES = [
        ('project_share', 'שיתוף פרויקט'),
        ('project_accepted', 'פרויקט התקבל'),
        ('project_declined', 'פרויקט נדחה'),
        ('member_left', 'חבר עזב'),
        ('general', 'כללי'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', verbose_name='משתמש')
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='general', verbose_name='סוג התראה')
    title = models.CharField(max_length=200, verbose_name='כותרת')
    message = models.TextField(verbose_name='הודעה')
    is_read = models.BooleanField(default=False, verbose_name='נקראה')
    
    # Related objects
    related_project = models.ForeignKey('Project', null=True, blank=True, on_delete=models.CASCADE, verbose_name='פרויקט קשור')
    related_user = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE, related_name='notification_sender', verbose_name='משתמש קשור')
    
    # For actionable notifications (like share requests)
    action_data = models.JSONField(null=True, blank=True, verbose_name='מידע לפעולה')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='נוצר בתאריך')
    
    class Meta:
        verbose_name = 'התראה'
        verbose_name_plural = 'התראות'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"


class ProjectShare(models.Model):
    """Track project sharing invitations and accepted shares"""
    STATUS_CHOICES = [
        ('pending', 'ממתין'),
        ('accepted', 'התקבל'),
        ('declined', 'נדחה'),
    ]
    
    project = models.ForeignKey('Project', on_delete=models.CASCADE, related_name='shares', verbose_name='פרויקט')
    shared_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_projects', verbose_name='שותף על ידי')
    shared_with = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_shares', verbose_name='שותף עם')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending', verbose_name='סטטוס')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='נוצר בתאריך')
    accepted_at = models.DateTimeField(null=True, blank=True, verbose_name='התקבל בתאריך')
    
    class Meta:
        verbose_name = 'שיתוף פרויקט'
        verbose_name_plural = 'שיתופי פרויקטים'
        unique_together = ['project', 'shared_with']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.project.name} - {self.shared_by.username} → {self.shared_with.username}"
