let mixers = [];
let mixedModels = []; // Store all mixed models added to scene

// paint
let painting = false;
let lastX, lastY;
let paintTexture, paintCanvas, paintCtx;

const canvas = document.getElementById("myCanvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x87ceeb, 10, 25);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(1, 0, 4);

document.getElementById("selectModelBtn").addEventListener("click", () => {
  selectCurrentModel();
});

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(2048, 2048);
directionalLight.shadow.camera.left = -10;
directionalLight.shadow.camera.right = 10;
directionalLight.shadow.camera.top = 10;
directionalLight.shadow.camera.bottom = -10;
scene.add(directionalLight);

const planeGeo = new THREE.PlaneGeometry(50, 50);
const planeMat = new THREE.ShadowMaterial({ opacity: 0.3 });
const shadowPlane = new THREE.Mesh(planeGeo, planeMat);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -1.25;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

const loaderCube = new THREE.CubeTextureLoader();
const skyTexture = loaderCube.load([
  "https://cdn.glitch.global/71411a15-2fd2-431a-82d6-0aa1df09601b/posx.png?v=1749559818084",
  "https://cdn.glitch.global/71411a15-2fd2-431a-82d6-0aa1df09601b/negx.png?v=1749559829037",
  "https://cdn.glitch.global/71411a15-2fd2-431a-82d6-0aa1df09601b/posy.png?v=1749559810915",
  "https://cdn.glitch.global/71411a15-2fd2-431a-82d6-0aa1df09601b/negy.png?v=1749559825078",
  "https://cdn.glitch.global/71411a15-2fd2-431a-82d6-0aa1df09601b/posz.png?v=1749559793037",
  "https://cdn.glitch.global/71411a15-2fd2-431a-82d6-0aa1df09601b/negz.png?v=1749559820856",
]);

// skyTexture.encoding = THREE.sRGBEncoding; // Ensures correct color output
skyTexture.magFilter = THREE.LinearFilter; // Smoother magnification
skyTexture.minFilter = THREE.LinearMipMapLinearFilter; // Better minification filter

scene.background = skyTexture;

function blendTextures(tex1, tex2) {
  const canvas = document.createElement("canvas");
  canvas.width = tex1.image.width;
  canvas.height = tex1.image.height;
  const ctx = canvas.getContext("2d");

  ctx.globalAlpha = 1;
  ctx.drawImage(tex1.image, 0, 0);

  ctx.globalAlpha = 0.5;
  ctx.drawImage(tex2.image, 0, 0);

  const blendedTexture = new THREE.CanvasTexture(canvas);
  blendedTexture.encoding = THREE.sRGBEncoding;
  return blendedTexture;
}

const loader = new THREE.GLTFLoader();

const baseModelUrls = [
  ...new Set([
    "https://cdn.glitch.global/84028d40-ef2a-47be-b46e-c2c54de658d7/mm_project.glb?v=1749467846542",
    // "https://cdn.glitch.me/84028d40-ef2a-47be-b46e-c2c54de658d7/brunnen02_2_neu.glb?v=1749467848669",
    "https://cdn.glitch.global/84028d40-ef2a-47be-b46e-c2c54de658d7/mm_project1.glb?v=1749467825245",
    "https://cdn.glitch.global/84028d40-ef2a-47be-b46e-c2c54de658d7/mm_project3.glb?v=1749467831523",
    "https://cdn.glitch.global/84028d40-ef2a-47be-b46e-c2c54de658d7/mm_project2.glb?v=1749467842329",
  ]),
];

const carouselModelUrls = [
  "https://cdn.glitch.global/84028d40-ef2a-47be-b46e-c2c54de658d7/UAS1.glb?v=1749462470875",
  "https://cdn.glitch.me/71411a15-2fd2-431a-82d6-0aa1df09601b/uas2.glb?v=1749560101698",
  "https://cdn.glitch.global/84028d40-ef2a-47be-b46e-c2c54de658d7/PKI1.glb?v=1749462475710",
  "https://cdn.glitch.me/84028d40-ef2a-47be-b46e-c2c54de658d7/hse2.glb?v=1749462476840",
  "https://cdn.glitch.global/84028d40-ef2a-47be-b46e-c2c54de658d7/hse1.glb?v=1749462428873",
  "https://cdn.glitch.me/84028d40-ef2a-47be-b46e-c2c54de658d7/PKI2.glb?v=1749462464237",
];

// Grab UI container
const modelThumbnails = document.getElementById("modelThumbnails");
let selectedModelIndex = 0; // default selection

// Array of your thumbnail asset URLs:
const modelThumbs = [
  "https://cdn.glitch.global/71411a15-2fd2-431a-82d6-0aa1df09601b/wormguy.png?v=1749559849987",
  "https://cdn.glitch.global/71411a15-2fd2-431a-82d6-0aa1df09601b/pinkrabbit.png?v=1749559846228",
  "https://cdn.glitch.global/71411a15-2fd2-431a-82d6-0aa1df09601b/floorsnailgreen.png?v=1749559861581",
  "https://cdn.glitch.global/71411a15-2fd2-431a-82d6-0aa1df09601b/flyingfish.png?v=1749559857867",
  "https://cdn.glitch.global/71411a15-2fd2-431a-82d6-0aa1df09601b/horse.png?v=1749559853602",
  "https://cdn.glitch.global/71411a15-2fd2-431a-82d6-0aa1df09601b/yellowslimething.png?v=1749559866396",
  // add URLs for each carousel model...
];

// Add thumbnails to UI
modelThumbs.forEach((src, index) => {
  const img = document.createElement("img");
  img.src = src;
  img.style.width = "8vw";
  img.style.height = "max-content";
  img.style.cursor = "pointer";
  img.style.transition = "all 0.3s ease";
  img.style.padding = "10px";
  img.style.background = "linear-gradient(to bottom, #d3d3d3, #a9a9a9)";
  img.style.border = "1px solid #4a5764";
  img.style.boxShadow = `
  0 4px 6px rgba(0, 0, 0, 0.4),
  inset 0 1px 0 white,
  inset 0 -1px 0 #888
`;
  img.style.borderRadius = "4px";
  img.style.fontWeight = "bold";
  img.style.color = "#333";
  img.style.pointerEvents = "auto";
  img.dataset.index = index;

  // Initially, only the first thumbnail is highlighted
  if (index === 0) img.classList.add("highlighted");

  img.addEventListener("click", () => {
    selectedModelIndex = index;
    currentIndex = index;
    showModel(index);
    updateThumbnailBorder(index);
  });

  modelThumbnails.appendChild(img);
});

function updateThumbnailBorder(index) {
  [...modelThumbnails.children].forEach((img, i) => {
    if (i === index) {
      // Add the animation class and highlight border
      img.classList.add("highlighted");

      // To replay bounce animation on repeated highlights, re-trigger animation
      img.style.animation = "none"; // reset animation
      img.offsetHeight; // trigger reflow
      img.style.animation = null; // reapply animation
    } else {
      img.classList.remove("highlighted");
    }
  });
}

async function loadModel(url) {
  return new Promise((resolve) => {
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        model.visible = false;

        // Get bounding box and center
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        model.position.y += 0.9;

        // Uniform scale based on largest dimension
        const scale = 2.5 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);

        // Recompute box after scale
        const scaledBox = new THREE.Box3().setFromObject(model);
        const scaledSize = scaledBox.getSize(new THREE.Vector3());
        const scaledCenter = scaledBox.getCenter(new THREE.Vector3());

        // Center model on X and Z, but base-align on Y
        model.position.x = -scaledCenter.x;
        model.position.z = -scaledCenter.z;
        model.position.y = -scaledBox.min.y; // align bottom to y = 0

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = false;
          }
        });

        const thisMixer = new THREE.AnimationMixer(model);
        if (gltf.animations?.length) {
          gltf.animations.forEach((clip) => thisMixer.clipAction(clip).play());
        }
        mixers.push(thisMixer);

        scene.add(model);
        resolve({ model, url, animations: gltf.animations });
      },
      undefined,
      () => resolve(null)
    );
  });
}

