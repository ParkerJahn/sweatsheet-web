from django.urls import path
from . import views

urlpatterns = [
    path('notes/', views.NoteListCreate.as_view(), name='note-list'),
    path('notes/delete/<int:pk>/', views.NoteDelete.as_view(), name='delete-note'),
    path('register/', views.UserCreateView.as_view(), name='register'),
    path('calendar/', views.CalendarView.as_view(), name='calendar'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    
    # SweatSheet URLs
    path('workout-categories/', views.WorkoutCategoryListView.as_view(), name='workout-categories'),
    path('workout-exercises/', views.WorkoutExerciseListView.as_view(), name='workout-exercises'),
    path('sweatsheets/', views.SweatSheetListView.as_view(), name='sweatsheet-list'),
    path('sweatsheets/<int:pk>/', views.SweatSheetDetailView.as_view(), name='sweatsheet-detail'),
    path('sweatsheets/<int:pk>/assign/', views.SweatSheetAssignmentView.as_view(), name='sweatsheet-assign'),
    path('users/athletes/', views.UserListView.as_view(), name='user-list'),
    path('sweatsheets/<int:sweat_sheet_id>/phases/', views.PhaseListView.as_view(), name='phase-list'),
    path('phases/<int:phase_id>/sections/', views.SectionListView.as_view(), name='section-list'),
    path('sections/<int:section_id>/exercises/', views.ExerciseListView.as_view(), name='exercise-list'),
    path('phases/<int:phase_id>/complete/', views.complete_phase, name='complete-phase'),
    path('exercises/<int:exercise_id>/complete/', views.complete_exercise, name='complete-exercise'),
]