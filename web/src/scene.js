// Escena 3D: la mesa del pasanaku bajo el cielo del altiplano.
// Cada miembro es una pila de capas de aguayo (una por ronda); el pozo es una
// vasija en el centro; las monedas vuelan al aportar y al cobrar.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { clothTexture, markTexture, PALETTE } from "./aguayo.js";

const RING = 4.4;
const LAYER_H = 0.3;

export function createScene(container, { onPick } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.touchAction = "pan-y";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#0b0820");
  scene.fog = new THREE.FogExp2("#0b0820", 0.022);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 800);
  camera.position.set(0, 6.2, 14);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.2, 0);
  controls.enableDamping = true;
  controls.minDistance = 6;
  controls.maxDistance = 30;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.35;
  controls.enablePan = false;

  // Luces: luna fría y fogón cálido al centro
  scene.add(new THREE.HemisphereLight("#7d74c9", "#2a1410", 0.55));
  const moon = new THREE.DirectionalLight("#c9d4ff", 1.2);
  moon.position.set(-8, 14, 6);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 });
  scene.add(moon);
  const hearth = new THREE.PointLight("#ffb347", 18, 14, 1.6);
  hearth.position.set(0, 1.4, 0);
  scene.add(hearth);

  scene.add(stars(), mountains());

  // Suelo y aguayo
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(60, 64),
    new THREE.MeshStandardMaterial({ color: "#1a1222", roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const cloth = new THREE.Mesh(
    new THREE.CircleGeometry(6.2, 96),
    new THREE.MeshStandardMaterial({ map: clothTexture(), roughness: 0.95 })
  );
  cloth.rotation.x = -Math.PI / 2;
  cloth.position.y = 0.01;
  cloth.receiveShadow = true;
  scene.add(cloth);

  // Vasija del pozo (perfil de un cántaro andino)
  const jarGroup = new THREE.Group();
  const profile = [
    [0.0, 0], [0.55, 0], [0.75, 0.2], [0.95, 0.6], [0.98, 0.9], [0.85, 1.25],
    [0.55, 1.5], [0.42, 1.62], [0.48, 1.78], [0.5, 1.82],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const jar = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 48),
    new THREE.MeshStandardMaterial({ color: "#b4532a", roughness: 0.7, side: THREE.DoubleSide })
  );
  jar.castShadow = true;
  jarGroup.add(jar);
  // Franja pintada
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(0.99, 0.97, 0.22, 48, 1, true),
    new THREE.MeshStandardMaterial({ map: markTexture(1, 0), roughness: 0.6 })
  );
  band.position.y = 0.85;
  band.material.map.wrapS = THREE.RepeatWrapping;
  band.material.map.repeat.set(4, 1);
  jarGroup.add(band);
  const glow = new THREE.Mesh(
    new THREE.CircleGeometry(0.45, 32),
    new THREE.MeshBasicMaterial({ color: "#ffd166" })
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 1.79;
  jarGroup.add(glow);
  scene.add(jarGroup);

  // Haz de luz del turno
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 1.1, 14, 32, 1, true),
    new THREE.MeshBasicMaterial({
      color: "#ffd166", transparent: true, opacity: 0.13,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    })
  );
  beam.position.y = 7;
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.04, 8, 64),
    new THREE.MeshBasicMaterial({ color: "#ffd166" })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.05;
  const turn = new THREE.Group();
  turn.add(beam, halo);
  scene.add(turn);

  // Posprocesado con brillo
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.85, 0.5, 0.82);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // Miembros
  const members = []; // { group, layers: Mesh[], label, pos }
  const coinGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.04, 24);
  const coinMat = new THREE.MeshStandardMaterial({
    color: "#ffcf4a", metalness: 0.9, roughness: 0.25, emissive: "#a86b00", emissiveIntensity: 0.6,
  });
  const layerGeo = new THREE.BoxGeometry(1.15, LAYER_H * 0.92, 0.8);
  const tweens = [];
  let selected = -1;

  function memberPos(i, n) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return new THREE.Vector3(Math.cos(a) * RING, 0, Math.sin(a) * RING);
  }

  function makeLayer(mark, round) {
    const tex = markTexture(mark, round);
    // El tejido brilla un poco por sí mismo para leerse aun en la sombra
    const side = new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.9,
      emissive: "#ffffff", emissiveMap: tex, emissiveIntensity: mark === 3 ? 0.5 : 0.32,
    });
    const top = new THREE.MeshStandardMaterial({ color: mark === 3 ? PALETTE.negro : "#2b1b33", roughness: 1 });
    const m = new THREE.Mesh(layerGeo, [side, side, top, top, side, side]);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function label(text, sub) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 160;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
    sprite.scale.set(2.2, 0.69, 1);
    sprite.userData.draw = (t, s, hl) => {
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, 512, 160);
      ctx.fillStyle = hl ? "rgba(255,209,102,.95)" : "rgba(14,10,30,.78)";
      roundRect(ctx, 16, 20, 480, 120, 60);
      ctx.fill();
      ctx.fillStyle = hl ? "#1b1030" : "#fff";
      ctx.font = "700 50px 'Bricolage Grotesque', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(t, 256, 82);
      ctx.font = "500 32px 'JetBrains Mono', monospace";
      ctx.fillStyle = hl ? "#3b2a00" : "#ffd166";
      ctx.fillText(s, 256, 122);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      sprite.material.map?.dispose();
      sprite.material.map = tex;
      sprite.material.needsUpdate = true;
    };
    sprite.userData.draw(text, sub, false);
    return sprite;
  }

  function setMembers(list) {
    for (const m of members) scene.remove(m.group);
    members.length = 0;
    list.forEach((mem, i) => {
      const group = new THREE.Group();
      const pos = memberPos(i, list.length);
      group.position.copy(pos);
      group.lookAt(0, 0, 0);
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75, 0.85, 0.12, 32),
        new THREE.MeshStandardMaterial({ color: "#3b2547", roughness: 0.8 })
      );
      base.position.y = 0.06;
      base.receiveShadow = true;
      group.add(base);
      const layers = mem.history.map((mark, r) => {
        const l = makeLayer(mark, r);
        l.position.y = 0.12 + LAYER_H * (r + 0.5);
        group.add(l);
        return l;
      });
      const lab = label(mem.name, "");
      group.add(lab);
      const hit = new THREE.Mesh(
        new THREE.CylinderGeometry(0.9, 0.9, 4, 12),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hit.position.y = 2;
      hit.userData.index = i;
      group.add(hit);
      scene.add(group);
      members.push({ group, layers, label: lab, pos, hit, pending: null });
    });
  }

  function topOf(i) {
    const m = members[i];
    return 0.12 + LAYER_H * m.layers.length + (m.pending ? LAYER_H : 0);
  }

  function updateLabels(list, scores, recipient) {
    list.forEach((mem, i) => {
      const m = members[i];
      if (!m) return;
      const top = topOf(i);
      m.label.position.y = top + 0.75;
      m.label.userData.draw(mem.name, scores[i], i === recipient || i === selected);
    });
  }

  function setTurn(i, animate = true) {
    if (i == null || !members[i]) {
      turn.visible = false;
      return;
    }
    turn.visible = true;
    const to = members[i].pos;
    if (!animate) return turn.position.copy(to);
    const from = turn.position.clone();
    tween(900, (k) => turn.position.lerpVectors(from, to, ease(k)));
  }

  function addLayer(i, mark, round) {
    const m = members[i];
    const l = makeLayer(mark, round);
    l.position.y = 0.12 + LAYER_H * (m.layers.length + 0.5);
    l.scale.set(0.01, 0.01, 0.01);
    m.group.add(l);
    m.layers.push(l);
    tween(650, (k) => l.scale.setScalar(Math.max(0.01, backOut(k))));
  }

  /** Marca provisional (aporte de la ronda en curso) encima de la pila. */
  function setPending(i, mark, round) {
    const m = members[i];
    if (m.pending) m.group.remove(m.pending);
    m.pending = null;
    if (!mark) return;
    const l = makeLayer(mark, round);
    l.position.y = 0.12 + LAYER_H * (m.layers.length + 0.5);
    l.material.forEach((x) => { x.transparent = true; x.opacity = 0.9; });
    m.group.add(l);
    m.pending = l;
    l.scale.setScalar(0.01);
    tween(650, (k) => l.scale.setScalar(Math.max(0.01, backOut(k))));
  }

  function commitPending(i, mark, round) {
    const m = members[i];
    if (m.pending) {
      m.group.remove(m.pending);
      m.pending = null;
    }
    addLayer(i, mark, round);
  }

  function coinArc(from, to, delay = 0, done) {
    const coin = new THREE.Mesh(coinGeo, coinMat);
    coin.visible = false;
    scene.add(coin);
    const mid = from.clone().lerp(to, 0.5);
    mid.y += 2.6;
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    setTimeout(() => {
      coin.visible = true;
      tween(1100, (k) => {
        coin.position.copy(curve.getPoint(ease(k)));
        coin.rotation.x = k * 12;
        coin.rotation.z = k * 6;
        if (k >= 1) {
          scene.remove(coin);
          done?.();
        }
      });
    }, delay);
  }

  function worldTop(i) {
    const m = members[i];
    const p = m.pos.clone();
    p.y = topOf(i) + 0.2;
    return p;
  }

  const jarMouth = new THREE.Vector3(0, 1.85, 0);

  function flyContribution(i, done) {
    coinArc(worldTop(i), jarMouth, 0, () => {
      pulse();
      done?.();
    });
  }

  function flyPayout(i, count, done) {
    const n = Math.min(Math.max(count, 1), 12);
    for (let k = 0; k < n; k++) {
      coinArc(jarMouth, worldTop(i), k * 90, k === n - 1 ? done : null);
    }
    flash();
  }

  function pulse() {
    tween(500, (k) => {
      glow.scale.setScalar(1 + Math.sin(k * Math.PI) * 0.35);
      hearth.intensity = 18 + Math.sin(k * Math.PI) * 25;
    });
  }

  function flash() {
    tween(1400, (k) => {
      beam.material.opacity = 0.13 + Math.sin(k * Math.PI) * 0.35;
      bloom.strength = 0.85 + Math.sin(k * Math.PI) * 0.9;
    });
  }

  function setPotLevel(f) {
    glow.material.color.setHSL(0.11, 1, 0.35 + 0.35 * f);
    hearth.intensity = 10 + 30 * f;
  }

  function select(i) {
    selected = i;
  }

  function focus(i) {
    controls.autoRotate = i == null;
    const p = i == null ? new THREE.Vector3(0, 1.2, 0) : members[i].pos.clone().setY(1);
    // Vista desde un costado del miembro, con la vasija de fondo
    const side = i == null ? null : members[i].pos.clone().normalize();
    const camTo = i == null
      ? new THREE.Vector3(0, 6.2, 14)
      : members[i].pos.clone()
          .add(side.clone().multiplyScalar(3.2))
          .add(new THREE.Vector3(-side.z, 0, side.x).multiplyScalar(2.4))
          .setY(3.4);
    const t0 = controls.target.clone();
    const c0 = camera.position.clone();
    tween(1300, (k) => {
      controls.target.lerpVectors(t0, p, ease(k));
      camera.position.lerpVectors(c0, camTo, ease(k));
    });
  }

  // Selección con clic o toque
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  renderer.domElement.addEventListener("pointerdown", (e) => (down = [e.clientX, e.clientY]));
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(members.map((m) => m.hit));
    onPick?.(hits.length ? hits[0].object.userData.index : -1);
  });
  renderer.domElement.addEventListener("pointerdown", () => (controls.autoRotate = false), { once: true });

  // Animación
  function tween(ms, fn) {
    tweens.push({ t0: performance.now(), ms, fn });
  }
  const clock = new THREE.Clock();
  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = w < 700 ? 55 : 42;
    // En escritorio el panel ocupa la derecha: centramos la mesa en lo que queda libre
    if (w >= 760) camera.setViewOffset(w, h, 190, 0, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    const now = performance.now();
    for (let k = tweens.length - 1; k >= 0; k--) {
      const tw = tweens[k];
      const p = Math.min(1, (now - tw.t0) / tw.ms);
      tw.fn(p);
      if (p >= 1) tweens.splice(k, 1);
    }
    halo.rotation.z = t * 0.8;
    halo.scale.setScalar(1 + Math.sin(t * 2.4) * 0.06);
    cloth.rotation.z = t * 0.01;
    members.forEach((m) => {
      if (m.pending) m.pending.position.y = 0.12 + LAYER_H * (m.layers.length + 0.5) + Math.sin(t * 3) * 0.03;
    });
    controls.update();
    composer.render();
  });

  return {
    setMembers, updateLabels, setTurn, addLayer, setPending, commitPending,
    flyContribution, flyPayout, setPotLevel, select, focus, controls,
  };
}

