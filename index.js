const socket = require("socket.io");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const helmet = require("helmet");
const compression = require("compression");
const multer = require("multer");

const app = express();
const server = require("http").createServer(app);

require("dotenv").config();

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

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  res.send("Server is running");
});

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

  app.post("/upload", upload.single("file"), (req, res) => {
    console.log(req.body, req.file);
    let user = users.find((user) => user.userId === req.body.receiverId);
    io.to(user?.socketId).emit("getmessage", {
      senderId: req.body.senderId,
      text: req.body.text || "File uploaded",
      createdAt: req.body.createdAt,
    });
    res.send("File uploaded");
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    removeuser(socket.id);
    io.emit("getusers", users);
  });
});

mongoose.connect(process.env.MONGODB_URL).then(() => {
  console.log("Connected to MongoDB");
  server.listen(process.env.PORT || 4444, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
  });
});

// const socket = require("socket.io");
// require("dotenv").config();

// const io = socket(4444, {
//   cors: {
//     origin: process.env.CLIENT_URL,
//     credentials: true,
//   },
// });

// let users = [];

// const adduser = (userId, socketId) => {
//   if (!users.some((user) => user.userId === userId)) {
//     users.push({ userId, socketId });
//   }
// };

// const getuser = (userId) => {
//   return users.find((user) => user.userId === userId);
// };

// const removeuser = (socketId) => {
//   users = users.filter((user) => user.socketId !== socketId);
// };

// io.on("connection", (socket) => {
//   console.log("user connected");
//   socket.on("adduser", (userId) => {
//     adduser(userId, socket.id);
//     io.emit("getusers", users);
//   });

//   socket.on("joinroom", (roomId) => {
//     socket.join(roomId);
//     socket.broadcast.to(roomId).emit("userjoined", userId);
//   });

//   socket.on("sendmessageRoom", ({ senderId, roomId, text, createdAt }) => {
//     io.to(roomId).emit("getmessageRoom", { senderId, text, createdAt });
//   });

//   socket.on("sendmessage", ({ senderId, receiverId, text, createdAt }) => {
//     let user = users.find((user) => user.userId === receiverId);
//     io.to(user?.socketId).emit("getmessage", { senderId, text, createdAt });
//   });

//   socket.on("typing", (data) => {
//     let user = users.find((user) => user.userId === data.receiverId);
//     io.to(user?.socketId).emit("typingResponse", data);
//   });

//   socket.on("disconnect", () => {
//     console.log("user disconnected");
//     removeuser(socket.id);
//     io.emit("getusers", users);
//   });
// });
