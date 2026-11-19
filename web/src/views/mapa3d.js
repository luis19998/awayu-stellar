import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PALETTE } from "../aguayo.js";

const CENTER = [-64.5, -16.5];
const SCALE = 1.7;
const REGION_ISO = {
  lpz: "BO-L", cbba: "BO-C", scz: "BO-S", oru: "BO-O", pts: "BO-P",
  chq: "BO-H", trj: "BO-T", ben: "BO-B", pnd: "BO-N",
};
const REGION_ALIASES = {
  lapaz: "lpz", "la paz": "lpz", cochabamba: "cbba", santa_cruz: "scz",
  "santa cruz": "scz", oruro: "oru", potosi: "pts", potosí: "pts",
  chuquisaca: "chq", sucre: "chq", tarija: "trj", beni: "ben", pando: "pnd",
};
const DEPARTMENT_COLORS = [
  PALETTE.magenta, PALETTE.turquesa, PALETTE.amarillo, PALETTE.verde,
  PALETTE.naranja, PALETTE.azul, PALETTE.rojo, PALETTE.morado, PALETTE.crema,
];

/** Equirectangular projection centered on Bolivia, about 20 scene units wide. */
export function project([lon, lat]) {
  const x = (Number(lon) - CENTER[0]) * Math.cos((CENTER[1] * Math.PI) / 180) * SCALE;
  const y = (Number(lat) - CENTER[1]) * SCALE;
  return [x, y];
}

export function regionToIso(region) {
  const key = String(region ?? "").trim().toLowerCase();
  if (/^bo-[bhlconstpn]$/.test(key)) return key.toUpperCase();
  return REGION_ISO[REGION_ALIASES[key] || key] || null;
}

export function groupByRegion(circles = []) {
  return circles.reduce((groups, circle) => {
    const key = String(circle?.region ?? "otro").trim().toLowerCase() || "otro";
    (groups[key] ||= []).push(circle);
    return groups;
  }, {});
}

