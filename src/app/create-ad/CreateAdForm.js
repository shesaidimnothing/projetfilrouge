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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        setError('L\'image ne doit pas dépasser 5MB');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToCloudinary = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default');
      formData.append('folder', 'samples/ecommerce');
      formData.append('public_id_prefix', file.name);
      
      console.log('Tentative d\'upload avec les paramètres:', {
        upload_preset: 'ml_default',
        folder: 'samples/ecommerce',
        filename: file.name
      });

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dihipijjs/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      console.log('Réponse Cloudinary:', data);

      if (!response.ok) {
        throw new Error(`Erreur Cloudinary: ${data.error?.message || 'Erreur inconnue'}`);
      }

      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error('URL sécurisée non trouvée dans la réponse');
      }
    } catch (error) {
      console.error('Détails de l\'erreur:', error);
      if (error.response) {
        const errorData = await error.response.json();
        console.error('Réponse d\'erreur Cloudinary:', errorData);
      }
      throw new Error(`Erreur lors de l'upload de l'image: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError('');

    try {
      let imageUrl = null;
      if (image) {
        try {
          imageUrl = await uploadImageToCloudinary(image);
          console.log('Image uploadée avec succès:', imageUrl);
        } catch (uploadError) {
          console.error('Erreur lors de l\'upload:', uploadError);
          setError(`Erreur lors de l'upload de l'image: ${uploadError.message}`);
          setLoading(false);
          return;
        }
      }

      const response = await fetch('/api/ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price),
          category,
          userId: user.id,
          imageUrl
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      router.push('/');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Créer une nouvelle annonce</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Titre de l'annonce
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="4"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Prix (€)
          </label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Catégorie
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700">Image</label>
          <div className="mt-1 flex items-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
          {imagePreview && (
            <div className="mt-2">
              <img
                src={imagePreview}
                alt="Aperçu"
                className="h-32 w-auto object-cover rounded-lg"
              />
            </div>
          )}
          <p className="mt-1 text-sm text-gray-500">
            PNG, JPG, GIF jusqu'à 5MB
          </p>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Création en cours...' : 'Créer l\'annonce'}
        </button>
      </form>
    </div>
  );
} 