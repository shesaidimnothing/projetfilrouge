'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from './LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // Si l'utilisateur est connecté, on retourne null pendant la redirection
  if (user) {
    return null;
  }

  // Sinon on affiche le formulaire de connexion
  return <LoginForm />;
} 