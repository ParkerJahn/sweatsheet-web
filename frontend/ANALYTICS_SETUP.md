# Google Analytics Setup Guide for DRP Workshop

## 🎯 Overview

Google Analytics 4 (GA4) has been integrated into your DRP Workshop application to track user behavior, engagement, and key fitness coaching metrics.

## 🔧 Setup Instructions

### 1. Create Google Analytics Account

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click "Start measuring"
4. Create an account for "DRP Workshop"
5. Set up a property:
   - Property name: "DRP Workshop"
   - Time zone: Your local timezone
   - Currency: Your local currency

### 2. Create Web Data Stream

1. In your GA4 property, go to "Data Streams"
2. Click "Add stream" → "Web"
3. Enter your website URL: `https://yourdomain.com` (or `http://localhost:5173` for development)
4. Stream name: "DRP Workshop Web"
5. **Copy the Measurement ID** (format: G-XXXXXXXXXX)

### 3. Configure Environment Variables

Create a `.env.local` file in your `/frontend` directory:

```env
# Google Analytics Configuration
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # Replace with your actual Measurement ID

# API Configuration  
VITE_API_URL=http://127.0.0.1:8000

# Environment
VITE_NODE_ENV=development
```

### 4. Verify Installation

1. Start your development server: `npm run dev`
2. Open browser developer tools → Network tab
3. Look for requests to `google-analytics.com` or `gtag`
4. Check console for "Google Analytics initialized" message

## 📊 Analytics Events Being Tracked

### 🔐 Authentication Events
- `registration_attempt` - User starts registration
- `registration_success` - Successful account creation
- `registration_failure` - Registration fails
- `login_attempt` - User attempts login
- `login_success` - Successful authentication
- `login_failure` - Login fails

### 💪 Workout Events
- `workout_created` - New workout created
- `workout_started` - User begins workout
- `workout_completed` - Workout finished
- `exercise_completed` - Individual exercise completed

### 📋 SweatSheet Events
- `sweatsheet_created` - New SweatSheet created
- `sweatsheet_assigned` - SweatSheet assigned to user
- `sweatsheet_completed` - SweatSheet finished
- `template_used` - Template SweatSheet utilized

### 💬 Messaging Events
- `message_sent` - Message sent successfully
- `conversation_started` - New conversation created
- `conversation_selected` - User opens conversation

### 👥 Team Events
- `team_member_added` - New team member
- `profile_updated` - User updates profile
- `team_viewed` - Team page accessed

### 🧭 Navigation Events
- Page views for all routes
- Button clicks and interactions
- Feature usage tracking

### ⚡ Performance Events
- Page load times
- API response times
- App initialization time

### 🚨 Error Tracking
- JavaScript errors
- API failures
- Authentication issues

## 🎨 Custom Dimensions Available

### User Properties
- `user_role` - ATHLETE, PRO, SWEAT_TEAM_MEMBER
- `user_type` - authenticated, anonymous
- `subscription_tier` - premium, free

### Event Parameters
- `workout_type` - Strength, Cardio, etc.
- `difficulty_level` - Beginner, Intermediate, Advanced
- `conversation_type` - DIRECT, GROUP
- `participant_count` - Number of conversation participants
- `message_length` - Character count of messages

## 📈 Key Metrics to Monitor

### 🔍 User Acquisition
- Registration conversion rate
- Traffic sources
- User demographics

### 💍 User Engagement
- Session duration
- Pages per session
- Feature adoption rates
- Message frequency

### 🎯 Fitness Goals
- Workout completion rates
- SweatSheet usage
- Exercise progression
- User retention

### 💰 Business Metrics
- Pro account conversions
- Feature usage by role
- Team growth metrics

## 🛠️ Development vs Production

### Development Mode
- Events logged to console
- Test mode enabled
- Debug information shown

### Production Mode
- Full analytics tracking
- Real-time data collection
- Performance monitoring

## 📋 Testing Your Setup

### 1. Real-time Reports
1. Go to GA4 → Reports → Realtime
2. Navigate through your app
3. Verify events appear in real-time

### 2. Debug View
1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension
2. Enable debug mode
3. Check console for detailed event information

### 3. Event Verification
Test these key user flows:
- [ ] User registration
- [ ] User login
- [ ] Create new workout
- [ ] Send message
- [ ] Complete exercise
- [ ] Navigate between pages

## 🚀 Advanced Features

### Enhanced E-commerce
Ready for when you add premium features:
```javascript
analytics.purchase({
  transactionId: 'pro-subscription-123',
  value: 29.99,
  currency: 'USD',
  items: [{
    itemId: 'pro-monthly',
    itemName: 'SweatPro Monthly Subscription',
    category: 'Subscription',
    quantity: 1,
    price: 29.99
  }]
});
```

### Custom Conversions
Track fitness milestones:
```javascript
analytics.conversion('fitness_milestone', {
  value: 1,
  userRole: 'ATHLETE',
  milestone_type: 'first_workout_completed'
});
```

## 🔒 Privacy Compliance

Your implementation includes:
- ✅ No tracking in development mode
- ✅ User consent respect
- ✅ Error data sanitization
- ✅ No PII in events

## 📞 Support

If you need help:
1. Check GA4 Real-time reports
2. Look for console errors
3. Verify your Measurement ID
4. Test in incognito mode

## 📚 Resources

- [GA4 Documentation](https://support.google.com/analytics/answer/9304153)
- [React GA4 Library](https://github.com/PROxZIMA/react-ga4)
- [GA4 Event Reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)

---

**🎉 Your DRP Workshop app is now fully instrumented with Google Analytics!**

Track your fitness coaching success with detailed user behavior insights. 