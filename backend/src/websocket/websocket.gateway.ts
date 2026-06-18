import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  
  private readonly logger = new Logger(WebsocketGateway.name);
  private connectedClients: Map<string, string[]> = new Map(); // userId -> socketIds[]

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // Remove client from connectedClients map
    for (const [userId, socketIds] of this.connectedClients.entries()) {
      const index = socketIds.indexOf(client.id);
      if (index !== -1) {
        socketIds.splice(index, 1);
        if (socketIds.length === 0) {
          this.connectedClients.delete(userId);
        }
        break;
      }
    }
  }

  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() userId: string) {
    this.logger.log(`User ${userId} joined with socket ${client.id}`);
    
    if (!this.connectedClients.has(userId)) {
      this.connectedClients.set(userId, []);
    }
    const clientList = this.connectedClients.get(userId);
    if (clientList) {
      clientList.push(client.id);
    }
    
    // Join a room for this user
    client.join(`user_${userId}`);
  }

  sendNotificationToUser(userId: string, notification: any) {
    this.logger.log(`Sending notification to user ${userId}`);
    this.server.to(`user_${userId}`).emit('new_notification', notification);
  }

  sendNotificationToRole(role: string, notification: any) {
    this.logger.log(`Broadcasting notification to role ${role}`);
    this.server.emit(`role_${role}_notification`, notification);
  }

  broadcastToAll( event: string, data: any) {
    this.server.emit(event, data);
  }
}
