# Personajes de Awayu: 36 figuras al estilo de las miniaturas de Alasitas
# (12 oficios bolivianos x 3 variantes de color y tono de piel).
# Versión 2: cada prenda es una pieza con su forma real (pollera plisada con
# alforzas y enagua, manta con flecos y prendedor, poncho, trenzas con tullmas,
# bombín, copa cochabambina, chullo con orejeras, montera de Tarabuco, casco
# minero con lámpara, charango, canasta con frutas, etc.), con colores por
# vértice. Al final cada figura se une en una malla y se simplifica.
#   blender --background --factory-startup --python assets/blender/personajes.py
# Salida: web/public/models/personajes.glb (Draco) y personajes.json.
import bpy, bmesh, math, os, json, random
from math import sin, cos, pi
from mathutils import Vector, noise

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "web", "public", "models")
os.makedirs(OUT, exist_ok=True)
random.seed(11)
TRIS_POR_FIGURA = 22000  # solo se simplifica por encima de esto (simplificar mezcla los colores)
# AWAYU_SOLO=chola_pacena,musico genera solo esos oficios (para probar rápido, sin exportar)
SOLO = [x for x in os.environ.get("AWAYU_SOLO", "").split(",") if x]

def lin(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(ch * 2 for ch in h)
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)

SKIN = ["#b07850", "#8d5a3b", "#6e4429"]
HAIR = "#1a1212"
DARK = "#2a1d1a"
WHITE = "#f4efe6"
GOLD = "#e6b84a"
AGUAYO = ["#d81b60", "#f9c22e", "#13a3b0", "#1f9d55", "#a3122a", "#5b2a86", "#f57c1f"]

VARIANTS = [
    ("#d81b60", "#283c9c", "#f9c22e"),
    ("#1f9d55", "#a3122a", "#f3e6c8"),
    ("#13a3b0", "#5b2a86", "#f57c1f"),
]

ARCHETYPES = [
    # id, nombre, abajo, sombrero, peinado, extras, pose de brazos
    ("chola_pacena", "Cholita paceña", "pollera", "bombin", "trenzas", ["manta", "aretes"], "lado"),
    ("chola_valle", "Cholita del valle", "pollera_corta", "copa_blanca", "trenzas", ["manta", "aretes"], "lado"),
    ("campesino", "Productor del altiplano", "pantalon", "chullo", "corto", ["poncho", "ojotas"], "lado"),
    ("minero", "Minero de Potosí", "pantalon", "casco", "corto", ["chamarra_minera", "botas", "chuspa"], "lado"),
    ("estudiante", "Estudiante", "pantalon", "gorra", "corto", ["mochila", "libro_mano"], "frente"),
    ("comerciante", "Comerciante de La Cancha", "pollera", "copa_blanca", "trenzas", ["bulto", "aretes"], "tirantes"),
    ("musico", "Músico de charango", "pantalon", "chullo", "corto", ["charango", "ojotas"], "charango"),
    ("agricultora", "Agricultora de los Yungas", "falda", "ala_ancha", "cola", ["canasta"], "canasta"),
    ("mototaxista", "Mototaxista", "pantalon", "casco_moto", "corto", ["chaleco", "botas"], "lado"),
    ("profesora", "Profesora rural", "falda", None, "mono", ["lentes", "libro_mano", "chompa"], "frente"),
    ("abuelo", "Abuelo tejedor", "pantalon", "sombrero", "canoso", ["baston", "poncho", "bigote", "ojotas"], "baston"),
    ("tejedora", "Tejedora de Tarabuco", "pollera", "montera", "trenzas", ["telar", "manta"], "frente"),
]

# ---------------- utilidades ----------------
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def sel(objs, active=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]

def apply_all(o):
    sel([o])
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return o

def paint(o, fn):
    me = o.data
    if "Col" not in me.color_attributes:
        me.color_attributes.new("Col", "BYTE_COLOR", "CORNER")
    col = me.color_attributes["Col"]
    mw = o.matrix_world
    for poly in me.polygons:
        for li in poly.loop_indices:
            col.data[li].color = fn(mw @ me.vertices[me.loops[li].vertex_index].co)
    return o

def solid(o, color):
    c = lin(color) if isinstance(color, str) else color
    return paint(o, lambda p: c)

