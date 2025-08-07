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

# Messaging Models
class Conversation(models.Model):
    CONVERSATION_TYPES = (
        ('DIRECT', 'Direct Message'),
        ('GROUP', 'Group Chat'),
    )
    
    participants = models.ManyToManyField(User, related_name='conversations')
    conversation_type = models.CharField(max_length=10, choices=CONVERSATION_TYPES, default='DIRECT')
    title = models.CharField(max_length=200, blank=True)  # For group chats
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        if self.conversation_type == 'DIRECT':
            participants = list(self.participants.all())
            if len(participants) >= 2:
                return f"{participants[0].username} & {participants[1].username}"
            return f"Direct message"
        return self.title or f"Group chat #{self.id}"
    
    @property
    def last_message(self):
        return self.messages.first()  # Due to ordering by -created_at
    
    def get_other_participant(self, user):
        """Get the other participant in a direct conversation"""
        if self.conversation_type == 'DIRECT':
            return self.participants.exclude(id=user.id).first()
        return None

class Message(models.Model):
    MESSAGE_TYPES = (
        ('TEXT', 'Text Message'),
        ('IMAGE', 'Image'),
        ('FILE', 'File'),
        ('SYSTEM', 'System Message'),
    )
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='TEXT')
    content = models.TextField()
    file_url = models.URLField(blank=True)  # For images/files
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    is_edited = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.sender.username}: {self.content[:50]}..."

class MessageRead(models.Model):
    """Track read status of messages per user"""
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='read_by')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='read_messages')
    read_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['message', 'user']
    
    def __str__(self):
        return f"{self.user.username} read message {self.message.id}"

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