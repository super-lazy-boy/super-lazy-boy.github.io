"""A low walnut display table and a cleared, measured miniature shelf."""
import bpy

def install(g):
    for obj in list(bpy.data.objects):
        if obj.get('asset_group')=='collector display':bpy.data.objects.remove(obj,do_unlink=True)
    for obj in bpy.data.objects:
        if obj.get('asset_group')!='shelf ceramics' or obj.get('display_relocated'):continue
        if obj.type!='MESH':continue
        from mathutils import Vector
        points=[obj.matrix_world@Vector(p) for p in obj.bound_box];center=(min(p.x for p in points)+max(p.x for p in points))/2
        original,target=min([(-2.90,-1.95),(-2.52,-1.60),(-2.16,-1.31)],key=lambda p:abs(p[0]-center))
        obj.location.x+=target-original;obj['display_relocated']=True
    box,tube,asset=(g[k] for k in ('box','tube','asset'))
    wood=bpy.data.materials['Oiled walnut joinery'];teal=bpy.data.materials['Deep teal painted timber'];brass=bpy.data.materials['Satin brass'] if bpy.data.materials.get('Satin brass') else g['brass']
    asset('collector display')
    box('Falcon display walnut top',(.25,.72,3.57),(2.06,.075,1.49),wood,.028)
    for x in (-.65,1.15):
        for z in (2.97,4.17):box('Display table tapered teal leg',(x,.355,z),(.050,.655,.050),teal,.010)
    for x in (-.65,1.15):tube('Display table side stretcher',[(x,.20,2.97),(x,.20,4.17)],.014,brass)
    tube('Display table long stretcher',[(-.65,.20,3.57),(1.15,.20,3.57)],.014,brass)
    box('Small brass display plaque',(.25,.675,4.326),(.42,.080,.012),brass,.008)
    g['register']('collector display',[ -.78,.02,2.825],[1.28,.758,4.335])
