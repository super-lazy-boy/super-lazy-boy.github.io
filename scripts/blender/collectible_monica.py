"""Monica's public living space: an angled kitchen and raised rear window nook.

Authored in architectural metres, then presented as a shelf-sized cutaway.
All furniture, joinery, soft furnishings and small utensils remain editable.
"""
import math
from collectible_builder import Builder

def build():
    b=Builder('monica-apartment',1/24)
    purple=b.material('Lavender plaster','#aa91bb',.88);violet=b.material('Purple door paint','#88729e',.58);teal=b.material('Blue green enamel cabinetry','#3e9099',.43);tealshade=b.material('Recessed blue cabinet panels','#347b84',.49)
    cream=b.material('Ivory joinery','#dfd0b0',.65);wood=b.material('Honey oak parquet','#ffffff',.61,texture='public/models/collectibles/mini-oak.png',normal='public/models/collectibles/wood-normal.png');walnut=b.material('Aged walnut furniture','#73513a',.57);black=b.material('Patinated iron','#30342c',.55);gold=b.material('Yellow gilt details','#d9ad3f',.4,.25);steel=b.material('Satin kitchen metal','#a7aaa0',.34,.70)
    upholstery=b.material('Cream woven upholstery','#e6d9bc',.93,normal='public/models/collectibles/woven-normal.png');green=b.material('Moss window seat and footstool','#647a60',.9,normal='public/models/collectibles/woven-normal.png');linen=b.material('Ecru woven curtains','#d4c3a5',.96,normal='public/models/collectibles/woven-normal.png');patch=b.material('Embroidered patchwork cushions','#ffffff',.91,texture='public/models/collectibles/patchwork.png',normal='public/models/collectibles/woven-normal.png');plaid=b.material('Red tartan throw','#ffffff',.95,texture='public/models/collectibles/red-plaid.png',normal='public/models/collectibles/woven-normal.png')
    red=b.material('Burgundy ceramics','#934a40',.36);mustard=b.material('Butter yellow ceramics','#c5a65f',.44);white=b.material('Porcelain crockery','#eee5ce',.28);terra=b.material('Terracotta pots','#ad6e4e',.84);soil=b.material('Potting compost','#4d4435',1);leaf=b.material('Botanical leaves','#496a42',.77);lightleaf=b.material('Young green leaves','#789056',.8);glass=b.material('Smoky window glass','#70827c',.24,.08);brick=b.material('Warm exposed brick','#ffffff',.94,texture='public/models/collectibles/mini-brick.png');rug=b.material('Floral rug with dark border','#ffffff',.97,texture='public/models/collectibles/monica-rug.png',normal='public/models/collectibles/woven-normal.png')
    floorpoly=[(-5.4,3.72),(5.4,3.72),(5.4,-3.72),(-3.63,-3.72),(-5.4,-1.60)]
    b.solid('Walnut cutaway plinth',floorpoly,0,.17,walnut)
    def clip(poly,boundary):
        sign=1 if sum(boundary[i][0]*boundary[(i+1)%len(boundary)][1]-boundary[(i+1)%len(boundary)][0]*boundary[i][1] for i in range(len(boundary)))>0 else -1
        for a,c in zip(boundary,boundary[1:]+boundary[:1]):
            out=[]
            def inside(p):return sign*((c[0]-a[0])*(p[1]-a[1])-(c[1]-a[1])*(p[0]-a[0]))>=-.00001
            for p,q in zip(poly,poly[1:]+poly[:1]):
                ip,iq=inside(p),inside(q)
                if ip:out.append(p)
                if ip!=iq:
                    u=(q[0]-p[0],q[1]-p[1]);v=(c[0]-a[0],c[1]-a[1]);den=u[0]*v[1]-u[1]*v[0]
                    if abs(den)>1e-9:t=((a[0]-p[0])*v[1]-(a[1]-p[1])*v[0])/den;out.append((p[0]+u[0]*t,p[1]+u[1]*t))
            poly=out
            if not poly:break
        return poly
    # Real alternating herringbone planks, clipped to the diagonal footprint.
    cs=math.sqrt(.5);w=.24
    for i in range(-35,36):
        for j in range(-35,36):
            s=(i+j)%6
            if s not in (0,3):continue
            dx,dz=(3,1) if s==0 else (1,3);p=[(i*w,j*w),((i+dx)*w,j*w),((i+dx)*w,(j+dz)*w),(i*w,(j+dz)*w)];p=[((x-z)*cs,(x+z)*cs) for x,z in p];p=clip(p,floorpoly)
            if len(p)<3:continue
            cx=sum(x for x,z in p)/len(p);cz=sum(z for x,z in p)/len(p);p=[(cx+(x-cx)*.986,cz+(z-cz)*.986) for x,z in p];b.solid('Individual herringbone oak stave',p,.17,.195,wood)
    def wall(name,a,c,height,mat,base=.195,thick=.12):
        dx,dz=c[0]-a[0],c[1]-a[1];b.box(name,((a[0]+c[0])/2,base+height/2,(a[1]+c[1])/2),(math.hypot(dx,dz),height,thick),mat,.008,rotation=(0,-math.atan2(dz,dx),0))
    wall('Lavender entrance wall',(-5.34,3.66),(-5.34,-1.60),3.02,purple)
    wall('Angled brick kitchen wall',(-5.34,-1.60),(-3.61,-3.66),3.10,brick)
    wall('Brick range wall',(-3.61,-3.66),(-.40,-3.66),3.10,brick)
    wall('Hall rear wall',(-.40,-3.66),(2.07,-3.66),3.10,purple)
    wall('Window low wall',(2.07,-3.66),(5.34,-3.66),.70,purple)
    wall('Window head',(2.07,-3.66),(5.34,-3.66),.25,purple,base=3.04)
    wall('Right window pier',(5.34,-3.66),(5.34,-1.66),3.10,purple)
    wall('Hall partition',(.28,-3.6),(.28,-1.30),2.85,purple)
    wall('Low front cut edge',(-5.34,3.68),(5.34,3.68),.16,purple)
    for a,c in [((-5.24,3.6),(-5.24,-1.55)),((-3.55,-3.53),(-.45,-3.53)),((.40,-3.5),(.40,-1.3))]:wall('Cream profiled skirting',a,c,.15,cream,thick=.035)
    b.box('Raised rear alcove floor',(2.72,.302,-2.66),(5.13,.215,1.94),wood,.007);b.box('Window step bullnose',(2.72,.332,-1.65),(5.17,.09,.14),walnut,.019)
    for z in (-3.15,-2.47,-1.82):b.box('Hall runner woven mat',(1.10,.422,z),(.83,.012,.49),plaid,.008)
    def door(name,p,yaw,mat,width=1.04,height=2.30,iconic=False):
        with b.frame(p,yaw):
            b.box(name+' slab',(0,height/2+.20,0),(width,height,.070),mat,.012)
            for x in (-width/2-.055,width/2+.055):b.box(name+' architrave',(x,height/2+.20,.045),(.095,height+.15,.06),cream,.012)
            b.box(name+' lintel',(0,height+.28,.045),(width+.22,.10,.06),cream,.012)
            for y,h in ((.66,.64),(1.52,.65),(2.11,.24)):
                for x in (-width*.24,width*.24):
                    b.box(name+' inset field',(x,y,.043),(width*.37,h,.018),mat,.008)
                    for xx in (x-width*.19,x+width*.19):b.box(name+' narrow panel bead',(xx,y,.060),(.018,h+.02,.018),cream if not iconic else purple,.004)
                    for yy in (y-h/2,y+h/2):b.box(name+' panel rail',(x,yy,.060),(width*.40,.018,.018),cream if not iconic else purple,.004)
            b.cylinder(name+' knob backplate',(width*.36,1.21,.067),.060,.016,gold,direction=(0,0,1));b.cushion(name+' brass knob',(width*.36,1.21,.100),(.064,.064,.072),gold,power=.8)
            if iconic:
                # Curved yellow frame, with small raised ornamental corner scrolls.
                for side in (-1,1):
                    pts=[(side*(.192+.018*math.cos(t*math.pi*4)),1.96+t*.40,.092) for t in [k/24 for k in range(25)]];b.tube('Ornate peephole frame side',pts,.014,gold,segments=8)
                for y in (1.96,2.36):b.tube('Yellow peephole frame curved rail',[(x,y+.018*math.cos(x*math.pi/.19),.092) for x in [-.20+k*.4/32 for k in range(33)]],.014,gold)
                for x in (-.20,.20):
                    for y in (1.96,2.36):b.ring('Small gilt corner scroll',(x,y,.096),.032,.009,gold,normal=(0,0,1),segments=16)
                b.cylinder('Apartment door peephole',(0,2.16,.071),.019,.018,black,direction=(0,0,1))
    door('Iconic apartment entrance',(-5.243,0,2.38),math.pi/2,violet,iconic=True)
    door('Teal rear hall door',(1.17,.21,-3.565),0,teal,width=1.10,height=2.36)
    door('Bedroom hallway door',(.379,.20,-2.37),math.pi/2,violet,width=.87,height=2.16)
    # Kitchen cabinet construction, not solid blocks: frames, fields, pulls and feet.
    def cabinet(x,z,width=.86):
        b.box('Recessed kitchen carcass',(x,.66,z),(width,.88,.82),tealshade,.014)
        b.box('Kitchen toe kick',(x,.25,z+.405),(width-.08,.10,.035),walnut,.003)
        for y,h in ((.54,.48),(.93,.22)):
            b.box('Blue cabinet door frame',(x,y,z+.429),(width-.035,h,.038),teal,.005);b.box('Recessed shaker field',(x,y,z+.451),(width-.16,h-.10,.008),tealshade,.002)
            b.box('Kitchen small bar pull',(x,y+h*.15,z+.477),(.22,.022,.030),steel,.005)
        b.box('Counter slab',(x,1.13,z),(width+.035,.09,.93),wood,.014)
    for x in (-3.17,-2.27):cabinet(x,-3.08)
    # Oven with individual grates, knobs and a dark recessed door.
    b.box('Vintage freestanding oven',(-1.37,.68,-3.10),(.84,.93,.86),cream,.025);b.box('Oven black inset',(-1.37,.65,-2.655),(.68,.48,.025),black,.025);b.box('Oven glass',(-1.37,.66,-2.635),(.56,.34,.012),glass,.022);b.box('Oven horizontal handle',(-1.37,.98,-2.61),(.59,.035,.047),steel,.008)
    for x in (-1.63,-1.45,-1.27,-1.09):b.cylinder('Oven control', (x,1.05,-2.645),.037,.032,black,direction=(0,0,1),segments=16)
    b.box('Enamel hob',(-1.37,1.17,-3.1),(.85,.036,.87),white,.008)
    for x in (-1.58,-1.16):
        for z in (-3.33,-2.90):
            b.ring('Gas burner',(x,1.199,z),.100,.013,black,segments=24)
            for a in (0,math.pi/2):b.box('Stove pot support',(x,1.210,z),(.27,.018,.021),black,.003,rotation=(0,a,0))
    b.lathe('Kettle body',(-1.58,1.22,-3.33),[(0,.08),(.04,.12),(.17,.11),(.20,.07)],steel);b.tube('Kettle spout',[(-1.50,1.25,-3.33),(-1.40,1.34,-3.33),(-1.40,1.39,-3.33)],.022,steel);b.ring('Kettle handle',(-1.58,1.48,-3.33),.10,.018,black,normal=(0,0,1),segments=24)
    with b.frame((-4.16,0,-2.26),.873,'angled kitchen'):
        cabinet(0,0,1.38)
        b.box('Kitchen window dark opening',(0,2.14,-.485),(1.38,1.34,.025),glass,.003)
        for x in (-.71,0,.71):b.box('Kitchen window frame',(x,2.14,-.41),(.05,1.39,.07),cream,.004)
        for y in (1.45,2.14,2.83):b.box('Kitchen window crossbar',(0,y,-.41),(1.46,.05,.07),cream,.004)
        for j in range(13):b.box('Woven kitchen roman blind',(0,2.52+j*.018,-.36),(1.48,.013,.021),linen,.003)
        b.box('Window oak sill',(0,1.45,-.30),(1.58,.07,.26),wood,.009)
        # Open sink: inner steel walls and a separate dark recessed bottom.
        b.box('Sink well bottom',(0,1.08,.03),(.58,.016,.43),black,.04)
        for z in (-.21,.27):b.box('Sink side inner wall',(0,1.125,z),(.61,.09,.018),steel,.007)
        for x in (-.31,.31):b.box('Sink end inner wall',(x,1.125,.03),(.018,.09,.50),steel,.007)
        for z in (-.23,.29):b.box('Sink rolled lip',(0,1.184,z),(.67,.015,.024),steel,.007)
        for x in (-.33,.33):b.box('Sink rolled lip',(x,1.184,.03),(.024,.015,.54),steel,.007)
        # Cut the top beneath the sink: a real recess, not a dark decal.
        b.tube('Curved kitchen faucet',[(0,1.19,-.31),(0,1.55,-.31),(0,1.63,-.22),(0,1.60,-.08),(0,1.48,-.06)],.021,steel)
        for x in (-.12,.12):b.cylinder('Tap hot cold control',(x,1.22,-.31),.035,.07,steel)
    # Remove worktop centre over the sink with a rectangular Boolean opening.
    # This is local cabinet geometry before its frame is transformed above.
    # The two counter slabs meet at the basin and their notches are cut together.
    import bpy
    from collectible_builder import C
    sinkcentre=(-4.16,1.13,-2.26)
    cutter=b.box('Temporary sink opening',sinkcentre,(.61,.40,.46),steel,0,rotation=(0,.873,0));bpy.context.view_layer.update()
    for obj in list(b.objects):
        if obj.name.startswith('Counter slab') and obj!=cutter:
            p=C.inverted()@obj.matrix_world.translation
            if p.x/b.unit < -3.6:
                obj.data=obj.data.copy()
                bpy.context.view_layer.objects.active=obj;mod=obj.modifiers.new('Proper sink recess','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name)
    b.objects.remove(cutter);bpy.data.objects.remove(cutter,do_unlink=True)
    with b.frame((-4.16,0,-2.26),.873):cutter=b.box('Temporary kitchen window aperture',(0,2.14,-.47),(1.39,1.36,.40),steel,0)
    obj=next(o for o in b.objects if o.name=='Angled brick kitchen wall');obj.data=obj.data.copy();bpy.context.view_layer.objects.active=obj;mod=obj.modifiers.new('Real kitchen window opening','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cutter;bpy.ops.object.modifier_apply(modifier=mod.name);b.objects.remove(cutter);bpy.data.objects.remove(cutter,do_unlink=True)
    # Open blue shelves: individual plates, bowls, jars and hooked cups.
    for y in (1.88,2.43,2.97):b.box('Blue open shelf board',(-2.63,y,-3.43),(2.25,.07,.36),teal,.007)
    for x in (-3.79,-2.66,-1.47):b.box('Open shelf upright',(x,2.43,-3.43),(.06,1.16,.36),teal,.005)
    def cup(name,p,mat,s=1):
        with b.frame(p,assembly=name+' '+str(p)):
            b.lathe(name,(0,0,0),[(0,.065*s),(.02*s,.074*s),(.16*s,.082*s),(.17*s,.079*s),(.17*s,.062*s),(.035*s,.056*s)],mat,segments=20);b.ring(name+' loop handle',(.092*s,.094*s,0),.047*s,.013*s,mat,normal=(0,0,1),segments=16)
    for row,y in enumerate((1.92,2.47)):
        for j in range(6):
            x=-3.56+j*.34;mat=[white,mustard,red,teal][(row+j)%4]
            if j%2:cup('Open shelf cup',(x,y,-3.35),mat,.85)
            else:
                for k in range(3):b.lathe('Stacked shelf bowl',(x,y+k*.052,-3.36),[(0,.055),(.02,.09),(.075,.13),(.085,.13),(.078,.113),(.025,.067)],mat,segments=20)
    for x in (-3.46,-2.94,-2.41):
        b.cylinder('Vertical display plate',(x,2.75,-3.51),.19,.018,white,direction=(0,0,1),segments=28);b.ring('Blue plate border',(x,2.75,-3.495),.162,.010,teal,normal=(0,0,1),segments=28)
    # Freestanding fridge has divided doors, hinges, gasket and small photos.
    b.box('Cream fridge body',(-.39,1.30,-3.07),(.84,2.18,.92),cream,.055)
    for y,h in ((2.04,.63),(1.04,1.26)):
        b.box('Black refrigerator gasket',(-.39,y,-2.594),(.79,h+.018,.018),black,.018);b.box('Rounded cream fridge door',(-.39,y,-2.561),(.78,h,.048),white,.023);b.box('Fridge handle',(-.66,y,-2.516),(.035,h*.57,.05),steel,.010)
    for i in range(8):
        x=-.55+i%3*.19;y=1.43+i//3*.21;b.box('Fridge snapshot white border',(x,y,-2.528),(.128,.144,.008),white,.001);b.box('Fridge snapshot picture',(x,y,-2.521),(.095,.098,.006),[teal,green,red,mustard][i%4],.001);b.cylinder('Fridge magnet',(x,y+.076,-2.515),.019,.010,[red,mustard][i%2],direction=(0,0,1),segments=12)
    # A walnut beam and purple timber post frame the open kitchen.
    b.box('Kitchen overhead oak beam',(-2.70,2.82,-1.35),(4.55,.19,.19),walnut,.015)
    b.box('Kitchen beam post',(-.48,1.50,-1.35),(.16,2.64,.16),walnut,.012)
    b.tube('Hanging pan rail',[(-3.45,1.64,-3.47),(-1.97,1.64,-3.47)],.018,black)
    for i,x in enumerate((-3.25,-2.85,-2.43)):
        b.cylinder('Hung copper saucepan',(x,1.43,-3.41),.133,.055,[steel,terra,black][i],direction=(0,0,1),segments=24);b.box('Saucepan long handle',(x,1.68,-3.40),(.042,.26,.036),black,.008)
    b.box('Counter chopping board',(-3.12,1.194,-2.97),(.49,.025,.28),walnut,.021)
    for x in (-3.35,-2.89):cup('Everyday countertop mug',(x,1.19,-2.78),[red,white][x> -3],.9)
    b.lathe('Utensil crock',(-2.31,1.18,-3.21),[(0,.092),(.27,.11),(.28,.098),(.03,.074)],white)
    for j in range(5):
        x=-2.4+j*.04;b.tube('Wooden cooking utensil',[(x,1.23,-3.21),(x+(j-2)*.018,1.66,-3.23)],.013,wood);b.cushion('Wooden spoon head',(x+(j-2)*.018,1.69,-3.23),(.060,.09,.027),wood,power=.85)
    # Floral arrangements have curved leaves and separate small blossoms.
    def plant(p,s=1,flowers=False):
        with b.frame(p,assembly='plant '+str(p)):
            b.lathe('Tapered plant pot',(0,0,0),[(0,.12*s),(.22*s,.16*s),(.24*s,.17*s),(.255*s,.17*s),(.25*s,.145*s),(.035*s,.10*s)],terra,segments=24);b.cylinder('Visible pot compost',(0,.226*s,0),.14*s,.015*s,soil,segments=24)
            for k in range(10):
                a=k*2.399;h=(.42+k%4*.065)*s;tip=(math.sin(a)*.22*s,h,math.cos(a)*.20*s);b.tube('Fine botanical stem',[(0,.23*s,0),(tip[0]*.55,h*.85,tip[2]*.55),tip],.009*s,leaf,segments=6)
                q=(tip[0]+math.sin(a)*.17*s,h+.035*s,tip[2]+math.cos(a)*.17*s);mid=((tip[0]+q[0])/2,h+.07*s,(tip[2]+q[2])/2);side=(math.cos(a)*.065*s,0,-math.sin(a)*.065*s)
                b.mesh('Curved miniature leaf',[tip,(mid[0]+side[0],mid[1]-.02*s,mid[2]+side[2]),q,(mid[0]-side[0],mid[1]-.02*s,mid[2]-side[2]),mid],[(0,1,4),(1,2,4),(2,3,4),(3,0,4)],[leaf,lightleaf][k%2],smooth=True)
                if flowers and k%2==0:
                    for j in range(5):
                        aa=j*math.tau/5;b.cushion('Small white flower petal',(tip[0]+math.sin(aa)*.036*s,h+.025*s,tip[2]+math.cos(aa)*.036*s),(.052*s,.016*s,.035*s),white,rotation=(0,aa,0),power=.9)
                    b.cushion('Golden flower centre',(tip[0],h+.04*s,tip[2]),(.023*s,.018*s,.023*s),mustard,power=.9)
    plant((-4.737,1.49,-2.04),.43);plant((4.85,.195,-.02),1.0);plant((.57,.42,-3.23),.55)
    # Dining set, spindle backs, turned legs, fruit and folded linen.
    b.lathe('Round dining table',(-2.88,.195,.55),[(0,.31),(.06,.32),(.09,.13),(.61,.09),(.72,.22),(.77,.77),(.83,.79),(.87,.77)],walnut,segments=48)
    for i,a in enumerate((0,math.pi/2,math.pi,3*math.pi/2)):
        x=-2.88+math.sin(a)*1.13;z=.55+math.cos(a)*1.13
        with b.frame((x,.195,z),a,'dining chair '+str(i)):
            mat=[violet,teal,cream,violet][i];b.box('Dining chair shaped seat',(0,.46,0),(.48,.068,.46),mat,.038)
            for xx in (-.19,.19):
                for zz in (-.17,.17):b.lathe('Dining chair turned leg',(xx,0,zz),[(0,.021),(.06,.03),(.13,.023),(.27,.035),(.39,.024),(.43,.033)],walnut,segments=16)
            for xx in (-.22,.22):b.tube('Chair curved back stile',[(xx,.45,.17),(xx,.96,.22),(xx*.83,1.16,.21)],.025,mat)
            b.box('Chair top back rail',(0,1.14,.21),(.43,.065,.048),mat,.016)
            for xx in (-.10,0,.10):b.tube('Slender chair back spindle',[(xx,.65,.20),(xx,.99,.21),(xx*.9,1.10,.21)],.012,mat,segments=8)
    b.lathe('Dining fruit bowl',(-2.88,1.068,.55),[(0,.12),(.02,.15),(.08,.24),(.09,.24),(.085,.22),(.02,.11)],mustard)
    for k in range(7):a=k*2.399;r=.11*(k%3)/2;b.cushion('Fresh dining fruit',(-2.88+math.sin(a)*r,1.15+(k//5)*.055,.55+math.cos(a)*r),(.11,.105,.105),[red,mustard,green][k%3],power=.88)
    b.box('Folded dining linen',(-3.35,1.075,.70),(.24,.025,.30),linen,.009,rotation=(0,.17,0));cup('Dining cup',(-2.44,1.075,.48),white,.85)
    # Tall recessed living-room window, blind, curtain folds and window seat.
    b.box('Deep window recess',(3.66,1.98,-3.60),(3.22,2.10,.030),black,.004)
    for x in (2.10,2.88,3.66,4.44,5.22):b.box('Black painted window mullion',(x,1.98,-3.53),(.045,2.08,.065),black,.004)
    for y in (.96,1.62,2.31,3.00):b.box('Window transom',(3.66,y,-3.53),(3.16,.046,.065),black,.004)
    for x in (2.49,3.27,4.05,4.83):
        for y in (1.28,1.97,2.65):b.box('Individual window pane',(x,y,-3.569),(.724,.61,.009),glass,.002)
    for i in range(19):b.box('Brown woven window blind',(3.66,2.55+i*.022,-3.471),(3.18,.017,.032),walnut,.002)
    for x in (2.84,4.49):b.tube('Roman blind cord',[(x,2.97,-3.444),(x,2.24,-3.444)],.006,linen,segments=6)
    b.box('Window sill moulding',(3.66,.93,-3.43),(3.36,.105,.35),wood,.013)
    b.box('Window seat base',(3.64,.66,-3.05),(2.99,.47,.67),violet,.012);b.cushion('Green window seat cushion',(3.64,.927,-3.04),(2.92,.115,.64),green,power=.38)
    for x,a in ((2.56,-.15),(4.67,.13)):b.cushion('Window patchwork pillow',(x,1.12,-3.19),(.41,.35,.15),patch,rotation=(.12,0,a),uv_axis='xy')
    for side in (-1,1):
        centre=3.66+side*1.43;v=[];f=[];uv=[];N,M=16,28
        for j in range(M+1):
            t=j/M;y=1.02+t*2.07;gather=.68+.32*t;offset=side*.09*math.sin(math.pi*t)
            for i in range(N+1):
                u=i/N;x=centre+(u-.5)*.49*gather+offset;z=-3.33+.058*math.sin(u*math.tau*5)+.025*math.sin(t*math.pi);v.append((x,y+.024*math.cos(u*math.tau*5)*(1-t),z));uv.append((u*2,t*4))
                if i and j:k=j*(N+1)+i;f.append((k-N-2,k-N-1,k,k-1))
        b.mesh('Gathered full-height patterned curtain',v,f,linen,uv,smooth=True)
        b.tube('Curtain tieback',[(centre-.17,1.64,-3.28),(centre,1.62,-3.23),(centre+.17,1.64,-3.28)],.012,gold)
    b.tube('Curtain brass pole',[(1.98,3.13,-3.28),(5.29,3.13,-3.28)],.025,gold)
    # Small writing desk on the window platform, leaving the central bench visible.
    with b.frame((4.94,.412,-2.33),math.pi/2,'writing desk'):
        b.box('Rear writing desk top',(0,.76,0),(1.12,.065,.56),walnut,.019)
        for x in (-.48,.48):
            for z in (-.20,.20):b.lathe('Rear desk tapered leg',(x,0,z),[(0,.023),(.60,.035),(.73,.042)],walnut,segments=16)
        b.box('Writing desk drawer',(0,.62,.06),(.94,.18,.36),wood,.009);b.cushion('Desk brass pull',(0,.63,.259),(.07,.029,.029),gold,power=.8)
        b.box('Open notebook',(0,.803,.02),(.32,.012,.25),white,.003,rotation=(0,.19,0));b.tube('Pen on writing desk',[(-.12,.817,.13),(.08,.817,.16)],.007,black,segments=6)
    # Living room: three filled cushions with piping, rolled arms and red drape.
    b.mesh('Floral living-room rug',[(-.02,.202,-.68),(4.68,.202,-.68),(4.68,.202,3.42),(-.02,.202,3.42)],[(3,2,1,0)],rug,[(0,0),(1,0),(1,1),(0,1)])
    def piping(name,x,y,z,w,h,mat,plane='xy',r=.005):
        pts=[]
        for k in range(65):
            a=k*math.tau/64;xx=math.copysign(abs(math.cos(a))**.28,math.cos(a))*w/2;yy=math.copysign(abs(math.sin(a))**.28,math.sin(a))*h/2;pts.append((x+xx,y+yy,z) if plane=='xy' else (x+xx,y,z+yy))
        b.tube(name,pts,r,mat,segments=6)
    with b.frame((.62,.195,1.36),math.pi/2,'sofa'):
        for x in (-1.27,1.27):
            for z in (-.39,.35):b.lathe('Sofa turned wooden foot',(x,0,z),[(0,.047),(.03,.061),(.12,.048),(.19,.061)],walnut,segments=16)
        b.cushion('Sofa upholstered lower frame',(0,.30,-.06),(2.92,.27,.95),upholstery,power=.30)
        b.cushion('Sofa padded rear frame',(0,.88,-.495),(2.91,1.02,.22),upholstery,power=.38)
        for x in (-1.39,1.39):b.cushion('Sofa soft rolled arm',(x,.65,-.03),(.31,.70,1.07),upholstery,power=.55)
        for x in (-.83,0,.83):
            b.cushion('Separate filled sofa seat',(x,.54,.025),(.81,.255,.82),upholstery,power=.34);piping('Seat cushion sewn welt',x,.58,.025,.80,.81,cream,'xz',.006)
            b.cushion('Lofted sofa back cushion',(x,.99,-.345),(.81,.62,.24),upholstery,rotation=(-.09,0,0),power=.40);piping('Sofa back cushion welt',x,.99,-.215,.76,.56,cream,r=.005)
        for x,y,z,a in ((-.94,.97,.08,-.13),(.94,.94,-.04,.13)):b.cushion('Patchwork sofa pillow',(x,y,z),(.43,.44,.16),patch,rotation=(.13,0,a),power=.45,uv_axis='xy')
        v=[];f=[];uv=[];path=[(1.42,-.50),(1.40,-.18),(1.17,-.18),(.78,-.18),(.695,.06),(.695,.46),(.56,.49),(.35,.50)]
        for j,(y,z) in enumerate(path):
            for i in range(17):u=i/16;x=-.68+(u-.5)*.55;v.append((x,y+.015*math.sin(u*math.tau*4+j*.5),z+.012*math.cos(u*math.tau*4)));uv.append((u,j/(len(path)-1)*1.9))
            if j:
                for i in range(16):k=j*17+i;f.append((k-17,k-16,k+1,k))
        b.mesh('Red plaid throw with hanging folds',v,f,plaid,uv,smooth=True)
        for i in range(17):x=-.955+i*.55/16;b.tube('Throw hand-knotted fringe',[(x,.35,.50),(x+.007*math.sin(i),.29,.50)],.004,plaid,segments=5)
    # Rolled-arm matching chair, with a small red check cushion.
    with b.frame((3.15,.195,-.72),-.18,'armchair'):
        for x in (-.34,.34):
            for z in (-.31,.31):b.lathe('Armchair walnut foot',(x,0,z),[(0,.036),(.18,.044)],walnut,segments=16)
        b.cushion('Armchair base',(0,.30,0),(.94,.25,.92),upholstery,power=.4);b.cushion('Armchair seat',(0,.52,.04),(.72,.23,.72),upholstery,power=.38);b.cushion('Armchair soft back',(0,.93,-.35),(.91,.88,.26),upholstery,power=.45)
        for x in (-.44,.44):b.cushion('Armchair rolled arm',(x,.62,.015),(.24,.62,.92),upholstery,power=.60)
        b.cushion('Armchair check pillow',(0,.89,-.16),(.43,.40,.15),plaid,rotation=(.14,0,.07),uv_axis='xy')
    with b.frame((1.65,.195,3.05),.12,'ottoman'):
        b.cushion('Green ottoman plinth',(0,.22,0),(.69,.41,.66),green,power=.3);b.cushion('Green footstool filled top',(0,.46,0),(.75,.20,.73),green,power=.38);piping('Footstool cream edge piping',0,.47,0,.74,.72,cream,'xz',.005)
    b.box('Large walnut coffee-table top',(2.62,.83,1.35),(1.45,.09,1.69),walnut,.020);b.box('Coffee table under-shelf',(2.62,.36,1.35),(1.30,.06,1.54),wood,.010)
    for x in (2.04,3.20):
        for z in (.64,2.06):b.lathe('Coffee table turned baluster',(x,.205,z),[(0,.035),(.06,.052),(.12,.037),(.20,.070),(.32,.048),(.45,.070),(.55,.042),(.58,.055)],walnut,segments=20)
    for i,mat in enumerate((red,cream,teal)):b.box('Coffee table illustrated magazine',(2.36,.897+i*.024,1.50),(.50,.021,.38),mat,.003,rotation=(0,.09+i*.08,0))
    b.lathe('Coffee table oval tray',(2.79,.881,1.05),[(0,.23),(.018,.26),(.05,.25),(.05,.23),(.024,.22)],gold,segments=32)
    cup('Coffee table tea cup',(2.82,.910,1.02),white,.74);b.cylinder('Small tea saucer',(2.82,.902,1.02),.13,.016,white,segments=24);plant((2.28,.881,.85),.43,True)
    # Books, side tables and small lamps make the miniature read as a lived-in set.
    with b.frame((4.75,.195,1.23),-math.pi/2,'television'):
        b.box('CRT walnut television cabinet',(0,.34,0),(1.47,.68,.53),walnut,.016)
        for x in (-.40,.30):b.box('Television cabinet inset door',(x,.34,.282),(.62,.49,.024),wood,.006)
        b.box('CRT television casing',(-.08,.95,0),(.99,.68,.58),black,.050);b.cushion('Convex smoky television screen',(-.18,.97,.301),(.69,.48,.048),glass,power=.34)
        for y in (.80,1.02):b.cylinder('TV channel dial',(.35,y,.307),.044,.028,steel,direction=(0,0,1),segments=16)
        for i in range(6):b.box('Television speaker louver',(.35,1.15+i*.021,.304),(.12,.008,.012),steel,.001)
        b.tube('Rabbit-ear TV aerial',[(-.20,1.31,0),(-.45,1.66,-.04)],.008,steel,segments=6);b.tube('Rabbit-ear TV aerial',[(.08,1.31,0),(.25,1.60,.04)],.008,steel,segments=6)
    def lamp(p,s=1):
        with b.frame(p,assembly='lamp '+str(p)):
            b.lathe('Table lamp ceramic base',(0,0,0),[(0,.11*s),(.04*s,.12*s),(.09*s,.065*s),(.26*s,.09*s),(.34*s,.045*s)],red,segments=24);b.cylinder('Lamp brass neck',(0,.40*s,0),.016*s,.14*s,gold)
            b.lathe('Linen tapered lamp shade',(0,.43*s,0),[(0,.23*s),(.26*s,.13*s),(.265*s,.124*s),(.012*s,.223*s)],linen,segments=32)
            b.ring('Shade bottom binding',(0,.43*s,0),.23*s,.006*s,cream);b.ring('Shade top binding',(0,.69*s,0),.13*s,.006*s,cream)
    b.cylinder('Living room round side table',(4.15,.89,-.68),.33,.07,walnut,segments=32)
    for k in range(3):a=k*math.tau/3;b.tube('Tripod side table leg',[(4.15+math.sin(a)*.22,.205,-.68+math.cos(a)*.22),(4.15+math.sin(a)*.12,.86,-.68+math.cos(a)*.12)],.025,walnut)
    lamp((4.15,.932,-.68),.77)
    b.box('Sofa side pedestal',(.62,.58,-.56),(.57,.76,.52),walnut,.015);lamp((.62,.97,-.56),.77)
    for i in range(8):
        b.box('Side pedestal book',(.38+i*.06,.46,-.278),(.049,.36+(i%3)*.035,.18),[red,teal,cream,green][i%4],.003)
        for y in (.31,.58):b.box('Tiny book spine gilt band',(.38+i*.06,y,-.181),(.035,.012,.004),gold,.001)
    # Framed art: layers of actual frame moulding rather than floating planes.
    for x,z,y,w,h in [(-.39,-2.50,2.54,.40,.52),(5.253,-2.36,2.20,.51,.64)]:
        with b.frame((x,y,z),-math.pi/2 if x>5 else 0):
            b.box('Miniature art walnut frame',(0,0,0),(w+.08,h+.08,.042),walnut,.006);b.box('Art ivory mount',(0,0,.025),(w,h,.012),white,.002);b.box('Art muted field',(0,0,.034),(w*.75,h*.79,.006),green,.001)
            for k in range(5):b.cushion('Tiny still-life painted petal',((k%3-1)*w*.16,(k//3-.5)*h*.20,.039),(.10,.08,.004),[mustard,red,cream][k%3],power=.85)
    # Semantic assemblies are retained in the native model for mesh-intersection QA.
    for obj in b.objects:
        if obj.get('assembly'):continue
        for group,prefixes in {
            'dining table':('Round dining table','Dining fruit bowl','Fresh dining fruit','Folded dining linen'),
            'coffee table':('Large walnut coffee-table','Coffee table under-shelf','Coffee table turned','Coffee table illustrated','Coffee table oval tray','Small tea saucer'),
            'sofa side pedestal':('Sofa side pedestal','Side pedestal book','Tiny book spine'),
            'round side table':('Living room round side table','Tripod side table leg')
        }.items():
            if obj.name.startswith(prefixes):obj['assembly']=group;break
    b.finish((.45,.139,.310))
