import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function GET(request, { params }) {
  try {
    if (!params?.category) {
      return new NextResponse(
        JSON.stringify({ error: 'Catégorie non spécifiée' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const ads = await prisma.ad.findMany({
      where: {
        category: params.category
      },
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
    console.error('Erreur:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Erreur lors de la récupération des annonces'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 