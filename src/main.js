// ───── CURSOR ─────
const cursor = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');

document.addEventListener('mousemove', (e) => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
  setTimeout(() => {
    cursorRing.style.left = e.clientX + 'px';
    cursorRing.style.top = e.clientY + 'px';
  }, 60);
});

document.querySelectorAll('button, a, .toggle, .layer-item, .ctrl-btn, .export-btn').forEach((el) => {
  el.addEventListener('mouseenter', () => {
    cursor.style.transform = 'translate(-50%,-50%) scale(2)';
    cursorRing.style.transform = 'translate(-50%,-50%) scale(1.5)';
    cursorRing.style.borderColor = 'rgba(200,169,110,0.8)';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.transform = 'translate(-50%,-50%) scale(1)';
    cursorRing.style.transform = 'translate(-50%,-50%) scale(1)';
    cursorRing.style.borderColor = 'rgba(200,169,110,0.4)';
  });
});

// ───── SCROLL REVEAL ─────
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(
          () => e.target.classList.add('visible'),
          80 * (Array.from(reveals).indexOf(e.target) % 4)
        );
        observer.unobserve(e.target);
      }
    });
  },
  { threshold: 0.1 }
);
reveals.forEach((el) => observer.observe(el));

// ───── SLIDER ─────
const wallHeightSlider = document.getElementById('wallHeight');
const wallHeightVal = document.getElementById('wallHeightVal');
if (wallHeightSlider) {
  wallHeightSlider.addEventListener('input', () => {
    wallHeightVal.textContent = parseFloat(wallHeightSlider.value).toFixed(1) + 'm';
  });
}

// ───── DRAG & DROP ─────
const uploadZone = document.getElementById('uploadZone');
if (uploadZone) {
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) handleFile(e.target.files[0]);
    });
  }
}

let selectedFile = null;
let fileSeed = 0;

// Simple hash function for the file to create a seed
function getFileSeed(file) {
  let hash = 0;
  const str = file.name + file.size;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Seeded random number generator
function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

window.handleFile = function (file) {
  selectedFile = file;
  fileSeed = getFileSeed(file);
  document.getElementById('fileName').textContent = file.name;
  document.getElementById('fileSize').textContent = (file.size / 1024).toFixed(1) + ' KB';
  document.getElementById('filePreview').classList.add('visible');
  showNotification('File loaded: ' + file.name, 'info');
};

window.removeFile = function () {
  selectedFile = null;
  fileSeed = 0;
  document.getElementById('filePreview').classList.remove('visible');
  document.getElementById('fileInput').value = '';
  showNotification('File removed', 'info');
};

// ───── NOTIFICATION ─────
window.showNotification = function (msg, type = 'info') {
  const n = document.getElementById('notification');
  document.getElementById('notif-msg').textContent = msg;
  document.getElementById('notif-dot').className = 'notif-dot ' + type;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 3000);
};

// ───── GENERATION ─────
window.startGeneration = function () {
  const btn = document.getElementById('generateBtn');
  const ps = document.getElementById('progressSection');
  btn.disabled = true;
  ps.classList.add('visible');

  const steps = ['step1', 'step2', 'step3', 'step4', 'step5'];
  const durations = [600, 500, 800, 600, 400];

  function runStep(i) {
    if (i >= steps.length) {
      document.getElementById('progressFill').style.width = '100%';
      document.getElementById('progressPct').textContent = '100%';
      setTimeout(() => {
        buildThreeScene();
        showNotification('3D model generated successfully!', 'success');
        document.getElementById('viewer').scrollIntoView({ behavior: 'smooth' });
        btn.disabled = false;
      }, 400);
      return;
    }
    const el = document.getElementById(steps[i]);
    el.classList.add('active');
    const pct = Math.round(((i + 1) / steps.length) * 100);
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressPct').textContent = pct + '%';
    setTimeout(() => {
      el.classList.remove('active');
      el.classList.add('done');
      runStep(i + 1);
    }, durations[i]);
  }
  runStep(0);
};

// ───── THREE.JS 3D SCENE ─────
let renderer, scene, camera, animFrame;
let isDragging = false,
  prevMouse = { x: 0, y: 0 };
let theta = 0.4,
  phi = 1.0,
  radius = 24;
let currentView = 'orbit';

