from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.db.models import Q, Count
from datetime import datetime, timedelta
import json

from .models import Task, Project, Label, Comment, UserProfile
from .forms import TaskForm, ProjectForm, LabelForm


def index(request):
    """Serve React frontend"""
    # Serve the React app's index.html directly from the dist folder
    import os
    from django.http import HttpResponse
    from django.conf import settings
    
    # Read the built React index.html file
    index_path = os.path.join(settings.BASE_DIR, 'frontend', 'dist', 'index.html')
    
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the title and add Hebrew RTL
    content = content.replace('<html lang="en">', '<html lang="he" dir="rtl">')
    content = content.replace('<title>Vite + React</title>', '<title>TodoFast - ניהול משימות</title>')
    
    return HttpResponse(content)


@login_required
def today_view(request):
    """Today's tasks view"""
    today = timezone.now().date()
    
    # Get today's tasks
    today_tasks = Task.objects.filter(
        owner=request.user,
        is_completed=False,
        due_date__date=today
    ).select_related('project').prefetch_related('labels')
    
    # Get overdue tasks
    overdue_tasks = Task.objects.filter(
        owner=request.user,
        is_completed=False,
        due_date__date__lt=today
    ).select_related('project').prefetch_related('labels')
    
    # Get user's projects
    projects = Project.objects.filter(
        Q(owner=request.user) | Q(members=request.user)
    ).distinct().annotate(task_count=Count('tasks', filter=Q(tasks__is_completed=False)))
    
    context = {
        'today_tasks': today_tasks,
        'overdue_tasks': overdue_tasks,
        'projects': projects,
        'current_view': 'today',
    }
    return render(request, 'todo/today.html', context)


@login_required
def upcoming_view(request):
    """Upcoming tasks view"""
    today = timezone.now().date()
    tomorrow = today + timedelta(days=1)
    
    # Get upcoming tasks grouped by date
    upcoming_tasks = Task.objects.filter(
        owner=request.user,
        is_completed=False,
        due_date__date__gt=today
    ).select_related('project').prefetch_related('labels').order_by('due_date')
    
    # Group tasks by date
    tasks_by_date = {}
    for task in upcoming_tasks:
        date_key = task.due_date.date()
        if date_key not in tasks_by_date:
            tasks_by_date[date_key] = []
        tasks_by_date[date_key].append(task)
    
    projects = Project.objects.filter(
        Q(owner=request.user) | Q(members=request.user)
    ).distinct().annotate(task_count=Count('tasks', filter=Q(tasks__is_completed=False)))
    
    context = {
        'tasks_by_date': tasks_by_date,
        'projects': projects,
        'current_view': 'upcoming',
        'tomorrow': tomorrow.strftime('%Y-%m-%d'),
    }
    return render(request, 'todo/upcoming.html', context)


@login_required
def inbox_view(request):
    """Inbox view - tasks without projects"""
    inbox_tasks = Task.objects.filter(
        owner=request.user,
        is_completed=False,
        project__isnull=True
    ).select_related('project').prefetch_related('labels')
    
    projects = Project.objects.filter(
        Q(owner=request.user) | Q(members=request.user)
    ).distinct().annotate(task_count=Count('tasks', filter=Q(tasks__is_completed=False)))
    
    context = {
        'inbox_tasks': inbox_tasks,
        'projects': projects,
        'current_view': 'inbox',
    }
    return render(request, 'todo/inbox.html', context)


@login_required
def project_view(request, project_id):
    """Project tasks view"""
    project = get_object_or_404(Project, id=project_id)
    
    # Check if user has access to this project
    if not (project.owner == request.user or request.user in project.members.all()):
        messages.error(request, 'אין לך גישה לפרויקט זה')
        return redirect('today')
    
    project_tasks = Task.objects.filter(
        project=project,
        is_completed=False
    ).select_related('project').prefetch_related('labels')
    
    projects = Project.objects.filter(
        Q(owner=request.user) | Q(members=request.user)
    ).distinct().annotate(task_count=Count('tasks', filter=Q(tasks__is_completed=False)))
    
    context = {
        'project': project,
        'project_tasks': project_tasks,
        'projects': projects,
        'current_view': 'project',
    }
    return render(request, 'todo/project.html', context)


@login_required
def filters_labels_view(request):
    """Filters and labels view"""
    labels = Label.objects.filter(owner=request.user)
    
    projects = Project.objects.filter(
        Q(owner=request.user) | Q(members=request.user)
    ).distinct().annotate(task_count=Count('tasks', filter=Q(tasks__is_completed=False)))
    
    context = {
        'labels': labels,
        'projects': projects,
        'current_view': 'filters',
    }
    return render(request, 'todo/filters_labels.html', context)


