import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

export interface EventMessage {
	eventName: string;
	eventData: object;
}

@Injectable()
export class MessengerService {
	private server?: Server;

	attachServer(server: Server): void {
		this.server = server;
	}

	publish(data: { eventName: string; eventData: object }): void {
		const message: EventMessage = {
			eventName: data.eventName,
			eventData: data.eventData,
		};
		if (!this.server) return;
		this.server.emit('messenger', message);
	}
}
