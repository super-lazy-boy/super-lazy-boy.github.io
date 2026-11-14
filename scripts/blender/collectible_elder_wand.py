"""Six-knotted, physically pitted Elder Wand with an independent low display stand."""
import math,random
import bpy,bmesh
from collectible_builder import Builder,srgb
from collectible_fantasy_geometry import support

def build():
    b=Builder('elder-wand')
    wood=b.material('Aged elder wood','#4b3828',.58)
    node=wood.node_tree.nodes.new('ShaderNodeVertexColor');node.layer_name='Elder wood grain';wood.node_tree.links.new(node.outputs['Color'],wood.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
    ivory=b.material('Aged pale engraved collar','#c6ba91',.53)
    ink=b.material('Recessed collar marks','#5a4b34',.68)
    bronze=b.material('Display antique bronze','#95815a',.36,.84)
    walnut=b.material('Display walnut plinth','#ffffff',.58,texture='public/models/sunlit-room/walnut.png')
    felt=b.material('Display olive felt cradle','#444d3b',.96)
    # Uneven ovoid knots, with the lower two noticeably larger than the distal ones.
    nodes=[(.080,.0048,.032),(.235,.0063,.043),(.432,.0055,.034),(.605,.0042,.026),(.753,.0035,.023),(.879,.0028,.018)]
    rng=random.Random(7145);pits=[]
    for t,r,w in nodes:
        for i in range(28):pits.append((t+rng.uniform(-w*.77,w*.77),rng.uniform(-math.pi,math.pi),rng.uniform(.0010,.0021),rng.uniform(.0022,.0040),rng.uniform(.13,.24)))
    ts=set(i/205 for i in range(206))
    for t,r,w in nodes:
        for i in range(85):ts.add(t-w*1.45+i*w*2.90/84)
    ts=sorted(t for t in ts if 0<=t<=1);N=80;vertices=[];faces=[];uv=[];colors=[];length=.381
    for j,t in enumerate(ts):
        x=(t-.5)*length;cy=.052+.0018*math.sin(t*6.1);cz=.0014*math.sin(t*8.2)
        base=.00365*(1-t)+.00105*t
        if t<.037:base+=.0061*(1-t/.037)**2
        for tn,amount,width in nodes:base+=amount*math.exp(-((t-tn)/width)**4)
        nearby=[p for p in pits if abs(p[0]-t)<.022]
        for i in range(N+1):
            a=i*math.tau/N;grain=.00012*math.sin(t*162+a*7)+.00007*math.sin(t*409-a*13)
            depression=0
            for pt,pa,depth,wx,wa in nearby:
                da=(a-pa+math.pi)%math.tau-math.pi;depression+=depth*math.exp(-((t-pt)*length/wx)**2-(da/wa)**2)
            r=max(base*.58,base+grain-depression)
            vertices.append((x,cy+math.cos(a)*r,cz+math.sin(a)*r));uv.append((t,i/N))
            shade=.91+.08*math.sin(t*155+a*3)-min(.24,depression*90)
            colors.append((srgb(.285*shade),srgb(.215*shade),srgb(.151*shade),1))
            if j and i:
                k=j*(N+1)+i;faces.append((k-N-2,k-1,k,k-N-1))
    faces.extend([tuple(reversed(range(N))),tuple(range((len(ts)-1)*(N+1),(len(ts)-1)*(N+1)+N))])
    wand=b.mesh('Continuous pitted six-knot elder wood',vertices,faces,wood,uv,smooth=True)
    # Weld the angular seam and recalculate a genuinely closed, outward-facing skin.
    bm=bmesh.new();bm.from_mesh(wand.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00000001);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(wand.data);bm.free()
    layer=wand.data.color_attributes.new(name='Elder wood grain',type='FLOAT_COLOR',domain='CORNER')
    for loop in wand.data.loops:
        co=wand.data.vertices[loop.vertex_index].co;t=(co.x/length+.5);angle=math.atan2(-co.y,co.z-.052)
        shade=.91+.08*math.sin(t*155+angle*3);layer.data[loop.index].color=(srgb(.285*shade),srgb(.215*shade),srgb(.151*shade),1)
    wand['assembly']='wand';wand['knot_count']=6

    # Pale collar with fine dark angular markings, not an oversized metal sleeve.
    cx=(.322-.5)*length;cy=.052+.0018*math.sin(.322*6.1);cz=.0014*math.sin(.322*8.2)
    b.cylinder('Aged ivory rune collar',(cx,cy,cz),.00455,.0158,ivory,direction=(1,0,0),segments=80)
    for x in (cx-.0077,cx+.0077):b.ring('Collar fine incised end ring',(x,cy,cz),.00457,.00012,ink,normal=(1,0,0),segments=64)
    for band in range(4):
        a=band*math.pi/2
        def p(x,turn):return (cx+x,cy+math.cos(a+turn)*.00462,cz+math.sin(a+turn)*.00462)
        for offset in (-.0048,0,.0048):
            b.tube('Incised collar rune stem',[p(offset,-.38),p(offset,.38)],.00011,ink,segments=6)
            b.tube('Incised collar rune branch',[p(offset,-.28),p(offset+.0016,0),p(offset,.28)],.00011,ink,segments=6)

    start=len(b.objects)
    b.box('Display low walnut wand plinth',(0,.006,0),(.410,.012,.060),walnut,.004)
    for x in (-.133,.132):
        # Open cradles contact the quiet, narrow shaft intervals rather than the pitted knots.
        t=x/length+.5;center=.052+.0018*math.sin(t*6.1);side=.0014*math.sin(t*8.2)
        section=min(range(len(ts)),key=lambda j:abs(ts[j]-t))
        radius=center-min(vertices[section*(N+1)+i][1] for i in range(N+1))+.00127
        foot_top=center-radius
        b.cylinder('Display small bronze foot',(x,(.012+foot_top)/2,side),.0033,foot_top-.012,bronze,segments=32)
        pts=[];lining=[]
        for i in range(31):
            a=math.pi/2+i*math.pi/30
            pts.append((x,center+math.cos(a)*radius,side+math.sin(a)*radius))
            lining.append((x,center+math.cos(a)*(radius-.00075),side+math.sin(a)*(radius-.00075)))
        b.tube('Display open bronze cradle',pts,.00125,bronze,segments=10)
        b.tube('Display soft cradle lining',lining,.00062,felt,segments=8)
    support(b.objects[start:])
    b.camera_view=(.36,1.60,2.55);b.studio_world_color=(.48,.48,.48,1);b.studio_world_strength=.7
    b.layout_details={'reference':'Supplied Elder Wand photographs and Noble Collection 15-inch proportions','wandLength':.381,'knotCount':6,'recessedPores':len(pits),
        'paleRunicCollar':True,'displaySupportCanHide':True,'features':['continuous gently curved wood shaft','six uneven ovoid knots','real recessed surface pits','flared heel','engraved pale collar','low walnut and bronze stand']}
    b.finish()

if __name__=='__main__':build()
