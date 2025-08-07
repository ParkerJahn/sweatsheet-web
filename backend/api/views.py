from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q, Max
from .serializers import (
    UserSerializer, NoteSerializer, CalendarSerializer, ProfileSerializer, ProfileUpdateSerializer, TeamUserSerializer,
    WorkoutCategorySerializer, WorkoutExerciseSerializer, SweatSheetSerializer,
    PhaseSerializer, SectionSerializer, ExerciseSerializer,
    # Messaging serializers
    MessageSerializer, ConversationListSerializer, ConversationDetailSerializer, ConversationCreateSerializer
)
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import (
    Note, Calendar, Profile, WorkoutCategory, WorkoutExercise, SweatSheet, Phase, Section, Exercise,
    # Messaging models
    Conversation, Message, MessageRead
)
from django.db import models
from rest_framework import serializers
from rest_framework.views import APIView
from django.utils import timezone
from django.http import JsonResponse

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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            profile_data = {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'profile': {
                    'role': user.profile.role,
                    'phone_number': user.profile.phone_number,
                }
            }
            return JsonResponse(profile_data)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    def patch(self, request):
        user = request.user
        data = request.data
        
        try:
            # Update user fields
            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'email' in data:
                user.email = data['email']
            user.save()
            
            # Update profile fields
            if 'phone_number' in data:
                user.profile.phone_number = data['phone_number']
                user.profile.save()
                
            return self.get(request)  # Return updated data
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

