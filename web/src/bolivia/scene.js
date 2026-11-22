const pattern = [
  [],
  [[0, 0]],
  [[-1, -1], [1, 1]],
  [[-1, -1], [0, 0], [1, 1]],
  [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]],
];

function faceTexture(THREE, face) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#c8a77e";
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = "#fff1d5";
  ctx.beginPath();
  ctx.roundRect(2, 2, 124, 124, 13);
  ctx.fill();
  ctx.fillStyle = face === 1 ? "#a32d35" : "#312736";
  for (const [x, y] of pattern[face]) {
    ctx.beginPath();
    ctx.arc(64 + x * 32, 64 + y * 32, 11, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Orden de materiales de BoxGeometry: +X, -X, +Y, -Y, +Z, -Z.
const boxFaces = [3, 4, 1, 6, 2, 5];
const half = Math.PI / 2;
const faceUp = [null, [0, 0], [-half, 0], [0, half], [0, -half], [half, 0], [Math.PI, 0]];
const rest = [[-1.28, .55], [-.48, 1.12], [.31, .6], [1.14, 1.07], [1.95, .45]];
export const previewDice = [5, 3, 1, 4, 2];

export function mountDice(host) {
  let disposed = false;
  let current = previewDice;
  let animate = false;
  let roll = () => {};
  let cleanup = () => {};

  async function init() {
    if (!window.WebGL2RenderingContext) return;
    const THREE = await import("three");
    if (disposed) return;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let observer;
    cleanup = () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      motion.removeEventListener("change", settle);
      geometries.forEach(item => item.dispose());
      materials.forEach(item => item.dispose());
      textures.forEach(item => item.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      host.classList.remove("has-dice");
    };
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-3, 3, 2, -2, .1, 30);
    camera.position.set(0, 6.7, 4.1);
    camera.lookAt(0, .45, .05);
    scene.add(new THREE.HemisphereLight(0xfff4e3, 0x977497, 2.4));
    const key = new THREE.DirectionalLight(0xffdfb5, 2.6);
    key.position.set(-3, 7, 4);
    scene.add(key);

    function mesh(geometry, material, parent = scene) {
      geometries.add(geometry);
      for (const m of [].concat(material)) materials.add(m);
      const object = new THREE.Mesh(geometry, material);
      parent.add(object);
      return object;
    }
    const cup = new THREE.Group();
    cup.position.set(-1.35, 0, -.72);
    cup.rotation.z = -.13;
    scene.add(cup);
    const profile = [[0, 0], [.52, 0], [.75, 1.53], [.75, 1.61], [.68, 1.61], [.46, .16], [0, .16]];
    mesh(new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), 48),
      new THREE.MeshStandardMaterial({ color: 0xa85130, roughness: .86, side: THREE.DoubleSide }), cup);
    for (const [y, radius] of [[.18, .55], [1.28, .72], [1.45, .744], [1.60, .724]]) {
      const band = mesh(new THREE.TorusGeometry(radius, .027, 8, 48), new THREE.MeshStandardMaterial({ color: 0xe9aa64 }), cup);
      band.rotation.x = half;
      band.position.y = y;
    }

    const geometry = new THREE.BoxGeometry(.58, .58, .58);
    const faces = boxFaces.map(n => {
      const map = faceTexture(THREE, n);
      textures.add(map);
      const material = new THREE.MeshStandardMaterial({ map, roughness: .63 });
      materials.add(material);
      return material;
    });
    const dice = rest.map(() => mesh(geometry, faces));
    function position(t) {
      dice.forEach((die, i) => {
        const [x, z] = rest[i];
        const [rx, rz] = faceUp[current[i]];
        const p = Math.min(1, Math.max(0, t * 1.24 - i * .06));
        const remaining = (1 - p) ** 2;
        die.position.set(x - remaining * (x + 1), .30 + remaining * 1.5 + Math.abs(Math.sin(3 * Math.PI * p)) * remaining, z - remaining * 1.2);
        die.rotation.set(rx + remaining * 6.2, (i % 2 ? -.15 : .13) + remaining * 3, rz - remaining * 7, "YXZ");
      });
      renderer.render(scene, camera);
    }
    function settle() { cancelAnimationFrame(frame); position(1); }
    function resize() {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      const aspect = width / height;
      const span = Math.max(1.65, 2.9 / aspect);
      camera.left = -span * aspect;
      camera.right = span * aspect;
      camera.top = span;
      camera.bottom = -span;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      settle();
    }
    roll = () => {
      cancelAnimationFrame(frame);
      if (!animate || motion.matches || document.documentElement.classList.contains("aw-calm")) return position(1);
      const start = performance.now();
      function tick(now) {
        const t = Math.min(1, (now - start) / 1150);
        position(t);
        if (t < 1) frame = requestAnimationFrame(tick);
      }
      frame = requestAnimationFrame(tick);
    };
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.append(renderer.domElement);
    host.classList.add("has-dice");
    resize();
    if (window.ResizeObserver) {
      observer = new ResizeObserver(resize);
      observer.observe(host);
    } else window.addEventListener("resize", resize);
    motion.addEventListener("change", settle);
    roll();
  }
  init().catch(() => { cleanup(); cleanup = () => {}; roll = () => {}; });
  return {
    show(values, moving = true) { current = values; animate = moving; roll(); },
    destroy() { disposed = true; cleanup(); },
  };
}
