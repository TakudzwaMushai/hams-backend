let io;

const initSocket = (server) => {
  const { Server } = require("socket.io");
  const { corsOptions } = require("../config/cors");

  io = new Server(server, {
    cors: corsOptions,
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Doctor/patient joins their own room using their user ID
    socket.on("join", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined room`);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialised");
  return io;
};

module.exports = { initSocket, getIO };