let currentModel = null;
let currentIndex = 0;
let carouselModels = [];
let selectedModels = [];
let baseModels = [];

async function loadCarouselModels() {
  const loaded = await Promise.all(carouselModelUrls.map(loadModel));
  carouselModels = loaded.filter(Boolean);
}

async function loadBaseModels() {
  const loaded = await Promise.all(baseModelUrls.map(loadModel));
  baseModels = loaded.filter(Boolean);
  unusedBaseModels = [...baseModels]; // initialize pool
}

function showModel(index) {
  if (currentModel && selectedModels.length < 2) currentModel.visible = false; // only hide carousel previews, not mixed models
  currentModel = carouselModels[index].model;
  currentModel.visible = true;
}

// Show alert inside canvas container (simple overlay div)
function showCanvasAlert(message, options = { persistent: false }) {
  let alertDiv = document.getElementById("canvas-alert");
  if (!alertDiv) {
    alertDiv = document.createElement("div");
    alertDiv.id = "canvas-alert";
    Object.assign(alertDiv.style, {
      position: "absolute",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      padding: "12px 24px",
      // backgroundColor: "#fffae5",
      borderRadius: "6px",
      fontFamily: "monospace",
      fontSize: "18px",
      // fontWeight: "bold",
      zIndex: 10,
      pointerEvents: "none",
      color: "yellow",
      boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    });
    canvas.parentElement.style.position = "relative";
    canvas.parentElement.appendChild(alertDiv);
  }

  alertDiv.textContent = message;

  if (!options.persistent) {
    setTimeout(() => {
      if (alertDiv) alertDiv.remove();
    }, 2000);
  }
}

