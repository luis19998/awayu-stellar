# Miniaturas de los 36 personajes para el selector de la web.
#   blender --background assets/blender/personajes.blend --python assets/blender/miniaturas.py
# Renderiza cada figura sola, de frente y un poco de costado, con fondo
# transparente, y guarda web/public/models/figuras/<id>.png (luego se pasan a webp).
import bpy, os, math
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(bpy.data.filepath), "..", ".."))
OUT = os.path.join(ROOT, "web", "public", "models", "figuras")
os.makedirs(OUT, exist_ok=True)
SIZE = 320

scn = bpy.context.scene
names = sorted(o.name for o in scn.objects if o.type == "MESH" and o.name.startswith("pj_"))
engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
scn.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in engines else "BLENDER_EEVEE"
scn.render.resolution_x = scn.render.resolution_y = SIZE
scn.render.film_transparent = True
scn.render.image_settings.file_format = "PNG"
scn.render.image_settings.color_mode = "RGBA"

world = bpy.data.worlds.new("mini")
scn.world = world
world.use_nodes = True
nt = world.node_tree
bg = next((n for n in nt.nodes if n.type == "BACKGROUND"), None) or nt.nodes.new("ShaderNodeBackground")
out = next((n for n in nt.nodes if n.type == "OUTPUT_WORLD"), None) or nt.nodes.new("ShaderNodeOutputWorld")
nt.links.new(bg.outputs[0], out.inputs[0])
bg.inputs[0].default_value = (0.5, 0.45, 0.55, 1)
bg.inputs[1].default_value = 0.8

cam_data = bpy.data.cameras.new("cam")
cam_data.type = "ORTHO"
cam = bpy.data.objects.new("cam", cam_data)
scn.collection.objects.link(cam)
scn.camera = cam
for name, rot, energy in (("key", (math.radians(55), 0, math.radians(-35)), 3.6), ("fill", (math.radians(65), 0, math.radians(45)), 1.4), ("rim", (math.radians(115), 0, math.radians(180)), 2.4)):
    ld = bpy.data.lights.new(name, "SUN"); ld.energy = energy
    lo = bpy.data.objects.new(name, ld); lo.rotation_euler = rot
    scn.collection.objects.link(lo)

objs = {n: scn.objects[n] for n in names}
for n in names:
    for m, o in objs.items():
        o.hide_render = m != n
    o = objs[n]
    lo = Vector((1e9, 1e9, 1e9)); hi = Vector((-1e9, -1e9, -1e9))
    for c in o.bound_box:
        p = o.matrix_world @ Vector(c)
        lo = Vector(map(min, lo, p)); hi = Vector(map(max, hi, p))
    center = (lo + hi) / 2
    height = hi.z - lo.z
    cam_data.ortho_scale = max(height, hi.x - lo.x) * 1.12
    # de frente (-Y), girada 18° y apenas desde arriba; la cámara mira al centro
    a = math.radians(18)
    target = center + Vector((0, 0, height * 0.06))
    cam.location = target + Vector((math.sin(a) * 10, -math.cos(a) * 10, 1.6))
    cam.rotation_mode = "QUATERNION"
    cam.rotation_quaternion = (target - cam.location).to_track_quat("-Z", "Y")
    scn.render.filepath = os.path.join(OUT, f"{n}.png")
    bpy.ops.render.render(write_still=True)
print("MINIATURAS", len(names), OUT)
