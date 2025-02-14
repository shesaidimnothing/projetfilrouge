'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3
    }
  },
  hover: {
    scale: 1.03,
    transition: {
      duration: 0.2
    }
  }
};

export default function AdCard({ ad, index }) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      transition={{ delay: index * 0.1 }}
    >
      <Link href={`/ad/${ad.id}`}>
        <div className="border rounded-lg overflow-hidden hover:shadow-lg">
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
    </motion.div>
  );
} 