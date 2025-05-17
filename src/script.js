// scene.js
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import GUI from "lil-gui";
import waterVertexShader from "./shaders/water/vertex.glsl";
import waterFragmentShader from "./shaders/water/fragment.glsl";

// Base scene setup
const canvas = document.querySelector("canvas.webgl");
const scene = new THREE.Scene();

// Environment Map
const cubeTextureLoader = new THREE.CubeTextureLoader();
const environmentMap = cubeTextureLoader.load([
  "px.png", // positive x
  "nx.png", // negative x
  "py.png", // positive y
  "ny.png", // negative y
  "pz.png", // positive z
  "nz.png", // negative z
]);
scene.background = environmentMap;
scene.environment = environmentMap; // This enables PBR materials to use the environment map for reflections

// Debug GUI
const gui = new GUI({ width: 340 });
const debugObject = {
  depthColor: "#186691",
  surfaceColor: "#9bd8ff",
  fogColor: "#88bfd8",
  fogNear: 5,
  fogFar: 30,
};

// Add fog to the scene
scene.fog = new THREE.Fog(debugObject.fogColor, debugObject.fogNear, debugObject.fogFar);

// Water texture
const textureLoader = new THREE.TextureLoader();
const poolTexture = textureLoader.load("/ocean_floor.png");
poolTexture.wrapS = THREE.RepeatWrapping;
poolTexture.wrapT = THREE.RepeatWrapping;
poolTexture.repeat.set(8, 8);

// Water mesh
const waterGeometry = new THREE.PlaneGeometry(50, 50, 512, 512);
const waterMaterial = new THREE.ShaderMaterial({
  vertexShader: waterVertexShader,
  fragmentShader: waterFragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uBigWavesElevation: { value: 0.09 },
    uBigWavesFrequency: { value: new THREE.Vector2(2.289, 1.206) },
    uBigWavesSpeed: { value: 1.07 },
    uSmallWavesElevation: { value: 0.19 },
    uSmallWavesFrequency: { value: 2.227 },
    uSmallWavesSpeed: { value: 1.132 },
    uSmallIterations: { value: 3 },
    uDepthColor: { value: new THREE.Color(debugObject.depthColor) },
    uSurfaceColor: { value: new THREE.Color(debugObject.surfaceColor) },
    uColorOffset: { value: 0.105 },
    uColorMultiplier: { value: 4.455 },
    uTexture: { value: poolTexture },
  },
  side: THREE.DoubleSide,
});
const water = new THREE.Mesh(waterGeometry, waterMaterial);
water.rotation.x = -Math.PI / 2;
water.position.y = -0.1; // Slightly lower for better boat floating effect
scene.add(water);

// GUI controls for water
const waterFolder = gui.addFolder("Water");
waterFolder
  .addColor(debugObject, "depthColor")
  .name("Depth Color")
  .onChange((val) => waterMaterial.uniforms.uDepthColor.value.set(val));
waterFolder
  .addColor(debugObject, "surfaceColor")
  .name("Surface Color")
  .onChange((val) => waterMaterial.uniforms.uSurfaceColor.value.set(val));
waterFolder.add(waterMaterial.uniforms.uBigWavesElevation, "value").min(0).max(1).step(0.001).name("Big Waves Height");
waterFolder
  .add(waterMaterial.uniforms.uBigWavesFrequency.value, "x")
  .min(0)
  .max(10)
  .step(0.001)
  .name("Big Waves Frequency X");
waterFolder
  .add(waterMaterial.uniforms.uBigWavesFrequency.value, "y")
  .min(0)
  .max(10)
  .step(0.001)
  .name("Big Waves Frequency Z");
waterFolder.add(waterMaterial.uniforms.uBigWavesSpeed, "value").min(0).max(4).step(0.001).name("Big Waves Speed");
waterFolder
  .add(waterMaterial.uniforms.uSmallWavesElevation, "value")
  .min(0)
  .max(1)
  .step(0.001)
  .name("Small Waves Height");
waterFolder
  .add(waterMaterial.uniforms.uSmallWavesFrequency, "value")
  .min(0)
  .max(30)
  .step(0.001)
  .name("Small Waves Frequency");
waterFolder.add(waterMaterial.uniforms.uSmallWavesSpeed, "value").min(0).max(4).step(0.001).name("Small Waves Speed");
waterFolder.add(waterMaterial.uniforms.uSmallIterations, "value").min(0).max(5).step(1).name("Small Waves Detail");
waterFolder.add(waterMaterial.uniforms.uColorOffset, "value").min(0).max(1).step(0.001).name("Color Offset");
waterFolder.add(waterMaterial.uniforms.uColorMultiplier, "value").min(0).max(10).step(0.001).name("Color Multiplier");

// Fog GUI
const fogFolder = gui.addFolder("Fog");
fogFolder
  .addColor(debugObject, "fogColor")
  .name("Fog Color")
  .onChange((val) => {
    scene.fog.color.set(val);
  });
