import { NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export async function GET() {
  try {
    await prisma.$connect();
    const test = await prisma.$queryRaw`SELECT NOW()`;
    console.log('Test de connexion réussi:', test);
    
    return NextResponse.json({
      success: true,
      timestamp: test[0].now
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    return NextResponse.json({
      error: 'Erreur de connexion à la base de données',
      details: error.message
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 