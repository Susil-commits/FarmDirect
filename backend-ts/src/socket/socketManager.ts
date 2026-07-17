import { Server, type Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import { verifyToken } from '../utils/jwt.js';
import type { UserRole } from '../types/enums.js';

interface ConnectedUser {
  socketId: string;
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

  io.use((socket: Socket, next) => {
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
      socket.data.userRole = (socket.handshake.auth.role as UserRole) || 'buyer';
      next();
    } catch {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    const role = socket.data.userRole as string;

    connectedUsers.set(userId, { socketId: socket.id, role, connectedAt: new Date() });

    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);

    console.log(`Socket connected: ${userId} (${role}) — ${connectedUsers.size} online`);
    io!.emit('user:online', { userId, role, onlineCount: connectedUsers.size });

    socket.on('join:order', (orderId: string) => socket.join(`order:${orderId}`));
    socket.on('leave:order', (orderId: string) => socket.leave(`order:${orderId}`));
    socket.on('join:conversation', (conversationId: string) => socket.join(`conversation:${conversationId}`));
    socket.on('leave:conversation', (conversationId: string) => socket.leave(`conversation:${conversationId}`));

    socket.on('typing:start', (data: { conversationId: string; receiverId: string }) => {
      socket.to(`user:${data.receiverId}`).emit('typing:start', { conversationId: data.conversationId, userId });
    });
    socket.on('typing:stop', (data: { conversationId: string; receiverId: string }) => {
      socket.to(`user:${data.receiverId}`).emit('typing:stop', { conversationId: data.conversationId, userId });
    });

    socket.on('disconnect', (reason: string) => {
      connectedUsers.delete(userId);
      console.log(`Socket disconnected: ${userId} (${reason}) — ${connectedUsers.size} online`);
      io!.emit('user:offline', { userId, role, onlineCount: connectedUsers.size });
    });
  });

  console.log('WebSocket server initialized');
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