# API Views
@login_required
@require_http_methods(["POST"])
def create_task(request):
    """Create a new task via AJAX"""
    try:
        data = json.loads(request.body)
        
        task = Task.objects.create(
            title=data.get('title'),
            description=data.get('description', ''),
            project_id=data.get('project_id') if data.get('project_id') else None,
            owner=request.user,
            priority=data.get('priority', 1),
            due_date=datetime.fromisoformat(data.get('due_date')) if data.get('due_date') else None,
        )
        
        return JsonResponse({
            'success': True,
            'task': {
                'id': task.id,
                'title': task.title,
                'description': task.description,
                'priority': task.priority,
                'due_date': task.due_date.isoformat() if task.due_date else None,
                'project_name': task.project.name if task.project else None,
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@require_http_methods(["POST"])
def toggle_task(request, task_id):
    """Toggle task completion status"""
    task = get_object_or_404(Task, id=task_id, owner=request.user)
    
    if task.is_completed:
        task.is_completed = False
        task.completed_at = None
    else:
        task.complete()
    
    task.save()
    
    return JsonResponse({
        'success': True,
        'is_completed': task.is_completed
    })


@login_required
@require_http_methods(["DELETE"])
def delete_task(request, task_id):
    """Delete a task"""
    task = get_object_or_404(Task, id=task_id, owner=request.user)
    task.delete()
    
    return JsonResponse({'success': True})


@login_required
@require_http_methods(["POST"])
def create_project(request):
    """Create a new project via AJAX"""
    try:
        data = json.loads(request.body)
        
        project = Project.objects.create(
            name=data.get('name'),
            description=data.get('description', ''),
            color=data.get('color', '#DB4035'),
            owner=request.user,
            is_team_project=data.get('is_team_project', False)
        )
        
        return JsonResponse({
            'success': True,
            'project': {
                'id': project.id,
                'name': project.name,
                'color': project.color,
                'task_count': 0
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@require_http_methods(["POST"])
def create_label(request):
    """Create a new label via AJAX"""
    try:
        data = json.loads(request.body)
        
        label = Label.objects.create(
            name=data.get('name'),
            color=data.get('color', '#808080'),
            owner=request.user
        )
        
        return JsonResponse({
            'success': True,
            'label': {
                'id': label.id,
                'name': label.name,
                'color': label.color
            }
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@require_http_methods(["POST"])
def add_project_member(request, project_id):
    """Add a member to a project"""
    project = get_object_or_404(Project, id=project_id, owner=request.user)
    
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({'success': False, 'error': 'נדרש כתובת אימייל'})
        
        # Try to find user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'משתמש לא נמצא'})
        
        # Check if user is already a member
        if user == project.owner or user in project.members.all():
            return JsonResponse({'success': False, 'error': 'המשתמש כבר חבר בפרויקט'})
        
        # Add user to project
        project.members.add(user)
        
        return JsonResponse({
            'success': True,
            'member': {
                'id': user.id,
                'name': user.get_full_name() or user.username,
                'email': user.email
            }
        })
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


@login_required
@require_http_methods(["POST"])
def remove_project_member(request, project_id, user_id):
    """Remove a member from a project"""
    project = get_object_or_404(Project, id=project_id, owner=request.user)
    user = get_object_or_404(User, id=user_id)
    
    try:
        if user == project.owner:
            return JsonResponse({'success': False, 'error': 'לא ניתן להסיר את בעל הפרויקט'})
        
        project.members.remove(user)
        
        return JsonResponse({'success': True})
        
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})


# Authentication Views
def login_view(request):
    if request.user.is_authenticated:
        return redirect('today')
    
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f'ברוכים הבאים, {username}!')
                return redirect('today')
        else:
            messages.error(request, 'שם משתמש או סיסמה שגויים')
    
    form = AuthenticationForm()
    return render(request, 'registration/login.html', {'form': form})


def register_view(request):
    if request.user.is_authenticated:
        return redirect('today')
    
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Create user profile
            UserProfile.objects.create(user=user)
            messages.success(request, 'החשבון נוצר בהצלחה!')
            return redirect('login')
        else:
            messages.error(request, 'אנא תקן את השגיאות בטופס')
    
    form = UserCreationForm()
    return render(request, 'registration/register.html', {'form': form})


@login_required
def logout_view(request):
    logout(request)
    messages.success(request, 'התנתקת בהצלחה')
    return redirect('login')


@login_required
def settings_view(request):
    """User settings view"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'POST':
        profile.theme = request.POST.get('theme', 'light')
        profile.language = request.POST.get('language', 'he')
        profile.timezone = request.POST.get('timezone', 'Asia/Jerusalem')
        profile.save()
        messages.success(request, 'ההגדרות נשמרו בהצלחה')
        return redirect('settings')
    
    context = {
        'profile': profile,
        'current_view': 'settings',
    }
    return render(request, 'todo/settings.html', context)
