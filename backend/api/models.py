from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Note(models.Model):
    title = models.CharField(max_length=100)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')

    def __str__(self):
        return self.title

class Profile(models.Model):
    ROLE_CHOICES = (
        ('PRO', 'SweatPro'),
        ('ATHLETE', 'SweatAthlete'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='ATHLETE')

    def __str__(self):
        return self.user.username

class Calendar(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    events = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.user.username}'s Calendar"