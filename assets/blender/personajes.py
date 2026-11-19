# Personajes de Awayu: 36 figuras talladas al estilo de las miniaturas de
# Alasitas (12 oficios bolivianos x 3 variantes de color y tono de piel).
# Cada figura es una sola malla con colores por vértice: el cuerpo se funde
# con remallado por vóxeles (acabado esculpido) y los accesorios se suman.
#   blender --background --factory-startup --python assets/blender/personajes.py
# Salida: web/public/models/personajes.glb (con compresión Draco) y un JSON
# con el catálogo (web/public/models/personajes.json).
import bpy, bmesh, math, os, json, random
from mathutils import Vector, noise

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "web", "public", "models")
os.makedirs(OUT, exist_ok=True)
random.seed(11)

def lin(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)

SKIN = ["#a8704a", "#8d5a3b", "#6e4429"]
HAIR = "#1c1414"
DARK = "#2a1d1a"

# Variantes de ropa (top, abajo, acento) tomadas de la paleta del aguayo
VARIANTS = [
    ("#d81b60", "#283c9c", "#f9c22e"),
    ("#1f9d55", "#a3122a", "#f3e6c8"),
    ("#13a3b0", "#5b2a86", "#f57c1f"),
]

ARCHETYPES = [
    # id, nombre, parte de abajo, sombrero, peinado, extras
    ("chola_pacena", "Cholita paceña", "pollera", "bombin", "trenzas", ["manta"]),
    ("chola_valle", "Cholita del valle", "pollera", "copa_blanca", "trenzas", ["manta"]),
    ("campesino", "Productor del altiplano", "pantalon", "chullo", "corto", ["poncho"]),
    ("minero", "Minero de Potosí", "pantalon", "casco", "corto", ["lampara"]),
    ("estudiante", "Estudiante", "pantalon", "gorra", "corto", ["mochila"]),
    ("comerciante", "Comerciante de La Cancha", "pollera", "copa_blanca", "trenzas", ["bulto"]),
    ("musico", "Músico de charango", "pantalon", "chullo", "corto", ["charango"]),
    ("agricultora", "Agricultora de los Yungas", "falda", "ala_ancha", "cola", ["canasta"]),
    ("mototaxista", "Mototaxista", "pantalon", "casco_moto", "corto", []),
    ("profesora", "Profesora rural", "falda", None, "cola", ["libro"]),
    ("abuelo", "Abuelo tejedor", "pantalon", "sombrero", "corto", ["baston", "manta"]),
    ("tejedora", "Tejedora de Tarabuco", "pollera", "montera", "trenzas", ["bulto"]),
]

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def sel(objs, active=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]

def prim(kind, loc=(0, 0, 0), scale=(1, 1, 1), rot=(0, 0, 0), **kw):
    if kind == "sphere":
        bpy.ops.mesh.primitive_uv_sphere_add(segments=kw.get("seg", 24), ring_count=kw.get("rings", 12), location=loc, rotation=rot)
    elif kind == "cyl":
        bpy.ops.mesh.primitive_cylinder_add(vertices=kw.get("seg", 20), location=loc, rotation=rot)
    elif kind == "cone":
        bpy.ops.mesh.primitive_cone_add(vertices=kw.get("seg", 24), radius1=kw.get("r1", 1), radius2=kw.get("r2", 0), depth=kw.get("depth", 2), location=loc, rotation=rot)
    elif kind == "torus":
        bpy.ops.mesh.primitive_torus_add(major_radius=kw.get("R", 1), minor_radius=kw.get("r", 0.25), major_segments=kw.get("seg", 24), minor_segments=8, location=loc, rotation=rot)
    elif kind == "cube":
        bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.active_object
    o.scale = scale
    return o

def apply_all(o):
    sel([o])
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

def paint(o, fn):
    me = o.data
    if "Col" not in me.color_attributes:
        me.color_attributes.new("Col", "BYTE_COLOR", "CORNER")
    col = me.color_attributes["Col"]
    mw = o.matrix_world
    for poly in me.polygons:
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index]
            col.data[li].color = fn(mw @ v.co)

def solid(o, color):
    c = lin(color)
    paint(o, lambda p: c)
    return o

# ---------------- Cuerpo esculpido ----------------
HEAD = Vector((0, 0, 1.02))

