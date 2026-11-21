import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { PALETTE, drawPallay } from "../aguayo.js";
import { pickLang } from "../i18n.js";

const COLORS = Object.values(PALETTE);
const LANG_CODES = new Set(["es", "en", "pt", "qu", "ay", "gn"]);
const TEXT = {
  es: { title: "Tu billetera", demo: "Demo · datos de ejemplo", connected: "Billetera conectada", empty: "Conecta tu billetera para tejer tu planeta" },
  en: { title: "Your wallet", demo: "Demo · sample data", connected: "Wallet connected", empty: "Connect your wallet to weave your planet" },
};
for (const code of ["pt", "qu", "ay", "gn"]) TEXT[code] = { ...TEXT.es };

export function scaleBalance(value) {
  const amount = Math.max(0, Number(value) || 0);
  // anillos finos: de 0,012 a 0,06 de grosor (antes llegaban a 0,22)
  return 0.012 + Math.min(0.048, Math.log10(amount + 1) * 0.014);
}

export function scaleContribution(value) {
  return 0.12 + Math.min(0.28, Math.sqrt(Math.max(0, Number(value) || 0)) * 0.035);
}

export function normalizeWalletData(data = {}) {
  return {
    address: data.address || "",
    lang: LANG_CODES.has(data.lang) ? data.lang : "es",
    balances: Array.isArray(data.balances) ? data.balances : [],
    payments: Array.isArray(data.payments) ? data.payments : [],
    circles: Array.isArray(data.circles) ? data.circles : [],
    reputation: Math.max(0, Math.min(100, Number(data.reputation) || 0)),
  };
}

function wovenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = PALETTE.rojo; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const patterns = [["magenta", "amarillo", "verde"], ["turquesa", "naranja", "morado"], ["verde", "magenta", "amarillo"], ["naranja", "azul", "crema"]];
  patterns.forEach((p, i) => drawPallay(ctx, 0, 54 + i * 105, canvas.width, 55, p));
  ctx.globalAlpha = 0.2;
  for (let y = 0; y < canvas.height; y += 5) { ctx.fillStyle = y % 10 ? "#120d19" : "#fff"; ctx.fillRect(0, y, canvas.width, 1); }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function labelSprite(text, color = "#fff") {
  const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 96;
  const ctx = canvas.getContext("2d");
  ctx.font = "600 34px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = color; ctx.shadowBlur = 18; ctx.fillStyle = color; ctx.fillText(String(text).slice(0, 26), 256, 48);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(1.8, 0.34, 1);
  return sprite;
}

function disposeTree(root) {
  root.traverse((obj) => {
    obj.geometry?.dispose();
    if (Array.isArray(obj.material)) obj.material.forEach((material) => { material.map?.dispose(); material.dispose(); });
    else if (obj.material) { obj.material.map?.dispose(); obj.material.dispose(); }
  });
}