fogFolder
  .add(debugObject, "fogNear")
  .min(1)
  .max(50)
  .step(0.1)
  .name("Fog Near")
  .onChange((val) => {
    scene.fog.near = val;
  });
fogFolder
  .add(debugObject, "fogFar")
  .min(5)
  .max(100)
  .step(0.1)
  .name("Fog Far")
  .onChange((val) => {
    scene.fog.far = val;
  });

// Sizes & camera
const sizes = { width: window.innerWidth, height: window.innerHeight };
window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Camera setup
const camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 0.1, 100);
camera.position.set(0, 5, -10);
scene.add(camera);

// Controls (will be disabled once boat is loaded)
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent seeing below the water
controls.minDistance = 2;
controls.maxDistance = 15;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(5, 10, 2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
scene.add(directionalLight);

// Game state
const gameState = {
  boatSpeed: 0,
  maxBoatSpeed: 10,
  boatAcceleration: 8,
  boatDeceleration: 3,
  boatRotationSpeed: Math.PI * 0.8,
  cameraMode: "thirdPerson", // "firstPerson", "thirdPerson", "orbital"
  cameraHeight: 3,
  cameraDistance: 7,
  cameraDampingFactor: 3,
};

// Game controls GUI
const gameFolder = gui.addFolder("Game Controls");
gameFolder.add(gameState, "maxBoatSpeed").min(1).max(20).step(0.5).name("Max Boat Speed");
gameFolder.add(gameState, "boatAcceleration").min(1).max(20).step(0.5).name("Boat Acceleration");
gameFolder.add(gameState, "boatRotationSpeed").min(0.1).max(5).step(0.1).name("Boat Rotation Speed");
gameFolder.add(gameState, "cameraMode", ["firstPerson", "thirdPerson", "orbital"]).name("Camera Mode");
gameFolder.add(gameState, "cameraHeight").min(0.5).max(10).step(0.1).name("Camera Height");
gameFolder.add(gameState, "cameraDistance").min(0).max(15).step(0.5).name("Camera Distance");
gameFolder.add(gameState, "cameraDampingFactor").min(0.1).max(10).step(0.1).name("Camera Smoothness");

// Load boat model
let boatMesh;
const boatLoader = new GLTFLoader();
boatLoader.load("/models/boat_fishing.glb", (gltf) => {
  boatMesh = gltf.scene;
  boatMesh.scale.set(0.12, 0.12, 0.12);
  boatMesh.position.set(0, 0.2, 0);

  // Make boat cast shadows
  boatMesh.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;

      // Apply environment map to metallic parts
      if (child.material) {
        child.material.envMap = environmentMap;
        child.material.envMapIntensity = 1;
      }
    }
  });

  scene.add(boatMesh);

  // Disable orbital controls when using the boat
  controls.enabled = false;

  // Start the game loop
  startGameLoop();
});

// Keyboard controls
const keys = {};
window.addEventListener("keydown", (e) => (keys[e.code] = true));
window.addEventListener("keyup", (e) => (keys[e.code] = false));

// Camera positions (for tracking desired vs actual)
const cameraPositionTarget = new THREE.Vector3();
const cameraLookAtTarget = new THREE.Vector3();

