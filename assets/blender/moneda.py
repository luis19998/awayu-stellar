# Convierte la moneda modelada en Fusion 360 (assets/fusion/moneda.stl, en cm)
# en un GLB dorado listo para la web (web/public/models/moneda.glb).
#   blender --background --factory-startup --python assets/blender/moneda.py
import bpy, os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC = os.path.join(ROOT, "assets", "fusion", "moneda.stl")
OUT = os.path.join(ROOT, "web", "public", "models", "moneda.glb")

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.stl_import(filepath=SRC)
coin = bpy.context.selected_objects[0]
coin.name = "Moneda"
# Fusion exporta en cm: radio 1.6 cm -> normalizamos a radio 1 (la web escala)
dims = coin.dimensions
s = 2.0 / max(dims.x, dims.y)
coin.scale = (s, s, s)
bpy.ops.object.transform_apply(scale=True)
bpy.ops.object.origin_set(type="ORIGIN_GEOMETRY", center="BOUNDS")
coin.location = (0, 0, 0)
dec = coin.modifiers.new("simplificar", "DECIMATE")
dec.ratio = 0.5
bpy.ops.object.modifier_apply(modifier=dec.name)
bpy.ops.object.shade_auto_smooth(angle=0.6) if hasattr(bpy.ops.object, "shade_auto_smooth") else bpy.ops.object.shade_smooth()

m = bpy.data.materials.new("oro")
m.use_nodes = True
b = m.node_tree.nodes["Principled BSDF"]
b.inputs["Base Color"].default_value = (1.0, 0.62, 0.12, 1)
b.inputs["Metallic"].default_value = 1.0
b.inputs["Roughness"].default_value = 0.28
coin.data.materials.append(m)

bpy.ops.object.select_all(action="DESELECT")
coin.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_apply=True)
print("RESULT", OUT, len(coin.data.polygons), tuple(round(x, 3) for x in coin.dimensions))
