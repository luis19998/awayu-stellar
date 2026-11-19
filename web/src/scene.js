// Escena 3D: la mesa del pasanaku bajo el cielo del altiplano.
// Cada miembro es una pila de capas de aguayo (una por ronda); el pozo es una
// vasija en el centro; las monedas vuelan al aportar y al cobrar.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { clothTexture, markTexture, PALETTE } from "./aguayo.js";
import { SCENARIOS, skyDome, hillsMesh, props, groundFor } from "./scenarios.js";

/** Vasijas disponibles: archivo/nodo del modelo y altura de la boca (donde caen las monedas). */
export const VESSELS = {
  cantaro: { label: "Cántaro pintado", mouth: 1.85, glow: true },
  qero: { label: "Q'ero con tocapus", node: "vasija_qero", mouth: 1.9, glow: true },
  chanchito: { label: "Chanchito alcancía", node: "vasija_chanchito", mouth: 1.78, glow: false },
  olla: { label: "Olla de barro", node: "vasija_olla", mouth: 1.72, glow: false },
  cofre: { label: "Cofre de madera", node: "vasija_cofre", mouth: 1.8, glow: false },
};
/** Mesas: ninguna (aguayo sobre el suelo) o una de las talladas en Blender. */
export const TABLES = {
  suelo: { label: "Aguayo sobre el suelo", h: 0 },
  madera: { label: "Mesa de madera", node: "mesa_madera_h0.55", h: 0.55 },
  piedra: { label: "Mesa de piedra", node: "mesa_piedra_h0.7", h: 0.7 },
  sal: { label: "Bloque de sal", node: "mesa_sal_h0.45", h: 0.45 },
  tronco: { label: "Tronco cortado", node: "mesa_tronco_h0.6", h: 0.6 },
};

const RING = 4.4;
const LAYER_H = 0.3;

