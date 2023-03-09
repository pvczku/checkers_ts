import http from "http";
import express from "express";
import { Server, Socket } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  path: "/socket.io",
});

interface User {
  username: string;
  socket: Socket;
}

let users: User[] = [];

io.on("connection", (socket) => {
  const username = socket.handshake.query.username!.toString();
  if(users.length < 2) {
    users.push({username, socket});
  }
});

app.post("/reset", (req, res) => {
  users = [];
  res.send({ message: "ok" });
});

server.listen(5000, () => {
  console.log("listening on *:5000");
});
