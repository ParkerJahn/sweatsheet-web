import ReactGA from 'react-ga4';

// Type definitions
interface UserProperties {
  user_role?: string;
  user_type?: string;
  subscription_tier?: string;
  [key: string]: string | number | boolean | undefined;
}

interface WorkoutData {
  workoutId?: string;
  workoutName?: string;
  workoutType?: string;
  difficulty?: string;
  duration?: number;
  exercisesCount?: number;
  userRole?: string;
  [key: string]: string | number | boolean | undefined;
}

interface SweatSheetData {
  id?: string;
  name?: string;
  creatorRole?: string;
  assignedUsers?: number;
  phasesCount?: number;
  isTemplate?: boolean;
  [key: string]: string | number | boolean | undefined;
}

interface MessageData {
  conversationType?: string;
  participantCount?: number;
  messageLength?: number;
  userRole?: string;
  [key: string]: string | number | boolean | undefined;
}

interface AuthData {
  method?: string;
  userRole?: string;
  source?: string;
  [key: string]: string | number | boolean | undefined;
}

interface TeamData {
  teamSize?: number;
  userRole?: string;
  interactionType?: string;
  [key: string]: string | number | boolean | undefined;
}

interface CustomParameters {
  [key: string]: string | number | boolean | undefined;
}

interface ErrorInfo {
  componentStack?: string;
  errorBoundary?: string;
  [key: string]: string | number | boolean | undefined;
}

interface EngagementDetails {
  timeSpent?: number;
  scrollDepth?: number;
  clickCount?: number;
  [key: string]: string | number | boolean | undefined;
}

interface ConversionData {
  value?: number;
  userRole?: string;
  source?: string;
  [key: string]: string | number | boolean | undefined;
}

interface PurchaseItem {
  itemId: string;
  itemName: string;
  category: string;
  quantity: number;
  price: number;
}

interface TransactionData {
  transactionId: string;
  value: number;
  currency: string;
  items: PurchaseItem[];
}

// Configuration
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';
const isDevelopment = import.meta.env.DEV;

// Initialize Google Analytics
export const initializeGA = (): void => {
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
    console.warn('Google Analytics Measurement ID not configured');
    return;
  }

  ReactGA.initialize(GA_MEASUREMENT_ID, {
    testMode: isDevelopment,
    gaOptions: {
      send_page_view: false, // We'll manually track page views
    }
  });

  console.log('Google Analytics initialized:', GA_MEASUREMENT_ID);
};

// Page tracking
export const trackPageView = (path: string, title?: string): void => {
  if (!isGAEnabled()) return;

  ReactGA.send({
    hitType: 'pageview',
    page: path,
    title: title || document.title,
  });

  console.log('GA Page View:', path);
};

// User identification and properties
export const setUserProperties = (userId: string, properties: UserProperties): void => {
  if (!isGAEnabled()) return;

  ReactGA.set({
    user_id: userId,
    ...properties
  });

  // Set custom user properties
  ReactGA.gtag('config', GA_MEASUREMENT_ID, {
    user_id: userId,
    custom_map: {
      user_role: 'user_role',
      user_type: 'user_type'
    }
  });

  console.log('GA User Properties Set:', { userId, properties });
};

// DRP Workshop Specific Events
export const trackWorkoutEvent = (action: string, workoutData: WorkoutData): void => {
  if (!isGAEnabled()) return;

  ReactGA.event({
    category: 'Workout',
    action: action,
    label: workoutData.workoutName || 'Unknown Workout',
    value: workoutData.duration || 0,
  });

  // Send additional data through gtag
  ReactGA.gtag('event', action, {
    event_category: 'Workout',
    event_label: workoutData.workoutName || 'Unknown Workout',
    value: workoutData.duration || 0,
    workout_id: workoutData.workoutId,
    workout_type: workoutData.workoutType,
    difficulty_level: workoutData.difficulty,
    exercises_count: workoutData.exercisesCount,
    user_role: workoutData.userRole
  });

  console.log('GA Workout Event:', action, workoutData);
};

export const trackSweatSheetEvent = (action: string, sweatSheetData: SweatSheetData): void => {
  if (!isGAEnabled()) return;

  ReactGA.event({
    category: 'SweatSheet',
    action: action,
    label: sweatSheetData.name || 'Unknown SweatSheet',
  });

  ReactGA.gtag('event', action, {
    event_category: 'SweatSheet',
    event_label: sweatSheetData.name || 'Unknown SweatSheet',
    sweatsheet_id: sweatSheetData.id,
    creator_role: sweatSheetData.creatorRole,
    assigned_users: sweatSheetData.assignedUsers || 0,
    phases_count: sweatSheetData.phasesCount || 0,
    is_template: sweatSheetData.isTemplate || false
  });

  console.log('GA SweatSheet Event:', action, sweatSheetData);
};