function selectCurrentModel() {
  const selected = carouselModels[currentIndex].model;
  if (selectedModels.includes(selected)) {
    showCanvasAlert("Already selected!");
    return;
  }
  selectedModels.push(selected);
  showCanvasAlert(`Model selected (${selectedModels.length}/2)`);

  if (selectedModels.length === 2) {
    // Hide the carousel preview model (currentModel)
    if (currentModel) currentModel.visible = false;

    showMixedModel();

    // Reset selection for next round
    selectedModels = [];

    // Show UI again for another round
    document.getElementById("ui").classList.remove("hidden");
  }
}

function getFirstTexture(model) {
  let tex = null;
  model.traverse((child) => {
    if (!tex && child.isMesh && child.material?.map) {
      tex = child.material.map;
    }
  });
  return tex;
}

// const brushImage = new Image();
// brushImage.src = 'https://cdn.glitch.global/71411a15-2fd2-431a-82d6-0aa1df09601b/istockphoto-488817190-612x612.jpg?v=1749585915365'; // make sure the path is correct
// brushImage.onload = () => {
//   console.log("Brush image loaded!");
// };

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let currentPaintMesh = null;

function setupPaintTool(targetMesh) {
  currentPaintMesh = targetMesh;

  const tex = targetMesh.children.find((c) => c.isMesh)?.material?.map;
  if (!tex?.image) return;

  paintCanvas = document.createElement("canvas");
  paintCanvas.width = tex.image.width;
  paintCanvas.height = tex.image.height;
  paintCtx = paintCanvas.getContext("2d");
  paintCtx.drawImage(tex.image, 0, 0);

  paintTexture = new THREE.CanvasTexture(paintCanvas);
  paintTexture.encoding = THREE.sRGBEncoding;
  paintCtx.globalAlpha = 0.8;

  targetMesh.traverse((c) => {
    if (c.isMesh) {
      c.material.map = paintTexture;
      c.material.needsUpdate = true;
    }
  });

  // Cursor change and instructions
  // let alertDiv = document.getElementById("canvas-alert");
  // if (!alertDiv) {
  //   alertDiv = document.createElement("div");
  //   alertDiv.id = "canvas-alert";
  //   Object.assign(alertDiv.style, {
  canvas.style.cursor = "crosshair";
  const info = document.createElement("div");
  info.textContent = "Paint mode: click + drag";
  Object.assign(info.style, {
    position: "absolute",
    padding: "10px 20px",
    // backgroundColor: "#33333300",
    borderRadius: "6px",
    fontFamily: "monospace",
    fontSize: "16px",
    // fontWeight: "bold",
    zIndex: 999,
    pointerEvents: "none",
    color: "yellow",
    whiteSpace: "nowrap",
  });

  stylePaintLabel(info);
  document.body.appendChild(info);
}

