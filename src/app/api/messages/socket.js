import { Server } from 'socket.io';
import prisma from '@/utils/prisma';

const users = new Map();

const initMessageSocket = (server) => {
  const io = new Server(server, {
    path: '/api/messages/socket',
    addTrailingSlash: false,
  });

  io.on('connection', (socket) => {
    // Authentification de l'utilisateur
    socket.on('authenticate', (userId) => {
      users.set(socket.id, userId);
      socket.join(`user:${userId}`);
      console.log(`Utilisateur ${userId} connecté`);
    });

    // Récupérer les conversations
    socket.on('getConversations', async () => {
      const userId = users.get(socket.id);
      if (!userId) return;

      try {
        const conversations = await prisma.privateMessage.findMany({
          where: {
            OR: [
              { senderId: userId },
              { receiverId: userId }
            ]
          },
          include: {
            sender: {
              select: { id: true, name: true }
            },
            receiver: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        socket.emit('conversations', conversations);
      } catch (error) {
        console.error('Erreur lors de la récupération des conversations:', error);
      }
    });

    // Récupérer les messages d'une conversation
    socket.on('getMessages', async ({ otherUserId }) => {
      const userId = users.get(socket.id);
      if (!userId) return;

      try {
        const messages = await prisma.privateMessage.findMany({
          where: {
            OR: [
              {
                senderId: userId,
                receiverId: otherUserId
              },
              {
                senderId: otherUserId,
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
        console.error('Erreur lors de la récupération des messages:', error);
      }
    });

    // Envoyer un nouveau message
    socket.on('sendMessage', async ({ content, receiverId }) => {
      const senderId = users.get(socket.id);
      if (!senderId) return;

      try {
        const message = await prisma.privateMessage.create({
          data: {
            content,
            senderId,
            receiverId,
            status: 'sent'
          },
          include: {
            sender: {
              select: { id: true, name: true }
            }
          }
        });

        // Envoyer le message à l'expéditeur et au destinataire
        socket.emit('messageSent', message);
        io.to(`user:${receiverId}`).emit('messageReceived', message);
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        socket.emit('messageError', { error: 'Erreur lors de l\'envoi du message' });
      }
    });

    // Marquer les messages comme lus
    socket.on('markAsRead', async ({ senderId }) => {
      const userId = users.get(socket.id);
      if (!userId) return;

      try {
        await prisma.privateMessage.updateMany({
          where: {
            senderId,
            receiverId: userId,
            read: false
          },
          data: {
            read: true,
            status: 'read'
          }
        });

        io.to(`user:${senderId}`).emit('messagesRead', { by: userId });
      } catch (error) {
        console.error('Erreur lors du marquage des messages:', error);
      }
    });

    socket.on('disconnect', () => {
      const userId = users.get(socket.id);
      if (userId) {
        users.delete(socket.id);
        console.log(`Utilisateur ${userId} déconnecté`);
      }
    });
  });

  return io;
};

export default initMessageSocket; 