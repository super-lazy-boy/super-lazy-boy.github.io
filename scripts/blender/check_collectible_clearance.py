"""Native-mesh checks for separate miniature furniture and the sofa drape.

Structural joinery and intentionally attached mechanical kit parts are excluded.
The room-level Node checks separately use the final deployed GLBs and movements.
"""
import bpy,json,hashlib,itertools
from pathlib import Path
from mathutils.bvhtree import BVHTree
ROOT=Path(__file__).resolve().parents[2]
path=ROOT/'design/collectibles/monica-apartment.blend';bpy.ops.wm.open_mainfile(filepath=str(path));bpy.context.view_layer.update()
def bvh(objects):
    vertices=[];faces=[];lo=[float('inf')]*3;hi=[-float('inf')]*3
    for obj in objects:
        offset=len(vertices);obj.data.calc_loop_triangles()
        for v in obj.data.vertices:
            q=obj.matrix_world@v.co;vertices.append(q)
            for i in range(3):lo[i]=min(lo[i],q[i]);hi[i]=max(hi[i],q[i])
        faces.extend([tuple(offset+i for i in t.vertices) for t in obj.data.loop_triangles])
    return BVHTree.FromPolygons(vertices,faces,all_triangles=True,epsilon=0),lo,hi,len(faces)
objects=[o for o in bpy.context.scene.objects if o.type=='MESH'];groups={}
for obj in objects:
    if obj.get('assembly'):groups.setdefault(obj['assembly'],[]).append(obj)
trees={name:bvh(items) for name,items in groups.items()};failures=[];pairs=0
def check(a,ta,b,tb):
    global pairs
    pairs+=1
    if any(ta[2][i]<tb[1][i] or tb[2][i]<ta[1][i] for i in range(3)):return
    hit=ta[0].overlap(tb[0])
    if hit:failures.append({'first':a,'second':b,'intersectingTrianglePairs':len(hit)})
for a,b in itertools.combinations(trees,2):check(a,trees[a],b,trees[b])
wallnames=('Lavender entrance wall','Angled brick kitchen wall','Brick range wall','Hall rear wall','Window low wall','Window head','Right window pier','Hall partition','Low front cut edge','Kitchen overhead oak beam','Kitchen beam post')
walls=bvh([o for o in objects if o.name.startswith(wallnames)])
for name,t in trees.items():
    if name=='angled kitchen' or name.startswith('Open shelf cup'):continue
    check(name,t,'architectural walls and beam',walls)
cloth=bvh([o for o in objects if o.name.startswith(('Red plaid throw','Throw hand-knotted fringe'))]);cushions=bvh([o for o in objects if o.name.startswith(('Separate filled sofa seat','Lofted sofa back cushion','Sofa padded rear frame','Sofa back cushion welt','Sofa upholstered lower frame','Sofa soft rolled arm','Seat cushion sewn welt'))]);check('red sofa drape',cloth,'sofa seat, back, arms and piping',cushions)
pillows=bvh([o for o in objects if o.name.startswith('Patchwork sofa pillow')]);check('loose sofa pillows',pillows,'sofa seat, back, arms and piping',cushions);check('loose sofa pillows',pillows,'red sofa drape',cloth)
falcon=ROOT/'design/collectibles/millennium-falcon.blend';bpy.ops.wm.open_mainfile(filepath=str(falcon));bpy.context.view_layer.update();objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
vents=bvh([o for o in objects if o.name.startswith(('Cooling chamber black floor','Cooling well machined liner','Cooling well outer edge','Individual recessed fan grille','Cooling rim bolt'))])
plumbing=bvh([o for o in objects if o.name.startswith(('Radial maintenance conduit','Short panel plumbing assembly','Panel pipe bracket','Conduit retaining clamp','Radial service equipment block','Hull service grille backing','Service grille fine louver'))])
check('Falcon deck plumbing and brackets',plumbing,'six cooling fan assemblies',vents)
report={'scope':'Separate miniature furniture, lamps, crockery and plants; architectural walls; sofa drape and pillows; Falcon deck plumbing versus cooling fans. Structural joinery and attached kit parts excluded.','nativeSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'falconNativeSha256':hashlib.sha256(falcon.read_bytes()).hexdigest(),'assemblies':len(trees),'checkedPairs':pairs,'failures':failures}
(ROOT/'work/qa/miniature-clearance.json').write_text(json.dumps(report,indent=2),encoding='utf8');print('MINIATURE_CLEARANCE',json.dumps(report),flush=True)
if failures:raise RuntimeError('Miniature intersections must be resolved before publishing')
