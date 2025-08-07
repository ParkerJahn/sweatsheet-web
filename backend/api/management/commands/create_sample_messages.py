from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Conversation, Message, MessageRead
from datetime import datetime, timedelta
import random

class Command(BaseCommand):
    help = 'Create sample conversations and messages for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing conversations and messages before creating sample data',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write(self.style.WARNING('Clearing existing conversations and messages...'))
            Conversation.objects.all().delete()
            Message.objects.all().delete()
            MessageRead.objects.all().delete()
            
        # Get users
        users = list(User.objects.all())
        if len(users) < 2:
            self.stdout.write(
                self.style.ERROR('Need at least 2 users to create conversations. Run create_sample_data first.')
            )
            return

        # Create sample direct conversations
        sample_conversations = []
        
        # Create conversations between different user pairs
        for i in range(min(3, len(users) - 1)):
            user1 = users[i]
            user2 = users[i + 1]
            
            # Create direct conversation
            conversation = Conversation.objects.create(
                conversation_type='DIRECT'
            )
            conversation.participants.add(user1, user2)
            sample_conversations.append((conversation, user1, user2))
            
            self.stdout.write(
                self.style.SUCCESS(f'Created conversation between {user1.username} and {user2.username}')
            )

        # Create a group conversation if we have enough users
        if len(users) >= 3:
            group_conversation = Conversation.objects.create(
                conversation_type='GROUP',
                title='Team Discussion'
            )
            # Add first 3 users to group
            group_conversation.participants.add(*users[:3])
            sample_conversations.append((group_conversation, users[0], users[1], users[2]))
            
            self.stdout.write(
                self.style.SUCCESS(f'Created group conversation: {group_conversation.title}')
            )

        # Create sample messages for each conversation
        sample_messages = [
            "Hey! How's your workout going?",
            "Just finished my morning run. Feeling great!",
            "Did you see the new SweatSheet assignment?",
            "Yes! Looking forward to trying those new exercises.",
            "The deadlifts look challenging 💪",
            "Want to work out together tomorrow?",
            "That sounds great! What time works for you?",
            "How about 7 AM at the gym?",
            "Perfect! See you there 🏋️‍♀️",
            "Great session today! Thanks for the motivation.",
            "Can you check my form on the bench press?",
            "Your form looks good! Just keep your core tight.",
            "Thanks for the feedback!",
            "Don't forget about our team meeting this Friday.",
            "What's the agenda for the meeting?",
            "We'll discuss new training programs and nutrition tips.",
            "Looking forward to it!",
            "How did your competition prep go?",
            "Really well! Thanks for all the support.",
            "You've made amazing progress this year!"
        ]

        for conversation_data in sample_conversations:
            conversation = conversation_data[0]
            participants = conversation_data[1:]
            
            # Create 5-10 messages per conversation
            num_messages = random.randint(5, 10)
            selected_messages = random.sample(sample_messages, num_messages)
            
            for i, message_content in enumerate(selected_messages):
                # Randomly select sender from participants
                sender = random.choice(participants)
                
                # Create message with timestamp spread over last few days
                created_time = datetime.now() - timedelta(
                    days=random.randint(0, 3),
                    hours=random.randint(0, 23),
                    minutes=random.randint(0, 59)
                )
                
                message = Message.objects.create(
                    conversation=conversation,
                    sender=sender,
                    content=message_content,
                    message_type='TEXT'
                )
                
                # Update the created_at time manually
                Message.objects.filter(id=message.id).update(created_at=created_time)
                
                # Randomly mark some messages as read by other participants
                other_participants = [p for p in participants if p != sender]
                for participant in other_participants:
                    if random.choice([True, False]):  # 50% chance to mark as read
                        MessageRead.objects.create(
                            message=message,
                            user=participant
                        )

            # Update conversation timestamp to latest message
            latest_message = conversation.messages.first()
            if latest_message:
                Conversation.objects.filter(id=conversation.id).update(
                    updated_at=latest_message.created_at
                )

            self.stdout.write(
                self.style.SUCCESS(f'Created {num_messages} messages for conversation {conversation.id}')
            )

        self.stdout.write(
            self.style.SUCCESS('Successfully created sample conversations and messages!')
        ) 