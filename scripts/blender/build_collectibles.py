"""Three original, editable study models requested for the room collection.

References are recorded in design/COLLECTIBLES.md. These are authored studies,
not downloaded meshes or a claim of a part-for-part commercial kit replica.
"""
import math,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parent))
from collectible_builder import Builder

def monica():
    b=Builder('monica-apartment',1/24)
    purple=b.material('Lavender painted walls','#a89cbd',.83);teal=b.material('Turquoise kitchen','#3b9aa4',.43);cream=b.material('Cream paint','#e3d5b9',.67);wood=b.material('Honey timber','#b38c61',.64);darkwood=b.material('Dark walnut','#725541',.68);black=b.material('Iron and television','#303a38',.56);silver=b.material('Brushed sink steel','#a6afaa',.35,.65);gold=b.material('Yellow peephole frame','#deb941',.42);red=b.material('Terra cotta and red chair','#ab6756',.78);green=b.material('Green upholstery and leaves','#68805b',.82);glass=b.material('Window panes','#66817f',.24,.15);paper=b.material('Paper and plates','#f1e9d5',.78)
    rug=b.material('Floral living-room rug','#ffffff',.92,texture='public/models/collectibles/monica-rug.png')
    b.box('Cutaway diorama base',(0,.10,0),(10.8,.20,6.72),darkwood,.05)
    for i in range(27):
        for j in range(4):b.box('Individual timber floorboard',(-5.2+i*.40,.218,-2.52+j*1.68),(.392,.035,1.67),wood,.002)
    b.box('Lavender rear wall',(0,1.66,-3.28),(10.8,2.85,.14),purple,.018)
    b.box('Lavender entrance wall',(-5.33,1.66,0),(.14,2.85,6.72),purple,.018)
    b.box('Right return wall',(5.33,1.66,-2.25),(.14,2.85,2.06),purple,.018)
    for x in (-5.20,5.20):b.box('Cream wall skirting',(x,.37,-.05),(.035,.23,6.45 if x<0 else 1.9),cream,.004)
    b.box('Rear skirting',(0,.37,-3.18),(10.4,.23,.04),cream,.004)
    # Iconic purple entrance door and yellow frame around the peephole.
    b.box('Purple apartment door',(-5.228,1.42,1.40),(.045,2.22,1.02),purple,.014)
    for z in (.84,1.96):b.box('Door jamb',(-5.18,1.46,z),(.11,2.36,.08),cream,.01)
    b.box('Door lintel',(-5.18,2.66,1.4),(.11,.08,1.2),cream,.012)
    for y in (.85,1.72):
        for z in (1.16,1.64):b.box('Inset door moulding',(-5.195,y,z),(.012,.60,.36),purple,.016)
    for z in (1.21,1.59):b.box('Yellow peephole frame upright',(-5.135,1.85,z),(.045,.45,.043),gold,.012)
    for y in (1.625,2.075):b.box('Yellow peephole frame rail',(-5.135,y,1.40),(.045,.043,.42),gold,.012)
    b.cylinder('Door peephole',(-5.102,1.85,1.40),.035,.014,black,direction=(1,0,0));b.cylinder('Brass door knob',(-5.115,1.20,1.77),.043,.08,gold,direction=(1,0,0))
    # Kitchen worktop, drawers, oven, burners, sink and a curved tap.
    for x in (-4.62,-3.72,-2.82):
        b.box('Turquoise base cabinet',(x,.73,-2.57),(.84,.92,1.08),teal,.035)
        for y in (.48,.80,1.12):b.box('Inset drawer front',(x,y,-1.999),(.76,.25,.035),teal,.008);b.box('Drawer pull',(x,y,-1.97),(.24,.025,.033),silver,.008)
    b.box('Walnut kitchen counter',(-3.70,1.23,-2.53),(2.85,.10,1.22),wood,.025)
    b.box('Short return cabinet',(-4.73,.73,-1.42),(.85,.92,1.08),teal,.025);b.box('Return worktop',(-4.73,1.23,-1.45),(.98,.10,1.22),wood,.02)
    b.box('Recessed sink basin',(-4.12,1.285,-2.53),(.65,.025,.60),silver,.10)
    b.box('Dark basin interior',(-4.12,1.299,-2.53),(.47,.004,.43),black,.07)
    b.tube('Kitchen swan-neck tap',[(-4.12,1.30,-2.94),(-4.12,1.72,-2.94),(-4.12,1.82,-2.77),(-4.12,1.68,-2.64)],.025,silver)
    b.box('Oven chassis',(-1.85,.74,-2.61),(.80,.94,.91),black,.025)
    b.box('Oven glass door',(-1.85,.64,-2.137),(.63,.47,.022),glass,.025);b.box('Oven handle',(-1.85,.94,-2.10),(.55,.026,.04),silver,.006)
    for x in (-2.08,-1.65):
        for z in (-2.84,-2.39):b.ring('Four stove burners',(x,1.225,z),.13,.018,black)
    for x in (-2.10,-1.93,-1.76,-1.59):b.cylinder('Stove control dial',(x,1.10,-2.12),.046,.025,silver,direction=(0,0,1))
    for x in (-4.4,-3.3,-2.2):
        b.box('Turquoise wall cupboard',(x,2.30,-3.02),(.95,.85,.38),teal,.026)
        b.box('Cupboard shaker inset',(x,2.3,-2.81),(.80,.70,.025),teal,.012);b.box('Cupboard handle',(x+.30,2.27,-2.78),(.025,.16,.03),silver,.006)
    b.box('Cream refrigerator',(-.72,1.37,-2.67),(.85,2.15,.90),cream,.06)
    for y,h in ((2.03,.64),(1.03,1.25)):b.box('Refrigerator door',(-.72,y,-2.20),(.80,h,.045),cream,.025);b.box('Refrigerator handle',(-1.0,y,-2.16),(.026,h*.55,.04),silver,.008)
    for i in range(6):b.box('Refrigerator magnets',(-.90+(i%3)*.18,1.30+(i//3)*.22,-2.165),(.10,.12,.012),[red,gold,teal][i%3],.009)
    for x in (-4.40,-4.04,-3.68):
        b.cylinder('Counter crockery cup',(x,1.42,-2.12),.10,.24,[paper,red,green][round(abs(x)*10)%3]);b.ring('Cup rolled rim',(x,1.55,-2.12),.10,.012,paper)
    b.tube('Hanging pot rail',[(-3.0,1.88,-3.12),(-1.5,1.88,-3.12)],.02,silver)
    for x in (-2.8,-2.3):b.cylinder('Hanging pan',(x,1.64,-3.06),.18,.035,black,direction=(0,0,1));b.box('Pan handle',(x,1.90,-3.05),(.055,.22,.04),black,.01)
    # Tall living-room window with grilles and curtains.
    b.box('Large living-room window recess',(2.7,1.82,-3.184),(3.38,2.02,.02),glass,.01)
    for x in (1.0,2.14,3.28,4.42):b.box('Living-room window mullion',(x,1.82,-3.145),(.075,2.08,.065),darkwood,.008)
    for y in (.79,1.82,2.85):b.box('Living-room window transom',(2.71,y,-3.145),(3.51,.065,.065),darkwood,.006)
    b.box('Wide window sill',(2.71,.74,-3.02),(3.68,.11,.34),cream,.015)
    for x in (.82,4.60):
        for j in range(5):b.cylinder('Gathered window curtain',(x+j*.055,1.80,-2.99),.045,2.12,cream)
    # Circular dining table and four mismatched chairs.
    b.cylinder('Round dining tabletop',(-1.60,1.05,.30),.75,.085,wood);b.cylinder('Dining pedestal',(-1.60,.66,.30),.075,.72,darkwood)
    for i,color in enumerate((red,gold,teal,cream)):
        a=i*math.pi/2;x=-1.60+math.sin(a)*1.12;z=.30+math.cos(a)*1.12
        b.box('Dining chair seat',(x,.68,z),(.52,.065,.50),color,.035)
        for dx in (-.20,.20):
            for dz in (-.19,.19):b.box('Dining chair slender leg',(x+dx,.45,z+dz),(.045,.43,.045),darkwood,.006)
        b.box('Dining chair back',(x+math.sin(a)*.21,1.03,z+math.cos(a)*.21),(.50,.68,.055),color,.025,rotation=(0,a,0))
    for x,z in [(-1.89,.24),(-1.31,.30)]:b.cylinder('Dining plate',(x,1.104,z),.18,.018,paper)
    # Living-room rug, cream sofa, green ottoman, coffee table and CRT television.
    b.mesh('Floral rug',[(.3,.253,-.10),(4.5,.253,-.10),(4.5,.253,2.65),(.3,.253,2.65)],[(0,1,2,3)],rug,[(0,0),(1,0),(1,1),(0,1)])
    b.box('Cream sofa plinth',(2.45,.46,-.55),(2.90,.35,1.02),darkwood,.05)
    b.box('Cream sofa seat',(2.45,.69,-.45),(2.75,.30,.92),cream,.12);b.box('Cream sofa padded back',(2.45,1.10,-.97),(2.88,.96,.27),cream,.12)
    for x in (1.02,3.88):b.box('Sofa rounded arm',(x,.88,-.51),(.26,.62,1.0),cream,.10)
    for x,color in [(1.48,red),(3.32,gold)]:b.box('Sofa patterned pillow',(x,1.00,-.67),(.46,.40,.18),color,.08,rotation=(.18,0,.12 if x<2 else -.10))
    b.box('Green living-room ottoman',(.68,.55,1.14),(.66,.58,.65),green,.10)
    b.box('Walnut coffee table',(2.32,.76,1.13),(1.52,.09,.76),darkwood,.04)
    for x in (1.72,2.92):
        for z in (.86,1.40):b.box('Coffee-table turned leg',(x,.52,z),(.065,.43,.065),wood,.012)
    for i,color in enumerate((red,paper,teal)):b.box('Coffee-table magazine',(2.05,.825+i*.026,1.1),(.43,.022,.38),color,.004)
    b.cylinder('Coffee mug',(2.70,.94,1.10),.085,.22,paper)
    b.box('Television console',(2.8,.60,2.63),(1.65,.68,.56),darkwood,.03)
    b.box('Vintage CRT television',(2.8,1.15,2.60),(1.0,.68,.57),black,.07)
    b.box('CRT convex screen',(2.8,1.17,2.297),(.76,.48,.025),glass,.05)
    for x in (3.22,3.35):b.cylinder('Television control knob',(x,1.06,2.288),.045,.028,silver,direction=(0,0,1))
    # A warm upholstered armchair and a broad-leaf plant near the window.
    b.box('Brown armchair seat',(4.52,.65,1.33),(.72,.27,.78),red,.10);b.box('Brown armchair back',(4.52,1.02,1.64),(.78,.85,.23),red,.10)
    b.cylinder('Window plant pot',(4.85,.49,-2.42),.23,.47,red,r2=.28)
    for i in range(9):
        a=i*2.399;tip=(4.85+math.sin(a)*.36,1.03+i%3*.14,-2.42+math.cos(a)*.28);b.tube('Mini plant petiole',[(4.85,.72,-2.42),tip],.012,green)
        b.mesh('Mini botanical leaf',[tip,(tip[0]-.10,tip[1]+.03,tip[2]+.12),(tip[0],tip[1]+.17,tip[2]+.27),(tip[0]+.10,tip[1]+.03,tip[2]+.12)],[(0,1,2,3)],green,smooth=True)
    b.finish((.45,.128,.28))

def falcon():
    b=Builder('millennium-falcon');gray=b.material('Light grey ABS','#babbb5',.42);mid=b.material('Weathered grey ABS','#969c99',.48);pale=b.material('Ivory plates','#d7d6cb',.47);dark=b.material('Charcoal recesses','#30393b',.56);rust=b.material('Muted red tiles','#784b40',.52);ochre=b.material('Tan tiles','#aa9773',.55);blue=b.material('Engine glass','#7eabb4',.25,.1);metal=b.material('Gunmetal fittings','#6e7878',.38,.32);glass=b.material('Smoked cockpit glazing','#556b72',.17,.12)
    cx,cz=-.02,-.115;rx,rz=.265,.275;N=112
    verts=[];faces=[]
    for radius,y in [(1,.078),(1,.117),(.91,.142),(.20,.161)]:
        for i in range(N):a=i*math.tau/N;verts.append((cx+rx*radius*math.sin(a),y,cz+rz*radius*math.cos(a)))
    for row in range(3):
        for i in range(N):j=(i+1)%N;n=row*N;faces.append((n+i,n+j,n+N+j,n+N+i))
    faces.extend([tuple(reversed(range(N))),tuple(range(3*N,4*N))]);b.mesh('Layered saucer hull',verts,faces,gray,smooth=True)
    # Distinct radial hull plates, shallow conical deck and narrow seams.
    for sector in range(20):
        a0=sector*math.tau/20+.004;a1=(sector+1)*math.tau/20-.004;v=[]
        for r in (.18,.96):
            for k in range(7):a=a0+(a1-a0)*k/6;v.append((cx+rx*r*math.sin(a),.150+.014*(1-r),cz+rz*r*math.cos(a)))
        b.mesh('Individual wedge hull panel',v,[(k,k+1,k+8,k+7) for k in range(6)],[gray,pale,gray,mid][sector%4])
    # Mandibles: actual tapered, separated prongs rather than a filled disk.
    for side in (-1,1):
        x0=side*.045;x1=side*.178;xt=side*.145;v=[(x0,y,z) for y in (.078,.128) for z in (.055,.45)]+[(x1,.078,.055),(xt,.078,.45),(x1,.128,.055),(xt,.128,.45)]
        b.mesh('Tapered forward mandible',v,[(0,1,5,4),(2,6,7,3),(0,4,6,2),(1,3,7,5),(0,2,3,1),(4,5,7,6)],gray)
        for k in range(9):
            z=.09+k*.037;b.box('Mandible tile',(side*.108,.133,z),(.10,.008,.032),pale,.001)
            for x in (side*.068,side*.145):
                for zz in (z-.008,z+.008):b.cylinder('Mandible brick stud',(x,.139,zz),.0024,.0018,gray,segments=16)
        for z in (.19,.29):b.cylinder('Mandible recessed socket',(side*.112,.139,z),.016,.005,dark);b.ring('Socket bezel',(side*.112,.142,z),.017,.0015,mid)
        b.tube('Mandible maintenance pipe',[(side*.18,.138,.07),(side*.14,.141,.21),(side*.13,.141,.40)],.0018,metal)
        # Tiled nose cap and recessed machinery prevent a plain block end.
        for k in range(4):
            x=side*(.061+k*.022);b.box('Mandible nose recess',(x,.103,.451),(.014,.027,.0018),dark,.001)
            b.cylinder('Nose coupling',(x,.103,.453),.004,.003,metal,direction=(0,0,1),segments=16)
        b.box('Mandible upper nose lip',(side*.101,.126,.452),(.102,.006,.006),mid,.001)
    # Low Lego brick courses and studs, leaving tiled portions and fan wells clear.
    for i in range(-31,32):
        for j in range(-32,33):
            x=cx+i*.008;z=cz+j*.008;r=math.hypot((x-cx)/rx,(z-cz)/rz)
            if .22<r<.91 and (i%4==0 or j%4==0):
                if any(math.hypot(x-vx,z-vz)<.036 for vx,vz in [(-.16,-.19),(-.07,-.28),(.04,-.28),(.13,-.19),(-.12,-.34),(.09,-.34)]):continue
                b.cylinder('ABS top stud',(x,.151+.014*(1-r)+.001,z),.0024,.0018,gray,segments=16)
    for i in range(124):
        a=i*2.399;r=.25+.63*((i*37%103)/103);x=cx+rx*r*math.sin(a);z=cz+rz*r*math.cos(a)
        if z>.04 and abs(x)<.17:continue
        b.box('Greeble plate',(x,.158+.014*(1-r),z),(.008*(1+i%3),.004,.008*(1+(i//3)%3)),[gray,mid,pale,rust,ochre][i%5],.0007,rotation=(0,(i%4)*math.pi/2,0))
    for i in range(80):
        a=i*math.tau/80;x=cx+rx*.992*math.sin(a);z=cz+rz*.992*math.cos(a)
        b.box('Exposed perimeter machinery',(x,.100,z),(.014,.019,.008),dark,.0006,rotation=(0,a,0));b.box('Edge bracket',(x,.119,z),(.017,.006,.011),mid,.0007,rotation=(0,a,0))
    # Six rear cooling fans with individual slats and concentric rims.
    for x,z in [(-.16,-.19),(-.07,-.28),(.04,-.28),(.13,-.19),(-.12,-.34),(.09,-.34)]:
        b.cylinder('Dark engine cooling well',(x,.155,z),.027,.008,dark);b.ring('Circular cooling vent rim',(x,.162,z),.028,.003,gray)
        for k in range(-5,6):
            xx=k*.0044;length=2*math.sqrt(max(0,.024**2-xx**2));b.box('Cooling vent slat',(x+xx,.162,z),(.0015,.002,length),metal,.0002)
    points=[(cx+rx*math.sin(a),.094,cz+rz*math.cos(a)) for a in [math.pi*.66+k/48*math.pi*.68 for k in range(49)]];b.tube('Rear blue ion-engine band',points,.0065,blue)
    # Offset cockpit and cylindrical access neck, with a framed glazed canopy.
    a=(.17,.125,.035);c=(.274,.125,.16);direction=tuple(c[k]-a[k] for k in range(3));length=math.dist(a,c)
    b.cylinder('Cockpit access tube',tuple((a[k]+c[k])/2 for k in range(3)),.031,length,gray,direction=direction)
    for t in (.25,.5,.75):p=tuple(a[k]+direction[k]*t for k in range(3));b.ring('Access-tube joint',p,.0315,.0017,mid,normal=direction)
    nose=(.299,.125,.233);axis=tuple(nose[k]-c[k] for k in range(3));b.cylinder('Cockpit glazed canopy',tuple((nose[k]+c[k])/2 for k in range(3)),.029,math.dist(nose,c),glass,direction=axis,r2=.019)
    b.cylinder('Cockpit forward glazing',nose,.019,.0015,glass,direction=axis)
    # Canopy ribs follow the cone and visibly divide the window panes.
    import mathutils
    forward=mathutils.Vector(axis).normalized();side=forward.cross(mathutils.Vector((0,1,0))).normalized();up=side.cross(forward).normalized()
    for i in range(8):
        a=i*math.tau/8;v=side*math.cos(a)+up*math.sin(a);p0=tuple(mathutils.Vector(c)+v*.029);p1=tuple(mathutils.Vector(nose)+v*.019);b.tube('Cockpit canopy frame',[p0,p1],.0013,mid)
    b.ring('Cockpit canopy rear frame',c,.029,.0018,mid,normal=axis);b.ring('Cockpit canopy nose frame',nose,.019,.0015,mid,normal=axis)
    # Radar dish, gunnery turret, four barrels and seven landing feet.
    b.cylinder('Gunnery turret',(cx,.173,.003),.032,.018,mid);b.cylinder('Turret top cap',(cx,.184,.003),.027,.008,pale)
    for x in (cx-.012,cx+.012):
        for y in (.187,.194):b.cylinder('Quad laser barrel',(x,y,.040),.0017,.055,metal,direction=(0,0,1),segments=16)
    dish=(-.17,.192,.067);normal=mathutils.Vector((.10,.70,.71)).normalized();v=normal.cross(mathutils.Vector((1,0,0))).normalized();w=normal.cross(v).normalized();verts=[];faces=[]
    for row in range(9):
        r=row/8*.040
        for k in range(49):
            a=k*math.tau/48;q=mathutils.Vector(dish)+(v*math.cos(a)+w*math.sin(a))*r+normal*(r/.04)**2*.009;verts.append(tuple(q))
            if row and k:n=row*49+k;faces.append((n-50,n-49,n,n-1))
    b.mesh('Concave radar reflector',verts,faces,pale,smooth=True);b.ring('Radar rim',tuple(mathutils.Vector(dish)+normal*.009),.040,.0017,gray,normal=tuple(normal))
    for i in range(12):
        a=i*math.tau/12;p=tuple(mathutils.Vector(dish)+(v*math.cos(a)+w*math.sin(a))*.037+normal*.008);b.tube('Radar radial rib',[dish,p],.0007,mid)
    b.tube('Radar support',[(-.17,.15,.065),dish],.004,metal)
    for x,z in [(0,.31),(-.12,.23),(.12,.23),(-.18,-.12),(.18,-.12),(-.12,-.30),(.12,-.30)]:
        b.cylinder('Landing piston',(x,.048,z),.006,.055,metal);b.box('Landing-leg hinge',(x,.069,z),(.026,.015,.021),dark,.002);b.box('Landing foot',(x,.014,z),(.041,.018,.034),mid,.003)
    b.finish((.60,.21,.84))

def willow():
    b=Builder('wish-willow');paper=b.material('Folded ivory cardboard','#f1eddf',.86);label=b.material('Red One Wish Willow lettering','#ffffff',.85,texture='public/models/collectibles/wish-label.png');twig=b.material('Dark willow bark','#332923',.94);fiber=b.material('Fine bark fibres','#54473a',.95);wick=b.material('Charred middle','#191a17',.97)
    side=.14;height=side*math.sqrt(2/3);cx=-.055
    p=[(cx-side/2,0,side/(2*math.sqrt(3))),(cx+side/2,0,side/(2*math.sqrt(3))),(cx,0,-side/math.sqrt(3)),(cx,height,0)]
    b.mesh('Triangular cardboard base',p[:3],[(2,1,0)],paper)
    for a,c in [(0,1),(1,2),(2,0)]:
        b.mesh('Printed triangular package face',[p[a],p[c],p[3]],[(0,1,2)],label,[(0,0),(1,0),(.5,1)])
        b.tube('Folded cardboard seam',[p[a],p[3]],.0005,paper)
    b.tube('One Wish Willow twig',[(.032,.007,.012),(.055,.009,.002),(.083,.006,.005),(.108,.008,-.004),(.135,.006,.004)],.0029,twig,segments=14)
    b.tube('Willow small branch',[(.055,.009,.002),(.066,.014,-.015),(.077,.014,-.023)],.0013,twig)
    b.cylinder('Blackened spark middle',(.083,.006,.005),.0034,.008,wick,direction=(1,0,0))
    for i in range(8):
        z=.002+i*.0004;b.tube('Raised natural bark fibre',[(.035,.009,z+.01),(.056,.011,z),(.079,.008,z+.003)],.00020,fiber,segments=6)
    b.finish((.26,.12,.14))

for name,fn in [('monica-apartment',monica),('millennium-falcon',falcon),('wish-willow',willow)]:
    if '--only' in sys.argv and name not in sys.argv[sys.argv.index('--only')+1:]:continue
    print('BUILDING_COLLECTIBLE',name,flush=True);fn()
