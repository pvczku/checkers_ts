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
  if (users.length === 2) {
    users.forEach((user) => {
      user.socket.join("game");
    });
    let game = new Game(io, users);
  }
});

app.post("/reset", (req, res) => {
  users = [];
  res.send({ message: "ok" });
});

server.listen(5000, () => {
  console.log("listening on *:5000");
});


class Game {
  board: number[][] = [ // 0 - empty, 1 - white, 2 - black
    [2, 0, 2, 0, 2, 0, 2, 0],
    [0, 2, 0, 2, 0, 2, 0, 2],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
  ];
  turn: number = 0; // white 0, black 1
  constructor(io: Server, users: User[]) {
    users[0].socket.emit("opponent", users[1].username);
    users[1].socket.emit("opponent", users[0].username);

    const white = users[0]
    const black = users[1]
    white.socket.emit("color", "white")
    black.socket.emit("color", "black")

    io.to("game").emit("start", "start")
    white.socket.on("showLegalMoves", (data) => {
      this.showLegalMoves(data, white)
    })
    black.socket.on("showLegalMoves", (data) => {
      this.showLegalMoves(data, black)
    })

    white.socket.on("playMove", (data) => {
      this.makeMove(data.from, data.to, io)
    })
    black.socket.on("playMove", (data) => {
      this.makeMove(data.from, data.to, io)
    })
  }

  showLegalMoves(data: {x: number, y: number}, user: User) {
    const {x, y} = data
    const legalMoves: {x: number, y: number}[] = []
    if (this.board[y][x] === 1 && this.turn === 0) {
      const directions = [
        {x: -1, y: -1},
        {x: 1, y: -1},
      ]
      directions.forEach((direction) => {
        const newSquare = {x: x + direction.x, y: y + direction.y}
        const newPiece = this.board[newSquare.y][newSquare.x]
        if (newPiece === 0) {
          legalMoves.push(newSquare)
        } else if (newPiece === 2) {
          const newSquare2 = {x: newSquare.x + direction.x, y: newSquare.y + direction.y}
          const newPiece2 = this.board[newSquare2.y][newSquare2.x]
          if (newPiece2 === 0) {
            legalMoves.push(newSquare2)
          }
        }
      })
    } else if (this.board[y][x] === 2 && this.turn === 1) {
      const directions = [
        {x: -1, y: 1},
        {x: 1, y: 1},
      ]
      directions.forEach((direction) => {
        const newSquare = {x: x + direction.x, y: y + direction.y}
        const newPiece = this.board[newSquare.y][newSquare.x]
        if (newPiece === 0) {
          legalMoves.push(newSquare)
        } else if (newPiece === 1) {
          const newSquare2 = {x: newSquare.x + direction.x, y: newSquare.y + direction.y}
          const newPiece2 = this.board[newSquare2.y][newSquare2.x]
          if (newPiece2 === 0) {
            legalMoves.push(newSquare2)
          }
        }
      })
    }
    user.socket.emit("legalMoves", legalMoves)
  }

  makeMove(from: {x: number, y: number}, to: {x: number, y: number}, io: Server) {
    const piece = this.board[from.y][from.x]
    const distanceX = to.x - from.x
    const distanceY = to.y - from.y
    this.board[from.y][from.x] = 0
    this.board[to.y][to.x] = piece
    if (Math.abs(distanceX) === 2 && Math.abs(distanceY) === 2) {
      const jumpedPiece = this.board[from.y + distanceY / 2][from.x + distanceX / 2]
      this.board[from.y + distanceY / 2][from.x + distanceX / 2] = 0
      io.to("game").emit("capture", {x: from.x + distanceX / 2, y: from.y + distanceY / 2})
    }
    io.to("game").emit("move", {from, to})
    this.turn = this.turn === 0 ? 1 : 0
  }
}
