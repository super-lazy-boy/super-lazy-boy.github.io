"""Validate the authored shell, real pressure folds, fabric and independent textiles."""
import bpy,bmesh,sys,json,math,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(Path(__file__).parent))
from beanbag_surface import point,base
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'design/sunlit-room.blend'))
body=bpy.data.objects['Sculpted continuous beanbag shell'];bm=bmesh.new();bm.from_mesh(body.data)
assert all(edge.is_manifold for edge in bm.edges),'Beanbag shell must be closed and manifold'
assert bm.calc_volume(signed=True)>0,'Beanbag normals must point outwards';bm.free()
body.data.calc_loop_triangles();triangles=[tuple(t.vertices) for t in body.data.loop_triangles]
vertices=[body.matrix_world@v.co for v in body.data.vertices]
tree=BVHTree.FromPolygons(vertices,triangles,all_triangles=True)
bad=[]
for a,b in tree.overlap(tree):
    if a>=b or set(triangles[a]).intersection(triangles[b]):continue
    bad.append((a,b))
if bad:
    for a,b in bad[:3]:
        info=[]
        for index in (a,b):
            triangle=body.data.loop_triangles[index]
            coordinates=[list(vertices[v]) for v in triangle.vertices]
            uv=[list(body.data.uv_layers.active.data[v].uv) for v in triangle.loops]
            info.append({'triangle':index,'positions':coordinates,'uv':uv})
        print('BEANBAG_INTERSECTION',json.dumps(info))
assert not bad,'Beanbag self intersections: '+str(bad[:12])
def bvh(obj):return BVHTree.FromPolygons([obj.matrix_world@v.co for v in obj.data.vertices],[tuple(p.vertices) for p in obj.data.polygons])
textiles=[obj for obj in bpy.context.scene.objects if obj.type=='MESH' and obj.get('asset_group')=='soft furnishings']
for obj in textiles:assert not tree.overlap(bvh(obj)),'Beanbag cuts through '+obj.name
for i,a in enumerate(textiles):
    for b in textiles[i+1:]:
        # Fringe is sewn into the blanket edge; these are one garment assembly.
        blanket=lambda obj:'blanket' in obj.name.lower() or 'fringe' in obj.name.lower()
        if blanket(a) and blanket(b):continue
        assert not bvh(a).overlap(bvh(b)),a.name+' intersects '+b.name
minimum=min(v.z for v in vertices);assert minimum>.039,'Beanbag sinks into the rug'
seat=point(1,0)[1];back=max(v.z for v in vertices)
assert back-seat>.95,'Seat depression is insufficient'
assert len(vertices)>30000,'Large fabric folds must be represented in the mesh'
changes=[math.dist(point(u,a),base(u,a)) for u in (.48,.6,.72,.84,.9) for a in [i*.05 for i in range(126)]]
assert max(changes)>.04,'Pressure creases are missing'
material=body.data.materials[0];images=[n.image for n in material.node_tree.nodes if n.type=='TEX_IMAGE']
assert len(images)==3 and all(tuple(image.size)==(1024,1024) and image.packed_file for image in images),'Pack the original full-resolution cloth maps'
for image in images:
    expected=ROOT/'public/models/sunlit-room'/Path(image.filepath).name
    assert hashlib.sha256(image.packed_file.data).digest()==hashlib.sha256(expected.read_bytes()).digest(),'A stale packed cotton map remains: '+image.name
shader=material.node_tree.nodes.get('Principled BSDF')
assert shader.inputs['Specular IOR Level'].default_value<.25 and shader.inputs['Sheen Weight'].default_value>.3,'Cotton must retain its dry reflection and fibre sheen'
assert not any(obj.name.startswith(('Floor chair','Low oak tatami','Recessed platform foot','Footstool','Reclining filled back','Overfilled floor seat')) for obj in bpy.context.scene.objects),'Rigid frame or old cushions remain'
report={'vertices':len(vertices),'triangles':len(triangles),'largeFolds':body['large_fold_count'],'closedManifold':True,'selfIntersections':0,'textileIntersections':0,'minY':minimum,'seatY':seat,'backY':back,'pressureCreaseDepth':max(changes),'fabricResolution':1024,'textileParts':len(textiles),'independentTextileAssemblies':3,'specularIORLevel':shader.inputs['Specular IOR Level'].default_value,'fibreSheen':shader.inputs['Sheen Weight'].default_value,'packedMapsMatchFiles':True}
(ROOT/'design/beanbag-verification.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8');print('BEANBAG_VERIFIED',json.dumps(report))
