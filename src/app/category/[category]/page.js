'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import PageTransition from '../../../components/animations/PageTransition';
import AdCard from '../../../components/AdCard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function CategoryPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const response = await fetch(`/api/ads/category/${params.category}`);
        const data = await response.json();
        setAds(data);
      } catch (error) {
        console.error('Erreur lors de la récupération des annonces:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [params.category]);

  if (loading) {
    return <div className="text-center py-10">Chargement...</div>;
  }

  return (
    <PageTransition>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 capitalize">
          Catégorie : {params.category}
        </h1>
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
    </PageTransition>
  );
} 