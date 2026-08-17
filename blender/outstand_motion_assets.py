"""OUTSTAND low-poly motion asset generator.

Run inside Blender 4.x with:
    blender -b --python blender/outstand_motion_assets.py

Exports small GLB assets designed for web use. The app intentionally uses a
procedural Three.js runtime version of the same visual language so the main
bundle does not depend on a large binary asset.
"""
import bpy
import math
import os
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "public", "motion")
os.makedirs(OUT, exist_ok=True)


def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def material(name, color, emission=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1.0)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color, 1.0)
    bsdf.inputs["Roughness"].default_value = 0.28
    if emission:
        bsdf.inputs["Emission Color"].default_value = (*color, 1.0)
        bsdf.inputs["Emission Strength"].default_value = emission
    return mat


def add_core():
    cyan = material("OUTSTAND_Cyan", (0.10, 0.75, 0.95), 2.0)
    ice = material("OUTSTAND_Ice", (0.75, 0.96, 1.0), 0.8)

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.72)
    core = bpy.context.object
    core.name = "OutstandCore"
    core.data.materials.append(cyan)
    bpy.ops.object.modifier_add(type="WIREFRAME")
    core.modifiers[-1].thickness = 0.012

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.33)
    inner = bpy.context.object
    inner.name = "OutstandInner"
    inner.data.materials.append(ice)

    for radius, rotation in ((1.05, (math.pi / 2.3, 0.2, 0)), (1.28, (0.4, 0.7, 0.2))):
        bpy.ops.mesh.primitive_torus_add(major_radius=radius, minor_radius=0.012, major_segments=64, minor_segments=5, rotation=rotation)
        ring = bpy.context.object
        ring.name = "OutstandOrbit"
        ring.data.materials.append(cyan)


def animate():
    core = bpy.data.objects.get("OutstandCore")
    inner = bpy.data.objects.get("OutstandInner")
    rings = [o for o in bpy.data.objects if o.name.startswith("OutstandOrbit")]
    fps = 30
    scene = bpy.context.scene
    scene.render.fps = fps
    scene.frame_start = 1
    scene.frame_end = 90

    if core:
        for frame, scale in ((1, 1.0), (45, 1.035), (90, 1.0)):
            core.scale = (scale, scale, scale)
            core.keyframe_insert("scale", frame=frame)
        core.rotation_euler = (0, 0, 0)
        core.keyframe_insert("rotation_euler", frame=1)
        core.rotation_euler.z = math.tau
        core.keyframe_insert("rotation_euler", frame=90)

    if inner:
        inner.rotation_euler = (0, 0, 0)
        inner.keyframe_insert("rotation_euler", frame=1)
        inner.rotation_euler.y = -math.tau
        inner.keyframe_insert("rotation_euler", frame=90)

    for index, ring in enumerate(rings):
        ring.rotation_euler.z += (math.tau if index == 0 else -math.tau)
        ring.keyframe_insert("rotation_euler", frame=90)
        ring.rotation_euler = (0, 0, 0)
        ring.keyframe_insert("rotation_euler", frame=1)

    if scene.animation_data and scene.animation_data.action:
        for fc in scene.animation_data.action.fcurves:
            for key in fc.keyframe_points:
                key.interpolation = "BEZIER"


def export(name):
    bpy.ops.object.select_all(action="SELECT")
    path = os.path.join(OUT, name)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        export_animations=True,
        export_materials="EXPORT",
        export_apply=True,
    )


clear()
add_core()
animate()
export("outstand-core.glb")
print("OUTSTAND motion asset exported to", os.path.join(OUT, "outstand-core.glb"))
