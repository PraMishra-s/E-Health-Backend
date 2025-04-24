// socket/index.ts
import { Server } from "socket.io";
import http from "http";

let io: Server;

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Or specify your frontend domain
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);
    
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
    
    // Handle when a client marks a notification as read
    socket.on("markNotificationAsRead", async (notificationId: string) => {
      // This event can be used to broadcast to other clients that a notification was read
      // if you want all clients to refresh their notifications when one client marks as read
      socket.broadcast.emit("notificationUpdate");
    });
  });
};

// Simple function to broadcast a signal to refresh notifications
export const sendNotificationToClients = () => {
  if (!io) {
    console.error("Socket.io not initialized");
    return;
  }
  
  // Just send a signal to invalidate the query, no need to fetch and send the data
  io.emit("notificationUpdate");
  console.log("[Socket] Sent notification update signal to all clients");
};

// Keep this function for backward compatibility or direct notifications
export const emitNotification = (data: any) => {
  if (io) {
    io.emit("notification", data); // Broadcast to all connected clients
  }
};