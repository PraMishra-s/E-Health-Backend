"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitNotification = exports.sendNotificationToClients = exports.initSocket = void 0;
// socket/index.ts
const socket_io_1 = require("socket.io");
let io;
const initSocket = (server) => {
    io = new socket_io_1.Server(server, {
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
        socket.on("markNotificationAsRead", (notificationId) => __awaiter(void 0, void 0, void 0, function* () {
            // This event can be used to broadcast to other clients that a notification was read
            // if you want all clients to refresh their notifications when one client marks as read
            socket.broadcast.emit("notificationUpdate");
        }));
    });
};
exports.initSocket = initSocket;
// Simple function to broadcast a signal to refresh notifications
const sendNotificationToClients = () => {
    if (!io) {
        console.error("Socket.io not initialized");
        return;
    }
    // Just send a signal to invalidate the query, no need to fetch and send the data
    io.emit("notificationUpdate");
    console.log("[Socket] Sent notification update signal to all clients");
};
exports.sendNotificationToClients = sendNotificationToClients;
// Keep this function for backward compatibility or direct notifications
const emitNotification = (data) => {
    if (io) {
        io.emit("notification", data); // Broadcast to all connected clients
    }
};
exports.emitNotification = emitNotification;
