# Vasijas (el pozo) y mesas (la base del círculo) para personalizar la escena.
#   blender --background --factory-startup --python assets/blender/vasijas_mesas.py
# Salida: web/public/models/vasijas.glb y mesas.glb (Draco), un objeto por pieza.
# Medidas: vasijas de ~1.9 de alto y ~1 de radio (como el cántaro); mesas de
# radio 6.4 con la superficie a la altura indicada en el nombre del objeto.
import bpy, bmesh, math, os, json
from mathutils import Vector, noise

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "web", "public", "models")

def lin(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def sel(objs, active=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]

def apply(o):
    sel([o])
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return o

def paint(o, fn):
    me = o.data
    if "Col" not in me.color_attributes:
        me.color_attributes.new("Col", "BYTE_COLOR", "CORNER")
    col = me.color_attributes["Col"]
    for poly in me.polygons:
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index]
            col.data[li].color = fn(v.co, v.normal)

def material(name, rough, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    vc = nt.nodes.new("ShaderNodeVertexColor")
    vc.layer_name = "Col"
    nt.links.new(vc.outputs["Color"], b.inputs["Base Color"])
    return m

def lathe(name, profile, seg=96, sub=5):
    pts = []
    for (x0, y0), (x1, y1) in zip(profile, profile[1:]):
        for k in range(sub):
            t = k / sub
            pts.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))
    pts.append(profile[-1])
    me = bpy.data.meshes.new(name)
    verts, faces = [], []
    n = len(pts)
    for i in range(seg):
        a = 2 * math.pi * i / seg
        for r, z in pts:
            verts.append((r * math.cos(a), r * math.sin(a), z))
    for i in range(seg):
        j = (i + 1) % seg
        for k in range(n - 1):
            faces.append((i * n + k, j * n + k, j * n + k + 1, i * n + k + 1))
    me.from_pydata(verts, [], faces)
    me.update()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    sel([o])
    bpy.ops.object.shade_smooth()
    return o

def solidify(o, t):
    m = o.modifiers.new("grosor", "SOLIDIFY")
    m.thickness = t
    sel([o])
    bpy.ops.object.modifier_apply(modifier=m.name)

def join(parts, name):
    sel(parts)
    bpy.ops.object.join()
    o = bpy.context.active_object
    o.name = name
    o.data.name = name
    return o

def export(objs, file):
    sel(objs)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, file), export_format="GLB", use_selection=True,
                              export_apply=True, export_draco_mesh_compression_enable=True,
                              export_draco_mesh_compression_level=7)

# ======================= VASIJAS =======================
reset()
ceramica = material("ceramica", 0.55)
madera = material("madera", 0.7)
metal = material("metal", 0.3, 0.8)
vessels = []

# 1. Q'ero: vaso ceremonial acampanado con tocapus (cuadros geométricos)
qero = lathe("vasija_qero", [(0, 0), (0.55, 0), (0.6, 0.08), (0.62, 0.3), (0.72, 1.0), (0.86, 1.6), (0.92, 1.85), (0.9, 1.88)])
solidify(qero, 0.04)
T = [lin(h) for h in ("#a3122a", "#f2c14e", "#1c1414", "#f0dcb4", "#1f9d55")]
def qero_col(p, n):
    a = (math.atan2(p.y, p.x) / (2 * math.pi) + 0.5) * 16
    if 0.55 < p.z < 1.55:
        cell = int(a) + int((p.z - 0.55) / 0.2) * 3
        inner = (a % 1 > 0.18 and a % 1 < 0.82) and ((p.z - 0.55) % 0.2 > 0.04)
        return T[cell % 5] if inner else T[2]
    return T[3] if p.z > 1.55 else lin("#7a3b1e")
paint(qero, qero_col)
qero.data.materials.append(ceramica)
vessels.append(qero)

# 2. Chanchito: la alcancía de toda la vida (cerdito de barro pintado)
parts = []
bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, location=(0, 0, 0.95))
b = bpy.context.active_object; b.scale = (1.05, 0.82, 0.8); parts.append(apply(b))
bpy.ops.mesh.primitive_cylinder_add(vertices=32, location=(0, -0.95, 0.95), rotation=(math.pi / 2, 0, 0))
s = bpy.context.active_object; s.scale = (0.26, 0.2, 0.16); parts.append(apply(s))
for x in (0.42, -0.42):
    for y in (0.4, -0.4):
        bpy.ops.mesh.primitive_cylinder_add(vertices=20, location=(x, y, 0.22))
        l = bpy.context.active_object; l.scale = (0.14, 0.14, 0.22); parts.append(apply(l))
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=0.17, depth=0.3, location=(x * 0.7, -0.45, 1.6), rotation=(-0.5, 0, 0))
    parts.append(apply(bpy.context.active_object))
