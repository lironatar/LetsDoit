from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from todo.models import Project, Task, Label, UserProfile
from datetime import datetime, timedelta
from django.utils import timezone


class Command(BaseCommand):
    help = 'Create demo data for TodoFast'

    def handle(self, *args, **options):
        self.stdout.write('Creating demo data...')
        
        try:
            # Get or create demo user
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
                self.stdout.write(f'✅ Demo user created: demo / demo123')
            
            # Create additional test users for collaboration
            test_users = [
                {
                    'username': 'alice',
                    'email': 'alice@todofast.com',
                    'first_name': 'אליס',
                    'last_name': 'כהן',
                    'password': 'alice123'
                },
                {
                    'username': 'bob',
                    'email': 'bob@todofast.com', 
                    'first_name': 'בוב',
                    'last_name': 'לוי',
                    'password': 'bob123'
                },
                {
                    'username': 'charlie',
                    'email': 'charlie@todofast.com',
                    'first_name': 'צ׳רלי',
                    'last_name': 'אברמוביץ',
                    'password': 'charlie123'
                }
            ]
            
            created_users = []
            for user_data in test_users:
                user, created = User.objects.get_or_create(
                    username=user_data['username'],
                    defaults={
                        'email': user_data['email'],
                        'first_name': user_data['first_name'],
                        'last_name': user_data['last_name'],
                    }
                )
                if created:
                    user.set_password(user_data['password'])
                    user.save()
                    created_users.append(user)
                    self.stdout.write(f'✅ Test user created: {user_data["username"]} / {user_data["password"]}')
                
                # Create user profile
                UserProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'theme': 'light',
                        'language': 'he',
                        'timezone': 'Asia/Jerusalem'
                    }
                )
            
            # Create user profile
            profile, created = UserProfile.objects.get_or_create(
                user=demo_user,
                defaults={
                    'theme': 'light',
                    'language': 'he',
                    'timezone': 'Asia/Jerusalem'
                }
            )
            
            # Create sample projects if they don't exist
            if not Project.objects.filter(owner=demo_user).exists():
                self.stdout.write('📁 Creating sample projects...')
                
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
                self.stdout.write('🏷️  Creating sample labels...')
                
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
                self.stdout.write('📝 Creating sample tasks...')
                
                today = timezone.now()
                tomorrow = today + timedelta(days=1)
                next_week = today + timedelta(days=7)
                
                # Today's tasks
                task1 = Task.objects.create(
                    title='סקירת אימיילים',
                    description='קריאה ומענה לאימיילים חשובים',
                    project=work,
                    owner=demo_user,
                    priority=2,
                    due_date=today.replace(hour=9, minute=0, second=0, microsecond=0),
                    order=1
                )
                
                task2 = Task.objects.create(
                    title='30 דקות יוגה',
                    description='תרגול יוגה בוקר לשיפור הגמישות',
                    project=personal,
                    owner=demo_user,
                    priority=3,
                    due_date=today.replace(hour=7, minute=30, second=0, microsecond=0),
                    order=2
                )
                
                # Tomorrow's tasks
                task3 = Task.objects.create(
                    title='פגישה עם רופא שיניים',
                    description='בדיקה שגרתית כל 6 חודשים',
                    project=personal,
                    owner=demo_user,
                    priority=2,
                    due_date=tomorrow.replace(hour=10, minute=0, second=0, microsecond=0),
                    order=3
                )
                
                task4 = Task.objects.create(
                    title='הכנת מצגת לפרויקט',
                    description='הכנת מצגת עדכון לפרויקט החדש',
                    project=work,
                    owner=demo_user,
                    priority=4,
                    due_date=tomorrow.replace(hour=14, minute=0, second=0, microsecond=0),
                    order=4
                )
                
                # Future tasks
                task5 = Task.objects.create(
                    title='קריאת ספר על פיתוח',
                    description='סיום קריאת ספר "Clean Code"',
                    project=learning,
                    owner=demo_user,
                    priority=1,
                    due_date=next_week,
                    order=5
                )
                
                task6 = Task.objects.create(
                    title='תכנון חופשה',
                    description='בחירת יעד וזמן לחופשה הבאה',
                    project=personal,
                    owner=demo_user,
                    priority=1,
                    due_date=next_week + timedelta(days=3),
                    order=6
                )
                
                # Inbox task (no project)
                task7 = Task.objects.create(
                    title='קניית לחם',
                    description='קניית לחם טרי לשבת',
                    owner=demo_user,
                    priority=1,
                    order=7
                )
                
                # Add labels to some tasks
                task1.labels.add(urgent)
                task2.labels.add(important, quick)
                task7.labels.add(quick)
                
                self.stdout.write('✅ Demo data created successfully!')
            else:
                self.stdout.write('ℹ️  Demo data already exists')
                
        except Exception as e:
            self.stdout.write(f'❌ Error creating demo data: {e}')
            raise e
