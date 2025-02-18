import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/utils/prisma';

export async function POST(request) {
  try {
    // Vérifier l'authentification via le cookie
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get('userData');

    if (!userDataCookie?.value) {
      return NextResponse.json(
        { error: 'Non autorisé - Veuillez vous connecter' },
        { status: 401 }
      );
    }

    let userData;
    try {
      userData = JSON.parse(userDataCookie.value);
    } catch (error) {
      return NextResponse.json(
        { error: 'Session invalide' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur existe dans la base de données
    const user = await prisma.user.findUnique({
      where: { id: userData.id }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 401 }
      );
    }

    // Récupérer les données de l'annonce
    const body = await request.json();
    const { title, description, price, category, imageUrl } = body;

    // Créer l'annonce avec l'ID utilisateur du cookie
    const ad = await prisma.ad.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        category,
        userId: userData.id,
        imageUrl
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      ad,
      message: 'Annonce créée avec succès'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erreur création annonce:', error);
    return NextResponse.json({
      error: 'Erreur lors de la création de l\'annonce'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const ads = await prisma.ad.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return new NextResponse(
      JSON.stringify(ads),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des annonces:', error);
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Erreur lors de la récupération des annonces'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 