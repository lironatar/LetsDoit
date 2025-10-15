from django import forms
from .models import Task, Project, Label, Team


class TaskForm(forms.ModelForm):
    class Meta:
        model = Task
        fields = ['title', 'description', 'project', 'labels', 'priority', 'due_date', 'due_time']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'כותרת המשימה',
                'dir': 'rtl'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'תיאור המשימה',
                'dir': 'rtl'
            }),
            'project': forms.Select(attrs={'class': 'form-control'}),
            'labels': forms.CheckboxSelectMultiple(),
            'priority': forms.Select(attrs={'class': 'form-control'}),
            'due_date': forms.DateTimeInput(attrs={
                'class': 'form-control',
                'type': 'datetime-local'
            }),
            'due_time': forms.TimeInput(attrs={
                'class': 'form-control',
                'type': 'time'
            }),
        }
        labels = {
            'title': 'כותרת',
            'description': 'תיאור',
            'project': 'פרויקט',
            'labels': 'תוויות',
            'priority': 'עדיפות',
            'due_date': 'תאריך יעד',
            'due_time': 'שעת יעד',
        }


class ProjectForm(forms.ModelForm):
    class Meta:
        model = Project
        fields = ['name', 'description', 'color', 'team']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'שם הפרויקט',
                'dir': 'rtl'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'תיאור הפרויקט',
                'dir': 'rtl'
            }),
            'color': forms.Select(attrs={'class': 'form-control'}),
            'team': forms.Select(attrs={'class': 'form-control'}),
        }
        labels = {
            'name': 'שם הפרויקט',
            'description': 'תיאור',
            'color': 'צבע',
            'team': 'צוות',
        }


class LabelForm(forms.ModelForm):
    class Meta:
        model = Label
        fields = ['name', 'color']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'שם התווית',
                'dir': 'rtl'
            }),
            'color': forms.TextInput(attrs={
                'class': 'form-control',
                'type': 'color'
            }),
        }
        labels = {
            'name': 'שם התווית',
            'color': 'צבע',
        }


class TeamForm(forms.ModelForm):
    class Meta:
        model = Team
        fields = ['name', 'description', 'color']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'שם הצוות',
                'dir': 'rtl'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'תיאור הצוות',
                'dir': 'rtl'
            }),
            'color': forms.TextInput(attrs={
                'class': 'form-control',
                'type': 'color'
            }),
        }
        labels = {
            'name': 'שם הצוות',
            'description': 'תיאור',
            'color': 'צבע',
        }
