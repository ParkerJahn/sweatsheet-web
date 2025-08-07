from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Profile, WorkoutCategory, WorkoutExercise, SweatSheet, Phase, Section, Exercise
from datetime import date, timedelta
import random

class Command(BaseCommand):
    help = 'Create sample data for testing - users, profiles, and SweatSheets'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before creating sample data',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            User.objects.filter(is_superuser=False).delete()
            SweatSheet.objects.all().delete()
            
        # Create sample users with different roles
        sample_users = [
            {
                'username': 'sweatpro1',
                'email': 'pro1@sweatsheet.com',
                'first_name': 'Alex',
                'last_name': 'Johnson',
                'password': 'testpass123',
                'role': 'PRO'
            },
            {
                'username': 'teamlead1',
                'email': 'team1@sweatsheet.com',
                'first_name': 'Sarah',
                'last_name': 'Wilson',
                'password': 'testpass123',
                'role': 'SWEAT_TEAM_MEMBER'
            },
            {
                'username': 'athlete1',
                'email': 'athlete1@sweatsheet.com',
                'first_name': 'Mike',
                'last_name': 'Davis',
                'password': 'testpass123',
                'role': 'ATHLETE'
            },
            {
                'username': 'athlete2',
                'email': 'athlete2@sweatsheet.com',
                'first_name': 'Emma',
                'last_name': 'Brown',
                'password': 'testpass123',
                'role': 'ATHLETE'
            },
            {
                'username': 'athlete3',
                'email': 'athlete3@sweatsheet.com',
                'first_name': 'James',
                'last_name': 'Miller',
                'password': 'testpass123',
                'role': 'ATHLETE'
            }
        ]

        created_users = []
        for user_data in sample_users:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name']
                }
            )
            
            if created:
                user.set_password(user_data['password'])
                user.save()
                
                # Update profile role
                profile = user.profile
                profile.role = user_data['role']
                profile.phone_number = f'+1555{random.randint(1000000, 9999999)}'
                profile.save()
                
                created_users.append(user)
                self.stdout.write(
                    self.style.SUCCESS(f'Created user: {user.username} ({user_data["role"]})')
                )
            else:
                created_users.append(user)

        # Create sample SweatSheets
        pro_users = [u for u in created_users if u.profile.role in ['PRO', 'SWEAT_TEAM_MEMBER']]
        if pro_users:
            self.create_sample_sweatsheets(pro_users[0])

        self.stdout.write(
            self.style.SUCCESS('Successfully created sample data!')
        )

    def create_sample_sweatsheets(self, creator):
        # Get workout categories and exercises
        categories = list(WorkoutCategory.objects.all())
        if not categories:
            self.stdout.write(
                self.style.WARNING('No workout categories found. Run populate_workouts first.')
            )
            return

        sample_sweatsheets = [
            {
                'name': 'Beginner Full Body Workout',
                'is_template': True,
                'phases': [
                    {
                        'phase_number': 1,
                        'sections': [
                            {
                                'section_number': 1,
                                'exercises': [
                                    {'category': 'Cardio', 'exercise': 'Jumping Jacks', 'sets': '1', 'reps': '30', 'weight': ''},
                                    {'category': 'Flexibility', 'exercise': 'Dynamic Stretching', 'sets': '1', 'reps': '10', 'weight': ''}
                                ]
                            }
                        ]
                    },
                    {
                        'phase_number': 2,
                        'sections': [
                            {
                                'section_number': 1,
                                'exercises': [
                                    {'category': 'Upper Body', 'exercise': 'Push-ups', 'sets': '3', 'reps': '10', 'weight': ''},
                                    {'category': 'Lower Body', 'exercise': 'Squats', 'sets': '3', 'reps': '15', 'weight': ''},
                                    {'category': 'Core', 'exercise': 'Planks', 'sets': '3', 'reps': '30s', 'weight': ''}
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                'name': 'Advanced Strength Training',
                'is_template': True,
                'phases': [
                    {
                        'phase_number': 1,
                        'sections': [
                            {
                                'section_number': 1,
                                'exercises': [
                                    {'category': 'Upper Body', 'exercise': 'Bench Press', 'sets': '4', 'reps': '8', 'weight': '185 lbs'},
                                    {'category': 'Lower Body', 'exercise': 'Deadlifts', 'sets': '4', 'reps': '6', 'weight': '225 lbs'},
                                    {'category': 'Upper Body', 'exercise': 'Pull-ups', 'sets': '3', 'reps': '10', 'weight': ''}
                                ]
                            }
                        ]
                    }
                ]
            }
        ]

        for sheet_data in sample_sweatsheets:
            sweatsheet = SweatSheet.objects.create(
                name=sheet_data['name'],
                user=creator,
                is_template=sheet_data['is_template']
            )

            for phase_data in sheet_data['phases']:
                phase = Phase.objects.create(
                    sweat_sheet=sweatsheet,
                    phase_number=phase_data['phase_number']
                )

                for section_data in phase_data['sections']:
                    # Create sections with dates starting from today
                    section_date = date.today() + timedelta(days=section_data['section_number'] - 1)
                    section = Section.objects.create(
                        phase=phase,
                        section_number=section_data['section_number'],
                        date=section_date
                    )

                    for order, exercise_data in enumerate(section_data['exercises'], 1):
                        try:
                            category = WorkoutCategory.objects.get(name=exercise_data['category'])
                            workout_exercise = WorkoutExercise.objects.get(
                                name=exercise_data['exercise'],
                                category=category
                            )

                            Exercise.objects.create(
                                section=section,
                                workout_category=category,
                                specific_workout=workout_exercise,
                                sets=exercise_data['sets'],
                                reps=exercise_data['reps'],
                                weight=exercise_data['weight'],
                                order=order
                            )
                        except (WorkoutCategory.DoesNotExist, WorkoutExercise.DoesNotExist):
                            self.stdout.write(
                                self.style.WARNING(f'Exercise not found: {exercise_data["exercise"]}')
                            )

            self.stdout.write(
                self.style.SUCCESS(f'Created SweatSheet: {sweatsheet.name}')
            ) 