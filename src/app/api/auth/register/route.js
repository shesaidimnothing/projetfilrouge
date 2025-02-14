import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/utils/prisma';

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();

    // Validation des données
    if (!email || !password || !name) {
      return NextResponse.json({ 
        error: 'Tous les champs sont requis' 
      }, { status: 400 });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: 'Cet email est déjà utilisé' 
      }, { status: 409 });
    }

    // Chiffrer le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer le nouvel utilisateur avec le mot de passe chiffré
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    return NextResponse.json({
      user,
      message: 'Inscription réussie'
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de l\'inscription' 
    }, { status: 500 });
  }
} 