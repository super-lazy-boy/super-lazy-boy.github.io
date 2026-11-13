import * as THREE from "three";
import type {Zone} from "./room-types";

export type Vec3=[number,number,number];
export const ROOM_HOVER_TIMING={enter:5000,leave:5000,cooldown:450,grace:180} as const;
export const ROOM_VIEWS:Record<Zone,{camera:Vec3;target:Vec3;distance:[number,number]}>= {
  overview:{camera:[13,9.2,14.8],target:[-.35,1.7,.5],distance:[16,25]},
  office:{camera:[1.25,4.65,3.35],target:[-3.48,1.85,-.55],distance:[5.3,8.4]},
  books:{camera:[-1.9,2.6,1.4],target:[-1.9,2.35,-3.65],distance:[4.5,6.5]},
  cinema:{camera:[3.35,3.45,3.75],target:[3.40,2.35,-3.70],distance:[7.2,10.0]},
  guestbook:{camera:[-4.05,2.66,4.62],target:[-5.50,2.32,3.62],distance:[1.8,3.6]}
};
/** Only an explicit screen click enters this second, stable camera view. */
export const ROOM_FOCUS:{camera:Vec3;target:Vec3}={camera:[-1.05,2.76,-.60],target:[-3.73,2.70,-.60]};

/** Bounded camera follow, shared with the actual-mesh clearance tests. */
export function roomCameraPose(zone:Zone,x:number,y:number,enabled=true){
  const view=ROOM_VIEWS[zone],camera=new THREE.Vector3(...view.camera),target=new THREE.Vector3(...view.target);
  const offset=new THREE.Vector3(),targetOffset=new THREE.Vector3();
  roomCameraOffsets(zone,x,y,enabled,offset,targetOffset);camera.add(offset);target.add(targetOffset);
  return {camera:camera.toArray() as Vec3,target:target.toArray() as Vec3};
}

/** Reuse vector storage in the render loop without changing the approved camera envelope. */
export function roomCameraOffsets(zone:Zone,x:number,y:number,enabled:boolean,offset:THREE.Vector3,targetOffset:THREE.Vector3){
  offset.set(0,0,0);targetOffset.set(0,0,0);if(!enabled)return;
  const view=ROOM_VIEWS[zone],strength=zone==='overview'?.55:zone==='guestbook'?.035:zone==='books'?.075:.12;
  offset.set(view.camera[2]-view.target[2],0,view.target[0]-view.camera[0]).normalize().multiplyScalar(THREE.MathUtils.clamp(x,-1,1)*strength);
  targetOffset.copy(offset).multiplyScalar(.12);offset.y=THREE.MathUtils.clamp(y,-1,1)*strength*.4;
}

export const ASSET_ZONES:Record<string,Zone>={desk:'office','desk details':'office','desk flowers':'office',chair:'office','computer tower':'office','desk lamp':'office',bookshelf:'books','shelf greenery':'books','media cabinet':'cinema','media shelf light':'cinema','media lamp glow':'cinema',player:'cinema','projection screen':'cinema',lounge:'cinema','soft furnishings':'cinema','side table':'cinema','game controller':'cinema',projector:'cinema','floor lamp':'cinema','guest corner':'guestbook','starry night':'office','picture light':'office','flower stand':'office','office botanicals':'office','cinema botanicals':'cinema','guest botanicals':'guestbook','flowers daisies':'office','flowers jasmine':'office','desk lamp glow':'office','floor lamp glow':'cinema','picture lamp glow':'office','shelf lamp glow':'books','shelf light':'books','storage basket':'cinema','collector display':'cinema','record console':'cinema','turntable':'cinema',guitar:'cinema','coffee table':'cinema','shelf ceramics':'books','console greenery':'cinema','flower stand details':'office','guest lamp':'guestbook','guest lamp glow':'guestbook','console lamp':'cinema','console lamp glow':'cinema'};
export function objectRoomZone(object:THREE.Object3D):Zone {
  for(let node:THREE.Object3D|null=object;node;node=node.parent){
    if(node.userData.roomZone)return node.userData.roomZone;
    const group=String(node.userData.asset_group||'');if(ASSET_ZONES[group])return ASSET_ZONES[group];
  }
  return 'overview';
}

type Bounds=[Vec3,Vec3];
const box=([min,max]:Bounds)=>new THREE.Box3(new THREE.Vector3(...min),new THREE.Vector3(...max));
const overviewBounds:Record<Exclude<Zone,"overview">,THREE.Box3[]>={
  office:[box([[-4.35,.06,-1.5],[-1.12,3.5,2.65]])],
  books:[box([[-4.22,.04,-4.18],[.42,4.62,-3.05]])],
  cinema:[box([[.88,.04,-4.12],[5.95,4.6,-3.0]]),box([[1.65,.02,-.2],[4.28,1.32,2.32]])],
  guestbook:[box([[-5.80,.04,2.94],[-5.20,3.02,4.37]]),box([[-6.77,.02,3.05],[-3.95,1.10,4.85]])]
};
const focusBounds={
  office:overviewBounds.office,
  books:overviewBounds.books,
  cinema:overviewBounds.cinema.slice(0,1),
  guestbook:overviewBounds.guestbook
};

