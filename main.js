import * as THREE from 'three';

// 1. SCENE, CAMERA, AND RENDERER SETUP
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky color
scene.fog = new THREE.Fog(0x87CEEB, 20, 100); // Fog hides the edge of the world

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// 2. LIGHTING
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;
scene.add(dirLight);

// 3. THE INFINITE FLOOR ILLUSION
// We create a massive grid. Later, we'll make it snap to the player's position so it never ends.
const gridHelper = new THREE.GridHelper(200, 100, 0x444444, 0x888888);
scene.add(gridHelper);

const planeGeo = new THREE.PlaneGeometry(200, 200);
const planeMat = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // Grass green
const plane = new THREE.Mesh(planeGeo, planeMat);
plane.rotation.x = -Math.PI / 2;
plane.receiveShadow = true;
plane.position.y = -0.01; // Slightly below grid to avoid Z-fighting
scene.add(plane);

// 4. CREATE THE PLAYER (Body Parts)
const player = new THREE.Group();
scene.add(player);

const material = new THREE.MeshStandardMaterial({ color: 0xff4500 }); // Orange-red player

// Helper function to create limbs that pivot from the top (joints) instead of the middle
function createLimb(width, height, depth, yOffset) {
    const geo = new THREE.BoxGeometry(width, height, depth);
    geo.translate(0, -height / 2, 0); // Shift pivot point to the top
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.y = yOffset;
    mesh.castShadow = true;
    return mesh;
}

// Torso
const torsoGeo = new THREE.BoxGeometry(1, 1.5, 0.5);
const torso = new THREE.Mesh(torsoGeo, material);
torso.position.y = 2;
torso.castShadow = true;
player.add(torso);

// Head
const headGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
const head = new THREE.Mesh(headGeo, material);
head.position.y = 3.15;
head.castShadow = true;
player.add(head);

// Limbs
const leftArm = createLimb(0.3, 1.2, 0.3, 2.75);
leftArm.position.x = -0.7;
player.add(leftArm);

const rightArm = createLimb(0.3, 1.2, 0.3, 2.75);
rightArm.position.x = 0.7;
player.add(rightArm);

const leftLeg = createLimb(0.4, 1.2, 0.4, 1.25);
leftLeg.position.x = -0.25;
player.add(leftLeg);

const rightLeg = createLimb(0.4, 1.2, 0.4, 1.25);
rightLeg.position.x = 0.25;
player.add(rightLeg);

// 5. INPUT CONTROLS
const keys = { w: false, a: false, s: false, d: false };

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false;
});

// Resize handler
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// 6. ANIMATION AND GAME LOOP
const clock = new THREE.Clock();
const moveSpeed = 5;
const rotationSpeed = 3;

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    let isMoving = false;

    // Movement logic
    if (keys.w) { player.translateZ(-moveSpeed * delta); isMoving = true; }
    if (keys.s) { player.translateZ(moveSpeed * delta); isMoving = true; }
    if (keys.a) { player.rotation.y += rotationSpeed * delta; }
    if (keys.d) { player.rotation.y -= rotationSpeed * delta; }

    // Walking Animation (Sine wave based on time)
    if (isMoving) {
        const time = clock.getElapsedTime() * 10; // Animation speed
        
        // Legs swing in opposite directions
        leftLeg.rotation.x = Math.sin(time) * 0.8;
        rightLeg.rotation.x = Math.sin(time + Math.PI) * 0.8;
        
        // Arms swing opposite to legs
        leftArm.rotation.x = Math.sin(time + Math.PI) * 0.8;
        rightArm.rotation.x = Math.sin(time) * 0.8;
    } else {
        // Return to standing posture
        leftLeg.rotation.x = 0;
        rightLeg.rotation.x = 0;
        leftArm.rotation.x = 0;
        rightArm.rotation.x = 0;
    }

    // Camera follow logic (Third-person view)
    const cameraOffset = new THREE.Vector3(0, 5, 10);
    const cameraPosition = cameraOffset.applyMatrix4(player.matrixWorld);
    camera.position.lerp(cameraPosition, 0.1); // Smooth camera movement
    camera.lookAt(player.position);

    // Infinite Floor logic: Move the grid/plane to follow the player, rounded to the grid size
    gridHelper.position.x = Math.floor(player.position.x / 2) * 2;
    gridHelper.position.z = Math.floor(player.position.z / 2) * 2;
    plane.position.x = player.position.x;
    plane.position.z = player.position.z;

    renderer.render(scene, camera);
}

// Start the game
animate();
