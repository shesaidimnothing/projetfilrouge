'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import Link from 'next/link';

export default function AdDetails() {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showContactForm, setShowContactForm] = useState(false);
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const response = await fetch(`/api/ads/${params.id}`);
        const data = await response.json();
        
        if (!response.ok) throw new Error(data.error);
        setAd(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [params.id]);

  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const messageData = {
        content: `[Re: ${ad.title}]\n\n${message}`,
        receiverId: ad.userId
      };
      console.log('Envoi du message:', messageData);

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      const data = await response.json();
      console.log('Réponse reçue:', data);

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Erreur lors de l\'envoi du message');
      }

      // Rediriger vers la conversation
      router.push(`/messages?userId=${ad.userId}`);
    } catch (error) {
      console.error('Erreur détaillée:', error);
      setError(error.message || 'Erreur lors de l\'envoi du message');
    }
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;
  if (error) return <div className="text-center py-10 text-red-600">{error}</div>;
  if (!ad) return <div className="text-center py-10">Annonce non trouvée</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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
            <div>
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
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                      {error}
                    </div>
                  )}
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