/** Deterministic sunflower offsets. First item remains at the department center. */
export function spiralOffsets(n) {
  const count = Math.max(0, Math.floor(Number(n) || 0));
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  return Array.from({ length: count }, (_, i) => {
    if (!i) return { x: 0, y: 0 };
    const radius = 0.34 * Math.sqrt(i);
    const angle = i * goldenAngle;
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
}

const STYLE = `
.awayu-mapa3d{position:relative;width:100%;height:100%;min-height:360px;overflow:hidden;background:transparent;color:#fff;font:500 13px/1.4 system-ui,sans-serif;isolation:isolate}
.awayu-mapa3d canvas{display:block;width:100%;height:100%;outline:none}
.awayu-mapa3d__tooltip{position:absolute;z-index:3;pointer-events:none;padding:10px 13px;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:rgba(15,10,24,.88);box-shadow:0 8px 32px #0006;backdrop-filter:blur(12px);opacity:0;transform:translate(12px,12px);transition:opacity .12s ease;white-space:nowrap}
.awayu-mapa3d__tooltip.is-visible{opacity:1}.awayu-mapa3d__tooltip strong{display:block;margin-bottom:3px;color:#fff;font-size:14px}.awayu-mapa3d__tooltip span{color:#d9cede}
.awayu-mapa3d__empty{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:2;padding:9px 14px;border:1px solid #ffffff20;border-radius:999px;background:#170f22b8;color:#f3e6c8;text-align:center;white-space:nowrap;backdrop-filter:blur(10px)}
@media(max-width:520px){.awayu-mapa3d{min-height:300px}.awayu-mapa3d__empty{max-width:calc(100% - 24px);white-space:normal}}
`;

function polygonShapes(coordinates) {
  return coordinates.map((polygon) => {
    const makePath = (ring, PathClass) => {
      const path = new PathClass();
      ring.forEach(([lon, lat], index) => {
        const [x, y] = project([lon, lat]);
        if (index === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      });
      path.closePath();
      return path;
    };
    const shape = makePath(polygon[0], THREE.Shape);
    for (const hole of polygon.slice(1)) shape.holes.push(makePath(hole, THREE.Path));
    return shape;
  });
}

function geometryFor(feature) {
  const polygons = feature.geometry.type === "Polygon"
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates;
  return new THREE.ExtrudeGeometry(polygons.flatMap(polygonShapes), {
    depth: 1,
    bevelEnabled: true,
    bevelSegments: 1,
    steps: 1,
    bevelSize: 0.045,
    bevelThickness: 0.035,
    curveSegments: 2,
  });
}

function featureCenter(feature) {
  const coordinates = feature.geometry.type === "Polygon"
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates;
  // The average of outer-ring vertices gives a stable, inexpensive anchor for pins.
  let x = 0;
  let y = 0;
  let n = 0;
  for (const polygon of coordinates) {
    for (const point of polygon[0]) {
      const p = project(point);
      x += p[0]; y += p[1]; n++;
    }
  }
  return n ? [x / n, y / n] : [0, 0];
}

function labelSprite(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 512; canvas.height = 112;
  const ctx = canvas.getContext("2d");
  ctx.font = "600 42px system-ui, sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = "#10091b"; ctx.shadowBlur = 12;
  ctx.fillStyle = "#fff5dc"; ctx.fillText(text, 256, 56, 490);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.7, 0.59, 1);
  return sprite;
}

function circleLabel(circle, index) {
  const name = circle?.name?.trim();
  return name || `Círculo ${index + 1}`;
}

/** Mount an interactive, transparent three-dimensional map of Bolivia. */
export function mount(container, { circles = [], lang = "es", onSelect, theme } = {}) {
  if (!container) throw new TypeError("mapa3d.mount necesita un contenedor");
  const root = document.createElement("div");
  root.className = "awayu-mapa3d";
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", lang === "en" ? "Savings circles map of Bolivia" : "Mapa de círculos de ahorro de Bolivia");
  const style = document.createElement("style");
  style.textContent = STYLE;
  const tooltip = document.createElement("div");
  tooltip.className = "awayu-mapa3d__tooltip";
  tooltip.setAttribute("role", "status");
  root.append(style, tooltip);
  container.append(root);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.up.set(0, 0, 1);
  camera.position.set(0, -23, 31);
  camera.lookAt(0, 0, 0);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  root.append(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.enablePan = false;
  controls.minDistance = 23;
  controls.maxDistance = 42;
  controls.minPolarAngle = 0.28;
  controls.maxPolarAngle = Math.PI / 2.05;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 0.32;

  const ambient = new THREE.AmbientLight(0xffffff, 2.05);
  const keyLight = new THREE.DirectionalLight(0xffd795, 3.2);
  keyLight.position.set(-8, -6, 18);
  const rimLight = new THREE.PointLight(0x5cf4ec, 52, 45);
  rimLight.position.set(10, 8, 14);
  scene.add(ambient, keyLight, rimLight);

  const mapGroup = new THREE.Group();
  scene.add(mapGroup);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const departments = [];
  const departmentByIso = new Map();
  const pins = [];
  const arcs = [];
  const ownedGeometries = new Set();
  const ownedMaterials = new Set();
  const ownedTextures = new Set();
  const themeAccent = theme?.accent || theme?.primary || PALETTE.turquesa;
  const palette = [themeAccent, ...DEPARTMENT_COLORS.filter((color) => color !== themeAccent)];
  let currentCircles = circles;
  let hovered = null;
  let frame = 0;
  let disposed = false;
  let geojson = null;
  const clock = new THREE.Clock();

  function ownGeometry(geometry) { ownedGeometries.add(geometry); return geometry; }
  function ownMaterial(material) { ownedMaterials.add(material); return material; }
  function addDepartment(feature, index) {
    const iso = feature.properties?.iso;
    const geometry = ownGeometry(geometryFor(feature));
    const material = ownMaterial(new THREE.MeshStandardMaterial({
      color: palette[index % palette.length], roughness: 0.4, metalness: 0.16,
      emissive: palette[index % palette.length], emissiveIntensity: 0.1,
    }));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.z = 0.35;
    mesh.userData = { feature, iso, height: 0.35, targetHeight: 0.35, center: featureCenter(feature) };
    mapGroup.add(mesh);
    const edgeGeometry = ownGeometry(new THREE.EdgesGeometry(geometry, 1));
    const edgeMaterial = ownMaterial(new THREE.LineBasicMaterial({ color: 0xffe8b8, transparent: true, opacity: 0.65 }));
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.scale.z = mesh.scale.z;
    edges.userData.parentMesh = mesh;
    mapGroup.add(edges);
    const label = labelSprite(feature.properties?.name || iso || "");
    ownMaterial(label.material); ownedTextures.add(label.material.map);
    label.position.set(mesh.userData.center[0], mesh.userData.center[1], 0.65);
    mapGroup.add(label);
    const record = { mesh, edges, label, feature, iso, center: mesh.userData.center };
    departments.push(record);
    if (iso) departmentByIso.set(iso, record);
  }

  function removeDynamic() {
    for (const object of [...pins, ...arcs]) {
      mapGroup.remove(object.group || object);
      if (object.group) object.group.traverse((child) => {
        if (child.geometry) { child.geometry.dispose(); ownedGeometries.delete(child.geometry); }
        if (child.material) {
          for (const material of Array.isArray(child.material) ? child.material : [child.material]) {
            material.dispose(); ownedMaterials.delete(material);
          }
        }
      });
      else {
        object.geometry?.dispose(); ownedGeometries.delete(object.geometry);
        object.material?.dispose(); ownedMaterials.delete(object.material);
      }
    }
    pins.length = 0; arcs.length = 0;
  }

  function updateHeights() {
    const groups = groupByRegion(currentCircles);
    const counts = new Map();
    for (const [region, list] of Object.entries(groups)) {
      const iso = regionToIso(region);
      if (iso) counts.set(iso, (counts.get(iso) || 0) + list.length);
    }
    for (const dep of departments) {
      const count = counts.get(dep.iso) || 0;
      dep.mesh.userData.targetHeight = 0.35 + Math.min(1.5, count * 0.2);
      dep.label.position.z = dep.mesh.userData.targetHeight + 0.32;
    }
  }

  function makePin(circle, position, index, total) {
    const group = new THREE.Group();
    const glow = ownMaterial(new THREE.MeshBasicMaterial({ color: 0xffdb68, transparent: true, opacity: 0.92 }));
    const pinMat = ownMaterial(new THREE.MeshStandardMaterial({ color: 0xffd85e, emissive: 0xff9f1c, emissiveIntensity: 1.45, metalness: 0.25, roughness: 0.2 }));
    const coneGeo = ownGeometry(new THREE.ConeGeometry(0.12, 0.42, 12));
    const sphereGeo = ownGeometry(new THREE.SphereGeometry(0.105, 18, 12));
    const haloGeo = ownGeometry(new THREE.SphereGeometry(0.22, 16, 12));
    const cone = new THREE.Mesh(coneGeo, pinMat); cone.position.z = 0.23;
    const sphere = new THREE.Mesh(sphereGeo, pinMat); sphere.position.z = 0.49;
    const halo = new THREE.Mesh(haloGeo, glow); halo.position.z = 0.49;
    const haloMat = ownMaterial(new THREE.MeshBasicMaterial({ color: 0xffc950, transparent: true, opacity: 0.2, side: THREE.BackSide }));
    const shell = new THREE.Mesh(ownGeometry(new THREE.SphereGeometry(0.24, 16, 12)), haloMat); shell.position.z = 0.49;
    group.add(cone, sphere, halo, shell);
    group.position.set(position[0], position[1], 0);
    group.userData.circle = circle;
    group.userData.index = index;
    mapGroup.add(group);
    pins.push({ group, circle, total, index, baseZ: 0 });
  }

  function buildPinsAndArcs() {
    removeDynamic();
    const byDepartment = new Map();
    for (const circle of currentCircles) {
      const iso = regionToIso(circle?.region);
      const dep = departmentByIso.get(iso);
      if (!dep) continue;
      if (!byDepartment.has(iso)) byDepartment.set(iso, []);
      byDepartment.get(iso).push(circle);
    }
    const occupied = [];
    for (const [iso, list] of byDepartment) {
      const dep = departmentByIso.get(iso);
      occupied.push(dep);
      const offsets = spiralOffsets(list.length);
      list.forEach((circle, index) => {
        const offset = offsets[index];
        makePin(circle, [dep.center[0] + offset.x, dep.center[1] + offset.y], index, list.length);
      });
    }
    if (occupied.length < 2) return;
    for (let i = 0; i < occupied.length; i++) {
      const from = occupied[i];
      const to = occupied[(i + 1) % occupied.length];
      if (from === to) continue;
      const start = new THREE.Vector3(from.center[0], from.center[1], 0.6);
      const end = new THREE.Vector3(to.center[0], to.center[1], 0.6);
      const middle = start.clone().add(end).multiplyScalar(0.5);
      middle.z += Math.min(3.5, 1.2 + start.distanceTo(end) * 0.14);
      const curve = new THREE.QuadraticBezierCurve3(start, middle, end);
      const geometry = ownGeometry(new THREE.BufferGeometry().setFromPoints(curve.getPoints(48)));
      const material = ownMaterial(new THREE.LineBasicMaterial({ color: theme?.arc || PALETTE.turquesa, transparent: true, opacity: 0.42 }));
      const line = new THREE.Line(geometry, material);
      const group = new THREE.Group();
      group.add(line);
      const particleMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: 0xffdf80 }));
      const particle = new THREE.Mesh(ownGeometry(new THREE.SphereGeometry(0.075, 10, 8)), particleMaterial);
      group.add(particle);
      mapGroup.add(group);
      arcs.push({ group, line, particle, curve, phase: i / occupied.length });
    }
  }

  function setTooltip(dep, event) {
    if (!dep) { tooltip.classList.remove("is-visible"); hovered = null; return; }
    hovered = dep;
    const matching = currentCircles.filter((circle) => regionToIso(circle?.region) === dep.iso);
    const members = matching.reduce((sum, circle) => sum + (Array.isArray(circle.members) ? circle.members.length : Number(circle.members) || 0), 0);
    const title = document.createElement("strong");
    title.textContent = dep.feature.properties?.name || dep.iso;
    const info = document.createElement("span");
    info.textContent = lang === "en"
      ? `${matching.length} savings circles · ${members} members`
      : `${matching.length} círculos · ${members} miembros`;
    tooltip.replaceChildren(title, info);
    tooltip.classList.add("is-visible");
    if (event) {
      const bounds = root.getBoundingClientRect();
      tooltip.style.left = `${Math.max(6, Math.min(bounds.width - 210, event.clientX - bounds.left))}px`;
      tooltip.style.top = `${Math.max(6, Math.min(bounds.height - 72, event.clientY - bounds.top))}px`;
    }
  }

  function handlePointerMove(event) {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const pinHits = raycaster.intersectObjects(pins.map((pin) => pin.group), true);
    const depHits = raycaster.intersectObjects(departments.map((dep) => dep.mesh), false);
    const dep = depHits[0] ? departments.find((item) => item.mesh === depHits[0].object) : null;
    if (hovered !== dep) setTooltip(dep, event);
    else if (dep) {
      const bounds = root.getBoundingClientRect();
      tooltip.style.left = `${Math.max(6, Math.min(bounds.width - 210, event.clientX - bounds.left))}px`;
      tooltip.style.top = `${Math.max(6, Math.min(bounds.height - 72, event.clientY - bounds.top))}px`;
    }
    renderer.domElement.style.cursor = pinHits.length ? "pointer" : dep ? "help" : "grab";
  }

  function handleClick(event) {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(pins.map((pin) => pin.group), true)[0];
    if (hit) onSelect?.(hit.object.parent?.userData.circle || hit.object.parent?.parent?.userData.circle);
  }

  function resize() {
    if (disposed) return;
    const width = Math.max(1, root.clientWidth);
    const height = Math.max(1, root.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);
  const visibilityChange = () => {
    if (document.hidden) cancelAnimationFrame(frame);
    else if (!disposed) frame = requestAnimationFrame(animate);
  };
  document.addEventListener("visibilitychange", visibilityChange);
  renderer.domElement.addEventListener("pointermove", handlePointerMove);
  renderer.domElement.addEventListener("pointerleave", () => setTooltip(null));
  renderer.domElement.addEventListener("click", handleClick);

  const empty = document.createElement("div");
  empty.className = "awayu-mapa3d__empty";
  empty.textContent = lang === "en" ? "No circles registered yet" : "Todavía no hay círculos registrados";
  root.append(empty);

  async function loadMap() {
    try {
      const response = await fetch("/data/bolivia-departamentos.geojson");
      if (!response.ok) throw new Error(`GeoJSON HTTP ${response.status}`);
      geojson = await response.json();
      if (disposed) return;
      geojson.features.forEach(addDepartment);
      updateHeights();
      buildPinsAndArcs();
    } catch (error) {
      if (!disposed) {
        empty.textContent = lang === "en" ? "Could not load the Bolivia map" : "No se pudo cargar el mapa de Bolivia";
        console.error("Awayu: no se pudo cargar el GeoJSON del mapa", error);
      }
    }
  }

  function animate() {
    if (disposed || document.hidden) return;
    frame = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();
    for (const dep of departments) {
      const userData = dep.mesh.userData;
      const hoverTarget = hovered === dep ? 0.22 : 0;
      const target = userData.targetHeight + hoverTarget;
      userData.height += (target - userData.height) * 0.075;
      dep.mesh.scale.z = userData.height;
      dep.edges.scale.z = userData.height;
      dep.label.position.z += (userData.targetHeight + 0.32 + hoverTarget - dep.label.position.z) * 0.075;
    }
    for (const pin of pins) {
      const dep = departments.find((item) => item.iso === regionToIso(pin.circle.region));
      pin.group.position.z = (dep?.mesh.userData.height || 0.35) + 0.04 + Math.sin(elapsed * 2.8 + pin.index) * 0.065;
    }
    arcs.forEach((arc) => {
      const t = (elapsed * 0.16 + arc.phase) % 1;
      arc.particle.position.copy(arc.curve.getPoint(t));
    });
    controls.update();
    renderer.render(scene, camera);
  }

  function update(nextCircles = []) {
    currentCircles = Array.isArray(nextCircles) ? nextCircles : [];
    empty.hidden = currentCircles.length > 0;
    updateHeights();
    if (geojson) buildPinsAndArcs();
  }

  empty.hidden = currentCircles.length > 0;
  resize();
  loadMap();
  if (!document.hidden) frame = requestAnimationFrame(animate);

  return {
    update,
    destroy() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", visibilityChange);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("click", handleClick);
      controls.dispose();
      removeDynamic();
      scene.traverse((object) => {
        if (object.geometry) { object.geometry.dispose(); ownedGeometries.delete(object.geometry); }
      });
      for (const material of ownedMaterials) material.dispose();
      for (const texture of ownedTextures) texture.dispose();
      for (const geometry of ownedGeometries) geometry.dispose();
      ownedMaterials.clear(); ownedGeometries.clear();
      ownedTextures.clear();
      renderer.dispose();
      renderer.domElement.remove();
      root.remove();
    },
  };
}
