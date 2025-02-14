import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import initMessageSocket from '../messages/socket';

const socketServer = initMessageSocket();

export async function GET(req) {
  const headersList = await headers();
  const upgrade = headersList.get('upgrade');

  if (upgrade && upgrade.toLowerCase() === 'websocket') {
    return NextResponse.next();
  }

  return NextResponse.json({ message: 'Cette route nécessite une connexion WebSocket' });
} 