def prim(kind, loc=(0, 0, 0), scale=(1, 1, 1), rot=(0, 0, 0), color=None, **kw):
    if kind == "sphere":
        bpy.ops.mesh.primitive_uv_sphere_add(segments=kw.get("seg", 12), ring_count=kw.get("rings", 8), location=loc, rotation=rot)
    elif kind == "cyl":
        bpy.ops.mesh.primitive_cylinder_add(vertices=kw.get("seg", 20), location=loc, rotation=rot)
    elif kind == "cone":
        bpy.ops.mesh.primitive_cone_add(vertices=kw.get("seg", 24), radius1=kw.get("r1", 1), radius2=kw.get("r2", 0), depth=kw.get("depth", 2), location=loc, rotation=rot)
    elif kind == "torus":
        bpy.ops.mesh.primitive_torus_add(major_radius=kw.get("R", 1), minor_radius=kw.get("r", 0.25), major_segments=kw.get("seg", 28), minor_segments=kw.get("mseg", 8), location=loc, rotation=rot)
    elif kind == "cube":
        bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = scale
    apply_all(o)
    if kw.get("bevel"):
        m = o.modifiers.new("b", "BEVEL"); m.width = kw["bevel"]; m.segments = 2
        sel([o]); bpy.ops.object.modifier_apply(modifier=m.name)
    if kw.get("sub"):  # subdivisión simple para poder pintar tramas
        m = o.modifiers.new("sub", "SUBSURF"); m.subdivision_type = "SIMPLE"; m.levels = kw["sub"]
        sel([o]); bpy.ops.object.modifier_apply(modifier=m.name)
    if color is not None:
        solid(o, color)
    return o

def capsule(p1, p2, r, color, r2=None, seg=12):
    """Cilindro con extremos redondeados entre dos puntos (brazos, piernas, palos)."""
    p1, p2 = Vector(p1), Vector(p2)
    d = p2 - p1
    r2 = r if r2 is None else r2
    bpy.ops.mesh.primitive_cone_add(vertices=seg, radius1=r, radius2=r2, depth=d.length, location=(p1 + p2) / 2)
    c = bpy.context.active_object
    c.rotation_mode = "QUATERNION"
    c.rotation_quaternion = d.to_track_quat("Z", "Y")
    apply_all(c)
    parts = [c, prim("sphere", p1, (r, r, r), seg=seg, rings=6), prim("sphere", p2, (r2, r2, r2), seg=seg, rings=6)]
    for o in parts:
        solid(o, color)
    return parts

