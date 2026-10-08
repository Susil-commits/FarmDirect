import { Server, type Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import Message from '../models/Message.js';
import { UserRole } from '../types/enums.js';

interface ConnectedUser {
  socketIds: Set<string>;
  role: string;
  connectedAt: Date;
}

type CorsConfig = { origin: string[] | ((origin: string | undefined, cb: (err: Error | null, ok?: boolean) => void) => void) };

let io: Server | null = null;
const connectedUsers = new Map<string, ConnectedUser>();

export function initSocket(httpServer: HttpServer, corsOptions: CorsConfig): Server {
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

  io.use(async (socket: Socket, next) => {
    try {
      const token = (socket.handshake.auth.token as string) || (socket.handshake.query.token as string);
      if (!token) {
        return next(new Error('Authentication required'));
      }
      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error('Invalid or expired token'));
      }
      socket.data.userId = decoded.id;

      let role = decoded.role as UserRole | undefined;
      const user = await User.findById(decoded.id).select('role status').lean();
      if (!user || user.status === 'banned' || user.status === 'suspended') {
        return next(new Error('Account inactive or suspended'));
      }
      if (!role) {
        role = user.role as UserRole | undefined;
      }

      socket.data.userRole = role || UserRole.Buyer;
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    const role = socket.data.userRole as string;

    const existing = connectedUsers.get(userId);
    if (existing) {
      existing.socketIds.add(socket.id);
    } else {
      connectedUsers.set(userId, { socketIds: new Set([socket.id]), role, connectedAt: new Date() });
    }

    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);

    // Privacy-preserving presence: only notify admins and broadcast aggregate count
    io!.to('role:admin').emit('user:online', { userId, role, onlineCount: connectedUsers.size });
    io!.emit('presence:count', { onlineCount: connectedUsers.size });

    // Authorized room joins: ensure the caller is actually a party to the order
    socket.on('join:order', async (orderId: string) => {
      try {
        if (!orderId || typeof orderId !== 'string') return;
        if (socket.data.userRole === UserRole.Admin) {
          socket.join(`order:${orderId}`);
          return;
        }
        const order = await Order.findById(orderId).select('buyerId farmerId').lean();
        if (!order) return;
        const uid = String(socket.data.userId);
        if (String(order.buyerId) === uid || String(order.farmerId) === uid) {
          socket.join(`order:${orderId}`);
        }
      } catch (err) {
        console.warn(`[Socket] Unauthorized or invalid join:order attempt for ${orderId}:`, err);
      }
    });

    socket.on('leave:order', (orderId: string) => {
      if (orderId && typeof orderId === 'string') {
        socket.leave(`order:${orderId}`);
      }
    });

    // Authorized room joins: ensure the caller is a participant in the conversation
    socket.on('join:conversation', async (conversationId: string) => {
      try {
        if (!conversationId || typeof conversationId !== 'string') return;
        if (socket.data.userRole === UserRole.Admin) {
          socket.join(`conversation:${conversationId}`);
          return;
        }
        const isParticipant = await Message.exists({
          $or: [
            { conversationId, senderId: socket.data.userId },
            { conversationId, receiverId: socket.data.userId },
          ],
        });
        if (isParticipant) {
          socket.join(`conversation:${conversationId}`);
        }
      } catch (err) {
        console.warn(`[Socket] Unauthorized or invalid join:conversation attempt for ${conversationId}:`, err);
      }
    });

    socket.on('leave:conversation', (conversationId: string) => {
      if (conversationId && typeof conversationId === 'string') {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    socket.on('typing:start', (data: { conversationId: string; receiverId: string }) => {
      socket.to(`user:${data.receiverId}`).emit('typing:start', { conversationId: data.conversationId, userId });
    });
    socket.on('typing:stop', (data: { conversationId: string; receiverId: string }) => {
      socket.to(`user:${data.receiverId}`).emit('typing:stop', { conversationId: data.conversationId, userId });
    });

    socket.on('disconnect', (_reason: string) => {
      const entry = connectedUsers.get(userId);
      if (entry) {
        entry.socketIds.delete(socket.id);
        if (entry.socketIds.size === 0) {
          connectedUsers.delete(userId);
          io!.to('role:admin').emit('user:offline', { userId, role, onlineCount: connectedUsers.size });
          io!.emit('presence:count', { onlineCount: connectedUsers.size });
        }
      }
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

export function getConnectedUsers(): Map<string, ConnectedUser> {
  return connectedUsers;
}

export function isUserOnline(userId: string): boolean {
  return connectedUsers.has(userId);
}

export function disconnectUserSockets(userId: string): void {
  if (!io || !userId) return;
  const userRoom = `user:${userId}`;
  const socketIds = io.sockets.adapter.rooms.get(userRoom);
  if (socketIds) {
    for (const socketId of Array.from(socketIds)) {
      const clientSocket = io.sockets.sockets.get(socketId);
      if (clientSocket) {
        clientSocket.emit('auth:terminated', { message: 'Your account or session has been terminated by an administrator.' });
        clientSocket.disconnect(true);
      }
    }
  }
  connectedUsers.delete(userId);
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  if (io && userId) io.to(`user:${userId}`).emit(event, data);
}

export function emitToRole(role: string, event: string, data: unknown): void {
  if (io) io.to(`role:${role}`).emit(event, data);
}

export function emitToOrder(orderId: string, event: string, data: unknown): void {
  if (io) io.to(`order:${orderId}`).emit(event, data);
}

export function emitToConversation(conversationId: string, event: string, data: unknown): void {
  if (io) io.to(`conversation:${conversationId}`).emit(event, data);
}

export function emitToAll(event: string, data: unknown): void {
  if (io) io.emit(event, data);
}
