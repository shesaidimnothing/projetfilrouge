'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('userData');
      const cookies = document.cookie.split(';');
      const userDataCookie = cookies.find(c => c.trim().startsWith('userData='));
      
      if (userDataCookie) {
        try {
          const userData = JSON.parse(decodeURIComponent(userDataCookie.split('=')[1]));
          setUserState(userData);
        } catch (error) {
          console.error('Erreur de parsing du cookie userData', error);
        }
      } else if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUserState(userData);
          document.cookie = `userData=${encodeURIComponent(storedUser)};path=/;max-age=${60 * 60 * 24 * 7}`;
        } catch (error) {
          console.error('Erreur de parsing des données utilisateur', error);
        }
      }
    }
  }, []);

  const updateUser = (userData) => {
    if (typeof window !== 'undefined') {
      if (userData) {
        const userStr = JSON.stringify(userData);
        localStorage.setItem('userData', userStr);
        document.cookie = `userData=${encodeURIComponent(userStr)};path=/;max-age=${60 * 60 * 24 * 7}`;
      } else {
        localStorage.removeItem('userData');
        document.cookie = 'userData=;path=/;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
      }
      setUserState(userData);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la connexion');
      }

      updateUser(data.user);
      return true;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      return false;
    }
  };

  const register = async (email, password, name) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      updateUser(data.user);
      return true;
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      throw error;
    }
  };

  const logout = () => {
    updateUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser: updateUser, 
      login, 
      register,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
} 