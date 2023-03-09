export default class UI {
  loginBg: HTMLElement;
  loginInput: HTMLInputElement;
  loginButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  addUser: ((user: string) => void) | null = null;
  resetGame: (() => void) | null = null;
  constructor() {
    this.loginBg = document.getElementById("login-bg")!;
    this.loginInput = document.getElementById("login") as HTMLInputElement;
    this.loginButton = document.getElementById(
      "loginButton"
    ) as HTMLButtonElement;
    this.resetButton = document.getElementById(
      "resetButton"
    ) as HTMLButtonElement;
    this.handleLogin();
    this.handleReset();
  }

  private handleLogin() {
    if (!this.loginInput.value) return;
    this.loginButton.onclick = () => {
      if (this.addUser) {
        this.addUser!(this.loginInput.value);
        const waiting = document.createElement("div")
        waiting.classList.add("waiting")
        waiting.innerText = "Waiting for other player..."
        document.body.appendChild(waiting)
        document.querySelector("#app")!.remove()
      }
    };
  }

  private handleReset() {
    this.resetButton.onclick = () => {
      if (this.resetGame) {
        this.resetGame();
      }
    };
  }
}
