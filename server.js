const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const WebSocket = require('ws');

const prisma = new PrismaClient();
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    path: '/api/socketio',
    transports: ['websocket'],
    allowUpgrades: false,
    pingTimeout: 60000,
    pingInterval: 25000,
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    wsEngine: WebSocket.Server
  });

  io.on('connection', (socket) => {
    console.log('Client connecté:', socket.id);

    socket.on('authenticate', async (userId) => {
      socket.userId = userId;
      socket.join(`user:${userId}`);
      console.log(`Utilisateur ${userId} authentifié`);

      // Récupérer les conversations immédiatement après l'authentification
      try {
        const conversations = await prisma.privateMessage.findMany({
          where: {
            OR: [
              { senderId: userId },
              { receiverId: userId }
            ]
          },
          distinct: ['senderId', 'receiverId'],
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            },
            receiver: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        // Grouper les messages par conversation
        const groupedConversations = conversations.reduce((acc, message) => {
          const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
          if (!acc[otherUserId]) {
            acc[otherUserId] = {
              id: message.id,
              content: message.content,
              createdAt: message.createdAt,
              senderId: message.senderId,
              receiverId: message.receiverId,
              sender: message.sender,
              receiver: message.receiver
            };
          }
          return acc;
        }, {});

        socket.emit('conversations', Object.values(groupedConversations));
      } catch (error) {
        console.error('Erreur lors de la récupération des conversations:', error);
        socket.emit('error', { message: 'Erreur lors de la récupération des conversations' });
      }
    });

    socket.on('getConversations', async () => {
      try {
        const userId = socket.userId;
        if (!userId) {
          socket.emit('error', { message: 'Utilisateur non authentifié' });
          return;
        }

        const conversations = await prisma.privateMessage.findMany({
          where: {
            OR: [
              { senderId: userId },
              { receiverId: userId }
            ]
          },
          distinct: ['senderId', 'receiverId'],
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            },
            receiver: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        // Grouper les messages par conversation
        const groupedConversations = conversations.reduce((acc, message) => {
          const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
          if (!acc[otherUserId]) {
            acc[otherUserId] = {
              id: message.id,
              content: message.content,
              createdAt: message.createdAt,
              senderId: message.senderId,
              receiverId: message.receiverId,
              sender: message.sender,
              receiver: message.receiver
            };
          }
          return acc;
        }, {});

        socket.emit('conversations', Object.values(groupedConversations));
      } catch (error) {
        console.error('Erreur lors de la récupération des conversations:', error);
        socket.emit('error', { message: 'Erreur lors de la récupération des conversations' });
      }
    });

    socket.on('getAds', async () => {
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
        socket.emit('ads', ads);
      } catch (error) {
        socket.emit('error', { message: 'Erreur lors de la récupération des annonces' });
      }
    });

    socket.on('getAd', async ({ adId }) => {
      try {
        const ad = await prisma.ad.findUnique({
          where: { id: parseInt(adId) },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });
        
        if (ad) {
          socket.emit('adDetails', ad);
        } else {
          socket.emit('error', { message: 'Annonce non trouvée' });
        }
      } catch (error) {
        socket.emit('error', { message: 'Erreur lors de la récupération de l\'annonce' });
      }
    });

    socket.on('getMessages', async ({ otherUserId }) => {
      try {
        const userId = socket.userId;
        const messages = await prisma.privateMessage.findMany({
          where: {
            OR: [
              {
                senderId: userId,
                receiverId: parseInt(otherUserId)
              },
              {
                senderId: parseInt(otherUserId),
                receiverId: userId
              }
            ]
          },
          include: {
            sender: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        });
        socket.emit('messages', messages);
      } catch (error) {
        socket.emit('error', { message: 'Erreur lors de la récupération des messages' });
      }
    });

    socket.on('sendMessage', async ({ content, receiverId }) => {
      try {
        const message = await prisma.privateMessage.create({
          data: {
            content,
            senderId: socket.userId,
            receiverId: parseInt(receiverId),
            status: 'sent'
          },
          include: {
            sender: {
              select: { id: true, name: true }
            }
          }
        });

        // Envoyer le message à l'expéditeur
        socket.emit('messageSent', message);
        
        // Envoyer le message au destinataire
        io.to(`user:${receiverId}`).emit('messageReceived', message);
        
        // Mettre à jour les conversations pour les deux utilisateurs
        const updatedConversations = await getUpdatedConversations(socket.userId);
        socket.emit('conversations', updatedConversations);
        
        const receiverConversations = await getUpdatedConversations(receiverId);
        io.to(`user:${receiverId}`).emit('conversations', receiverConversations);
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client déconnecté:', socket.id);
    });
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});

// Fonction utilitaire pour récupérer les conversations mises à jour
async function getUpdatedConversations(userId) {
  try {
    const conversations = await prisma.privateMessage.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      distinct: ['senderId', 'receiverId'],
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true
          }
        },
        receiver: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Convertir directement en tableau d'objets
    const conversationsArray = conversations.map(message => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      senderId: message.senderId,
      receiverId: message.receiverId,
      sender: message.sender,
      receiver: message.receiver
    }));

    return conversationsArray;
  } catch (error) {
    console.error('Erreur dans getUpdatedConversations:', error);
    return [];
  }
} 