"""Update only the editable room seat; verify the rest of the native room is unchanged."""
import bpy,sys,json,hashlib,struct,array
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(Path(__file__).parent))
from beanbag_surface import replaced
from floor_lounge import build
OUT=ROOT/'public/models/sunlit-room';QA=ROOT/'work/qa';QA.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'design/sunlit-room.blend'))
layout=json.loads((OUT/'layout.json').read_text(encoding='utf-8'))

def fixed_digest():
    result={}
    for obj in bpy.context.scene.objects:
        if obj.type!='MESH' or replaced(obj):continue
        h=hashlib.sha256();h.update(struct.pack('16d',*(v for row in obj.matrix_world for v in row)))
        for collection,key,length,kind in [(obj.data.vertices,'co',3,'f'),(obj.data.loops,'vertex_index',1,'i')]:
            values=array.array(kind,[0])*(len(collection)*length);collection.foreach_get(key,values);h.update(values.tobytes())
        for layer in obj.data.uv_layers:
            values=array.array('f',[0])*(len(layer.data)*2);layer.data.foreach_get('uv',values);h.update(values.tobytes())
        h.update('|'.join(m.name for m in obj.data.materials).encode());result[obj.name]=h.hexdigest()
    return result
before=fixed_digest();category='lounge'
def xyz(p):return (p[0],-p[2],p[1])
def asset(name):
    global category;category=name
def tag(obj,name,mat):obj.name=name;obj.data.materials.append(mat);obj['asset_group']=category;return obj
def tube(name,points,r,mat):
    data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=1;data.bevel_depth=r;data.bevel_resolution=2
    spline=data.splines.new('POLY');spline.points.add(len(points)-1)
    for item,p in zip(spline.points,points):item.co=(*xyz(p),1)
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);return tag(obj,name,mat)
body=build({'xyz':xyz,'tag':tag,'asset':asset,'tube':tube,'bounds':layout['obstacles']})
assert before==fixed_digest(),'Furniture outside the requested lounge changed'
for obj in list(bpy.context.scene.objects):
    if not replaced(obj):continue
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
    if obj.type=='CURVE':bpy.ops.object.convert(target='MESH')
    elif obj.type=='MESH':
        for mod in list(obj.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.context.view_layer.update();components=[]
for obj in bpy.context.scene.objects:
    if obj.type!='MESH':continue
    corners=[obj.matrix_world@Vector(p) for p in obj.bound_box];corners=[(p.x,p.z,-p.y) for p in corners]
    components.append({'name':obj.name,'group':obj.get('asset_group',''),'min':[round(min(p[a] for p in corners),6) for a in range(3)],'max':[round(max(p[a] for p in corners),6) for a in range(3)]})
layout.update(version='sunlit-room-5-beanbag',components=components,sourceObjectCount=len(bpy.context.scene.objects))
layout['lounge']={'construction':'one closed weighted cotton shell','reference':'2026-11-15 user beanbag photograph','body':'Sculpted continuous beanbag shell','seatDepression':True,'rigidFrame':False,'clothMaps':1024,'largeFolds':48,'finish':'dry woven cotton, slub yarns and double topstitching'}
(OUT/'layout.json').write_text(json.dumps(layout,indent=2)+'\n',encoding='utf-8')
(QA/'beanbag-preserved-room.json').write_text(json.dumps({'unchangedObjects':len(before),'before':before,'after':fixed_digest()},indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'design/sunlit-room.blend'))
groups={}
for obj in bpy.context.scene.objects:
    if obj.type=='MESH':groups.setdefault((obj.get('asset_group','room'),obj.data.materials[0].name),[]).append(obj)
for (group,material),objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1:bpy.ops.object.join()
    obj=bpy.context.object;obj.name=group+' | '+material;bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if obj.type=='MESH':obj.select_set(True)
candidate=QA/'beanbag-candidate.glb'
bpy.ops.export_scene.gltf(filepath=str(candidate),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_texcoords=True,export_normals=True,export_extras=True,export_cameras=False,export_lights=False)
print('BEANBAG_EXPORT_READY',json.dumps({'unchangedObjects':len(before),'parts':layout['sourceObjectCount'],'groups':len(groups),'candidate':str(candidate),'bytes':candidate.stat().st_size}))
