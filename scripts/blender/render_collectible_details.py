"""Offline inspection of the real native meshes from multiple useful angles."""
import bpy,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
def xyz(p):return Vector((p[0],-p[2],p[1]))
shots={
 'monica-apartment':[
    ('kitchen',(.32,.32,.47),(-.113,.072,-.069),.305),
    ('living',(.46,.29,.36),(.095,.040,.043),.30),
    ('rear',(-.57,.46,-.65),(0,.052,0),.69)],
 'millennium-falcon':[
    ('top',(0,1.5,.001),(0,.08,0),1.08),
    ('aft',(-.91,.73,-1.05),(0,.09,0),1.25),
    ('detail',(.70,.46,.86),(.075,.13,.10),.60),
    ('underside',(.8,-.85,1.05),(0,.07,0),1.19)],
 'wish-willow':[
    ('reverse',(-.35,.25,-.5),(0,.025,0),.40),
    ('end',(.32,.13,.20),(.069,.025,0),.24)]}
for name,views in shots.items():
 if '--only' in sys.argv and name not in sys.argv[sys.argv.index('--only')+1:]:continue
 bpy.ops.wm.open_mainfile(filepath=str(ROOT/'design/collectibles'/(name+'.blend')));scene=bpy.context.scene;scene.cycles.samples=32;scene.render.resolution_x=1440;scene.render.resolution_y=1080
 for title,p,target,scale in views:
    cam=scene.camera;cam.location=xyz(p);cam.rotation_euler=(xyz(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=scale
    scene.render.filepath=str(ROOT/('work/qa/v5-'+name+'-'+title+'.png'));bpy.ops.render.render(write_still=True)
