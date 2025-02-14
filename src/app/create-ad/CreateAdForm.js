'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = [
  { id: 'immobilier', name: 'Immobilier' },
  { id: 'vehicules', name: 'Véhicules' },
  { id: 'locations', name: 'Locations de vacances' },
  { id: 'emploi', name: 'Emploi' },
  { id: 'mode', name: 'Mode' },
  { id: 'maison', name: 'Maison & Jardin' },
  { id: 'multimedia', name: 'Multimédia' },
  { id: 'loisirs', name: 'Loisirs' },
  { id: 'autres', name: 'Autres' }
];

export default function CreateAdForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!user) {
      router.push('/login');
      return;
    }

    if (!formData.category) {
      setError('Veuillez sélectionner une catégorie');
      setIsLoading(false);
      return;
    }

    try {
      const formDataToSend = {
        ...formData,
        price: parseFloat(formData.price),
        userId: user.id,
      };

      console.log('Envoi des données:', formDataToSend);

      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataToSend),
      });

      let data;
      try {
        const textResponse = await response.text();
        console.log('Réponse brute:', textResponse);
        data = JSON.parse(textResponse);
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError);
        throw new Error('Réponse invalide du serveur');
      }

      console.log('Réponse parsée:', data);

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Erreur lors de la création de l\'annonce');
      }

      if (data.success) {
        router.push('/');
      } else {
        throw new Error(data.error || 'Erreur lors de la création de l\'annonce');
      }
    } catch (err) {
      console.error('Erreur complète:', err);
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (typeof window !== 'undefined' && !user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Créer une nouvelle annonce
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Catégorie
              </label>
              <select
                id="category"
                name="category"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Sélectionnez une catégorie</option>
                {CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Titre de l'annonce
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black"
                value={formData.title}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                Prix (€)
              </label>
              <input
                type="number"
                id="price"
                name="price"
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-black focus:border-black"
                value={formData.price}
                onChange={handleChange}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="bg-gray-200 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`bg-black py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Création...' : 'Créer l\'annonce'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 