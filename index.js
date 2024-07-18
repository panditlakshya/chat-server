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
  res.send("Hello World Guys!");
});

const users = new Map();

io.on("connection", (socket) => {
  //   console.log("A user connected:", socket.id);
  socket.on("join_room", (roomId, username) => {
    socket.join(roomId);
    users.set(socket.id, { username, roomId });
    // console.log(`user with id-${socket.id} joined room - ${roomId}`);
    socket.to(roomId).emit(
      "update users",
      Array.from(users.values())
        .filter((user) => user.roomId === roomId)
        .map((user) => user.username)
    );
  });

  socket.on("send_msg", (data) => {
    socket.to(data.roomId).emit("receive_msg", data);
  });

  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (user) {
      const { room } = user;
      users.delete(socket.id);
      updateRoomUsers(room);
    }
    console.log("A user disconnected:", socket.id);
  });

  function updateRoomUsers(room) {
    const roomUsers = Array.from(users.values())
      .filter((user) => user.room === room)
      .map((user) => user.username);
    io.to(room).emit("update users", roomUsers);
  }
});

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });

server.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
