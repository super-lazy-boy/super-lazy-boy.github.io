import * as THREE from "three";
import type {Zone} from "./room-types";

export type Vec3=[number,number,number];
export const ROOM_VIEWS:Record<Zone,{camera:Vec3;target:Vec3;distance:[number,number]}>= {
  overview:{camera:[9.2,6.4,11.25],target:[.35,1.9,-.8],distance:[12,21]},
  office:{camera:[-.35,2.92,.55],target:[-3.5,2.7,.55],distance:[2.65,4.6]},
  books:{camera:[-1.9,2.5,-.65],target:[-1.9,2.25,-3.4],distance:[2.5,4.2]},
  cinema:{camera:[3.2,2.95,.75],target:[3.2,2.73,-3.56],distance:[4.1,6.2]}
};
type Bounds=[Vec3,Vec3];
const box=([min,max]:Bounds)=>new THREE.Box3(new THREE.Vector3(...min),new THREE.Vector3(...max));
const overviewBounds:Record<Exclude<Zone,"overview">,THREE.Box3[]>={
  office:[box([[-4.35,.06,-1.5],[-1.12,3.5,2.65]])],
  books:[box([[-4.22,.04,-4.18],[.42,4.62,-3.05]])],
  cinema:[box([[.88,.04,-4.12],[5.95,4.6,-3.0]]),box([[1.65,.02,-.2],[4.28,1.32,2.32]])]
};
const focusBounds={
  office:[box([[-3.93,1.94,-.68],[-3.5,3.48,1.78]])],
  books:overviewBounds.books,
  cinema:overviewBounds.cinema.slice(0,1)
};

/** Use world-space furniture bounds so hit areas follow the visible camera. */
export function pickRoomZone(ray:THREE.Ray,current:Zone):Zone {
  const hit=new THREE.Vector3();
  if(current!=="overview"&&focusBounds[current].some(bounds=>ray.intersectBox(bounds,hit)))return current;
  let nearest=Infinity,result:Zone="overview";
  for(const zone of ["office","books","cinema"] as const){
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
  point(next:Zone|null,current:Zone,now:number){
    if(now<this.blockedUntil||next===current)next=null;
    if(next!==this.candidate){this.candidate=next;this.since=now;}
  }
  reset(now=0,cooldown=0){this.candidate=null;this.since=now;this.blockedUntil=now+cooldown;}
  cancel(){this.candidate=null;this.since=0;}
  step(current:Zone,now:number):Zone|null {
    if(this.candidate===null||this.candidate===current)return null;
    if(now-this.since<(this.candidate==="overview"?540:340))return null;
    const next=this.candidate;this.reset(now,1100);return next;
  }
}
