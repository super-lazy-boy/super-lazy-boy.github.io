"""Load the actual editable collectible assets for offline full-room QA only."""
import bpy,math
from mathutils import Matrix

def add_models(root,names=None):
    C=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
    placements={
        'monica-apartment':((-2.75,4.38,-3.75),math.pi/2),
        'millennium-falcon':((.25,.761,3.57),math.pi/2),
        'wish-willow':((4.85,1.455,-3.75),-.10),
        'zaizen-lighter':((-3.30,1.6907,.56),math.pi/2+.18)
    }
    for name,(position,yaw) in placements.items():
        if names is not None and name not in names:continue
        path=root/'design/collectibles'/(name+'.blend')
        if not path.exists():continue
        with bpy.data.libraries.load(str(path),link=False) as (source,target):target.objects=source.objects
        transform=C@Matrix.Translation(position)@Matrix.Rotation(yaw,4,'Y')@Matrix.Scale(1/.45,4)@C.inverted()
        for obj in target.objects:
            if obj and obj.type=='MESH':bpy.context.collection.objects.link(obj);obj.matrix_world=transform@obj.matrix_world
