from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Delete corrupted Hebrew user to allow fresh creation'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, default='lironatar94@gmail.com', help='Email of user to delete')

    def handle(self, *args, **options):
        email = options['email']
        
        try:
            user = User.objects.get(email=email)
            self.stdout.write(f"Found user: {user.email}")
            self.stdout.write(f"  First name: '{user.first_name}' ({repr(user.first_name)})")
            self.stdout.write(f"  Last name: '{user.last_name}' ({repr(user.last_name)})")
            
            user.delete()
            self.stdout.write(self.style.SUCCESS(f"✅ Successfully deleted user: {email}"))
            self.stdout.write("Next Google login will create a fresh user with proper Hebrew encoding.")
            
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING(f"No user found with email: {email}"))
            self.stdout.write("Ready for fresh Google login.")
