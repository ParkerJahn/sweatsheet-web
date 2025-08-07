from django.core.management.base import BaseCommand
from api.models import WorkoutCategory, WorkoutExercise

class Command(BaseCommand):
    help = 'Populate workout categories and exercises with initial data'

    def handle(self, *args, **options):
        # Define workout categories and their exercises
        workout_data = {
            'Upper Body': [
                'Bench Press', 'Push-ups', 'Pull-ups', 'Shoulder Press', 
                'Bicep Curls', 'Tricep Dips', 'Lateral Raises', 'Rows'
            ],
            'Lower Body': [
                'Squats', 'Deadlifts', 'Lunges', 'Leg Press', 
                'Calf Raises', 'Leg Extensions', 'Leg Curls', 'Hip Thrusts'
            ],
            'Core': [
                'Planks', 'Crunches', 'Russian Twists', 'Mountain Climbers', 
                'Bicycle Crunches', 'Leg Raises', 'Side Planks', 'Ab Wheel'
            ],
            'Cardio': [
                'Running', 'Cycling', 'Rowing', 'Jump Rope', 
                'Burpees', 'Mountain Climbers', 'High Knees', 'Jumping Jacks'
            ],
            'Flexibility': [
                'Stretching', 'Yoga', 'Pilates', 'Mobility Work', 
                'Foam Rolling', 'Dynamic Stretching', 'Static Stretching', 'Hip Openers'
            ]
        }

        # Create categories and exercises
        for category_name, exercises in workout_data.items():
            category, created = WorkoutCategory.objects.get_or_create(
                name=category_name
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created category: {category_name}')
                )
            
            for exercise_name in exercises:
                exercise, created = WorkoutExercise.objects.get_or_create(
                    name=exercise_name,
                    category=category,
                    defaults={'description': f'{exercise_name} exercise for {category_name}'}
                )
                
                if created:
                    self.stdout.write(
                        self.style.SUCCESS(f'Created exercise: {exercise_name} in {category_name}')
                    )

        self.stdout.write(
            self.style.SUCCESS('Successfully populated workout categories and exercises')
        ) 