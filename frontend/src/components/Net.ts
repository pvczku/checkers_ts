import { io, Socket } from "socket.io-client";
import Game from "./Game";
import UI from "./UI";

export default class Net {
  game: Game;
  ui: UI;
  static socket: Socket | null = null;
  constructor(game: Game, ui: UI) {
    this.game = game;
    this.ui = ui;
    this.game.showLegalMoves = this.showLegalMoves;
    this.game.playMove = this.playMove;
  }

  startGame(username: string) {
    Net.socket = io("", {
      path: "/socket.io",
      query: {
        username,
      },
    });
    Net.socket.on("legalMoves", (data) => {
      this.game.board.showLegalMoves(data);
    });
    Net.socket.on("move", (data) => {
      this.game.board.movePawn(data.from, data.to);
    });
    Net.socket.on("capture", (data) => {
      this.game.board.capturePawn(data);
    });
    Net.socket.on("start", () => {
      document.querySelector(".waiting")!.remove()
    })
    Net.socket.on("color", (data) => {
      this.game.color = data;
      if (data === "white") {
        this.game.scene.camera.position.set(0, 12, 12)
      } else {
        this.game.scene.camera.position.set(0, 12, -12)
      }
      this.game.scene.camera.lookAt(0, 0, 0);
    })
  }

  showLegalMoves(x: number, y: number) {
    if (Net.socket) {
      Net.socket.emit("showLegalMoves", { x, y });
    }
  }

  playMove(from: { x: number; y: number }, to: { x: number; y: number }) {
    if (Net.socket) {
      Net.socket.emit("playMove", { from, to });
    }
  }

  resetGame() {
    fetch("/api/reset", {
      method: "POST",
    });
  }
}
