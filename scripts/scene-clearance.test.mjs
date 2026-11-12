import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import * as THREE from 'three';
import {MeshBVH} from 'three-mesh-bvh';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {bookPose,tapePose} from '../lib/record-motion-paths.ts';
import {CINEMA_LAYOUT} from '../lib/cinema-layout.ts';
import {ROOM_VIEWS} from '../lib/room-navigation.ts';
import {bookSize} from '../lib/book-library.ts';
import {memoryDrawerPose,DRAWER_DURATION_MS} from '../lib/memory-drawer.ts';

const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc=await io.read('public/models/sunlit-room/room.glb');
const geometry=[],geometryNames=[];
let triangles=0;
doc.getRoot().listScenes()[0].traverse(node=>{
  const mesh=node.getMesh();if(!mesh)return;
  for(const primitive of mesh.listPrimitives()){
    const positions=primitive.getAttribute('POSITION'),values=new Float32Array(positions.getCount()*3),element=[];
    for(let i=0;i<positions.getCount();i++){positions.getElement(i,element);values.set(element,i*3);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(values,3));
    const index=primitive.getIndices();if(index)g.setIndex(new THREE.BufferAttribute(new Uint32Array(index.getArray()),1));
    g.applyMatrix4(new THREE.Matrix4().fromArray(node.getWorldMatrix()));
    triangles+=(g.index?.count||g.attributes.position.count)/3;
    geometry.push(g.toNonIndexed());
    geometryNames.push(node.getName());
  }
});
const whole=mergeGeometries(geometry),tree=new MeshBVH(whole),identity=new THREE.Matrix4();
const ledger=JSON.parse(await readFile('public/models/sunlit-room/layout.json','utf8'));
const unit=new THREE.Vector3(1,1,1);
const pose=(p,quaternion=new THREE.Quaternion(),scale=unit)=>({position:new THREE.Vector3(...p),quaternion,scale});
const quat=(yaw=0,roll=0)=>new THREE.Quaternion().setFromEuler(new THREE.Euler(0,yaw,roll));
const matrix=(p)=>new THREE.Matrix4().compose(p.position,p.quaternion,p.scale||unit);
const report={modelTriangles:triangles,sourceParts:ledger.sourceObjectCount,renderGroups:doc.getRoot().listMeshes().length,trajectories:0,poses:0};
const interactive=[];
for(let i=0;i<56;i++)interactive.push({...pose([3.2-1.98+(i%28)*.146,.39+Math.floor(i/28)*.62,-3.73]),size:new THREE.Vector3(.128,.48,.321),name:'shelf tape '+i});
for(let i=0;i<6;i++){const p=CINEMA_LAYOUT.keepsakes[i];interactive.push({...pose([3.2+p[0],p[1],-3.75+p[2]],quat(CINEMA_LAYOUT.keepsakeYaws[i],Math.PI/2)),size:new THREE.Vector3(.128,.48,.321),name:'keepsake '+i});}
interactive.push({...pose([1.35,1.65,-3.64]),size:new THREE.Vector3(.29,.40,.29),name:'TARDIS reserved envelope'});
// The enclosure stays put while its tray extends into the unobstructed room.
for(const [p,size] of [[[3.72,1.734,-3.735],[.94,.025,.53]],[[3.72,1.466,-3.735],[.94,.025,.53]],[[3.264,1.60,-3.735],[.027,.245,.53]],[[4.176,1.60,-3.735],[.027,.245,.53]]])interactive.push({...pose(p),size:new THREE.Vector3(...size),name:'drawer enclosure'});

