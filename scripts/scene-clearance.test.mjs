import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createModelIO} from './model-io.mjs';
import * as THREE from 'three';
import {MeshBVH} from 'three-mesh-bvh';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {bookPose,tapePose} from '../lib/record-motion-paths.ts';
import {CINEMA_LAYOUT} from '../lib/cinema-layout.ts';
import {ROOM_VIEWS,ROOM_FOCUS,roomCameraPose} from '../lib/room-navigation.ts';
import {COLLECTIBLE_PLACEMENTS,NEW_COLLECTIBLE_IDS} from '../lib/collectibles.ts';
import {LIGHT_ANCHORS,lightProfile} from '../lib/room-lighting.ts';
import {bookSize} from '../lib/book-library.ts';
import {memoryDrawerPose,DRAWER_DURATION_MS} from '../lib/memory-drawer.ts';

const io=createModelIO();
const doc=await io.read('public/models/sunlit-room/room.glb');
const geometry=[],geometryNames=[],geometryGroups=[];
let triangles=0;
function appendGeometry(document,placement=null,id=null){
document.getRoot().listScenes()[0].traverse(node=>{
  const mesh=node.getMesh();if(!mesh)return;
  for(const primitive of mesh.listPrimitives()){
    const positions=primitive.getAttribute('POSITION'),values=new Float32Array(positions.getCount()*3),element=[];
    for(let i=0;i<positions.getCount();i++){positions.getElement(i,element);values.set(element,i*3);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(values,3));
    const index=primitive.getIndices();if(index)g.setIndex(new THREE.BufferAttribute(new Uint32Array(index.getArray()),1));
    g.applyMatrix4(new THREE.Matrix4().fromArray(node.getWorldMatrix()));
    if(placement)g.applyMatrix4(placement);
    triangles+=(g.index?.count||g.attributes.position.count)/3;
    geometry.push(g.toNonIndexed());
    geometryNames.push(node.getName());
    geometryGroups.push(id||node.getExtras().asset_group||node.getName().split(' | ')[0]);
  }
});
}
appendGeometry(doc);
for(const id of NEW_COLLECTIBLE_IDS){
  const p=COLLECTIBLE_PLACEMENTS[id],m=new THREE.Matrix4().compose(new THREE.Vector3(...p.position),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),p.yaw),new THREE.Vector3().setScalar(p.scale));
  appendGeometry(await io.read('public/models/collectibles/'+id+'.glb'),m,id);
}
const whole=mergeGeometries(geometry),tree=new MeshBVH(whole),identity=new THREE.Matrix4();
const ledger=JSON.parse(await readFile('public/models/sunlit-room/layout.json','utf8'));
const unit=new THREE.Vector3(1,1,1);
const cameraViews={...ROOM_VIEWS,screen:ROOM_FOCUS};
const pose=(p,quaternion=new THREE.Quaternion(),scale=unit)=>({position:new THREE.Vector3(...p),quaternion,scale});
const quat=(yaw=0,roll=0)=>new THREE.Quaternion().setFromEuler(new THREE.Euler(0,yaw,roll));
const matrix=(p)=>new THREE.Matrix4().compose(p.position,p.quaternion,p.scale||unit);
const report={modelTriangles:triangles,sourceParts:ledger.sourceObjectCount,renderGroups:geometry.length,trajectories:0,poses:0};
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

