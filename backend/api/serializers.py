from django.contrib.auth.models import User
from rest_framework import serializers
from .models import (
    Note, Profile, Calendar, 
    Conversation, Message, MessageRead,
    WorkoutCategory, WorkoutExercise, SweatSheet, Phase, Section, Exercise
)

class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'profile']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {})
        user = User.objects.create_user(**validated_data)
        
        # Update profile if provided
        if profile_data:
            for attr, value in profile_data.items():
                setattr(user.profile, attr, value)
            user.profile.save()
            
        return user

    def get_profile(self, obj):
        try:
            return {
                'role': obj.profile.role,
                'phone_number': obj.profile.phone_number,
            }
        except Profile.DoesNotExist:
            return {'role': 'ATHLETE', 'phone_number': ''}

class CalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calendar
        fields = ['events']

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Profile
        fields = ['username', 'first_name', 'last_name', 'email', 'role', 'phone_number']

class ProfileUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email')
    username = serializers.CharField(source='user.username', read_only=True)
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'profile']

    def get_profile(self, obj):
        return {
            'role': obj.profile.role,
            'phone_number': obj.profile.phone_number,
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return data

    def update(self, instance, validated_data):
        # Update User fields
        user_data = {k: v for k, v in validated_data.items() if k.startswith('user.')}
        for attr, value in user_data.items():
            attr_name = attr.replace('user.', '')
            setattr(instance, attr_name, value)
        
        # Update Profile fields
        phone_number = self.initial_data.get('phone_number')
        if phone_number is not None:
            instance.profile.phone_number = phone_number
            instance.profile.save()
        
        instance.save()
        return instance

class TeamUserSerializer(serializers.ModelSerializer):
    """Lightweight serializer for team/user lists"""
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'profile']

    def get_profile(self, obj):
        try:
            return {
                'role': obj.profile.role,
                'phone_number': obj.profile.phone_number,
            }
        except Profile.DoesNotExist:
            return {'role': 'ATHLETE', 'phone_number': ''}

# Messaging Serializers
class MessageParticipantSerializer(serializers.ModelSerializer):
    """Lightweight user info for messaging"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class MessageSerializer(serializers.ModelSerializer):
    sender = MessageParticipantSerializer(read_only=True)
    is_read = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'message_type', 'content', 'file_url', 
            'created_at', 'edited_at', 'is_edited', 'is_deleted', 'is_read'
        ]
        read_only_fields = ['created_at', 'edited_at', 'is_edited']
    
    def get_is_read(self, obj):
        """Check if current user has read this message"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return MessageRead.objects.filter(
                message=obj, 
                user=request.user
            ).exists()
        return False
    
    def create(self, validated_data):
        # Set sender from request user
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['sender'] = request.user
        return super().create(validated_data)

class ConversationListSerializer(serializers.ModelSerializer):
    """Serializer for conversation list view"""
    last_message = serializers.SerializerMethodField()
    other_participant = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    participant_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'conversation_type', 'title', 'updated_at', 
            'last_message', 'other_participant', 'unread_count', 'participant_names'
        ]
    
    def get_last_message(self, obj):
        last_msg = obj.last_message
        if last_msg:
            return {
                'id': last_msg.id,
                'content': last_msg.content,
                'sender_name': f"{last_msg.sender.first_name} {last_msg.sender.last_name}".strip() or last_msg.sender.username,
                'created_at': last_msg.created_at,
                'message_type': last_msg.message_type
            }
        return None
    
    def get_other_participant(self, obj):
        """For direct messages, get the other participant"""
        request = self.context.get('request')
        if request and obj.conversation_type == 'DIRECT':
            other = obj.get_other_participant(request.user)
            if other:
                return {
                    'id': other.id,
                    'username': other.username,
                    'name': f"{other.first_name} {other.last_name}".strip() or other.username
                }
        return None
    
    def get_unread_count(self, obj):
        """Count unread messages for current user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Get all messages in conversation
            all_messages = obj.messages.all()
            # Get messages read by current user
            read_message_ids = MessageRead.objects.filter(
                message__conversation=obj,
                user=request.user
            ).values_list('message_id', flat=True)
            
            # Count unread messages (excluding messages sent by current user)
            unread_count = all_messages.exclude(
                id__in=read_message_ids
            ).exclude(
                sender=request.user
            ).count()
            
            return unread_count
        return 0
    
    def get_participant_names(self, obj):
        """Get all participant names for group chats"""
        participants = obj.participants.all()
        return [
            f"{p.first_name} {p.last_name}".strip() or p.username 
            for p in participants
        ]

class ConversationDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for conversation with messages"""
    participants = MessageParticipantSerializer(many=True, read_only=True)
    messages = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'conversation_type', 'title', 'participants', 
            'created_at', 'updated_at', 'messages'
        ]
    
    def get_messages(self, obj):
        # Get paginated messages (latest 50)
        messages = obj.messages.all()[:50]
        return MessageSerializer(
            messages, 
            many=True, 
            context=self.context
        ).data

class ConversationCreateSerializer(serializers.ModelSerializer):
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True
    )
    
    class Meta:
        model = Conversation
        fields = ['conversation_type', 'title', 'participant_ids']
    
    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids')
        request = self.context.get('request')
        
        # Create conversation
        conversation = Conversation.objects.create(**validated_data)
        
        # Add participants
        participants = User.objects.filter(id__in=participant_ids)
        conversation.participants.add(*participants)
        
        # Add current user if not already included
        if request and request.user.is_authenticated:
            conversation.participants.add(request.user)
        
        return conversation

# Notes and other existing serializers
class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'created_at']
        read_only_fields = ['author']

class WorkoutCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutCategory
        fields = ['id', 'name', 'description']

class WorkoutExerciseSerializer(serializers.ModelSerializer):
    category = WorkoutCategorySerializer(read_only=True)
    
    class Meta:
        model = WorkoutExercise
        fields = ['id', 'name', 'description', 'category']

class ExerciseSerializer(serializers.ModelSerializer):
    workout_category = WorkoutCategorySerializer(read_only=True)
    specific_workout = WorkoutExerciseSerializer(read_only=True)
    
    class Meta:
        model = Exercise
        fields = [
            'id', 'workout_category', 'specific_workout', 
            'sets', 'reps', 'weight', 'completed', 'order'
        ]
    
    def create(self, validated_data):
        # Handle nested creation if needed
        return super().create(validated_data)

class SectionSerializer(serializers.ModelSerializer):
    exercises = ExerciseSerializer(many=True, read_only=True)
    
    class Meta:
        model = Section
        fields = ['id', 'section_number', 'date', 'exercises']

class PhaseSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Phase
        fields = ['id', 'phase_number', 'is_completed', 'completed_at', 'sections']

class SweatSheetSerializer(serializers.ModelSerializer):
    phases = PhaseSerializer(many=True, read_only=True)
    creator_name = serializers.SerializerMethodField()
    assigned_to = serializers.CharField(source='assigned_to.username', read_only=True)
    
    class Meta:
        model = SweatSheet
        fields = [
            'id', 'name', 'created_at', 'updated_at', 'is_active', 
            'is_template', 'phases', 'creator_name', 'assigned_to'
        ]
    
    def get_creator_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username