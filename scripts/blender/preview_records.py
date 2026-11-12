"""Offline-only proxies for React's dynamic books/tapes, never exported as assets.

The atlas is prepared in work/qa; these objects help compare physical paper under
day and night lighting. This is a native render aid, not browser validation.
"""
import bpy,math

def add_records(root):
    path=root/'work/qa/record-atlas.png'
    if not path.exists():return
    def material(name,hex):
        m=bpy.data.materials.new(name);m.use_nodes=True
        c=[int(hex[i:i+2],16)/255 for i in (1,3,5)];c=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c]
        p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=.82;return m
    palette=['#8f3f37','#2f3f52','#c8b07a','#5c6b52','#7b5a63','#d9cdb4','#3f4a44','#b98a5e','#8fa3a8']
    mats=[material('QA book cloth '+str(i),c) for i,c in enumerate(palette)];pages=material('QA paper','#e4dcc7');case=material('QA VHS shell','#343a3b')
    printed=material('QA lit printing','#ffffff');node=printed.node_tree.nodes.new('ShaderNodeTexImage');node.image=bpy.data.images.load(str(path));printed.node_tree.links.new(node.outputs['Color'],printed.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    batches={};spines=[];spineuv=[];faces=[]
    def block(p,s,mat):
        verts,polys=batches.setdefault(mat,([],[]));start=len(verts);x,y,z=p;a,b,c=[v/2 for v in s]
        verts.extend([(x+dx*a,y+dy*b,z+dz*c) for dx,dy,dz in [(-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)]])
        polys.extend([tuple(start+j for j in q) for q in [(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)]])
    def spine(slot,x,y,z,w,h):
        i=len(spines);spines.extend([(x-w/2,y-h/2,z),(x+w/2,y-h/2,z),(x+w/2,y+h/2,z),(x-w/2,y+h/2,z)]);faces.append((i,i+1,i+2,i+3))
        u=(slot%16)/16;v=1-(slot//16+1)/10
        spineuv.extend([(u,v),(u+1/16,v),(u+1/16,v+.1),(u,v+.1)])
    widths=[.17,.22,.14,.20,.27,.16,.23,.18,.26,.15,.19,.21,.16,.24,.18,.22,.14,.27]
    for i in range(90):
        row,col=divmod(i,18);start=0 if col<12 else 12
        x=-1.9+(-2.28 if col<12 else .81)+sum(widths[j]+.035 for j in range(start,col))+widths[col]/2;y=.20+row*.82;w=widths[col];h=.55+(i*13%9)*.016
        block((x,y+h/2,-3.732),(w-.022,h-.025,.40),pages)
        for side in (-1,1):block((x+side*(w/2-.006),y+h/2,-3.72),(.012,h,.46),mats[i%9])
        block((x,y+h/2,-3.502),(w,h,.025),mats[i%9]);spine(i,x,y+h/2,-3.487,w-.008,h-.01)
    for i in range(56):
        x=3.2-1.98+(i%28)*.146;y=.39+(i//28)*.62;block((x,y,-3.73),(.125,.48,.31),case);spine(90+i,x,y,-3.572,.114,.453)
    def make(name,verts,polys,mat,uv=None):
        data=bpy.data.meshes.new(name);data.from_pydata([(x,-z,y) for x,y,z in verts],[],polys);data.update();obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);data.materials.append(mat)
        if uv:
            layer=data.uv_layers.new()
            for loop in data.loops:layer.data[loop.index].uv=uv[loop.vertex_index]
    for mat,(verts,polys) in batches.items():make(mat.name,verts,polys,mat)
    make('QA lit record spines',spines,faces,printed,spineuv)
