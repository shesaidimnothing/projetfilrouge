import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import prisma from '@/utils/prisma';

// Créer une seule instance de PrismaClient
let prismaClient;

if (process.env.NODE_ENV === 'production') {
  prismaClient = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prismaClient = global.prisma;
}

export async function GET() {
  try {
    console.log('Début de la requête GET conversations');
    
    // Utiliser await avec cookies()
    const cookieStore = await cookies();
    const userDataCookie = cookieStore.get('userData');
    console.log('Cookie userData:', userDataCookie);
    
    if (!userDataCookie?.value) {
      console.log('Pas de cookie userData trouvé');
      return NextResponse.json({ conversations: [] });
    }

    let userData;
    try {
      userData = JSON.parse(userDataCookie.value);
      console.log('userData parsé:', userData);
    } catch (e) {
      console.error('Erreur parsing userData:', e);
      return NextResponse.json({ conversations: [] });
    }

    if (!userData?.id) {
      console.log('Pas d\'ID utilisateur trouvé dans userData');
      return NextResponse.json({ conversations: [] });
    }

    const userId = parseInt(userData.id);
    console.log('userId converti:', userId);

    // Vérifier d'abord si l'utilisateur existe
    const userExists = await prismaClient.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) {
      console.log('Utilisateur non trouvé dans la base de données');
      return NextResponse.json({ conversations: [] });
    }

    // Récupérer les conversations de manière plus simple
    const conversations = await prismaClient.user.findMany({
      where: {
        OR: [
          { sentMessages: { some: { receiverId: userId } } },
          { receivedMessages: { some: { senderId: userId } } }
        ],
        NOT: { id: userId }
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            sentMessages: {
              where: {
                receiverId: userId,
                read: false
              }
            }
          }
        }
      }
    });

    console.log('Conversations trouvées:', conversations);

    const formattedConversations = conversations.map(user => ({
      userId: user.id,
      userName: user.name,
      unreadCount: user._count.sentMessages
    }));

    console.log('Conversations formatées:', formattedConversations);

    return NextResponse.json({ 
      conversations: formattedConversations 
    });

  } catch (error) {
    console.error('Erreur détaillée:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });

    // En cas d'erreur de connexion à la base de données
    if (error.code === 'P1001' || error.code === 'P1002') {
      return NextResponse.json(
        { error: 'Erreur de connexion à la base de données', conversations: [] },
        { status: 503 }
      );
    }

    // Pour toute autre erreur
    return NextResponse.json(
      { error: 'Erreur interne du serveur', conversations: [] },
      { status: 200 } // On renvoie 200 même en cas d'erreur pour éviter les problèmes côté client
    );
  } finally {
    // Si on n'est pas en développement, on déconnecte Prisma
    if (process.env.NODE_ENV === 'production') {
      await prismaClient.$disconnect();
    }
  }
} 