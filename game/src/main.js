import * as THREE from 'three';
import './style.css';
import { loadGameAssets } from './components/assets.js';
import { createInput } from './components/input.js';
import { createHud } from './components/ui.js';
import { createWorld } from './components/world.js';

const canvas = document.querySelector('.game');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
});
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
const clock = new THREE.Clock();
const input = createInput();

let player;
let world;
let hud;
let game;
const playerVelocity = new THREE.Vector3();
const moveDirection = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();
const cameraOffset = new THREE.Vector3(0, 7.5, 10);

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
camera.position.set(0, 7.5, 12);

loadGameAssets().then((assets) => {
  player = assets.createPlayer();
  scene.add(player);

  world = createWorld(scene, assets);
  hud = createHud(resetGame);
  resetGame();
  resize();
  animate();
});

function resetGame() {
  player.position.set(0, 0, -world.arenaSize * 0.5 + 3.2);
  player.rotation.set(0, 0, 0);
  playerVelocity.set(0, 0, 0);

  world.crystals.forEach((crystal) => {
    crystal.collected = false;
    crystal.mesh.visible = true;
  });

  world.enemies.forEach((enemy) => {
    enemy.mesh.position.copy(enemy.home);
    enemy.cooldown = 0;
  });

  game = {
    status: 'playing',
    health: 3,
    collected: 0,
    totalCrystals: world.crystals.length,
    elapsed: 0,
  };

  hud.update(game);
}

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.033);

  if (input.consumeRestart()) {
    resetGame();
  }

  if (game.status === 'playing') {
    game.elapsed += delta;
    updatePlayer(delta);
    updateCrystals(delta);
    updateEnemies(delta);
    updateGoal(delta);
  } else {
    player.rotation.y += delta * 0.9;
  }

  updateCamera(delta);
  hud.update(game);
  renderer.render(scene, camera);
}

function updatePlayer(delta) {
  moveDirection.set(0, 0, 0);

  if (input.state.forward) moveDirection.z -= 1;
  if (input.state.backward) moveDirection.z += 1;
  if (input.state.left) moveDirection.x -= 1;
  if (input.state.right) moveDirection.x += 1;

  if (moveDirection.lengthSq() > 0) {
    moveDirection.normalize();
    const speed = input.state.sprint ? 7 : 5.2;
    playerVelocity.copy(moveDirection).multiplyScalar(speed);
    player.rotation.y = Math.atan2(playerVelocity.x, playerVelocity.z);
  } else {
    playerVelocity.multiplyScalar(Math.max(0, 1 - delta * 12));
  }

  const nextPosition = player.position.clone().addScaledVector(playerVelocity, delta);
  const edgeLimit = world.arenaSize * 0.5 - 1.6;
  nextPosition.x = THREE.MathUtils.clamp(nextPosition.x, -edgeLimit, edgeLimit);
  nextPosition.z = THREE.MathUtils.clamp(nextPosition.z, -edgeLimit, edgeLimit);

  if (!hitsObstacle(nextPosition, 0.82)) {
    player.position.copy(nextPosition);
  } else {
    playerVelocity.multiplyScalar(0.25);
  }

  const stepLift = Math.min(playerVelocity.length() * 0.01, 0.055);
  player.position.y = (Math.sin(game.elapsed * 9) + 1) * 0.5 * stepLift;
}

function hitsObstacle(position, radius) {
  return world.obstacles.some((obstacle) => {
    const dx = position.x - obstacle.position.x;
    const dz = position.z - obstacle.position.z;
    return Math.hypot(dx, dz) < radius + obstacle.radius;
  });
}

function updateCrystals(delta) {
  world.crystals.forEach((crystal, index) => {
    if (crystal.collected) return;

    crystal.mesh.rotation.y += delta * (1.8 + index * 0.1);
    crystal.mesh.position.y = 0.78 + Math.sin(game.elapsed * 2.8 + index) * 0.16;

    if (distance2D(player.position, crystal.mesh.position) < 1.25) {
      crystal.collected = true;
      crystal.mesh.visible = false;
      game.collected += 1;
    }
  });
}

function updateEnemies(delta) {
  world.enemies.forEach((enemy, index) => {
    enemy.cooldown = Math.max(0, enemy.cooldown - delta);

    const toPlayer = player.position.clone().sub(enemy.mesh.position);
    const distance = Math.hypot(toPlayer.x, toPlayer.z);
    const target = distance < 9
      ? player.position
      : enemy.home.clone().add(new THREE.Vector3(
        Math.cos(game.elapsed * 0.8 + enemy.phase) * 3.2,
        0,
        Math.sin(game.elapsed * 0.9 + enemy.phase) * 2.5,
      ));
    const direction = target.clone().sub(enemy.mesh.position);
    direction.y = 0;

    if (direction.lengthSq() > 0.01) {
      direction.normalize();
      enemy.mesh.position.addScaledVector(direction, enemy.speed * delta);
      enemy.mesh.rotation.y = Math.atan2(direction.x, direction.z);
    }

    enemy.mesh.position.y = (Math.sin(game.elapsed * 5 + index) + 1) * 0.025;

    if (distance < 1.25 && enemy.cooldown === 0) {
      game.health -= 1;
      enemy.cooldown = 1.35;
      player.position.addScaledVector(toPlayer.normalize(), 1.3);

      if (game.health <= 0) {
        game.status = 'lost';
      }
    }
  });
}

function updateGoal(delta) {
  world.goal.rotation.y += delta * 0.8;

  if (game.collected === game.totalCrystals && distance2D(player.position, world.goal.position) < 1.8) {
    game.status = 'won';
  }
}

function updateCamera(delta) {
  cameraTarget.copy(player.position).add(cameraOffset);
  camera.position.lerp(cameraTarget, 1 - Math.pow(0.001, delta));
  camera.lookAt(player.position.x, player.position.y + 0.9, player.position.z);
}

function distance2D(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', resize);
