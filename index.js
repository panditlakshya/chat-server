const express = require("express");
const { createServer } = require("node:http");
require("dotenv").config();
const app = express();
const port = process.env.PORT;
const { Server } = require("socket.io");
const server = createServer(app);

const cors = require("cors");
app.use(cors());
const io = new Server(server, {
  cors: {
    origin: `${process.env.FRONTEND_URL}`, // Replace with your frontend URL
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

app.get("/", (req, res) => {
  res.send("Hello World Guys 5!");
});

const users = new Map();

io.on("connection", (socket) => {
  const socketId = socket.id;
  console.log("A user connected:", socketId);
  socket.on("join_room", (roomId, username) => {
    socket.join(roomId);
    users.set(socketId, { username, roomId });
    io.to(roomId).emit(
      "update users",
      Array.from(users.values())
        .filter((user) => user.roomId === roomId)
        .map((user) => user.username)
    );
  });

  socket.on("leave_room", (room, username) => {
    const user = users.get(socketId);

    if (user && user.roomId === room) {
      socket.leave(room);
      users.delete(socketId);
      const roomUsers = Array.from(users.values())
        .filter((user) => user.roomId === room && user.username !== username)
        .map((user) => user.username);
      io.to(room).emit("update users", roomUsers);
    }
  });

  socket.on("send_msg", (data) => {
    io.to(data.roomId).emit("receive_msg", data);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socketId);
  });

  //   function updateRoomUsers(room) {
  //     const roomUsers = Array.from(users.values())
  //       .filter((user) => user.room === room)
  //       .map((user) => user.username);
  //     io.to(room).emit("update users", roomUsers);
  //   }
});

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });

server.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
