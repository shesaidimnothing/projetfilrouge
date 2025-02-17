'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const AdCard = ({ ad }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      {ad.imageUrl && (
        <div className="relative h-48 w-full">
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold truncate">{ad.title}</h3>
        <p className="text-gray-500 font-medium mt-1">{ad.price.toFixed(2)} €</p>
        <div className="mt-2 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {new Date(ad.createdAt).toLocaleDateString()}
          </span>
          <Link
            href={`/ad/${ad.id}`}
            className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium"
          >
            Voir l'annonce
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default AdCard; 