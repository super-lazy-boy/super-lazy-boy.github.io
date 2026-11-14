"""Native Blender verification using the same framing values as the web inspector.

Camera inputs are exported from lib/collectible-inspection.ts to work/qa.
These images check native geometry/framing, and are not browser screenshots.
"""
import bpy,bmesh,json,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]

def xyz(p):return Vector((p[0],-p[2],p[1]))

cases=json.loads((ROOT/'work/qa/inspection-framing.json').read_text())
report={'nativeFramingViews':[]}
for case in cases:
    bpy.ops.wm.open_mainfile(filepath=str(ROOT/'design/collectibles'/(case['id']+'.blend')))
    scene=bpy.context.scene
    if case['id']=='wish-willow':
        cage=next(o for o in scene.objects if o.get('assembly')=='hollow willow')
        bm=bmesh.new();bm.from_mesh(cage.data)
        assert all(e.is_manifold for e in bm.edges) and bm.calc_volume(signed=True)>0
        pending=set(bm.verts);components=0
        while pending:
            stack=[pending.pop()];components+=1
            while stack:
                for edge in stack.pop().link_edges:
                    for v in edge.verts:
                        if v in pending:pending.remove(v);stack.append(v)
        bm.free();assert components==1,'No detached wood fragments'
        assert cage['side_opening_count']==20 and cage['inserted_in_carton']
        assert not any('tray' in o.name.lower() or 'pull flap' in o.name.lower() for o in scene.objects)
        report['willow']={'closedWoodSkin':True,'oneConnectedBranch':True,'irregularSideOpenings':20,'insertedInCarton':True,'noPaperTray':True}
    camera=scene.camera;camera.data.type='PERSP';camera.data.sensor_fit='VERTICAL';camera.data.sensor_height=24
    camera.data.lens=12/math.tan(math.radians(case['fov']/2));camera.data.clip_start=.0001
    camera.location=xyz(case['camera']);camera.rotation_euler=(xyz(case['target'])-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.resolution_x=case['viewport'][0];scene.render.resolution_y=case['viewport'][1];scene.render.resolution_percentage=100
    scene.cycles.samples=40;scene.cycles.use_denoising=True
    name=case['id']+'-framed-'+str(case['viewport'][0])+'x'+str(case['viewport'][1])
    scene.render.filepath=str(ROOT/'work/qa'/(name+'.png'));bpy.ops.render.render(write_still=True)
    report['nativeFramingViews'].append(name)
(ROOT/'work/qa/inspection-native-check.json').write_text(json.dumps(report,indent=2))
print('INSPECTION_NATIVE_VERIFIED',json.dumps(report),flush=True)