def body(lower):
    parts = [
        prim("sphere", (0, 0, 0.7), (0.2, 0.15, 0.25)),            # torso
        prim("cyl", (0, 0, 0.92), (0.06, 0.06, 0.06)),             # cuello
        prim("sphere", HEAD, (0.165, 0.155, 0.175)),               # cabeza
        prim("sphere", (0, -0.15, 1.0), (0.035, 0.03, 0.04)),      # nariz
    ]
    for s in (1, -1):
        parts.append(prim("cyl", (s * 0.235, 0, 0.68), (0.05, 0.05, 0.2), (0, -s * 0.2, 0)))  # brazo
        parts.append(prim("sphere", (s * 0.28, -0.01, 0.47), (0.055, 0.05, 0.06)))            # mano
    if lower == "pollera":
        parts.append(prim("cone", (0, 0, 0.32), (1, 1, 1), r1=0.36, r2=0.19, depth=0.5, seg=32))
        parts.append(prim("torus", (0, 0, 0.1), (1, 1, 0.7), R=0.33, r=0.05, seg=32))
    elif lower == "falda":
        parts.append(prim("cone", (0, 0, 0.38), (1, 1, 1), r1=0.26, r2=0.18, depth=0.36, seg=28))
    for s in (1, -1):
        if lower == "pantalon":
            parts.append(prim("cyl", (s * 0.08, 0, 0.27), (0.075, 0.075, 0.26)))
        else:
            parts.append(prim("cyl", (s * 0.08, 0, 0.12), (0.05, 0.05, 0.12)))
        parts.append(prim("sphere", (s * 0.085, -0.04, 0.03), (0.07, 0.1, 0.045)))  # zapato
    for o in parts:
        apply_all(o)
    sel(parts)
    bpy.ops.object.join()
    b = bpy.context.active_object
    rm = b.modifiers.new("fundir", "REMESH")
    rm.mode = "VOXEL"
    rm.voxel_size = 0.016
    bpy.ops.object.modifier_apply(modifier=rm.name)
    sm = b.modifiers.new("pulir", "SMOOTH")
    sm.factor = 0.7
    sm.iterations = 5
    bpy.ops.object.modifier_apply(modifier=sm.name)
    for v in b.data.vertices:  # textura tallada suave
        v.co += v.normal * noise.noise(v.co * 14.0) * 0.004
    dec = b.modifiers.new("simplificar", "DECIMATE")
    dec.ratio = min(1.0, 2600 / max(1, len(b.data.polygons)))
    bpy.ops.object.modifier_apply(modifier=dec.name)
    return b

def body_colors(lower, skin, top, bottom, accent):
    S, T, B, A, D = lin(skin), lin(top), lin(bottom), lin(accent), lin(DARK)
    def f(p):
        if (p - HEAD).length < 0.2 or (p.z > 0.86 and abs(p.x) < 0.08):
            return S
        if p.z < 0.07:
            return D
        if p.z < 0.56 and abs(p.x) > 0.22 and p.z > 0.4:  # manos
            return S
        if lower == "pollera":
            if p.z < 0.57:
                return A if 0.13 < p.z < 0.19 or 0.3 < p.z < 0.33 else B
        elif lower == "falda":
            if p.z < 0.57:
                return A if 0.22 < p.z < 0.25 else B
            pass
        else:
            if p.z < 0.53:
                return B
        if lower != "pantalon" and p.z < 0.25:
            return S
        return T
    return f

# ---------------- Peinados y accesorios ----------------
def hair(style):
    parts = [prim("sphere", (0, 0.025, 1.07), (0.172, 0.165, 0.15))]
    if style == "trenzas":
        for s in (1, -1):
            for k in range(5):
                parts.append(prim("sphere", (s * 0.12, 0.09, 0.9 - k * 0.075), (0.045, 0.045, 0.05)))
            parts.append(prim("sphere", (s * 0.12, 0.09, 0.5), (0.03, 0.03, 0.03)))  # tullma
    elif style == "cola":
        parts.append(prim("cone", (0, 0.2, 0.92), (1, 1, 1), r1=0.06, r2=0.02, depth=0.28, rot=(0.4, 0, 0)))
    for o in parts:
        apply_all(o)
        solid(o, HAIR)
    return parts

