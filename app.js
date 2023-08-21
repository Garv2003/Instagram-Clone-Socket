const express = require("express");
const cors = require("cors");
const app = express();
const socket = require("socket.io");
require("dotenv").config();

app.use(cors());
app.use(express.json());

const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);
const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

let users = [];

const adduser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const getuser = (userId) => {
  return users.find((user) => {
    user.userId === userId;
  });
};

const removeuser = (socketId) => {
  users = users.filter((user) => {
    user.socketId !== socketId;
  });
};

io.on("connection", (socket) => {
  console.log("user connected");
  socket.on("adduser", (userId) => {
    adduser(userId, socket.id);
    io.emit("getusers", users);
  });
  socket.on("sendmessage", ({ senderId, receiverId, text }) => {
    let user = users.find((user) => user.userId === receiverId);
    io.to(user.socketId).emit("getmessage", { senderId, text });
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
    removeuser(socket.id);
    io.emit("getusers", users);
  });
});
