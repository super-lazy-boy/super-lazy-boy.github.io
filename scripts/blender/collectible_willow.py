"""Triangular paper carton with a partially exposed, irregular hollow willow."""
from collectible_builder import Builder
from collectible_willow_cage import add_cage


def build():
    b=Builder('wish-willow')
    paper=b.material('Uncoated cream paper stock','#f0e8ce',.88)
    edge=b.material('Cut paper fibres','#d5c8a6',.96)
    printed=b.material('Reference sleeve print atlas','#ffffff',.78,texture='public/models/collectibles/wish-package-print.png')
    x0,x1=-.128,.098
    cross=[(.003,.04),(.073,0),(.003,-.04)];cy=sum(y for y,z in cross)/3
    inner=[(cy+(y-cy)*.982,z*.982) for y,z in cross]
    panels=[(488,773,1420,338),(488,1118,1420,337),(488,410,1420,357)]
    for i,(left,top,width,height) in enumerate(panels):
        j=(i+1)%3;y,z=cross[i];yy,zz=cross[j]
        u0,u1=left/2400,(left+width)/2400;v0,v1=1-(top+height)/1800,1-top/1800
        uv=[(u0,v0),(u1,v0),(u1,v1),(u0,v1)] if i!=1 else [(u1,v1),(u0,v1),(u0,v0),(u1,v0)]
        b.mesh('Printed triangular carton face '+str(i),[(x0,y,z),(x1,y,z),(x1,yy,zz),(x0,yy,zz)],[(0,1,2,3)],printed,uv)
        y,z=inner[i];yy,zz=inner[j]
        b.mesh('Unprinted inner carton face '+str(i),[(x0,y,z),(x1,y,z),(x1,yy,zz),(x0,yy,zz)],[(3,2,1,0)],paper)
        for x in (x0,x1):
            a=cross[i];c=cross[j];d=inner[j];e=inner[i]
            b.mesh('Thin carton cut edge',[(x,*a),(x,*c),(x,*d),(x,*e)],[(0,1,2,3)],edge)
        b.tube('Pressed long carton fold',[(x0,*cross[i]),(x1,*cross[i])],.00016,edge,segments=6)
    # Closed left end and one unobstructed triangular opening on the right.
    # All paper stays inside these end planes: there is no sliding tray or loose flap.
    b.mesh('Closed printed triangular end',[(x0-.00022,y,z) for y,z in cross],[(2,1,0)],printed,
        [(485/2400,1-1110/1800),(194/2400,1-945/1800),(485/2400,1-778/1800)])
    b.mesh('Inside of closed triangular end',[(x0+.0002,y,z) for y,z in inner],[(0,1,2)],paper)
    for k in range(3):
        y,z=cross[k]
        b.tube('Flush end flap score',[(x0-.00030,cy,0),(x0-.00030,y*.90+cy*.10,z*.90)],.00010,edge,segments=6)
    cage,openings=add_cage(b)
    # The branch is inserted through the opening, with about 8.5 cm left exposed.
    cage.location.x+=.062
    floor=inner[0][0]
    lowest=min(v.co.z for v in cage.data.vertices)
    cage.location.z+=floor+.00030-lowest
    cage['inserted_in_carton']=True
    b.camera_view=(.95,1.15,2.60);b.studio_world_color=(.52,.52,.52,1);b.studio_world_strength=.65
    b.layout_details={
        'reference':'User-supplied irregular hollow black willow and triangular paper carton',
        'openLattice':True,'irregularOpenings':True,'sideOpeningCount':len(openings),'forkedEnds':True,
        'display':'Willow inside a simple triangular carton, protruding through the right opening',
        'paperPrintPreserved':True,'slidingTray':False,'cartonEndX':x1,'cartonLength':x1-x0,
        'branchInserted':True,'exposedLength':max(v.co.x for v in cage.data.vertices)+cage.location.x-x1,
        'openingPattern':openings}
    b.finish()
