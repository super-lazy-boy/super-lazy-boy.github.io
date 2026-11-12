"""Hand-authored soft furnishings, flowers, lighting and collectible artwork.

Dimensions use the established room scale (approximately .45 m per scene unit).
The builder passes its geometry helpers so all assets share materials and export.
"""
import bpy,math
from mathutils import Vector,Matrix

def seat_top(r,a):
    back=max(0,min(1,(math.cos(a)+.25)/1.1));rim=.46+1.02*back+.08*abs(math.sin(a))**3
    t=max(0,min(1,(r-.38)/.62));t=t*t*(3-2*t)
    crease=.006*math.sin(a*15+r*9)*t*math.sin(r*math.pi)
    return (3+.96*math.sin(a)*r,.36+.07*r*r+(rim-.43)*t+crease,.85+1.10*math.cos(a)*r)

def lumbar_geometry():
    # Both faces follow the actual chair surface, including the rising sides.
    # The underside retains clearance rather than cutting a box into the shell.
    verts=[];faces=[];uv=[];cols,rows=29,17
    for layer in range(2):
        for row in range(rows):
            v=row/(rows-1)
            for col in range(cols):
                u=col/(cols-1);x=3+(u-.5)*.84*(.92+.08*math.sin(math.pi*v));z=1.37+v*.35
                r=math.hypot((x-3)/.96,(z-.85)/1.1);a=math.atan2((x-3)/.96,(z-.85)/1.1)
                thickness=.035+.15*max(0,math.sin(math.pi*u)*math.sin(math.pi*v))**.65
                verts.append((x,seat_top(r,a)[1]+.027+layer*thickness,z));uv.append((u,v))
                if row and col:
                    n=layer*rows*cols+row*cols+col;face=(n-cols-1,n-1,n,n-cols)
                    faces.append(face if layer else tuple(reversed(face)))
    perimeter=[*range(cols),*[row*cols+cols-1 for row in range(1,rows)],*range(rows*cols-2,(rows-1)*cols-1,-1),*[row*cols for row in range(rows-2,0,-1)]]
    offset=rows*cols
    for i,a in enumerate(perimeter):
        b=perimeter[(i+1)%len(perimeter)];faces.append((a,b,b+offset,a+offset))
    return verts,faces,uv

