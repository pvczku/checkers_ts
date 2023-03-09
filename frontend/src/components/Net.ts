import { io, Socket } from "socket.io-client";
import Game from "./Game";
import UI from "./UI";

export default class Net {
  game: Game;
  ui: UI;
  socket: Socket | null = null;
  constructor(game: Game, ui: UI) {
    this.game = game;
    this.ui = ui;
  }

  startGame(username: string) {
    this.socket = io("", {
      path: "/socket.io",
      query: {
        username
      }
    })
  }

  resetGame() {
    fetch("/api/reset", {
      method: "POST",
    });
  }
}
