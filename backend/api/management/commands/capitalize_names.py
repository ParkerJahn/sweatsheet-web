from django.core.management.base import BaseCommand
from django.contrib.auth.models import User

class Command(BaseCommand):
    help = 'Capitalize first and last names of all users'

    def handle(self, *args, **options):
        users_updated = 0
        
        for user in User.objects.all():
            updated = False
            
            if user.first_name and user.first_name != user.first_name.capitalize():
                user.first_name = user.first_name.capitalize()
                updated = True
                
            if user.last_name and user.last_name != user.last_name.capitalize():
                user.last_name = user.last_name.capitalize()
                updated = True
                
            if updated:
                user.save()
                users_updated += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Updated user: {user.username} -> {user.first_name} {user.last_name}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {users_updated} users')
        ) 