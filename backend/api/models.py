from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

# Create your models here.
class Note(models.Model):
    title = models.CharField(max_length=100)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')

    def __str__(self):
        return self.title

# Signal to capitalize user names
@receiver(pre_save, sender=User)
def capitalize_user_names(sender, instance, **kwargs):
    if instance.first_name:
        instance.first_name = instance.first_name.capitalize()
    if instance.last_name:
        instance.last_name = instance.last_name.capitalize()

# Signal to create profile and calendar when user is created
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
        Calendar.objects.create(user=instance)

class Profile(models.Model):
    ROLE_CHOICES = (
        ('PRO', 'SweatPro'),
        ('ATHLETE', 'SweatAthlete'),
        ('SWEAT_TEAM_MEMBER', 'SweatTeamMember'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='ATHLETE')

    def __str__(self):
        return self.user.username

class Calendar(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    events = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.user.username}'s Calendar"

# SweatSheet Models
class WorkoutCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name

class WorkoutExercise(models.Model):
    category = models.ForeignKey(WorkoutCategory, on_delete=models.CASCADE, related_name='exercises')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.category.name} - {self.name}"

class SweatSheet(models.Model):
    name = models.CharField(max_length=200)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sweatsheets')  # Creator (SweatPro)
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_sweatsheets', null=True, blank=True)  # Athlete
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    is_template = models.BooleanField(default=False)  # For reusable templates
    
    def __str__(self):
        return f"{self.user.username}'s {self.name}"

class Phase(models.Model):
    sweat_sheet = models.ForeignKey(SweatSheet, on_delete=models.CASCADE, related_name='phases')
    phase_number = models.IntegerField()
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        unique_together = ['sweat_sheet', 'phase_number']
        ordering = ['phase_number']
    
    def __str__(self):
        return f"{self.sweat_sheet.name} - Phase {self.phase_number}"

class Section(models.Model):
    phase = models.ForeignKey(Phase, on_delete=models.CASCADE, related_name='sections')
    section_number = models.IntegerField()
    date = models.DateField()
    
    class Meta:
        unique_together = ['phase', 'section_number']
        ordering = ['section_number']
    
    def __str__(self):
        return f"{self.phase} - Section {self.section_number}"

class Exercise(models.Model):
    section = models.ForeignKey(Section, on_delete=models.CASCADE, related_name='exercises')
    workout_category = models.ForeignKey(WorkoutCategory, on_delete=models.CASCADE)
    specific_workout = models.ForeignKey(WorkoutExercise, on_delete=models.CASCADE)
    sets = models.CharField(max_length=10)
    reps = models.CharField(max_length=10)
    weight = models.CharField(max_length=20, blank=True)
    completed = models.BooleanField(default=False)
    order = models.IntegerField()
    
    class Meta:
        ordering = ['order']
    
    def __str__(self):
        return f"{self.specific_workout.name} - {self.sets}x{self.reps}"