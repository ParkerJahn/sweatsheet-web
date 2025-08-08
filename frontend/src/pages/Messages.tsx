import { useState, useEffect } from 'react';
import { Send, MessageCircle, User, Plus, X } from 'lucide-react';
import api from '../api';
import LoadingIndicator from '../components/LoadingIndicator';
import analytics from '../services/analytics';

interface Message {
  id: number;
  sender: number;
  sender_name: string;
  content: string;
  created_at: string;
  message_type: string;
}

interface Conversation {
  id: number;
  title: string;
  participants: Array<{
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  }>;
  last_message: Message | null;
  conversation_type: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // New conversation state
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [creatingConversation, setCreatingConversation] = useState(false);

  useEffect(() => {
    console.log('Messages component mounted');
    
    // Track page view for messaging (with error handling)
    try {
      analytics.pageView('/messages', 'Messages - DRP Workshop');
      
      // Track messaging engagement
      analytics.messaging('page_visit', {
        conversationType: 'page_load',
        userRole: getCurrentUserRole()
      });
    } catch (analyticsError) {
      console.warn('Analytics error (non-blocking):', analyticsError);
    }

    loadConversations();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      console.log('Fetching current user...');
      const response = await api.get('/api/profile/');
      console.log('Current user response:', response.data);
      setCurrentUserId(response.data.id);
    } catch (error) {
      console.error('Error fetching current user:', error);
      setError('Failed to load user profile. Please try logging in again.');
    }
  };

  const getCurrentUserRole = () => {
    try {
      const userProfile = localStorage.getItem('user_profile');
      return userProfile ? JSON.parse(userProfile).role || 'ATHLETE' : 'ATHLETE';
    } catch (error) {
      console.warn('Error parsing user profile:', error);
      return 'ATHLETE';
    }
  };

