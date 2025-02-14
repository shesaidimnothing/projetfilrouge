import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/utils/prisma';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return new NextResponse(
        JSON.stringify({ error: 'Email ou mot de passe incorrect' }),
        { status: 401 }
      );
    }

    // Si le mot de passe n'est pas chiffré (ancien utilisateur)
    if (!user.password.startsWith('$2')) {
      // Comparer directement pour les anciens comptes
      if (password !== user.password) {
        return new NextResponse(
          JSON.stringify({ error: 'Email ou mot de passe incorrect' }),
          { status: 401 }
        );
      }
      
      // Mettre à jour le mot de passe avec une version chiffrée
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
    } else {
      // Pour les nouveaux comptes, utiliser bcrypt.compare
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return new NextResponse(
          JSON.stringify({ error: 'Email ou mot de passe incorrect' }),
          { status: 401 }
        );
      }
    }

    const { password: _, ...userWithoutPassword } = user;
    return new NextResponse(
      JSON.stringify({ 
        user: userWithoutPassword,
        message: 'Connexion réussie'
      }),
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Erreur de connexion:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Erreur lors de la connexion' }),
      { status: 500 }
    );
  }
} 