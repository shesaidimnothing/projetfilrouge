'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage?.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        if (typeof window !== 'undefined') {
          document.cookie = `userData=${JSON.stringify(userData)}; path=/; max-age=86400`;
        }
      } catch (e) {
        console.error('Erreur lors de la lecture des données utilisateur:', e);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la connexion');
      }
      
      const userData = {
        ...data.user,
        id: parseInt(data.user.id)
      };
      
      console.log('userData après login:', userData);
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      document.cookie = `userData=${JSON.stringify(userData)}; path=/; max-age=86400`;
      return true;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  };

  const register = async (email, password, name) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }
      return true;
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    document.cookie = 'userData=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    document.cookie = `userData=${JSON.stringify(userData)}; path=/; max-age=86400`;
  };

  const value = {
    user,
    register,
    login,
    logout,
    loading,
    updateUser
  };

  if (loading) {
    return null;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
} 