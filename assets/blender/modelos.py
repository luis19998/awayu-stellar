# Genera los modelos 3D de Awayu en Blender y los exporta a GLB.
# Uso (desde la raíz del repo):
#   blender --background --factory-startup --python assets/blender/modelos.py
# Salida: web/public/models/cantaro.glb e illa.glb
#
# - Cántaro: perfil torneado de vasija andina, asas, superficie irregular de
#   alfarería hecha a mano y franjas pintadas con rombos (colores por vértice).
# - Illa: llamita tallada (amuleto andino de prosperidad), modelada con
#   metabolas para un acabado esculpido, con borlas de lana de colores.
import bpy, bmesh, math, os, random
from mathutils import Vector, noise

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "web", "public", "models")
os.makedirs(OUT, exist_ok=True)
random.seed(7)

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def hex2lin(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c] + [1.0]

def vc_material(name, rough=0.7, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    attr = nt.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Col"
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    return m

def paint(obj, fn):
    me = obj.data
    if "Col" not in me.color_attributes:
        me.color_attributes.new("Col", "BYTE_COLOR", "CORNER")
    col = me.color_attributes["Col"]
    mw = obj.matrix_world
    for poly in me.polygons:
        for li in poly.loop_indices:
            v = me.vertices[me.loops[li].vertex_index]
            col.data[li].color = fn(mw @ v.co, v.normal)

def export(objs, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(OUT, name), export_format="GLB", use_selection=True,
        export_apply=True, export_yup=True,
    )

# ---------------- Cántaro ----------------
TERRACOTA = hex2lin("#b4532a")
CREMA = hex2lin("#f0dcb4")
NEGRO = hex2lin("#2a1810")
ROJO = hex2lin("#a3122a")
AMARILLO = hex2lin("#f2b632")

PROFILE = [(0.0, 0.0), (0.5, 0.0), (0.72, 0.12), (0.92, 0.45), (1.0, 0.8), (0.95, 1.1),
           (0.78, 1.36), (0.52, 1.55), (0.4, 1.66), (0.44, 1.78), (0.52, 1.84), (0.5, 1.88), (0.4, 1.86)]

def lathe_profile(points, seg=144, sub=6):
    # Subdivide el perfil para tener anillos densos (pintura por vértice)
    pts = []
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        for k in range(sub):
            t = k / sub
            pts.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))
    pts.append(points[-1])
    bm = bmesh.new()
    rings = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        ring = [bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for r, z in pts]
        rings.append(ring)
    for i in range(seg):
        r0, r1 = rings[i], rings[(i + 1) % seg]
        for j in range(len(pts) - 1):
            bm.faces.new((r0[j], r1[j], r1[j + 1], r0[j + 1]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new("cantaro")
    bm.to_mesh(me)
    bm.free()
    return me

def jar_color(p, n):
    z = p.z
    ang = math.atan2(p.y, p.x)
    # Franja principal con rombos escalonados
    if 0.62 < z < 1.02:
        u = (ang / (2 * math.pi) * 12) % 1.0
        v = (z - 0.62) / 0.4
        d = abs(u - 0.5) * 2 + abs(v - 0.5) * 2
        if v < 0.08 or v > 0.92:
            return NEGRO
        if d < 0.55:
            return ROJO if d > 0.3 else AMARILLO
        return CREMA
    if 1.18 < z < 1.24 or 0.5 < z < 0.56:
        return NEGRO
    # Zigzag en el hombro
    if 1.28 < z < 1.42:
        u = (ang / (2 * math.pi) * 24) % 1.0
        zz = 1.3 + 0.1 * abs(u - 0.5) * 2
        return CREMA if abs(z - zz) < 0.025 else TERRACOTA
    return TERRACOTA

def make_jar():
    me = lathe_profile(PROFILE)
    jar = bpy.data.objects.new("Cantaro", me)
    bpy.context.collection.objects.link(jar)
    # Irregularidad de alfarería a mano
    for v in me.vertices:
        r = math.hypot(v.co.x, v.co.y)
        if r < 1e-4:
            continue
        nz = noise.noise(Vector((v.co.x * 2.2, v.co.y * 2.2, v.co.z * 1.4))) * 0.022
        v.co.x *= 1 + nz
        v.co.y *= 1 + nz
    sol = jar.modifiers.new("grosor", "SOLIDIFY")
    sol.thickness = 0.035
    paint(jar, jar_color)
    jar.data.materials.append(vc_material("ceramica", rough=0.62))
    bpy.ops.object.select_all(action="DESELECT")
    jar.select_set(True)
    bpy.context.view_layer.objects.active = jar
    bpy.ops.object.shade_smooth()

    parts = [jar]
    # Asas a los lados
    for side in (1, -1):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.2, minor_radius=0.05, major_segments=40,
                                         minor_segments=14, location=(side * 0.98, 0, 1.08),
                                         rotation=(math.pi / 2, 0, 0))
        h = bpy.context.active_object
        h.name = f"Asa{'D' if side > 0 else 'I'}"
        bpy.ops.object.shade_smooth()
        paint(h, lambda p, n: TERRACOTA)
        h.data.materials.append(jar.data.materials[0])
        parts.append(h)
    return parts

reset()
jar_parts = make_jar()
export(jar_parts, "cantaro.glb")

# ---------------- Illa (llamita tallada) ----------------
reset()
mb = bpy.data.metaballs.new("illa")
mb.resolution = 0.035
mb.render_resolution = 0.03
mbo = bpy.data.objects.new("IllaMeta", mb)
bpy.context.collection.objects.link(mbo)

def ball(co, radius, size=None, kind="ELLIPSOID"):
    e = mb.elements.new()
    e.type = kind
    e.co = co
    e.radius = radius
    if size:
        e.size_x, e.size_y, e.size_z = size
    return e

# Cuerpo, cuello, cabeza, orejas, patas y cola
ball((0, 0, 0.62), 0.42, (1.0, 0.55, 0.5))
ball((0.42, 0, 0.92), 0.22, (0.5, 0.45, 1.0), "CAPSULE")
ball((0.5, 0, 1.22), 0.17, (0.6, 0.45, 0.5))
ball((0.66, 0, 1.17), 0.1, (0.6, 0.5, 0.45))
for y in (0.07, -0.07):
    ball((0.47, y, 1.42), 0.07, (0.4, 0.4, 1.0), "CAPSULE")
for x in (0.28, -0.28):
    for y in (0.13, -0.13):
        ball((x, y, 0.28), 0.1, (0.6, 0.6, 1.6), "CAPSULE")
ball((-0.44, 0, 0.78), 0.1, (0.7, 0.6, 0.6))
bpy.context.view_layer.update()

bpy.ops.object.select_all(action="DESELECT")
mbo.select_set(True)
bpy.context.view_layer.objects.active = mbo
bpy.ops.object.convert(target="MESH")
illa = bpy.context.active_object
illa.name = "Illa"
# Tallado: superficie con marcas de cincel suaves
for v in illa.data.vertices:
    d = noise.noise(v.co * 9.0) * 0.012 + noise.noise(v.co * 22.0) * 0.004
    v.co += v.normal * d
dec = illa.modifiers.new("simplificar", "DECIMATE")
dec.ratio = 0.35
bpy.ops.object.modifier_apply(modifier=dec.name)
bpy.ops.object.shade_smooth()

PIEDRA = hex2lin("#efe8dc")
BORLAS = [hex2lin(h) for h in ("#d81b60", "#f9c22e", "#13a3b0", "#1f9d55")]

def illa_color(p, n):
    # Borlas de lana en las orejas y collar de colores
    if p.z > 1.36:
        return BORLAS[0] if p.y > 0 else BORLAS[2]
    if 0.98 < p.z < 1.06 and p.x > 0.3:
        return BORLAS[int((math.atan2(p.y, p.x - 0.42) + math.pi) / (2 * math.pi) * 8) % 4]
    shade = 0.92 + noise.noise(p * 6.0) * 0.08
    return [PIEDRA[0] * shade, PIEDRA[1] * shade, PIEDRA[2] * shade, 1.0]

paint(illa, illa_color)
illa.data.materials.append(vc_material("piedra", rough=0.45))
# Base tallada
bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.62, depth=0.12, location=(0, 0, 0.12))
base = bpy.context.active_object
base.name = "IllaBase"
bev = base.modifiers.new("bisel", "BEVEL")
bev.width = 0.03
bev.segments = 3
paint(base, lambda p, n: hex2lin("#5b2a86") if abs(p.z - 0.12) < 0.03 else hex2lin("#2b1b33"))
base.data.materials.append(vc_material("base", rough=0.8))
export([illa, base], "illa.glb")

result = {"out": OUT, "files": os.listdir(OUT)}
print("RESULT", result)