export function createScene(container, { onPick } = {}) {
  // En pantallas chicas (celulares) bajamos resolución y sombras para cuidar batería
  const small = Math.min(innerWidth, innerHeight) < 760;
  const renderer = new THREE.WebGLRenderer({ antialias: !small, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.style.touchAction = "pan-y";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#0b0820");
  scene.fog = new THREE.FogExp2("#0b0820", 0.022);
  // Reflejos: un entorno de estudio suave para la cerámica, el oro y el agua
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.35;

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 800);
  camera.position.set(0, 6.2, 14);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.2, 0);
  controls.enableDamping = true;
  controls.minDistance = 6;
  controls.maxDistance = 30;
  controls.maxPolarAngle = Math.PI * 0.47;
  // Respeta "reducir movimiento" del sistema: sin giro automático
  const calm = matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  controls.autoRotate = !calm;
  controls.autoRotateSpeed = 0.35;
  controls.enablePan = false;

  // Luces: luna fría y fogón cálido al centro
  const hemi = new THREE.HemisphereLight("#7d74c9", "#2a1410", 0.55);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight("#c9d4ff", 1.2);
  moon.position.set(-8, 14, 6);
  moon.castShadow = true;
  moon.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(moon.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10 });
  scene.add(moon);
  const hearth = new THREE.PointLight("#ffb347", 18, 14, 1.6);
  hearth.position.set(0, 1.4, 0);
  scene.add(hearth);

  // Paisaje (cielo, estrellas, cerros, suelo y detalles) que cambia con el escenario
  const sky = skyDome(SCENARIOS.altiplano.sky);
  const starField = stars();
  scene.add(sky, starField);
  const landscape = new THREE.Group();
  scene.add(landscape);

  // Todo lo que está sobre la mesa vive en "stage", que sube con la altura de la mesa
  const stage = new THREE.Group();
  scene.add(stage);
  const tableSlot = new THREE.Group();
  scene.add(tableSlot);

  const cloth = new THREE.Mesh(
    new THREE.CircleGeometry(6.2, 96),
    new THREE.MeshStandardMaterial({ map: clothTexture(), roughness: 0.95 })
  );
  cloth.rotation.x = -Math.PI / 2;
  cloth.position.y = 0.01;
  cloth.receiveShadow = true;
  stage.add(cloth);

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
  stage.add(jarGroup);

  // Modelos hechos en Blender y Fusion 360 (si fallan, queda la versión procedural)
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath("/draco/");
  loader.setDRACOLoader(draco);
  const cache = new Map();
  const loadModel = (name) => {
    if (!cache.has(name))
      cache.set(name, new Promise((ok) => loader.load(`/models/${name}.glb`, (g) => ok(g.scene), undefined, () => ok(null))));
    return cache.get(name);
  };
  const shadowy = (o) => o.traverse((c) => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } });
  let vesselModel = null;
  let vesselId = "cantaro";

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
  stage.add(turn);

  // Posprocesado con brillo
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.85, 0.5, 0.82);
  let baseBloom = 0.85;
  let baseHearth = 18;
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // Miembros
  const members = []; // { group, layers: Mesh[], label, pos }
  const coinGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.04, 24);
  let coinProto = null;
  loadModel("moneda").then((m) => {
    if (!m) return;
    m.scale.setScalar(0.17);
    m.traverse((c) => {
      if (c.isMesh) c.material = coinMat;
    });
    coinProto = m;
  });

  // Illa: amuleto de prosperidad sobre la pila de quien tiene mejor reputación
  const illa = new THREE.Group();
  illa.visible = false;
  stage.add(illa);
  let illaOwner = -1;
  loadModel("illa").then((m) => {
    if (!m) return;
    m.scale.setScalar(0.55);
    m.rotation.y = Math.PI / 2;
    shadowy(m);
    illa.add(m);
    // Luz propia: la illa "brilla" sobre la pila de quien la gana
    const glowLight = new THREE.PointLight("#ffe7b0", 1.4, 3, 1.5);
    glowLight.position.set(0.6, 1.6, 0.9);
    illa.add(glowLight);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.015, 8, 48),
      new THREE.MeshBasicMaterial({ color: "#5fe0ea" })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    illa.add(ring);
    if (illaOwner >= 0) placeIlla(illaOwner);
  });
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

  /** Libera la memoria de GPU de un objeto retirado (sin tocar geometrías compartidas). */
  function dispose(obj) {
    obj.traverse((o) => {
      if (o.userData.figure) return; // geometría compartida del catálogo de personajes
      if (o.geometry && o.geometry !== layerGeo && o.geometry !== coinGeo) o.geometry.dispose();
      const mats = o.userData.figure ? [] : Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const mat of new Set(mats)) {
        mat.map?.dispose();
        mat.emissiveMap?.dispose();
        mat.dispose();
      }
    });
  }

  // Personajes (36 figuras de Alasitas hechas en Blender)
  let figures = null; // Map nombre -> malla
  const figuresReady = loadModel("personajes").then((root) => {
    if (!root) return null;
    figures = new Map();
    root.traverse((o) => {
      if (o.isMesh && o.name.startsWith("pj_")) figures.set(o.name, o);
    });
    return figures;
  });
  let lastList = [];
  function figureFor(mem, i) {
    if (!figures || !figures.size) return null;
    const names = [...figures.keys()].sort();
    const key = mem.figure && figures.has(mem.figure) ? mem.figure : names[hashIndex(mem.address || mem.name, names.length, i)];
    const src = figures.get(key);
    const f = new THREE.Mesh(src.geometry, src.material);
    f.castShadow = true;
    f.receiveShadow = true;
    f.userData.figure = key;
    return f;
  }

  function setMembers(list) {
    lastList = list;
    for (const m of members) {
      stage.remove(m.group);
      dispose(m.group, true);
    }
    members.length = 0;
    list.forEach((mem, i) => {
      const group = new THREE.Group();
      const pos = memberPos(i, list.length);
      group.position.copy(pos);
      group.rotation.y = Math.atan2(-pos.x, -pos.z); // mira al centro sin inclinarse si la mesa sube
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
      // Personaje parado al costado de su pila, mirando hacia afuera
      const fig = figureFor(mem, i);
      if (fig) {
        fig.position.set(0.95, 0, 0.05);
        fig.rotation.y = Math.PI;
        fig.scale.setScalar(1.3);
        group.add(fig);
      }
      stage.add(group);
      members.push({ group, layers, label: lab, pos, hit, pending: null, fig });
    });
  }
  // Cuando llegan los personajes, se rearma la ronda con ellos
  figuresReady.then(() => {
    if (!lastList.length) return;
    setMembers(lastList);
    if (lastLabels) updateLabels(...lastLabels);
    if (turnIndex >= 0) setTurn(turnIndex, false);
    if (illaOwner >= 0) placeIlla(illaOwner);
  });

  function topOf(i) {
    const m = members[i];
    return 0.12 + LAYER_H * m.layers.length + (m.pending ? LAYER_H : 0);
  }

  let lastLabels = null;
  function updateLabels(list, scores, recipient) {
    lastLabels = [list, scores, recipient];
    list.forEach((mem, i) => {
      const m = members[i];
      if (!m) return;
      const top = topOf(i);
      m.label.position.y = top + 0.75 + (i === illaOwner && illa.visible ? 0.7 : 0);
      m.label.userData.draw(mem.name, scores[i], i === recipient || i === selected);
    });
  }

  let turnIndex = -1;
  function setTurn(i, animate = true) {
    turnIndex = i ?? -1;
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
    if (m.pending) {
      m.group.remove(m.pending);
      dispose(m.pending);
    }
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
      dispose(m.pending);
      m.pending = null;
    }
    addLayer(i, mark, round);
  }

  function coinArc(from, to, delay = 0, done) {
    const coin = coinProto ? coinProto.clone() : new THREE.Mesh(coinGeo, coinMat);
    coin.visible = false;
    stage.add(coin);
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
          stage.remove(coin);
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

  const jarMouth = new THREE.Vector3(0, VESSELS.cantaro.mouth, 0);

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
      hearth.intensity = baseHearth + Math.sin(k * Math.PI) * 25;
    });
  }

  function flash() {
    tween(1400, (k) => {
      beam.material.opacity = 0.13 + Math.sin(k * Math.PI) * 0.35;
      bloom.strength = baseBloom + Math.sin(k * Math.PI) * 0.9;
    });
  }

  // Anillo de plazo alrededor de la vasija: se llena a medida que pasa la ronda
  const ringGroup = new THREE.Group();
  ringGroup.rotation.x = -Math.PI / 2;
  ringGroup.position.y = 0.03;
  const ringBg = new THREE.Mesh(
    new THREE.RingGeometry(1.32, 1.42, 96),
    new THREE.MeshBasicMaterial({ color: "#2b1b33", transparent: true, opacity: 0.85 })
  );
  const ringMat = new THREE.MeshBasicMaterial({ color: "#5fe0ea", transparent: true, opacity: 0.95 });
  let ringFg = new THREE.Mesh(new THREE.RingGeometry(1.32, 1.42, 96, 1, Math.PI / 2, 0.0001), ringMat);
  ringGroup.add(ringBg, ringFg);
  stage.add(ringGroup);
  let ringValue = -1;

  function setDeadline(f) {
    const v = Math.round(Math.min(1, Math.max(0, f)) * 200) / 200;
    if (v === ringValue) return;
    ringValue = v;
    ringGroup.remove(ringFg);
    ringFg.geometry.dispose();
    // De cian (tiempo de sobra) a rojo (plazo por vencer)
    ringMat.color.setHSL(0.5 - 0.5 * v, 0.85, 0.55);
    ringFg = new THREE.Mesh(new THREE.RingGeometry(1.32, 1.42, 96, 1, Math.PI / 2, Math.max(0.0001, -v * Math.PI * 2)), ringMat);
    ringGroup.add(ringFg);
  }

  function setPotLevel(f) {
    glow.material.color.setHSL(0.11, 1, 0.35 + 0.35 * f);
    hearth.intensity = baseHearth * 0.6 + 30 * f * (baseHearth / 18);
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
  const t0 = performance.now();
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

  // Sin pestaña visible no dibujamos
  document.addEventListener("visibilitychange", () => renderer.setAnimationLoop(document.hidden ? null : frame));
  renderer.setAnimationLoop(frame);
  function frame() {
    const t = (performance.now() - t0) / 1000;
    const now = performance.now();
    for (let k = tweens.length - 1; k >= 0; k--) {
      const tw = tweens[k];
      const p = Math.min(1, (now - tw.t0) / tw.ms);
      tw.fn(p);
      if (p >= 1) tweens.splice(k, 1);
    }
    halo.rotation.z = t * 0.8;
    members.forEach((m, i) => {
      if (!m.fig) return;
      const hop = i === turnIndex ? Math.abs(Math.sin(t * 4)) * 0.18 : i === selected ? 0.06 : 0;
      m.fig.position.y = hop;
      m.fig.rotation.y = Math.PI + (i === turnIndex ? Math.sin(t * 2) * 0.35 : 0);
    });
    if (illa.visible) {
      illa.rotation.y = t * 0.6;
      illa.position.y = topOf(illaOwner) + 0.02 + Math.sin(t * 1.8) * 0.04;
    }
    halo.scale.setScalar(1 + Math.sin(t * 2.4) * 0.06);
    cloth.rotation.z = t * 0.01;
    members.forEach((m) => {
      if (m.pending) m.pending.position.y = 0.12 + LAYER_H * (m.layers.length + 0.5) + Math.sin(t * 3) * 0.03;
    });
    controls.update();
    composer.render();
  }

  /** Vuelve a tejer el aguayo del suelo y la franja de la vasija con la paleta actual. */
  function retheme() {
    cloth.material.map?.dispose();
    cloth.material.map = clothTexture();
    cloth.material.needsUpdate = true;
    const t = markTexture(1, 0);
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(4, 1);
    band.material.map?.dispose();
    band.material.map = t;
    band.material.needsUpdate = true;
  }

  // ---------- Personalización: escenario, vasija y mesa ----------
  const skin = { scenario: null, vessel: null, table: null };

  function setScenario(id) {
    const sc = SCENARIOS[id] || SCENARIOS.altiplano;
    skin.scenario = id;
    sky.userData.setColors(sc.sky);
    scene.background = new THREE.Color(sc.sky[2]);
    scene.fog = new THREE.FogExp2(sc.fog[0], sc.fog[1]);
    starField.visible = !!sc.night;
    hemi.color.set(sc.hemi[0]);
    hemi.groundColor.set(sc.hemi[1]);
    hemi.intensity = sc.hemi[2];
    moon.color.set(sc.sun[0]);
    moon.intensity = sc.sun[1];
    moon.position.set(...sc.sun[2]);
    renderer.toneMappingExposure = sc.exposure;
    bloom.strength = sc.bloom;
    baseBloom = sc.bloom;
    baseHearth = sc.hearth;
    hearth.intensity = sc.hearth;
    scene.environmentIntensity = sc.night ? 0.35 : 0.55;
    while (landscape.children.length) {
      const c = landscape.children.pop();
      c.traverse?.((o) => {
        o.geometry?.dispose();
        o.material?.dispose?.();
        o.dispose?.();
      });
    }
    landscape.add(groundFor(sc, { small }), hillsMesh(sc.hills), props(sc));
  }

  async function setVessel(id) {
    const v = VESSELS[id] || VESSELS.cantaro;
    skin.vessel = id;
    const root = await loadModel(v.node ? "vasijas" : "cantaro");
    if (skin.vessel !== id) return;
    if (vesselModel) jarGroup.remove(vesselModel);
    vesselModel = null;
    if (root) {
      const src = v.node ? root.getObjectByName(v.node) : root;
      if (src) {
        vesselModel = src.clone();
        vesselModel.position.set(0, 0, 0);
        shadowy(vesselModel);
        jarGroup.add(vesselModel);
      }
    }
    jar.visible = band.visible = !vesselModel;
    jarMouth.y = v.mouth;
    glow.visible = v.glow;
    glow.position.y = v.mouth - 0.06;
  }

  async function setTable(id) {
    const tb = TABLES[id] || TABLES.suelo;
    skin.table = id;
    while (tableSlot.children.length) tableSlot.remove(tableSlot.children[0]);
    stage.position.y = tb.h;
    cloth.scale.setScalar(tb.h ? 0.82 : 1);
    if (!tb.node) return;
    const root = await loadModel("mesas");
    if (skin.table !== id || !root) return;
    const src = root.getObjectByName(tb.node);
    if (!src) return;
    const t = src.clone();
    t.position.set(0, 0, 0);
    shadowy(t);
    tableSlot.add(t);
  }

  function setSkin({ scenario, vessel, table } = {}) {
    if (scenario && scenario !== skin.scenario) setScenario(scenario);
    if (vessel && vessel !== skin.vessel) setVessel(vessel);
    if (table && table !== skin.table) setTable(table);
  }

  function setFigure(i, name) {
    const mem = lastList[i];
    if (!mem) return;
    mem.figure = name;
    setMembers(lastList);
    if (lastLabels) updateLabels(...lastLabels);
  }

  function placeIlla(i) {
    illaOwner = i;
    if (i < 0 || !members[i] || !illa.children.length) return void (illa.visible = false);
    illa.visible = true;
    const p = members[i].pos.clone();
    p.y = topOf(i) + 0.02;
    illa.position.copy(p);
  }

  setScenario("altiplano");
  setVessel("cantaro");
  setTable("suelo");

  return {
    placeIlla, retheme, setDeadline, setSkin, setFigure, figuresReady,
    figureNames: () => (figures ? [...figures.keys()].sort() : []),
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

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const backOut = (k) => 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);

/** Índice estable de 0 a n-1 a partir de un texto (para asignar personajes). */
export function hashIndex(text, n, fallback = 0) {
  if (!text) return fallback % n;
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0) % n;
}
