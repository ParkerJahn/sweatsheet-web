import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Plus, X } from 'lucide-react';
import './Availability.css'; 

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
  const [events, setEvents] = useState<EventsMap>({
    '2025-08-05': [
      { id: 1, time: '09:00', title: 'Team Meeting', type: 'meeting', duration: 60 },
      { id: 2, time: '14:00', title: 'Available for calls', type: 'availability', duration: 120 }
    ],
    '2025-08-07': [
      { id: 3, time: '10:00', title: 'Client Call', type: 'meeting', duration: 30 },
      { id: 4, time: '15:00', title: 'Open for consultations', type: 'availability', duration: 90 }
    ],
    '2025-08-12': [
      { id: 5, time: '11:00', title: 'Project Review', type: 'meeting', duration: 45 }
    ]
  });
  const [newEvent, setNewEvent] = useState<NewEvent>({
    time: '',
    title: '',
    type: 'availability',
    duration: 60
  });

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
    if (!selectedDate || !newEvent.time || !newEvent.title) return;
    
    const eventId: number = Date.now();
    const dateEvents: Event[] = events[selectedDate] || [];
    const updatedEvents: Event[] = [...dateEvents, { ...newEvent, id: eventId }];
    
    setEvents({
      ...events,
      [selectedDate]: updatedEvents.sort((a, b) => a.time.localeCompare(b.time))
    });
    
    setNewEvent({ time: '', title: '', type: 'availability', duration: 60 });
  };

  const deleteEvent = (eventId: number): void => {
    if (!selectedDate) return;
    
    const dateEvents: Event[] = events[selectedDate] || [];
    const updatedEvents: Event[] = dateEvents.filter(event => event.id !== eventId);
    
    if (updatedEvents.length === 0) {
      const remainingEvents = Object.fromEntries(
        Object.entries(events).filter(([key]) => key !== selectedDate)
      );      
      setEvents(remainingEvents);
    } else {
      setEvents({
        ...events,
        [selectedDate]: updatedEvents
      });
    }
  };

  const getEventTypes = (day: number | null): string[] => {
    if (!day) return [];
    const dateStr: string = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayEvents: Event[] = events[dateStr] || [];
    const types: string[] = [...new Set(dayEvents.map(event => event.type))];
    return types;
  };

  const days: (number | null)[] = getDaysInMonth(currentDate);

  return (
    <div className="mt-10 max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          📅 Availability Calendar
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map((day: string) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day: number | null, index: number) => {
              const isSelected: boolean = day !== null && selectedDate === formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
              const eventTypes: string[] = getEventTypes(day);
              
              return (
                <button
                  key={index}
                  onClick={() => selectDate(day)}
                  disabled={!day}
                  className={`
                    p-2 h-12 text-sm rounded-lg transition-all relative
                    ${!day ? 'invisible' : ''}
                    ${isSelected 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                    }
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

          <div className="mt-4 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Availability</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Meeting</span>
            </div>
          </div>
        </div>

        {/* Time Slots & Events */}
        <div className="bg-gray-50 rounded-lg p-4">
          {showTimeSlots && selectedDate ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
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
                        ? 'bg-red-50 border-red-500'
                        : 'bg-green-50 border-green-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-800">{event.title}</div>
                        <div className="text-sm text-gray-600">
                          {event.time} ({event.duration} min)
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                )) || (
                  <div className="text-gray-500 text-center py-8">
                    No events scheduled for this day
                  </div>
                )}
              </div>

              {/* Add New Event */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Time Slot
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="Time"
                      value={newEvent.time}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setNewEvent({...newEvent, time: e.target.value})
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        setNewEvent({...newEvent, title: e.target.value})
                      }
                      placeholder="Meeting title or availability note"
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={newEvent.type}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                          setNewEvent({...newEvent, type: e.target.value as 'meeting' | 'availability'})
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                          <option value="availability">Availability</option>
                        <option value="meeting">Meeting</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <button
                    onClick={addEvent}
                    disabled={!newEvent.time || !newEvent.title}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Add Event
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
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