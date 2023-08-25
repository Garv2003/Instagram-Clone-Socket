const socket = require("socket.io");
require("dotenv").config();

const io = socket(4444, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

let users = [];

const adduser = (userId, socketId) => {
  !users.some((user) => {
    user.userId === userId;
  }) && users.push({ userId, socketId });
};

const getuser = (userId) => {
  return users.find((user) => user.userId === userId);
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
    console.log(users);
    io.emit("getusers", users);
  });

  socket.on("sendmessage", ({ senderId, receiverId, text }) => {
    // let user = users.find((user) => user.userId === receiverId);
    let user = getuser(receiverId);
    console.log({ senderId, receiverId, text, user });
    io.to(user?.socketId).emit("getmessage", { senderId, text });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    removeuser(socket.id);
    io.emit("getusers", users);
  });
});
