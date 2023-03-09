import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";

export default class Game {
  scene: Scene;
  raycaster: Raycaster;
  board: Board;

  showLegalMoves:
    | ((x: number, y: number) => void)
    | null = null;
  playMove:
    | ((from: { x: number; y: number }, to: { x: number; y: number }) => void)
    | null = null;

  selectedPawn: THREE.Object3D | null = null;

  color: "white" | "black" = "white";

  constructor() {
    const root = document.querySelector<HTMLElement>("#root")!;

    this.scene = new Scene(root);
    this.raycaster = new Raycaster(this.scene.camera, this.scene.scene);
    this.board = new Board(this.scene.scene);

    window.onclick = (e) => {
        const object = this.raycaster.handleClick(e);
        if (!object) return;
        
        console.log(object.userData.available)
        
        if (object.name === "Pawn" && object.userData.color === this.color) {
            
            this.selectedPawn = object;
        const material = (object as THREE.Mesh)
          .material as THREE.MeshPhongMaterial;
        material.emissive.setHex(0xffff00);
        if (this.showLegalMoves) {
            this.showLegalMoves(object.userData.position.x, object.userData.position.y)
        }
      } else if (object.name === "BoardPart" && object.userData.available && this.selectedPawn) {
        console.log("kutas")
        if (this.playMove){
            this.playMove(this.selectedPawn.userData.position, object.userData.position);
        }
        this.board.hideLegalMoves();
        this.selectedPawn = null;
      }
    };

    this.scene.renderer.setAnimationLoop(this.render.bind(this));
  }

  render() {
    TWEEN.update();
    this.scene.renderer.render(this.scene.scene, this.scene.camera);
  }
}

class Scene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      30,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 12, 12);
    this.camera.lookAt(0, 0, 0);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    const light = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(light);

    this.scene.background = new THREE.Color(0x444444);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    window.onresize = this.handleResize.bind(this);
    container.appendChild(this.renderer.domElement);
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

class Raycaster extends THREE.Raycaster {
  camera: THREE.Camera;
  scene: THREE.Scene;
  mouseVector: THREE.Vector2;
  constructor(camera: THREE.Camera, scene: THREE.Scene) {
    super();
    this.camera = camera;
    this.scene = scene;
    this.mouseVector = new THREE.Vector2();
  }
  handleClick(e: MouseEvent) {
    this.mouseVector.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouseVector.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.setFromCamera(this.mouseVector, this.camera);
    const intersects = this.intersectObjects(this.scene.children);
    if (!intersects.length) return;
    return intersects[0].object;
  }
}

class Board extends THREE.Object3D {
  board: number[][] = [
    [2, 0, 2, 0, 2, 0, 2, 0],
    [0, 2, 0, 2, 0, 2, 0, 2],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 1, 0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0, 1, 0, 1],
  ];
  constructor(scene: THREE.Scene) {
    super();
    this.createBoard();
    this.createPawns();
    this.position.set(-3.5, 0, -3.5);
    scene.add(this);
  }

  createBoard() {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        let color: "white" | "black" = "white";
        if ((x + y) % 2 === 0) color = "black";
        const boardPart = new BoardPart(color, x, y);
        this.add(boardPart);
      }
    }
  }

  createPawns() {
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        if (this.board[y][x] === 1) {
          const pawn = new Pawn("white", x, y);
          this.add(pawn);
        }
        if (this.board[y][x] === 2) {
          const pawn = new Pawn("black", x, y);
          this.add(pawn);
        }
      }
    }
  }

  movePawn(from: { x: number; y: number }, to: { x: number; y: number }) {
    const pawn = this.children.find(
        (child) =>
            child.name === "Pawn" &&
            child.userData.position.x === from.x &&
            child.userData.position.y === from.y
    ) as Pawn;
    new TWEEN.Tween(pawn.position).to(
      {
        x: to.x,
        y: 0.65,
        z: to.y,
      },
      500
    )
    .easing(TWEEN.Easing.Quadratic.Out)
    .start();
    pawn.userData.position.x = to.x;
    pawn.userData.position.y = to.y;
  }

  capturePawn(from: { x: number; y: number }) {
    console.log(from)
    const pawn = this.children.find(
        (child) =>
            child.name === "Pawn" &&
            child.userData.position.x === from.x &&
            child.userData.position.y === from.y
    ) as Pawn;
    this.remove(pawn)
  }

  showLegalMoves(
    legalMoves: { x: number; y: number }[],
  ) {
    const BoardParts = this.children.filter(
        (child) => child.name === "BoardPart"
    );
    BoardParts.forEach((boardPart) => {
        if (legalMoves.some((move) => move.x === boardPart.userData.position.x && move.y === boardPart.userData.position.y)) {
            (
            (boardPart as BoardPart).material as THREE.MeshPhongMaterial
            ).emissive.set(0x00ff00);
            boardPart.userData.available = true;
        }
        });
  }

  hideLegalMoves() {
    const BoardParts = this.children.filter(
      (child) => child.name === "BoardPart"
    );
    BoardParts.forEach((boardPart) => {
      (
        (boardPart as BoardPart).material as THREE.MeshPhongMaterial
      ).emissive.set(0x000000);
      boardPart.userData.available = false;
    });

    const Pawns = this.children.filter((child) => child.name === "Pawn");
    Pawns.forEach((pawn) => {
        (
            (pawn as Pawn).material as THREE.MeshPhongMaterial
          ).emissive.set(0x000000);
    });
  }
}

class Pawn extends THREE.Mesh {
  constructor(color: "white" | "black", x: number, y: number) {
    super();
    this.geometry = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 32);
    this.material = new THREE.MeshPhongMaterial({
      color: color === "white" ? 0xffffff : 0xc60000,
    });
    this.position.set(x, 0.65, y);
    this.name = "Pawn";
    this.userData = {
      position: {
        x,
        y,
      },
      color,
    };
  }
}

class BoardPart extends THREE.Mesh {
  constructor(color: "white" | "black", x: number, y: number) {
    super();
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.material = new THREE.MeshPhongMaterial({
      side: THREE.DoubleSide,
      map: new THREE.TextureLoader().load(`./src/assets/${color}.jpg`),
    });
    this.position.set(x, 0, y);
    this.name = "BoardPart";
    this.userData = {
      position: {
        x,
        y,
      },
      available: false,
    };
  }
}

// Path: index.ts