def enrich(g):
    box,cyl,sphere,tube,ring=(g[k] for k in ('box','cylinder','sphere','tube','ring'))
    asset,tag,xyz=(g[k] for k in ('asset','tag','xyz'))
    white,ivory,oak,linen,sage,edge,ink,silver,paper,green,lightgreen,soil=(g[k] for k in ('white','ivory','oak','linen','sage','edge','ink','silver','paper','green','lightgreen','soil'))
    rug=g['rugmat'];ochre=g['ochre'];brass=g['brass'];dp=g['dp']
    petal=g['material']('Flower petals ivory','#fff9ed',.78)
    pollen=g['material']('Daisy ochre centres','#d9b454',.83)
    jasmine_leaf=g['material']('Jasmine waxed leaf','#405f40',.55)
    basket=g['material']('Natural woven willow','#b6a083',.82)
    glow=g['material']('Warm lamp diffuser','#fff0cd',.55)
    bs=glow.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=(1,.72,.39,1);bs.inputs['Emission Strength'].default_value=.0

    def mesh(name,verts,faces,mat,uvs=None):
        data=bpy.data.meshes.new(name);data.from_pydata([xyz(p) for p in verts],[],faces);data.update()
        o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o);tag(o,name,mat)
        for face in data.polygons:face.use_smooth=True
        if uvs:
            layer=data.uv_layers.new()
            for loop in data.loops:layer.data[loop.index].uv=uvs[loop.vertex_index]
        return o
    def leaf(name,start,tip,width,mat=green):
        a,b=Vector(start),Vector(tip);direction=b-a;side=Vector((-direction.z,0,direction.x)).normalized()
        verts=[];faces=[]
        for row in range(11):
            t=row/10;mid=a+direction*t+Vector((0,math.sin(math.pi*t)*width*.32,0));w=width*math.sin(math.pi*t)**.85
            for k in (-1,0,1):
                p=mid+side*w*k;p.y-=abs(k)*width*.12;verts.append(tuple(p))
            if row:
                n=row*3
                for k in (0,1):faces.append((n-3+k,n+k,n+k+1,n-2+k))
        mesh(name,verts,faces,mat)
        tube(name+' vein',[start,tuple((a+b)/2+Vector((0,width*.35,0))),tip],.0018,g['vein'])
    def pot(p,r=.16,h=.26):
        x,y,z=p
        cyl('Flower pot saucer',(x,y+.012,z),r*1.12,.024,ivory)
        cyl('Glazed flower pot',(x,y+h/2+.024,z),r,h,white,r2=r*.77)
        ring('Pot rolled rim',(x,y+h+.022,z),r,.010,white)
        cyl('Recessed pot soil',(x,y+h+.012,z),r*.91,.008,soil)
        return y+h+.025
    def flower(p,r=.09,count=16,jasmine=False,angle=0):
        x,y,z=p
        for i in range(count):
            a=angle+i*math.tau/count;verts=[];faces=[]
            for row in range(8):
                t=row/7;distance=r*(.15+.85*t);w=r*(.20 if jasmine else .115)*math.sin(t*math.pi)**.6
                for side in (-1,0,1):
                    verts.append((x+math.cos(a)*distance-math.sin(a)*w*side,y+math.sin(t*math.pi)*r*.20+(t*t)*r*.11-abs(side)*r*.035,z+math.sin(a)*distance+math.cos(a)*w*side))
                if row:
                    n=row*3
                    for k in (0,1):faces.append((n-3+k,n+k,n+k+1,n-2+k))
            mesh('Jasmine corolla' if jasmine else 'Daisy ray petal',verts,faces,petal)
        sphere('Flower central disc',(x,y+.007,z),(r*.21,r*.09,r*.21),petal if jasmine else pollen)
        if not jasmine:
            for i in range(13):
                a=i*2.399;rr=r*.17*math.sqrt(i/13);sphere('Disc florets',(x+rr*math.cos(a),y+.015,z+rr*math.sin(a)),(.003,.003,.003),pollen)
    def daisies(p,scale=1):
        x,y,z=p;top=pot(p,.18*scale,.28*scale)
        for i in range(9):
            a=i*2.399;dx=math.cos(a)*(.04+i%3*.045)*scale;dz=math.sin(a)*(.04+i%3*.045)*scale
            h=(.34+(i%4)*.065)*scale;end=(x+dx,top+h,z+dz)
            tube('Daisy stem',[(x,top,z),(x+dx*.45,top+h*.55,z+dz*.45),end],.0035*scale,green)
            leaf('Daisy basal leaf',(x,top+.04,z),(x+math.cos(a)*.18*scale,top+.15*scale,z+math.sin(a)*.18*scale),.023*scale)
            flower(end,(.074+i%3*.007)*scale,18,angle=a)
    def jasmine(p,scale=1):
        x,y,z=p;top=pot(p,.15*scale,.23*scale)
        for i in range(6):
            a=i*2.399;end=(x+math.cos(a)*.12*scale,top+(.24+i%3*.08)*scale,z+math.sin(a)*.12*scale)
            tube('Jasmine branching stem',[(x,top,z),(x+math.cos(a)*.06*scale,top+.18*scale,z+math.sin(a)*.06*scale),end],.004*scale,green)
            for side in (-1,1):
                start=(x+math.cos(a)*.04*scale,top+.14*scale,z+math.sin(a)*.04*scale)
                tip=(start[0]+math.cos(a+side*.8)*.12*scale,start[1]+.06*scale,start[2]+math.sin(a+side*.8)*.12*scale)
                leaf('Jasmine oval leaf',start,tip,.037*scale,jasmine_leaf)
            flower(end,.048*scale,7,True,a)
            sphere('Closed jasmine bud',(end[0]+.037*scale,end[1]-.018*scale,end[2]+.025*scale),(.013*scale,.025*scale,.013*scale),petal)

    # An original continuous upholstered shell, with a recessed seat and a high
    # curved rear rim. There are no stacked box-shaped back cushions.
    asset('lounge')
    box('Woven lounge rug',(3.0,.017,.75),(3.75,.034,4.30),rug,.015)
    for x in (1.21,4.79):
        for j in range(2):box('Rug bound edge',(x+j*.028,.036,.75),(.008,.002,4.12),ivory,0)
    for i in range(48):
        for z in (-1.43,2.93):tube('Cotton fringe',[(1.2+i*.076,.018,z),(1.2+i*.076,.016,z+(.06 if z>0 else -.06))],.003,rug)
    box('Low oak tatami platform',(3,.13,.85),(2.14,.19,2.52),oak,.05)
    for x in (2.12,3.88):
        for z in (-.16,1.85):box('Recessed platform foot',(x,.052,z),(.13,.04,.16),ivory,.015)
    top=seat_top
    verts=[];faces=[];uv=[]
    for row in range(37):
        for col in range(81):
            r=row/36;a=col/80*math.tau;verts.append(top(r,a));uv.append((col/80*2,row/36*2))
            if row and col:n=row*81+col;faces.append((n-82,n-81,n,n-1))
    mesh('Sculpted linen seat surface',verts,faces,linen,uv)
    verts=[];faces=[];uv=[]
    for row in range(23):
        t=row/22
        for col in range(81):
            a=col/80*math.tau;rim=top(1,a);s=1+.035*math.sin(t*math.pi)-.07*t
            verts.append((3+(rim[0]-3)*s,rim[1]*(1-t)+.227*t,.85+(rim[2]-.85)*s));uv.append((col/80*2,t))
            if row and col:n=row*81+col;faces.append((n-82,n-1,n,n-81))
    mesh('Sculpted upholstery sidewall',verts,faces,linen,uv)
    tube('Continuous upholstery welt',[tuple(Vector(top(1,i/96*math.tau))+Vector((0,.006,0))) for i in range(97)],.008,edge)
    for a in (0,1.25,-1.25,2.4,-2.4):
        rim=top(1,a);tube('Upholstery side seam',[(rim[0],rim[1]-.01,rim[2]),(3+(rim[0]-3)*1.012,rim[1]*.6+.09,.85+(rim[2]-.85)*1.012),(3+(rim[0]-3)*.93,.24,.85+(rim[2]-.85)*.93)],.0028,edge)
    g['register']('single lounge envelope',[1.95,.04,-.42],[4.08,1.55,2.14])
    # Foot cushion and a genuinely supported lumbar cushion.
    box('Footstool oak tray',(3,.12,-.92),(1.48,.12,.88),oak,.035)
    box('Footstool woven cushion',(3,.32,-.92),(1.43,.30,.85),linen,.11)
    for x in (2.43,3.57):
        for z in (-1.21,-.63):box('Footstool hidden foot',(x,.052,z),(.10,.035,.10),ivory,.01)
    asset('soft furnishings')
    pillow_verts,pillow_faces,pillow_uv=lumbar_geometry()
    mesh('Lumbar cushion',pillow_verts,pillow_faces,sage,pillow_uv)
    box('Floor cushion',(1.48,.20,1.65),(.68,.32,.70),linen,.10,yaw=.18)
    # A thin throw follows the actual parametric seat, with positive clearance.
    verts=[];faces=[];uv=[]
    for row in range(33):
        for col in range(25):
            x=2.32+col/24*.63;z=.29+row/32*.65
            dx=(x-3)/.96;dz=(z-.85)/1.10;r=math.hypot(dx,dz);a=math.atan2(dx,dz)
            y=top(r,a)[1]+.026+.009*math.sin(col*.65+row*.23)**2
            verts.append((x,y,z));uv.append((col/24,row/32))
            if row and col:n=row*25+col;faces.append((n-26,n-25,n,n-1))
    mesh('Soft draped oat throw',verts,faces,g['ochre'],uv)
    for i in range(15):
        x=2.33+i*.043;z=.29;r=math.hypot((x-3)/.96,(z-.85)/1.10);a=math.atan2((x-3)/.96,(z-.85)/1.10);y=top(r,a)[1]+.03
        tube('Throw fringe',[(x,y,z),(x+.005,y-.006,z-.035)],.0024,edge)

    asset('side table')
    cyl('Side table oak top',(4.85,.79,1.10),.48,.055,oak)
    for i in range(3):
        a=i*math.tau/3;tube('Side table splayed leg',[(4.85+math.sin(a)*.26,.76,1.10+math.cos(a)*.26),(4.85+math.sin(a)*.34,.04,1.10+math.cos(a)*.34)],.022,silver)
    cyl('Cup coaster',(4.69,.825,1.00),.13,.008,ivory);g['mug']((4.69,.83,1.00),.085)
    asset('game controller')
    cx,cy,cz=5.03,.89,1.30
    outline=[(-.23,-.10),(-.26,.06),(-.18,.17),(-.11,.13),(0,.10),(.11,.13),(.18,.17),(.26,.06),(.23,-.10),(0,-.14)]
    v=[(cx+x,cy+h,cz+z) for h in (-.04,.04) for x,z in outline];n=len(outline)
    f=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    o=mesh('Ergonomic game controller shell',v,f,white);bevel=o.modifiers.new('Sculpted shell edges','BEVEL');bevel.width=.028;bevel.segments=4;o.modifiers.new('Weighted shell normals','WEIGHTED_NORMAL')
    box('Controller charging dock',(5.03,.839,1.30),(.40,.035,.22),ivory,.018)
    for x in (-.10,.10):
        cyl('Analogue stick shaft',(cx+x,cy+.055,cz+.025),.013,.028,ink)
        cyl('Textured analogue cap',(cx+x,cy+.076,cz+.025),.029,.020,g['rubber'])
        ring('Analogue cap rim',(cx+x,cy+.088,cz+.025),.021,.003,edge)
    for x,z in ((-.17,-.05),(.17,-.05)):
        if x<0:
            box('D pad horizontal',(cx+x,cy+.052,cz+z),(.07,.018,.024),ink,.005)
            box('D pad vertical',(cx+x,cy+.053,cz+z),(.024,.018,.07),ink,.005)
        else:
            for a in (0,math.pi/2,math.pi,math.pi*1.5):cyl('Controller action button',(cx+x+math.sin(a)*.028,cy+.054,cz+z+math.cos(a)*.028),.010,.018,ink)
    for x in (-.16,.16):box('Shoulder trigger',(cx+x,cy+.003,cz-.125),(.085,.042,.035),ink,.012)
    cyl('Controller home button',(cx,cy+.048,cz-.055),.012,.010,silver)

    asset('flower stand')
    for y in (.78,1.37):box('Window flower stand shelf',(-5.36,y,1.82),(.92,.055,.65),oak,.018)
    for x in (-5.73,-4.99):
        for z in (1.57,2.07):box('Flower stand upright',(x,.70,z),(.035,1.36,.035),white,.005)
    asset('flowers daisies');daisies((-5.36,1.40,1.82),.90)
    asset('flowers jasmine');jasmine(dp((1.65,1.69,.37)),.65)
    jasmine((-5.36,.81,1.82),.60)
    asset('shelf greenery')
    # A separate trailing plant, hanging down the OUTSIDE of the bookcase.
    top=pot((-.02,4.38,-3.74),.14,.20)
    for strand in range(3):
        pts=[]
        for k in range(9):pts.append((.74+strand*.05+math.sin(k*.9)*.03,top-k*.12,-3.72+strand*.055))
        tube('Trailing pothos vine',[(-.02,top,-3.74),(.70,top-.05,-3.68),*pts],.004,green)
        for k,p in enumerate(pts[2:]):leaf('Pothos heart leaf',p,(p[0]+(.10 if k%2 else -.10),p[1]-.07,p[2]+.05),.045,lightgreen)

    asset('storage basket')
    bx,bz=1.42,2.45
    for row in range(20):
        y=.07+row*.022;r=.24+row*.002
        ring('Woven basket horizontal',(bx,y,bz),r,.005,basket)
    for i in range(28):
        a=i*math.tau/28;tube('Basket warp',[(bx+.24*math.cos(a),.05,bz+.24*math.sin(a)),(bx+.26*math.cos(a),.25,bz+.26*math.sin(a)),(bx+.28*math.cos(a),.50,bz+.28*math.sin(a))],.005,basket)
    cyl('Basket base',(bx,.052,bz),.24,.025,basket)
    ring('Basket rolled rim',(bx,.50,bz),.28,.014,basket)
    for side in (-1,1):tube('Basket loop handle',[(bx+side*.27,.40,bz-.06),(bx+side*.30,.59,bz),(bx+side*.27,.40,bz+.06)],.010,basket)
    box('Folded linen in basket',(bx,.49,bz),(.32,.09,.29),linen,.035,yaw=.08)

    asset('floor lamp')
    cyl('Floor lamp weighted foot',(5.65,.035,1.9),.27,.07,white)
    tube('Floor lamp arched stem',[(5.65,.06,1.9),(5.65,2.9,1.9),(5.58,3.48,1.9),(5.30,3.59,1.9)],.018,brass)
    # Open shade: light exits below, with a separately switchable diffuser.
    verts=[];faces=[];uv=[]
    for row,(r,y) in enumerate(((.30,3.28),(.20,3.71))):
        for i in range(65):
            a=i/64*math.tau;verts.append((5.30+r*math.cos(a),y,1.9+r*math.sin(a)));uv.append((i/64,row))
            if row and i:n=65+i;faces.append((n-66,n-65,n,n-1))
    mesh('Linen floor lamp shade',verts,faces,linen,uv)
    for r,y in ((.30,3.28),(.20,3.71)):ring('Shade binding',(5.30,y,1.9),r,.008,edge)
    asset('floor lamp glow');cyl('Floor lamp diffuser',(5.30,3.28,1.9),.286,.009,glow)
    # Desk diffuser uses the same warm, controlled emissive material.
    asset('desk lamp glow')
    lp=dp((-1.64,1.69,-.575));cyl('Desk lamp diffuser',(lp[0]+.16,lp[1]+.64,lp[2]),.15,.009,glow)

    asset('picture light')
    box('Picture lamp wall plate',(-6.40,4.35,-3.30),(.035,.08,.25),white,.01)
    tube('Picture light bracket',[(-6.38,4.35,-3.30),(-6.15,4.35,-3.30),(-6.10,4.27,-3.30)],.012,brass)
    box('Picture light housing',(-6.10,4.27,-3.30),(.09,.055,.82),ivory,.018)
    asset('picture lamp glow');box('Picture light diffuser',(-6.10,4.236,-3.30),(.06,.008,.75),glow,.002)
    asset('shelf light')
    for y in (.9215,2.5615,4.2015):box('Shelf concealed light channel',(-1.9,y,-3.49),(4.45,.018,.045),ivory,.006)
    asset('shelf lamp glow')
    for y in (.9095,2.5495,4.1895):box('Shelf warm LED diffuser',(-1.9,y,-3.49),(4.38,.006,.025),glow,.002)

    # Museum-referenced reproduction on a real canvas and four mitred frame rails.
    asset('starry night');before=set(bpy.data.objects)
    art=g['material']('The Starry Night reproduction','#ffffff',.88)
    node=art.node_tree.nodes.new('ShaderNodeTexImage');node.image=bpy.data.images.load(str(g['ROOT']/'public/art/starry-night.jpg'));node.image.pack()
    art.node_tree.links.new(node.outputs['Color'],art.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    x,y,z=0,3.50,0;w,h=1.50,1.1875
    box('Canvas stretcher',(x,y,z),(w,h,.055),oak,.005)
    for side in (-1,1):
        box('Art frame horizontal',(x,y+side*(h/2+.028),z+.015),(w+.12,.052,.095),oak,.007)
        box('Art frame vertical',(x+side*(w/2+.034),y,z+.015),(.052,h+.01,.095),oak,.007)
    verts=[(x-w/2,y-h/2,z+.033),(x+w/2,y-h/2,z+.033),(x+w/2,y+h/2,z+.033),(x-w/2,y+h/2,z+.033)]
    mesh('Starry Night canvas face',verts,[(0,1,2,3)],art,[(0,0),(1,0),(1,1),(0,1)])
    # The unused left-wall pier keeps the entire canvas visible from both views.
    transform=Matrix.Translation(xyz((-6.37,0,-3.30)))@Matrix.Rotation(math.pi/2,4,'Z')
    for obj in set(bpy.data.objects)-before:obj.matrix_world=transform@obj.matrix_world
    g['register']('starry night display',[-6.398,2.85,-4.11],[-6.307,4.15,-2.49])
    g['artwork_anchor']={'position':[-6.337,3.50,-3.30],'size':[w,h],'normal':[1,0,0]}

    g['light_anchors']={
        'desk':{'position':[dp((-1.64,1.69,-.575))[0]+.16,2.31,dp((-1.64,1.69,-.575))[2]],'target':[-3.35,1.70,-.30]},
        'floor':{'position':[5.30,3.23,1.9],'target':[3.0,.55,.85]},
        'picture':{'position':[-6.04,4.22,-3.30],'target':[-6.335,3.50,-3.30]},
        'projector':{'position':[5.58,2.535,2.805],'target':[3.2,3.05,-3.855]},
        'shelves':[[-1.9,y,-3.40] for y in (.90,2.54,4.18)]}
