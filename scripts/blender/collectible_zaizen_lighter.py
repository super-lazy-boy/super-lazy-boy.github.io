"""Editable platinum/diamond lighter study based on the supplied White Tower stills.

The closed lighter lies face-up in Y-up metres. A five-row, U-shaped jewelled
cuff has 25 front, 25 reverse and 10 edge stones; the opposite edge holds the
long ignition roller. Native parts remain separate; web geometry is batched.
"""
import math
import bpy,bmesh
from mathutils import Vector
from collectible_builder import Builder,xyz


def build():
    b=Builder('zaizen-lighter')
    platinum=b.material('Mirror platinum case','#d7dadd',.145,1)
    bevel=b.material('Polished platinum bevels','#e3e5e7',.105,1)
    satin=b.material('Machined platinum roller','#b9bec2',.25,1)
    recess=b.material('Recessed metal and hinge gaps','#42494e',.32,.95)
    seat=b.material('Recessed diamond seats','#8b9298',.21,1)
    diamond=b.material('Clear brilliant-cut diamonds','#f8fbff',.045,0)
    shader=diamond.node_tree.nodes.get('Principled BSDF')
    shader.inputs['IOR'].default_value=2.417
    shader.inputs['Transmission Weight'].default_value=.82
    shader.inputs['Coat Weight'].default_value=.18
    shader.inputs['Coat Roughness'].default_value=.025

    # h is the long upright dimension; d points out of the broad front face.
    def p(u,h,d=0):return (u,.005+d,.031-h)

    def rounded(name,center,size,material,r=.0006):
        """Six-segment edge radii and analytical normals keep mirror faces planar."""
        sx,sy,sz=size;key=('lighter round',size,r,material.name)
        if key not in b.cache:
            bm=bmesh.new();bmesh.ops.create_cube(bm,size=1)
            for v in bm.verts:v.co.x*=sx;v.co.y*=sz;v.co.z*=sy
            bmesh.ops.bevel(bm,geom=list(bm.edges),offset=r,segments=6,affect='EDGES',profile=.5)
            bm.normal_update();data=bpy.data.meshes.new(name);bm.to_mesh(data);bm.free();data.update()
            dims=(sx,sz,sy);normals=[]
            for v in data.vertices:
                core=Vector(tuple(max(-dims[i]/2+r,min(dims[i]/2-r,v.co[i])) for i in range(3)))
                normals.append(tuple((v.co-core).normalized()))
            for face in data.polygons:face.use_smooth=True
            data.normals_split_custom_set_from_vertices(normals)
            uv=data.uv_layers.new()
            for face in data.polygons:
                axis=max(range(3),key=lambda i:abs(face.normal[i]));axes=[i for i in range(3) if i!=axis]
                for i in face.loop_indices:
                    co=data.vertices[data.loops[i].vertex_index].co;uv.data[i].uv=tuple(co[a]/dims[a]+.5 for a in axes)
            b.cache[key]=data
        return b.instance(name,b.cache[key],material,center)

    def cut(target,cutter,label):
        target.data=target.data.copy();bpy.context.view_layer.objects.active=target
        modifier=target.modifiers.new(label,'BOOLEAN');modifier.operation='DIFFERENCE';modifier.solver='EXACT';modifier.object=cutter
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        b.objects.remove(cutter);bpy.data.objects.remove(cutter,do_unlink=True)

    body=rounded('Lower platinum case',p(0,.02365),( .0366,.010,.0473),platinum,.00082)
    cap=rounded('Separate closed flip cap',p(0,.05484),(.0366,.010,.01432),platinum,.0008)
    body['assembly']='case';cap['assembly']='flip cap'
    # An actual pocket, not a dark line painted on top of an uncut shell.
    cutter=rounded('Ignition roller pocket cutter',p(.01418,.0347,.00505),(.0048,.0040,.0255),recess,.00055)
    cut(body,cutter,'Real recessed ignition channel')
    rounded('Dark channel floor',p(.01418,.0347,.00315),(.0038,.00016,.0237),recess,.00007)
    for u in (.01181,.01655):
        rounded('Polished roller guide rail',p(u,.0348,.0051),(.00048,.00055,.0241),bevel,.00012)
    for h in (.02278,.04682):
        rounded('Roller channel end shoulder',p(.01418,h,.005),(.0049,.00055,.0007),bevel,.00016)

    # Fine, real longitudinal teeth with separate circular end collars.
    verts=[];faces=[];sides=144
    profile=[(-.0116,.00125),(-.0113,.00166),(-.0108,.00172),(.0108,.00172),(.0113,.00166),(.0116,.00125)]
    for j,(ax,radius) in enumerate(profile):
        for i in range(sides):
            a=i*math.tau/sides;r=radius*(1 if i%3 else .944)
            verts.append(p(.01418+math.cos(a)*r,.0348+ax,.00445+math.sin(a)*r))
            if j:k=j*sides+i;n=j*sides+(i+1)%sides;faces.append((k-sides,n-sides,n,k))
    faces.extend([tuple(reversed(range(sides))),tuple(range((len(profile)-1)*sides,len(profile)*sides))])
    roller=b.mesh('Knurled ignition roller with 48 fine teeth',verts,[tuple(reversed(face)) for face in faces],satin,smooth=True);roller['assembly']='ignition roller'
    for h in (.0232,.0240,.0456,.0464):
        b.ring('Roller machined collar',p(.01418,h,.00445),.00164,.00011,bevel,normal=(0,0,1),segments=48)

    # A visible, segmented hinge, with a small air seam between the knuckles.
    for i,d in enumerate((-.0035,0,.0035)):
        obj=b.cylinder('Alternating cap hinge knuckle '+str(i),p(-.0181,.04743,d),.00115,.00322,bevel,direction=(0,1,0),segments=40)
        obj['assembly']='flip cap' if i!=1 else 'case'
    b.cylinder('Hinge pin',p(-.0181,.04743),.00051,.0113,satin,direction=(0,1,0),segments=24)
    for d in (-.00574,.00574):
        b.cylinder('Inset hinge pin end',p(-.0181,.04743,d),.00068,.00012,recess,direction=(0,1,0),segments=24)
    # Thin edge reveals retain a true cap/body separation under close inspection.
    for d in (-.00499,.00499):
        b.tube('Cap seam reflection edge',[p(-.0168,.04735,d),p(.0108,.04735,d)],.000055,bevel,segments=6)

    def corner_loop(w,h,r,steps=4):
        points=[]
        for cx,cz,start in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
            for i in range(steps+1):
                a=math.radians(start+i*90/steps);points.append((cx+r*math.cos(a),cz+r*math.sin(a)))
        return points

    def mount(name,center,normal,across=(1,0,0)):
        """A solid, hollow square bezel with a lowered seat and separate brilliant."""
        c=Vector(center);n=Vector(normal);a=Vector(across);z=n.cross(a).normalized()
        def q(x,y,h):return tuple(c+a*x+z*y+n*h)
        rings=[(.00475,.00475,.00030,.00007),(.00498,.00498,.00038,.00034),
               (.00483,.00483,.00034,.00086),(.00423,.00423,.00023,.00102),
               (.00345,.00345,.00024,.00074),(.00315,.00315,.00025,.00019)]
        vv=[];ff=[]
        for j,(w,h,r,elevation) in enumerate(rings):
            loop=corner_loop(w,h,r)
            for x,y in loop:vv.append(q(x,y,elevation))
            if j:
                count=len(loop)
                for i in range(count):k=j*count+i;next=j*count+(i+1)%count;ff.append((k-count,next-count,next,k))
        count=len(loop)
        for i in range(count):ff.append((i,(len(rings)-1)*count+i,(len(rings)-1)*count+(i+1)%count,(i+1)%count))
        setting=b.mesh('Hollow square platinum bezel '+name,vv,ff,bevel);setting['assembly']='gem cuff'
        # A shallow recessed metal floor; the gem culet remains clear of it.
        b.mesh('Diamond pocket floor '+name,[q(-.0017,-.0017,.00013),q(.0017,-.0017,.00013),q(.0017,.0017,.00013),q(-.0017,.0017,.00013)],[(0,1,2,3)],seat)
        # A 57-facet-style round brilliant: octagonal table, star crown, girdle and pavilion.
        vv=[];ff=[]
        specs=[(8,.00068,.00120,math.pi/8),(16,.00106,.00102,0),(16,.00149,.00068,0),(16,.00149,.00059,0),(8,.00062,.00030,math.pi/8)]
        offsets=[]
        for count,r,h,phase in specs:
            offsets.append(len(vv))
            for i in range(count):theta=i*math.tau/count+phase;vv.append(q(math.cos(theta)*r,math.sin(theta)*r,h))
        ff.append(tuple(range(8)))
        # Mixed 8/16 rings form distinct, optically useful flat crown and pavilion facets.
        for j in range(len(specs)-1):
            na,nb=specs[j][0],specs[j+1][0];oa,ob=offsets[j],offsets[j+1]
            if na==nb:
                for i in range(na):ff.append((oa+i,ob+i,ob+(i+1)%nb,oa+(i+1)%na))
            elif nb==na*2:
                for i in range(na):ff.extend([(oa+i,ob+2*i,ob+(2*i+1)%nb),(oa+i,ob+(2*i+1)%nb,ob+(2*i+2)%nb,oa+(i+1)%na)])
            else:
                for i in range(nb):ff.extend([(oa+2*i,ob+i,oa+(2*i+1)%na),(oa+(2*i+1)%na,ob+i,ob+(i+1)%nb,oa+(2*i+2)%na)])
        tip=len(vv);vv.append(q(0,0,.00020))
        for i in range(8):ff.append((offsets[-1]+i,tip,offsets[-1]+(i+1)%8))
        gem=b.mesh('Brilliant-cut diamond '+name,vv,ff,diamond);gem['assembly']='diamonds';gem['diamond']=True
        # Small polished corner claws do not cross the table or its surrounding frame.
        for sx,sz in [(-1,-1),(1,-1),(1,1),(-1,1)]:
            b.tube('Tiny diamond retaining claw '+name,[q(sx*.00143,sz*.00143,.00061),q(sx*.00091,sz*.00091,.00083)],.000115,bevel,segments=6)

    # Twenty-five front and reverse stones; ten continue across the narrow left return.
    center_u=-.00445;center_h=.0304
    for side in (1,-1):
        rounded(('Front' if side==1 else 'Reverse')+' cuff backing',p(center_u,center_h,side*.00512),(.02625,.00022,.02625),platinum,.00010)
        for row in range(5):
            for col in range(5):
                u=center_u+(col-2)*.0052;h=center_h+(row-2)*.0052
                mount(('front' if side==1 else 'reverse')+' %02d'%(row*5+col),p(u,h,side*.00522),(0,side,0))
    rounded('Left return cuff backing',p(-.01845,center_h),(.0003,.0106,.02625),platinum,.00008)
    for row in range(5):
        for col in range(2):
            mount('edge %02d'%(row*2+col),p(-.01865,center_h+(row-2)*.0052,(col-.5)*.00515),(-1,0,0),(0,1,0))

    # Two recessed underside valves and coin slots, with real cutouts in the case.
    for i,u in enumerate((-.0105,.0105)):
        cutter=b.cylinder('Fuel/adjustment recess cutter',p(u,.00010),.00355,.00135,recess,direction=(0,0,1),segments=64)
        cut(body,cutter,'Underside circular valve recess '+str(i))
        b.cylinder('Dark valve well '+str(i),p(u,.00069),.00348,.00008,recess,direction=(0,0,1),segments=64)
        valve=b.cylinder(('Refill' if i==0 else 'Flame adjustment')+' slotted cap',p(u,.00043),.00312,.00040,satin,direction=(0,0,1),segments=64)
        slot=b.box('Coin slot cutter',p(u,.00023),(.00485,.00044,.00048),recess,.00004)
        cut(valve,slot,'Machined coin slot')
        b.ring('Recessed valve retaining lip',p(u,.00020),.00330,.000105,bevel,normal=(0,0,1),segments=64)
    # The base stamp is engraved in geometry, with no fictitious serial number.
    for text,y,size in [('S.T. Dupont',.0063,.00115),('PARIS',.00465,.00080),('60 DIAMANTS',.00325,.00065)]:
        curve=bpy.data.curves.new('Base stamp '+text,'FONT');curve.body=text;curve.align_x='CENTER';curve.align_y='CENTER';curve.size=size;curve.extrude=.00012;curve.resolution_u=3
        obj=bpy.data.objects.new('Base stamp cutter '+text,curve);bpy.context.collection.objects.link(obj);obj.location=xyz((0,y,.03093));obj.rotation_euler.x=math.pi/2
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj;bpy.ops.object.convert(target='MESH');obj=bpy.context.object;b.objects.append(obj)
        cut(body,obj,'Engraved base stamp '+text)

    # Boolean openings must not interpolate round-edge normals across a broad mirror face.
    data=body.data;data.update();dims=(.0366,.0473,.010);radius=.00082;normals=[]
    for face in data.polygons:
        face.use_smooth=True
        for index in face.loop_indices:
            co=data.vertices[data.loops[index].vertex_index].co
            core=Vector(tuple(max(-dims[i]/2+radius,min(dims[i]/2-radius,co[i])) for i in range(3)))
            delta=co-core;normal=face.normal.copy()
            if abs(delta.length-radius)<radius*.035 and delta.length and delta.normalized().dot(normal)>.5:normal=delta.normalized()
            normals.append(tuple(normal))
    data.normals_split_custom_set(normals)

    # Native inspection lighting; only the model's meshes are exported to the web.
    for name,position,power,size in [('Long platinum highlight',(-.045,.12,-.02),.34,.09),('Narrow edge highlight',(.055,.07,.04),.12,.06)]:
        light=bpy.data.lights.new(name,'AREA');light.energy=power;light.shape='RECTANGLE';light.size=size;light.size_y=size*.16
        obj=bpy.data.objects.new(name,light);bpy.context.collection.objects.link(obj);obj.location=xyz(position);obj.rotation_euler=(Vector(xyz((0,.005,0)))-obj.location).to_track_quat('-Z','Y').to_euler()
    b.camera_view=(-1.15,2.5,1.7)
    b.studio_world_color=(.65,.65,.65,1);b.studio_world_strength=.8
    b.layout_details={'basis':'Supplied White Tower stills and 60-diamond platinum reference; visual study, not an authentication claim',
        'reference':'https://www.ebay.com/itm/236289129352','diamondCount':60,'frontGrid':[5,5],'reverseGrid':[5,5],'edgeGrid':[2,5],
        'orientation':'Closed, broad jewelled face upward; length along Z; grounded in Y',
        'features':['separate radiused flip cap','real cap seam','segmented hinge and pin','recessed 48-tooth roller','hollow square bezels','flat brilliant facets','two recessed slotted valves','engraved base stamp']}
    b.finish((.037,.012,.062))


if __name__=='__main__':build()
