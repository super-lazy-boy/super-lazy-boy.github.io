"""Printed paper sleeve, withdrawn tray, and the separate hollow willow prop."""
from collectible_builder import Builder
from collectible_willow_cage import add_cage

def build():
    b=Builder('wish-willow');paper=b.material('Uncoated cream paper stock','#f0e8ce',.88);edge=b.material('Cut paper fibres','#d5c8a6',.96);inside=b.material('Unprinted inner tray','#e8dcc0',.92)
    printed=b.material('Reference sleeve print atlas','#ffffff',.78,texture='public/models/collectibles/wish-package-print.png')
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
    # Keep the existing printed paper net, but display the corrected prop alongside it.
    for obj in b.objects:obj.location.y+=.020;obj.location.z-=.003
    add_cage(b)
    b.camera_view=(.70,1.90,2.5);b.studio_world_color=(.52,.52,.52,1);b.studio_world_strength=.65
    b.layout_details={'reference':'User-supplied black hollow willow prop photographs','openLattice':True,'windowRows':5,'forkedEnds':True,
        'display':'Paper sleeve and fully visible, separate charred lattice side by side','paperPrintPreserved':True}
    b.finish((.26,.070,.118))
