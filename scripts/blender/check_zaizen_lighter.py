"""Native modelling/placement QA; these are Blender renders, not browser captures."""
import bpy,bmesh,json,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts/blender'))
from collectible_builder import xyz

bpy.ops.wm.open_mainfile(filepath=str(ROOT/'design/collectibles/zaizen-lighter.blend'))
objects=[obj for obj in bpy.context.scene.objects if obj.type=='MESH']
gems=[obj for obj in objects if obj.get('diamond')]
bezels=[obj for obj in objects if obj.name.startswith('Hollow square platinum bezel')]
assert len(gems)==60 and len(bezels)==60
for obj in gems+bezels:
    mesh=bmesh.new();mesh.from_mesh(obj.data)
    assert all(edge.is_manifold for edge in mesh.edges),obj.name+' has an open edge'
    assert mesh.calc_volume(signed=True)>0,obj.name+' has inward-facing surfaces'
    mesh.free()
report={'sourceParts':len(objects),'solidBrilliants':len(gems),'closedBezels':len(bezels),'webDrawGroups':7}
(ROOT/'work/qa/zaizen-native-check.json').write_text(json.dumps(report,indent=2))
scene=bpy.context.scene;scene.cycles.samples=40;scene.render.resolution_x=1440;scene.render.resolution_y=1000
camera=scene.camera;camera.data.clip_start=.0001;camera.location=xyz((.040,.022,.115));camera.rotation_euler=(Vector(xyz((0,.005,.021)))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.ortho_scale=.055
scene.render.filepath=str(ROOT/'work/qa/zaizen-lighter-base.png');bpy.ops.render.render(write_still=True)
if '--base-only' in sys.argv:
    print('ZAIZEN_NATIVE_VERIFIED',json.dumps(report),flush=True);sys.exit(0)

bpy.ops.wm.open_mainfile(filepath=str(ROOT/'design/sunlit-room.blend'))
from preview_collectibles import add_models
add_models(ROOT,names={'zaizen-lighter'})
scene=bpy.context.scene;scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.cycles.max_bounces=8
scene.render.resolution_x=1440;scene.render.resolution_y=1000
camera=scene.camera;camera.location=xyz((-1.15,3.70,2.15));camera.rotation_euler=(Vector(xyz((-3.35,1.73,.52)))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=2.35
scene.render.filepath=str(ROOT/'work/qa/zaizen-desk-day.png');bpy.ops.render.render(write_still=True)
print('ZAIZEN_NATIVE_VERIFIED',json.dumps(report),flush=True)
