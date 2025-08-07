import { useState, useEffect } from 'react';
import { Send, MessageCircle, User } from 'lucide-react';
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

function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    // Track page view for messaging
    analytics.pageView('/messages', 'Messages - DRP Workshop');
    
    // Track messaging engagement
    analytics.messaging('page_visit', {
      conversationType: 'page_load',
      userRole: getCurrentUserRole()
    });

    loadConversations();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const response = await api.get('/api/user/profile/');
      setCurrentUserId(response.data.id);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const getCurrentUserRole = () => {
    const userProfile = localStorage.getItem('user_profile');
    return userProfile ? JSON.parse(userProfile).role || 'ATHLETE' : 'ATHLETE';
  };

  const loadConversations = async () => {
    try {
      const response = await api.get('/api/conversations/');
      setConversations(response.data);
      
      // Track conversation load
      analytics.messaging('conversations_loaded', {
        conversationType: 'list',
        participantCount: response.data.length,
        userRole: getCurrentUserRole()
      });
    } catch (error) {
      console.error('Error loading conversations:', error);
      analytics.error(error as Error, { context: 'load_conversations' });
    } finally {
      setLoading(false);
    }
  };

  const loadConversationDetail = async (conversation: Conversation) => {
    try {
      setLoading(true);
      
      // Track conversation selection
      analytics.messaging('conversation_selected', {
        conversationType: conversation.conversation_type,
        participantCount: conversation.participants.length,
        userRole: getCurrentUserRole()
      });

      const response = await api.get(`/api/conversations/${conversation.id}/messages/`);
      setMessages(response.data);
      setSelectedConversation(conversation);

      // Track message load performance
      const messageLoadTime = performance.now();
      analytics.timing('Messaging', 'message_load', messageLoadTime);

    } catch (error) {
      console.error('Error loading conversation details:', error);
      analytics.error(error as Error, { 
        context: 'load_conversation_detail',
        conversation_id: conversation.id.toString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return;

    setSendingMessage(true);
    const messageContent = newMessage.trim();
    
    // Track message send attempt
    analytics.messaging('message_send_attempt', {
      conversationType: selectedConversation.conversation_type,
      messageLength: messageContent.length,
      participantCount: selectedConversation.participants.length,
      userRole: getCurrentUserRole()
    });

    try {
      const response = await api.post(`/api/conversations/${selectedConversation.id}/messages/`, {
        content: messageContent
      });

      // Add the new message to the current messages
      setMessages(prevMessages => [...prevMessages, response.data]);
      setNewMessage('');

      // Track successful message send
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

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Track message send failure
      analytics.messaging('message_send_failure', {
        conversationType: selectedConversation.conversation_type,
        messageLength: messageContent.length,
        userRole: getCurrentUserRole()
      });

      analytics.error(error as Error, { 
        context: 'send_message',
        conversation_id: selectedConversation.id.toString()
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
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
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <MessageCircle className="mr-2" size={24} />
                Messages
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No conversations yet</p>
                  <p className="text-sm">Start a conversation with your team members!</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      loadConversationDetail(conversation);
                      // Track conversation click
                      analytics.event('Navigation', 'click', 'conversation_item', 1, {
                        conversation_type: conversation.conversation_type,
                        participant_count: conversation.participants.length
                      });
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
    </div>
  );
}

export default Messages; 