function checkPath(label,origin,localBox,path,steps=1800,other=[]){
  const points=[];
  const extras=other.length?new MeshBVH(mergeGeometries(other.map(o=>new THREE.BoxGeometry(...o.size.toArray()).applyMatrix4(matrix(o)).toNonIndexed()))):null;
  const times=[...new Set([...Array.from({length:steps+1},(_,i)=>i/steps),.22,.38,.40,.55,.65,.69,.78,.80])].sort((a,b)=>a-b);
  let previous=null;
  const radius=Math.max(localBox.min.length(),localBox.max.length())*Math.max(...origin.scale.toArray());
  for(const t of times){
    const p=path(origin,t),m=matrix({...p,scale:origin.scale}),hit=tree.intersectsBox(localBox,m);
    assert.equal(hit,false,label+' intersects exported room mesh at t='+t.toFixed(5)+(hit?' in '+geometry.filter((g)=>new MeshBVH(g.clone()).intersectsBox(localBox,m)).map(g=>geometryNames[geometry.indexOf(g)]).join(', '):''));
    if(extras){const contact=extras.intersectsBox(localBox,m);assert.equal(contact,false,label+' intersects other interactive objects at t='+t.toFixed(5)+(contact?' : '+other.filter(o=>new MeshBVH(new THREE.BoxGeometry(...o.size.toArray()).applyMatrix4(matrix(o))).intersectsBox(localBox,m)).map(o=>o.name).join(', '):''));}
    if(previous){
      const mid=path(origin,(previous.t+t)/2),a=previous.p;
      // Conservative swept bound: all stages are straight monotone translations
      // or fixed-pivot slerps. Split at EVERY stage boundary, then inflate the
      // midpoint OBB by the full endpoint displacement + angular corner travel.
      const travel=Math.max(mid.position.distanceTo(a.position),mid.position.distanceTo(p.position));
      const turn=Math.max(mid.quaternion.angleTo(a.quaternion),mid.quaternion.angleTo(p.quaternion));
      const margin=(travel+radius*turn)/Math.min(...origin.scale.toArray());
      const swept=localBox.clone().expandByScalar(margin),middle=matrix({...mid,scale:origin.scale});
      assert.equal(tree.intersectsBox(swept,middle),false,label+' swept volume touches the room near t='+t.toFixed(5));
      if(extras)assert.equal(extras.intersectsBox(swept,middle),false,label+' swept volume touches another object near t='+t.toFixed(5));
    }
    previous={p,t};
    points.push(p.position.toArray());report.poses++;
  }
  // Translation between tested poses is tiny relative to the actual clearance;
  // additionally probe each mid-pose, including the interpolated rotation.
  for(let i=1;i<points.length;i++)assert.ok(new THREE.Vector3(...points[i]).distanceTo(new THREE.Vector3(...points[i-1]))<.035,label+' motion sampling exceeded 35mm');
  report.trajectories++;
}

test('finite shell and camera views preserve a white outside world',()=>{
  whole.computeBoundingBox();const b=whole.boundingBox;
  assert.ok(b.min.x>=-6.7&&b.max.x<=6.7&&b.min.z>=-4.5&&b.max.z<=5.5,JSON.stringify(b));
  for(const [name,view] of Object.entries(ROOM_VIEWS)){
    const center=new THREE.Vector3(...view.camera),cameraBox=new THREE.Box3().setFromCenterAndSize(center,new THREE.Vector3(.12,.12,.12));
    assert.equal(tree.intersectsBox(cameraBox,identity),false,name+' camera is inside the room mesh');
  }
});

test('all 90 shelf-book trajectories clear the real exported geometry',()=>{
  const widths=[.17,.22,.14,.20,.27,.16,.23,.18,.26,.15,.19,.21,.16,.24,.18,.22,.14,.27];
  for(let i=0;i<90;i++){
    const row=Math.floor(i/18),col=i%18,start=col<12?0:12;
    const x=-1.9+(col<12?-2.28:.81)+widths.slice(start,col).reduce((n,w)=>n+w+.035,0)+widths[col]/2,h=.55+(i*13%9)*.016;
    const box=new THREE.Box3(new THREE.Vector3(-widths[col]/2,0,-.230),new THREE.Vector3(widths[col]/2,h,.233));
    checkPath('book '+i,pose([x,.20+row*.82,-3.72]),box,bookPose);
  }
});

test('scattered books lift and turn without hitting the floor or furniture',()=>{
  for(const item of [{p:[1.90,.055,2.15],yaw:.17,w:.10},{p:[2.50,.047,3.15],yaw:-.15,w:.084},{p:[1.70,.056,4.15],yaw:-.13,w:.10}]){
    const origin=pose([-1.9+item.p[0]+.32*Math.cos(item.yaw),item.p[1],-3.75+item.p[2]-.32*Math.sin(item.yaw)],quat(item.yaw,Math.PI/2),new THREE.Vector3(1,1,1.65));
    const box=new THREE.Box3(new THREE.Vector3(-item.w/2,0,-.23),new THREE.Vector3(item.w/2,.64,.233));
    checkPath('floor book '+item.p[0],origin,box,bookPose);
  }
});

