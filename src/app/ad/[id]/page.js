'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { io } from 'socket.io-client';
import Link from 'next/link';

let socket;

export default function AdDetails() {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const params = useParams();

  useEffect(() => {
    const initSocket = async () => {
      socket = io(undefined, {
        path: '/api/socketio',
        transports: ['websocket'],
        upgrade: false
      });

      socket.on('connect', () => {
        console.log('Connected to WebSocket');
        if (user) {
          socket.emit('authenticate', user.id);
        }
        socket.emit('getAd', { adId: params.id });
      });

      socket.on('adDetails', (adData) => {
        console.log('Received ad details:', adData);
        setAd(adData);
        setLoading(false);
      });

      socket.on('messageSent', () => {
        setShowContactForm(false);
        setMessage('');
      });

      socket.on('error', (error) => {
        console.error('Erreur WebSocket:', error);
        setError(error.message);
        setLoading(false);
      });
    };

    initSocket();

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [params.id, user]);

  const handleMessageSubmit = (e) => {
    e.preventDefault();
    if (!user || !message.trim() || !ad) return;

    socket.emit('sendMessage', {
      content: `[Re: ${ad.title}]\n\n${message}`,
      receiverId: ad.userId
    });
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!ad) return <div className="text-center py-10">Annonce non trouvée</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Image de l'annonce */}
        {ad.imageUrl && (
          <div className="w-full h-96 relative">
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">{ad.title}</h1>
            <span className="text-2xl font-bold">{ad.price.toFixed(2)} €</span>
          </div>
          
          <Link 
            href={`/category/${ad.category}`}
            className="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm mb-4 hover:bg-gray-200"
          >
            {ad.category}
          </Link>

          <p className="text-gray-700 mt-4 whitespace-pre-wrap">{ad.description}</p>

          <div className="mt-6 pt-6 border-t">
            <p className="text-gray-600">
              Publié par {ad.user.name}
            </p>
            <p className="text-gray-500 text-sm">
              {new Date(ad.createdAt).toLocaleDateString()}
            </p>
          </div>

          {user && user.id !== ad.userId && (
            <div className="mt-6">
              {!showContactForm ? (
                <button
                  onClick={() => setShowContactForm(true)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Contacter le vendeur
                </button>
              ) : (
                <form onSubmit={handleMessageSubmit} className="mt-4">
                  <div className="mb-4">
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Votre message à propos de "{ad.title}"
                    </label>
                    <textarea
                      id="message"
                      rows="4"
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Décrivez votre intérêt pour cette annonce..."
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowContactForm(false)}
                      className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Envoyer et discuter
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {!user && (
            <div className="text-center mt-4">
              <p className="text-gray-600 mb-2">Vous devez être connecté pour contacter le vendeur</p>
              <Link href="/login" className="text-blue-600 hover:underline">
                Se connecter
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 