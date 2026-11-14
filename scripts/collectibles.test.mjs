import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createModelIO} from './model-io.mjs';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MeshBVH} from 'three-mesh-bvh';
import {COLLECTIBLE_IDS,NEW_COLLECTIBLE_IDS,COLLECTIBLE_NAMES,COLLECTIBLE_PLACEMENTS,isCollectibleId} from '../lib/collectibles.ts';
import {roomBackground} from '../lib/room-theme.ts';

test('day stays white and night becomes an almost-black imagined space',async()=>{
  assert.equal(roomBackground(false),'#ffffff');assert.equal(roomBackground(true),'#030405');
  const layout=JSON.parse(await readFile('public/models/sunlit-room/layout.json','utf8'));
  assert.equal(layout.backgrounds.day,roomBackground(false));assert.equal(layout.backgrounds.night,roomBackground(true));
});
test('one collapsed collection contains all eight named, valid items',()=>{
  assert.equal(COLLECTIBLE_IDS.length,8);assert.equal(new Set(COLLECTIBLE_IDS).size,8);
  for(const id of COLLECTIBLE_IDS){assert.equal(isCollectibleId(id),true);assert.ok(COLLECTIBLE_NAMES[id].every(n=>n.length>2));}
  assert.equal(isCollectibleId(''),false);assert.equal(isCollectibleId('cat'),false);
});
const io=createModelIO(),versions=JSON.parse(await readFile('public/collectibles-version.json','utf8'));
for(const id of NEW_COLLECTIBLE_IDS)test(id+' has finite, correctly sized and versioned original geometry',async()=>{
  const file='public/models/collectibles/'+id+'.glb',bytes=await readFile(file),version=versions[id];
  assert.equal(createHash('sha256').update(bytes).digest('hex'),version.sha256);assert.equal(bytes.length,version.bytes);assert.ok(bytes.length<8*1024*1024);
  const doc=await io.read(file),bounds=new THREE.Box3();let vertices=0;
  doc.getRoot().listScenes()[0].traverse(node=>{
    const m=new THREE.Matrix4().fromArray(node.getWorldMatrix());
    for(const p of node.getMesh()?.listPrimitives()||[]){
      const positions=p.getAttribute('POSITION'),v=[];
      for(let i=0;i<positions.getCount();i++){positions.getElement(i,v);assert.ok(v.every(Number.isFinite));bounds.expandByPoint(new THREE.Vector3(...v).applyMatrix4(m));vertices++;}
      for(const attribute of p.listAttributes()){
        for(let i=0;i<attribute.getCount();i++){attribute.getElement(i,v);assert.ok(v.every(Number.isFinite),'finite exported shading and texture coordinates');}
      }
      assert.notEqual(p.getMaterial()?.getExtension('KHR_materials_unlit')?.extensionName,'KHR_materials_unlit');
    }
  });
  assert.ok(vertices>100);const size=bounds.getSize(new THREE.Vector3()).toArray();
  size.forEach((v,i)=>assert.ok(Math.abs(v-version.dimensions[i])<.001,id+' dimension '+i));
  assert.ok(Math.abs(bounds.min.y)<.0001,'grounded origin');assert.ok(Math.abs(bounds.getCenter(new THREE.Vector3()).x)<.001);assert.ok(Math.abs(bounds.getCenter(new THREE.Vector3()).z)<.001);
  assert.ok(version.sourceParts>={ 'monica-apartment':250,'millennium-falcon':1500,'wish-willow':15,'zaizen-lighter':250,anduril:70,'elder-wand':30}[id]);
  assert.equal(COLLECTIBLE_PLACEMENTS[id].scale,1/.45);
});

