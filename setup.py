#!/usr/bin/env python
"""
TodoFast Setup Script
הסקריפט מגדיר את האפליקציה ויוצר נתונים ראשוניים
"""

import os
import sys
import django
from django.core.management import execute_from_command_line

def setup_django():
    """Setup Django environment"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'todofast.settings')
    django.setup()

def create_migrations():
    """Create and apply database migrations"""
    print("🔧 יוצר migrations...")
    execute_from_command_line(['manage.py', 'makemigrations'])
    
    print("🔧 מריץ migrations...")
    execute_from_command_line(['manage.py', 'migrate'])

def create_superuser():
    """Create a superuser for admin access"""
    from django.contrib.auth.models import User
    
    try:
        if not User.objects.filter(username='admin').exists():
            print("👤 יוצר משתמש מנהל...")
            User.objects.create_superuser(
                username='admin',
                email='admin@todofast.com',
                password='admin123',
                first_name='מנהל',
                last_name='מערכת'
            )
            print("✅ משתמש מנהל נוצר: admin / admin123")
        else:
            print("ℹ️  משתמש מנהל כבר קיים")
    except Exception as e:
        print(f"❌ שגיאה ביצירת משתמש מנהל: {e}")

def create_demo_user():
    """Create a demo user with sample data"""
    from django.contrib.auth.models import User
    from todo.models import Project, Task, Label, UserProfile
    
    try:
        # Create demo user
        demo_user, created = User.objects.get_or_create(
            username='demo',
            defaults={
                'email': 'demo@todofast.com',
                'first_name': 'משתמש',
                'last_name': 'הדגמה',
            }
        )
        
        if created:
            demo_user.set_password('demo123')
            demo_user.save()
            print("✅ משתמש הדגמה נוצר: demo / demo123")
        
        # Create user profile
        profile, created = UserProfile.objects.get_or_create(
            user=demo_user,
            defaults={
                'theme': 'light',
                'language': 'he',
                'timezone': 'Asia/Jerusalem'
            }
        )
        
        # Create sample projects
        if created or not Project.objects.filter(owner=demo_user).exists():
            print("📁 יוצר פרויקטים לדוגמה...")
            
            # Personal project
            personal = Project.objects.create(
                name='אישי',
                description='משימות אישיות ופרטיות',
                color='#7ECC49',
                owner=demo_user
            )
            
            # Work project
            work = Project.objects.create(
                name='עבודה',
                description='משימות הקשורות לעבודה',
                color='#DB4035',
                owner=demo_user
            )
            
            # Learning project
            learning = Project.objects.create(
                name='לימודים',
                description='קורסים ולמידה עצמית',
                color='#4073FF',
                owner=demo_user
            )
            
            # Create sample labels
            print("🏷️  יוצר תוויות לדוגמה...")
            
            urgent = Label.objects.create(
                name='דחוף',
                color='#DB4035',
                owner=demo_user
            )
            
            important = Label.objects.create(
                name='חשוב',
                color='#FF9933',
                owner=demo_user
            )
            
            quick = Label.objects.create(
                name='מהיר',
                color='#7ECC49',
                owner=demo_user
            )
            
            # Create sample tasks
            print("📝 יוצר משימות לדוגמה...")
            
            from datetime import datetime, timedelta
            from django.utils import timezone
            
            today = timezone.now()
            tomorrow = today + timedelta(days=1)
            next_week = today + timedelta(days=7)
            
            # Today's tasks
            Task.objects.create(
                title='סקירת אימיילים',
                description='קריאה ומענה לאימיילים חשובים',
                project=work,
                owner=demo_user,
                priority=2,
                due_date=today.replace(hour=9, minute=0),
                order=1
            )
            
            Task.objects.create(
                title='30 דקות יוגה',
                description='תרגול יוגה בוקר לשיפור הגמישות',
                project=personal,
                owner=demo_user,
                priority=3,
                due_date=today.replace(hour=7, minute=30),
                order=2
            )
            
            # Tomorrow's tasks
            Task.objects.create(
                title='פגישה עם רופא שיניים',
                description='בדיקה שגרתית כל 6 חודשים',
                project=personal,
                owner=demo_user,
                priority=2,
                due_date=tomorrow.replace(hour=10, minute=0),
                order=3
            )
            
            Task.objects.create(
                title='הכנת מצגת לפרויקט',
                description='הכנת מצגת עדכון לפרויקט החדש',
                project=work,
                owner=demo_user,
                priority=4,
                due_date=tomorrow.replace(hour=14, minute=0),
                order=4
            )
            
            # Future tasks
            Task.objects.create(
                title='קריאת ספר על פיתוח',
                description='סיום קריאת ספר "Clean Code"',
                project=learning,
                owner=demo_user,
                priority=1,
                due_date=next_week,
                order=5
            )
            
            Task.objects.create(
                title='תכנון חופשה',
                description='בחירת יעד וזמן לחופשה הבאה',
                project=personal,
                owner=demo_user,
                priority=1,
                due_date=next_week + timedelta(days=3),
                order=6
            )
            
            # Inbox task (no project)
            Task.objects.create(
                title='קניית לחם',
                description='קניית לחם טרי לשבת',
                owner=demo_user,
                priority=1,
                order=7
            )
            
            # Add labels to some tasks
            tasks_with_labels = Task.objects.filter(owner=demo_user)[:3]
            if tasks_with_labels:
                tasks_with_labels[0].labels.add(urgent)
                tasks_with_labels[1].labels.add(important, quick)
                tasks_with_labels[2].labels.add(quick)
            
            print("✅ נתוני הדגמה נוצרו בהצלחה!")
            
    except Exception as e:
        print(f"❌ שגיאה ביצירת נתוני הדגמה: {e}")

def collect_static():
    """Collect static files"""
    print("📁 אוסף קבצים סטטיים...")
    try:
        execute_from_command_line(['manage.py', 'collectstatic', '--noinput'])
        print("✅ קבצים סטטיים נאספו")
    except Exception as e:
        print(f"⚠️  שגיאה באיסוף קבצים סטטיים: {e}")

def main():
    """Main setup function"""
    print("🚀 מתחיל הגדרת TodoFast...")
    print("=" * 50)
    
    # Setup Django
    setup_django()
    
    # Create migrations and migrate
    create_migrations()
    
    # Create superuser
    create_superuser()
    
    # Create demo data
    create_demo_user()
    
    # Collect static files
    collect_static()
    
    print("=" * 50)
    print("✅ TodoFast הוגדר בהצלחה!")
    print()
    print("🔧 כדי להריץ את השרת:")
    print("   python manage.py runserver")
    print()
    print("👤 פרטי כניסה:")
    print("   מנהל: admin / admin123")
    print("   הדגמה: demo / demo123")
    print()
    print("🌐 כתובת האתר:")
    print("   http://127.0.0.1:8000")
    print()
    print("📊 ממשק ניהול:")
    print("   http://127.0.0.1:8000/admin")

if __name__ == '__main__':
    main()
