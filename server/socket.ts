import { Server } from 'socket.io';

let io: Server | null = null;

export const setSocketServer = (server: Server) => {
  io = server;
};

export const emitGlobalEvent = (event: string, payload: any) => {
  if (io) {
    io.emit(event, payload);
  }
};
