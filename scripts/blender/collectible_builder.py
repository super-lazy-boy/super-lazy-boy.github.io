"""Low-level, instanced Blender modelling helpers for the new collectibles.

Author in Y-up coordinates, keep editable native parts, then join by material
only for web export. Cached chamfered primitives avoid thousands of operators.
"""
import bpy,bmesh,math,json
from pathlib import Path
from mathutils import Vector,Matrix,Euler

ROOT=Path(__file__).resolve().parents[2]
C=Matrix(((1,0,0,0),(0,0,-1,0),(0,1,0,0),(0,0,0,1)))
def xyz(p):return (p[0],-p[2],p[1])
def srgb(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4

class Builder:
    def __init__(self,name,unit=1):
        for obj in list(bpy.data.objects):bpy.data.objects.remove(obj,do_unlink=True)
        self.name=name;self.unit=unit;self.cache={};self.objects=[];self.materials={}
    def material(self,name,color,rough=.65,metal=0,texture=None):
        m=bpy.data.materials.new(self.name+' '+name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF')
        p.inputs['Base Color'].default_value=(*[srgb(int(color[i:i+2],16)/255) for i in (1,3,5)],1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal
        if texture:
            t=m.node_tree.nodes.new('ShaderNodeTexImage');t.image=bpy.data.images.load(str(ROOT/texture));t.image.pack();m.node_tree.links.new(t.outputs['Color'],p.inputs['Base Color'])
        self.materials[name]=m;return m
    def instance(self,name,data,material,p=(0,0,0),rotation=(0,0,0)):
        if not data.materials:data.materials.append(material)
        obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.location=xyz([v*self.unit for v in p]);obj.rotation_euler=(C@Euler(rotation,'XYZ').to_matrix().to_4x4()@C.inverted()).to_euler();obj['asset_group']=self.name;self.objects.append(obj);return obj
    def box(self,name,p,size,material,bevel=.01,rotation=(0,0,0)):
        dims=tuple(round(v*self.unit,7) for v in size);r=min(bevel*self.unit,min(dims)*.22);key=('box',dims,round(r,7),material.name)
        if key not in self.cache:
            bm=bmesh.new();bmesh.ops.create_cube(bm,size=1)
            for v in bm.verts:v.co.x*=dims[0];v.co.y*=dims[2];v.co.z*=dims[1]
            if r>0:bmesh.ops.bevel(bm,geom=list(bm.edges),offset=r,segments=2,affect='EDGES')
            bm.normal_update();data=bpy.data.meshes.new(name);bm.to_mesh(data);bm.free();data.update()
            for face in data.polygons:face.use_smooth=max(abs(v) for v in face.normal)<.999
            self.cache[key]=data
        return self.instance(name,self.cache[key],material,p,rotation)
    def cylinder(self,name,p,r,h,material,direction=(0,1,0),r2=None,segments=24):
        radius=r*self.unit;top=(r if r2 is None else r2)*self.unit;height=h*self.unit;key=('cyl',radius,top,height,segments,material.name)
        if key not in self.cache:
            v=[];f=[]
            for z,rr in ((-height/2,radius),(height/2,top)):
                for k in range(segments):a=k*math.tau/segments;v.append((rr*math.cos(a),rr*math.sin(a),z))
            for k in range(segments):j=(k+1)%segments;f.append((k,j,j+segments,k+segments))
            f.extend([tuple(reversed(range(segments))),tuple(range(segments,segments*2))]);data=bpy.data.meshes.new(name);data.from_pydata(v,[],f);data.update()
            for face in data.polygons:face.use_smooth=len(face.vertices)==4
            self.cache[key]=data
        obj=self.instance(name,self.cache[key],material,p);obj.rotation_euler=Vector(xyz(direction)).to_track_quat('Z','Y').to_euler();return obj
    def mesh(self,name,verts,faces,material,uv=None,smooth=False):
        data=bpy.data.meshes.new(name);data.from_pydata([xyz([v*self.unit for v in p]) for p in verts],[],faces);data.update()
        for face in data.polygons:face.use_smooth=smooth
        if uv:
            layer=data.uv_layers.new()
            for loop in data.loops:layer.data[loop.index].uv=uv[loop.vertex_index]
        return self.instance(name,data,material)
    def tube(self,name,points,r,material,segments=8):
        verts=[];faces=[]
        for i,p in enumerate(points):
            tangent=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)]);tangent.normalize();up=Vector((0,1,0))
            if abs(tangent.dot(up))>.95:up=Vector((1,0,0))
            side=tangent.cross(up).normalized();other=tangent.cross(side).normalized()
            for k in range(segments):
                a=k*math.tau/segments;q=Vector(p)+(side*math.cos(a)+other*math.sin(a))*r;verts.append(tuple(q))
                if i:j=(k+1)%segments;n=i*segments;faces.append((n-segments+k,n-segments+j,n+j,n+k))
        faces.extend([tuple(reversed(range(segments))),tuple(range(len(verts)-segments,len(verts)))]);return self.mesh(name,verts,faces,material,smooth=True)
    def ring(self,name,p,r,t,material,normal=(0,1,0),segments=48):
        n=Vector(normal).normalized();up=Vector((1,0,0)) if abs(n.x)<.95 else Vector((0,1,0));a=n.cross(up).normalized();b=n.cross(a).normalized()
        points=[tuple(Vector(p)+r*(a*math.cos(i*math.tau/segments)+b*math.sin(i*math.tau/segments))) for i in range(segments+1)];return self.tube(name,points,t,material)
    def bounds(self):
        # Rotated local AABBs contain empty corners, especially around cylinders.
        # Calibrate physical model dimensions using the actual vertex envelope.
        bpy.context.view_layer.update();lo=[math.inf]*3;hi=[-math.inf]*3
        for obj in self.objects:
            for vertex in obj.data.vertices:
                v=obj.matrix_world@vertex.co;p=(v.x,v.z,-v.y)
                for axis in range(3):lo[axis]=min(lo[axis],p[axis]);hi[axis]=max(hi[axis],p[axis])
        return lo,hi
    def finish(self,target=None):
        lo,hi=self.bounds();size=[hi[i]-lo[i] for i in range(3)];scale=[target[i]/size[i] if target else 1 for i in range(3)]
        transform=C@Matrix.Diagonal((*scale,1))@Matrix.Translation((-(lo[0]+hi[0])/2,-lo[1],-(lo[2]+hi[2])/2))@C.inverted()
        for o in self.objects:o.matrix_world=transform@o.matrix_world
        lo,hi=self.bounds();size=[hi[i]-lo[i] for i in range(3)]
        native=ROOT/'design/collectibles';native.mkdir(parents=True,exist_ok=True);out=ROOT/'public/models/collectibles';out.mkdir(parents=True,exist_ok=True)
        scene=bpy.context.scene;scene.world=bpy.data.worlds.new('Neutral inspection');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.4
        scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True;scene.view_settings.view_transform='AgX'
        m=max(size)
        for name,p,power,diameter in [('Softbox',(-2,4,3),90,2.0),('Fill',(3,2,-2),45,2.5)]:
            data=bpy.data.lights.new(name,'AREA');data.energy=power*m*m;data.shape='DISK';data.size=diameter*m;o=bpy.data.objects.new(name,data);scene.collection.objects.link(o);o.location=xyz([v*m for v in p]);o.rotation_euler=(Vector(xyz((0,size[1]/2,0)))-o.location).to_track_quat('-Z','Y').to_euler()
        camera=bpy.data.cameras.new('Inspection');cam=bpy.data.objects.new('Inspection',camera);scene.collection.objects.link(cam);cam.location=xyz((m*1.35,m*1.35,m*1.7));cam.rotation_euler=(Vector(xyz((0,size[1]*.4,0)))-cam.location).to_track_quat('-Z','Y').to_euler();camera.type='ORTHO';camera.ortho_scale=m*1.55;scene.camera=cam
        scene.render.resolution_x=1200;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
        bpy.ops.wm.save_as_mainfile(filepath=str(native/(self.name+'.blend')))
        groups={}
        for o in self.objects:groups.setdefault(o.data.materials[0].name,[]).append(o)
        for name,items in groups.items():
            bpy.ops.object.select_all(action='DESELECT')
            for o in items:o.select_set(True)
            bpy.context.view_layer.objects.active=items[0]
            if len(items)>1:bpy.ops.object.join()
            obj=bpy.context.object;obj.name=self.name+' | '+name;bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
        bpy.ops.object.select_all(action='DESELECT')
        for o in scene.objects:
            if o.type=='MESH':o.select_set(True)
        bpy.ops.export_scene.gltf(filepath=str(out/(self.name+'.glb')),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_cameras=False,export_lights=False)
        report={'dimensions':size,'min':lo,'max':hi,'sourceParts':len(self.objects),'groups':len(groups)}
        (out/(self.name+'-layout.json')).write_text(json.dumps(report,indent=2),encoding='utf-8')
        scene.render.filepath=str(ROOT/('work/qa/'+self.name+'.png'));bpy.ops.render.render(write_still=True)
        print('COLLECTIBLE_READY',self.name,json.dumps(report),flush=True)
