import { Server } from 'socket.io';
import { verifyToken } from '../utils/jwt.js';

let io = null;

const connectedUsers = new Map();

export const initSocket = (httpServer, corsOptions) => {
  io = new Server(httpServer, {
    cors: {
      origin: corsOptions.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000,
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error('Invalid or expired token'));
      }

      socket.userId = decoded.id;
      socket.userRole = socket.handshake.auth.role || 'buyer';
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    const role = socket.userRole;

    connectedUsers.set(userId, {
      socketId: socket.id,
      role,
      connectedAt: new Date(),
    });

    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);

    console.log(`🔌 Socket connected: ${userId} (${role}) — ${connectedUsers.size} online`);

    io.emit('user:online', {
      userId,
      role,
      onlineCount: connectedUsers.size,
    });

    socket.on('join:order', (orderId) => {
      socket.join(`order:${orderId}`);
      console.log(`📦 ${userId} joined order room: ${orderId}`);
    });

    socket.on('leave:order', (orderId) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on('join:conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave:conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on('typing:start', ({ conversationId, receiverId }) => {
      socket.to(`user:${receiverId}`).emit('typing:start', {
        conversationId,
        userId,
      });
    });

    socket.on('typing:stop', ({ conversationId, receiverId }) => {
      socket.to(`user:${receiverId}`).emit('typing:stop', {
        conversationId,
        userId,
      });
    });

    socket.on('disconnect', (reason) => {
      connectedUsers.delete(userId);
      console.log(`🔌 Socket disconnected: ${userId} (${reason}) — ${connectedUsers.size} online`);

      io.emit('user:offline', {
        userId,
        role,
        onlineCount: connectedUsers.size,
      });
    });
  });

  console.log('⚡ WebSocket server initialized');
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const getConnectedUsers = () => connectedUsers;

export const isUserOnline = (userId) => connectedUsers.has(userId);

export const emitToUser = (userId, event, data) => {
  if (io && userId) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToRole = (role, event, data) => {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
};

export const emitToOrder = (orderId, event, data) => {
  if (io) {
    io.to(`order:${orderId}`).emit(event, data);
  }
};

export const emitToConversation = (conversationId, event, data) => {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
};

export const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};