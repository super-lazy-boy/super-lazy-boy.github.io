"""Check native geometry/contact and render the actual assets for offline visual QA."""
import bpy,bmesh,json,sys,math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts/blender'))
from collectible_builder import xyz
from preview_collectibles import add_models

report={}
def load(name):
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/'design/collectibles'/(name+'.blend')))
    return [o for o in bpy.context.scene.objects if o.type=='MESH']
def closed(obj):
    bm=bmesh.new();bm.from_mesh(obj.data)
    assert all(e.is_manifold for e in bm.edges),obj.name+' open edge'
    assert bm.calc_volume(signed=True)>0,obj.name+' reversed normals'
    count=0;todo=set(bm.verts)
    while todo:
        stack=[todo.pop()];count+=1
        while stack:
            v=stack.pop()
            for edge in v.link_edges:
                w=edge.other_vert(v)
                if w in todo:todo.remove(w);stack.append(w)
    bm.free();return count
def render(name,position,target,scale):
    scene=bpy.context.scene;scene.cycles.samples=40;scene.cycles.use_denoising=True
    scene.render.resolution_x=1440;scene.render.resolution_y=1000
    camera=scene.camera;camera.data.clip_start=.0001;camera.data.type='ORTHO';camera.data.ortho_scale=scale
    camera.location=xyz(position);camera.rotation_euler=(Vector(xyz(target))-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=str(ROOT/'work/qa'/(name+'.png'));bpy.ops.render.render(write_still=True)

objects=load('anduril')
for prefix in ('Full-length Anduril','Sculpted Anduril crossguard','Pierced leaf-shaped pommel'):
    obj=next(o for o in objects if o.name.startswith(prefix));assert closed(obj)==1
assert all(o.get('display_support') for o in objects if o.name.startswith('Display'))
report['anduril']={'closedBladeGuardPommel':True,'displaySupportParts':sum(bool(o.get('display_support')) for o in objects)}
render('anduril-hilt',(.12,1.15,.80),(0,1.09,0),.49)

objects=load('elder-wand');wand=next(o for o in objects if o.name.startswith('Continuous pitted'))
assert closed(wand)==1 and wand['knot_count']==6
depsgraph=bpy.context.evaluated_depsgraph_get()
tree=BVHTree.FromObject(wand,depsgraph)
contacts=[]
for x in (-.133,.132):
    t=x/.381+.5;z=.0014*math.sin(t*8.2)
    # Native local mesh is authored in Blender axes; compare the wood underside
    # with the felt top along the same vertical line, including the saved transform.
    origin=Vector(xyz((x,0,z)));wood=tree.ray_cast(origin,Vector((0,0,1)))[0]
    lining=next(o for o in objects if o.name.startswith('Display soft cradle') and abs(o.data.vertices[0].co.x-x)<.001)
    felt=BVHTree.FromObject(lining,depsgraph).ray_cast(origin+Vector((0,0,.1)),Vector((0,0,-1)))[0]
    assert wood is not None and felt is not None
    gap=wood.z-felt.z;assert -.00035<gap<.00035,('wand cradle contact',gap)
    contacts.append(gap)
report['elder-wand']={'closedSkin':True,'sixKnots':True,'cradleGapsMetres':contacts}
render('elder-wand-detail',(-.10,.18,.33),(-.077,.053,0),.20)

objects=load('wish-willow');cage=next(o for o in objects if o.get('assembly')=='hollow willow')
assert closed(cage)==1
report['wish-willow']={'closedWoodSkin':True,'oneConnectedHollowBranch':True,'windowRows':cage['large_window_rows']}
(ROOT/'work/qa/fantasy-native-check.json').write_text(json.dumps(report,indent=2))
print('FANTASY_NATIVE_VERIFIED',json.dumps(report),flush=True)
if '--geometry-only' in sys.argv:sys.exit(0)

bpy.ops.wm.open_mainfile(filepath=str(ROOT/'design/sunlit-room.blend'))
add_models(ROOT)
from preview_records import add_records
add_records(ROOT)
scene=bpy.context.scene;scene.cycles.max_bounces=8
render('fantasy-room-day',(11,7,10),(2.3,2.8,-3.65),9.8)
for obj in scene.objects:
    if obj.type=='LIGHT':obj.data.energy=obj.data.get('night_energy',0)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.035
for node in scene.world.node_tree.nodes:
    if node.type=='BACKGROUND' and node.name!='Background':node.inputs['Color'].default_value=(0,0,0,1)
mat=bpy.data.materials.get('Warm lamp diffuser')
if mat:mat.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=.65
render('fantasy-room-night',(11,7,10),(2.3,2.8,-3.65),9.8)
