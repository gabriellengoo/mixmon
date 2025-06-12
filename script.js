let mixers = [];
let mixedModels = []; // Store all mixed models added to scene

// paint
let painting = false;
let lastX, lastY;
let paintTexture, paintCanvas, paintCtx;

const canvas = document.getElementById("myCanvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  antialias: true,
  preserveDrawingBuffer: true,
});
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
  // img.style.height = "8vh";
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

function makeSpriteDraggable(sprite) {
  sprite.userData.draggable = true;
}

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

// Call this when your mixed model appears
// showGIFThumbnails();

// Make GIF draggable when clicked
document.querySelectorAll(".gif-thumb").forEach((gifThumb) => {
  gifThumb.addEventListener("click", function (e) {
    const gifURL = gifThumb.src;

    // Load GIF as texture
    const texture = new THREE.TextureLoader().load(gifURL, () => {
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);

      // Set size and position (adjust as needed)
      sprite.scale.set(0.5, 0.5, 0.5); // or (width, height, 1)
      sprite.position.set(-1, 0, 0); // center, or use your own logic

      // Add to scene
      scene.add(sprite);

      makeSpriteDraggable(sprite);
    });
  });
});

let draggableSprite = null;

renderer.domElement.addEventListener("mousedown", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);

  for (const intersect of intersects) {
    if (intersect.object.userData.draggable) {
      draggingSprite = intersect.object;
      draggingSprite.userData.dragging = true;
      break;
    }
  }
});

renderer.domElement.addEventListener("mousemove", (event) => {
  if (draggingSprite && draggingSprite.userData.dragging) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeZ, intersection);

    draggingSprite.position.copy(intersection);
  }
});

renderer.domElement.addEventListener("mouseup", () => {
  if (draggingSprite) {
    draggingSprite.userData.dragging = false;
    draggingSprite = null;
  }
});

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


const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const textureLoader = new THREE.TextureLoader();

const textures = {
  plastic: textureLoader.load(
    "https://cdn.glitch.global/71411a15-2fd2-431a-82d6-0aa1df09601b/textur-kristina-paukshtite-1998922.jpg?v=1749667583075"
  ),
  plants: textureLoader.load(
    "https://cdn.glitch.global/71411a15-2fd2-431a-82d6-0aa1df09601b/Best-Colorful-Houseplants-FB.jpg?v=1749667692340"
  ),
  slime: textureLoader.load(
    "https://cdn.glitch.global/71411a15-2fd2-431a-82d6-0aa1df09601b/triana-nana-VWyiLOKgsgM-unsplash-slime-600.jpg?v=1749667572394"
  ),
};

let currentPaintTexture = textures.plastic; // default

document.getElementById("plasticBtn").addEventListener("click", () => {
  currentPaintTexture = textures.plastic;
});

document.getElementById("plantsBtn").addEventListener("click", () => {
  currentPaintTexture = textures.plants;
});