export function mount(container, initial = {}) {
  let data = normalizeWalletData(initial);
  let copy = pickLang(TEXT, data.lang);
  container.replaceChildren();
  container.style.position ||= "relative";
  container.style.overflow = "hidden";
  container.style.minHeight ||= "420px";
  const canvasWrap = document.createElement("div");
  canvasWrap.style.cssText = "position:absolute;inset:0;min-height:inherit";
  container.append(canvasWrap);
  const caption = document.createElement("div");
  caption.setAttribute("aria-live", "polite");
  caption.style.cssText = "position:absolute;left:20px;top:16px;color:#f3e6c8;font:500 13px system-ui;letter-spacing:.02em;text-shadow:0 2px 12px #090714;pointer-events:none";
  container.append(caption);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch {
    caption.textContent = data.address ? copy.empty : copy.demo;
    return { update(next) { data = normalizeWalletData({ ...data, ...next }); }, destroy() { container.replaceChildren(); } };
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x090714, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;min-height:inherit";
  canvasWrap.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = null;
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
  camera.position.set(0, 0.7, 8.4);
  scene.add(new THREE.AmbientLight(0x9ab7ff, 1.4));
  const key = new THREE.PointLight(0xffc67a, 75, 30); key.position.set(-4, 4, 6); scene.add(key);
  const rim = new THREE.PointLight(0x43d9ff, 50, 25); rim.position.set(4, -2, -3); scene.add(rim);

  const starsGeometry = new THREE.BufferGeometry();
  const starPositions = new Float32Array(850 * 3);
  for (let i = 0; i < starPositions.length; i += 3) {
    starPositions[i] = (Math.random() - 0.5) * 32;
    starPositions[i + 1] = (Math.random() - 0.5) * 20;
    starPositions[i + 2] = -3 - Math.random() * 22;
  }
  starsGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xc9d7ff, size: 0.025, transparent: true, opacity: 0.8 })); scene.add(stars);

  const planet = new THREE.Group(); scene.add(planet);
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.35, 64, 64), new THREE.MeshStandardMaterial({ map: wovenTexture(), roughness: 0.62, metalness: 0.08 })); planet.add(sphere);
  const aura = new THREE.Mesh(new THREE.SphereGeometry(1.49, 48, 48), new THREE.MeshBasicMaterial({ color: 0x5bdcff, transparent: true, opacity: 0.12, side: THREE.BackSide, blending: THREE.AdditiveBlending })); planet.add(aura);
  const rings = new THREE.Group(); rings.rotation.x = 1.13; rings.rotation.y = -0.16; planet.add(rings);
  const satellites = new THREE.Group(); planet.add(satellites);
  const crown = new THREE.Group(); planet.add(crown);
  const comets = new THREE.Group(); scene.add(comets);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.045;
  controls.enablePan = false; controls.minDistance = 5.5; controls.maxDistance = 12;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.42;
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.52, 0.5, 0.82); composer.addPass(bloom);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  let visible = !document.hidden;
  let destroyed = false;
  let last = 0;

  function clearGroup(group) {
    for (const child of [...group.children]) { group.remove(child); disposeTree(child); }
  }
  function rebuild() {
    clearGroup(rings); clearGroup(satellites); clearGroup(crown); clearGroup(comets);
    const balances = data.balances.length ? data.balances : (data.address ? [] : [{ asset: "XLM", balance: "1250" }, { asset: "USDC", balance: "86" }]);
    balances.forEach((entry, i) => {
      const radius = 1.78 + i * 0.23;
      const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, scaleBalance(entry.balance), 12, 220), new THREE.MeshStandardMaterial({ color: COLORS[i % COLORS.length], emissive: COLORS[i % COLORS.length], emissiveIntensity: 0.38, metalness: 0.48, roughness: 0.3 }));
      mesh.rotation.x = (i % 2 ? 0.15 : -0.12); rings.add(mesh);
      const label = labelSprite(`${entry.asset ?? entry.code ?? "Asset"}  ${entry.balance ?? "0"}`, COLORS[i % COLORS.length]);
      label.position.set(radius, 0.1 + i * 0.06, 0); rings.add(label);
    });
    const circles = data.circles.length ? data.circles : (!data.address ? [{ name: "Pasanaku demo", contribution: 60 }] : []);
    circles.forEach((circle, i) => {
      const orbit = new THREE.Group(); orbit.rotation.y = i * 1.7; orbit.rotation.z = 0.3 + i * 0.6; satellites.add(orbit);
      const radius = 2.65 + (i % 3) * 0.4;
      const moon = new THREE.Mesh(new THREE.IcosahedronGeometry(scaleContribution(circle.contribution ?? circle.amount ?? circle.quota), 2), new THREE.MeshStandardMaterial({ color: COLORS[(i + 3) % COLORS.length], emissive: COLORS[(i + 3) % COLORS.length], emissiveIntensity: 0.35, roughness: 0.42 }));
      moon.position.set(radius, 0, 0); orbit.add(moon);
      const label = labelSprite(circle.name ?? circle.alias ?? "Pasanaku", COLORS[(i + 3) % COLORS.length]); label.position.set(radius, 0.35, 0); orbit.add(label);
    });
    const score = data.reputation || (!data.address ? 84 : 0);
    for (let i = 0; i < Math.round(score / 5); i++) {
      const theta = i / Math.max(1, Math.round(score / 5)) * Math.PI * 2;
      const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), new THREE.MeshBasicMaterial({ color: COLORS[i % COLORS.length], toneMapped: false }));
      diamond.position.set(Math.cos(theta) * 1.42, 0, Math.sin(theta) * 1.42); diamond.rotation.y = theta; crown.add(diamond);
    }
    (data.payments.length ? data.payments : (!data.address ? [{ type: "payment", amount: "12", asset: "XLM", from: "other", to: "me" }] : [])).slice(0, 12).forEach((payment, i) => {
      const incoming = payment.to === data.address || payment.type === "received" || payment.type === "payment" && !data.address;
      const color = incoming ? 0x8af6cd : 0xffae72;
      const comet = new THREE.Group();
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), new THREE.MeshBasicMaterial({ color, toneMapped: false })); comet.add(head);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.34, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.65, toneMapped: false })); tail.rotation.x = Math.PI / 2; tail.position.z = -0.2; comet.add(tail);
      comet.position.set(incoming ? -4.5 - i * 0.03 : 4.5 + i * 0.03, (i % 3 - 1) * 0.28, -0.4); comet.userData.incoming = incoming; comet.userData.phase = i * 0.55; comets.add(comet);
    });
    copy = pickLang(TEXT, data.lang);
    caption.textContent = data.address
      ? `${copy.connected}${data.address.length > 15 ? ` · ${data.address.slice(0, 6)}…${data.address.slice(-5)}` : ` · ${data.address}`}`
      : copy.demo;
  }
  function resize() {
    const width = Math.max(1, container.clientWidth); const height = Math.max(1, container.clientHeight || 480);
    renderer.setSize(width, height, false); composer.setSize(width, height);
    camera.aspect = width / height; camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize); observer.observe(container); resize(); rebuild();
  const visibility = () => {
    visible = !document.hidden;
    if (visible && !frame) frame = requestAnimationFrame(animate);
    else if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; }
  };
  document.addEventListener("visibilitychange", visibility);
  const motion = () => { controls.autoRotate = !reduced.matches; };
  reduced.addEventListener?.("change", motion); motion();
  function animate(time) {
    frame = 0;
    if (!visible || destroyed) return;
    if (reduced.matches && time - last < 1000 / 12) { frame = requestAnimationFrame(animate); return; }
    last = time;
    const dt = Math.min(0.05, (time - (animate.prev || time)) / 1000); animate.prev = time;
    planet.rotation.y += reduced.matches ? 0 : dt * 0.08;
    satellites.children.forEach((satellite, i) => { satellite.rotation.y += reduced.matches ? 0 : dt * (0.12 + i * 0.025); });
    comets.children.forEach((comet) => { comet.position.x += (comet.userData.incoming ? 1 : -1) * dt * 0.48; if (Math.abs(comet.position.x) > 4.8) comet.position.x *= -1; });
    controls.update(); composer.render();
    frame = requestAnimationFrame(animate); // sin esto se dibujaba un solo cuadro
  }
  if (visible) frame = requestAnimationFrame(animate);

  return {
    update(next = {}) { data = normalizeWalletData({ ...data, ...next }); rebuild(); },
    destroy() {
      destroyed = true; cancelAnimationFrame(frame); observer.disconnect(); document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener?.("change", motion);
      controls.dispose(); composer.dispose(); disposeTree(scene); renderer.dispose(); renderer.domElement.remove(); container.replaceChildren();
    },
  };
}
