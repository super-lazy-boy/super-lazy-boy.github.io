"""Triangular mandibles and shallow cargo mouth, traced from the supplied views.

The broad forebody reaches nearly to the tips. The slot is a short opening at
the nose, rather than the long rectangular void of the previous study.
"""
import math

def add_forebody(b,m,cx,cz):
    gray,pale,mid,dark,black,metal=[m[k] for k in ('gray','pale','mid','dark','black','metal')]
    tip,slot_end=.415,.289
    stations=[(-.015,.238),(.050,.207),(.170,.154),(.290,.106),(tip,.068)]
    def outer(z):
        for (a,x),(c,xx) in zip(stations,stations[1:]):
            if z<=c:return x+(xx-x)*(z-a)/(c-a)
        return stations[-1][1]
    def inner(z):return .027+.008*max(0,min(1,(z+.015)/.304))
    def foretop(x,z):return .159-.12*(z-cz)-.05*(abs(x-cx)-.035)/.240
    for side in (-1,1):
        def px(v):return cx+side*v
        shape=[(px(inner(-.015)),-.015)]+[(px(x),z) for z,x in stations]+[(px(inner(tip)),tip)]
        b.solid('Tapered mandible dark chassis',shape,lambda x,z:foretop(x,z)-.027,lambda x,z:foretop(x,z)-.009,dark)
        b.solid('Lower triangular mandible armor',shape,lambda x,z:foretop(x,z)-.029,lambda x,z:foretop(x,z)-.025,mid)
        holes=[((inner(z)+outer(z))*.50,z) for z in (.155,.252)]
        for row in range(10):
            z0=.018+row*.0394;z1=min(tip-.002,z0+.0378)
            poly=[(px(inner(z0)),z0),(px(outer(z0)-.002),z0),(px(outer(z1)-.002),z1),(px(inner(z1)),z1)]
            plate=b.solid('Tapered triangular mandible plate',poly,lambda x,z:foretop(x,z)-.003,lambda x,z:foretop(x,z)+.002,[gray,pale,gray,pale,mid][row%5])
            for xx,zz in holes:
                if z0-.017<zz<z1+.017:b.cut_round(plate,'Recessed mandible inspection aperture',px(xx),zz,.0152)
            for t in (.16,.84):
                for z in (z0+.009,z1-.008):
                    xx=inner(z)+(outer(z)-inner(z))*t
                    if all(math.hypot(xx-hx,z-hz)>.020 for hx,hz in holes):b.cylinder('Mandible fitted plate stud',(px(xx),foretop(px(xx),z)+.003,z),.0021,.0017,gray,segments=12)
            z=(z0+z1)*.5;xx=inner(z)+(outer(z)-inner(z))*.72
            if all(math.hypot(xx-hx,z-hz)>.024 for hx,hz in holes):b.box('Mandible inset fitted tile',(px(xx),foretop(px(xx),z)+.004,z),(min(.025,(outer(z)-inner(z))*.22),.003,.024),pale,.0007,rotation=(.12,0,side*.20))
        for xx,z in holes:
            x=px(xx);y=foretop(x,z)
            b.cylinder('Mandible dark well floor',(x,y-.010,z),.015,.0018,black,segments=32)
            b.lathe('Mandible recessed port liner',(x,y,z),[(-.011,.015),(.001,.015),(.003,.018),(.005,.018),(.005,.0153),(-.011,.0140)],mid,segments=40)
            for j in range(-3,4):dx=j*.0032;length=2*math.sqrt(.0125**2-dx*dx);b.box('Mandible port grille',(x+dx,y-.003,z),(.001,.002,length),metal,.0001)
        for rail in ('inner','outer'):
            pts=[]
            for k in range(49):
                z=.040+k*(tip-.050)/48;xx=inner(z)+.009 if rail=='inner' else outer(z)-.009;x=px(xx);pts.append((x,foretop(x,z)+.008,z))
            b.tube('Contour-following mandible pipe',pts,.0016,metal,segments=8)
            for z in (.08,.205,.355):
                xx=inner(z)+.009 if rail=='inner' else outer(z)-.009;x=px(xx);b.box('Mandible pipe retaining saddle',(x,foretop(x,z)+.007,z),(.006,.003,.004),gray,.0003)
        for row in range(18):
            z=.035+row*.0205
            for which,xx in [('inner',inner(z)),('outer',outer(z))]:
                if which=='inner' and z<slot_end:continue
                x=px(xx);y=foretop(x,z)-.014;n=(side if which=='outer' else -side,0,0)
                b.cylinder('Mandible side socket',(x,y,z),.0032,.003,black,direction=n,segments=12);b.ring('Mandible socket metal lip',(x+n[0]*.0015,y,z),.0033,.0005,metal,normal=n,segments=12)
        for xx in (.043,.060):
            x=px(xx);y=foretop(x,tip)-.014;b.cylinder('Narrow nose coupling',(x,y,tip+.003),.0037,.005,metal,direction=(0,0,1),segments=16);b.cylinder('Nose coupling dark aperture',(x,y,tip+.0056),.0021,.0006,black,direction=(0,0,1),segments=12)
        x=px((inner(tip)+outer(tip))*.5);b.box('Short bevelled nose tip',(x,foretop(x,tip)-.002,tip),(.035,.006,.010),pale,.0011,rotation=(0,0,side*.20))
    bridge=[(cx-.057,cz-.010),(cx+.057,cz-.010),(cx+.035,slot_end),(cx-.035,slot_end)]
    bridge_top=lambda x,z:.159-(z-cz)*.12
    b.solid('Long central forward crew-access body',bridge,lambda x,z:bridge_top(x,z)-.022,bridge_top,gray)
    for j in range(7):
        z=cz+.035+j*.041;w=.104-(z-cz)*.09;b.box('Centre body crosswise armor plate',(cx,bridge_top(cx,z)+.002,z),(w,.003,.037),pale if j%3 else mid,.0008,rotation=(.119,0,0))
    for xx in (-.021,.021):b.tube('Centre body exposed supply pipe',[(cx+xx,bridge_top(cx,z)+.008,z) for z in [cz+.035+k*.014 for k in range(21)]],.0015,metal,segments=8)
    y=bridge_top(cx,slot_end)-.016
    b.box('Recessed forward cargo bulkhead',(cx,y,slot_end-.002),(.070,.034,.016),gray,.002)
    b.box('Dark cargo hatch behind shallow nose gap',(cx,y,slot_end+.007),(.048,.022,.002),dark,.001)
    for xx in (-.027,.027):b.tube('Cargo aperture jamb pipe',[(cx+xx,y-.014,slot_end+.009),(cx+xx,y+.013,slot_end+.009)],.0014,metal,segments=8)
    return foretop