bpy.ops.mesh.primitive_torus_add(major_radius=0.12, minor_radius=0.035, location=(0, 0.85, 1.05), rotation=(0, math.pi / 2, 0))
parts.append(apply(bpy.context.active_object))
pig = join(parts, "vasija_chanchito")
rm = pig.modifiers.new("fundir", "REMESH"); rm.mode = "VOXEL"; rm.voxel_size = 0.03
sel([pig]); bpy.ops.object.modifier_apply(modifier=rm.name)
sm = pig.modifiers.new("pulir", "SMOOTH"); sm.factor = 0.6; sm.iterations = 4
bpy.ops.object.modifier_apply(modifier=sm.name)
dec = pig.modifiers.new("simplificar", "DECIMATE"); dec.ratio = min(1, 9000 / len(pig.data.polygons))
bpy.ops.object.modifier_apply(modifier=dec.name)
bpy.ops.object.shade_smooth()
PINK, FLOWER, LEAF, DARKC = lin("#e58a8a"), lin("#f9c22e"), lin("#1f9d55"), lin("#2a1d1a")
def pig_col(p, n):
    if p.y < -1.08 and abs(p.x) < 0.07 and abs(p.z - 0.95) < 0.06:
        return DARKC  # nariz
    if p.z > 1.68 and abs(p.x) < 0.2 and abs(p.y) < 0.06:
        return DARKC  # ranura de la alcancía
    f = noise.noise(Vector((p.x * 4, p.y * 4, p.z * 4)))
    if f > 0.38 and 0.6 < p.z < 1.4:
        return FLOWER
    if 0.28 < f <= 0.38 and 0.6 < p.z < 1.4:
        return LEAF
    if p.y < -0.8 and 0.95 < p.z < 1.05:
        return lin("#c75c6a")
    return PINK
paint(pig, pig_col)
pig.data.materials.append(ceramica)
vessels.append(pig)

# 3. Olla de barro con tapa
olla = lathe("vasija_olla_cuerpo", [(0, 0), (0.6, 0), (0.95, 0.35), (1.08, 0.8), (1.0, 1.2), (0.8, 1.35), (0.84, 1.42)])
solidify(olla, 0.04)
tapa = lathe("vasija_olla_tapa", [(0, 1.62), (0.18, 1.6), (0.22, 1.55), (0.6, 1.47), (0.86, 1.42), (0.86, 1.4)])
bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, location=(0, 0, 1.68))
pomo = bpy.context.active_object; pomo.scale = (0.12, 0.12, 0.1); apply(pomo)
handles = []
for sgn in (1, -1):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.18, minor_radius=0.05, location=(sgn * 1.04, 0, 1.0), rotation=(math.pi / 2, 0, 0))
    handles.append(apply(bpy.context.active_object))
olla = join([olla, tapa, pomo] + handles, "vasija_olla")
BARRO, HOLLIN, CREMA = lin("#8e4a2a"), lin("#3a2418"), lin("#f0dcb4")
paint(olla, lambda p, n: HOLLIN if p.z < 0.3 else (CREMA if 0.75 < p.z < 0.82 or (1.48 < p.z < 1.52) else BARRO))
olla.data.materials.append(ceramica)
vessels.append(olla)

# 4. Cofre de madera con bandas de metal
parts = []
bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0.55)); c = bpy.context.active_object; c.scale = (0.95, 0.65, 0.55); parts.append(apply(c))
bpy.ops.mesh.primitive_cylinder_add(vertices=32, location=(0, 0, 1.1), rotation=(0, math.pi / 2, 0))
lid = bpy.context.active_object; lid.scale = (0.65, 0.65, 0.97); parts.append(apply(lid))
for x in (-0.6, 0, 0.6):
    bpy.ops.mesh.primitive_cube_add(location=(x, 0, 0.55)); bnd = bpy.context.active_object; bnd.scale = (0.05, 0.67, 0.56); parts.append(apply(bnd))
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, location=(x, 0, 1.1), rotation=(0, math.pi / 2, 0))
    bl = bpy.context.active_object; bl.scale = (0.67, 0.67, 0.05); parts.append(apply(bl))