test('camera travel between every pair of room views clears the modeled room',()=>{
  const cube=new THREE.Box3(new THREE.Vector3(-.06,-.06,-.06),new THREE.Vector3(.06,.06,.06));
  for(const [from,a] of Object.entries(ROOM_VIEWS))for(const [to,b] of Object.entries(ROOM_VIEWS)){
    if(from===to)continue;
    checkPath('camera '+from+' to '+to,pose(a.camera),cube,(_,t)=>pose(new THREE.Vector3(...a.camera).lerp(new THREE.Vector3(...b.camera),t).toArray()),900);
  }
});

test('all 56 tape trajectories fit the player slot without changing shape',()=>{
  const box=new THREE.Box3(new THREE.Vector3(-.064,-.24,-.155),new THREE.Vector3(.064,.24,.166));
  for(let i=0;i<56;i++){
    const origin=pose([3.2-1.98+(i%28)*.146,.39+Math.floor(i/28)*.62,-3.73]);
    checkPath('tape '+i,origin,box,tapePose,1800,interactive.filter(o=>o.name!=='shelf tape '+i));
    for(const t of [0,.22,.40,.55,.69,.80,1])assert.ok(tapePose(origin,t).scale.equals(unit));
  }
});

test('keepsake tapes clear the surrounding stacks, drawer and TARDIS',()=>{
  const box=new THREE.Box3(new THREE.Vector3(-.064,-.24,-.155),new THREE.Vector3(.064,.24,.166));
  for(let i=0;i<6;i++){
    const local=CINEMA_LAYOUT.keepsakes[i],origin=pose([3.2+local[0],local[1],-3.75+local[2]],quat(CINEMA_LAYOUT.keepsakeYaws[i],Math.PI/2));
    checkPath('keepsake '+i,origin,box,tapePose,1800,interactive.filter(o=>o.name!=='keepsake '+i));
  }
});

test('the complete drawer tray and papers stay clear throughout opening',()=>{
  const fixed=interactive.filter(o=>o.name==='drawer enclosure');
  fixed.push({...pose([3.72,1.60,-3.988]),size:new THREE.Vector3(.89,.245,.025),name:'drawer back'});
  const parts=[
    {p:[0,-.113,0],s:[.84,.015,.46]},
    {p:[-.412,-.013,0],s:[.018,.19,.46]},
    {p:[.412,-.013,0],s:[.018,.19,.46]},
    {p:[0,-.018,-.225],s:[.84,.18,.016]},
    {p:[0,0,.285],s:[.89,.24,.035]},
    {p:[0,.025,.323],s:[.24,.028,.045]},
    ...Array.from({length:7},(_,i)=>({p:[0,-.035,-.17+i*.052],s:[.70,.12,.009],angle:-.10+i*.012}))
  ];
  const fixedTree=new MeshBVH(mergeGeometries(fixed.map(o=>new THREE.BoxGeometry(...o.size.toArray()).applyMatrix4(matrix(o)).toNonIndexed())));
  for(let i=0;i<=1000;i++){
    const extension=memoryDrawerPose(i/1000*DRAWER_DURATION_MS).extension;
    for(const part of parts){
      const local=new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(),new THREE.Vector3(...part.s));
      const q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),part.angle||0);
      const m=matrix(pose([3.72+part.p[0],1.60+part.p[1],-3.735+part.p[2]+extension],q));
      assert.equal(tree.intersectsBox(local,m),false,'drawer clips the room');
      assert.equal(fixedTree.intersectsBox(local,m),false,'drawer clips its enclosure at t='+i/1000);
    }
  }
});

test('the take/hold/return path is continuous and preserves its end pose',()=>{
  const origin=pose([-2.0,.21,0]);
  for(const f of [bookPose,tapePose]){
    for(const t of [.22,.38,.40,.55,.65,.69,.78,.80]){
      const a=f(origin,Math.max(0,t-1e-7)),b=f(origin,Math.min(1,t+1e-7));
      assert.ok(a.position.distanceTo(b.position)<1e-4);assert.ok(a.quaternion.angleTo(b.quaternion)<1e-4);
    }
    assert.ok(f(origin,0).position.equals(origin.position));assert.ok(f(origin,0).quaternion.equals(origin.quaternion));
  }
});

test.after(async()=>{await mkdir('work/qa',{recursive:true});await writeFile('work/qa/clearance.json',JSON.stringify(report,null,2));console.log('Actual GLB verification:',JSON.stringify(report));});
