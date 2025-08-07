from django.urls import path
from . import views

urlpatterns = [
    path('notes/', views.NoteListCreate.as_view(), name='note-list'),
    path('notes/delete/<int:pk>/', views.NoteDelete.as_view(), name='delete-note'),
    path('register/', views.UserCreateView.as_view(), name='register'),
    path('calendar/', views.CalendarView.as_view(), name='calendar'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    
    # Messaging URLs
    path('conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    path('conversations/<int:pk>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<int:conversation_id>/messages/', views.MessageListCreateView.as_view(), name='message-list'),
    path('conversations/<int:conversation_id>/messages/<int:pk>/', views.MessageDetailView.as_view(), name='message-detail'),
    path('conversations/<int:conversation_id>/mark-read/', views.MarkMessageAsReadView.as_view(), name='mark-read'),
    path('conversations/direct/', views.GetOrCreateDirectConversationView.as_view(), name='direct-conversation'),
    
    # SweatSheet URLs
    path('workout-categories/', views.WorkoutCategoryListView.as_view(), name='workout-categories'),
    path('workout-exercises/', views.WorkoutExerciseListView.as_view(), name='workout-exercises'),
    path('sweatsheets/', views.SweatSheetListView.as_view(), name='sweatsheet-list'),
    path('sweatsheets/<int:pk>/', views.SweatSheetDetailView.as_view(), name='sweatsheet-detail'),
    path('sweatsheets/<int:pk>/assign/', views.SweatSheetAssignmentView.as_view(), name='sweatsheet-assign'),
    path('users/athletes/', views.UserListView.as_view(), name='user-list'),
    path('users/', views.AllUsersListView.as_view(), name='all-users-list'),
    path('sweatsheets/<int:sweat_sheet_id>/phases/', views.PhaseListView.as_view(), name='phase-list'),
    path('phases/<int:phase_id>/sections/', views.SectionListView.as_view(), name='section-list'),
    path('sections/<int:section_id>/exercises/', views.ExerciseListView.as_view(), name='exercise-list'),
    path('phases/<int:phase_id>/complete/', views.complete_phase, name='complete-phase'),
    path('exercises/<int:exercise_id>/complete/', views.complete_exercise, name='complete-exercise'),
]