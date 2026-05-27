import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const bounds = new THREE.Box3();

function loadModel(path) {
  return new Promise((resolve) => {
    loader.load(
      path,
      (gltf) => resolve(gltf.scene),
      undefined,
      () => resolve(null),
    );
  });
}

function prepareModel(model, scale = 1) {
  model.scale.setScalar(scale);
  model.traverse((child) => {
    if (!child.isMesh) return;

    child.castShadow = true;
    child.receiveShadow = true;
  });

  model.updateMatrixWorld(true);
  bounds.setFromObject(model);
  model.children.forEach((child) => {
    child.position.y -= bounds.min.y;
  });

  return model;
}

function createPlayerFallback() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.34, 0.64, 6, 12),
    new THREE.MeshStandardMaterial({ color: 0x42d6a4, roughness: 0.58 }),
  );
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 20, 16),
    new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.45 }),
  );

  body.position.y = 0.68;
  head.position.y = 1.32;
  group.add(body, head);

  return group;
}

function createEnemyFallback() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.42, 1.1, 7),
    new THREE.MeshStandardMaterial({ color: 0xf25f5c, roughness: 0.7 }),
  );

  body.position.y = 0.55;
  group.add(body);

  return group;
}

function createHouseFallback() {
  const group = new THREE.Group();
  const walls = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 1.25, 1.6),
    new THREE.MeshStandardMaterial({ color: 0xd7b58a, roughness: 0.9 }),
  );
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(1.35, 0.8, 4),
    new THREE.MeshStandardMaterial({ color: 0x7f4f24, roughness: 0.75 }),
  );

  walls.position.y = 0.63;
  roof.position.y = 1.62;
  roof.rotation.y = Math.PI * 0.25;
  group.add(walls, roof);

  return group;
}

export async function loadGameAssets() {
  const [playerModel, enemyModel, houseModel] = await Promise.all([
    loadModel('/models/tode.glb'),
    loadModel('/models/enemy.glb'),
    loadModel('/models/small_house.glb'),
  ]);

  return {
    createPlayer() {
      return prepareModel((playerModel || createPlayerFallback()).clone(true), playerModel ? 0.85 : 1);
    },
    createEnemy() {
      return prepareModel((enemyModel || createEnemyFallback()).clone(true), enemyModel ? 0.75 : 1);
    },
    createHouse() {
      return prepareModel((houseModel || createHouseFallback()).clone(true), houseModel ? 0.95 : 1);
    },
  };
}