test('Zaizen lighter has clear solid brilliant facets, a lit platinum case and a batched export',async()=>{
  const layout=JSON.parse(await readFile('public/models/collectibles/zaizen-lighter-layout.json','utf8'));
  assert.deepEqual(layout.referenceLayout.frontGrid,[5,5]);assert.deepEqual(layout.referenceLayout.reverseGrid,[5,5]);assert.deepEqual(layout.referenceLayout.edgeGrid,[2,5]);
  assert.equal(layout.referenceLayout.diamondCount,60);assert.equal(COLLECTIBLE_PLACEMENTS['zaizen-lighter'].zone,'office');
  const document=await io.read('public/models/collectibles/zaizen-lighter.glb'),materials=document.getRoot().listMaterials();
  const platinum=materials.find(m=>m.getName().includes('Mirror platinum case')),diamond=materials.find(m=>m.getName().includes('Clear brilliant-cut diamonds'));
  assert.equal(platinum.getMetallicFactor(),1);assert.ok(platinum.getRoughnessFactor()<.2);
  assert.ok(diamond.getExtension('KHR_materials_ior').getIOR()>2.4);assert.ok(diamond.getExtension('KHR_materials_transmission').getTransmissionFactor()>.7);
  let volume=0,primitives=0;
  for(const mesh of document.getRoot().listMeshes())for(const primitive of mesh.listPrimitives()){
    primitives++;if(primitive.getMaterial()!==diamond)continue;
    const position=primitive.getAttribute('POSITION'),indices=primitive.getIndices().getArray(),a=[],b=[],c=[];
    for(let i=0;i<indices.length;i+=3){position.getElement(indices[i],a);position.getElement(indices[i+1],b);position.getElement(indices[i+2],c);volume+=new THREE.Vector3(...a).dot(new THREE.Vector3(...b).cross(new THREE.Vector3(...c)))/6;}
  }
  assert.ok(volume>1e-9&&volume<1e-6,'closed gems face outward and retain their physical volume');assert.ok(primitives<=10,'fine parts are batched for rendering');
});

async function shape(id,accept=()=>true){
  const doc=await io.read('public/models/collectibles/'+id+'.glb'),parts=[];
  doc.getRoot().listScenes()[0].traverse(node=>{
    const matrix=new THREE.Matrix4().fromArray(node.getWorldMatrix());
    for(const p of node.getMesh()?.listPrimitives()||[]){
      if(!accept(node,p))continue;
      const accessor=p.getAttribute('POSITION'),a=new Float32Array(accessor.getCount()*3),v=[];
      for(let i=0;i<accessor.getCount();i++){accessor.getElement(i,v);a.set(v,i*3);}
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(a,3));
      if(p.getIndices())geometry.setIndex(new THREE.BufferAttribute(p.getIndices().getArray(),1));
      geometry.applyMatrix4(matrix);parts.push(geometry);
    }
  });
  const geometry=mergeGeometries(parts);geometry.computeBoundingBox();
  const tree=new MeshBVH(geometry),size=geometry.boundingBox.getSize(new THREE.Vector3());
  return {size,bounds:geometry.boundingBox,tree,hit:(x,z)=>tree.raycastFirst(new THREE.Ray(new THREE.Vector3(x,1,z),new THREE.Vector3(0,-1,0)),THREE.DoubleSide)};
}

test('Anduril retains an open pommel, full-length blade, and independently hideable plaque',async()=>{
  const doc=await io.read('public/models/collectibles/anduril.glb');let supportCount=0,parts=0;
  doc.getRoot().listScenes()[0].traverse(node=>{if(node.getMesh()){parts++;if(node.getExtras().display_support)supportCount++;}});
  assert.ok(supportCount>=4&&supportCount<parts,'display geometry has its own exported visibility flag');
  const {size,tree}=await shape('anduril',(node)=>!node.getExtras().display_support);
  assert.ok(size.y>1.34&&size.x>.30&&size.x<.33,'long tapered sword, with full-width sculpted guard');
  const front=(x,y)=>tree.raycastFirst(new THREE.Ray(new THREE.Vector3(x,y,.20),new THREE.Vector3(0,0,-1)),THREE.DoubleSide);
  assert.equal(front(0,1.320),null,'leaf pommel has a real open centre');
  assert.ok(front(.020,1.315),'the leaf pommel has a solid outer rim');
  assert.ok(front(0,.50),'the central fuller remains solid under the inlay');
  assert.equal(front(.030,.05),null,'the lower blade tapers to a point');
});

