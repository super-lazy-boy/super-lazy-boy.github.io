"""One closed, weighted beanbag: a rounded outer shell flows into the sunken seat.

Coordinates are the website's Y-up units. Large folds are real geometry; the
separate fabric maps describe only the millimetre-scale warp and weft.
"""
import math,random

TAU=math.tau
def smooth(a,b,x):
    t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
def angular(a):return (a+math.pi)%TAU-math.pi
rng=random.Random(217)
# Short asymmetric gathers fan away from seam/pressure points. Their spacing,
# length and depth vary; no continuous corrugated bands cross the whole chair.
FOLDS=[]
for side,count in ((-1,7),(1,12)):
    for j in range(count):
        FOLDS.append(('back',side,rng.uniform(.27,.68),rng.uniform(.12,.39),rng.uniform(.23,.66),rng.uniform(.012,.022),rng.uniform(.010,.026)))
for side in (-1,1):
    for j in range(9):
        FOLDS.append(('front',side,rng.uniform(.34,.68),rng.uniform(-.16,.20),rng.uniform(.20,.55),rng.uniform(.009,.018),rng.uniform(.010,.023)))

def base(u,a):
    theta=math.pi*u;r=math.sin(theta)
    # A weighted ovoid bag, pressed flat on the rug. The widest belly sits
    # below the shoulder; there is no separate rim, upright back or armrest.
    fullness=1+.021*math.sin(3*a+.4)*math.sin(theta)**2+.012*math.cos(5*a-.8)*math.sin(theta)**3
    x=1.02*r*math.sin(a)*fullness
    z=1.02*r*math.cos(a)*fullness
    raw=.72-1.10*math.cos(theta)
    y=.044+.025*math.log1p(math.exp(min(100,(raw-.044)/.025)))
    upper=smooth(.43,.58,u)
    # A broad sloping depression pushes into the stuffed volume. Gaussian
    # shoulders stay thick and roll directly into the rounded outer belly.
    depth=.46 if z>-.18 else .64
    depression=1.20*math.exp(-((x-.075)/.60)**2-((z+.18)/depth)**2)
    y-=upper*depression
    y-=upper*.063*math.exp(-(x/.048)**2)*smooth(-.18,.20,z)*(1-smooth(.62,.86,z))
    y+=upper*(.055*math.exp(-((x-.35)/.28)**2-((z-.48)/.26)**2)+.065*math.exp(-((x+.38)/.30)**2-((z-.50)/.28)**2))
    # Soft front lobes, drawn together at the central sewn cleft.
    front=math.exp(-((x-.12)/.30)**2-((z+.72)/.30)**2)
    y-=upper*.16*front
    y+=upper*(.105*math.exp(-((x+.43)/.25)**2-((z+.72)/.32)**2)+.075*math.exp(-((x-.48)/.25)**2-((z+.68)/.34)**2))
    # Loose filling remains beneath the sitter: a slumped convex seat roll
    # interrupts the empty bowl and blends into the gathered front lobes.
    y+=upper*.16*math.exp(-((x-.025)/.56)**4-((z+.24)/.40)**2)
    y-=upper*.040*math.exp(-((x-.04)/.075)**2-((z+.13)/.58)**2)
    return (3+x,.044+(y-.044)*.80,.79+z)

def normal(fn,u,a):
    h=.00015
    pa,pb=fn(u,a-h),fn(u,a+h);pu,pv=fn(max(.00001,u-h),a),fn(min(.99999,u+h),a)
    da=[pb[i]-pa[i] for i in range(3)];du=[pv[i]-pu[i] for i in range(3)]
    n=(da[1]*du[2]-da[2]*du[1],da[2]*du[0]-da[0]*du[2],da[0]*du[1]-da[1]*du[0]);length=math.sqrt(sum(v*v for v in n))
    return tuple(v/max(length,1e-12) for v in n)

def point(u,a):
    p=base(u,a)
    if u<=.015 or u>=.997:return p
    x=p[0]-3;z=p[2]-.79;upper=smooth(.48,.62,u)
    folds=0
    for region,side,anchor,slope,length,width,height in FOLDS:
        if region=='back':
            along=side*x;across=z-anchor+slope*along
            taper=smooth(.015,.08,along)*(1-smooth(length*.70,length,along))
            weight=upper*smooth(.03,.28,z)
        else:
            d=angular(a-math.pi);along=side*d;across=u-anchor-slope*along
            taper=smooth(.015,.07,along)*(1-smooth(length*.65,length,along))
            weight=smooth(.25,.39,u)*(1-smooth(.73,.87,u))
        folds+=height*taper*weight*(math.exp(-(across/width)**2)-.65*math.exp(-((across-width*.8)/(width*.55))**2))
    # The upper skin wrinkles vertically, preserving the radial order of the
    # seating surface. Lower gathers move radially, preserving height order.
    radius=math.hypot(x,z);front=math.exp(-(angular(a-math.pi)/.13)**2)
    lobes=.053*math.exp(-(angular(a-math.pi-.34)/.24)**2)+.066*math.exp(-(angular(a-math.pi+.38)/.25)**2)
    radial=radius*(-.10*front+lobes)*smooth(.24,.40,u)
    radial+=folds*(1-smooth(.40,.49,u))
    vertical=folds*smooth(.51,.64,u)
    vertical+=.0045*upper*math.sin(x*18+z*7)*math.sin(z*13-x*5)*(1-smooth(.88,.98,u))
    return (p[0]+math.sin(a)*radial,p[1]+vertical*.80,p[2]+math.cos(a)*radial)

def surface_normal(u,a):return normal(point,u,a)

def replaced(obj):
    group=obj.get('asset_group','')
    if group=='lounge':return not obj.name.startswith(('Woven lounge rug','Rug bound edge','Cotton fringe'))
    return group=='soft furnishings' and not obj.name.startswith('Floor cushion')
