import Game from "./components/Game";
import UI from "./components/UI";
import Net from "./components/Net";
import "./scss/style.scss";

const game = new Game();
const ui = new UI();
const net = new Net(game, ui);

ui.addUser = startGame;
ui.resetGame = resetGame;

function startGame(username: string) {
    net.startGame(username);
}

function resetGame() {
    net.resetGame();
}
