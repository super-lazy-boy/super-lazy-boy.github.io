"""Native Blender visual checks of the actual updated source, never browser captures."""
import bpy,sys,math
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
def xyz(p):return Vector((p[0],-p[2],p[1]))
mode=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'bare'
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'design/sunlit-room.blend'))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.max_bounces=5;scene.cycles.use_denoising=True
scene.render.resolution_x=1100;scene.render.resolution_y=950;scene.render.resolution_percentage=100
if mode=='bare':
    for obj in scene.objects:obj.hide_render=not obj.name.startswith(('Sculpted continuous beanbag shell','Cotton double topstitch','Concealed rear fabric zip'))
    material=bpy.data.materials.new('QA ground only');material.diffuse_color=(.72,.70,.67,1)
    bpy.ops.mesh.primitive_plane_add(size=200,location=xyz((3,.034,.79)));floor=bpy.context.object;floor.data.materials.append(material)
    for name,position,energy,size in [('large window',(-.6,5.4,-1.8),560,4),('fill',(6,4,4),190,3),('edge',(.7,3.8,3),240,2)]:
        light=bpy.data.lights.new('QA '+name,'AREA');light.energy=energy;light.shape='DISK';light.size=size
        obj=bpy.data.objects.new('QA '+name,light);scene.collection.objects.link(obj);obj.location=xyz(position);obj.rotation_euler=(xyz((3,.7,.79))-obj.location).to_track_quat('-Z','Y').to_euler()
    position,target,scale=(6.3,2.65,-3.9),(3,.81,.79),2.9
else:
    sys.path.insert(0,str(ROOT/'scripts/blender'))
    from preview_collectibles import add_models
    from preview_records import add_records
    add_models(ROOT);add_records(ROOT)
    position,target,scale=(7.3,4.6,-2.0),(3.08,.82,.65),4.7
    if mode=='night':
        for obj in scene.objects:
            if obj.type=='LIGHT':obj.data.energy=obj.data.get('night_energy',0)
        scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.035
        for node in scene.world.node_tree.nodes:
            if node.type=='BACKGROUND' and node.name!='Background':node.inputs['Color'].default_value=(0,0,0,1)
        bpy.data.materials['Warm lamp diffuser'].node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=.65
camera=scene.camera;camera.hide_render=False;camera.location=xyz(position);camera.rotation_euler=(xyz(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=scale
scene.render.filepath=str(ROOT/'work/qa'/('beanbag-'+mode+'.png'));bpy.ops.render.render(write_still=True)
print('BEANBAG_RENDER_READY',mode,scene.render.filepath)