def hat(kind, a, b, c):
    p = []
    if kind == "bombin":
        p += [solid(prim("cyl", (0, 0, 1.2), (0.12, 0.12, 0.06)), "#3a2a22"),
              solid(prim("sphere", (0, 0, 1.25), (0.12, 0.12, 0.07)), "#3a2a22"),
              solid(prim("cyl", (0, 0, 1.15), (0.17, 0.17, 0.01)), "#3a2a22"),
              solid(prim("cyl", (0, 0, 1.17), (0.123, 0.123, 0.015)), c)]
    elif kind == "copa_blanca":
        p += [solid(prim("cyl", (0, 0, 1.27), (0.12, 0.12, 0.13)), "#f4efe6"),
              solid(prim("cyl", (0, 0, 1.15), (0.2, 0.2, 0.012)), "#f4efe6"),
              solid(prim("cyl", (0, 0, 1.17), (0.123, 0.123, 0.02)), "#1c1414")]
    elif kind == "chullo":
        ch = prim("sphere", (0, 0, 1.11), (0.18, 0.17, 0.16))
        apply_all(ch)
        A, B, C = lin(a), lin(b), lin(c)
        paint(ch, lambda q: [A, B, C][int((q.z * 40)) % 3])
        p += [ch, solid(prim("sphere", (0, 0, 1.29), (0.04, 0.04, 0.04)), c)]
        for s in (1, -1):
            p.append(solid(prim("cone", (s * 0.15, 0, 0.95), (1, 1, 1), r1=0.05, r2=0.01, depth=0.16), b))
    elif kind == "casco":
        p += [solid(prim("sphere", (0, 0, 1.1), (0.19, 0.19, 0.15)), "#f2c14e"),
              solid(prim("cyl", (0, 0, 1.08), (0.22, 0.22, 0.012)), "#f2c14e"),
              solid(prim("cyl", (0, -0.18, 1.14), (0.04, 0.04, 0.03), (math.pi / 2, 0, 0)), "#fff6c2")]
    elif kind == "casco_moto":
        p += [solid(prim("sphere", (0, 0.01, 1.06), (0.21, 0.21, 0.2)), a),
              solid(prim("cube", (0, -0.17, 1.02), (0.12, 0.03, 0.06)), "#1c2733")]
    elif kind == "gorra":
        p += [solid(prim("sphere", (0, 0, 1.12), (0.17, 0.17, 0.11)), a),
              solid(prim("cube", (0, -0.17, 1.1), (0.11, 0.08, 0.01)), a)]
    elif kind == "ala_ancha":
        p += [solid(prim("cyl", (0, 0, 1.15), (0.27, 0.27, 0.012)), "#d8b77a"),
              solid(prim("sphere", (0, 0, 1.19), (0.13, 0.13, 0.09)), "#d8b77a"),
              solid(prim("cyl", (0, 0, 1.165), (0.135, 0.135, 0.015)), b)]
    elif kind == "sombrero":
        p += [solid(prim("cyl", (0, 0, 1.15), (0.21, 0.21, 0.012)), "#5e3a2b"),
              solid(prim("cyl", (0, 0, 1.21), (0.12, 0.12, 0.06)), "#5e3a2b")]
    elif kind == "montera":  # sombrero de cuero en forma de casco con ala
        p += [solid(prim("sphere", (0, 0, 1.13), (0.15, 0.15, 0.1)), "#2b1b16"),
              solid(prim("cyl", (0, 0, 1.12), (0.24, 0.24, 0.015)), "#2b1b16"),
              solid(prim("torus", (0, 0, 1.12), (1, 1, 1), R=0.24, r=0.012), c)]
    for o in p:
        apply_all(o)
    return p

