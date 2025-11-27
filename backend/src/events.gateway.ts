import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*', // Her yerden erişime izin ver (Frontend 3001 için)
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    // console.log('Client connected:', client.id);
  }

  handleDisconnect(client: any) {
    // console.log('Client disconnected:', client.id);
  }

  // Veriyi Frontend'e yollayan fonksiyonumuz
  sendProgress(testId: string, data: any) {
    // Sadece o testin odasına (channel) veriyi bas
    this.server.emit(`test-progress-${testId}`, data);
  }
}
