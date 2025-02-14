'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div>
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <span className="text-xl font-bold">Projet Fil Rouge</span>
              </Link>
              <Link
                href="/create-ad"
                className="ml-6 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
              >
                Déposer une annonce
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Rechercher sur le site"
                  className="w-64 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>

              {user ? (
                <div className="flex items-center space-x-4">
                  <Link href="/messages" className="text-gray-700 hover:text-black">
                    Messages
                  </Link>
                  <Link href="/favorites" className="text-gray-700 hover:text-black">
                    Favoris
                  </Link>
                  <div className="relative">
                    <button
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="flex items-center space-x-2 text-gray-700 hover:text-black"
                    >
                      <span>{user.name}</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
                        <Link
                          href="/my-ads"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Mes annonces
                        </Link>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Modifier le profil
                        </Link>
                        <hr className="my-1" />
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                        >
                          Déconnexion
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link href="/login" className="text-gray-700 hover:text-black">
                    Se connecter
                  </Link>
                  <Link
                    href="/register"
                    className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
                  >
                    S'inscrire
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Sous-navigation avec les catégories */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8 py-3 text-sm">
            <Link href="/category/immobilier" className="text-gray-700 hover:text-black">Immobilier</Link>
            <Link href="/category/vehicules" className="text-gray-700 hover:text-black">Véhicules</Link>
            <Link href="/category/locations" className="text-gray-700 hover:text-black">Locations de vacances</Link>
            <Link href="/category/emploi" className="text-gray-700 hover:text-black">Emploi</Link>
            <Link href="/category/mode" className="text-gray-700 hover:text-black">Mode</Link>
            <Link href="/category/maison" className="text-gray-700 hover:text-black">Maison & Jardin</Link>
            <Link href="/category/multimedia" className="text-gray-700 hover:text-black">Multimédia</Link>
            <Link href="/category/loisirs" className="text-gray-700 hover:text-black">Loisirs</Link>
            <Link href="/category/autres" className="text-gray-700 hover:text-black">Autres</Link>
          </div>
        </div>
      </div>
    </div>
  );
} 