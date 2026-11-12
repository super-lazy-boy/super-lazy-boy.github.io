"""Additional offline visual QA of the actual native source, not browser captures."""
import bpy
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[2]
def xyz(p):return Vector((p[0],-p[2],p[1]))
bpy.ops.wm.open_mainfile(filepath=str(root/'design/sunlit-room.blend'))
scene=bpy.context.scene;scene.cycles.samples=24
scene.render.resolution_x=1280;scene.render.resolution_y=960
for name,position,target,scale in [
    ('final-overview',(13,10,15),(-.3,1.6,.3),20),
    ('desk-detail',(.1,4.3,3.3),(-3.35,1.9,.3),5.7),
    ('lounge-detail',(7.2,4.8,6.6),(3.1,.9,1.3),6.3),
]:
    camera=scene.camera;camera.location=xyz(position);camera.rotation_euler=(xyz(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=scale
    scene.render.filepath=str(root/('work/qa/'+name+'.png'));bpy.ops.render.render(write_still=True)