function buildThreeScene() {
  const canvas = document.getElementById('three-canvas');
  const placeholder = document.getElementById('canvasPlaceholder');
  if (placeholder) placeholder.style.display = 'none';

  if (renderer) {
    renderer.dispose();
    scene = null;
  }

  const w = canvas.parentElement.clientWidth;
  const h = 600;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(w, h);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0d10);
  scene.fog = new THREE.Fog(0x0c0d10, 40, 80);

  camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200);
  updateCamera();

  // LIGHTS
  const ambient = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambient);
  const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
  sunLight.position.set(15, 20, 10);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  scene.add(sunLight);
  const fillLight = new THREE.DirectionalLight(0xd0e8ff, 0.4);
  fillLight.position.set(-10, 5, -5);
  scene.add(fillLight);

  // GRID
  const gridHelper = new THREE.GridHelper(40, 40, 0x1e2028, 0x161820);
  gridHelper.position.y = -0.01;
  scene.add(gridHelper);

  // DYNAMIC PARAMETERS BASED ON FILE
  let seed = fileSeed || 123456;
  const rand = () => {
    const r = seededRandom(seed++);
    return r;
  };

  const wallH = parseFloat(document.getElementById('wallHeight').value);
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xc8a96e, transparent: true, opacity: 0.85 });
  const floorMat = new THREE.MeshLambertMaterial({ color: 0x1a1a20 });
  const glassMat = new THREE.MeshLambertMaterial({
    color: 0x4488bb,
    transparent: true,
    opacity: 0.3,
    side: THREE.DoubleSide,
  });
  const ceilMat = new THREE.MeshLambertMaterial({ color: 0x111318, transparent: true, opacity: 0.4 });

  // Generate dynamic room layout
  const buildingWidth = 15 + rand() * 15;
  const buildingDepth = 12 + rand() * 10;
  const roomCount = Math.floor(3 + rand() * 5);

  const buildingData = [
    // Outer shell
    { wall: [0, -buildingDepth / 2, buildingWidth, 0.25, 'x'] },
    { wall: [0, buildingDepth / 2, buildingWidth, 0.25, 'x'] },
    { wall: [-buildingWidth / 2, 0, buildingDepth, 0.25, 'z'] },
    { wall: [buildingWidth / 2, 0, buildingDepth, 0.25, 'z'] },
  ];

  // Add random internal walls
  for (let i = 0; i < roomCount; i++) {
    const isX = rand() > 0.5;
    const len = (isX ? buildingWidth : buildingDepth) * (0.3 + rand() * 0.4);
    const pos = {
      x: (rand() - 0.5) * (buildingWidth * 0.6),
      z: (rand() - 0.5) * (buildingDepth * 0.6),
    };
    buildingData.push({ wall: [pos.x, pos.z, len, 0.2, isX ? 'x' : 'z'] });
  }

  buildingData.forEach((item) => {
    if (item.wall) {
      const [cx, cz, len, thick, axis] = item.wall;
      const geo = new THREE.BoxGeometry(
        axis === 'x' ? len : thick,
        wallH,
        axis === 'x' ? thick : len
      );
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(cx, wallH / 2, cz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      const edges = new THREE.EdgesGeometry(geo);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xe8d5a3, transparent: true, opacity: 0.15 });
      const wireframe = new THREE.LineSegments(edges, lineMat);
      wireframe.position.copy(mesh.position);
      scene.add(wireframe);
    }
  });

  // Dynamic Floor/Ceiling
  const floorGeo = new THREE.BoxGeometry(buildingWidth, 0.15, buildingDepth);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.position.set(0, -0.075, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  const floorLines = new THREE.LineSegments(
    new THREE.EdgesGeometry(floorGeo),
    new THREE.LineBasicMaterial({ color: 0x2a2d38 })
  );
  floorLines.position.copy(floor.position);
  scene.add(floorLines);

  const ceilGeo = new THREE.BoxGeometry(buildingWidth, 0.12, buildingDepth);
  const ceil = new THREE.Mesh(ceilGeo, ceilMat);
  ceil.position.set(0, wallH + 0.06, 0);
  scene.add(ceil);

  // Dynamic Windows
  const windowCount = 4 + Math.floor(rand() * 6);
  for (let i = 0; i < windowCount; i++) {
    const side = Math.floor(rand() * 4);
    let x = 0,
      z = 0,
      w = 0.05,
      d = 0.05;
    const size = 1.5 + rand() * 2;
    if (side === 0) {
      // Top
      z = -buildingDepth / 2;
      x = (rand() - 0.5) * (buildingWidth - 4);
      w = size;
    } else if (side === 1) {
      // Bottom
      z = buildingDepth / 2;
      x = (rand() - 0.5) * (buildingWidth - 4);
      w = size;
    } else if (side === 2) {
      // Left
      x = -buildingWidth / 2;
      z = (rand() - 0.5) * (buildingDepth - 4);
      d = size;
    } else {
      // Right
      x = buildingWidth / 2;
      z = (rand() - 0.5) * (buildingDepth - 4);
      d = size;
    }

    const geo = new THREE.BoxGeometry(w, wallH * 0.6, d);
    const mesh = new THREE.Mesh(geo, glassMat);
    mesh.position.set(x, wallH * 0.55, z);
    scene.add(mesh);
  }

  // Columns at corners
  const colMat = new THREE.MeshLambertMaterial({ color: 0x888070 });
  const corners = [
    [-buildingWidth / 2 + 0.1, -buildingDepth / 2 + 0.1],
    [-buildingWidth / 2 + 0.1, buildingDepth / 2 - 0.1],
    [buildingWidth / 2 - 0.1, -buildingDepth / 2 + 0.1],
    [buildingWidth / 2 - 0.1, buildingDepth / 2 - 0.1],
  ];
  corners.forEach(([cx, cz]) => {
    const geo = new THREE.BoxGeometry(0.5, wallH, 0.5);
    const mesh = new THREE.Mesh(geo, colMat);
    mesh.position.set(cx, wallH / 2, cz);
    mesh.castShadow = true;
    scene.add(mesh);
  });

  // Dynamic Room Labels
  const roomTypes = ['LIVING', 'KITCHEN', 'BEDROOM', 'OFFICE', 'STUDIO', 'LOUNGE', 'DINING'];
  for (let i = 0; i < roomCount - 1; i++) {
    const rx = (rand() - 0.5) * (buildingWidth * 0.7);
    const rz = (rand() - 0.5) * (buildingDepth * 0.7);
    const type = roomTypes[Math.floor(rand() * roomTypes.length)];
    const area = Math.floor(10 + rand() * 30);
    const sprite = makeTextSprite(`${type} ${i + 1}\n${area}m²`);
    sprite.position.set(rx, wallH * 0.3, rz);
    scene.add(sprite);
  }

  if (animFrame) cancelAnimationFrame(animFrame);
  function animate() {
    animFrame = requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  canvas.onmousedown = (e) => {
    isDragging = true;
    prevMouse = { x: e.clientX, y: e.clientY };
  };
  canvas.onmousemove = (e) => {
    if (!isDragging || currentView !== 'orbit') return;
    const dx = (e.clientX - prevMouse.x) * 0.008;
    const dy = (e.clientY - prevMouse.y) * 0.005;
    theta -= dx;
    phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, phi + dy));
    prevMouse = { x: e.clientX, y: e.clientY };
    updateCamera();
  };
  canvas.onmouseup = () => (isDragging = false);
  canvas.onwheel = (e) => {
    radius = Math.max(8, Math.min(60, radius + e.deltaY * 0.03));
    updateCamera();
  };

  // Update model stats with randomized but deterministic values
  const totalArea = Math.floor(buildingWidth * buildingDepth);
  const verts = 1000 + Math.floor(rand() * 4000);
  const faces = verts * 2;

  document.getElementById('statStatus').textContent = 'Generated ✓';
  document.getElementById('statStatus').style.color = 'var(--green)';
  document.getElementById('statVerts').textContent = verts.toLocaleString();
  document.getElementById('statFaces').textContent = faces.toLocaleString();
  document.getElementById('statRooms').textContent = roomCount + ' units';
  document.getElementById('statArea').textContent = totalArea + ' m²';
  document.getElementById('statHeight').textContent = wallH.toFixed(1) + 'm';
  document.getElementById('statTime').textContent = new Date().toLocaleTimeString();
  document.getElementById('canvasInfo').textContent = 'Drag to rotate · Scroll to zoom';
  document.getElementById('progressSection').classList.remove('visible');
}