bpy.ops.mesh.primitive_cube_add(location=(0, -0.68, 0.95)); lk = bpy.context.active_object; lk.scale = (0.12, 0.04, 0.16); parts.append(apply(lk))
cofre = join(parts, "vasija_cofre")
WOOD, WOOD2, GOLD = lin("#7a4a28"), lin("#5e3820"), lin("#d9a441")
def chest_col(p, n):
    if abs(p.x) < 0.06 or abs(abs(p.x) - 0.6) < 0.06 or (abs(p.x) < 0.13 and p.y < -0.66):
        return GOLD
    return WOOD if int((p.z + p.x * 0.2) * 12) % 2 else WOOD2
paint(cofre, chest_col)
cofre.data.materials.append(madera)
vessels.append(cofre)

for i, v in enumerate(vessels):
    v.location = (i * 2.6, 0, 0)
export(vessels, "vasijas.glb")
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "assets", "blender", "vasijas.blend"))
vessel_names = [v.name for v in vessels]

# ======================= MESAS =======================
reset()
madera = material("madera", 0.65)
piedra = material("piedra", 0.85)
sal = material("sal", 0.35)
tables = []
R = 6.4

def densify(o, cuts=7):
    """Las tapas de los cilindros son un solo polígono: se pican desde el centro
    y se subdividen para que la pintura por vértice muestre vetas y dibujos."""
    bm = bmesh.new()
    bm.from_mesh(o.data)
    big = [f for f in bm.faces if len(f.verts) > 4]
    bmesh.ops.poke(bm, faces=big)
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=cuts, use_grid_fill=True)
    bm.to_mesh(o.data)
    bm.free()

def round_table(name, top_h, thick, legs, mat, fn, sides=96):
    parts = []
    bpy.ops.mesh.primitive_cylinder_add(vertices=sides, radius=R, depth=thick, location=(0, 0, top_h - thick / 2))
    parts.append(apply(bpy.context.active_object))
    for k in range(legs):
        a = 2 * math.pi * k / legs + math.pi / legs
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.28, depth=top_h - thick, location=(math.cos(a) * R * 0.7, math.sin(a) * R * 0.7, (top_h - thick) / 2))
        parts.append(apply(bpy.context.active_object))
    t = join(parts, name)
    densify(t)
    paint(t, fn)
    t.data.materials.append(mat)
    tables.append(t)
    return t

def wood_col(p, n):
    rings = (math.hypot(p.x, p.y) * 3 + noise.noise(Vector((p.x, p.y, 0)) * 2) * 1.5) % 1
    return lin("#8a5a32") if rings > 0.5 else lin("#6e4424")
round_table("mesa_madera_h0.55", 0.55, 0.18, 6, madera, wood_col)

def stone_col(p, n):
    g = 0.42 + noise.noise(p * 1.7) * 0.12
    step = abs(p.z - 0.62) < 0.05 and (int((math.atan2(p.y, p.x) + math.pi) * 6) % 2 == 0)
    return lin("#5b2a86") if step else (g, g * 0.95, g * 0.9, 1.0)
round_table("mesa_piedra_h0.7", 0.7, 0.7, 0, piedra, stone_col, sides=8)

def salt_col(p, n):
    hexv = (math.cos(p.x * 2.2) + math.cos(p.x * 1.1 + p.y * 1.9) + math.cos(-p.x * 1.1 + p.y * 1.9))
    return lin("#d9dde2") if hexv > 2.6 else lin("#f6f4ef")
round_table("mesa_sal_h0.45", 0.45, 0.45, 0, sal, salt_col, sides=6)

def trunk_col(p, n):
    r = math.hypot(p.x, p.y)
    if r > R - 0.35:
        return lin("#4a3020")
    return lin("#c99a62") if int(r * 2.5 + noise.noise(p * 0.8)) % 2 else lin("#b3824e")
round_table("mesa_tronco_h0.6", 0.6, 0.6, 0, madera, trunk_col, sides=64)

for i, t in enumerate(tables):
    t.location = (i * 14, 0, 0)
export(tables, "mesas.glb")
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "assets", "blender", "mesas.blend"))
with open(os.path.join(OUT, "piezas.json"), "w", encoding="utf-8") as fh:
    json.dump({"vasijas": ["cantaro"] + vessel_names, "mesas": [t.name for t in tables]}, fh, indent=1)
print("RESULT", vessel_names, [t.name for t in tables])