// Game loop
function startGameLoop() {
  const clock = new THREE.Clock();
  const velocity = new THREE.Vector3();
  let boatHeight = 0;

  function animate() {
    const deltaTime = Math.min(clock.getDelta(), 0.1); // Cap delta time for stability

    // Update water shader time
    waterMaterial.uniforms.uTime.value += deltaTime;

    if (boatMesh) {
      // Handle boat rotation
      if (keys.KeyA || keys.ArrowLeft) {
        boatMesh.rotation.y += gameState.boatRotationSpeed * deltaTime;
      }
      if (keys.KeyD || keys.ArrowRight) {
        boatMesh.rotation.y -= gameState.boatRotationSpeed * deltaTime;
      }

      // Handle boat acceleration/deceleration
      if (keys.KeyW || keys.ArrowUp) {
        gameState.boatSpeed = Math.min(
          gameState.boatSpeed + gameState.boatAcceleration * deltaTime,
          gameState.maxBoatSpeed
        );
      } else if (keys.KeyS || keys.ArrowDown) {
        gameState.boatSpeed = Math.max(
          gameState.boatSpeed - gameState.boatAcceleration * deltaTime,
          -gameState.maxBoatSpeed * 0.5
        );
      } else {
        // Natural deceleration when no keys are pressed
        if (Math.abs(gameState.boatSpeed) < 0.1) {
          gameState.boatSpeed = 0;
        } else if (gameState.boatSpeed > 0) {
          gameState.boatSpeed -= gameState.boatDeceleration * deltaTime;
        } else {
          gameState.boatSpeed += gameState.boatDeceleration * deltaTime;
        }
      }

      // Apply velocity in the direction the boat is facing
      const direction = new THREE.Vector3(0, 0, -1).applyEuler(boatMesh.rotation);
      velocity.copy(direction).multiplyScalar(gameState.boatSpeed * deltaTime);
      boatMesh.position.add(velocity);

      // Calculate boat height based on water waves
      // This is a simplified version - in a real game, you'd use the wave shader to calculate actual height
      const time = waterMaterial.uniforms.uTime.value;
      const wavesElevation = waterMaterial.uniforms.uBigWavesElevation.value;
      const wavesFrequency = waterMaterial.uniforms.uBigWavesFrequency.value;
      const x = boatMesh.position.x;
      const z = boatMesh.position.z;

      // Sample a point in the wave pattern
      boatHeight =
        wavesElevation *
        Math.sin(x * wavesFrequency.x + time * waterMaterial.uniforms.uBigWavesSpeed.value) *
        Math.sin(z * wavesFrequency.y + time * waterMaterial.uniforms.uBigWavesSpeed.value);

      // Add small random variation for realistic motion
      boatHeight += Math.sin(time * 5) * 0.02;

      // Apply height to boat position
      boatMesh.position.y = 0.2 + boatHeight;

      // Apply slight pitch and roll based on movement
      const pitchFactor = gameState.boatSpeed * 0.01;
      const rollFactor = -velocity.x * 0.3;

      boatMesh.rotation.x = pitchFactor * Math.min(1, Math.abs(gameState.boatSpeed / 5));
      boatMesh.rotation.z = rollFactor * Math.min(0.2, Math.abs(velocity.x * 5));

      // Update camera position based on selected mode
      if (gameState.cameraMode === "firstPerson") {
        // First-person camera - positioned at the boat looking forward
        cameraPositionTarget.set(
          boatMesh.position.x,
          boatMesh.position.y + gameState.cameraHeight * 0.5,
          boatMesh.position.z
        );

        // Look in the direction the boat is facing
        const lookDirection = new THREE.Vector3(0, 0, -10).applyEuler(boatMesh.rotation);
        cameraLookAtTarget.copy(boatMesh.position).add(lookDirection);
      } else if (gameState.cameraMode === "thirdPerson") {
        // Third-person camera - positioned behind the boat
        const cameraOffset = new THREE.Vector3(0, 0, gameState.cameraDistance).applyEuler(boatMesh.rotation);
        cameraPositionTarget
          .copy(boatMesh.position)
          .add(new THREE.Vector3(cameraOffset.x, gameState.cameraHeight, cameraOffset.z));
        cameraLookAtTarget.copy(boatMesh.position);
      } else if (gameState.cameraMode === "orbital") {
        // Enable orbit controls for free camera movement
        controls.enabled = true;
        controls.target.copy(boatMesh.position);
      }

      // Apply camera position with smooth damping
      if (gameState.cameraMode !== "orbital") {
        controls.enabled = false;

        // Smoothly move camera to target position
        camera.position.lerp(cameraPositionTarget, deltaTime * gameState.cameraDampingFactor);

        // Create a temporary vector for camera look target to implement smooth look-at
        const currentLookAt = new THREE.Vector3();
        currentLookAt.copy(cameraLookAtTarget);

        // Look at the target position
        camera.lookAt(currentLookAt);
      }

      // Boundary checks to prevent boat from going too far
      const maxDistance = 23; // Half the water plane size minus some margin
      if (Math.abs(boatMesh.position.x) > maxDistance || Math.abs(boatMesh.position.z) > maxDistance) {
        // Implement "soft" boundary by slowing down
        gameState.boatSpeed *= 0.95;

        // If way too far, force position back to boundary
        if (Math.abs(boatMesh.position.x) > maxDistance + 2 || Math.abs(boatMesh.position.z) > maxDistance + 2) {
          boatMesh.position.x = Math.sign(boatMesh.position.x) * maxDistance;
          boatMesh.position.z = Math.sign(boatMesh.position.z) * maxDistance;
        }
      }
    }

    // Update orbit controls if enabled
    if (controls.enabled) {
      controls.update();
    }

    // Render the scene
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
}

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  precision: "highp",
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(debugObject.fogColor);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// Info overlay
const infoElement = document.createElement("div");
infoElement.style.position = "absolute";
infoElement.style.top = "10px";
infoElement.style.left = "10px";
infoElement.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
infoElement.style.color = "white";
infoElement.style.padding = "10px";
infoElement.style.borderRadius = "5px";
infoElement.style.fontFamily = "Arial, sans-serif";
infoElement.style.fontSize = "14px";
infoElement.style.pointerEvents = "none";
infoElement.innerHTML = "Controls: W/↑ - Accelerate, S/↓ - Reverse, A/← - Turn Left, D/→ - Turn Right";
document.body.appendChild(infoElement);
