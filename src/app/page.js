'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import PageTransition from '../components/animations/PageTransition';
import AdCard from '../components/AdCard';
import { useAuth } from '../contexts/AuthContext';

let socket;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  const [ads, setAds] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!socket) {
      socket = io('http://localhost:3000', {
        path: '/api/socketio',
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true,
        timeout: 20000
      });

      socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });

      socket.on('connect', () => {
        console.log('Connected to WebSocket');
        if (user) {
          socket.emit('authenticate', user.id);
        }
        socket.emit('getAds');
      });

      socket.on('ads', (receivedAds) => {
        console.log('Received ads:', receivedAds);
        setAds(receivedAds);
      });

      socket.on('error', (error) => {
        console.error('Erreur WebSocket:', error);
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [user]);

  return (
    <PageTransition>
      <div>
        {/* Bannière principale */}
        <motion.div 
          className="bg-gray-100 py-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-peach-100 rounded-lg p-8 relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-4">C'est le moment de vendre</h2>
                <Link
                  href="/create-ad"
                  className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Déposer une annonce
                </Link>
              </div>
              <div className="absolute right-0 top-0 h-full w-1/3">
                {/* Élément décoratif */}
                <div className="absolute right-0 top-0 h-24 w-24 bg-blue-200 rounded-full transform translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section Tendances */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold mb-4">Tendance en ce moment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <h3 className="font-semibold">Idées cadeaux</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <h3 className="font-semibold">Équipements sportifs</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <h3 className="font-semibold">High-Tech</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 hover:shadow-lg transition-shadow">
              <h3 className="font-semibold">Maison</h3>
            </div>
          </div>
        </div>

        {/* Section Top catégories */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold mb-4">Top catégories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Link href="/category/vetements" className="group">
              <div className="relative rounded-lg overflow-hidden aspect-square">
                <img src="/images/vetements.jpg" alt="Vêtements" className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <span className="text-white font-medium">Vêtements</span>
                </div>
              </div>
            </Link>
            {/* Répéter pour les autres catégories */}
          </div>
        </div>

        {/* Section Annonces récentes */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-xl font-semibold mb-4">Annonces récentes</h2>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} />
            ))}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