def lathe(name, prof, seg=48, wav=None, arc=None, thick=0.0):
    """Superficie de revolución: prof = [(z, radio)], th=0 es el frente (-Y)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    t0, t1 = arc if arc else (0.0, 2 * pi)
    closed = arc is None
    n = seg if closed else seg + 1
    rings = []
    for z, r in prof:
        ring = []
        for i in range(n):
            th = t0 + (t1 - t0) * i / seg
            m = wav(th, z) if wav else 1.0
            ring.append(bm.verts.new((sin(th) * r * m, -cos(th) * r * m, z)))
        rings.append(ring)
    for a, b in zip(rings, rings[1:]):
        for i in range(seg if closed else n - 1):
            j = (i + 1) % n
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    if thick:
        m = o.modifiers.new("s", "SOLIDIFY"); m.thickness = thick; m.offset = 0
        sel([o]); bpy.ops.object.modifier_apply(modifier=m.name)
    return o

def angle_of(p):
    return math.atan2(p.x, -p.y)  # 0 al frente

# ---------------- cuerpo ----------------
HEAD = Vector((0, 0, 1.0))

def head(skin):
    S = lin(skin)
    p = [prim("sphere", HEAD, (0.165, 0.152, 0.172), seg=28, rings=16, color=S)]
    p.append(prim("sphere", (0, -0.152, 0.985), (0.028, 0.03, 0.034), color=S))            # nariz
    for s in (1, -1):
        p.append(prim("sphere", (s * 0.163, 0.0, 0.995), (0.022, 0.032, 0.042), color=S))  # orejas
        # ojos: blanco, iris, brillo, párpado
        p.append(prim("sphere", (s * 0.06, -0.136, 1.028), (0.031, 0.016, 0.033), seg=14, rings=8, color=WHITE))
        p.append(prim("sphere", (s * 0.058, -0.149, 1.026), (0.019, 0.008, 0.022), seg=12, rings=8, color="#24160f"))
        p.append(prim("sphere", (s * 0.052, -0.156, 1.036), (0.006, 0.003, 0.006), seg=8, rings=4, color="#ffffff"))
        p.append(prim("cube", (s * 0.062, -0.146, 1.083), (0.03, 0.007, 0.0065), rot=(0, s * 0.18, 0), color=HAIR, bevel=0.003))  # cejas
        p.append(prim("sphere", (s * 0.098, -0.128, 0.975), (0.03, 0.008, 0.019), color="#e9897e"))  # mejillas
    # boca: arco de esferitas
    for k in range(7):
        x = (k - 3) * 0.011
        p.append(prim("sphere", (x, -0.147 + abs(x) * 0.25, 0.945 + 3.2 * x * x), (0.008, 0.005, 0.006), seg=8, rings=4, color="#7a1f2b"))
    p.append(prim("cyl", (0, 0, 0.87), (0.06, 0.06, 0.05), color=S))  # cuello
    return p

def torso(top, lower):
    T = lin(top)
    p = [lathe("torso", [(0.6, 0.15), (0.66, 0.158), (0.74, 0.168), (0.82, 0.172), (0.87, 0.15), (0.9, 0.09)], seg=32,
               wav=lambda th, z: 0.86 + 0.14 * abs(sin(th)) ** 0.6 if z > 0.62 else 0.85 + 0.15 * abs(sin(th)))]
    tor = p[0]
    # cerramos arriba y abajo
    p.append(prim("sphere", (0, 0, 0.6), (0.15, 0.12, 0.03)))
    p.append(prim("sphere", (0, 0, 0.89), (0.1, 0.08, 0.03)))
    for o in p:
        solid(o, T)
    for s in (1, -1):
        p.append(prim("sphere", (s * 0.165, 0, 0.85), (0.065, 0.06, 0.055), color=T))  # hombros
    return p

POSES = {
    # codo, mano (por lado +x); cada pose devuelve [(codo, mano) derecha, (codo, mano) izquierda]
    "lado": lambda s: ((s * 0.22, -0.01, 0.7), (s * 0.235, -0.06, 0.55)),
    "frente": lambda s: ((s * 0.21, -0.02, 0.68), (s * 0.09, -0.17, 0.66)),
    "tirantes": lambda s: ((s * 0.22, -0.04, 0.72), (s * 0.06, -0.15, 0.8)),
    "charango": lambda s: ((s * 0.22, -0.05, 0.7), (s * 0.04, -0.2, 0.66) if s > 0 else (-0.17, -0.18, 0.86)),
    "canasta": lambda s: ((s * 0.22, -0.01, 0.7), (s * 0.27, -0.06, 0.56) if s > 0 else (-0.24, -0.06, 0.55)),
    "baston": lambda s: ((s * 0.22, -0.04, 0.7), (s * 0.26, -0.16, 0.6) if s > 0 else (-0.24, -0.06, 0.55)),
}

def arms(top, skin, pose):
    p = []
    for s in (1, -1):
        sh = Vector((s * 0.17, 0, 0.84))
        elbow, hand = (Vector(v) for v in POSES[pose](s))
        p += capsule(sh, elbow, 0.048, top, 0.042)
        p += capsule(elbow, hand + (elbow - hand).normalized() * 0.03, 0.042, top, 0.036)
        p.append(prim("sphere", hand, (0.042, 0.036, 0.046), color=skin))                   # mano
        th = hand + Vector((-s * 0.03, -0.03, 0.012))
        p.append(prim("sphere", th, (0.016, 0.016, 0.022), color=skin))                     # pulgar
    return p

def legs(lower, bottom, skin, shoes):
    p = []
    for s in (1, -1):
        if lower == "pantalon":
            p += capsule((s * 0.075, 0, 0.6), (s * 0.08, 0, 0.1), 0.07, bottom, 0.062)
        else:
            p += capsule((s * 0.07, 0, 0.3), (s * 0.075, 0, 0.09), 0.042, skin, 0.036)
        if shoes == "ojotas":
            p.append(prim("cube", (s * 0.08, -0.04, 0.012), (0.06, 0.1, 0.012), color="#3a2a1a", bevel=0.008))
            p.append(prim("sphere", (s * 0.08, -0.05, 0.04), (0.055, 0.09, 0.035), color=skin))
            p.append(prim("torus", (s * 0.08, -0.06, 0.04), (0.7, 1, 0.5), R=0.05, r=0.008, color="#3a2a1a"))
        elif shoes == "botas":
            p.append(prim("cyl", (s * 0.08, 0, 0.1), (0.068, 0.068, 0.1), color="#2b2420"))
            p.append(prim("sphere", (s * 0.08, -0.05, 0.035), (0.07, 0.11, 0.04), color="#2b2420"))
        else:
            p.append(prim("sphere", (s * 0.08, -0.045, 0.032), (0.058, 0.095, 0.035), color="#1c1414"))
    return p

def pollera(bottom, accent, corta=False):
    """Pollera con pliegues verticales, alforzas horizontales y enagua blanca al borde."""
    hem = 0.2 if corta else 0.08
    prof = []
    for k in range(34):
        t = k / 33
        z = 0.62 - t * (0.62 - hem)
        r = 0.16 + (0.37 if not corta else 0.33) * t ** 1.35
        prof.append((z, r))
    o = lathe("pollera", prof, seg=64, wav=lambda th, z: 1 + (0.01 + 0.03 * (0.62 - z)) * sin(th * 22))
    B, A, W = lin(bottom), lin(accent), lin(WHITE)
    def f(p):
        z = p.z - hem
        if z < 0.008:
            return W
        if 0.07 < z < 0.085 or 0.16 < z < 0.172 or 0.25 < z < 0.26:
            return A
        return B
    paint(o, f)
    # enagua: un volado blanco que asoma
    e = lathe("enagua", [(hem + 0.01, 0.37 if not corta else 0.33), (hem - 0.035, 0.39 if not corta else 0.35)], seg=64,
              wav=lambda th, z: 1 + 0.03 * sin(th * 30), thick=0.01)
    solid(e, WHITE)
    cint = prim("torus", (0, 0, 0.615), (1, 0.88, 1), R=0.158, r=0.018, color=accent)  # faja
    return [o, e, cint]

def falda(bottom, accent):
    o = lathe("falda", [(0.62, 0.16), (0.5, 0.2), (0.38, 0.235), (0.3, 0.25)], seg=64,
              wav=lambda th, z: 1 + 0.02 * sin(th * 14))
    B, A = lin(bottom), lin(accent)
    paint(o, lambda p: A if 0.33 < p.z < 0.35 else B)
    return [o, prim("cyl", (0, 0, 0.3), (0.248, 0.248, 0.004), color=bottom)]

def manta(color, stripe, fringe=True):
    """Manta sobre los hombros, abierta al frente, con flecos y prendedor."""
    prof = [(0.9, 0.11), (0.86, 0.19), (0.8, 0.23), (0.72, 0.25), (0.64, 0.26)]
    o = lathe("manta", prof, seg=56, arc=(0.5, 2 * pi - 0.5), thick=0.016,
              wav=lambda th, z: 1 + 0.02 * sin(th * 9))
    C, S = lin(color), lin(stripe)
    paint(o, lambda p: S if int((p.z - 0.6) * 90) % 5 == 0 else C)
    p = [o]
    if fringe:
        for i in range(30):
            th = 0.55 + (2 * pi - 1.1) * i / 29
            r = 0.262
            x, y = sin(th) * r, -cos(th) * r
            p.append(prim("cyl", (x, y, 0.615), (0.004, 0.004, 0.028), seg=5, color=stripe))
    p.append(prim("sphere", (0, -0.17, 0.8), (0.03, 0.012, 0.03), color=GOLD))  # prendedor
    p.append(prim("sphere", (0, -0.18, 0.8), (0.012, 0.008, 0.012), color="#d81b60"))
    return p

def poncho(a, b, c):
    def wav(th, z):
        # silueta cuadrada (superelipse) que cae en punta adelante y atrás
        return 1.0 / (abs(cos(th)) ** 4 + abs(sin(th)) ** 4) ** 0.25
    prof = [(0.9, 0.1), (0.87, 0.18), (0.8, 0.225), (0.7, 0.245), (0.6, 0.255)]
    o = lathe("poncho", prof, seg=64, wav=wav, thick=0.014)
    A, B, C = lin(a), lin(b), lin(c)
    def f(p):
        k = int((angle_of(p) + pi) / (2 * pi) * 40) % 8
        return C if k == 0 else B if k == 4 else A
    paint(o, f)
    p = [o]
    for i in range(40):
        th = 2 * pi * i / 40
        m = wav(th, 0)
        p.append(prim("cyl", (sin(th) * 0.255 * m, -cos(th) * 0.255 * m, 0.578), (0.004, 0.004, 0.022), seg=5, color=c))
    return p

def aguayo_paint(o, scale=60):
    cols = [lin(x) for x in AGUAYO]
    def f(p):
        k = int((p.z + 1) * scale)
        band = k % 9
        if band in (0, 8):
            return lin(DARK)
        # rombos dentro de la franja
        if band == 4 and int((p.x + 1) * scale * 0.8) % 3 == 0:
            return lin(WHITE)
        return cols[(k // 9 + band) % len(cols)]
    return paint(o, f)

# ---------------- cabello ----------------
def hair(style):
    H = HAIR if style != "canoso" else "#d9d4cc"
    p = [prim("sphere", (0, 0.022, 1.045), (0.172, 0.165, 0.14), seg=28, rings=14, color=H)]
    p.append(prim("sphere", (0, 0.06, 0.98), (0.16, 0.12, 0.13), color=H))  # nuca
    if style == "trenzas":
        # raya al medio y dos trenzas entrelazadas con tullmas al final
        for s in (1, -1):
            for k in range(11):
                z = 0.93 - k * 0.042
                off = 0.012 if k % 2 else -0.012
                p.append(prim("sphere", (s * (0.13 + off), 0.1 - k * 0.004, z), (0.034, 0.03, 0.03), seg=10, rings=6, color=H))
            p.append(prim("cone", (s * 0.13, 0.06, 0.43), (1, 1, 1), r1=0.035, r2=0.012, depth=0.06, color="#111"))
            for t in range(5):
                p.append(prim("cyl", (s * 0.13 + (t - 2) * 0.008, 0.06, 0.38), (0.006, 0.006, 0.04), seg=6, color="#111"))
    elif style == "cola":
        p += capsule((0, 0.15, 1.02), (0, 0.22, 0.82), 0.04, H, 0.022)
    elif style == "mono":
        p.append(prim("sphere", (0, 0.13, 1.1), (0.07, 0.065, 0.065), color=H))
    elif style in ("corto", "canoso"):
        for k in range(7):  # mechones del flequillo
            x = (k - 3) * 0.04
            p.append(prim("sphere", (x, -0.12, 1.12 - abs(x) * 0.3), (0.035, 0.03, 0.025), seg=10, rings=6, color=H))
    return p

# ---------------- sombreros ----------------
def hat(kind, a, b, c):
    p = []
    if kind == "bombin":  # pequeño, alto y ladeado, con cinta
        p += [prim("cyl", (0, 0, 1.2), (0.1, 0.1, 0.045), seg=28, color="#3a2a22"),
              prim("sphere", (0, 0, 1.24), (0.1, 0.1, 0.075), seg=28, color="#3a2a22"),
              prim("cyl", (0, 0, 1.16), (0.14, 0.14, 0.008), seg=36, color="#3a2a22"),
              prim("torus", (0, 0, 1.162), (1, 1, 0.6), R=0.14, r=0.012, color="#3a2a22"),
              prim("cyl", (0, 0, 1.175), (0.102, 0.102, 0.014), seg=28, color=c)]
        for o in p:
            o.location = (0.025, 0.0, 0.0); apply_all(o)
    elif kind == "copa_blanca":  # sombrero alto de Cochabamba
        p += [prim("cone", (0, 0, 1.25), (1, 1, 1), r1=0.12, r2=0.105, depth=0.17, seg=32, color=WHITE),
              prim("cyl", (0, 0, 1.335), (0.105, 0.105, 0.006), seg=32, color=WHITE),
              prim("cyl", (0, 0, 1.165), (0.2, 0.2, 0.007), seg=40, color=WHITE),
              prim("torus", (0, 0, 1.168), (1, 1, 0.5), R=0.2, r=0.01, color=WHITE),
              prim("cyl", (0, 0, 1.19), (0.121, 0.121, 0.022), seg=32, color="#1c1414")]
    elif kind == "chullo":
        ch = lathe("chullo", [(1.09, 0.18), (1.13, 0.176), (1.18, 0.15), (1.22, 0.1), (1.25, 0.04), (1.26, 0.0)], seg=40)
        A, B, C, W = lin(a), lin(b), lin(c), lin(WHITE)
        def f(q):
            z = q.z
            band = int((z - 0.95) * 50)
            # zigzag andino
            if band % 3 == 1:
                tri = abs(((angle_of(q) * 8 / pi) % 2) - 1)
                return W if (z * 50 % 1) < tri else C
            return [A, B][band % 2]
        paint(ch, f)
        p += [ch, prim("sphere", (0, 0, 1.275), (0.035, 0.035, 0.035), color=c),
              prim("torus", (0, 0, 1.095), (1, 0.97, 1), R=0.178, r=0.014, color=c)]
        for s in (1, -1):  # orejeras y cordones con pompón
            fl = prim("sphere", (s * 0.17, 0.0, 0.99), (0.035, 0.07, 0.1), color=a)
            p.append(fl)
            p += capsule((s * 0.168, -0.01, 0.86), (s * 0.17, -0.02, 0.72), 0.008, b)
            p.append(prim("sphere", (s * 0.17, -0.02, 0.7), (0.022, 0.022, 0.022), color=c))
    elif kind == "casco":  # casco minero con lámpara
        p += [prim("sphere", (0, 0, 1.1), (0.19, 0.2, 0.15), seg=28, color="#f2c14e"),
              prim("cyl", (0, 0, 1.08), (0.215, 0.225, 0.01), seg=36, color="#f2c14e"),
              prim("cube", (0, 0, 1.2), (0.02, 0.17, 0.025), color="#f2c14e", bevel=0.01),
              prim("cyl", (0, -0.2, 1.13), (0.04, 0.04, 0.03), rot=(pi / 2, 0, 0), color="#555"),
              prim("cyl", (0, -0.23, 1.13), (0.03, 0.03, 0.005), rot=(pi / 2, 0, 0), color="#fff6c2")]
        p += capsule((0.03, 0.2, 1.12), (0.18, 0.12, 0.62), 0.008, "#222")  # cable a la batería
    elif kind == "casco_moto":
        top_ = lathe("casco_sup", [(1.1, 0.205), (1.16, 0.19), (1.21, 0.15), (1.245, 0.08), (1.255, 0.0)], seg=40)
        sides = lathe("casco_lados", [(0.9, 0.19), (0.98, 0.205), (1.05, 0.21), (1.1, 0.205)], seg=40, arc=(0.95, 2 * pi - 0.95), thick=0.02)
        for o in (top_, sides):
            solid(o, a)
        p += [top_, sides,
              prim("torus", (0, 0, 1.1), (1, 1, 0.6), R=0.205, r=0.014, color=c),
              prim("sphere", (0, -0.17, 1.17), (0.15, 0.06, 0.045), rot=(-0.5, 0, 0), color="#1c2733"),
              prim("cube", (0, 0.0, 1.245), (0.025, 0.14, 0.012), color=c, bevel=0.006)]
    elif kind == "gorra":
        p += [prim("sphere", (0, 0.01, 1.11), (0.175, 0.172, 0.12), seg=28, color=a),
              prim("cyl", (0, -0.2, 1.08), (0.11, 0.09, 0.008), seg=24, color=a),
              prim("sphere", (0, 0, 1.23), (0.02, 0.02, 0.012), color=c)]
    elif kind == "ala_ancha":  # sombrero de paja de los Yungas
        brim = lathe("ala", [(1.12, 0.13), (1.13, 0.2), (1.115, 0.27), (1.09, 0.3)], seg=48, thick=0.01)
        P, P2 = lin("#d8b77a"), lin("#c49a58")
        paint(brim, lambda q: P2 if int(q.length * 120) % 3 == 0 else P)
        crown = prim("sphere", (0, 0, 1.18), (0.135, 0.135, 0.09), seg=28)
        paint(crown, lambda q: P2 if int(q.z * 120) % 3 == 0 else P)
        p += [brim, crown, prim("cyl", (0, 0, 1.145), (0.137, 0.137, 0.018), seg=28, color=b)]
    elif kind == "sombrero":  # sombrero de fieltro con hendidura
        p += [prim("cyl", (0, 0, 1.13), (0.22, 0.22, 0.008), seg=40, color="#5e3a2b"),
              prim("torus", (0, 0, 1.135), (1, 1, 0.6), R=0.22, r=0.01, color="#5e3a2b"),
              prim("cone", (0, 0, 1.2), (1, 0.9, 1), r1=0.12, r2=0.1, depth=0.13, seg=28, color="#5e3a2b"),
              prim("sphere", (0, 0, 1.26), (0.1, 0.09, 0.03), color="#5e3a2b"),
              prim("cyl", (0, 0, 1.15), (0.121, 0.11, 0.016), seg=28, color=DARK)]
    elif kind == "montera":  # montera de Tarabuco: casco de cuero con ala y borde de lentejuelas
        p += [prim("sphere", (0, 0, 1.12), (0.16, 0.16, 0.12), seg=28, color="#2b1b16"),
              prim("cone", (0, 0, 1.1), (1, 1, 1), r1=0.27, r2=0.15, depth=0.05, seg=40, color="#2b1b16"),
              prim("torus", (0, 0, 1.077), (1, 1, 1), R=0.268, r=0.012, color=GOLD)]
        for i in range(16):
            th = 2 * pi * i / 16
            p.append(prim("sphere", (sin(th) * 0.21, -cos(th) * 0.21, 1.095), (0.012, 0.012, 0.012), seg=8, rings=4, color=AGUAYO[i % len(AGUAYO)]))
        p += capsule((0.15, -0.02, 1.08), (0.0, -0.11, 0.9), 0.006, GOLD)  # barbijo
        p += capsule((-0.15, -0.02, 1.08), (0.0, -0.11, 0.9), 0.006, GOLD)
    return p

# ---------------- accesorios ----------------
def extras(names, a, b, c, skin):
    p = []
    for n in names:
        if n == "manta":
            p += manta(a, c)
        elif n == "poncho":
            p += poncho(a, b, c)
        elif n == "aretes":
            for s in (1, -1):
                p.append(prim("sphere", (s * 0.168, -0.01, 0.95), (0.012, 0.012, 0.016), color=GOLD))
                p.append(prim("torus", (s * 0.168, -0.01, 0.925), (1, 0.4, 1), R=0.016, r=0.004, rot=(pi / 2, 0, 0), color=GOLD))
        elif n == "bulto":  # aguayo cargado a la espalda, con nudo al pecho
            bag = prim("sphere", (0, 0.2, 0.72), (0.22, 0.13, 0.19), seg=28)
            aguayo_paint(bag)
            p.append(bag)
            p += capsule((0.12, 0.08, 0.86), (0.05, -0.15, 0.8), 0.022, "#d81b60")
            p += capsule((-0.12, 0.08, 0.86), (-0.05, -0.15, 0.8), 0.022, "#d81b60")
            p.append(prim("sphere", (0, -0.165, 0.8), (0.04, 0.025, 0.035), color="#d81b60"))
        elif n == "mochila":
            p.append(prim("cube", (0, 0.17, 0.74), (0.13, 0.065, 0.15), color=b, bevel=0.03))
            p.append(prim("cube", (0, 0.24, 0.68), (0.09, 0.02, 0.07), color=c, bevel=0.015))
            for s in (1, -1):
                p += capsule((s * 0.09, 0.12, 0.86), (s * 0.1, -0.12, 0.72), 0.012, b)
        elif n == "libro_mano":
            p.append(prim("cube", (0, -0.2, 0.66), (0.08, 0.02, 0.1), rot=(0.25, 0, 0), color="#283c9c", bevel=0.005))
            p.append(prim("cube", (0, -0.2, 0.66), (0.074, 0.022, 0.094), rot=(0.25, 0, 0), color=WHITE))
        elif n == "chuspa":  # bolsita tejida de coca
            bag = prim("cube", (0.21, -0.03, 0.55), (0.05, 0.02, 0.06), sub=3)
            aguayo_paint(bag, 120)
            p.append(bag)
            p += capsule((0.16, 0.0, 0.86), (0.21, -0.03, 0.6), 0.006, c)
        elif n == "chamarra_minera":
            for z in (0.68, 0.76):  # franjas reflectivas
                p.append(prim("torus", (0, 0, z), (1, 0.82, 0.5), R=0.172, r=0.012, color="#e8e8e8"))
            p.append(prim("cube", (0.17, 0.06, 0.6), (0.04, 0.03, 0.05), color="#333", bevel=0.01))  # batería
        elif n == "chaleco":  # chaleco reflectivo de mototaxista
            v = lathe("chaleco", [(0.6, 0.162), (0.7, 0.172), (0.8, 0.176), (0.86, 0.15)], seg=40, arc=(0.35, 2 * pi - 0.35), thick=0.012)
            Y, G = lin("#c8f02a"), lin("#e8e8e8")
            paint(v, lambda q: G if abs(q.z - 0.7) < 0.015 or abs(q.z - 0.78) < 0.015 else Y)
            p.append(v)
        elif n == "chompa":  # chompa abierta de la profesora
            v = lathe("chompa", [(0.6, 0.165), (0.7, 0.175), (0.8, 0.178), (0.87, 0.152)], seg=40, arc=(0.3, 2 * pi - 0.3), thick=0.012)
            solid(v, c)
            p.append(v)
            for z in (0.66, 0.73, 0.8):
                p.append(prim("sphere", (0.05, -0.165, z), (0.01, 0.006, 0.01), color=b))
        elif n == "lentes":
            for s in (1, -1):
                p.append(prim("torus", (s * 0.06, -0.158, 1.028), (1, 1, 1), R=0.034, r=0.005, rot=(pi / 2, 0, 0), color="#2b2b2b"))
            p.append(prim("cube", (0, -0.16, 1.035), (0.02, 0.004, 0.004), color="#2b2b2b"))
        elif n == "bigote":
            for s in (1, -1):
                p.append(prim("sphere", (s * 0.03, -0.155, 0.962), (0.036, 0.014, 0.014), rot=(0, -s * 0.25, 0), color="#d9d4cc"))
        elif n == "charango":
            body = prim("sphere", (0.06, -0.23, 0.645), (0.085, 0.035, 0.085), rot=(0, 0.9, 0), seg=24, color="#7a4a24")
            body2 = prim("sphere", (0.0, -0.23, 0.7), (0.065, 0.033, 0.065), rot=(0, 0.9, 0), seg=24, color="#7a4a24")
            top_ = prim("sphere", (0.06, -0.262, 0.645), (0.08, 0.008, 0.08), rot=(0, 0.9, 0), seg=24, color="#d9a066")
            top2 = prim("sphere", (0.0, -0.262, 0.7), (0.06, 0.008, 0.06), rot=(0, 0.9, 0), seg=24, color="#d9a066")
            p += [body2, top2, prim("torus", (0.03, -0.268, 0.672), (1, 1, 1), R=0.024, r=0.004, rot=(pi / 2, 0, 0), color="#7a4a24")]
            hole = prim("cyl", (0.04, -0.27, 0.665), (0.02, 0.02, 0.003), rot=(pi / 2, 0, 0), color="#2a160a")
            p += [body, top_, hole]
            p += capsule((0.0, -0.265, 0.7), (-0.2, -0.24, 0.88), 0.016, "#3a2414")      # mástil
            head_ = prim("cube", (-0.225, -0.238, 0.905), (0.025, 0.012, 0.04), rot=(0, 0.9, 0), color="#3a2414", bevel=0.005)
            p.append(head_)
            for k in range(-2, 3):
                p += capsule((0.09 + k * 0.004, -0.272, 0.62), (-0.2 + k * 0.004, -0.258, 0.88), 0.0015, "#f0e6c8", seg=4)
        elif n == "canasta":
            bas = lathe("canasta", [(0.42, 0.06), (0.45, 0.085), (0.52, 0.1), (0.53, 0.098)], seg=24, thick=0.008)
            Bk, Bl = lin("#b9773e"), lin("#8a5426")
            paint(bas, lambda q: Bl if (int(q.z * 140) + int((angle_of(q - Vector((0.3, -0.06, 0)))) * 6)) % 2 else Bk)
            for o in [bas]:
                o.location = (0.3, -0.06, 0); apply_all(o)
            p.append(bas)
            p.append(prim("cyl", (0.3, -0.06, 0.425), (0.06, 0.06, 0.005), color="#8a5426"))
            for k in range(6):  # naranjas y hojas de coca
                th = k * 1.05
                p.append(prim("sphere", (0.3 + cos(th) * 0.05, -0.06 + sin(th) * 0.05, 0.535 + (k % 2) * 0.02), (0.03, 0.03, 0.03), color="#f57c1f"))
            p.append(prim("sphere", (0.3, -0.06, 0.56), (0.045, 0.045, 0.02), color="#1f9d55"))
            p += capsule((0.24, -0.06, 0.53), (0.36, -0.06, 0.53), 0.006, "#8a5426")
        elif n == "baston":
            p += capsule((0.27, -0.17, 0.62), (0.29, -0.19, 0.02), 0.014, "#5e3a2b")
            p.append(prim("torus", (0.25, -0.17, 0.64), (1, 1, 1), R=0.03, r=0.013, rot=(pi / 2, 0, 0), color="#5e3a2b"))
        elif n == "telar":  # pieza de aguayo en las manos
            t = prim("cube", (0, -0.21, 0.66), (0.11, 0.008, 0.08), sub=4)
            aguayo_paint(t, 140)
            p.append(t)
            for s in (1, -1):
                p += capsule((s * 0.12, -0.21, 0.58), (s * 0.12, -0.21, 0.74), 0.008, "#8a5426")
        elif n in ("ojotas", "botas"):
            pass  # se resuelven en las piernas
    return p

# ---------------- construcción ----------------
reset()
mat = bpy.data.materials.new("figura")
mat.use_nodes = True
nt = mat.node_tree
bsdf = nt.nodes["Principled BSDF"]
bsdf.inputs["Roughness"].default_value = 0.55
vc = nt.nodes.new("ShaderNodeVertexColor")
vc.layer_name = "Col"
nt.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])

catalog = []
figures = []
idx = 0
for ai, (aid, label, lower, hat_kind, hair_style, extra, pose) in enumerate(ARCHETYPES):
    if SOLO and aid not in SOLO:
        continue
    for vi, (top, bottom, accent) in enumerate(VARIANTS):
        skin = SKIN[(ai + vi) % len(SKIN)]
        shoes = "ojotas" if "ojotas" in extra else "botas" if "botas" in extra else "zapato"
        parts = head(skin) + torso(top, lower) + arms(top, skin, pose) + legs(lower, bottom, skin, shoes) + hair(hair_style)
        if lower in ("pollera", "pollera_corta"):
            parts += pollera(bottom, accent, corta=(lower == "pollera_corta"))
        elif lower == "falda":
            parts += falda(bottom, accent)
        parts += extras(extra, top, bottom, accent, skin)
        if hat_kind:
            parts += hat(hat_kind, top, bottom, accent)
        for o in parts:  # todo con color, por si alguna pieza quedó sin pintar
            if "Col" not in o.data.color_attributes:
                solid(o, top)
        sel(parts, parts[0])
        bpy.ops.object.join()
        fig = bpy.context.active_object
        tris = sum(len(pl.vertices) - 2 for pl in fig.data.polygons)
        if tris > TRIS_POR_FIGURA:
            dec = fig.modifiers.new("simplificar", "DECIMATE")
            dec.ratio = TRIS_POR_FIGURA / tris
            bpy.ops.object.modifier_apply(modifier=dec.name)
        print("triangulos", aid, tris)
        name = f"pj_{idx:02d}_{aid}_{vi}"
        fig.name = name
        fig.data.name = name
        fig.data.materials.clear()
        fig.data.materials.append(mat)
        try:
            bpy.ops.object.shade_smooth_by_angle(angle=math.radians(50))
        except Exception:
            bpy.ops.object.shade_smooth()
        fig.location = (idx * 0.85, 0, 0) if SOLO else ((idx % 12) * 0.85, (idx // 12) * 1.6, 0)
        figures.append(fig)
        catalog.append({"id": name, "archetype": aid, "label": label, "variant": vi, "colors": [top, bottom, accent], "skin": skin})
        print("figura", name, len(fig.data.polygons))
        idx += 1

if SOLO:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "assets", "blender", "personajes_prueba.blend"))
    raise SystemExit(0)
sel(figures)
kw = dict(filepath=os.path.join(OUT, "personajes.glb"), export_format="GLB", use_selection=True, export_apply=True)
try:
    bpy.ops.export_scene.gltf(**kw, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
                              export_draco_position_quantization=13, export_draco_color_quantization=8)
    draco = True
except Exception as e:
    print("Draco no disponible:", e)
    bpy.ops.export_scene.gltf(**kw)
    draco = False
with open(os.path.join(OUT, "personajes.json"), "w", encoding="utf-8") as fh:
    json.dump({"draco": draco, "count": len(catalog), "figures": catalog}, fh, ensure_ascii=False, indent=1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "assets", "blender", "personajes.blend"))
print("RESULT", len(catalog), "figuras, draco", draco, "tris", sum(len(f.data.polygons) for f in figures))