test('finite shell and safe camera views preserve the day/night imagined world',()=>{
  whole.computeBoundingBox();const b=whole.boundingBox;
  assert.ok(b.min.x>=-6.7&&b.max.x<=6.7&&b.min.z>=-4.5&&b.max.z<=5.5,JSON.stringify(b));
  for(const [name,view] of Object.entries(cameraViews)){
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
  for(const [from,a] of Object.entries(cameraViews))for(const [to,b] of Object.entries(cameraViews)){
    if(from===to)continue;
    checkPath('camera '+from+' to '+to,pose(a.camera),cube,(_,t)=>pose(new THREE.Vector3(...a.camera).lerp(new THREE.Vector3(...b.camera),t).toArray()),900);
  }
});

test('the complete Starry Night canvas is unobstructed from overview and desk views',()=>{
  const {position,size,normal}=ledger.artwork;
  assert.deepEqual(normal,[1,0,0]);assert.ok(Math.abs(size[0]/size[1]-1920/1520)<.001);
  const withoutArt=new MeshBVH(mergeGeometries(geometry.filter((_,i)=>geometryGroups[i]!=='starry night')));
  for(const view of [ROOM_VIEWS.overview,ROOM_VIEWS.office])for(let y=0;y<=8;y++)for(let x=0;x<=10;x++){
    const point=new THREE.Vector3(position[0]+.002,position[1]+(y/8-.5)*size[1]*.99,position[2]+(x/10-.5)*size[0]*.99);
    const start=new THREE.Vector3(...view.camera),distance=start.distanceTo(point),ray=new THREE.Ray(start,point.sub(start).normalize());
    assert.equal(withoutArt.raycastFirst(ray,THREE.DoubleSide,0,distance-.012),null,'another object hides the canvas at grid '+x+','+y);
  }
});

test('projection rays from the real lens to the entire screen miss the furniture',()=>{
  assert.deepEqual(ledger.lights.projector,LIGHT_ANCHORS.projector);
  const start=new THREE.Vector3(...LIGHT_ANCHORS.projector.position);
  for(let y=0;y<=12;y++)for(let x=0;x<=20;x++){
    const end=new THREE.Vector3(1.19+x/20*4.02,1.915+y/12*2.27,-3.855),distance=start.distanceTo(end);
    const hit=tree.raycastFirst(new THREE.Ray(start.clone(),end.sub(start).normalize()),THREE.DoubleSide,.004,distance-.02);
    assert.equal(hit,null,'projection is obstructed at screen grid '+x+','+y+(hit?' distance '+hit.distance:''));
  }
});

test('opening and closing curtains sweep no objects throughout the day/night transition',()=>{
  const fixed=new MeshBVH(mergeGeometries(geometry.filter((_,i)=>!geometryGroups[i].startsWith('curtain '))));
  for(const side of ['curtain left','curtain right']){
    const curtain=mergeGeometries(geometry.filter((_,i)=>geometryGroups[i]===side));assert.ok(curtain.attributes.position.count>1000);
    curtain.computeBoundingBox();const pivot=side==='curtain left'?-2.125:3.325;
    for(let i=0;i<=120;i++){
      const s=1+3.7*i/120,m=new THREE.Matrix4().makeTranslation(0,0,pivot).multiply(new THREE.Matrix4().makeScale(1,1,s)).multiply(new THREE.Matrix4().makeTranslation(0,0,-pivot));
      // Each intermediate curtain and the entire swept envelope are checked.
      assert.equal(fixed.intersectsBox(curtain.boundingBox,m),false,side+' overlaps another item at scale '+s);
    }
    curtain.dispose();
  }
});

test('desk essentials and under-desk furniture have separate, measured envelopes',()=>{
  const parts=ledger.components;assert.ok(parts?.length>1400);
  const partsBox=(match)=>{
    const selected=parts.filter(match);assert.ok(selected.length,'missing source components');
    const pieces=selected.map(p=>new THREE.Box3(new THREE.Vector3(...p.min),new THREE.Vector3(...p.max)));
    const bounds=pieces.reduce((b,p)=>b.union(p),new THREE.Box3());bounds.pieces=pieces;return bounds;
  };
  const items={
    monitor:partsBox(p=>p.name.startsWith('Monitor ')&&p.name!=='Monitor cable'),
    keyboard:partsBox(p=>/^(Keyboard |Double shot keycap)/.test(p.name)),
    mouse:partsBox(p=>p.name.startsWith('Mouse ')),
    notebook:partsBox(p=>p.name.startsWith('Notebook ')),
    mug:partsBox(p=>p.group==='desk details'&&/^(Glazed open mug|Mug handle|Coffee surface)/.test(p.name)),
    lamp:partsBox(p=>p.group==='desk lamp'),
    speakerLeft:partsBox(p=>p.name.startsWith('White speaker enclosure')&&p.min[2]>0),
    speakerRight:partsBox(p=>p.name.startsWith('White speaker enclosure')&&p.max[2]<-1),
    jasmine:partsBox(p=>p.group==='flowers jasmine'&&p.min[0]>-4.0)
  };
  for(const [a,boxA] of Object.entries(items))for(const [b,boxB] of Object.entries(items)){
    if(a>=b)continue;
    for(const partA of boxA.pieces)for(const partB of boxB.pieces)assert.equal(partA.clone().expandByScalar(-.002).intersectsBox(partB.clone().expandByScalar(-.002)),false,a+' overlaps '+b);
  }
  const center=items.monitor.getCenter(new THREE.Vector3());assert.ok(Math.abs(center.z+.60)<.03,'monitor is not centred on the desk');
  const cableGeometry=geometry.filter((_,i)=>geometryGroups[i]==='desk details'&&geometryNames[i].includes('rubber'));
  assert.ok(cableGeometry.length,'monitor cable geometry was not found');
  const cableTree=new MeshBVH(mergeGeometries(cableGeometry));
  for(const [name,bounds] of Object.entries(items))if(name!=='monitor')for(const part of bounds.pieces)assert.equal(cableTree.intersectsBox(part,identity),false,'monitor cable passes through '+name);
  const tower=partsBox(p=>p.group==='computer tower'),drawer=partsBox(p=>p.name.startsWith('Pedestal ')),chair=partsBox(p=>p.group==='chair');
  assert.equal(tower.intersectsBox(drawer),false);assert.equal(tower.intersectsBox(chair),false);assert.equal(drawer.intersectsBox(chair),false);
  const keys=parts.filter(p=>/^(Double shot keycap|Keyboard spacebar)/.test(p.name));
  for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++)assert.equal(new THREE.Box3(new THREE.Vector3(...keys[i].min),new THREE.Vector3(...keys[i].max)).intersectsBox(new THREE.Box3(new THREE.Vector3(...keys[j].min),new THREE.Vector3(...keys[j].max))),false,'keycaps overlap');
});