export const trackMessagingEvent = (action: string, messageData: MessageData): void => {
  if (!isGAEnabled()) return;

  ReactGA.event({
    category: 'Messaging',
    action: action,
    label: messageData.conversationType || 'Unknown',
  });

  ReactGA.gtag('event', action, {
    event_category: 'Messaging',
    event_label: messageData.conversationType || 'Unknown',
    conversation_type: messageData.conversationType,
    participant_count: messageData.participantCount || 2,
    message_length: messageData.messageLength || 0,
    user_role: messageData.userRole
  });

  console.log('GA Messaging Event:', action, messageData);
};

export const trackAuthEvent = (action: string, authData: AuthData): void => {
  if (!isGAEnabled()) return;

  ReactGA.event({
    category: 'Authentication',
    action: action,
    label: authData.method || 'Email',
  });

  ReactGA.gtag('event', action, {
    event_category: 'Authentication',
    event_label: authData.method || 'Email',
    auth_method: authData.method || 'email',
    user_role: authData.userRole,
    registration_source: authData.source || 'direct'
  });

  console.log('GA Auth Event:', action, authData);
};

export const trackTeamEvent = (action: string, teamData: TeamData): void => {
  if (!isGAEnabled()) return;

  ReactGA.event({
    category: 'Team',
    action: action,
    label: teamData.teamSize?.toString() || 'Unknown',
  });

  ReactGA.gtag('event', action, {
    event_category: 'Team',
    event_label: teamData.teamSize?.toString() || 'Unknown',
    team_size: teamData.teamSize || 0,
    user_role: teamData.userRole,
    interaction_type: teamData.interactionType
  });

  console.log('GA Team Event:', action, teamData);
};

// General event tracking
export const trackEvent = (
  category: string, 
  action: string, 
  label?: string, 
  value?: number,
  customParameters?: CustomParameters
): void => {
  if (!isGAEnabled()) return;

  ReactGA.event({
    category,
    action,
    label,
    value,
  });

  if (customParameters && Object.keys(customParameters).length > 0) {
    ReactGA.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...customParameters
    });
  }

  console.log('GA Event:', { category, action, label, value, customParameters });
};

// Performance tracking
export const trackTiming = (category: string, variable: string, value: number, label?: string): void => {
  if (!isGAEnabled()) return;

  ReactGA.event({
    category: 'Performance',
    action: 'timing',
    label: `${category}_${variable}`,
    value: Math.round(value),
  });

  ReactGA.gtag('event', 'timing_complete', {
    name: variable,
    value: Math.round(value),
    event_category: category,
    event_label: label
  });

  console.log('GA Timing:', { category, variable, value, label });
};

// Error tracking
export const trackError = (error: Error, errorInfo?: ErrorInfo): void => {
  if (!isGAEnabled()) return;

  ReactGA.event({
    category: 'Error',
    action: 'javascript_error',
    label: error.message,
  });

  ReactGA.gtag('event', 'exception', {
    description: error.message,
    fatal: false,
    error_name: error.name,
    page_url: window.location.href,
    user_agent: navigator.userAgent
  });

  console.log('GA Error:', error, errorInfo);
};

// E-commerce tracking (for future premium features)
export const trackPurchase = (transactionData: TransactionData): void => {
  if (!isGAEnabled()) return;

  ReactGA.event('purchase', {
    transaction_id: transactionData.transactionId,
    value: transactionData.value,
    currency: transactionData.currency,
    items: transactionData.items
  });

  console.log('GA Purchase:', transactionData);
};

// User engagement tracking
export const trackEngagement = (engagementType: string, details: EngagementDetails): void => {
  if (!isGAEnabled()) return;

  ReactGA.event({
    category: 'Engagement',
    action: engagementType,
  });

  ReactGA.gtag('event', engagementType, {
    event_category: 'Engagement',
    engagement_time_msec: details.timeSpent || 0,
    page_location: window.location.href,
    page_title: document.title,
    ...details
  });

  console.log('GA Engagement:', engagementType, details);
};

// Conversion tracking
export const trackConversion = (conversionType: string, conversionData: ConversionData): void => {
  if (!isGAEnabled()) return;

  ReactGA.event({
    category: 'Conversion',
    action: conversionType,
    value: conversionData.value || 0,
  });

  ReactGA.gtag('event', 'conversion', {
    event_category: 'Conversion',
    conversion_type: conversionType,
    conversion_value: conversionData.value || 0,
    user_role: conversionData.userRole,
    conversion_source: conversionData.source || 'organic'
  });

  console.log('GA Conversion:', conversionType, conversionData);
};

// Helper functions
const isGAEnabled = (): boolean => {
  return !isDevelopment && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX';
};

// Export all tracking functions
export const analytics = {
  initialize: initializeGA,
  pageView: trackPageView,
  setUserProperties,
  
  // DRP Workshop specific
  workout: trackWorkoutEvent,
  sweatSheet: trackSweatSheetEvent,
  messaging: trackMessagingEvent,
  auth: trackAuthEvent,
  team: trackTeamEvent,
  
  // General
  event: trackEvent,
  timing: trackTiming,
  error: trackError,
  engagement: trackEngagement,
  conversion: trackConversion,
  purchase: trackPurchase
};

export default analytics; 