def extras(names, a, b, c):
    p = []
    for n in names:
        if n == "manta":
            m = prim("torus", (0, 0, 0.85), (1, 0.85, 1.6), R=0.18, r=0.06, seg=28)
            apply_all(m)
            A, C = lin(a), lin(c)
            paint(m, lambda q: C if int(q.z * 60) % 4 == 0 else A)
            p.append(m)
        elif n == "poncho":
            m = prim("cone", (0, 0, 0.72), (1, 0.8, 1), r1=0.3, r2=0.08, depth=0.36, seg=4)
            apply_all(m)
            A, B, C = lin(a), lin(b), lin(c)
            paint(m, lambda q: [A, C, B][int((q.z + 1) * 30) % 3])
            p.append(m)
        elif n == "bulto":
            m = prim("sphere", (0, 0.2, 0.72), (0.2, 0.12, 0.17))
            apply_all(m)
            STR = [lin(x) for x in ("#d81b60", "#f9c22e", "#13a3b0", "#1f9d55", "#a3122a")]
            paint(m, lambda q: STR[int((q.z + 1) * 25) % len(STR)])
            p.append(m)
            k = prim("torus", (0, 0, 0.88), (1, 0.8, 0.35), R=0.17, r=0.02)
            apply_all(k)
            p.append(solid(k, "#d81b60"))
        elif n == "mochila":
            p.append(solid(prim("cube", (0, 0.17, 0.72), (0.13, 0.06, 0.16)), b))
        elif n == "lampara":
            p.append(solid(prim("cube", (0.0, 0.0, 0.52), (0.2, 0.15, 0.02)), "#4a3a2a"))
        elif n == "charango":
            p += [solid(prim("sphere", (0.12, -0.17, 0.62), (0.1, 0.03, 0.08), (0, 0.7, 0)), "#8a5a32"),
                  solid(prim("cube", (-0.02, -0.17, 0.74), (0.16, 0.012, 0.018), (0, 0.7, 0)), "#3a2414")]
        elif n == "canasta":
            p.append(solid(prim("cyl", (0.3, -0.05, 0.4), (0.09, 0.09, 0.07)), "#b9773e"))
            p.append(solid(prim("sphere", (0.3, -0.05, 0.47), (0.08, 0.08, 0.04)), "#1f9d55"))
        elif n == "libro":
            p.append(solid(prim("cube", (-0.27, -0.06, 0.5), (0.02, 0.07, 0.09)), "#283c9c"))
        elif n == "baston":
            p.append(solid(prim("cyl", (0.3, -0.04, 0.26), (0.018, 0.018, 0.26)), "#5e3a2b"))
    for o in p:
        apply_all(o)
    return p

def eyes():
    p = []
    for s in (1, -1):
        e = prim("sphere", (s * 0.06, -0.15, 1.04), (0.022, 0.012, 0.026), seg=10, rings=6)
        apply_all(e)
        p.append(solid(e, "#120c0c"))
    return p

# ---------------- Construcción ----------------
reset()
mat = bpy.data.materials.new("figura")
mat.use_nodes = True
nt = mat.node_tree
bsdf = nt.nodes["Principled BSDF"]
bsdf.inputs["Roughness"].default_value = 0.5
vc = nt.nodes.new("ShaderNodeVertexColor")
vc.layer_name = "Col"
nt.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])

catalog = []
figures = []
idx = 0
for ai, (aid, label, lower, hat_kind, hair_style, extra) in enumerate(ARCHETYPES):
    for vi, (top, bottom, accent) in enumerate(VARIANTS):
        skin = SKIN[(ai + vi) % len(SKIN)]
        b = body(lower)
        paint(b, body_colors(lower, skin, top, bottom, accent))
        parts = [b] + hair(hair_style) + eyes() + extras(extra, top, bottom, accent)
        if hat_kind:
            parts += hat(hat_kind, top, bottom, accent)
        sel(parts, b)
        bpy.ops.object.join()
        fig = bpy.context.active_object
        name = f"pj_{idx:02d}_{aid}_{vi}"
        fig.name = name
        fig.data.name = name
        fig.data.materials.clear()
        fig.data.materials.append(mat)
        bpy.ops.object.shade_smooth()
        # Grilla solo para la vista previa; la web pone cada figura en el origen
        fig.location = ((idx % 9) * 0.8, (idx // 9) * 0.9, 0)
        figures.append(fig)
        catalog.append({"id": name, "archetype": aid, "label": label, "variant": vi, "colors": [top, bottom, accent], "skin": skin})
        idx += 1

sel(figures)
kw = dict(filepath=os.path.join(OUT, "personajes.glb"), export_format="GLB", use_selection=True, export_apply=True)
try:
    bpy.ops.export_scene.gltf(**kw, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7,
                              export_draco_position_quantization=12, export_draco_color_quantization=8)
    draco = True
except Exception as e:  # sin Draco, igual exporta
    print("Draco no disponible:", e)
    bpy.ops.export_scene.gltf(**kw)
    draco = False
with open(os.path.join(OUT, "personajes.json"), "w", encoding="utf-8") as fh:
    json.dump({"draco": draco, "count": len(catalog), "figures": catalog}, fh, ensure_ascii=False, indent=1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "assets", "blender", "personajes.blend"))
print("RESULT", len(catalog), "figuras, draco", draco, "tris", sum(len(f.data.polygons) for f in figures))