test('night lighting, screening dimming and manual lamp switches restore predictably',()=>{
  for(const night of [false,true])for(const screening of [false,true])for(const desk of [false,true])for(const floor of [false,true]){
    const p=lightProfile(night,screening,{desk,floor});assert.ok(Object.values(p).every(n=>Number.isFinite(n)&&n>=0));
    assert.equal(p.sun===0,night);assert.equal(p.beam>0,screening);assert.equal(p.projector>0,screening);
    if(!night||!desk)assert.equal(p.desk,0);if(!night||!floor)assert.equal(p.floor,0);
  }
  const night=lightProfile(true,false),film=lightProfile(true,true);
  assert.ok(film.desk<night.desk&&film.floor<night.floor&&film.picture<night.picture&&film.shelf<night.shelf);
  for(const key of ['desk','floor','picture','shelves','guest','console','media'])assert.deepEqual(ledger.lights[key],LIGHT_ANCHORS[key]);
});

test('lumbar cushion, throw and floor pillow stay outside the sculpted seat',()=>{
  const seat=new MeshBVH(mergeGeometries(geometry.filter((_,i)=>geometryGroups[i]==='lounge')));
  const soft=mergeGeometries(geometry.filter((_,i)=>geometryGroups[i]==='soft furnishings'));
  assert.equal(seat.intersectsGeometry(soft,identity),false,'soft furnishings cut through the seat or rug');
});

test('new console, guitar, tea table and greenery do not cut through the other furniture',()=>{
  const additions=['record console','guitar','coffee table','console greenery'];
  const fixed=['desk','computer tower','chair','flower stand','guest corner','lounge','soft furnishings','floor lamp','projector','side table','collector display',...NEW_COLLECTIBLE_IDS];
  for(const a of additions){
    const parts=geometry.filter((_,i)=>geometryGroups[i]===a);assert.ok(parts.length,a+' is missing');
    const item=new MeshBVH(mergeGeometries(parts));
    for(const b of [...fixed,...additions.filter(x=>x>a)]){
      const other=geometry.filter((_,i)=>geometryGroups[i]===b);if(!other.length)continue;
      assert.equal(item.intersectsGeometry(mergeGeometries(other),identity),false,a+' intersects '+b);
    }
  }
  const pc=ledger.components.filter(p=>p.group==='computer tower');
  for(const prefix of ['Motherboard PCB','CPU cooler fin','Curved cooling impeller','Real perforated hexagonal front grille','Tower side glass window','USB-C port'])assert.ok(pc.some(p=>p.name.startsWith(prefix)),'PC detail missing: '+prefix);
});

test('all three collectibles fit their supports and avoid every other room object',()=>{
  for(const id of NEW_COLLECTIBLE_IDS){
    const item=mergeGeometries(geometry.filter((_,i)=>geometryGroups[i]===id));assert.ok(item.attributes.position.count>30);
    const other=new MeshBVH(mergeGeometries(geometry.filter((_,i)=>geometryGroups[i]!==id)));
    assert.equal(other.intersectsGeometry(item,identity),false,id+' intersects the room or another collectible');
  }
});

test('all mouse-follow camera positions and their transition envelopes clear furniture',()=>{
  const cube=new THREE.Box3(new THREE.Vector3(-.06,-.06,-.06),new THREE.Vector3(.06,.06,.06));
  for(const zone of Object.keys(ROOM_VIEWS))for(let x=-1;x<=1.001;x+=.2)for(let y=-1;y<=1.001;y+=.2){
    const p=roomCameraPose(zone,x,y);assert.equal(tree.intersectsBox(cube,new THREE.Matrix4().makeTranslation(...p.camera)),false,zone+' mouse-follow camera hits furniture');
  }
  // During a transition the code uses the destination's follow amplitude.
  // Inflate that complete path by its maximum actual offset; screen focus is fixed.
  for(const [a,from] of Object.entries(cameraViews))for(const [b,to] of Object.entries(cameraViews)){
    if(a===b)continue;
    const margin=b==='screen'?0:Math.max(...[-1,1].flatMap(x=>[-1,1].map(y=>new THREE.Vector3(...roomCameraPose(b,x,y).camera).distanceTo(new THREE.Vector3(...to.camera)))));
    const swept=cube.clone().expandByScalar(margin+.004);
    for(let i=0;i<=300;i++){
      const point=new THREE.Vector3(...from.camera).lerp(new THREE.Vector3(...to.camera),i/300);
      assert.equal(tree.intersectsBox(swept,new THREE.Matrix4().makeTranslation(...point.toArray())),false,'camera follow envelope '+a+' to '+b);
    }
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
