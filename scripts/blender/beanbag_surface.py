"""One closed, weighted beanbag: a rounded outer shell flows into the sunken seat.

Coordinates are the website's Y-up units. Large folds are real geometry; the
separate fabric maps describe only the millimetre-scale warp and weft.
"""
import math,random

TAU=math.tau
def smooth(a,b,x):
    t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
def angular(a):return (a+math.pi)%TAU-math.pi
def catmull(points,t):
    q=max(0,min(.999999999,t))*(len(points)-1);i=int(q);f=q-i
    a,b,c,d=(points[max(0,min(len(points)-1,k))] for k in (i-1,i,i+1,i+2))
    return tuple(.5*((2*b[k])+(-a[k]+c[k])*f+(2*a[k]-5*b[k]+4*c[k]-d[k])*f*f+(-a[k]+3*b[k]-3*c[k]+d[k])*f*f*f) for k in range(2))

rng=random.Random(115)
FOLDS=[]
for anchor,side in ((.16,1),(-.15,-1),(math.pi-.13,-1),(-math.pi+.12,1)):
    for j in range(12):
        FOLDS.append((anchor+side*rng.uniform(.07,.34),rng.uniform(.49,.87),side*rng.uniform(-.16,.24),rng.uniform(.19,.42),rng.uniform(.007,.012),rng.uniform(.012,.027)))

def base(u,a):
    back=smooth(-.60,.85,math.cos(a))
    rim=.72+.76*back+.19*math.sin(a)**2+.025*math.sin(3*a+.3)
    rim-=.12*math.exp(-(angular(a)/.20)**2)+.085*math.exp(-(angular(a-math.pi)/.18)**2)
    rim+=.075*math.exp(-((abs(angular(a))-.42)/.27)**2)
    seat=.485
    profile=[(0,.045),(.34,.045),(.66,.050),(.87,.105),(.994,.27),
             (1.045,rim*.48),(1.025,rim*.76),(.965,rim*.96),(.87,rim+.014),
             (.75,rim*.89),(.59,seat+(rim-seat)*.63),(.40,seat+.105),(.20,seat+.014),(0,seat)]
    r,y=catmull(profile,u)
    if u<=0:r,y=0,.045
    if u>=1:r,y=0,seat
    fullness=1+.018*math.sin(3*a+.6)*math.sin(math.pi*u)**2
    dome=smooth(.38,.65,u)*back
    x=3+.96*r*math.sin(a)*fullness*(1-.085*dome)
    z=.79+1.025*r*math.cos(a)*fullness*(1-.30*dome)-.32*smooth(.70,1,u)
    return (x,y,z)

def normal(fn,u,a):
    h=.00015
    pa,pb=fn(u,a-h),fn(u,a+h);pu,pv=fn(max(.00001,u-h),a),fn(min(.99999,u+h),a)
    da=[pb[i]-pa[i] for i in range(3)];du=[pv[i]-pu[i] for i in range(3)]
    n=(da[1]*du[2]-da[2]*du[1],da[2]*du[0]-da[0]*du[2],da[0]*du[1]-da[1]*du[0]);length=math.sqrt(sum(v*v for v in n))
    return tuple(v/max(length,1e-12) for v in n)

def point(u,a):
    p=base(u,a)
    if u<=.015 or u>=.995:return p
    envelope=smooth(.20,.42,u)*(1-smooth(.95,.995,u))
    # A cinched rear panel and front cleft give two soft front lobes, not a rigid rim.
    crease=-.060*math.exp(-(angular(a)/.095)**2)-.078*math.exp(-(angular(a-math.pi)/.15)**2)
    crease-=.008*(1-smooth(.48,.59,u))*(math.exp(-(angular(a-1.58)/.075)**2)+math.exp(-(angular(a+1.58)/.075)**2))
    crease*=math.sin(math.pi*u)**.7
    folds=0
    for angle,centre,slope,length,width,height in FOLDS:
        d=angular(a-angle);across=u-centre-slope*d
        taper=math.exp(-(d/length)**4)
        folds+=height*taper*(math.exp(-(across/width)**2)-.58*math.exp(-((across-width*.75)/(width*.55))**2))
    folds+=.0035*math.sin(19*a+13*u)*math.sin(11*a-8*u)*math.sin(math.pi*u)**3
    amount=envelope*(crease+folds)
    # Outer gathers keep each horizontal section star-shaped. The bowl wrinkles
    # move vertically, preserving its radial ordering. A quiet rounded crown
    # separates these directions instead of pushing opposing panels through.
    radial=amount*.85*(1-smooth(.48,.59,u));vertical=amount*smooth(.69,.77,u)
    # Small compressed folds continue over the crown as vertical puckers. They
    # keep the cloth from reading as a uniformly smooth moulded skin.
    crown=smooth(.50,.60,u)*(1-smooth(.69,.77,u))
    vertical+=.023*math.tanh(envelope*(folds+crease*.22)/.023)*crown
    return (p[0]+math.sin(a)*radial,p[1]+vertical,p[2]+math.cos(a)*radial)

def surface_normal(u,a):return normal(point,u,a)

def replaced(obj):
    group=obj.get('asset_group','')
    if group=='lounge':return not obj.name.startswith(('Woven lounge rug','Rug bound edge','Cotton fringe'))
    return group=='soft furnishings' and not obj.name.startswith('Floor cushion')
