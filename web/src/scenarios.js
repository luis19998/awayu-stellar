// Escenarios de Bolivia para la mesa del pasanaku: cielo, cerros, suelo,
// luces y detalles propios de cada lugar. El salar de Uyuni y el lago
// Titicaca usan un espejo real (Reflector) para los reflejos.
import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";

export const SCENARIOS = {
  altiplano: {
    label: "Altiplano de noche",
    sky: ["#05040f", "#140d33", "#2a1b4a"], fog: ["#0b0820", 0.022], night: true,
    hemi: ["#7d74c9", "#2a1410", 0.55], sun: ["#c9d4ff", 1.2, [-8, 14, 6]],
    ground: "#1a1222", mirror: null, exposure: 1.05, bloom: 0.85, hearth: 18,
    hills: { R: 70, base: 6, amp: 7, rock: "#241a38", snow: "#c7c9e8", snowLine: 12 },
  },
  uyuni: {
    label: "Salar de Uyuni (espejo)",
    sky: ["#2f7fe6", "#9cc9f5", "#f3d6e4"], fog: ["#d9e6f5", 0.006], night: false,
    hemi: ["#ffffff", "#9fb0c8", 0.65], sun: ["#fff1dc", 1.6, [10, 18, -6]],
    ground: "#e9eef5", mirror: "#8d9db3", exposure: 0.78, bloom: 0.12, hearth: 2,
    hills: { R: 95, base: 2, amp: 4, rock: "#8f86b8", snow: "#f2f3ff", snowLine: 5 },
  },
  valle: {
    label: "Valle de Cochabamba",
    sky: ["#2d7fe0", "#8cc7ff", "#f7e2b8"], fog: ["#cfe3f5", 0.012], night: false,
    hemi: ["#ffffff", "#6b8f3a", 0.7], sun: ["#fff0d0", 1.9, [12, 16, 8]],
    ground: "#7a8f3f", mirror: null, exposure: 0.85, bloom: 0.15, hearth: 3,
    hills: { R: 75, base: 8, amp: 12, rock: "#5f6e3a", snow: "#f4f4f4", snowLine: 17, peak: 1.1 },
  },
  titicaca: {
    label: "Lago Titicaca al atardecer",
    sky: ["#2b2f6e", "#e2708a", "#ffc46b"], fog: ["#e7a58a", 0.012], night: false,
    hemi: ["#ffd2b0", "#203a5c", 0.75], sun: ["#ffb072", 1.8, [-14, 6, -10]],
    ground: "#1d3d66", mirror: "#5d86b8", exposure: 1.0, bloom: 0.6, hearth: 8,
    hills: { R: 90, base: 5, amp: 9, rock: "#3a3156", snow: "#fff1f1", snowLine: 11 },
  },
  potosi: {
    label: "Potosí y el Cerro Rico",
    sky: ["#3a1f45", "#c4553b", "#f3b05e"], fog: ["#b8644a", 0.016], night: false,
    hemi: ["#ffcfa8", "#3a1d14", 0.7], sun: ["#ff9f5a", 1.7, [12, 7, -12]],
    ground: "#7a3f2a", mirror: null, exposure: 1.0, bloom: 0.55, hearth: 10,
    hills: { R: 72, base: 5, amp: 6, rock: "#6b3424", snow: "#e8d7cf", snowLine: 14 },
    cerroRico: true,
  },
  yungas: {
    label: "Yungas entre la neblina",
    sky: ["#6f9a8c", "#c6dccf", "#eef3ea"], fog: ["#cfdcd2", 0.03], night: false,
    hemi: ["#f2fff4", "#1f4a2a", 0.8], sun: ["#fffbe8", 1.3, [6, 15, 10]],
    ground: "#2f5a2e", mirror: null, exposure: 0.88, bloom: 0.15, hearth: 3,
    hills: { R: 55, base: 14, amp: 16, rock: "#245a32", snow: "#2f6a3a", snowLine: 999 },
    trees: true,
  },
};

export const SCENARIO_IDS = Object.keys(SCENARIOS);

