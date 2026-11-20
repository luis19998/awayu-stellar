# Renderiza una lámina de vista previa de un .blend de modelos de Awayu.
#   blender --background <archivo.blend> --python assets/blender/vista_previa.py -- <salida.png> [filtro]
# Coloca una cámara frontal levemente picada sobre todos los objetos de malla
# (o solo los que contengan <filtro> en el nombre) y renderiza con EEVEE.
import bpy, sys, math
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
out = argv[0] if argv else "//vista.png"
filt = argv[1] if len(argv) > 1 else ""

objs = [o for o in bpy.context.scene.objects if o.type == "MESH" and filt in o.name]
for o in bpy.context.scene.objects:
    if o.type == "MESH":
        o.hide_render = o not in objs
lo = Vector((1e9, 1e9, 1e9)); hi = Vector((-1e9, -1e9, -1e9))
for o in objs:
    for c in o.bound_box:
        p = o.matrix_world @ Vector(c)
        lo = Vector(map(min, lo, p)); hi = Vector(map(max, hi, p))
center = (lo + hi) / 2
size = max(hi.x - lo.x, hi.z - lo.z, 0.5)

scn = bpy.context.scene
scn.render.engine = "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items] else "BLENDER_EEVEE"
scn.render.resolution_x = int(argv[2]) if len(argv) > 2 else 1600
scn.render.resolution_y = int(scn.render.resolution_x * max(0.45, (hi.z - lo.z + 0.3) / (hi.x - lo.x + 0.3)))
scn.render.film_transparent = False
world = bpy.data.worlds.new("vista")
scn.world = world
world.use_nodes = True
nt = world.node_tree
bg = next((n for n in nt.nodes if n.type == "BACKGROUND"), None)
if bg is None:
    bg = nt.nodes.new("ShaderNodeBackground")
    outn = next((n for n in nt.nodes if n.type == "OUTPUT_WORLD"), None) or nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(bg.outputs[0], outn.inputs[0])
bg.inputs[0].default_value = (0.08, 0.06, 0.12, 1)
bg.inputs[1].default_value = 0.9

cam_data = bpy.data.cameras.new("cam")
cam_data.type = "ORTHO"
cam_data.ortho_scale = size * 1.08
cam = bpy.data.objects.new("cam", cam_data)
scn.collection.objects.link(cam)
cam.location = center + Vector((0, -10, 1.2))
cam.rotation_euler = (math.radians(83), 0, 0)
scn.camera = cam
for name, rot, energy in (("key", (math.radians(50), 0, math.radians(-30)), 4.0), ("fill", (math.radians(60), 0, math.radians(40)), 1.6), ("rim", (math.radians(120), 0, math.radians(180)), 2.5)):
    ld = bpy.data.lights.new(name, "SUN"); ld.energy = energy
    lo_ = bpy.data.objects.new(name, ld); lo_.rotation_euler = rot
    scn.collection.objects.link(lo_)
scn.render.filepath = out
bpy.ops.render.render(write_still=True)
print("VISTA", out, len(objs))
