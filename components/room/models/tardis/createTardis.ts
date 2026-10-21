import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import data from './geometry.json';
import {woodMaterial,frostedMaterial,topSignMaterial,telephoneMaterial,bronzeMaterial} from './TardisMaterials';
import {enableAgedPaint,setWearBounds} from './TardisSurface';
import {optimizeRepeatedParts} from './TardisOptimization';

type V=[number,number,number];
type Component={id:string;parent:string|null;role:string;primitive:string;material:string;position:V;rotation:V;scale:V;dimensions:V;bevel:number;implementationGeometry?:{vertices:number[][];faces:number[][]}};
type Materials=Record<'wood'|'dark'|'glass'|'beacon'|'sign'|'telephone'|'bronze',THREE.MeshPhysicalMaterial>;

/** Same construction as the approved 2005–2010 collectible; no review metadata or placeholder emitters. */
export function createTardis({onTextureReady,materials,optimized=true}:{onTextureReady?:()=>void;materials?:Materials;optimized?:boolean}={}){
 const root=new THREE.Group();root.name='tardis-2005-collectible';
 const wearFrameInverse=new THREE.Matrix4();
 const mats=materials??{wood:woodMaterial(false,onTextureReady),dark:woodMaterial(true,onTextureReady),glass:frostedMaterial(),beacon:frostedMaterial(true),sign:topSignMaterial(),telephone:telephoneMaterial(),bronze:bronzeMaterial()};
 if(!materials){enableAgedPaint(mats.wood,wearFrameInverse);enableAgedPaint(mats.dark,wearFrameInverse);}
 const nodes:Record<string,THREE.Object3D>={root},meshes:Record<string,THREE.Mesh>={};
 for(const c of data.components as Component[]){
  const node=new THREE.Group();node.name=c.id+'__pivot';node.position.fromArray(c.position);node.rotation.set(...c.rotation);
  (c.parent?nodes[c.parent]:root).add(node);nodes[c.id]=node;
  if(c.role==='static-container')continue;
  const [w,h,d]=c.dimensions;
  let geometry:THREE.BufferGeometry;
  if(c.id==='roof-pyramid'){
   const g=new THREE.BufferGeometry(),shape=c.implementationGeometry!;g.setAttribute('position',new THREE.Float32BufferAttribute(shape.vertices.flat(),3));g.setIndex(shape.faces.flat());g.computeVertexNormals();geometry=g.toNonIndexed();geometry.computeVertexNormals();g.dispose();
  }else if(c.id==='beacon-cap')geometry=new THREE.LatheGeometry(data.beaconProfile.map(([r,y])=>new THREE.Vector2(r,y-.0185)),48);
  else if(c.id==='handle-mount')geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(data.handlePoints.map(p=>new THREE.Vector3(...p as V))),24,data.handleRadius,8,false);
  else if(c.primitive==='box')geometry=new RoundedBoxGeometry(w,h,d,2,Math.min(c.bevel||.002,Math.min(w,h,d)/3));
  else if(c.primitive==='cylinder')geometry=new THREE.CylinderGeometry(w/2,w/2,h,48,1);
  else if(c.primitive==='cone')geometry=new THREE.ConeGeometry(w/2,h,48);
  else if(c.primitive==='sphere'){geometry=new THREE.SphereGeometry(.5,32,20);geometry.scale(...c.scale);}
  else throw new Error('Unsupported approved TARDIS component: '+c.id);
  const material=c.material==='glass'?(c.id==='beacon-glass'?mats.beacon:mats.glass):c.material==='bronze'?mats.bronze:c.id==='notice-plate'?mats.telephone:c.material==='wood-dark'?mats.dark:mats.wood;
  const mesh=new THREE.Mesh(geometry,material);mesh.name=c.id;mesh.userData.componentId=c.id;mesh.castShadow=true;mesh.receiveShadow=true;node.add(mesh);meshes[c.id]=mesh;
  const uv=geometry.attributes.uv;
  if(uv&&c.primitive==='box'&&c.id!=='notice-plate'){
   const horizontal=['rail-','window-rail-','cross-mullion-','signbox-'].some(prefix=>c.id.startsWith(prefix));
   for(let i=0;i<uv.count;i++){const u=uv.getX(i),v=uv.getY(i);uv.setXY(i,horizontal?v*h*.9:u*w*.9,horizontal?u*w*.9:v*h*.9);}uv.needsUpdate=true;geometry.setAttribute('uv1',uv.clone());
  }
  if(['wood','wood-dark'].includes(c.material)&&c.id!=='notice-plate')setWearBounds(mesh);
  if(c.id.startsWith('signbox-')){
   const lettering=new THREE.Mesh(new RoundedBoxGeometry(1.435,.126,.006,1,.002),mats.sign);lettering.name=c.id+'-lettering';lettering.position.z=.055;lettering.userData.componentId=c.id;node.add(lettering);
  }
 }
 root.userData.sculptRuntime={nodes,meshes};root.userData.wearFrameInverse=wearFrameInverse;
 root.userData.provenance={subject:'TARDIS, Ninth/Tenth Doctor exterior',version:'2005–2010',source:'Approved standalone collectible 2026-10-21'};
 if(optimized)optimizeRepeatedParts(root);
 return root;
}

export function disposeTardis(root:THREE.Group){
 const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
 root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const value of Object.values(m))if(value instanceof THREE.Texture)textures.add(value);}});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());
}