/** Use world-space furniture bounds so hit areas follow the visible camera. */
export function pickRoomZone(ray:THREE.Ray,current:Zone):Zone {
  const hit=new THREE.Vector3();
  if(current!=="overview"&&focusBounds[current].some(bounds=>ray.intersectBox(bounds,hit)))return current;
  if(current==='guestbook')return 'overview';
  let nearest=Infinity,result:Zone="overview";
  for(const zone of ["office","books","cinema","guestbook"] as const){
    if(zone===current)continue;
    for(const bounds of overviewBounds[zone])if(!bounds.containsPoint(ray.origin)&&ray.intersectBox(bounds,hit)){
      const distance=ray.origin.distanceToSquared(hit);
      if(distance<nearest){nearest=distance;result=zone;}
    }
  }
  return result;
}

/** A new physical pointer movement is required after every camera transition. */
export class RoomHoverIntent {
  candidate:Zone|null=null;
  private since=0;
  private blockedUntil=0;
  private gapSince:number|null=null;
  point(next:Zone|null,current:Zone,now:number){
    if(next==='overview'&&this.candidate&&this.candidate!=='overview'){
      if(this.gapSince===null)this.gapSince=now;
      if(now-this.gapSince<ROOM_HOVER_TIMING.grace)return;
    }
    if(next===current)next=null;
    if(next===this.candidate&&this.gapSince!==null){this.since+=now-this.gapSince;this.gapSince=null;return;}
    this.gapSince=null;
    if(next!==this.candidate){this.candidate=next;this.since=Math.max(now,this.blockedUntil);}
  }
  reset(now=0,cooldown=0){this.candidate=null;this.since=now;this.blockedUntil=now+cooldown;this.gapSince=null;}
  cancel(){this.candidate=null;this.since=0;this.gapSince=null;}
  nextWakeAt(current:Zone):number|null {
    if(this.candidate===null||this.candidate===current)return null;
    return this.gapSince!==null?this.gapSince+ROOM_HOVER_TIMING.grace:this.since+(this.candidate==='overview'?ROOM_HOVER_TIMING.leave:ROOM_HOVER_TIMING.enter);
  }
  step(current:Zone,now:number):Zone|null {
    if(this.gapSince!==null&&now-this.gapSince>=ROOM_HOVER_TIMING.grace){
      this.since=this.gapSince+ROOM_HOVER_TIMING.grace;this.gapSince=null;this.candidate=current==='overview'?null:'overview';
    }
    if(this.candidate===null||this.candidate===current||this.gapSince!==null)return null;
    if(now-this.since<(this.candidate==="overview"?ROOM_HOVER_TIMING.leave:ROOM_HOVER_TIMING.enter))return null;
    const next=this.candidate;this.reset(now,ROOM_HOVER_TIMING.cooldown);return next;
  }
}

type HoverClock={now:()=>number;set:(callback:()=>void,delay:number)=>unknown;clear:(handle:unknown)=>void};
const browserClock:HoverClock={now:()=>performance.now(),set:(callback,delay)=>setTimeout(callback,delay),clear:handle=>clearTimeout(handle as ReturnType<typeof setTimeout>)};

/** Dwell deadlines run independently of GPU frames, including boundary grace and cooldown. */
export class RoomHoverTimer {
  readonly intent=new RoomHoverIntent();
  private timer:unknown=null;
  private current:()=>Zone;private enabled:()=>boolean;private onZone:(zone:Zone)=>void;private clock:HoverClock;
  constructor(current:()=>Zone,enabled:()=>boolean,onZone:(zone:Zone)=>void,clock:HoverClock=browserClock){this.current=current;this.enabled=enabled;this.onZone=onZone;this.clock=clock;}
  point(next:Zone|null){this.intent.point(next,this.current(),this.clock.now());this.arm();}
  defer(){this.clear();}
  reset(cooldown=0){this.clear();this.intent.reset(this.clock.now(),cooldown);}
  cancel(){this.clear();this.intent.cancel();}
  private clear(){if(this.timer!==null){this.clock.clear(this.timer);this.timer=null;}}
  private arm(){
    this.clear();const deadline=this.intent.nextWakeAt(this.current());if(deadline===null)return;
    this.timer=this.clock.set(()=>{
      this.timer=null;if(!this.enabled()){this.intent.cancel();return;}
      const next=this.intent.step(this.current(),this.clock.now());
      if(next)this.onZone(next);else this.arm();
    },Math.max(0,deadline-this.clock.now()));
  }
}
