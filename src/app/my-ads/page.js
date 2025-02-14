'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';

export default function MyAds() {
  const [ads, setAds] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchMyAds();
    }
  }, [user]);

  const fetchMyAds = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${user.id}/ads`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des annonces');
      }

      setAds(data);
      setError('');
    } catch (error) {
      console.error('Erreur:', error);
      setError('Impossible de charger vos annonces');
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-10">
        <p>Veuillez vous connecter pour voir vos annonces</p>
        <Link href="/login" className="text-blue-600 hover:underline">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Mes annonces</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <p>Chargement de vos annonces...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ads.map((ad) => (
              <div key={ad.id} className="border rounded-lg shadow-sm p-4">
                <h2 className="text-xl font-semibold mb-2">{ad.title}</h2>
                <p className="text-gray-600 mb-2">{ad.description}</p>
                <p className="text-lg font-bold text-blue-600">{ad.price} €</p>
                <div className="mt-4 flex justify-between">
                  <Link
                    href={`/ad/${ad.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Voir l'annonce
                  </Link>
                  <Link
                    href={`/edit-ad/${ad.id}`}
                    className="text-gray-600 hover:underline"
                  >
                    Modifier
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {ads.length === 0 && (
            <p className="text-center text-gray-500 mt-4">
              Vous n'avez pas encore publié d'annonces
            </p>
          )}

          <div className="mt-8 text-center">
            <Link
              href="/create-ad"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Créer une nouvelle annonce
            </Link>
          </div>
        </>
      )}
    </div>
  );
} 