test('Elder Wand exports six progressively smaller knots and a continuous pitted wood skin',async()=>{
  const doc=await io.read('public/models/collectibles/elder-wand.glb'),wood=doc.getRoot().listMeshes().flatMap(m=>m.listPrimitives()).find(p=>p.getMaterial().getName().includes('Aged elder wood'));
  assert.ok(wood.getAttribute('COLOR_0'),'fine grain colour travels with the lit wood material');
  const values=wood.getAttribute('POSITION'),sections=new Map(),v=[];
  for(let i=0;i<values.getCount();i++){
    values.getElement(i,v);const key=Math.round(v[0]*1e6),s=sections.get(key)||{x:v[0],min:Infinity,max:-Infinity};
    s.min=Math.min(s.min,v[1]);s.max=Math.max(s.max,v[1]);sections.set(key,s);
  }
  const profile=[...sections.values()].sort((a,b)=>a.x-b.x),nodes=[.080,.235,.432,.605,.753,.879];
  for(const t of nodes){
    const x=(t-.5)*.381,near=(at)=>profile.reduce((a,b)=>Math.abs(a.x-at)<Math.abs(b.x-at)?a:b),middle=near(x),left=near(x-.021),right=near(x+.021);
    assert.ok(middle.max-middle.min>Math.max(left.max-left.min,right.max-right.min)*1.4,'each knot rises above both adjacent shaft intervals');
  }
  const layout=JSON.parse(await readFile('public/models/collectibles/elder-wand-layout.json','utf8'));
  assert.equal(layout.referenceLayout.recessedPores,168);assert.equal(layout.referenceLayout.wandLength,.381);
});

test('corrected willow has a real empty lumen, oval side windows, and thick black wood',async()=>{
  const {tree,bounds,size}=await shape('wish-willow',(_,p)=>p.getMaterial().getName().includes('Charred black willow lattice'));
  const center=bounds.getCenter(new THREE.Vector3()),direction=new THREE.Vector3(0,-Math.SQRT1_2,-Math.SQRT1_2);
  assert.equal(tree.raycastFirst(new THREE.Ray(new THREE.Vector3(bounds.min.x-.01,center.y,center.z),new THREE.Vector3(1,0,0)),THREE.DoubleSide),null,'lumen is open from one forked end to the other');
  let windows=0,bridges=0,previous=null;
  for(let i=0;i<300;i++){
    const x=bounds.min.x+.019+(size.x-.038)*i/299,origin=new THREE.Vector3(x,center.y,center.z).addScaledVector(direction,-.05);
    const hit=tree.raycastFirst(new THREE.Ray(origin,direction),THREE.DoubleSide),open=!hit||hit.distance>.05;
    if(open!==previous){if(open)windows++;else bridges++;previous=open;}
  }
  assert.ok(windows>=5&&bridges>=4,'five long openings are divided by actual wood bridges');
  assert.ok(size.y>.018&&size.y<.04,'thick hollow branch, not a thin painted twig');
});
test('Falcon has tapered narrow tips and a shallow forward slot',async()=>{
  const {size,hit}=await shape('millennium-falcon');
  assert.ok(hit(0,size.z*.25),'the solid central forebody reaches ahead of the saucer');
  assert.equal(hit(0,size.z*.44),null,'the short nose mouth remains open');
  let left=0,right=0;const step=size.x/400;
  for(let i=0;i<400;i++)if(hit(-size.x/2+(i+.5)*step,size.z*.46)){if(i<200)left++;else right++;}
  assert.ok(left>7&&right>7,'both truncated tips are present');
  assert.ok((left+right)/400<.22,'tips are narrow wedges rather than two broad rectangular prongs');
});
test('Monica cutaway has a deep rear bay, stepped frontage and raised window floor',async()=>{
  const {size,hit}=await shape('monica-apartment');
  assert.ok(size.z>size.x*1.25,'the selected cutaway is deeper than it is wide');
  assert.equal(hit(-size.x*.40,-size.z*.40),null,'the rear-left kitchen notch is outside the footprint');
  assert.ok(hit(size.x*.22,-size.z*.40),'the window bay extends behind the kitchen');
  assert.equal(hit(-size.x*.40,size.z*.485),null,'the entry frontage is set back');
  assert.ok(hit(size.x*.20,size.z*.485),'the living-room frontage projects forward');
  const rear=hit(size.x*.13,-size.z*.30),front=hit(-size.x*.30,size.z*.40);
  assert.ok(rear&&front&&rear.point.y<size.y*.30&&rear.point.y-front.point.y>.005,'the rear bay has a real raised floor');
});
