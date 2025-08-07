from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Note, Profile, Calendar, WorkoutCategory, WorkoutExercise, SweatSheet, Phase, Section, Exercise

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['phone_number', 'role']

class ProfileUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(max_length=30, required=False)
    last_name = serializers.CharField(max_length=30, required=False)
    email = serializers.EmailField(required=False)
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    
    class Meta:
        model = Profile
        fields = ['first_name', 'last_name', 'email', 'phone_number']
    
    def to_representation(self, instance):
        """Return user data in the expected format"""
        return {
            'username': instance.user.username,
            'first_name': instance.user.first_name,
            'last_name': instance.user.last_name,
            'email': instance.user.email,
            'profile': {
                'role': instance.role,
                'phone_number': instance.phone_number
            }
        }
    
    def update(self, instance, validated_data):
        # Update user fields
        user = instance.user
        if 'first_name' in validated_data:
            user.first_name = validated_data['first_name']
        if 'last_name' in validated_data:
            user.last_name = validated_data['last_name']
        if 'email' in validated_data:
            user.email = validated_data['email']
        user.save()
        
        # Update profile fields
        if 'phone_number' in validated_data:
            instance.phone_number = validated_data['phone_number']
        instance.save()
        
        return instance

class CalendarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Calendar
        fields = ['events']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(required=True)
    calendar = CalendarSerializer(required=False)
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'password2', 'profile', 'calendar']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def to_representation(self, instance):
        """Ensure names are capitalized when returned"""
        data = super().to_representation(instance)
        if instance.first_name:
            data['first_name'] = instance.first_name.capitalize()
        if instance.last_name:
            data['last_name'] = instance.last_name.capitalize()
        return data

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "User with this email already exists."})

        return attrs

    def create(self, validated_data):
        profile_data = validated_data.pop('profile')
        validated_data.pop('calendar', None)  # Remove calendar data if present
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )

        user.set_password(validated_data['password'])
        user.save()

        Profile.objects.create(user=user, **profile_data)
        Calendar.objects.create(user=user)

        return user

class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'title', 'content', 'created_at', 'author']
        read_only_fields = ['author']

# SweatSheet Serializers
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
    workout_category_id = serializers.IntegerField(write_only=True)
    specific_workout_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Exercise
        fields = ['id', 'workout_category', 'specific_workout', 'sets', 'reps', 'weight', 'completed', 'order', 'workout_category_id', 'specific_workout_id']
    
    def create(self, validated_data):
        workout_category_id = validated_data.pop('workout_category_id')
        specific_workout_id = validated_data.pop('specific_workout_id')
        
        validated_data['workout_category_id'] = workout_category_id
        validated_data['specific_workout_id'] = specific_workout_id
        
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
    creator_name = serializers.CharField(source='user.get_full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    
    class Meta:
        model = SweatSheet
        fields = ['id', 'name', 'created_at', 'updated_at', 'is_active', 'is_template', 'phases', 'creator_name', 'assigned_to_name', 'assigned_to']
        read_only_fields = ['created_at', 'updated_at']