# Messaging Views
class ConversationListView(generics.ListCreateAPIView):
    """List conversations for current user and create new conversations"""
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ConversationCreateSerializer
        return ConversationListSerializer
    
    def get_queryset(self):
        return Conversation.objects.filter(
            participants=self.request.user,
            is_active=True
        ).distinct()
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if direct conversation already exists
        if serializer.validated_data.get('conversation_type') == 'DIRECT':
            participant_ids = serializer.validated_data['participant_ids']
            if len(participant_ids) == 1:
                # Check for existing direct conversation
                other_user_id = participant_ids[0]
                existing_conversation = Conversation.objects.filter(
                    conversation_type='DIRECT',
                    participants=request.user
                ).filter(
                    participants=other_user_id
                ).first()
                
                if existing_conversation:
                    return Response(
                        ConversationDetailSerializer(existing_conversation, context={'request': request}).data,
                        status=status.HTTP_200_OK
                    )
        
        conversation = serializer.save()
        return Response(
            ConversationDetailSerializer(conversation, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )

class ConversationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a specific conversation"""
    serializer_class = ConversationDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Conversation.objects.filter(
            participants=self.request.user,
            is_active=True
        )

class MessageListCreateView(generics.ListCreateAPIView):
    """List messages in a conversation and create new messages"""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        # Verify user is participant in conversation
        conversation = Conversation.objects.filter(
            id=conversation_id,
            participants=self.request.user
        ).first()
        
        if not conversation:
            return Message.objects.none()
        
        return Message.objects.filter(
            conversation=conversation,
            is_deleted=False
        )
    
    def perform_create(self, serializer):
        conversation_id = self.kwargs['conversation_id']
        conversation = Conversation.objects.filter(
            id=conversation_id,
            participants=self.request.user
        ).first()
        
        if not conversation:
            raise serializers.ValidationError("Conversation not found or access denied")
        
        message = serializer.save(
            conversation=conversation,
            sender=self.request.user
        )
        
        # Update conversation timestamp
        conversation.updated_at = timezone.now()
        conversation.save()

class MessageDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a specific message"""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        return Message.objects.filter(
            conversation_id=conversation_id,
            conversation__participants=self.request.user,
            is_deleted=False
        )
    
    def perform_update(self, serializer):
        # Only allow sender to edit their own messages
        message = self.get_object()
        if message.sender != self.request.user:
            raise serializers.ValidationError("You can only edit your own messages")
        
        serializer.save(
            is_edited=True,
            edited_at=timezone.now()
        )
    
    def perform_destroy(self, instance):
        # Only allow sender to delete their own messages
        if instance.sender != self.request.user:
            raise serializers.ValidationError("You can only delete your own messages")
        
        # Soft delete
        instance.is_deleted = True
        instance.save()

class MarkMessageAsReadView(APIView):
    """Mark messages as read"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, conversation_id):
        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                participants=request.user
            )
            
            message_ids = request.data.get('message_ids', [])
            
            # Mark messages as read
            for message_id in message_ids:
                try:
                    message = Message.objects.get(
                        id=message_id,
                        conversation=conversation
                    )
                    MessageRead.objects.get_or_create(
                        message=message,
                        user=request.user
                    )
                except Message.DoesNotExist:
                    continue
            
            return Response({'status': 'success'})
            
        except Conversation.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class GetOrCreateDirectConversationView(APIView):
    """Get or create a direct conversation with another user"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        other_user_id = request.data.get('user_id')
        
        if not other_user_id:
            return Response(
                {'error': 'user_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check for existing conversation
        conversation = Conversation.objects.filter(
            conversation_type='DIRECT',
            participants=request.user
        ).filter(
            participants=other_user
        ).first()
        
        if conversation:
            serializer = ConversationDetailSerializer(conversation, context={'request': request})
            return Response(serializer.data)
        
        # Create new conversation
        conversation = Conversation.objects.create(conversation_type='DIRECT')
        conversation.participants.add(request.user, other_user)
        
        serializer = ConversationDetailSerializer(conversation, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

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
            # Athletes see their assigned SweatSheets and templates
            return SweatSheet.objects.filter(
                models.Q(assigned_to=user) | models.Q(is_template=True)
            )
    
    def perform_create(self, serializer):
        # Only SweatPros can create SweatSheets
        if not has_sweatpro_permissions(self.request.user):
            raise serializers.ValidationError("Only SweatPros can create SweatSheets")
        serializer.save(user=self.request.user)

class SweatSheetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SweatSheetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if has_sweatpro_permissions(user):
            return SweatSheet.objects.filter(user=user)
        else:
            return SweatSheet.objects.filter(assigned_to=user)

class SweatSheetAssignmentView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        # Only SweatPros can assign SweatSheets
        if not has_sweatpro_permissions(request.user):
            return Response({"error": "Only SweatPros can assign SweatSheets"}, status=403)
        
        try:
            sweatsheet = SweatSheet.objects.get(pk=pk, user=request.user)
            athlete_ids = request.data.get('athletes', [])
            
            for athlete_id in athlete_ids:
                athlete = User.objects.get(pk=athlete_id, profile__role='ATHLETE')
                # Create a copy for assignment
                assigned_sheet = SweatSheet.objects.create(
                    name=sweatsheet.name,
                    user=sweatsheet.user,
                    assigned_to=athlete,
                    is_template=False
                )
                # TODO: Copy phases, sections, and exercises
            
            return Response({"message": "SweatSheet assigned successfully"})
        except SweatSheet.DoesNotExist:
            return Response({"error": "SweatSheet not found"}, status=404)

class UserListView(generics.ListAPIView):
    serializer_class = TeamUserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # SweatPros see all athletes
        if has_sweatpro_permissions(self.request.user):
            return User.objects.filter(profile__role='ATHLETE').select_related('profile')
        else:
            # Athletes see no one (or could see teammates)
            return User.objects.none()

class AllUsersListView(generics.ListAPIView):
    queryset = User.objects.all().select_related('profile')
    serializer_class = TeamUserSerializer
    permission_classes = [IsAuthenticated]

class PhaseListView(generics.ListAPIView):
    serializer_class = PhaseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        sweat_sheet_id = self.kwargs['sweat_sheet_id']
        return Phase.objects.filter(sweat_sheet_id=sweat_sheet_id)

class SectionListView(generics.ListAPIView):
    serializer_class = SectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        phase_id = self.kwargs['phase_id']
        return Section.objects.filter(phase_id=phase_id)

class ExerciseListView(generics.ListAPIView):
    serializer_class = ExerciseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        section_id = self.kwargs['section_id']
        return Exercise.objects.filter(section_id=section_id)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_phase(request, phase_id):
    try:
        phase = Phase.objects.get(pk=phase_id)
        phase.is_completed = True
        phase.completed_at = timezone.now()
        phase.save()
        return Response({"message": "Phase completed"})
    except Phase.DoesNotExist:
        return Response({"error": "Phase not found"}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_exercise(request, exercise_id):
    try:
        exercise = Exercise.objects.get(pk=exercise_id)
        exercise.completed = True
        exercise.save()
        return Response({"message": "Exercise completed"})
    except Exercise.DoesNotExist:
        return Response({"error": "Exercise not found"}, status=404)