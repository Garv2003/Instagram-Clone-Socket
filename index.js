const socket = require("socket.io");
require("dotenv").config();

const io = socket(4444, {
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
