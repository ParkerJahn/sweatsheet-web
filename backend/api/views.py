from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .serializers import (
    UserSerializer, NoteSerializer, CalendarSerializer, ProfileSerializer,
    WorkoutCategorySerializer, WorkoutExerciseSerializer, SweatSheetSerializer,
    PhaseSerializer, SectionSerializer, ExerciseSerializer
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Note, Calendar, Profile, WorkoutCategory, WorkoutExercise, SweatSheet, Phase, Section, Exercise
from django.db import models
from rest_framework import serializers

def has_sweatpro_permissions(user):
    """Check if user has SweatPro permissions (PRO or SWEAT_TEAM_MEMBER)"""
    return user.profile.role in ['PRO', 'SWEAT_TEAM_MEMBER']

def is_athlete(user):
    """Check if user is an athlete"""
    return user.profile.role == 'ATHLETE'

# Create your views here.
class NoteListCreate(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author=user)
    
    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(author=self.request.user)
        else:
            print(serializer.errors)

class NoteDelete(generics.DestroyAPIView):
    queryset = Note.objects.all()
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(author=user)


class UserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class CalendarView(generics.RetrieveUpdateAPIView):
    serializer_class = CalendarSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.calendar

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.profile

# SweatSheet Views
class WorkoutCategoryListView(generics.ListAPIView):
    queryset = WorkoutCategory.objects.all()
    serializer_class = WorkoutCategorySerializer
    permission_classes = [IsAuthenticated]

class WorkoutExerciseListView(generics.ListAPIView):
    serializer_class = WorkoutExerciseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        category_id = self.request.query_params.get('category_id')
        if category_id:
            return WorkoutExercise.objects.filter(category_id=category_id)
        return WorkoutExercise.objects.all()

class SweatSheetListView(generics.ListCreateAPIView):
    serializer_class = SweatSheetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if has_sweatpro_permissions(user):
            # SweatPros and SweatTeamMembers see their created SweatSheets and templates
            return SweatSheet.objects.filter(
                models.Q(user=user) | models.Q(is_template=True)
            )
        else:
            # SweatAthletes see assigned SweatSheets
            return SweatSheet.objects.filter(assigned_to=user, is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SweatSheetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SweatSheetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if has_sweatpro_permissions(user):
            # SweatPros and SweatTeamMembers can access their created SweatSheets and templates
            return SweatSheet.objects.filter(
                models.Q(user=user) | models.Q(is_template=True)
            )
        else:
            # SweatAthletes can access assigned SweatSheets
            return SweatSheet.objects.filter(assigned_to=user, is_active=True)

class SweatSheetAssignmentView(generics.UpdateAPIView):
    serializer_class = SweatSheetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only SweatPros and SweatTeamMembers can assign SweatSheets
        return SweatSheet.objects.filter(user=self.request.user)
    
    def perform_update(self, serializer):
        # Validate that assigned user is an athlete
        assigned_user = serializer.validated_data.get('assigned_to')
        if assigned_user and not is_athlete(assigned_user):
            raise serializers.ValidationError("Can only assign SweatSheets to athletes")
        serializer.save()

class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Return athletes for assignment (only ATHLETE role)
        return User.objects.filter(profile__role='ATHLETE')

class AllUsersListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # All users can view the team, but with different filtering based on role
        if has_sweatpro_permissions(user):
            # SweatPros and SweatTeamMembers can see all users
            return User.objects.all().select_related('profile')
        else:
            # Athletes can see all users (for team view) but with limited information
            return User.objects.all().select_related('profile')

class PhaseListView(generics.ListCreateAPIView):
    serializer_class = PhaseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        sweat_sheet_id = self.kwargs.get('sweat_sheet_id')
        
        if has_sweatpro_permissions(user):
            # SweatPros and SweatTeamMembers can access phases of their created SweatSheets
            return Phase.objects.filter(sweat_sheet_id=sweat_sheet_id, sweat_sheet__user=user)
        else:
            # SweatAthletes can access phases of their assigned SweatSheets
            return Phase.objects.filter(sweat_sheet_id=sweat_sheet_id, sweat_sheet__assigned_to=user)
    
    def perform_create(self, serializer):
        sweat_sheet_id = self.kwargs.get('sweat_sheet_id')
        user = self.request.user
        
        if has_sweatpro_permissions(user):
            sweat_sheet = SweatSheet.objects.get(id=sweat_sheet_id, user=user)
        else:
            sweat_sheet = SweatSheet.objects.get(id=sweat_sheet_id, assigned_to=user)
        serializer.save(sweat_sheet=sweat_sheet)

class SectionListView(generics.ListCreateAPIView):
    serializer_class = SectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        phase_id = self.kwargs.get('phase_id')
        
        if has_sweatpro_permissions(user):
            # SweatPros and SweatTeamMembers can access sections of their created phases
            return Section.objects.filter(phase_id=phase_id, phase__sweat_sheet__user=user)
        else:
            # SweatAthletes can access sections of their assigned phases
            return Section.objects.filter(phase_id=phase_id, phase__sweat_sheet__assigned_to=user)
    
    def perform_create(self, serializer):
        phase_id = self.kwargs.get('phase_id')
        user = self.request.user
        
        if has_sweatpro_permissions(user):
            phase = Phase.objects.get(id=phase_id, sweat_sheet__user=user)
        else:
            phase = Phase.objects.get(id=phase_id, sweat_sheet__assigned_to=user)
        serializer.save(phase=phase)

class ExerciseListView(generics.ListCreateAPIView):
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        section_id = self.kwargs.get('section_id')
        
        if has_sweatpro_permissions(user):
            # SweatPros and SweatTeamMembers can access exercises of their created sections
            return Exercise.objects.filter(section_id=section_id, section__phase__sweat_sheet__user=user)
        else:
            # SweatAthletes can access exercises of their assigned sections
            return Exercise.objects.filter(section_id=section_id, section__phase__sweat_sheet__assigned_to=user)
    
    def perform_create(self, serializer):
        section_id = self.kwargs.get('section_id')
        user = self.request.user
        
        if has_sweatpro_permissions(user):
            section = Section.objects.get(id=section_id, phase__sweat_sheet__user=user)
        else:
            section = Section.objects.get(id=section_id, phase__sweat_sheet__assigned_to=user)
        serializer.save(section=section)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_phase(request, phase_id):
    try:
        phase = Phase.objects.get(id=phase_id, sweat_sheet__user=request.user)
        phase.is_completed = True
        phase.save()
        return Response({'message': 'Phase completed successfully'}, status=status.HTTP_200_OK)
    except Phase.DoesNotExist:
        return Response({'error': 'Phase not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_exercise(request, exercise_id):
    try:
        exercise = Exercise.objects.get(id=exercise_id, section__phase__sweat_sheet__user=request.user)
        exercise.completed = not exercise.completed
        exercise.save()
        return Response({'message': 'Exercise status updated', 'completed': exercise.completed}, status=status.HTTP_200_OK)
    except Exercise.DoesNotExist:
        return Response({'error': 'Exercise not found'}, status=status.HTTP_404_NOT_FOUND)