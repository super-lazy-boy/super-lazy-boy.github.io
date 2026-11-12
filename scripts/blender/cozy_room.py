"""Original warm furniture, electronics, instruments and accumulated small objects.

All placements preserve the existing book, tape, curtain and camera corridors.
"""
import bpy,math

def add_media_light(g):
    for obj in list(bpy.data.objects):
        if obj.get('asset_group','') in ('media shelf light','media lamp glow'):bpy.data.objects.remove(obj,do_unlink=True)
    g['asset']('media shelf light');g['box']('Media concealed light channel',(3.2,1.3135,-3.49),(4.04,.014,.045),bpy.data.materials['Warm white powder coat'],.004)
    g['asset']('media lamp glow');g['box']('Media warm LED diffuser',(3.2,1.3025,-3.49),(3.98,.006,.025),bpy.data.materials['Warm lamp diffuser'],.002)
    g['light_anchors']['media']=[[2.15,1.288,-3.39],[4.25,1.288,-3.39]]

def furnish(g):
    box,cyl,sphere,tube,ring=(g[k] for k in ('box','cylinder','sphere','tube','ring'))
    asset,tag,xyz,mat=(g[k] for k in ('asset','tag','xyz','material'))
    white,ivory,ink,silver,brass,green=(g[k] for k in ('white','ivory','ink','silver','brass','green'))
    dp,db,dc=(g[k] for k in ('dp','db','dc'))
    walnut=mat('Oiled walnut joinery','#ffffff',.53,texture='walnut.png')
    honey=mat('Honey oak floor','#ffffff',.62,texture='honey-oak.png')
    teal=mat('Deep teal painted timber','#376964',.49)
    clay=mat('Glazed warm terracotta','#bd8066',.36)
    blue=mat('Dusty blue glazed pottery','#799799',.32)
    ochre=mat('Ochre glazed pottery','#c3a15c',.35)
    rust=mat('Rust boucle upholstery','#ffffff',.93,texture='cozy-rust.png')
    moss=mat('Moss woven cushion','#ffffff',.92,texture='cozy-moss.png')
    gold=mat('Golden woven throw','#ffffff',.93,texture='cozy-gold.png')
    cream=mat('Oat linen shade','#ffffff',.88,texture='cozy-cream.png')
    carpet=mat('Botanical woven carpet','#ffffff',.96,texture='cozy-rug.png')
    binding=mat('Rust upholstery piping','#936344',.95)
    plaster=mat('Warm pink lime plaster','#d9c2ae',.93)
    def swap(obj,material):obj.data.materials.clear();obj.data.materials.append(material)
    for obj in list(bpy.data.objects):
        name=obj.name;group=obj.get('asset_group','')
        if obj.type not in ('MESH','CURVE'):continue
        if name.startswith(('Back plaster','Window wall masonry')):swap(obj,plaster)
        elif name.startswith('Oak floor plank'):swap(obj,honey)
        elif name in ('Sculpted linen seat surface','Sculpted upholstery sidewall','Footstool woven cushion'):swap(obj,rust)
        elif name in ('Lumbar cushion','Upholstered seat','Upholstered chair back'):swap(obj,moss)
        elif name in ('Floor cushion','Soft draped oat throw'):swap(obj,gold)
        elif name.startswith(('Continuous upholstery welt','Upholstery side seam')):swap(obj,binding)
        elif name in ('Task lamp open shade','Linen floor lamp shade') or group.startswith('curtain '):swap(obj,cream)
        elif name.startswith(('Bookcase stile','Bookcase shelf','Bookcase divider','Bookcase recessed back','Media cabinet side','Media cabinet recessed back','Media cabinet shelf','Pedestal carcass','Pedestal drawer front','Equipment cabinet stile')):swap(obj,teal)
        elif name.startswith(('White satin desktop','Bookcase oak crown','Media oak worktop','Projector console top','Equipment cabinet back','Equipment cabinet shelf','Side table oak top','Low oak tatami platform','Footstool oak tray','Window flower stand shelf','Deep window seat','Art frame')):swap(obj,walnut)
        elif name.startswith('Glazed flower pot'):swap(obj,[clay,blue,ochre][sum(map(ord,name))%3])
        elif name.startswith('Ceramic planter'):swap(obj,clay if 'office' in group else teal)
        elif name=='Woven lounge rug':
            swap(obj,carpet)
            while obj.data.uv_layers:obj.data.uv_layers.remove(obj.data.uv_layers[0])
            layer=obj.data.uv_layers.new();obj.data.uv_layers.active=layer;layer.active_render=True
            for loop in obj.data.loops:
                co=obj.matrix_world@obj.data.vertices[loop.vertex_index].co
                layer.data[loop.index].uv=((co.x-1.125)/3.75,(-co.y+1.40)/4.30)
    def mesh(name,verts,faces,material,uv=None):
        data=bpy.data.meshes.new(name);data.from_pydata([xyz(p) for p in verts],[],faces);data.update()
        obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);tag(obj,name,material)
        for face in data.polygons:face.use_smooth=True
        if uv:
            layer=data.uv_layers.new()
            for loop in data.loops:layer.data[loop.index].uv=uv[loop.vertex_index]
        return obj
    def vessel(name,p,r,h,material):
        x,y,z=p;profile=[(.67*r,0),(.95*r,.05*h),(r,.45*h),(.78*r,.90*h),(.78*r,h),(.67*r,h),(.64*r,.90*h),(.84*r,.45*h),(.70*r,.13*h)];verts=[];faces=[]
        for row,(rr,yy) in enumerate(profile):
            for k in range(49):
                a=k/48*math.tau;verts.append((x+rr*math.cos(a),y+yy,z+rr*math.sin(a)))
                if row and k:n=row*49+k;faces.append((n-50,n-49,n,n-1))
        mesh(name,verts,faces,material);ring(name+' lip',(x,y+h,z),r*.725,r*.055,material);cyl(name+' bottom',(x,y+.08*h,z),r*.68,.03*h,material)

    # Hollow PC: window, motherboard, CPU fins, GPU, sleeved cables, fan impellers.
    for obj in list(bpy.data.objects):
        if obj.get('asset_group')=='computer tower':bpy.data.objects.remove(obj,do_unlink=True)
    asset('computer tower')
    steel=mat('PC champagne aluminium','#d1cbbf',.33,.65);pcb=mat('PC dark green circuit board','#253e36',.64)
    glass=mat('PC smoked side glass','#9caaa6',.18);bs=glass.node_tree.nodes.get('Principled BSDF');bs.inputs['Alpha'].default_value=.22;bs.inputs['Transmission Weight'].default_value=.28;bs.inputs['IOR'].default_value=1.45;glass.surface_render_method='DITHERED'
    pcx=-1.34
    db('Tower bottom panel',(pcx,.105,.08),(.60,.035,.93),steel,.010);db('Tower top panel',(pcx,1.235,.08),(.60,.035,.93),steel,.014)
    db('Tower right side panel',(pcx+.292,.67,.08),(.016,1.10,.90),white,.007);db('Tower rear service panel',(pcx,.67,-.374),(.56,1.10,.018),steel,.006)
    for x in (pcx-.283,pcx+.283):
        for z in (-.365,.525):db('Tower corner extrusion',(x,.67,z),(.027,1.13,.028),steel,.006)
    db('Tower side glass window',(pcx-.300,.685,.075),(.008,1.01,.81),glass,.008)
    for y in (.17,1.20):db('Window surround',(pcx-.308,y,.075),(.020,.026,.88),steel,.005)
    for z in (-.35,.50):db('Window surround',(pcx-.308,.685,z),(.020,1.04,.028),steel,.005)
    for y in (.20,1.16):
        for z in (-.32,.47):dc('Knurled window thumbscrew',(pcx-.324,y,z),.017,.010,silver,direction=(0,0,1))
    db('Motherboard PCB',(pcx+.245,.75,-.04),(.018,.68,.59),pcb,.005);db('CPU heat spreader',(pcx+.195,.84,-.07),(.09,.21,.22),silver,.008)
    for i in range(12):db('CPU cooler fin',(pcx+.115,.75+i*.016,-.07),(.17,.007,.25),steel,.001)
    for i in range(2):db('RAM heatspreader',(pcx+.205,.85,.13+i*.055),(.065,.30,.025),ink,.004)
    db('Graphics card PCB',(pcx,.55,.01),(.43,.018,.54),pcb,.004);db('Graphics card cooler',(pcx,.59,.01),(.40,.055,.50),steel,.004)
    for z in (-.12,.13):
        dc('GPU cooling fan',(pcx-.06,.625,z),.089,.012,ink);ring('GPU fan surround',dp((pcx-.06,.633,z)),.081,.006,silver);dc('GPU fan centre',(pcx-.06,.637,z),.025,.008,steel)
    db('PSU shroud',(pcx,.245,-.02),(.52,.23,.69),ivory,.010)
    for i in range(9):db('PSU ventilation',(pcx-.16+i*.04,.365,-.02),(.016,.004,.40),ink,.002)
    for i in range(4):tube('Sleeved power cable',[dp((pcx+.20,.87,.25+i*.012)),dp((pcx+.05,.98,.30+i*.012)),dp((pcx-.03,.73,.31+i*.012)),dp((pcx+.12,.40,.24+i*.012))],.006,ink)
    for y in (.43,.91):
        db('Front fan mounting frame',(pcx,y,.51),(.46,.44,.024),ink,.020);ring('Front fan machined rim',dp((pcx,y,.537)),.196,.014,steel,direction=(1,0,0))
        for k in range(9):
            a=k*math.tau/9;verts=[dp((pcx+r*math.cos(aa),y+r*math.sin(aa),.555)) for r,aa in [(.045,a),(.162,a+.30),(.165,a+.72),(.055,a+.47)]]
            blade=mesh('Curved cooling impeller',verts,[(0,1,2,3)],ink);solid=blade.modifiers.new('Blade thickness','SOLIDIFY');solid.thickness=.006
        dc('Fan hub',(pcx,y,.562),.048,.012,steel,direction=(1,0,0))
    verts=[];faces=[]
    for row in range(23):
        for col in range(11):
            x=pcx-.236+col*.046+(row%2)*.023;y=.18+row*.044
            if x>pcx+.25:continue
            begin=len(verts)
            for depth in (.585,.590):
                for r in (.025,.019):
                    for k in range(6):a=k*math.tau/6;verts.append(dp((x+r*math.cos(a),y+r*math.sin(a),depth)))
            for k in range(6):
                j=(k+1)%6
                for face in ((k,j,j+6,k+6),(k+12,k+18,j+18,j+12),(k+6,j+6,j+18,k+18)):faces.append(tuple(begin+v for v in face))
    mesh('Real perforated hexagonal front grille',verts,faces,steel)
    for x in (pcx-.27,pcx+.27):db('Front bezel rail',(x,.685,.60),(.022,1.07,.020),white,.006)
    for y in (.135,1.225):db('Front bezel rail',(pcx,y,.60),(.55,.027,.020),white,.006)
    dc('Recessed power button',(pcx+.17,1.245,.38),.022,.005,ink)
    for x in (pcx-.15,pcx-.03):db('USB-C port',(x,1.255,.35),(.065,.005,.024),ink,.006)
    for y in (.14,.26,.38):db('Rear expansion slot',(pcx,y,-.39),(.34,.022,.012),ink,.003)
    for x in (pcx-.22,pcx+.22):
        for z in (-.27,.40):dc('Tower vibration-isolating foot',(x,.061,z),.045,.065,g['rubber'])

    asset('record console')
    for y in (.14,.66,1.20):box('Walnut console shelf',(-2.75,y,3.75),(1.5,.055,.76),walnut,.018)
    for x in (-3.42,-2.08):
        for z in (3.43,4.07):box('Console tubular upright',(x,.64,z),(.028,1.20,.028),brass,.006)
    for i,color in enumerate((teal,clay,ochre,ivory)):box('Console stacked journals',(-2.71,.20+i*.055,3.72),(.72,.045,.48),color,.009,yaw=.025*(i%2))
    for i in range(5):box('Console record sleeve',(-3.20+i*.12,.89,3.72),(.085,.36,.46),[teal,clay,ivory,ochre,blue][i],.004)
    for z in (3.40,4.10):tube('Console brass side rail',[(-3.43,.70,z),(-3.43,1.12,z),(-2.07,1.12,z),(-2.07,.70,z)],.010,brass)
    asset('turntable')
    box('Turntable walnut plinth',(-2.46,1.285,3.72),(.65,.10,.47),walnut,.018);cyl('Turntable platter',(-2.51,1.342,3.72),.202,.022,silver);cyl('Vinyl record',(-2.51,1.357,3.72),.195,.008,ink)
    for r in (.075,.11,.15,.18):ring('Vinyl groove',(-2.51,1.362,3.72),r,.0014,g['rubber'])
    cyl('Record centre label',(-2.51,1.364,3.72),.056,.002,clay);cyl('Tonearm pivot',(-2.22,1.37,3.59),.027,.055,silver)
    tube('Curved tonearm',[(-2.22,1.40,3.59),(-2.23,1.405,3.75),(-2.31,1.38,3.83)],.008,silver);box('Pickup cartridge',(-2.31,1.377,3.83),(.025,.015,.046),ink,.003);cyl('Speed selector',(-2.21,1.339,3.87),.015,.006,ink)
    asset('console lamp');cyl('Mushroom lamp base',(-3.25,1.247,3.72),.145,.036,ochre);cyl('Mushroom lamp stem',(-3.25,1.465,3.72),.022,.40,brass)
    verts=[];faces=[]
    for row in range(17):
        t=row/16;r=.28*math.cos(t*math.pi/2)+.012;y=1.67+.29*math.sin(t*math.pi/2)
        for k in range(65):
            a=k/64*math.tau;verts.append((-3.25+r*math.cos(a),y,3.72+r*math.sin(a)))
            if row and k:n=row*65+k;faces.append((n-66,n-65,n,n-1))
    mesh('Enamel mushroom shade',verts,faces,ochre)
    asset('console lamp glow');cyl('Mushroom lamp diffuser',(-3.25,1.66,3.72),.263,.008,g['materials']['Warm lamp diffuser'])

    # Acoustic guitar with a real sound hole, binding, frets and six strings.
    asset('guitar');gx,gz=-4.43,2.54;outline=[]
    for k in range(97):
        a=k/96*math.tau;yy=.68+.48*math.sin(a);width=.30*(.77+.23*abs(math.sin(a)))-.035*math.exp(-((yy-.80)/.11)**2);outline.append((gx+width*math.cos(a),yy,gz+.10))
    verts=outline+[(gx+.076*math.cos(k/96*math.tau),.84+.076*math.sin(k/96*math.tau),gz+.10) for k in range(97)]
    mesh('Acoustic spruce soundboard',verts,[(k,k+1,k+98,k+97) for k in range(96)],honey)
    back=[(x,y,gz-.07) for x,y,z in outline];mesh('Guitar walnut back',back,[tuple(reversed(range(97)))],walnut);mesh('Curved guitar ribs',outline+back,[(k,k+97,k+98,k+1) for k in range(96)],walnut)
    tube('Guitar cream binding',outline,.006,cream);ring('Sound hole rosette',(gx,.84,gz+.104),.084,.008,walnut,direction=(0,0,1))
    box('Guitar neck',(gx,1.51,gz+.01),(.083,.87,.11),walnut,.012);box('Rosewood fingerboard',(gx,1.50,gz+.072),(.074,.87,.012),ink,.005);box('Guitar headstock',(gx,2.065,gz+.02),(.11,.24,.065),walnut,.018)
    for i in range(17):box('Guitar nickel fret',(gx,1.12+i*.048,gz+.080),(.078,.002,.003),silver,.0005)
    for y in (1.99,2.06,2.13):
        for side in (-1,1):cyl('Tuning machine peg',(gx+side*.072,y,gz+.026),.012,.035,silver,direction=(1,0,0))
    box('Acoustic bridge',(gx,.40,gz+.108),(.19,.035,.025),walnut,.005)
    for i in range(6):tube('Guitar string',[(gx-.022+i*.0088,.40,gz+.126),(gx-.022+i*.0088,1.94,gz+.086),(gx-.022+i*.0088,2.10,gz+.061)],.0010,silver)
    for x in (gx-.23,gx+.23):tube('Guitar stand foot',[(gx,.10,gz-.14),(x,.035,gz+.15)],.014,ink)
    tube('Guitar stand rear',[(gx,.04,gz-.20),(gx,.72,gz-.11)],.014,ink)

    asset('coffee table');box('Rounded walnut tea table',(3,.48,-2.0),(1.65,.065,.74),walnut,.19)
    for x in (2.4,3.6):
        for z in (-2.24,-1.76):box('Tea table tapered leg',(x,.24,z),(.04,.44,.04),teal,.008)
    box('Tea table journal',(2.51,.54,-2.01),(.33,.042,.36),clay,.008);cyl('Tea coaster',(2.95,.519,-2.03),.125,.008,ochre);g['mug']((2.95,.525,-2.03),.078);vessel('Blue bud vase',(3.48,.515,-2.00),.09,.24,blue)
    for i in range(5):
        a=i*2.399;tip=(3.48+math.cos(a)*.075,.91+(i%3)*.055,-2+math.sin(a)*.06);tube('Dried flower stem',[(3.48,.72,-2),tip],.0025,green)
        for k in range(7):
            aa=k*math.tau/7;sphere('Dried chamomile petals',(tip[0]+math.cos(aa)*.033,tip[1],tip[2]+math.sin(aa)*.033),(.019,.006,.010),cream)
        sphere('Dried flower centre',tip,(.014,.012,.014),ochre)
    asset('shelf ceramics')
    for x,r,h,color in [(-2.90,.12,.28,clay),(-2.52,.10,.37,blue),(-2.16,.13,.22,ochre)]:vessel('Shelf studio pottery',(x,4.38,-3.77),r,h,color)
    asset('console greenery');g['plant']((-1.3,0,4.40),.58)
    asset('flower stand details');vessel('Watering jug',(-5.10,.81,1.85),.083,.19,ochre);tube('Jug handle',[(-5.04,.88,1.85),(-4.97,.95,1.85),(-5.04,1.00,1.85)],.009,ochre)
    asset('guest lamp');box('Guest wall sconce plate',(-6.39,3.20,4.15),(.025,.22,.14),brass,.012);tube('Guest sconce arm',[(-6.36,3.20,4.15),(-6.12,3.20,4.15),(-6.09,3.11,4.15)],.014,brass)
    verts=[];faces=[]
    for row,(r,y) in enumerate(((.21,2.98),(.13,3.29))):
        for k in range(49):
            a=k/48*math.tau;verts.append((-6.09+r*math.cos(a),y,4.15+r*math.sin(a)))
            if row and k:n=49+k;faces.append((n-50,n-49,n,n-1))
    mesh('Guest pleated sconce shade',verts,faces,cream)
    asset('guest lamp glow');cyl('Guest sconce diffuser',(-6.09,2.979,4.15),.196,.008,g['materials']['Warm lamp diffuser'])
    g['light_anchors']['guest']={'position':[-6.09,2.92,4.15],'target':[-5.40,1.35,3.7]}
    g['light_anchors']['console']={'position':[-3.25,1.61,3.72],'target':[-2.70,.55,3.6]}
    g['register']('record console',[-3.50,.02,3.35],[-2.,2.0,4.15]);g['register']('guitar and stand',[-4.75,.02,2.30],[-4.10,2.20,2.72]);g['register']('tea table',[2.17,.01,-2.37],[3.83,1.05,-1.63])
    add_media_light(g)
    from floor_lounge import build
    build(g)
