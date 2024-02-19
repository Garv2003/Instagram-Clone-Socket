const socket = require("socket.io");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const helmet = require("helmet");
const compression = require("compression");

const app = express();
const server = require("http").createServer(app);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(helmet());
app.use(compression());
app.use(morgan("common"));
app.use(express.json());

require("dotenv").config();

const io = socket(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

let users = [];

const adduser = (userId, socketId) => {
  if (!users.some((user) => user.userId === userId)) {
    users.push({ userId, socketId });
  }
};

const getuser = (userId) => {
  return users.find((user) => user.userId === userId);
};

const removeuser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

io.on("connection", (socket) => {
  console.log("user connected");
  socket.on("adduser", (userId) => {
    adduser(userId, socket.id);
    io.emit("getusers", users);
  });

  socket.on("joinroom", (roomId) => {
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("userjoined", userId);
  });

  socket.on("sendmessageRoom", ({ senderId, roomId, text, createdAt }) => {
    io.to(roomId).emit("getmessageRoom", { senderId, text, createdAt });
  });

  socket.on("sendmessage", ({ senderId, receiverId, text, createdAt }) => {
    let user = users.find((user) => user.userId === receiverId);
    io.to(user?.socketId).emit("getmessage", { senderId, text, createdAt });
  });

  socket.on("typing", (data) => {
    let user = users.find((user) => user.userId === data.receiverId);
    io.to(user?.socketId).emit("typingResponse", data);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    removeuser(socket.id);
    io.emit("getusers", users);
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