function stars() {
  const n = 2500;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * 0.48 * Math.PI;
    const r = 220 + Math.random() * 60;
    pos.set([Math.cos(u) * Math.cos(v) * r, Math.sin(v) * r + 4, Math.sin(u) * Math.cos(v) * r], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: "#fff8e7", size: 0.9, sizeAttenuation: true, fog: false }));
}

/** Anillo de cerros en el horizonte, con nieve en las cumbres (como el Tunari). */
function mountains() {
  const seg = 160;
  const pos = [];
  const col = [];
  const rock = new THREE.Color("#241a38");
  const snow = new THREE.Color("#c7c9e8");
  const h = (a) =>
    6 + 7 * Math.max(0, Math.sin(a * 3 + 1)) ** 2 + 3 * Math.sin(a * 11) ** 2 + 1.5 * Math.sin(a * 29 + 2);
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2;
    const a1 = ((i + 1) / seg) * Math.PI * 2;
    const R = 70;
    const p0 = [Math.cos(a0) * R, 0, Math.sin(a0) * R];
    const p1 = [Math.cos(a1) * R, 0, Math.sin(a1) * R];
    const t0 = [Math.cos(a0) * R, h(a0), Math.sin(a0) * R];
    const t1 = [Math.cos(a1) * R, h(a1), Math.sin(a1) * R];
    pos.push(...p0, ...t0, ...p1, ...p1, ...t0, ...t1);
    for (const p of [p0, t0, p1, p1, t0, t1]) {
      const c = p[1] > 12 ? snow : rock;
      col.push(c.r, c.g, c.b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false }));
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const backOut = (k) => 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);
