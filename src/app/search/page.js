'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SearchPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const query = searchParams.get('q');

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      
      try {
        const response = await fetch(`/api/ads/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Erreur de recherche:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  if (loading) return <div className="text-center py-10">Recherche en cours...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        Résultats pour "{query}"
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {results.map((ad) => (
          <Link key={ad.id} href={`/ad/${ad.id}`}>
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-4">
                <h3 className="font-medium text-lg mb-2">{ad.title}</h3>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {ad.description}
                </p>
                <p className="text-lg font-bold">{ad.price.toFixed(2)} €</p>
                <p className="text-sm text-gray-500 mt-2">
                  Publié par {ad.user.name}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {results.length === 0 && (
        <p className="text-center text-gray-500 py-10">
          Aucune annonce trouvée pour cette recherche
        </p>
      )}
    </div>
  );
} 