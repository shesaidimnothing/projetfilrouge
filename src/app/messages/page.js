'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import { io } from 'socket.io-client';
import Link from 'next/link';

let socket;

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get('userId');

  useEffect(() => {
    if (!socket && user) {
      socket = io({
        path: '/api/socket',
        addTrailingSlash: false,
      });

      socket.on('connect', () => {
        console.log('Connecté au WebSocket');
        socket.emit('authenticate', user.id);
        socket.emit('getConversations');
      });

      socket.on('conversations', (data) => {
        setConversations(data);
      });

      socket.on('disconnect', () => {
        console.log('Déconnecté du WebSocket');
      });

      socket.on('error', (error) => {
        console.error('Erreur WebSocket:', error);
        setError('Erreur de connexion au serveur de messages');
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [user]);

  useEffect(() => {
    if (socket && selectedUser) {
      socket.emit('getMessages', { otherUserId: selectedUser.userId });

      socket.on('messages', (receivedMessages) => {
        setMessages(receivedMessages);
      });

      socket.on('messageSent', (message) => {
        setMessages(prev => [...prev, message]);
      });

      socket.on('messageReceived', (message) => {
        setMessages(prev => [...prev, message]);
        socket.emit('getConversations');
      });

      socket.on('messagesRead', ({ by }) => {
        if (by === selectedUser.userId) {
          setMessages(prev => 
            prev.map(msg => 
              msg.senderId === user.id ? { ...msg, read: true, status: 'read' } : msg
            )
          );
        }
      });

      socket.emit('markAsRead', { senderId: selectedUser.userId });

      return () => {
        socket.off('messages');
        socket.off('messageSent');
        socket.off('messageReceived');
        socket.off('messagesRead');
      };
    }
  }, [selectedUser, user]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !socket) return;

    socket.emit('sendMessage', {
      content: newMessage,
      receiverId: selectedUser.userId
    });

    setNewMessage('');
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (initialUserId && socket) {
      initializeConversation(initialUserId);
    }
  }, [initialUserId, socket]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.userId);
      const interval = setInterval(() => fetchMessages(selectedUser.userId), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations');
      if (!response.ok) {
        console.error('Réponse non-ok:', response.status);
        setConversations([]);
        setError('Impossible de charger les conversations');
        return;
      }

      const data = await response.json();
      console.log('Données reçues:', data);

      if (data && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
        setError('');
      } else {
        console.error('Format de données invalide:', data);
        setConversations([]);
        setError('Format de données invalide');
      }
    } catch (error) {
      console.error('Erreur complète:', error);
      setConversations([]);
      setError('Impossible de charger les conversations');
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await fetch(`/api/messages/${userId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors du chargement des messages');
      }
      const data = await response.json();
      setMessages(data || []);
      setError('');
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
      setError(error.message);
      setMessages([]);
    }
  };

  const initializeConversation = async (userId) => {
    const existingConv = conversations.find(conv => 
      conv.sender.id === parseInt(userId) || conv.receiver.id === parseInt(userId)
    );
    
    if (existingConv) {
      setSelectedUser({
        userId: parseInt(userId),
        userName: existingConv.sender.id === user.id ? existingConv.receiver.name : existingConv.sender.name
      });
    } else {
      socket.emit('initConversation', { userId: parseInt(userId) });
    }
  };

  if (!user) {
    return (
      <div className="text-center py-10">
        <p>Veuillez vous connecter pour accéder à vos messages</p>
        <Link href="/login" className="text-blue-600 hover:underline">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      
      <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-lg">
        {/* Liste des conversations */}
        <div className="w-1/3 border-r">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Conversations</h2>
          </div>
          <div className="overflow-y-auto h-full">
            {conversations.map((conv) => (
              <div
                key={conv.userId}
                onClick={() => setSelectedUser(conv)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                  selectedUser?.id === conv.userId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="font-medium">{conv.userName}</div>
                {conv.unreadCount > 0 && (
                  <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Zone de messages */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <>
              <div className="p-4 border-b">
                <h3 className="text-lg font-medium">{selectedUser.userName}</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => {
                  console.log('Message:', {
                    messageId: message.id,
                    senderId: message.senderId,
                    currentUserId: user.id,
                    isCurrentUser: message.senderId === parseInt(user.id)
                  });

                  return (
                    <div
                      key={message.id}
                      className={`flex items-end space-x-2 ${
                        message.senderId === parseInt(user.id) ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {/* Avatar et nom pour les messages reçus - à gauche */}
                      {message.senderId !== parseInt(user.id) && (
                        <div className="flex flex-col items-start">
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {message.sender.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">
                            {message.sender.name}
                          </span>
                        </div>
                      )}

                      {/* Le message */}
                      <div
                        className={`max-w-[60%] px-4 py-2 rounded-t-lg ${
                          message.senderId === parseInt(user.id)
                            ? 'bg-blue-500 text-white rounded-l-lg rounded-br-lg'
                            : 'bg-gray-100 text-gray-900 rounded-r-lg rounded-bl-lg'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <div
                          className={`text-xs mt-1 ${
                            message.senderId === parseInt(user.id) ? 'text-blue-100' : 'text-gray-500'
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short'
                          })}
                          {message.senderId === parseInt(user.id) && (
                            <span className="ml-2">
                              {message.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Avatar et nom pour les messages envoyés - à droite */}
                      {message.senderId === parseInt(user.id) && (
                        <div className="flex flex-col items-end">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 mt-1">
                            Vous
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Zone de saisie du message */}
              <form onSubmit={sendMessage} className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écrivez votre message..."
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Envoyer
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Sélectionnez une conversation pour commencer à discuter
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 