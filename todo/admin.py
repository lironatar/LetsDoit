from django.contrib import admin
from .models import Project, Task, Label, Comment, UserProfile, Team, GoogleCalendarToken


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'theme', 'language', 'timezone']
    list_filter = ['theme', 'language']
    search_fields = ['user__username', 'user__email']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'color', 'team', 'is_favorite', 'get_task_count', 'created_at']
    list_filter = ['team', 'is_favorite', 'color', 'created_at']
    search_fields = ['name', 'description', 'owner__username']
    filter_horizontal = ['members']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Label)
class LabelAdmin(admin.ModelAdmin):
    list_display = ['name', 'color', 'owner', 'created_at']
    list_filter = ['color', 'created_at']
    search_fields = ['name', 'owner__username']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'owner', 'assignee', 'priority', 'due_date', 'is_completed', 'created_at']
    list_filter = ['is_completed', 'priority', 'is_recurring', 'project', 'created_at']
    search_fields = ['title', 'description', 'owner__username']
    filter_horizontal = ['labels']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    date_hierarchy = 'due_date'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('project', 'owner', 'assignee')


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'author', 'content_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content', 'task__title', 'author__username']
    readonly_fields = ['created_at', 'updated_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + "..." if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'תוכן'


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'owner', 'get_member_count', 'get_project_count', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    filter_horizontal = ['members']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(GoogleCalendarToken)
class GoogleCalendarTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'is_active', 'expiry', 'created_at', 'updated_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at', 'access_token', 'refresh_token']
