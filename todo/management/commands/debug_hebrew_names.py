from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Debug Hebrew names in database'

    def handle(self, *args, **options):
        self.stdout.write("=== DEBUG HEBREW NAMES ===")
        
        users = User.objects.all()[:5]
        
        for user in users:
            self.stdout.write(f"\nUser: {user.email}")
            self.stdout.write(f"  First name: '{user.first_name}'")
            self.stdout.write(f"  Last name: '{user.last_name}'")
            
            if user.first_name:
                self.stdout.write(f"  First name (repr): {repr(user.first_name)}")
                try:
                    self.stdout.write(f"  First name (bytes): {user.first_name.encode('utf-8').hex()}")
                except Exception as e:
                    self.stdout.write(f"  First name encode error: {e}")
            
            if user.last_name:
                self.stdout.write(f"  Last name (repr): {repr(user.last_name)}")
                try:
                    self.stdout.write(f"  Last name (bytes): {user.last_name.encode('utf-8').hex()}")
                except Exception as e:
                    self.stdout.write(f"  Last name encode error: {e}")
        
        self.stdout.write(f"\nTotal users: {User.objects.count()}")
