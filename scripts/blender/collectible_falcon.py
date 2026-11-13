"""A detailed, original UCS-style Falcon exterior, built as a physical kit study.

Plate seams follow radial structure. Fans and mandible service wells are real
openings. No random greeble scatter or photograph replaces the three-dimensional
surface. The saved native file retains individually named mechanical parts.
"""
import math
from mathutils import Vector
from collectible_builder import Builder

def build():
    b=Builder('millennium-falcon')
    gray=b.material('Light warm grey ABS','#b9bcb6',.40);pale=b.material('Ivory grey armor tiles','#d0d1c8',.43);mid=b.material('Medium stone grey plates','#929a97',.44);dark=b.material('Charcoal machinery recess','#303736',.57);black=b.material('Black grille interiors','#1f2728',.65);rust=b.material('Faded dark red plates','#8c4f43',.48);tan=b.material('Sand and ochre accents','#ac9774',.49);metal=b.material('Graphite pipe fittings','#77817e',.36,.24);blue=b.material('Rear ion engine lens','#86b9c8',.22,.1);glass=b.material('Cockpit smoked glazing','#30444b',.16,.13);radar=b.material('Printed dish engraving','#ffffff',.50,texture='public/models/collectibles/falcon-radar.png')
    cx,cz=0,-.070;rx,rz=.270,.270;cut=.43
    wells=[(cx+s*x,z) for s in (-1,1) for x,z in ((.162,-.126),(.112,-.226),(.056,-.292))]
    def radius(x,z):return math.hypot((x-cx)/rx,(z-cz)/rz)
    def deck(x,z):return .164-.052*radius(x,z)
    def polar(a,r):return (cx+rx*r*math.sin(a),cz+rz*r*math.cos(a))
    def routed(points,clearance=.043):
        # Route conduits around, rather than through, the circular fan assemblies.
        dx,dz=points[-1][0]-points[0][0],points[-1][2]-points[0][2];length=math.hypot(dx,dz);tx,tz=dx/length,dz/length;nx,nz=-tz,tx;out=[]
        choices=[1 if (points[0][0]-x)*nx+(points[0][2]-z)*nz>=0 else -1 for x,z in wells]
        for a,c in zip(points,points[1:]+[points[-1]]):
            n=max(1,math.ceil(math.dist(a,c)/.003))
            for k in range(n):
                t=k/n;x=a[0]+(c[0]-a[0])*t;z=a[2]+(c[2]-a[2])*t
                for (wx,wz),side in zip(wells,choices):
                    along=(x-wx)*tx+(z-wz)*tz;offset=(x-wx)*nx+(z-wz)*nz;R=clearance
                    if abs(along)<R:
                        wanted=math.sqrt(R*R-along*along)
                        if abs(offset)<wanted:delta=side*wanted-offset;x+=nx*delta;z+=nz*delta
                out.append((x,deck(x,z)+.009,z))
        return out
    def sector(a0,a1,r0,r1):
        n=max(2,round((a1-a0)*32));return [polar(a0+(a1-a0)*k/n,r1) for k in range(n+1)]+[polar(a1-(a1-a0)*k/n,r0) for k in range(n+1)]
    def intersect_well(obj,poly):
        lo=[min(p[k] for p in poly) for k in range(2)];hi=[max(p[k] for p in poly) for k in range(2)]
        for x,z in wells:
            rr=.0286
            if lo[0]-rr<x<hi[0]+rr and lo[1]-rr<z<hi[1]+rr:b.cut_round(obj,'Cooling-well aperture',x,z,rr)
    # Solid, sloping saucer structure, split at the cargo notch and midline trench.
    N=48
    for k in range(N):
        a0=cut+(math.tau-2*cut)*k/N;a1=cut+(math.tau-2*cut)*(k+1)/N;poly=sector(a0,a1,.001,1)
        b.solid('Lower stepped hull wedge',poly,lambda x,z:.061+.022*radius(x,z),.087,mid)
        upper=b.solid('Upper conical hull structure',poly,.101,lambda x,z:deck(x,z)-.004,dark);intersect_well(upper,poly)
        # Thick perimeter lips leave a continuous open mechanical trench.
        p=sector(a0+.001,a1-.001,.969,1.005)
        b.solid('Segmented upper rim armor',p,lambda x,z:deck(x,z)-.003,lambda x,z:deck(x,z)+.003,pale)
        b.solid('Segmented lower rim armor',p,.080,.087,gray)
    # Three courses of independent radial plates. Four broad maintenance channels
    # expose the machinery below, interrupting the otherwise radial armor layout.
    count=28;corridors={3,10,17,24};stud_count=0
    def point_in(p,poly):
        x,z=p;inside=False
        for a,c in zip(poly,poly[1:]+poly[:1]):
            if (a[1]>z)!=(c[1]>z) and x<(c[0]-a[0])*(z-a[1])/(c[1]-a[1])+a[0]:inside=not inside
        return inside
    for k in range(count):
        a0=cut+(math.tau-2*cut)*k/count+.007;a1=cut+(math.tau-2*cut)*(k+1)/count-.007
        if k in corridors:continue
        a=(a0+a1)/2
        for row,(r0,r1) in enumerate(((.17,.48),(.491,.738),(.75,.967))):
            poly=sector(a0,a1,r0,r1);mat=[gray,gray,pale,mid,gray,pale][(k+row*2)%6];obj=b.solid('Radial armor course %02d-%d'%(k,row),poly,lambda x,z:deck(x,z)-.001,lambda x,z:deck(x,z)+.0025,mat);intersect_well(obj,poly)
            # Studs are arranged along actual plate courses, not a global surface grid.
            lo=[min(p[i] for p in poly) for i in range(2)];hi=[max(p[i] for p in poly) for i in range(2)]
            for i in range(math.ceil(lo[0]/.008),math.floor(hi[0]/.008)+1):
                for j in range(math.ceil(lo[1]/.008),math.floor(hi[1]/.008)+1):
                    x,z=i*.008,j*.008;r=radius(x,z)
                    if not point_in((x,z),poly) or any(math.hypot(x-vx,z-vz)<.034 for vx,vz in wells):continue
                    if not r0+.018<r<r1-.018 or (i+j+k)%4 not in (0,1,2):continue
                    if abs((math.atan2(x-cx,z-cz)-a+math.pi)%math.tau-math.pi)>(a1-a0)*.41:continue
                    b.cylinder('Moulded plate stud',(x,deck(x,z)+.0035,z),.00225,.0018,mat,segments=12);stud_count+=1
            if row and k%3==0:
                r=(r0+r1)*.5;x,z=polar(a,r)
                if all(math.hypot(x-vx,z-vz)>.045 for vx,vz in wells):
                    b.box('Raised tile access cover',(x,deck(x,z)+.006,z),(.018,.006,.031),mid if k%4 else rust,.0012,rotation=(.18,a,0))
                    for sign in (-1,1):
                        p=polar(a+sign*.023,r);b.cylinder('Access-cover fastener',(p[0],deck(*p)+.008,p[1]),.0012,.0018,metal,segments=10)
    # Armor shoulders flank the service channels, leaving a narrow, filled trench.
    for k in corridors:
        a0=cut+(math.tau-2*cut)*k/count+.007;a1=cut+(math.tau-2*cut)*(k+1)/count-.007;a=(a0+a1)/2
        for left,right in ((a0,a-.033),(a+.033,a1)):
            for r0,r1 in ((.18,.48),(.491,.738),(.75,.967)):
                poly=sector(left,right,r0,r1);obj=b.solid('Maintenance-channel armor shoulder',poly,lambda x,z:deck(x,z)-.001,lambda x,z:deck(x,z)+.0025,gray);intersect_well(obj,poly)
    # Small brick courses and mechanical stations follow the armor geometry.
    # Raised plates stay below their pipes: deliberate attachments do not float.
    for k in range(count):
        if k in corridors:continue
        a=cut+(math.tau-2*cut)*(k+.5)/count
        for row,r in enumerate((.36,.61,.86)):
            for shift in (-.040,.032):
                aa=a+shift;x,z=polar(aa,r)
                if any(math.hypot(x-vx,z-vz)<.041 for vx,vz in wells):continue
                b.box('Small fitted armor tile',(x,deck(x,z)+.005,z),(.016,.0028,.026 if row else .019),pale if (k+row)%3 else mid,.0005,rotation=(.18,aa,0))
            if (k+row)%3==0:
                x,z=polar(a,r)
                if any(math.hypot(x-vx,z-vz)<.045 for vx,vz in wells):continue
                for side in (-1,1):
                    pts=[]
                    for j in range(6):rr=r-.045+j*.018;xx,zz=polar(a+side*.014,rr);pts.append((xx,deck(xx,zz)+.010,zz))
                    b.tube('Short panel plumbing assembly',routed(pts,.043+(.004 if side>0 else 0)),.00125,metal,segments=7)
                for rr in (r-.036,r+.036):
                    x,z=polar(a,rr)
                    if all(math.hypot(x-vx,z-vz)>.047 for vx,vz in wells):b.box('Panel pipe bracket',(x,deck(x,z)+.009,z),(.012,.003,.004),gray,.0004,rotation=(.18,a,0))
            elif (k+row)%4==1:
                x,z=polar(a,r)
                if any(math.hypot(x-vx,z-vz)<.045 for vx,vz in wells):continue
                b.box('Hull service grille backing',(x,deck(x,z)+.006,z),(.020,.003,.020),dark,.001,rotation=(.18,a,0))
                for j in range(6):
                    xx=x+math.cos(a)*(j-2.5)*.003;zz=z-math.sin(a)*(j-2.5)*.003;b.box('Service grille fine louver',(xx,deck(xx,zz)+.009,zz),(.0012,.002,.018),mid,.0002,rotation=(.18,a,0))
    # Thin terracotta and tan patch plates, grouped on identifiable armor panels.
    for a,r,w,l,mat in [(.74,.56,.020,.045,rust),(1.10,.81,.018,.036,tan),(1.95,.52,.025,.047,rust),(2.30,.88,.016,.028,tan),(3.54,.65,.022,.044,rust),(4.24,.82,.018,.026,tan),(5.40,.58,.021,.050,rust),(5.82,.80,.016,.034,tan)]:
        x,z=polar(a,r)
        if all(math.hypot(x-vx,z-vz)>.045 for vx,vz in wells):b.box('Replacement colored hull tile',(x,deck(x,z)+.007,z),(w,.0035,l),mat,.0005,rotation=(.18,a,0))
    # Long radial service channels: pipes, saddles, heat exchangers and connectors.
    for k in corridors:
        a=cut+(math.tau-2*cut)*(k+.5)/count
        for side in (-1,0,1):
            pts=[]
            for j in range(12):r=.24+j*.064;x,z=polar(a+side*.017,r);pts.append((x,deck(x,z)+.002,z))
            b.tube('Radial maintenance conduit',routed(pts,.043+(side+1)*.0045),.0018,metal if side else gray,segments=8)
        for j in range(7):
            r=.29+j*.091;x,z=polar(a,r)
            if any(math.hypot(x-vx,z-vz)<.048 for vx,vz in wells):continue
            b.box('Conduit retaining clamp',(x,deck(x,z)+.008,z),(.017,.005,.007),mid,.0006,rotation=(.18,a,0))
            if j%2:
                x,z=polar(a+.031,r);b.box('Radial service equipment block',(x,deck(x,z)+.005,z),(.011,.012,.017),dark,.001,rotation=(.18,a,0))
    # Six true recessed cooling wells, double rings, sixteen slats and bolt heads.
    for x,z in wells:
        y=deck(x,z)+.006
        b.cylinder('Cooling chamber black floor',(x,y-.012,z),.0283,.002,black,segments=40)
        profile=[(-.013,.0283),(.000,.0283),(.002,.0335),(.005,.0335),(.006,.030),(.002,.0274),(-.013,.0274)]
        b.lathe('Cooling well machined liner',(x,y,z),profile,gray,segments=48);b.ring('Cooling well outer edge',(x,y+.005,z),.0325,.0008,pale,segments=48)
        for j in range(-7,8):
            dx=j*.0032;length=2*math.sqrt(max(0,.0262**2-dx*dx));b.box('Individual recessed fan grille',(x+dx,y-.001,z),(.0012,.0024,length),metal,.0002)
        for a in (.35,1.92,3.49,5.06):b.cylinder('Cooling rim bolt',(x+math.sin(a)*.031,y+.006,z+math.cos(a)*.031),.0012,.0014,dark,segments=10)
    # Visible mechanical midline: asymmetrical connector clusters and routed pipes.
    for k in range(86):
        a=cut+(math.tau-2*cut)*(k+.5)/86;x,z=polar(a,1.000)
        if 2.04<a<4.24:continue
        b.box('Perimeter gearbox',(x,.095,z),(.011,.012,.008),[dark,metal,mid][k%3],.0008,rotation=(0,a,0))
        radial=(math.sin(a),0,math.cos(a))
        if k%2==0:
            b.cylinder('Circular perimeter coupling',(x+radial[0]*.004,.096,z+radial[2]*.004),.0035,.005,metal,direction=radial,segments=12)
            b.cylinder('Coupling dark bore',(x+radial[0]*.0066,.096,z+radial[2]*.0066),.0019,.0005,black,direction=radial,segments=10)
        if k%4==0:
            for j in range(4):b.box('Perimeter exchanger fin',(x+math.cos(a)*j*.002,.097,z-math.sin(a)*j*.002),(.0008,.013,.009),gray,.0001,rotation=(0,a,0))
    for start,end in ((.53,1.20),(1.50,1.98),(4.30,4.98),(5.25,5.79)):
        for y in (.091,.100):b.tube('Hull edge routed pipe',[(polar(start+(end-start)*j/24,1.009)[0],y,polar(start+(end-start)*j/24,1.009)[1]) for j in range(25)],.0016,metal,segments=7)
    # Rear drive lens is a continuous vertical arc, sheltered by segmented armor.
    pts=[]
    for k in range(65):a=2.08+k*(4.20-2.08)/64;x,z=polar(a,1.004);pts.append((x,.095,z))
    b.tube('Continuous blue ion drive lens',pts,.0056,blue,segments=10)
    for k in range(42):
        a=2.08+k*(4.20-2.08)/41;x,z=polar(a,1.018);b.box('Engine grille vertical rib',(x,.095,z),(.0025,.018,.003),dark,.0004,rotation=(0,a,0))
    # Reference-aligned triangular forebody and shallow nose slot.
    from collectible_falcon_forebody import add_forebody
    foretop=add_forebody(b,dict(gray=gray,pale=pale,mid=mid,dark=dark,black=black,metal=metal),cx,cz)
    # Side docking ports are concentric mechanical assemblies, not painted circles.
    for side in (-1,1):
        x=cx+side*.248;z=cz+.018;n=(side,0,0)
        b.cylinder('Side docking tunnel',(x,.106,z),.031,.041,gray,direction=n,segments=48)
        for depth,r,thick,mat in ((.021,.032,.0028,mid),(.024,.026,.0020,pale),(.027,.020,.0017,metal)):
            b.ring('Concentric docking collar',(x+side*depth,.106,z),r,thick,mat,normal=n,segments=40)
        b.cylinder('Docking port recessed face',(x+side*.025,.106,z),.019,.003,dark,direction=n,segments=40)
        for j in range(8):a=j*math.tau/8;b.box('Docking hatch radial lug',(x+side*.029,.106+math.sin(a)*.014,z+math.cos(a)*.014),(.004,.005,.006),mid,.0005,rotation=(a,0,0))
    # Cockpit access trunk: an oblique root, cylindrical cabin, and faceted canopy.
    a=Vector((cx+.149,.133,.002));c=Vector((cx+.220,.132,.128));nose=Vector((cx+.236,.129,.208));axis=(nose-c).normalized();neck=c-a
    b.cylinder('Cockpit access passage',tuple((a+c)/2),.031,neck.length,gray,direction=tuple(neck),segments=48)
    for j in range(6):p=a+neck*(j+.5)/6;b.ring('Cockpit trunk armor band',tuple(p),.0315,.0013,pale if j%2 else mid,normal=tuple(neck),segments=40)
    for j in range(5):
        t=(j+.5)/5;p=a+neck*t
        for side in (-1,1):b.box('Cockpit passage access tile',(p.x+side*.015,p.y+.026,p.z),(.014,.003,.021),pale,.001,rotation=(0,.55,0))
    # Flat side armor transitions neatly into the hull at the cabin root.
    b.solid('Cockpit root triangular armor',[(cx+.123,-.043),(cx+.207,.049),(cx+.196,.087),(cx+.117,.027)],.116,.145,gray)
    u=axis.cross(Vector((0,1,0))).normalized();v=u.cross(axis).normalized();N=10
    for j in range(N):
        a0=j*math.tau/N;a1=(j+1)*math.tau/N;vertices=[]
        for p,r in ((c,.029),(nose,.0185)):
            for aa in (a0,a1):vertices.append(tuple(p+(u*math.cos(aa)+v*math.sin(aa))*r))
        mat=glass if math.sin((a0+a1)/2)>-.25 else gray;b.mesh('Individual faceted cockpit window',vertices,[(2,3,1,0)],mat)
        b.tube('Canopy longitudinal metal frame',[vertices[0],vertices[2]],.00135,pale,segments=8)
    b.ring('Canopy aft glazing frame',tuple(c),.029,.0017,mid,normal=tuple(axis),segments=40);b.ring('Canopy forward glazing frame',tuple(nose),.0185,.0017,mid,normal=tuple(axis),segments=40)
    b.cylinder('Cockpit forward window',tuple(nose+axis*.0008),.0176,.001,glass,direction=tuple(axis),segments=10)
    for j in range(5):
        aa=j*math.tau/5;p=nose+(u*math.cos(aa)+v*math.sin(aa))*.0175;b.tube('Front viewport radial frame',[tuple(nose+axis*.0015),tuple(p+axis*.0015)],.00085,mid,segments=6)
    # Dorsal turret: concentric cap, side housings and four separate ribbed barrels.
    tx,tz=cx,cz
    b.lathe('Dorsal turret circular collar',(tx,.159,tz),[(0,.051),(.008,.051),(.012,.044),(.024,.040),(.027,.035)],mid,segments=48)
    b.cylinder('Turret top armor',(tx,.188,tz),.033,.009,pale,segments=40)
    b.box('Quad cannon pivot',(tx,.201,tz+.019),(.037,.026,.035),gray,.003)
    for side in (-1,1):
        for y in (.198,.208):
            x=tx+side*.011;b.cylinder('Separate laser cannon barrel',(x,y,tz+.069),.0022,.075,metal,direction=(0,0,1),segments=12)
            for z in (tz+.046,tz+.072,tz+.103):b.ring('Laser barrel cooling collar',(x,y,z),.0027,.0006,gray,normal=(0,0,1),segments=12)
            b.cylinder('Laser muzzle dark bore',(x,y,tz+.107),.00125,.001,black,direction=(0,0,1),segments=10)
    for side in (-1,1):b.box('Gun turret cheek housing',(tx+side*.026,.201,tz+.010),(.014,.025,.038),mid,.002)
    # Thin, concave radar dish with printed fine etching and a ribbed rear shell.
    dish=Vector((cx-.151,.198,.065));n=Vector((-.03,.78,.625)).normalized();u=n.cross(Vector((1,0,0))).normalized();v=n.cross(u).normalized();vertices=[];faces=[];uv=[];N,M=64,10
    for j in range(M+1):
        r=j/M*.040
        for k in range(N+1):
            a=k*math.tau/N;q=dish+(u*math.cos(a)+v*math.sin(a))*r+n*((r/.040)**2*.009);vertices.append(tuple(q));uv.append((.5+math.cos(a)*r/.080,.5+math.sin(a)*r/.080))
            if j and k:i=j*(N+1)+k;faces.append((i-N-2,i-1,i,i-N-1))
    obj=b.mesh('Concave engraved radar face',vertices,faces,radar,uv,smooth=True)
    # Backing dish gives thickness at every viewing angle.
    b.mesh('Radar formed back shell',[tuple(Vector(q)-n*.0016) for q in vertices],[tuple(reversed(f)) for f in faces],gray,smooth=True)
    b.ring('Radar folded rim',tuple(dish+n*.0084),.040,.0010,pale,normal=tuple(n),segments=64)
    for j in range(12):
        a=j*math.tau/12;points=[]
        for k in range(9):r=.009+k*.0037;points.append(tuple(dish+(u*math.cos(a)+v*math.sin(a))*r+n*((r/.04)**2*.009-.0020)))
        b.tube('Radar rear radial stiffener',points,.00075,mid,segments=6)
    b.cylinder('Radar central feed hub',tuple(dish+n*.003),.008,.010,mid,direction=tuple(n),segments=24)
    b.tube('Radar articulated support',[(cx-.151,.144,.065),(cx-.151,.173,.058),tuple(dish-n*.004)],.0042,metal,segments=10);b.cylinder('Radar hinge axle',(cx-.151,.173,.058),.009,.022,mid,direction=(1,0,0),segments=20)
    # Raised aft fittings and hinge ears are characteristic of the UCS exterior.
    for a in (2.02,2.54,3.72,4.23):
        x,z=polar(a,.91);y=deck(x,z)
        if any(math.hypot(x-vx,z-vz)<.058 for vx,vz in wells):continue
        b.box('Aft hinge station mounting plate',(x,y+.006,z),(.027,.006,.028),gray,.001,rotation=(.18,a,0))
        for side in (-1,1):
            xx=x+math.cos(a)*side*.009;zz=z-math.sin(a)*side*.009;b.box('Aft hinge upright ear',(xx,y+.018,zz),(.005,.022,.018),mid,.002,rotation=(0,a,0));b.cylinder('Hinge ear dark pin bore',(xx+math.cos(a)*.003,y+.023,zz-math.sin(a)*.003),.003,.0015,black,direction=(math.cos(a),0,-math.sin(a)),segments=12)
        b.cylinder('Aft hinge cross pin',(x,y+.023,z),.0024,.026,metal,direction=(math.cos(a),0,-math.sin(a)),segments=12)
    # Seven grounded gear assemblies, with joints, slanted pistons and treaded feet.
    for x,z in [(cx,.058),(cx-.077,.230),(cx+.077,.230),(cx-.191,-.027),(cx+.191,-.027),(cx-.111,-.250),(cx+.111,-.250)]:
        mount=(foretop(x,z)-.023) if z>.18 else .073
        b.box('Landing gear support housing',(x,mount-.003,z),(.037,.022,.031),dark,.003);b.cylinder('Landing gear upper hinge',(x,mount-.008,z),.011,.034,mid,direction=(1,0,0),segments=20)
        b.cylinder('Landing gear polished piston',(x,(mount+.016)/2,z),.0045,mount-.016,metal,segments=16);b.tube('Landing gear slanted brace',[(x,.020,z+.014),(x,mount-.018,z-.009)],.0032,gray,segments=10)
        b.box('Landing gear pad',(x,.008,z),(.048,.014,.039),dark,.002)
        for j in range(4):b.box('Landing foot tread',(x,.016,z-.013+j*.008),(.046,.003,.0025),mid,.0004)
    # Underside panels and access hatches remain modeled for orbit inspection.
    for k in range(16):
        a=cut+(math.tau-2*cut)*(k+.5)/16;x,z=polar(a,.60);b.box('Ventral armor service cover',(x,.058,z),(.050,.006,.046),gray,.002,rotation=(0,a,0))
        for side in (-1,1):b.cylinder('Underside fastener',(x+side*.016,.053,z),.0018,.0015,metal,direction=(0,-1,0),segments=10)
    print('FALCON_STRUCTURED_STUDS',stud_count,flush=True);b.finish((.600,.210,.840))