document.getElementById("slimeBtn").addEventListener("click", () => {
  currentPaintTexture = textures.slime;
});

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


  canvas.style.cursor = "crosshair";
  const info = document.createElement("div");
  info.textContent =
    "Paint mode: click + drag. Double click/tap and drag gifs to add!";
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
function getEventPosition(e) {
  if (e.touches && e.touches.length > 0) {
    return {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  } else {
    return {
      x: e.clientX,
      y: e.clientY,
    };
  }
}

function handleDown(e) {
  if (!currentPaintMesh) return;
  painting = true;
  controls.enabled = false;

  const pos = getEventPosition(e);
  updateMouseCoords(pos.x, pos.y);
  paintOnModel();

  e.preventDefault(); // prevent page scroll on touch
}

function handleMove(e) {
  if (!painting) return;

  const pos = getEventPosition(e);
  updateMouseCoords(pos.x, pos.y);
  paintOnModel();

  e.preventDefault();
}

function handleUp(e) {
  painting = false;
  controls.enabled = true;
}

function updateMouseCoords(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  mouse.x = ((clientX - r.left) / r.width) * 2 - 1;
  mouse.y = -((clientY - r.top) / r.height) * 2 + 1;
}

// Add listeners for both mouse and touch
canvas.addEventListener("mousedown", handleDown);
canvas.addEventListener("mousemove", handleMove);
canvas.addEventListener("mouseup", handleUp);

canvas.addEventListener("touchstart", handleDown, { passive: false });
canvas.addEventListener("touchmove", handleMove, { passive: false });
canvas.addEventListener("touchend", handleUp);


// Helper: compute normalized mouse coords
function updateMouse(e) {
  const r = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
}

function createPatternFromTexture(texture) {
  if (!texture || !texture.image) return null;

  const patternCanvas = document.createElement("canvas");
  patternCanvas.width = texture.image.width;
  patternCanvas.height = texture.image.height;
  const ctx = patternCanvas.getContext("2d");
  ctx.drawImage(texture.image, 0, 0);

  return paintCtx.createPattern(patternCanvas, "repeat");
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

  // Create a pattern from the current selected texture
  const pattern = createPatternFromTexture(currentPaintTexture);
  if (!pattern) return;

  paintCtx.fillStyle = pattern;
  paintCtx.beginPath();
  paintCtx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  paintCtx.fill();
  paintCtx.closePath();

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

function updateTextureButtonsVisibility() {
  const texturesDiv = document.getElementById("texturesDiv");
  if (mixedModels.length > 0) {
    texturesDiv.style.display = "flex"; // show buttons
  } else {
    texturesDiv.style.display = "none"; // hide buttons
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateTextureButtonsVisibility();
});

const texturesDiv = document.getElementById("texturesDiv");
const emailBtn = document.getElementById("emailBtn");
const userEmail = document.getElementById("userEmail");
const skyBtn = document.getElementById("skyBtn");
const selectModelBtn = document.getElementById("selectModelBtn");
const gifThumbnails = document.getElementById("gifThumbnails");

let mixedModelActive = false;

// Call this function to show mixed model UI and disable model selection
function showMixedModelUI() {
  mixedModelActive = true;

  // Hide model thumbnails and disable interactions
  modelThumbnails.style.display = "none";
  rightArrow.style.display = "none";
  leftArrow.style.display = "none";
  selectModelBtn.style.display = "none";
  // selectModelBtn.disabled = true;
  selectModelBtn.style.pointerEvents = "none";
  selectModelBtn.style.opacity = "0.1"; // visually show disabled

  // Show textures, email, and sky buttons
  console.log("Showing gifs...");
  gifThumbnails.style.display = "flex";
  texturesDiv.style.display = "flex";
  emailBtn.style.display = "inline-block";
  skyBtn.style.display = "inline-block";
  userEmail.style.display = "inline-block";

  // showGIFThumbnails();
}

// Call this function to clear mixed model and reset UI
function clearMixedModelUI() {
  mixedModelActive = false;

  // 🧽 Remove all mixed models from the scene
  mixedModels.forEach((model) => scene.remove(model));
  mixedModels.length = 0; // clear the array

  // Reset UI
  modelThumbnails.style.display = "flex";
  // selectModelBtn.disabled = false;
  selectModelBtn.style.display = "inline-block";
  selectModelBtn.style.pointerEvents = "auto";
  selectModelBtn.style.opacity = "1";
  rightArrow.style.display = "inline-block";
  leftArrow.style.display = "inline-block";

  texturesDiv.style.display = "none";
  emailBtn.style.display = "none";
  skyBtn.style.display = "none";
  userEmail.style.display = "none";
  gifThumbnails.style.display = "none";
}

emailBtn.addEventListener("click", async () => {
  // 1. Get canvas screenshot
  const canvas = renderer.domElement;
  const imageData = canvas.toDataURL("image/png").split(",")[1]; // base64 only

  // 2. Create popup immediately
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.background = "#fff";
  popup.style.padding = "20px";
  popup.style.border = "2px solid #0088cc";
  popup.style.borderRadius = "12px";
  popup.style.zIndex = "9999";
  popup.style.boxShadow = "0 0 20px rgba(0,0,0,0.5)";
  popup.style.maxWidth = "90vw";
  popup.style.maxHeight = "90vh";
  popup.style.overflow = "auto";
  popup.style.textAlign = "center";
  popup.textContent = "Uploading image...";

  document.body.appendChild(popup);

  // 3. Upload to Imgur
  try {
    const imgurRes = await fetch("https://api.imgur.com/3/image", {
      method: "POST",
      headers: {
        Authorization: "Client-ID 24b5f71637a86a9",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        image: imageData,
        type: "base64",
      }),
    });

    const imgurData = await imgurRes.json();

    if (!imgurData.success) throw new Error("Imgur upload failed");

    const uploadedImageUrl = imgurData.data.link;

    // 4. Generate QR Code (that points to the uploaded image URL)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
      uploadedImageUrl
    )}&size=150x150`;

    // 5. Clear and update popup content
    popup.innerHTML = "";

    // Screenshot image
    const img = document.createElement("img");
    img.src = uploadedImageUrl;
    img.style.maxWidth = "100%";
    img.style.height = "auto";

    // QR code image
    const qr = document.createElement("img");
    qr.src = qrCodeUrl;
    qr.alt = "Scan to view image";
    qr.style.marginTop = "10px";
    qr.style.border = "1px solid #ccc";
    qr.style.padding = "4px";
    qr.style.background = "#fafafa";

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.style.fontSize = "1.3vw";
    closeBtn.style.marginTop = "10px";
    closeBtn.style.padding = "6px 14px";
    closeBtn.style.border = "none";
    closeBtn.style.background = "grey";
    closeBtn.style.color = "white";
    closeBtn.style.borderRadius = "6px";
    closeBtn.style.cursor = "pointer";
    closeBtn.onclick = () => popup.remove();

    popup.appendChild(img);
    popup.appendChild(document.createElement("br"));
    popup.appendChild(qr);
    popup.appendChild(document.createElement("br"));
    popup.appendChild(closeBtn);
  } catch (err) {
    popup.textContent = "Failed to upload image. Try again.";
    console.error(err);
  }
});

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

  updateTextureButtonsVisibility();
  showMixedModelUI();
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
