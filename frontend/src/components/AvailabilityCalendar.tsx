import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, Plus, X } from 'lucide-react';
import api from '../api';
import LoadingIndicator from './LoadingIndicator';

// Type definitions
interface Event {
  id: number;
  time: string;
  title: string;
  type: 'meeting' | 'availability';
  duration: number;
}

interface EventsMap {
  [date: string]: Event[];
}

interface NewEvent {
  time: string;
  title: string;
  type: 'meeting' | 'availability';
  duration: number;
}

const AvailabilityCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showTimeSlots, setShowTimeSlots] = useState<boolean>(false);
  const [events, setEvents] = useState<EventsMap>({});
  const [loading, setLoading] = useState(false);
  const [newEvent, setNewEvent] = useState<NewEvent>({
    time: '',
    title: '',
    type: 'availability',
    duration: 60
  });

  useEffect(() => {
    setLoading(true);
    api.get('/api/calendar/')
      .then(res => {
        setEvents(res.data.events);
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const months: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date: Date): (number | null)[] => {
    const year: number = date.getFullYear();
    const month: number = date.getMonth();
    const firstDay: Date = new Date(year, month, 1);
    const lastDay: Date = new Date(year, month + 1, 0);
    const daysInMonth: number = lastDay.getDate();
    const startingDayOfWeek: number = firstDay.getDay();

    const days: (number | null)[] = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const formatDate = (year: number, month: number, day: number): string => {
    const date: Date = new Date(year, month, day);
    return date.toISOString().split('T')[0];
  };

  const navigateMonth = (direction: number): void => {
    const newDate: Date = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
    setShowTimeSlots(false);
  };

  const selectDate = (day: number | null): void => {
    if (!day) return;
    const dateStr: string = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(dateStr);
    setShowTimeSlots(true);
  };

  const addEvent = (): void => {
    if (!selectedDate || !newEvent.time || !newEvent.title.trim()) return;
    
    const eventId: number = Date.now();
    const dateEvents: Event[] = events[selectedDate] || [];
    const updatedEvents: Event[] = [...dateEvents, { ...newEvent, id: eventId }];
    
    const newEvents = {
      ...events,
      [selectedDate]: updatedEvents.sort((a, b) => a.time.localeCompare(b.time))
    };

    setLoading(true);
    api.put('/api/calendar/', { events: newEvents })
      .then(res => {
        setEvents(res.data.events);
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
    
    setNewEvent({ time: '', title: '', type: 'availability', duration: 60 });
  };

  const deleteEvent = (eventId: number): void => {
    if (!selectedDate) return;
    
    const dateEvents: Event[] = events[selectedDate] || [];
    const updatedEvents: Event[] = dateEvents.filter(event => event.id !== eventId);
    
    const newEvents = {
      ...events,
      [selectedDate]: updatedEvents
    };

    if (updatedEvents.length === 0) {
      delete newEvents[selectedDate];
    }

    setLoading(true);
    api.put('/api/calendar/', { events: newEvents })
      .then(res => {
        setEvents(res.data.events);
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const getEventTypes = (day: number | null): string[] => {
    if (!day) return [];
    const dateStr: string = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayEvents: Event[] = events[dateStr] || [];
    const types: string[] = [...new Set(dayEvents.map(event => event.type))];
    return types;
  };

  const days: (number | null)[] = getDaysInMonth(currentDate);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-200 dark:bg-neutral-800">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="mt-10 max-w-4xl mx-auto p-6 bg-white dark:bg-neutral-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          📅 Availability Calendar
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="bg-gray-50 dark:bg-neutral-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-full transition-colors text-gray-700 dark:text-gray-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-full transition-colors text-gray-700 dark:text-gray-300"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map((day: string) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day: number | null, index: number) => {
              const eventTypes: string[] = getEventTypes(day);
              const isToday: boolean = day !== null && 
                new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
              const isSelected: boolean = day !== null && 
                selectedDate === formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);

              return (
                <button
                  key={index}
                  onClick={() => selectDate(day)}
                  disabled={day === null}
                  className={`
                    relative p-3 text-center text-sm transition-colors rounded-lg
                    ${day === null 
                      ? 'invisible' 
                      : 'hover:bg-gray-200 dark:hover:bg-neutral-600 text-gray-800 dark:text-white'
                    }
                    ${isToday ? 'bg-blue-100 dark:bg-blue-900 border-2 border-blue-500' : ''}
                    ${isSelected ? 'bg-blue-200 dark:bg-blue-800' : ''}
                  `}
                >
                  {day}
                  {eventTypes.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1">
                      {eventTypes.includes('meeting') && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                      {eventTypes.includes('availability') && (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots Panel */}
        <div className="bg-gray-50 dark:bg-neutral-700 rounded-lg p-4">
          {showTimeSlots && selectedDate ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
              </div>

              <div className="space-y-3 mb-6">
                {selectedDate && events[selectedDate]?.map((event: Event) => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg border-l-4 flex items-center justify-between ${
                      event.type === 'meeting'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                        : 'bg-green-50 dark:bg-green-900/20 border-green-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <div>
                        <div className="font-medium text-gray-800 dark:text-white">{event.title}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {event.time} ({event.duration} min)
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-600 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                )) || (
                  <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                    No events scheduled for this day
                  </div>
                )}
              </div>

              {/* Add New Event */}
              <div className="border-t border-gray-200 dark:border-neutral-600 pt-4">
                <h4 className="font-medium text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Time Slot
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={newEvent.time}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setNewEvent({...newEvent, time: e.target.value})
                      }
                      className="w-full p-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-neutral-600 text-gray-900 dark:text-white"
                      placeholder="HH:MM"
                      step="900"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Use 24-hour format (e.g., 14:30 for 2:30 PM)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setNewEvent({...newEvent, title: e.target.value})
                      }
                      placeholder="Meeting title or availability note"
                      className="w-full p-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-neutral-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type
                      </label>
                      <select
                        value={newEvent.type}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                          setNewEvent({...newEvent, type: e.target.value as 'meeting' | 'availability'})
                        }
                        className="w-full p-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-neutral-600 text-gray-900 dark:text-white"
                      >
                          <option value="availability">Availability</option>
                        <option value="meeting">Meeting</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Duration (min)
                      </label>
                      <input
                        type="number"
                        value={newEvent.duration}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          setNewEvent({...newEvent, duration: parseInt(e.target.value) || 60})
                        }
                        min="15"
                        step="15"
                        className="w-full p-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-neutral-600 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <button
                    onClick={addEvent}
                    disabled={!newEvent.time || !newEvent.title.trim()}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-neutral-600 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Event
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              📅
              <p className="mt-4">Select a date to view and manage your availability</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;