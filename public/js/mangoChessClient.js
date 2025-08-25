let cam_spectator;
let cam_player_1;
let cam_player_2;
let cam_player_3;
let cam_player_4;

const cols = 10;
const rows = 10;
const cellSize = 100;
const grid = new Array(cols);

let socket;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  // Initialize grid
  for (let i = 0; i < cols; i++) {
    grid[i] = new Array(rows);
    for (let j = 0; j < rows; j++) {
      grid[i][j] = {
        x: (-cols / 2 + i + 0.5) * cellSize,
        z: (-rows / 2 + j + 0.5) * cellSize,
        hover: false,
      };
    }
  }

  setUpCameras();
  setCamera(cam_player_1);

  socket = io();
  angleMode(DEGREES);
  strokeWeight(2);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(238, 233, 219);

  orbitControl();

  // Draw board
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      push();
      translate(grid[i][j].x, 0, grid[i][j].z);
      fill(
        grid[i][j].hover ? color(255, 200, 0) : (i + j) % 2 === 0 ? 255 : 150
      );
      box(cellSize, 15, cellSize);
      pop();
    }
  }

  updateHover();
}

function updateHover() {
  // Reset hover flags
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) grid[i][j].hover = false;

  // Camera position (E), look target (C), and up vector (Uworld)
  const E = createVector(cam_player_1.eyeX, cam_player_1.eyeY, cam_player_1.eyeZ);
  const C = (cam_player_1.centerX !== undefined)
    ? createVector(cam_player_1.centerX, cam_player_1.centerY, cam_player_1.centerZ)
    : createVector(0, 0, 0); // default orbit center
  const Uworld = (cam_player_1.upX !== undefined)
    ? createVector(cam_player_1.upX, cam_player_1.upY, cam_player_1.upZ)
    : createVector(0, 1, 0);

  // Camera basis: forward (F), right (R), true up (U)
  const F = p5.Vector.sub(C, E).normalize();
  const R = p5.Vector.cross(F, Uworld).normalize();
  const U = p5.Vector.cross(R, F).normalize();

  // Mouse -> NDC
  const nx = (mouseX / width) * 2 - 1;
  const ny = 1 - (mouseY / height) * 2;

  // Projection params (match your perspective() if different)
  const aspect = width / height;
  const fovDeg = 60;                         // default p5 perspective FOV
  const h = Math.tan(radians(fovDeg) / 2);   // use Math.tan to avoid angleMode issues
  const w = h * aspect;

  // Ray direction in world space
  const dir = p5.Vector.add(
    p5.Vector.add(F, p5.Vector.mult(R, nx * w)),
    p5.Vector.mult(U, -ny * h)
  ).normalize();

  // Ray-plane (y=0) intersection
  const denom = dir.y;
  if (Math.abs(denom) < 1e-6) return;        // parallel to plane
  const t = -E.y / denom;
  if (t <= 0) return;                        // hits behind camera

  const P = p5.Vector.add(E, p5.Vector.mult(dir, t));

  // Hit test grid cell at intersection P (x,z)
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const dx = P.x - grid[i][j].x;
      const dz = P.z - grid[i][j].z;
      if (Math.abs(dx) < cellSize / 2 && Math.abs(dz) < cellSize / 2) {
        grid[i][j].hover = true;
      }
    }
  }
}


function setUpCameras() {
  cam_spectator = createCamera();

  cam_player_1 = createCamera();
  cam_player_1.setPosition(0, -800, 800);
  cam_player_1.lookAt(0, 0, 0);

  // Optional: define more player cameras similarly
}

function doubleClicked() {
  console.log(cam_player_1.eyeX, cam_player_1.eyeY, cam_player_1.eyeZ);
  console.log(cam_player_1);
}