  const loadConversations = async () => {
    try {
      console.log('Loading conversations...');
      const response = await api.get('/api/conversations/');
      console.log('Conversations response:', response.data);
      setConversations(response.data);
      
      // Track conversation load (with error handling)
      try {
        analytics.messaging('conversations_loaded', {
          conversationType: 'list',
          participantCount: response.data.length,
          userRole: getCurrentUserRole()
        });
      } catch (analyticsError) {
        console.warn('Analytics error (non-blocking):', analyticsError);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations. Please check your connection and try again.');
      try {
        analytics.error(error as Error, { context: 'load_conversations' });
      } catch (analyticsError) {
        console.warn('Analytics error (non-blocking):', analyticsError);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      console.log('Loading available users...');
      const response = await api.get('/api/users/');
      console.log('Users response:', response.data);
      // Filter out current user
      const filteredUsers = response.data.filter((user: User) => user.id !== currentUserId);
      setAvailableUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading available users:', error);
      setError('Failed to load users. Please try again.');
    }
  };

  const createNewConversation = async () => {
    if (!selectedUser) return;

    setCreatingConversation(true);
    try {
      console.log('Creating conversation with user:', selectedUser);
      const response = await api.post('/api/conversations/direct/', {
        user_id: selectedUser
      });

      console.log('New conversation response:', response.data);

      // Add the new conversation to the list
      setConversations(prev => [response.data, ...prev]);
      
      // Select the new conversation
      setSelectedConversation(response.data);
      setMessages([]);

      // Track conversation creation (with error handling)
      try {
        analytics.messaging('conversation_created', {
          conversationType: 'DIRECT',
          participantCount: 2,
          userRole: getCurrentUserRole()
        });
      } catch (analyticsError) {
        console.warn('Analytics error (non-blocking):', analyticsError);
      }

      setShowNewChatModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError('Failed to create conversation. Please try again.');
      try {
        analytics.error(error as Error, { context: 'create_conversation' });
      } catch (analyticsError) {
        console.warn('Analytics error (non-blocking):', analyticsError);
      }
    } finally {
      setCreatingConversation(false);
    }
  };

  const openNewChatModal = () => {
    setShowNewChatModal(true);
    loadAvailableUsers();
  };

  const loadConversationDetail = async (conversation: Conversation) => {
    try {
      setLoading(true);
      console.log('Loading conversation detail:', conversation.id);
      
      // Track conversation selection (with error handling)
      try {
        analytics.messaging('conversation_selected', {
          conversationType: conversation.conversation_type,
          participantCount: conversation.participants.length,
          userRole: getCurrentUserRole()
        });
      } catch (analyticsError) {
        console.warn('Analytics error (non-blocking):', analyticsError);
      }

      const response = await api.get(`/api/conversations/${conversation.id}/messages/`);
      console.log('Messages response:', response.data);
      setMessages(response.data);
      setSelectedConversation(conversation);

      // Track message load performance (with error handling)
      try {
        const messageLoadTime = performance.now();
        analytics.timing('Messaging', 'message_load', messageLoadTime);
      } catch (analyticsError) {
        console.warn('Analytics error (non-blocking):', analyticsError);
      }

    } catch (error) {
      console.error('Error loading conversation details:', error);
      setError('Failed to load conversation. Please try again.');
      try {
        analytics.error(error as Error, { 
          context: 'load_conversation_detail',
          conversation_id: conversation.id.toString()
        });
      } catch (analyticsError) {
        console.warn('Analytics error (non-blocking):', analyticsError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    const messageContent = newMessage.trim();
    
    // Track message send attempt (with error handling)
    try {
      analytics.messaging('message_send_attempt', {
        conversationType: selectedConversation.conversation_type,
        messageLength: messageContent.length,
        participantCount: selectedConversation.participants.length,
        userRole: getCurrentUserRole()
      });
    } catch (analyticsError) {
      console.warn('Analytics error (non-blocking):', analyticsError);
    }

    try {
      console.log('Sending message:', messageContent);
      const response = await api.post(`/api/conversations/${selectedConversation.id}/messages/`, {
        content: messageContent
      });

      console.log('Message sent response:', response.data);

      // Add the new message to the current messages
      setMessages(prevMessages => [...prevMessages, response.data]);
      setNewMessage('');

      // Track successful message send (with error handling)
      try {
        analytics.messaging('message_sent', {
          conversationType: selectedConversation.conversation_type,
          messageLength: messageContent.length,
          participantCount: selectedConversation.participants.length,
          userRole: getCurrentUserRole()
        });

        // Track engagement
        analytics.engagement('message_interaction', {
          timeSpent: 0,
          message_length: messageContent.length,
          conversation_type: selectedConversation.conversation_type
        });
      } catch (analyticsError) {
        console.warn('Analytics error (non-blocking):', analyticsError);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      // Track message send failure (with error handling)
      try {
        analytics.messaging('message_send_failure', {
          conversationType: selectedConversation.conversation_type,
          messageLength: messageContent.length,
          userRole: getCurrentUserRole()
        });

        analytics.error(error as Error, { 
          context: 'send_message',
          conversation_id: selectedConversation.id.toString()
        });
      } catch (analyticsError) {
        console.warn('Analytics error (non-blocking):', analyticsError);
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      console.warn('Error formatting timestamp:', error);
      return 'Unknown';
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) return conversation.title;
    
    const otherParticipants = conversation.participants.filter(p => p.id !== currentUserId);
    if (otherParticipants.length === 1) {
      const participant = otherParticipants[0];
      return `${participant.first_name} ${participant.last_name}`.trim() || participant.username;
    }
    
    return `Group Chat (${conversation.participants.length} members)`;
  };

  const getSenderDisplayName = (message: Message) => {
    return message.sender_name || 'Unknown User';
  };

  // Show error message if there's an error
  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadConversations();
              getCurrentUser();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading && conversations.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '80vh' }}>
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <MessageCircle className="mr-2" size={24} />
                Messages
              </h2>
              <button
                onClick={openNewChatModal}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                title="Start new conversation"
              >
                <Plus size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Start a conversation with your team members!</p>
                  <button
                    onClick={openNewChatModal}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Start New Chat
                  </button>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      loadConversationDetail(conversation);
                      // Track conversation click (with error handling)
                      try {
                        analytics.event('Navigation', 'click', 'conversation_item', 1, {
                          conversation_type: conversation.conversation_type,
                          participant_count: conversation.participants.length
                        });
                      } catch (analyticsError) {
                        console.warn('Analytics error (non-blocking):', analyticsError);
                      }
                    }}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User size={20} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {getConversationTitle(conversation)}
                        </h3>
                        {conversation.last_message && (
                          <p className="text-sm text-gray-600 truncate">
                            {conversation.last_message.content}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {formatTimestamp(conversation.updated_at)}
                        </p>
                      </div>
                      {conversation.unread_count > 0 && (
                        <div className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conversation.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {getConversationTitle(selectedConversation)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedConversation.participants.length} participant{selectedConversation.participants.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loading ? (
                    <div className="flex justify-center items-center h-full">
                      <LoadingIndicator />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>No messages in this conversation</p>
                        <p className="text-sm">Send the first message!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === currentUserId ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender === currentUserId
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-800'
                          }`}
                        >
                          {message.sender !== currentUserId && (
                            <p className="text-xs font-medium mb-1 opacity-75">
                              {getSenderDisplayName(message)}
                            </p>
                          )}
                          <p>{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender === currentUserId ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTimestamp(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={sendingMessage}
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !newMessage.trim()}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingMessage ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Send size={20} />
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <MessageCircle size={64} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p>Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Start New Chat</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-4">Select a user to start a conversation with:</p>
              {availableUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user.id)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedUser === user.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex space-x-2 mt-6">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={createNewConversation}
                disabled={!selectedUser || creatingConversation}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingConversation ? 'Creating...' : 'Start Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Messages; 