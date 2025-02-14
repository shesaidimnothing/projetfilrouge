import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/utils/prisma';

export async function PUT(request, { params }) {
  try {
    // Récupérer et vérifier le cookie
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get('userData');
    
    if (!userDataCookie?.value) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    let userData;
    try {
      userData = JSON.parse(userDataCookie.value);
    } catch (e) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
    }

    // Vérifier que l'utilisateur modifie son propre profil
    if (parseInt(params.id) !== parseInt(userData.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Récupérer les données du formulaire
    const { name, email, currentPassword, newPassword } = await request.json();

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: parseInt(params.id) }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Si un nouveau mot de passe est fourni, vérifier l'ancien
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Le mot de passe actuel est requis' },
          { status: 400 }
        );
      }

      if (currentPassword !== user.password) {
        return NextResponse.json(
          { error: 'Mot de passe actuel incorrect' },
          { status: 400 }
        );
      }
    }

    // Préparer les données à mettre à jour
    const updateData = {
      name,
      email,
      ...(newPassword && { password: newPassword })
    };

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 409 }
        );
      }
    }

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(params.id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    // Mettre à jour le cookie avec les nouvelles informations
    const newUserData = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email
    };

    const cookieOptions = {
      path: '/',
      maxAge: 86400 // 24 heures
    };

    // Définir le nouveau cookie
    const cookie = `userData=${JSON.stringify(newUserData)}`;
    const response = NextResponse.json({ 
      message: 'Profil mis à jour avec succès',
      user: newUserData 
    });
    response.cookies.set('userData', JSON.stringify(newUserData), cookieOptions);

    return response;

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}

// Route pour récupérer les annonces d'un utilisateur
export async function GET(request, { params }) {
  try {
    const userId = parseInt(params.id);
    const ads = await prisma.ad.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(ads);
  } catch (error) {
    console.error('Erreur lors de la récupération des annonces:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des annonces' },
      { status: 500 }
    );
  }
} 