function makeTextSprite(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(200,169,110,0.15)';
  ctx.fillRect(0, 0, 256, 80);
  ctx.fillStyle = 'rgba(200,169,110,0.8)';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  const lines = text.split('\n');
  lines.forEach((l, i) => ctx.fillText(l, 128, 24 + i * 26));
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(4, 1.2, 1);
  return sprite;
}

function updateCamera() {
  if (!camera) return;
  const x = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);
  camera.position.set(x, y, z);
  camera.lookAt(0, 1.5, 0);
}

window.setView = function (v) {
  currentView = v;
  document.querySelectorAll('.ctrl-btn').forEach((b) => b.classList.remove('active'));
  const btn = document.getElementById('view' + v.charAt(0).toUpperCase() + v.slice(1));
  if (btn) btn.classList.add('active');
  if (!camera) return;
  if (v === 'top') {
    camera.position.set(0, 30, 0.01);
    camera.lookAt(0, 0, 0);
  }
  if (v === 'front') {
    camera.position.set(0, 3, 28);
    camera.lookAt(0, 1.5, 0);
    theta = 0;
    phi = 1.3;
  }
  if (v === 'iso') {
    theta = Math.PI / 4;
    phi = 0.6;
    radius = 26;
    updateCamera();
  }
  if (v === 'orbit') {
    theta = 0.4;
    phi = 1.0;
    radius = 24;
    updateCamera();
  }
};

window.exportModel = function (type) {
  const labels = { glb: 'GLB', obj: 'OBJ', pdf: 'PDF Report', img: 'Screenshot' };
  showNotification('Exporting ' + labels[type] + '... (demo mode)', 'info');
};

window.addEventListener('resize', () => {
  if (!renderer) return;
  const canvas = document.getElementById('three-canvas');
  const w = canvas.parentElement.clientWidth;
  renderer.setSize(w, 600);
  camera.aspect = w / 600;
  camera.updateProjectionMatrix();
});

window.exportModel = function (type) {
  const labels = { glb: 'GLB', obj: 'OBJ', pdf: 'PDF Report', img: 'Screenshot' };
  showNotification('Exporting ' + labels[type] + '... (demo mode)', 'info');
};

window.addEventListener('resize', () => {
  if (!renderer) return;
  const canvas = document.getElementById('three-canvas');
  const w = canvas.parentElement.clientWidth;
  renderer.setSize(w, 600);
  camera.aspect = w / 600;
  camera.updateProjectionMatrix();
});
