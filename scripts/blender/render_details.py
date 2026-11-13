"""Additional offline visual QA of the actual native source, not browser captures."""
import bpy,sys
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[2]
def xyz(p):return Vector((p[0],-p[2],p[1]))
bpy.ops.wm.open_mainfile(filepath=str(root/'design/sunlit-room.blend'))
for mode in ('day','night'):
    bpy.ops.wm.open_mainfile(filepath=str(root/'design/sunlit-room.blend'))
    scene=bpy.context.scene;scene.cycles.samples=24;scene.cycles.max_bounces=6
    sys.path.insert(0,str(root/'scripts/blender'))
    from preview_collectibles import add_models
    add_models(root)
    if '--records' in sys.argv:
        sys.path.insert(0,str(root/'scripts/blender'))
        from preview_records import add_records
        add_records(root)
    scene.render.resolution_x=1280;scene.render.resolution_y=960
    if mode=='night':
        for obj in scene.objects:
            if obj.type=='LIGHT':obj.data.energy=obj.data.get('night_energy',0)
            group=obj.get('asset_group','')
            if group in ('curtain left','curtain right'):
                pivot=-2.125 if group=='curtain left' else 3.325
                for v in obj.data.vertices:v.co.y=-(pivot+(-v.co.y-pivot)*4.7)
        scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.035
        for node in scene.world.node_tree.nodes:
            if node.type=='BACKGROUND' and node.name!='Background':node.inputs['Color'].default_value=(0,0,0,1)
        mat=bpy.data.materials.get('Warm lamp diffuser')
        if mat:mat.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=.65
    for name,position,target,scale in [
        ('overview',(13,10,15),(-.3,1.6,.3),20),
        ('desk',(.1,4.5,3.0),(-3.35,1.9,-.6),5.9),
        ('lounge',(6.9,4.1,-1.8),(3.1,.8,.75),5.6),
    ]:
        camera=scene.camera;camera.location=xyz(position);camera.rotation_euler=(xyz(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=scale
        scene.render.filepath=str(root/('work/qa/v4-'+mode+'-'+name+'.png'));bpy.ops.render.render(write_still=True)
