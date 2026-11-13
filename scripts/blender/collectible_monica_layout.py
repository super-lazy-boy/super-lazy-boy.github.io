"""Spatial layout of the purple-wall, blue-kitchen cutaway selected by the user.

Reuses detailed furniture from the asset library, then rebuilds the stepped
footprint and joinery. Architectural coordinates are X right, Y up, Z front.
The rear bay extends behind the kitchen; it is not one shallow rectangular room.
"""
import math,bpy
from mathutils import Matrix
from collectible_builder import C

FOOTPRINT=[(-3.65,4.05),(-.45,4.05),(-.45,4.50),(3.65,4.50),(3.65,-5.11),(-.20,-5.11),(-.20,-1.70),(-3.65,-1.70)]

def apply_layout(b):
    m=b.materials
    purple=m['Lavender plaster'];violet=m['Purple door paint'];teal=m['Blue green enamel cabinetry'];shade=m['Recessed blue cabinet panels'];cream=m['Ivory joinery'];wood=m['Honey oak parquet'];walnut=m['Aged walnut furniture'];black=m['Patinated iron'];gold=m['Yellow gilt details'];steel=m['Satin kitchen metal'];white=m['Porcelain crockery'];red=m['Burgundy ceramics'];mustard=m['Butter yellow ceramics'];patch=m['Embroidered patchwork cushions'];plaid=m['Red tartan throw'];leaf=m['Botanical leaves'];terra=m['Terracotta pots'];brick=m['Warm exposed brick']
    def named(*prefixes):return [o for o in b.objects if o.name.startswith(prefixes)]
    def group(name):return [o for o in b.objects if o.get('assembly')==name]
    def groups(prefix):return [o for o in b.objects if o.get('assembly','').startswith(prefix)]
    def drop(objects):
        for obj in list(objects):
            if obj in b.objects:b.objects.remove(obj);bpy.data.objects.remove(obj,do_unlink=True)
    def move(objects,old,new,oldyaw=0,yaw=0,sx=1,sz=1,assembly=None):
        if not objects:raise RuntimeError('Missing furniture for reference-layout move '+str(old))
        bpy.context.view_layer.update()
        t=C@Matrix.Translation([v*b.unit for v in new])@Matrix.Rotation(yaw,4,'Y')@Matrix.Diagonal((sx,1,sz,1))@Matrix.Rotation(-oldyaw,4,'Y')@Matrix.Translation([-v*b.unit for v in old])@C.inverted()
        for obj in objects:
            obj.matrix_world=t@obj.matrix_world
            if assembly:obj['assembly']=assembly
    # Retain each sofa seam, chair spindle, utensil and printed book while moving
    # the assemblies to their actual relationships in the selected reference.
    move(group('sofa'),(.62,.195,1.36),(.05,.195,1.78),math.pi/2,math.pi/2)
    move(group('armchair'),(3.15,.195,-.72),(1.85,.195,-.55),-.18,-.08)
    move(group('ottoman'),(1.65,.195,3.05),(.90,.195,3.84),.12,.10)
    move(group('television'),(4.75,.195,1.23),(3.23,.195,1.75),-math.pi/2,-math.pi/2)
    move(group('writing desk'),(4.94,.412,-2.33),(3.15,.422,-3.40),math.pi/2,math.pi/2)
    move(group('sofa side pedestal')+groups('lamp (0.62,'),(.62,0,-.56),(.05,0,-.25))
    move(group('round side table')+groups('lamp (4.15,'),(4.15,0,-.68),(2.92,0,-.57))
    move(group('coffee table')+groups('Coffee table tea cup ')+groups('plant (2.28,'),(2.62,0,1.35),(1.65,0,1.78))
    move(groups('Coffee table tea cup '),(0,0,0),(0,.002,0))
    move(group('dining table')+groups('dining chair ')+groups('Dining cup '),(-2.88,0,.55),(-2.05,0,2.05),sx=.92,sz=.92)
    move(groups('plant (4.85,'),(4.85,.195,-.02),(3.07,.195,3.32))
    move(groups('plant (0.57,'),(.57,.42,-3.23),(.72,.43,-4.47))
    # Kitchen is on the left wall: stove near the entrance, sink under the window.
    move(group('angled kitchen'),(-4.16,0,-2.26),(-3.08,0,-.32),.873,math.pi/2,assembly='left-wall sink')
    move(groups('plant (-4.737,'),(-4.16,0,-2.26),(-3.08,0,-.32),.873,math.pi/2)
    move(named('Vintage freestanding oven','Oven ','Enamel hob','Gas burner','Stove pot support','Kettle'),(-1.37,0,-3.10),(-3.08,0,1.10),yaw=math.pi/2,assembly='left-wall stove')
    move(named('Cream fridge body','Black refrigerator gasket','Rounded cream fridge door','Fridge '),(-.39,0,-3.07),(-.52,0,-1.10),assembly='refrigerator')
    move(named('Hanging pan rail','Hung copper saucepan','Saucepan long handle'),(-2.71,0,-3.47),(-1.82,0,-1.44),assembly='rear pot rail')
    move(named('Counter chopping board'),(-3.12,0,-2.97),(-1.52,0,-1.03),assembly='chopping board')
    move(groups('Everyday countertop mug (-3.35,'),(-3.35,0,-2.78),(-2.48,0,-.94))
    move(groups('Everyday countertop mug (-2.89,'),(-2.89,0,-2.78),(-1.98,0,-.94))
    move(named('Utensil crock','Wooden cooking utensil','Wooden spoon head'),(-2.31,0,-3.21),(-1.14,0,-1.13),assembly='counter utensils')
    # Door positions and the deep rear window alcove follow the stepped plan.
    move(named('Iconic apartment entrance','Ornate peephole','Yellow peephole','Small gilt corner','Apartment door peephole'),(-5.243,0,2.38),(-3.49,0,2.75),math.pi/2,math.pi/2,assembly='entrance door')
    move(named('Teal rear hall door'),(1.17,.21,-3.565),(.49,.22,-4.955),sx=.82,assembly='rear hall door')
    move(named('Bedroom hallway door'),(.379,.20,-2.37),(-.045,.22,-3.45),math.pi/2,math.pi/2,assembly='hall bedroom door')
    window_names=('Deep window recess','Black painted window mullion','Window transom','Individual window pane','Brown woven window blind','Roman blind cord','Window sill moulding','Gathered full-height patterned curtain','Curtain tieback','Curtain brass pole')
    move(named(*window_names),(3.66,0,-3.60),(2.30,.11,-4.995),sx=.73,assembly='rear window and curtains')
    move(named('Window seat base','Green window seat cushion'),(3.64,0,-3.05),(2.30,-.005,-4.50),sx=.73,assembly='window bench')
    # Clear the prototype architecture and cabinet arrangement before rebuilding.
    drop(named('Walnut cutaway plinth','Individual herringbone oak stave','Lavender entrance wall','Angled brick kitchen wall','Brick range wall','Hall rear wall','Window low wall','Window head','Right window pier','Hall partition','Low front cut edge','Cream profiled skirting','Raised rear alcove floor','Window step bullnose','Hall runner woven mat','Kitchen overhead oak beam','Kitchen beam post','Floral living-room rug','Window patchwork pillow','Miniature art walnut frame','Art ivory mount','Art muted field','Tiny still-life painted petal'))
    drop([o for o in named('Recessed kitchen carcass','Kitchen toe kick','Blue cabinet door frame','Recessed shaker field','Kitchen small bar pull','Counter slab') if o.get('assembly')!='left-wall sink'])
    drop(named('Blue open shelf board','Open shelf upright','Open shelf cup','Stacked shelf bowl','Vertical display plate','Blue plate border'))
    drop([o for o in group('left-wall sink') if o.name.startswith('Counter slab')])
    b.solid('Walnut cutaway plinth',FOOTPRINT,0,.17,walnut)
    # Three convex regions tile the concave outline without filling its rear notch.
    zones=[((-3.65,-1.70,3.65,4.05),.170),((-.45,4.05,3.65,4.50),.170),((-.20,-5.11,3.65,-1.70),.395)]
    def clip(poly,rect):
        x0,z0,x1,z1=rect
        for axis,edge,sign in [(0,x0,1),(0,x1,-1),(1,z0,1),(1,z1,-1)]:
            out=[]
            for a,c in zip(poly,poly[1:]+poly[:1]):
                ia=(a[axis]-edge)*sign>=0;ic=(c[axis]-edge)*sign>=0
                if ia:out.append(a)
                if ia!=ic:
                    t=(edge-a[axis])/(c[axis]-a[axis]);out.append(tuple(a[k]+(c[k]-a[k])*t for k in range(2)))
            poly=out
            if len(poly)<3:return []
        return poly
    cs=math.sqrt(.5);w=.24
    for i in range(-34,35):
        for j in range(-34,35):
            s=(i+j)%6
            if s not in (0,3):continue
            dx,dz=(3,1) if s==0 else (1,3);p=[(i*w,j*w),((i+dx)*w,j*w),((i+dx)*w,(j+dz)*w),(i*w,(j+dz)*w)];p=[((x-z)*cs,(x+z)*cs) for x,z in p]
            for rect,y in zones:
                pp=clip(p,rect)
                if not pp:continue
                cx=sum(x for x,z in pp)/len(pp);cz=sum(z for x,z in pp)/len(pp);pp=[(cx+(x-cx)*.986,cz+(z-cz)*.986) for x,z in pp];b.solid('Reference-layout herringbone stave',pp,y,y+.025,wood)
    b.box('Raised rear window and corridor platform',(1.725,.2825,-3.405),(3.85,.225,3.41),wood,.006)
    b.box('Rear alcove step bullnose',(1.725,.403,-1.72),(3.85,.05,.10),walnut,.012)
    def wall(name,a,c,height,mat,base=.17,thick=.12):
        dx,dz=c[0]-a[0],c[1]-a[1]
        return b.box(name,((a[0]+c[0])/2,base+height/2,(a[1]+c[1])/2),(math.hypot(dx,dz),height,thick),mat,.008,rotation=(0,-math.atan2(dz,dx),0))
    wall('Lavender entrance wall',(-3.59,4.05),(-3.59,1.13),3.125,purple)
    left=wall('Left kitchen brick wall',(-3.59,1.13),(-3.59,-1.64),3.125,brick)
    wall('Brick range wall',(-3.59,-1.64),(-.20,-1.64),3.125,brick)
    wall('Hall partition',(-.14,-1.70),(-.14,-5.05),3.18,purple)
    wall('Hall rear wall',(-.14,-5.05),(1.10,-5.05),3.18,purple)
    wall('Window low wall',(1.10,-5.05),(3.59,-5.05),.88,purple)
    wall('Window head',(1.10,-5.05),(3.59,-5.05),.21,purple,base=3.14)
    wall('Right window pier',(3.59,-5.05),(3.59,-4.20),3.18,purple)
    wall('Right window cutaway return',(3.59,-4.20),(3.59,-1.70),.62,purple)
    wall('Right living-room cut edge',(3.59,-1.70),(3.59,4.50),.62,purple)
    wall('Low front entry cut edge',(-3.65,3.99),(-.45,3.99),.55,purple)
    wall('Low front inset return',(-.39,4.05),(-.39,4.50),.55,purple)
    wall('Low front living cut edge',(-.45,4.44),(3.65,4.44),.55,purple)
    b.box('Rear window lavender mullion post',(1.10,1.76,-5.025),(.12,3.18,.17),purple,.008)
    for a,c in [((-3.515,4.0),(-3.515,-1.55)),((-.065,-4.92),(-.065,-1.75)),((3.515,-1.60),(3.515,4.45))]:wall('Cream profiled skirting',a,c,.14,cream,base=.195,thick=.026)
    # The left window is a genuine opening in the brick, behind the sink assembly.
    cutter=b.box('Temporary left kitchen window cutter',(-3.59,2.14,-.32),(.40,1.36,1.39),steel,0);bpy.context.view_layer.update();left.data=left.data.copy();bpy.context.view_layer.objects.active=left;mod=left.modifiers.new('Actual left kitchen window opening','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name);drop([cutter])
    # Connected, not overlapping, worktop segments at the L-shaped corner.
    sinkpoly=[(-3.545,-1.045),(-2.640,-1.045),(-2.640,-.645),(-2.615,-.645),(-2.615,.405),(-3.545,.405)]
    top=b.solid('Notched left sink wood countertop',sinkpoly,1.085,1.175,wood)
    cutter=b.box('Temporary sink recess cutter',(-3.05,1.13,-.32),(.46,.40,.61),steel,0);bpy.context.view_layer.update();bpy.context.view_layer.objects.active=top;mod=top.modifiers.new('Hollow sink opening','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name);drop([cutter]);top['assembly']='left-wall sink'
    with b.frame(assembly='rear kitchen cabinets'):
        for x in (-2.23,-1.42):
            b.box('Rear cabinet carcass',(x,.66,-1.11),(.76,.88,.82),shade,.014)
            b.box('Rear cabinet toe recess',(x,.25,-.695),(.68,.10,.028),walnut,.003)
            for y,h in ((.54,.48),(.93,.22)):
                b.box('Rear blue shaker door',(x,y,-.668),(.725,h,.038),teal,.005);b.box('Rear recessed field',(x,y,-.644),(.60,h-.10,.008),shade,.002);b.box('Rear cabinet pull',(x,y+h*.15,-.620),(.22,.022,.030),steel,.005)
        b.box('Shared rear walnut worktop',(-1.822,1.13,-1.11),(1.63,.09,.926),wood,.014)
        # Cream two-door wall cupboard is distinct from the blue open left shelving.
        b.box('Cream upper cupboard carcass',(-1.86,2.40,-1.418),(1.48,.86,.32),cream,.018)
        for x in (-2.23,-1.49):
            b.box('Cream cupboard framed door',(x,2.40,-1.235),(.72,.82,.034),white,.007);b.box('Cream cupboard inset',(x,2.40,-1.213),(.60,.68,.008),cream,.003);b.box('Upper cupboard dark handle',(x+(.22 if x< -2 else -.22),2.36,-1.192),(.025,.16,.026),black,.004)
    # Blue open shelving wraps the near end of the left-wall kitchen window.
    with b.frame((-3.08,0,-.32),math.pi/2,'left blue shelving'):
        for y in (1.62,2.04,2.46,2.89):b.box('Left open shelf board',(-1.12,y,-.290),(.46,.055,.32),teal,.005)
        for x in (-1.375,-.865):b.box('Left open shelf stile',(x,2.25,-.290),(.05,1.34,.32),teal,.005)
        b.box('Blue window shelf crown',(-.29,2.93,-.290),(2.17,.07,.32),teal,.006)
        for row,y in enumerate((1.655,2.075,2.495)):
            for j in range(2):
                x=-1.24+j*.24;mat=[white,red,mustard][(row+j)%3]
                b.lathe('Left shelf ceramic bowl',(x,y,-.215),[(0,.040),(.02,.058),(.10,.082),(.11,.08),(.105,.065),(.025,.038)],mat,segments=20)
        for j in range(4):
            x=-.60+j*.32;b.cylinder('Blue shelf display plate',(x,3.08,-.345),.10,.015,white,direction=(0,0,1),segments=24);b.ring('Plate blue rim',(x,3.08,-.334),.085,.006,teal,normal=(0,0,1),segments=24)
    b.box('Kitchen overhead oak beam',(-2.195,2.85,1.30),(2.79,.17,.17),walnut,.012)
    b.box('Kitchen right return beam',(-.80,2.85,-.14),(.17,.17,2.88),walnut,.012)
    b.box('Kitchen beam post',(-.80,1.515,1.30),(.16,2.50,.16),walnut,.010)
    # Main rug, window cushions and runner preserve the set's softer colors.
    rug=m['Floral rug with dark border']
    b.mesh('Floral living-room rug',[(-.25,.202,-.30),(3.40,.202,-.30),(3.40,.202,3.72),(-.25,.202,3.72)],[(3,2,1,0)],rug,[(0,0),(1,0),(1,1),(0,1)])
    for z in (-4.45,-3.52,-2.59):b.box('Hall runner woven mat',(.49,.435,z),(.73,.012,.67),plaid,.007)
    with b.frame(assembly='window cushions'):
        for x,a in ((1.46,-.13),(2.30,.03),(3.10,.13)):b.cushion('Window patchwork pillow',(x,1.19,-4.54),(.39,.34,.15),patch,rotation=(.13,0,a),uv_axis='xy')
    # Two low decorative stools sit at the front of the coffee-table rug.
    for n,x in enumerate((1.66,2.45)):
        with b.frame((x,.195,3.22),assembly='painted stool '+str(n)):
            b.cylinder('Round painted stool seat',(0,.43,0),.22,.06,white,segments=32)
            for a in (0,math.pi/2):b.box('Stool red painted cross',(0,.463,0),(.34,.004,.045),red,.001,rotation=(0,a,0))
            for k in range(4):a=k*math.pi/2;b.tube('Decorative stool leg',[(math.sin(a)*.15,0,math.cos(a)*.15),(math.sin(a)*.12,.40,math.cos(a)*.12)],.017,walnut)
    # The reference tree stands on the raised window floor, behind the armchair.
    pine=b.material('Window tree fir needles','#3e664d',.86);pine_light=b.material('Window tree new growth','#63845b',.86)
    with b.frame((2.75,.42,-2.18),assembly='window tree'):
        b.lathe('Tree ceramic planter',(0,0,0),[(0,.14),(.20,.19),(.22,.19),(.22,.165),(.03,.11)],terra,segments=24);b.cylinder('Tree trunk',(0,.38,0),.035,.48,walnut,segments=16)
        for j in range(9):
            y=.39+j*.145;r=.51*(1-j/10)
            for k in range(10):
                a=k*math.tau/10+j*.70;dx,dz=math.sin(a),math.cos(a);tip=(dx*r,y-.035,dz*r);b.tube('Fir woody branch',[(0,y+.12,0),tip],.008,walnut,segments=6)
                for h in range(3):
                    rr=r*(.55+h*.18);x,z=dx*rr,dz*rr;s=r*.23;v=[(x-dx*s,y+.15,z-dz*s),(x+math.cos(a)*s,y-.02,z-math.sin(a)*s),(x+dx*s*.9,y-.07,z+dz*s*.9),(x-math.cos(a)*s,y-.02,z+math.sin(a)*s),(x,y+.025,z)];b.mesh('Layered miniature fir foliage',v,[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],pine_light if (j+k+h)%4==0 else pine,smooth=True)
        b.tube('Tree fine light string',[(math.sin(a)*(.44*(1-t)+.05),.42+t*1.21,math.cos(a)*(.44*(1-t)+.05)) for t,a in [(i/100,i/100*math.tau*3.2) for i in range(101)]],.004,leaf,segments=5)
        for k in range(17):
            t=(k+.4)/18;a=t*math.tau*3.2;r=.44*(1-t)+.05;b.cushion('Small tree ornament',(math.sin(a)*r,.42+t*1.21,math.cos(a)*r),(.039,.045,.039),[gold,red,white][k%3],power=.8)
        b.cushion('Tree golden top ornament',(0,1.78,0),(.075,.11,.075),gold,power=.7)
    for j,p in enumerate([(2.14,.42,-2.10),(3.14,.42,-1.96)]):
        with b.frame(p,assembly='window gift '+str(j)):
            b.box('Small wrapped window gift',(0,.10,0),(.30,.20,.27),[red,cream][j],.008);b.box('Gift ribbon length',(0,.203,0),(.045,.006,.27),[gold,teal][j],.002);b.box('Gift ribbon cross',(0,.204,0),(.30,.006,.035),[gold,teal][j],.002)
    with b.frame((3.51,2.19,-3.42),-math.pi/2,'window wall artwork'):
        b.box('Small framed window-nook artwork',(0,0,0),(.44,.61,.035),walnut,.005);b.box('Small art ivory mount',(0,0,.022),(.38,.55,.008),cream,.002);b.box('Small art colored centre',(0,0,.029),(.28,.43,.005),teal,.001)
    b.layout_details={'reference':'User-selected purple-wall / blue-kitchen cutaway','footprintXZ':FOOTPRINT,'kitchen':'left wall and rear return','living':'longitudinal sofa facing right-hand television','rearBay':'raised hallway left, window bench and tree right','stageFloor':.420}
    b.camera_view=(.90,1.85,2.25)
