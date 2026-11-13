"""Paper sleeve and a partially withdrawn willow, matching the .app reference."""
import math
from collectible_builder import Builder

def build():
    b=Builder('wish-willow');paper=b.material('Uncoated cream paper stock','#f0e8ce',.88);edge=b.material('Cut paper fibres','#d5c8a6',.96);inside=b.material('Unprinted inner tray','#e8dcc0',.92)
    printed=b.material('Reference sleeve print atlas','#ffffff',.78,texture='public/models/collectibles/wish-package-print.png')
    bark=b.material('Willow chocolate bark','#3e3026',.93);barklight=b.material('Raised bark fibres','#705842',.96);char=b.material('Spark darkened middle','#211d18',.98);grain=b.material('Exposed end grain','#bd9b68',.93)
    x0,x1=-.128,.098;cross=[(.003,.04),(.073,0),(.003,-.04)];cy=sum(y for y,z in cross)/3
    inner=[(cy+(y-cy)*.982,z*.982) for y,z in cross]
    # Panel crops are UV windows into the published paper net, not screenshots.
    # Both sloping long faces read upright when the grounded box is turned around.
    panels=[(488,773,1420,338),(488,1118,1420,337),(488,410,1420,357)]
    for i,(left,top,width,height) in enumerate(panels):
        j=(i+1)%3;y,z=cross[i];yy,zz=cross[j]
        u0,u1=left/2400,(left+width)/2400;v0,v1=1-(top+height)/1800,1-top/1800
        uv=[(u0,v0),(u1,v0),(u1,v1),(u0,v1)] if i!=1 else [(u1,v1),(u0,v1),(u0,v0),(u1,v0)]
        b.mesh('Printed folded sleeve face '+str(i),[(x0,y,z),(x1,y,z),(x1,yy,zz),(x0,yy,zz)],[(0,1,2,3)],printed,uv)
        y,z=inner[i];yy,zz=inner[j]
        b.mesh('Paper thickness, inner face '+str(i),[(x0,y,z),(x1,y,z),(x1,yy,zz),(x0,yy,zz)],[(3,2,1,0)],paper)
        for x in (x0,x1):
            a=cross[i];c=cross[j];d=inner[j];e=inner[i];b.mesh('Visible cut paper edge',[(x,*a),(x,*c),(x,*d),(x,*e)],[(0,1,2,3)],edge)
        b.tube('Pressed long paper fold',[(x0,*cross[i]),(x1,*cross[i])],.00016,edge,segments=6)
    # A closed folded end at the left, and a genuinely hollow opening at right.
    v=[(x0-.00022,y,z) for y,z in cross];b.mesh('Folded left triangle cap',v,[(2,1,0)],printed,[(485/2400,1-1110/1800),(194/2400,1-945/1800),(485/2400,1-778/1800)])
    for k in range(3):
        y,z=cross[k];b.tube('Diagonal end flap score',[(x0-.0003,cy,0),(x0-.0003,y*.90+cy*.10,z*.90)],.00010,edge,segments=6)
    b.box('Sleeve glue tab at underside',(-.015,.0034,-.027),(.21,.0007,.013),paper,.0001)
    # Three folded tray panels, slid 34 mm beyond the sleeve opening.
    xa,xb=-.104,.137
    b.mesh('Inner tray floor',[(xa,.0048,-.032),(xb,.0048,-.032),(xb,.0048,.032),(xa,.0048,.032)],[(3,2,1,0)],inside)
    for side in (-1,1):
        b.mesh('Folded inner tray lip',[(xa,.0048,side*.032),(xb,.0048,side*.032),(xb,.014,side*.027),(xa,.014,side*.027)],[(0,1,2,3)],paper)
        b.tube('Tray rolled cut edge',[(xa,.014,side*.027),(xb,.014,side*.027)],.00022,edge,segments=6)
    b.mesh('Tray triangular pull flap',[(xb,.0048,-.032),(xb,.0048,.032),(xb,.010,0)],[(0,1,2)],paper)
    # Asymmetric bark is a closed mesh, not a featureless straight cylinder.
    N,M=18,41;v=[];f=[]
    for j in range(M):
        t=j/(M-1);x=-.09+t*.240;yc=.020+.0014*math.sin(t*9);zc=.0028*math.sin(t*11);r=.0036*(1-.40*t)*(1+.11*math.sin(t*63))
        for i in range(N):
            a=i*math.tau/N;rr=r*(1+.10*math.sin(i*2.2+j*.25));v.append((x,yc+math.cos(a)*rr,zc+math.sin(a)*rr))
            if j:k=j*N+i;l=j*N+(i+1)%N;f.append((k-N,l-N,l,k))
    f.extend([tuple(reversed(range(N))),tuple(range((M-1)*N,M*N))]);b.mesh('Naturally uneven willow bark',v,f,bark,smooth=True)
    for i in range(14):
        a=i*math.tau/14;pts=[]
        for j in range(33):
            t=j/32;x=-.089+t*.238;r=.0036*(1-.40*t)*1.02;pts.append((x,.020+.0014*math.sin(t*9)+math.cos(a+t*.3)*r,.0028*math.sin(t*11)+math.sin(a+t*.3)*r))
        b.tube('Continuous fine bark furrow',pts,.00010,barklight,segments=5)
    b.tube('Single willow offshoot',[(.115,.020,-.003),(.126,.025,-.009),(.135,.025,-.015)],.00075,bark,segments=9)
    for x in (.111,.125,.139):
        b.cushion('Bark node',(x,.020,.001),(.0025,.0046,.0046),bark,power=.8)
    b.cylinder('Visible fibrous cut end',(.1503,.0186,-.0027),.00215,.00035,grain,direction=(1,0,0),segments=18)
    for i in range(3):b.ring('Willow end growth ring',(.1505,.0186,-.0027),.00055+i*.00055,.00009,barklight,normal=(1,0,0),segments=18)
    b.cylinder('Charred spark patch',(.025,.020,.0027),.0039,.009,char,direction=(1,0,0),segments=18)
    b.finish((.26,.070,.080))