// Common paint handlers
canvas.addEventListener("pointerdown", (evt) => {
  if (!currentPaintMesh) return;
  painting = true;
  controls.enabled = false;
  updateMouse(evt);
  paintOnModel();
});
canvas.addEventListener("pointermove", (evt) => {
  if (!painting) return;
  updateMouse(evt);
  paintOnModel();
});
canvas.addEventListener("pointerup", () => {
  painting = false;
  controls.enabled = true;
});

// Helper: compute normalized mouse coords
function updateMouse(e) {
  const r = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
}

// Draws brush texture onto model's canvas texture
function paintOnModel() {
  if (!currentPaintMesh) return;
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObject(currentPaintMesh, true)[0];
  if (!hit?.uv) return;

  const uv = hit.uv;
  const size = 32; // brush size
  const x = uv.x * paintCanvas.width - size / 2;
  const y = (1 - uv.y) * paintCanvas.height - size / 2;
  paintCtx.fillStyle = "#000";
  paintCtx.fillRect(x, y, size, size);
  paintTexture.needsUpdate = true;
}

// Style the paint label
function stylePaintLabel(el) {
  Object.assign(el.style, {
    position: "fixed",
    top: "10px",
    left: "10px",
    padding: "6px",
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    fontFamily: "sans-serif",
    borderRadius: "4px",
    zIndex: 1000,
  });
}

function showMixedModel() {
  if (unusedBaseModels.length === 0) {
    showCanvasAlert("No more base models left to mix!", { persistent: false });
    return;
  }

  // Pick and remove a random base model
  const index = Math.floor(Math.random() * unusedBaseModels.length);
  const randomBase = unusedBaseModels.splice(index, 1)[0];

  const baseModel = randomBase.model.clone();
  baseModel.visible = true;

  const box = new THREE.Box3().setFromObject(baseModel);
  const scale = 1 / box.getSize(new THREE.Vector3()).length();
  baseModel.scale.setScalar(scale);
  baseModel.position.sub(box.getCenter(new THREE.Vector3()));
  baseModel.position.y += 0.1;

  const tex1 = getFirstTexture(selectedModels[0]);
  const tex2 = getFirstTexture(selectedModels[1]);

  if (tex1 && tex2) {
    baseModel.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          map: blendTextures(tex1, tex2),
          metalness: 0.1,
          roughness: 0.7,
        });
      }
    });
  }

  scene.add(baseModel);
  mixedModels.push(baseModel);

  setupPaintTool(baseModel);
  controls.enabled = true;

  // Play animations from base model if any
  if (randomBase.animations?.length) {
    const mixer = new THREE.AnimationMixer(baseModel);
    randomBase.animations.forEach((clip) => mixer.clipAction(clip).play());
    mixers.push(mixer);
  }

  showCanvasAlert("Mixed model added! - Use left/right arrows to add another", {
    persistent: false,
  });
}

async function init() {
  await loadCarouselModels();
  await loadBaseModels();
  showModel(0);

  // showCanvasAlert("Select two models to mix. Use left/right arrows to navigate. Enter to select");
  showCanvasAlert(
    "Select two models to mix. Use left/right arrows to navigate. Select to enter",
    { persistent: true }
  );

  document.getElementById("ui").classList.remove("hidden");
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const leftArrow = document.getElementById("leftArrow");
const rightArrow = document.getElementById("rightArrow");

leftArrow.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
  } else {
    currentIndex = modelThumbs.length - 1; // wrap around
  }
  showModel(currentIndex);
  updateThumbnailBorder(currentIndex);
});

rightArrow.addEventListener("click", () => {
  if (currentIndex < modelThumbs.length - 1) {
    currentIndex++;
  } else {
    currentIndex = 0; // wrap around
  }
  showModel(currentIndex);
  updateThumbnailBorder(currentIndex);
});

let unusedBaseModels = [];

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  mixers.forEach((m) => m.update(dt));
  renderer.render(scene, camera);
}

const clock = new THREE.Clock();

init();
animate();