/** Cúpula de cielo con degradado (cénit, medio, horizonte). */
export function skyDome(colors) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Color(colors[0]) },
      mid: { value: new THREE.Color(colors[1]) },
      bottom: { value: new THREE.Color(colors[2]) },
    },
    vertexShader: `varying vec3 vPos; void main(){ vPos = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vPos;
      void main(){ float h = vPos.y; vec3 c = h > 0.18 ? mix(mid, top, smoothstep(0.18, 0.75, h)) : mix(bottom, mid, smoothstep(-0.05, 0.18, h));
      gl_FragColor = vec4(c, 1.0); }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), mat);
  m.userData.setColors = (c) => {
    mat.uniforms.top.value.set(c[0]);
    mat.uniforms.mid.value.set(c[1]);
    mat.uniforms.bottom.value.set(c[2]);
  };
  return m;
}

/** Anillo de cerros con nieve opcional en las cumbres. */
export function hillsMesh({ R = 70, base = 6, amp = 7, rock, snow, snowLine = 12, peak = 0 }) {
  const seg = 180;
  const pos = [];
  const col = [];
  const cr = new THREE.Color(rock);
  const cs = new THREE.Color(snow);
  const h = (a) =>
    base + amp * Math.max(0, Math.sin(a * 3 + 1)) ** 2 + (amp * 0.45) * Math.sin(a * 11) ** 2 + 1.5 * Math.sin(a * 29 + 2) +
    (peak ? 10 * peak * Math.exp(-((a - 1.2) ** 2) * 18) : 0);
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2;
    const a1 = ((i + 1) / seg) * Math.PI * 2;
    const p0 = [Math.cos(a0) * R, 0, Math.sin(a0) * R];
    const p1 = [Math.cos(a1) * R, 0, Math.sin(a1) * R];
    const t0 = [Math.cos(a0) * R * 1.04, h(a0), Math.sin(a0) * R * 1.04];
    const t1 = [Math.cos(a1) * R * 1.04, h(a1), Math.sin(a1) * R * 1.04];
    pos.push(...p0, ...t0, ...p1, ...p1, ...t0, ...t1);
    for (const p of [p0, t0, p1, p1, t0, t1]) {
      const c = p[1] > snowLine ? cs : cr;
      col.push(c.r, c.g, c.b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: true }));
}

/** Detalles propios de algunos lugares (Cerro Rico, árboles de los Yungas). */
export function props(s) {
  const g = new THREE.Group();
  if (s.cerroRico) {
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(16, 22, 9, 4),
      new THREE.MeshStandardMaterial({ color: "#8c3b25", roughness: 1, flatShading: true })
    );
    cone.position.set(-30, 10, -48);
    g.add(cone);
  }
  if (s.trees) {
    const geo = new THREE.ConeGeometry(0.9, 3.2, 7);
    const mat = new THREE.MeshStandardMaterial({ color: "#2d6b38", roughness: 0.9, flatShading: true });
    const n = 140;
    const inst = new THREE.InstancedMesh(geo, mat, n);
    const m = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.sin(i * 12.9) * 0.2;
      const r = 14 + ((i * 37) % 23);
      const s2 = 0.7 + ((i * 13) % 10) / 12;
      m.compose(new THREE.Vector3(Math.cos(a) * r, 1.6 * s2, Math.sin(a) * r), new THREE.Quaternion(), new THREE.Vector3(s2, s2, s2));
      inst.setMatrixAt(i, m);
    }
    g.add(inst);
  }
  return g;
}

/** Suelo: espejo (Reflector) en el salar y el lago; mate en el resto. */
export function groundFor(s, { small }) {
  if (s.mirror) {
    const size = small ? 512 : 1024;
    const mirror = new Reflector(new THREE.CircleGeometry(120, 64), {
      textureWidth: size, textureHeight: size, color: new THREE.Color(s.mirror), clipBias: 0.003,
    });
    mirror.rotation.x = -Math.PI / 2;
    mirror.position.y = -0.002;
    return mirror;
  }
  const g = new THREE.Mesh(
    new THREE.CircleGeometry(120, 64),
    new THREE.MeshStandardMaterial({ color: s.ground, roughness: 1 })
  );
  g.rotation.x = -Math.PI / 2;
  g.receiveShadow = true;
  return g;
}
