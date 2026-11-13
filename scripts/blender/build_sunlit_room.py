"""Reproducible, original Blender assets. Run with Blender --background --python.

All authored dimensions are website world coordinates (Y up). The conversion
below makes the exported glTF agree exactly with interactive book/tape anchors.
No downloaded furniture, external generators, or API keys are used.
"""
import bpy, math, random, json, sys
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'public/models/sunlit-room'
SOURCE = ROOT / 'design'
QA = ROOT / 'work/qa'
for directory in (OUT, SOURCE, QA): directory.mkdir(parents=True, exist_ok=True)
random.seed(24)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for data in list(bpy.data.materials): bpy.data.materials.remove(data)

def xyz(p): return (p[0], -p[2], p[1])
materials = {}
def material(name, color, rough=.5, metal=0, texture=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    bs = m.node_tree.nodes.get('Principled BSDF')
    c = tuple(int(color[i:i+2],16)/255 for i in (1,3,5))
    # Blender shader inputs are linear; glTF export preserves this conversion.
    c = tuple(v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in c)
    bs.inputs['Base Color'].default_value = (*c,1)
    bs.inputs['Roughness'].default_value = rough
    bs.inputs['Metallic'].default_value = metal
    if texture:
        n=m.node_tree.nodes.new('ShaderNodeTexImage'); n.image=bpy.data.images.load(str(OUT/texture)); n.image.pack()
        m.node_tree.links.new(n.outputs['Color'],bs.inputs['Base Color'])
        normal_path=OUT/texture.replace('.png','-normal.png')
        if normal_path.exists():
            t=m.node_tree.nodes.new('ShaderNodeTexImage'); t.image=bpy.data.images.load(str(normal_path));t.image.colorspace_settings.name='Non-Color';t.image.pack()
            normal=m.node_tree.nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.28
            m.node_tree.links.new(t.outputs['Color'],normal.inputs['Color']);m.node_tree.links.new(normal.outputs['Normal'],bs.inputs['Normal'])
    materials[name]=m
    return m

white=material('Porcelain white lacquer','#f5f3ee',.28)
ivory=material('Warm white powder coat','#e9e7df',.48)
wall=material('Fine mineral plaster','#f2efe8',.88)
edge=material('Ivory edge and piping','#d8d5cb',.65)
oak=material('Quarter sawn pale oak','#c8ae88',.48,texture='oak.png')
linen=material('Ivory woven upholstery','#ede9df',.91,texture='linen.png')
rugmat=material('Natural woven wool','#d8d0bd',.97,texture='wool.png')
sage=material('Muted sage cushion','#a3ad9b',.94)
ochre=material('Flax cushion','#c9b895',.9)
ink=material('Graphite ABS','#343a3c',.38)
rubber=material('Soft black rubber','#202627',.85)
silver=material('Brushed aluminium','#a3aba9',.27,.8)
brass=material('Satin nickel fittings','#c2b99f',.32,.68)
paper=material('Uncoated warm paper','#e9e4d7',.94)
green=material('Leaf green','#526b42',.62)
lightgreen=material('New leaf green','#7d905c',.58)
vein=material('Leaf vein','#879262',.8)
soil=material('Potting soil','#494134',1)
coffee=material('Coffee','#453427',.27)
lens=material('Optical blue lens','#294957',.12,.36)
legends=material('Keycap printing','#f5f3ee',.6,texture='keyboard.png')
terracotta=material('Clay accent','#b9876f',.82)

category='architecture'
inventory=[]; bounds=[]
def tag(obj,name,mat):
    obj.name=name; obj.data.materials.append(mat)
    obj['asset_group']=category
    return obj
def box(name,p,s,mat=white,r=.012,yaw=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz(p))
    o=bpy.context.object;o.dimensions=(s[0],s[2],s[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.rotation_euler.z=yaw
    if r:
        mod=o.modifiers.new('Machined edge radius','BEVEL');mod.width=min(r,min(s)*.45);mod.segments=3
        mod=o.modifiers.new('Face weighted normals','WEIGHTED_NORMAL')
    return tag(o,name,mat)
def cylinder(name,p,r,h,mat=white,r2=None,direction=(0,1,0),segments=40):
    bpy.ops.mesh.primitive_cone_add(vertices=segments,radius1=r if r2 is None else r2,radius2=r,depth=h,location=xyz(p))
    o=bpy.context.object;o.rotation_euler=Vector(xyz(direction)).to_track_quat('Z','Y').to_euler()
    for f in o.data.polygons:f.use_smooth=len(f.vertices)==4
    bevel=o.modifiers.new('Turned lip','BEVEL');bevel.width=min(.006,r*.12,h*.15);bevel.segments=2
    o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return tag(o,name,mat)
def sphere(name,p,s,mat=white):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=1,location=xyz(p))
    o=bpy.context.object;o.scale=(s[0],s[2],s[1])
    for f in o.data.polygons:f.use_smooth=True
    return tag(o,name,mat)
def tube(name,pts,r,mat=white):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=10;c.bevel_depth=r;c.bevel_resolution=2
    poly=c.splines.new('BEZIER');poly.bezier_points.add(len(pts)-1)
    for b,p in zip(poly.bezier_points,pts):b.co=xyz(p);b.handle_left_type=b.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);return tag(o,name,mat)
def ring(name,p,r,t,mat=white,direction=(0,1,0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=40,minor_segments=8,location=xyz(p),major_radius=r,minor_radius=t)
    o=bpy.context.object;o.rotation_euler=Vector(xyz(direction)).to_track_quat('Z','Y').to_euler()
    for f in o.data.polygons:f.use_smooth=True
    return tag(o,name,mat)
def register(name,lo,hi):
    bounds.append({'name':name,'min':lo,'max':hi})
def asset(name):
    global category
    category=name;inventory.append(name)

# Finite, open-front room. Outside the shell is empty white, including the window.
asset('architecture')
box('Floating room foundation',(-.05,-.165,.5),(13.1,.26,9.8),ivory,.035)
box('Back plaster wall',(-.05,2.55,-4.33),(13.1,5.1,.16),wall,.008)
for y,h,z,d in [(0.70,1.4,.6,4.6),(4.75,.7,.6,4.6),(2.55,5.1,-3.0,2.6),(2.55,5.1,4.05,2.3)]:
    box('Window wall masonry',(-6.52,y,z),(.16,h,d),wall,.006)
box('Back skirting',(-.05,.10,-4.222),(13.0,.20,.06),white,.012)
box('Left skirting',(-6.405,.1,.5),(.07,.20,9.6),white,.01)
for i,z in enumerate([-4.08+j*.34 for j in range(28)]):
    for j in range(7):
        left=-6.40+j*2.35-(i%3)*.70;right=left+2.345
        left=max(left,-6.40);right=min(right,6.40)
        if right>left:
            box('Oak floor plank',((left+right)/2,-.0175,z),(right-left,.035,.335),oak,.001)
register('back wall',[-6.60,0,-4.41],[6.50,5.1,-4.25])

asset('window')
for z in (-1.7,2.9):box('Window jamb',(-6.40,2.9,z),(.20,3.02,.105),white,.015)
for y in (1.4,4.4):box('Window header and sill',(-6.40,y,.6),(.24,.12,4.76),white,.014)
box('Deep window seat',(-6.23,1.34,.6),(.52,.10,4.85),oak,.025)
for z in (-.17,1.36):box('Window mullion',(-6.40,2.90,z),(.105,2.90,.065),white,.009)
box('Window transom',(-6.38,3.50,.6),(.10,.055,4.50),white,.009)
for z in (-.25,1.45):
    cylinder('Window handle rose',(-6.32,2.75,z),.038,.025,silver,direction=(1,0,0))
    box('Window lever',(-6.29,2.68,z),(.035,.16,.035),silver,.01)
cylinder('Curtain rod',(-6.06,4.65,.6),.022,5.25,brass,direction=(0,0,1))
for z in (-2.06,3.26):sphere('Curtain rod finial',(-6.06,4.65,z),(.045,.045,.045),brass)
# Open, opaque linen curtains: carefully spaced folds do not cross the window frame.
for side in (-1,1):
    asset('curtain left' if side<0 else 'curtain right')
    zbase=.6+side*2.45
    verts=[];faces=[]
    for row in range(33):
        y=1.52+row/32*3.05
        for col in range(41):
            u=col/40;z=zbase+(u-.5)*.55
            x=-6.02+math.sin(u*math.pi*8)*.067
            verts.append(xyz((x,y,z)))
            if row and col:
                a=row*41+col;faces.append((a-42,a-41,a,a-1))
    mesh=bpy.data.meshes.new('Woven drape');mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new('Open linen curtain',mesh);bpy.context.collection.objects.link(o);tag(o,o.name,linen)
    for f in mesh.polygons:f.use_smooth=True

# Desk local coordinates follow the existing rotated desk, including the screen.
asset('desk')
def dp(p):return (-3.50+p[2],p[1],-.60-p[0])
def db(name,p,s,mat=white,r=.012):return box(name,dp(p),(s[2],s[1],s[0]),mat,r)
def dc(name,p,r,h,mat=white,**kwargs):return cylinder(name,dp(p),r,h,mat,**kwargs)
db('White satin desktop',(0,1.63,0),(3.8,.12,1.55),white,.035)
db('Desktop underside reveal',(0,1.55,0),(3.64,.045,1.43),edge,.008)
for x in (-1.72,1.72):
    for z in (-.58,.58):
        db('Tapered white desk leg',(x,.78,z),(.075,1.52,.075),white,.009)
        dc('Adjustable rubber foot',(x,.025,z),.045,.05,rubber)
db('Desk cable tray',(0,1.40,-.55),(3.25,.12,.12),ivory,.018)
db('Felt desk mat',(.20,1.697,.3725),(2.50,.014,.575),sage,.02)
db('Monitor aluminium enclosure',(0,2.69,-.28),(2.28,1.38,.085),ivory,.035)
db('Monitor black gasket',(0,2.70,-.232),(2.19,1.26,.014),rubber,.015)
db('Monitor active panel',(0,2.70,-.222),(2.16,1.23,.005),ink,.004)
db('Monitor stand upright',(0,1.90,-.32),(.105,.40,.10),silver,.012)
db('Monitor stand foot',(0,1.715,-.25),(.65,.045,.42),silver,.02)
dc('Monitor status lamp',(1.03,2.075,-.221),.007,.006,sage,direction=(1,0,0))
db('Keyboard lower case',(-.15,1.742,.31),(1.26,.07,.43),ivory,.035)
key_verts=[];key_faces=[];key_uv=[]
for row in range(5):
    for col in range(15):
        if row==4 and 5<=col<=9:continue
        kx=-.71+col*.078;kz=.145+row*.075
        db('Double shot keycap',(kx,1.786,kz),(.068,.027,.061),white,.009)
        a=len(key_verts)
        for dx,dz,u,v in [(-.022,-.019,0,0),(.022,-.019,1,0),(.022,.019,1,1),(-.022,.019,0,1)]:
            key_verts.append(xyz(dp((kx+dx,1.8001,kz+dz))));key_uv.append(((col+u)/15,1-(row+v)/5))
        key_faces.append((a,a+3,a+2,a+1))
mesh=bpy.data.meshes.new('Keyboard printed glyphs');mesh.from_pydata(key_verts,[],key_faces);mesh.update();uv=mesh.uv_layers.new()
for loop in mesh.loops:uv.data[loop.index].uv=key_uv[loop.vertex_index]
o=bpy.data.objects.new('Keyboard printed legends',mesh);bpy.context.collection.objects.link(o);tag(o,o.name,legends)
db('Keyboard spacebar',(-.164,1.786,.445),(.38,.027,.055),white,.008)
sphere('Mouse shell',dp((.95,1.779,.30)),(.155,.073,.105),white)
db('Mouse split seam',(.95,1.84,.215),(.008,.004,.10),edge,.002)
dc('Mouse wheel',(.95,1.846,.205),.014,.047,rubber,direction=(0,0,1))
asset('computer tower')
db('Computer tower outer shell',(-1.34,.65,.08),(.60,1.18,.93),white,.035)
db('Tower recessed front',(-1.34,.65,.553),(.50,1.03,.018),ink,.012)
for y in (.39,.82):
    # Real recessed fan hubs, blades and a separate grille.
    dc('Tower fan rim',(-1.34,y,.569),.175,.016,silver,direction=(1,0,0))
    dc('Tower fan dark cavity',(-1.34,y,.579),.16,.010,rubber,direction=(1,0,0))
    dc('Tower fan hub',(-1.34,y,.588),.035,.008,silver,direction=(1,0,0))
    for i in range(7):
        a=i*math.tau/7
        db('Tower fan blade',(-1.34+math.cos(a)*.086,y+math.sin(a)*.086,.589),(.09,.027,.004),edge,.008)
    for i in range(7):db('Tower grille rail',(-1.34-.15+i*.05,y,.599),(.008,.34,.006),ivory,.002)
dc('Tower power button',(-1.12,1.16,.571),.022,.008,silver,direction=(1,0,0))
for x in (-1.48,-1.33):db('USB port',(x,1.16,.568),(.07,.025,.009),rubber,.003)
db('Tower raised base',(-1.34,.041,.08),(.65,.08,.97),ivory,.02)
asset('desk')
db('Pedestal carcass',(1.45,.63,-.14),(.70,1.17,.95),white,.025)
for y in (.29,.66,1.02):
    db('Pedestal drawer front',(1.45,y,.347),(.65,.32,.035),white,.012)
    db('Pedestal recessed pull',(1.45,y+.07,.37),(.26,.018,.022),silver,.006)

def speaker(p,scale=1):
    x,y,z=p
    box('White speaker enclosure',(x,y+.27*scale,z),(.32*scale,.54*scale,.32*scale),white,.022)
    box('Speaker fabric baffle',(x,y+.27*scale,z+.166*scale),(.284*scale,.49*scale,.012),ivory,.012)
    for h,r in ((.21,.097),(.41,.042)):
        cylinder('Recessed speaker driver',(x,y+h*scale,z+.178*scale),r*scale,.016,rubber,direction=(0,0,1))
        ring('Driver surround',(x,y+h*scale,z+.188*scale),r*.87*scale,.006*scale,ink,direction=(0,0,1))
        sphere('Driver dust cap',(x,y+h*scale,z+.196*scale),(r*.4*scale,r*.4*scale,.012*scale),ink)
# desk speakers face the room (positive X), rotate the locally built objects.
for local in [(-1.42,1.69,-.22),(1.42,1.69,-.22)]:
    start=set(bpy.data.objects);speaker((0,0,0),.75)
    for o in set(bpy.data.objects)-start:
        q=o.location.copy();o.location=Vector(xyz(dp((local[0]+q.x,local[1]+q.z,local[2]-q.y))));o.rotation_euler.z+=math.pi/2

def mug(p,s=.1):
    x,y,z=p
    # Real open cup, bottom, lip, handle and recessed liquid.
    verts=[];faces=[]
    for r,h in [(s*.78,0),(s,.025),(s,1.7*s),(s*.83,1.7*s),(s*.83,.025)]:
        for i in range(48):
            a=i/48*math.tau;verts.append(xyz((x+r*math.cos(a),y+h,z+r*math.sin(a))))
    for row in range(4):
        for i in range(48):a=row*48+i;b=row*48+(i+1)%48;faces.append((a,b,b+48,a+48))
    mesh=bpy.data.meshes.new('Pottery wall');mesh.from_pydata(verts,[],faces);mesh.update()
    o=bpy.data.objects.new('Glazed open mug',mesh);bpy.context.collection.objects.link(o);tag(o,o.name,white)
    for f in mesh.polygons:f.use_smooth=True
    cylinder('Coffee surface',(x,y+1.45*s,z),s*.81,.004,coffee)
    ring('Mug handle',(x+s*1.15,y+s*.95,z),s*.58,s*.14,white,direction=(0,0,1))

def plant(p,size=1):
    x,y,z=p;r=.23*size;h=.43*size
    cylinder('Pot saucer',(x,y+.014*size,z),r*1.12,.028*size,ivory)
    cylinder('Ceramic planter',(x,y+h/2+.03*size,z),r,h,white,r2=r*.77)
    cylinder('Planter rim soil',(x,y+h+.032*size,z),r*.92,.012*size,soil)
    ring('Planter rolled lip',(x,y+h+.04*size,z),r*.98,.015*size,white)
    for i in range(11):
        a=i*2.399;tip=(x+math.cos(a)*.36*size,y+(.85+(i%4)*.19)*size,z+math.sin(a)*.36*size)
        base=(x,y+h*.8,z);mid=(x+(tip[0]-x)*.30,y+h+.18*size,z+(tip[2]-z)*.3)
        tube('Living plant petiole',[base,mid,tip],.008*size,green)
        # A tapered, curved leaf surface with a raised central vein.
        verts=[];faces=[];axis=Vector((math.cos(a),0,math.sin(a)));side=Vector((-math.sin(a),0,math.cos(a)))
        for row in range(13):
            t=row/12;width=math.sin(math.pi*t)**.8*.12*size
            center=Vector(tip)+axis*((t-.2)*.34*size)+Vector((0,math.sin(t*math.pi)*.07*size,0))
            for k in (-1,0,1):
                q=center+side*width*k;q.y-=abs(k)*.027*size;verts.append(xyz(q))
            if row:
                n=row*3
                for k in (0,1):faces.append((n-3+k,n-2+k,n+1+k,n+k))
        mesh=bpy.data.meshes.new('Veined leaf blade');mesh.from_pydata(verts,[],faces);mesh.update()
        o=bpy.data.objects.new('Curved botanical leaf',mesh);bpy.context.collection.objects.link(o);tag(o,o.name,green if i%3 else lightgreen)
        for f in mesh.polygons:f.use_smooth=True
        leafmat=o.data.materials[0];leafmat.use_backface_culling=False
        tube('Leaf midrib',[tip,tuple(Vector(tip)+axis*.17*size+Vector((0,.075*size,0))),tuple(Vector(tip)+axis*.27*size)],.002*size,vein)

asset('desk lamp')
lp=dp((-1.64,1.69,-.575));x,y,z=lp
cylinder('Task lamp foot',(x,y+.022,z),.19,.044,white)
tube('Task lamp articulated arm',[(x,y+.04,z),(x,y+.37,z),(x+.05,y+.64,z),(x+.16,y+.78,z)],.018,silver)
for h in (.37,.64):cylinder('Lamp hinge',(x,y+h,z),.035,.06,silver,direction=(0,0,1))
# Open, thin aluminium shade, its luminous diffuser is added separately.
verts=[];faces=[]
for row,(r,yy) in enumerate(((.17,y+.65),(.085,y+.83))):
    for i in range(41):
        a=i/40*math.tau;verts.append(xyz((x+.16+r*math.cos(a),yy,z+r*math.sin(a))))
        if row and i:n=41+i;faces.append((n-42,n-41,n,n-1))
mesh=bpy.data.meshes.new('Task lamp open shade');mesh.from_pydata(verts,[],faces);mesh.update();o=bpy.data.objects.new('Task lamp open shade',mesh);bpy.context.collection.objects.link(o);tag(o,o.name,white)
asset('desk details')
mug(dp((-1.55,1.70,.50)),.075)
db('Notebook lower cover',(-1.45,1.712,.16),(.39,.026,.32),sage,.008)
db('Notebook paper block',(-1.45,1.733,.16),(.37,.018,.30),paper,.003)
db('Notebook upper cover',(-1.45,1.749,.16),(.39,.012,.32),sage,.006)
dc('Desk pencil',(-1.55,1.765,.16),.007,.27,oak,direction=(1,0,0))
tube('Monitor cable',[dp((0,2.2,-.34)),dp((0,1.49,-.56)),dp((-.8,1.38,-.56)),dp((-1.34,.8,-.40))],.009,rubber)

asset('chair')
cx,cz=-1.60,-.60
cylinder('Chair column',(cx,.59,cz),.052,.80,silver)
cylinder('Gas lift cover',(cx,.26,cz),.078,.30,ivory)
for i in range(5):
    a=i*math.tau/5;tx=cx+math.sin(a)*.55;tz=cz+math.cos(a)*.55
    tube('Five star chair base',[(cx,.22,cz),(cx+math.sin(a)*.28,.16,cz+math.cos(a)*.28),(tx,.13,tz)],.039,white)
    cylinder('Chair caster',(tx,.075,tz),.07,.085,rubber,direction=(math.cos(a),0,-math.sin(a)))
box('Upholstered seat',(cx,1.04,cz),(.88,.16,.85),linen,.075)
back=box('Upholstered chair back',(cx+.34,1.58,cz),(.15,1.00,.82),linen,.07)
for side in (-1,1):
    tube('Armrest support',[(cx,1.08,cz+side*.49),(cx,1.37,cz+side*.49)],.021,silver)
    box('Soft armrest',(cx,1.43,cz+side*.49),(.53,.055,.10),ivory,.025)
tube('Chair back stay',[(cx,.98,cz),(cx+.31,1.20,cz),(cx+.33,1.63,cz)],.026,silver)
register('chair',[-2.20,0,-1.25],[-.95,2.12,.05])

asset('bookshelf')
for x in (-4.32,.52):box('Bookcase stile',(x,2.19,-3.75),(.10,4.38,.70),white,.012)
box('Bookcase recessed back',(-1.9,2.15,-4.10),(4.80,4.26,.045),ivory,.006)
for i in range(6):
    y=.15+i*.82;box('Bookcase shelf',(-1.9,y,-3.75),(4.80,.075,.70),white,.009)
    if i<5:register('book shelf '+str(i),[-4.30,y-.0375,-4.10],[.50,y+.0375,-3.40])
box('Bookcase divider',(-1.20,2.2,-3.75),(.065,4.12,.65),white,.009)
box('Bookcase oak crown',(-1.9,4.34,-3.75),(4.94,.065,.73),oak,.012)
plant((-3.77,4.38,-3.78),.42)
for i in range(3):
    box('Linen archive box',(-1.05+i*.22,4.61,-3.75),(.19,.47,.39),ivory,.01)
    box('Archive label',(-1.05+i*.22,4.65,-3.549),(.11,.10,.004),paper,.003)
    ring('Archive finger pull',(-1.05+i*.22,4.46,-3.541),.022,.005,silver,direction=(0,0,1))
register('bookcase divider',[-1.2325,.14,-4.075],[-1.1675,4.26,-3.425])
for x in (-4.32,.52):register('bookcase side', [x-.05,0,-4.10],[x+.05,4.38,-3.40])

asset('media cabinet')
for x in (1.04,5.36):box('Media cabinet side',(x,.70,-3.75),(.09,1.40,.65),white,.012)
box('Media cabinet recessed back',(3.2,.75,-4.01),(4.25,1.35,.04),ivory,.006)
for i,y in enumerate((.10,.72,1.36)):
    box('Media cabinet shelf',(3.2,y,-3.75),(4.30,.075,.65),white,.009)
    register('media shelf '+str(i),[1.05,y-.0375,-4.075],[5.35,y+.0375,-3.425])
box('Media oak worktop',(3.2,1.42,-3.75),(4.34,.06,.68),oak,.014)
register('media worktop',[1.03,1.39,-4.09],[5.37,1.45,-3.41])
for x in (1.04,5.36):register('media cabinet side',[x-.045,0,-4.075],[x+.045,1.4,-3.425])
# Player is physically hollow. Tape envelope .48 x .125 x .31 fits a .60 x .15 slot.
asset('player')
px,py,pz=2.68,1.545,-3.75
box('Player lower shell',(px,1.4625,pz),(.92,.025,.48),silver,.006)
box('Player top shell',(px,1.6375,pz),(.92,.025,.48),white,.008)
for s in (-1,1):box('Player side',(px+s*.4475,py,pz),(.025,.15,.48),white,.006)
box('Player rear shell',(px,py,-3.9825),(.87,.15,.015),ivory,.003)
for s in (-1,1):box('Slot side fascia',(px+s*.38,py,-3.505),(.16,.15,.018),ivory,.004)
box('Slot upper lip',(px,1.627,-3.505),(.60,.02,.018),silver,.003)
box('Slot lower lip',(px,1.467,-3.505),(.60,.014,.018),silver,.003)
cylinder('Player power key',(px+.36,py,-3.490),.025,.012,silver,direction=(0,0,1))
for i in range(9):box('Player ventilation',(px-.31+i*.074,1.652,pz),(.033,.003,.16),edge,.001)
register('player top',[2.22,1.625,-3.99],[3.14,1.65,-3.51])
register('player base',[2.22,1.45,-3.99],[3.14,1.475,-3.51])
for s in (-1,1):register('player side',[px+s*.4475-.0125,1.475,-3.99],[px+s*.4475+.0125,1.625,-3.51])

asset('projection screen')
for x in (1.21,5.19):cylinder('Projection support',(x,3.05,-3.95),.025,2.25,silver)
for x in (1.40,5.0):box('Screen wall bracket',(x,4.27,-4.12),(.045,.06,.22),silver,.007)
box('Screen textile',(3.2,3.05,-3.91),(4.10,2.35,.028),linen,.003)
box('Projection casing',(3.2,4.27,-3.92),(4.40,.16,.19),white,.04)
cylinder('Screen lower weight',(3.2,1.875,-3.91),.025,4.12,silver,direction=(1,0,0))
for x in (1.0,5.4):box('Projection case end cap',(x,4.27,-3.92),(.025,.17,.20),ivory,.008)
register('screen bottom bar',[1.12,1.85,-3.94],[5.28,1.90,-3.88])

asset('projector')
projector_parts=set(bpy.data.objects)
box('Projector console top',(5.0,2.35,3.12),(.92,.055,.68),oak,.018)
for x in (4.56,5.44):box('Equipment cabinet stile',(x,1.17875,3.12),(.04,2.2875,.66),white,.008)
box('Equipment cabinet back',(5.,1.17,3.435),(.84,2.27,.025),ivory,.006)
for y in (.07,.78,1.52):box('Equipment cabinet shelf',(5.,y,3.12),(.85,.04,.64),white,.008)
for i in range(5):box('Equipment manual',(4.75+i*.10,.32,3.12),(.085,.45,.38),paper if i%2 else sage,.006)
box('Projector chassis',(5.0,2.525,3.12),(.68,.29,.50),white,.045)
box('Projector bottom reveal',(5.0,2.407,3.12),(.60,.035,.43),ivory,.012)
for r,depth,mat in ((.10,2.858,ink),(.079,2.847,silver),(.068,2.836,lens)):
    cylinder('Projection lens',(4.83,2.53,depth),r,.018,mat,direction=(0,0,1))
ring('Lens focus ring',(4.83,2.53,2.828),.075,.007,ink,direction=(0,0,1))
for i in range(11):box('Projector cooling slot',(5.02+i*.021,2.53,2.863),(.009,.12,.006),edge,.002)
cylinder('Projector power key',(5.16,2.674,3.11),.021,.004,silver)
tube('Projector power lead',[(5.31,2.47,3.27),(5.39,1.4,3.36),(5.39,.05,3.6),(5.65,.02,3.7)],.007,ivory)
asset('projector glow')
projector_glow=material('Projector optical glow','#c8dbef',.22)
projector_glow.node_tree.nodes.get('Principled BSDF').inputs['Emission Color'].default_value=(.7,.85,1,1)
projector_glow.node_tree.nodes.get('Principled BSDF').inputs['Emission Strength'].default_value=0
cylinder('Projector luminous aperture',(4.83,2.53,2.816),.063,.002,projector_glow,direction=(0,0,1))
for obj in set(bpy.data.objects)-projector_parts:obj.location.x+=.75
register('projector console',[5.29,0,2.78],[6.21,2.70,3.46])

asset('office botanicals')
plant((-5.14,0,-2.85),1.15)
asset('cinema botanicals')
plant((5.97,0,-3.57),.78)
asset('guest botanicals')
plant((-5.93,0,4.48),.75)
# The window curtain travel is kept free of pots and foliage.

asset('guest corner')
box('Guest corner rug',(-5.14,.015,3.88),(2.25,.03,1.8),rugmat,.012)
cylinder('Guest table top',(-4.34,.74,4.07),.31,.045,oak)
cylinder('Guest table stem',(-4.34,.38,4.07),.03,.69,white)
cylinder('Guest table base',(-4.34,.026,4.07),.24,.04,white)
box('Guest notebook',(-4.39,.786,4.12),(.23,.035,.19),paper,.006)
cylinder('Pen holder',(-4.18,.83,3.99),.05,.14,white)
for i in range(3):cylinder('Guest pencil',(-4.20+i*.02,.96,3.99),.005,.24,oak)

# Additional authored assets share this builder's exact dimensions and materials.
sys.path.insert(0,str(Path(__file__).parent))
from room_enrichment import enrich
enrich(globals())
from cozy_room import furnish
furnish(globals())
from room_collectible_display import install
install(globals())

# Apply all modifiers once. Export meshes grouped by authored object collection,
# not by tiny component, keeping browser draw calls bounded without losing detail.
bpy.ops.object.select_all(action='DESELECT')
for o in list(bpy.context.scene.objects):
    bpy.context.view_layer.objects.active=o;o.select_set(True)
    if o.type in ('CURVE','FONT'):bpy.ops.object.convert(target='MESH')
    elif o.type=='MESH':
        for mod in list(o.modifiers):
            try:bpy.ops.object.modifier_apply(modifier=mod.name)
            except RuntimeError:pass
    if o.type=='MESH' and not o.data.uv_layers:
        uv=o.data.uv_layers.new(name='Physical planar UV')
        for face in o.data.polygons:
            axis=max(range(3),key=lambda a:abs(face.normal[a]));a=(axis+1)%3;b=(axis+2)%3
            for idx in face.loop_indices:
                co=o.data.vertices[o.data.loops[idx].vertex_index].co;uv.data[idx].uv=(co[a]*2,co[b]*2)
    o.select_set(False)

components=[]
bpy.context.view_layer.update()
for obj in bpy.context.scene.objects:
    if obj.type!='MESH':continue
    corners=[obj.matrix_world@Vector(p) for p in obj.bound_box]
    corners=[(v.x,v.z,-v.y) for v in corners]
    components.append({'name':obj.name,'group':obj.get('asset_group',''),'min':[round(min(p[a] for p in corners),6) for a in range(3)],'max':[round(max(p[a] for p in corners),6) for a in range(3)]})
manifest={'version':'sunlit-room-4','units':'existing room world units, Y up','assets':inventory,'obstacles':bounds,'components':components,'sourceObjectCount':len(bpy.context.scene.objects),'lights':light_anchors,'screen':{'position':[-3.713,2.70,-.60],'size':[2.16,1.23]},'artwork':artwork_anchor,'backgrounds':{'day':'#ffffff','night':'#030405'}}
(OUT/'layout.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')

# Preserve the editable individual components in the native source file.
scene=bpy.context.scene
world=bpy.data.worlds.new('White imagination');scene.world=world;world.use_nodes=True
world.node_tree.nodes['Background'].inputs['Color'].default_value=(1,1,1,1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35
# A camera-ray-only white shader leaves lighting independent of the visible void.
nodes=world.node_tree.nodes;links=world.node_tree.links
camera_white=nodes.new('ShaderNodeBackground');camera_white.inputs['Color'].default_value=(1,1,1,1);camera_white.inputs['Strength'].default_value=64
path=nodes.new('ShaderNodeLightPath');mix=nodes.new('ShaderNodeMixShader')
links.new(path.outputs['Is Camera Ray'],mix.inputs[0]);links.new(nodes['Background'].outputs[0],mix.inputs[1]);links.new(camera_white.outputs[0],mix.inputs[2]);links.new(mix.outputs[0],nodes['World Output'].inputs['Surface'])
light=bpy.data.lights.new('Afternoon sun','SUN');light.energy=2.75;light.angle=.035
sun=bpy.data.objects.new('Afternoon sun',light);scene.collection.objects.link(sun)
sun.rotation_euler=(Vector(xyz((0,0,0)))-Vector(xyz((-13,8,1.8)))).to_track_quat('-Z','Y').to_euler()
light=bpy.data.lights.new('Soft open room fill','AREA');light.energy=470;light.shape='DISK';light.size=9
fill=bpy.data.objects.new('Soft open room fill',light);scene.collection.objects.link(fill);fill.location=xyz((3,7,6));fill.rotation_euler=(Vector(xyz((0,1,0)))-fill.location).to_track_quat('-Z','Y').to_euler()
# Lamp placements are exported as metadata; web and native QA share anchors.
for key,power,color,size in [('desk',35,(1,.78,.51),.28),('floor',120,(1,.69,.40),.65),('picture',18,(1,.84,.61),.50),('guest',42,(1,.75,.47),.28),('console',24,(1,.72,.42),.34)]:
    anchor=light_anchors[key];data=bpy.data.lights.new('Night '+key,'AREA');data.energy=0;data['night_energy']=power;data.color=color;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new('Night '+key,data);scene.collection.objects.link(obj);obj.location=xyz(anchor['position']);obj.rotation_euler=(Vector(xyz(anchor['target']))-obj.location).to_track_quat('-Z','Y').to_euler()
for i,p in enumerate(light_anchors['shelves']):
    data=bpy.data.lights.new('Night shelf '+str(i),'AREA');data.energy=0;data['night_energy']=6;data.color=(1,.79,.55);data.shape='RECTANGLE';data.size=3.6;data.size_y=.10
    obj=bpy.data.objects.new(data.name,data);scene.collection.objects.link(obj);obj.location=xyz(p);obj.rotation_euler=(Vector(xyz([p[0],p[1]-.4,p[2]-.10]))-obj.location).to_track_quat('-Z','Y').to_euler()
for i,p in enumerate(light_anchors['media']):
    data=bpy.data.lights.new('Night media '+str(i),'AREA');data.energy=0;data['night_energy']=4;data.color=(1,.78,.50);data.shape='RECTANGLE';data.size=1.7;data.size_y=.08
    obj=bpy.data.objects.new(data.name,data);scene.collection.objects.link(obj);obj.location=xyz(p);obj.rotation_euler=(Vector(xyz([p[0],.6,-3.75]))-obj.location).to_track_quat('-Z','Y').to_euler()
camera=bpy.data.cameras.new('Room overview');cam=bpy.data.objects.new('Room overview',camera);scene.collection.objects.link(cam);cam.location=xyz((13,10,15));cam.rotation_euler=(Vector(xyz((-.3,1.6,.3)))-cam.location).to_track_quat('-Z','Y').to_euler();camera.type='ORTHO';camera.ortho_scale=20;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1500;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'sunlit-room.blend'))

# Group exported components by material and category, preserving named groups for
# rendering and exact triangle-mesh collision tests in the browser coordinate frame.
meshes=[o for o in scene.objects if o.type=='MESH']
groups={}
for o in meshes:groups.setdefault((o.get('asset_group','room'),o.data.materials[0].name),[]).append(o)
for (group,mat),objects in groups.items():
    bpy.ops.object.select_all(action='DESELECT')
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    if len(objects)>1:bpy.ops.object.join()
    o=bpy.context.object;o.name=group+' | '+mat
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type=='MESH':o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'room.glb'),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_texcoords=True,export_normals=True,export_extras=True,export_cameras=False,export_lights=False)
print('SUNLIT_EXPORT_READY',json.dumps({'parts':manifest['sourceObjectCount'],'groups':len(groups),'bytes':(OUT/'room.glb').stat().st_size}))
if '--render' in sys.argv:
    scene.render.filepath=str(QA/'blender-overview.png');bpy.ops.render.render(write_still=True)
