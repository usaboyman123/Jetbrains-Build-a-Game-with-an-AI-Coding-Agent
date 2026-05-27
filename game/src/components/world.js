import * as THREE from 'three';

const arenaSize = 38;
const crystalPositions = [
  [-10, -9],
  [8, -12],
  [-13, 4],
  [12, 3],
  [-4, 12],
  [10, 13],
];
const enemyPositions = [
  [-9, 8],
  [10, -4],
  [2, 11],
];

export function createWorld(scene, assets) {
  const obstacles = [];
  const crystals = [];
  const enemies = [];

  scene.background = new THREE.Color(0x9ecfe5);
  scene.fog = new THREE.Fog(0x9ecfe5, 22, 56);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(arenaSize, arenaSize, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x6bbf70, roughness: 0.92 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const path = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, arenaSize - 4),
    new THREE.MeshStandardMaterial({ color: 0xcaa472, roughness: 1 }),
  );
  path.rotation.x = -Math.PI / 2;
  path.position.y = 0.01;
  scene.add(path);

  addLights(scene);
  addBoundaries(scene);
  addVillage(scene, assets, obstacles);
  addCrystals(scene, crystals);
  addEnemies(scene, assets, enemies);

  const goal = createGoal();
  goal.position.set(0, 0, arenaSize * 0.5 - 3.1);
  scene.add(goal);

  return {
    arenaSize,
    obstacles,
    crystals,
    enemies,
    goal,
  };
}

function addLights(scene) {
  const hemisphere = new THREE.HemisphereLight(0xdff6ff, 0x31553d, 1.6);
  scene.add(hemisphere);

  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(-9, 16, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 50;
  sun.shadow.camera.left = -24;
  sun.shadow.camera.right = 24;
  sun.shadow.camera.top = 24;
  sun.shadow.camera.bottom = -24;
  scene.add(sun);
}

function addBoundaries(scene) {
  const material = new THREE.MeshStandardMaterial({ color: 0x3d6043, roughness: 0.85 });
  const geometry = new THREE.BoxGeometry(arenaSize, 1.1, 0.7);
  const north = new THREE.Mesh(geometry, material);
  const south = north.clone();
  const east = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, arenaSize), material);
  const west = east.clone();
  const edge = arenaSize * 0.5;

  north.position.set(0, 0.55, -edge);
  south.position.set(0, 0.55, edge);
  east.position.set(edge, 0.55, 0);
  west.position.set(-edge, 0.55, 0);
  scene.add(north, south, east, west);
}

function addVillage(scene, assets, obstacles) {
  const houseSpots = [
    [-14, -13, 0.2],
    [13, -11, -0.45],
    [-13, 13, 0.85],
    [14, 10, -0.75],
    [-8, -1, 0.4],
    [8, 7, -0.25],
  ];

  houseSpots.forEach(([x, z, rotation]) => {
    const house = assets.createHouse();
    house.position.set(x, 0, z);
    house.rotation.y = rotation;
    scene.add(house);
    obstacles.push({ position: house.position, radius: 2.2 });
  });

  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.95 });
  const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x2f7d49, roughness: 0.8 });
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x805533, roughness: 0.88 });

  for (let i = 0; i < 20; i += 1) {
    const angle = i * 1.73;
    const radius = 13 + (i % 4) * 1.4;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    if (Math.abs(x) < 3.2) continue;

    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.95, 8), trunkMaterial);
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.45, 9), treeMaterial);
    trunk.position.y = 0.48;
    crown.position.y = 1.45;
    tree.add(trunk, crown);
    tree.position.set(x, 0, z);
    scene.add(tree);
    obstacles.push({ position: tree.position, radius: 0.9 });
  }

  for (let i = 0; i < 8; i += 1) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.58 + (i % 3) * 0.12), rockMaterial);
    rock.position.set(-15 + i * 4.2, 0.5, i % 2 === 0 ? -5.5 : 5.8);
    rock.rotation.set(i, i * 0.6, 0);
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
    obstacles.push({ position: rock.position, radius: 0.9 });
  }
}

function addCrystals(scene, crystals) {
  const material = new THREE.MeshStandardMaterial({
    color: 0x73fbd3,
    emissive: 0x1aa884,
    emissiveIntensity: 0.65,
    roughness: 0.25,
    metalness: 0.15,
  });

  crystalPositions.forEach(([x, z]) => {
    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.46, 0), material);
    crystal.position.set(x, 0.78, z);
    crystal.castShadow = true;
    scene.add(crystal);
    crystals.push({ mesh: crystal, collected: false });
  });
}

function addEnemies(scene, assets, enemies) {
  enemyPositions.forEach(([x, z], index) => {
    const enemy = assets.createEnemy();
    enemy.position.set(x, 0, z);
    scene.add(enemy);
    enemies.push({
      mesh: enemy,
      home: new THREE.Vector3(x, 0, z),
      speed: 1.65 + index * 0.22,
      phase: index * 2.1,
      cooldown: 0,
    });
  });
}

function createGoal() {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.55, 0.12, 12, 32),
    new THREE.MeshStandardMaterial({
      color: 0xffe66d,
      emissive: 0xffb703,
      emissiveIntensity: 0.7,
      roughness: 0.32,
    }),
  );
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.1, 1.3, 0.18, 28),
    new THREE.MeshStandardMaterial({ color: 0x264653, roughness: 0.8 }),
  );

  ring.position.y = 1.72;
  ring.rotation.x = Math.PI * 0.5;
  base.position.y = 0.09;
  group.add(base, ring);

  return group;
}
