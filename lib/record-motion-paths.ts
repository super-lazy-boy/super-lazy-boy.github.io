import * as THREE from 'three';
import {CINEMA_LAYOUT} from './cinema-layout.ts';

export type Pose={position:THREE.Vector3;quaternion:THREE.Quaternion;scale:THREE.Vector3};
export const smooth=(p:number)=>{const t=THREE.MathUtils.clamp(p,0,1);return t*t*(3-2*t);};
export const BOOK_CLEAR=.80,TAPE_CLEAR=.84,BOOK_HOLD_Y=1.55;
export const PLAYER_Y=1.545,PLAYER_FRONT=-2.91,PLAYER_INSIDE=-3.75;
const lerp=(a:THREE.Vector3,b:THREE.Vector3,t:number)=>a.clone().lerp(b,smooth(t));

/** Shelf books translate without rotation until their entire depth is in free air.
 * Floor books first lift away from the floor, then turn inside their reserved bay.
 * Returning uses the exact reversed path and the original physical scale.
 */
export function bookPose(origin:Pose,t:number){
  t=THREE.MathUtils.clamp(t,0,1);
  const floor=Math.abs(origin.quaternion.z)>.45;
  const start=origin.position,pulled=start.clone().add(new THREE.Vector3(0,floor?.30:0,floor?0:BOOK_CLEAR));
  const hold=pulled.clone().add(new THREE.Vector3(0,Math.max(0,BOOK_HOLD_Y-pulled.y),floor?.12:.15));
  const target=new THREE.Quaternion().setFromEuler(new THREE.Euler(-.08,-.40,.04));
  if(t<=.38)return {position:lerp(start,pulled,t/.38),quaternion:origin.quaternion.clone()};
  if(t<=.65)return {position:lerp(pulled,hold,(t-.38)/.27),quaternion:origin.quaternion.clone()};
  return {position:hold,quaternion:origin.quaternion.clone().slerp(target,smooth((t-.65)/.35))};
}

/** A single rigid tape is pulled out, raised in a clear front corridor, rotated,
 * translated to the player, lowered, and inserted into a genuinely hollow slot.
 * Every stage meets at the same pose. There is no shape swap or scale change.
 */
export function tapePose(origin:Pose,t:number){
  t=THREE.MathUtils.clamp(t,0,1);
  const start=origin.position,pulled=start.clone().add(new THREE.Vector3(0,0,TAPE_CLEAR));
  const high=pulled.clone();high.y=Math.max(2.16,start.y+.40);
  const above=new THREE.Vector3(CINEMA_LAYOUT.origin[0]+CINEMA_LAYOUT.tapePlayerX,high.y,PLAYER_FRONT);
  const mouth=new THREE.Vector3(above.x,PLAYER_Y,PLAYER_FRONT),inside=new THREE.Vector3(above.x,PLAYER_Y,PLAYER_INSIDE);
  const flat=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI/2),scale=origin.scale.clone();
  if(t<=.22)return {position:lerp(start,pulled,t/.22),quaternion:origin.quaternion.clone(),scale};
  if(t<=.40)return {position:lerp(pulled,high,(t-.22)/.18),quaternion:origin.quaternion.clone(),scale};
  if(t<=.55)return {position:high,quaternion:origin.quaternion.clone().slerp(flat,smooth((t-.40)/.15)),scale};
  if(t<=.69)return {position:lerp(high,above,(t-.55)/.14),quaternion:flat.clone(),scale};
  if(t<=.80)return {position:lerp(above,mouth,(t-.69)/.11),quaternion:flat.clone(),scale};
  return {position:lerp(mouth,inside,(t-.80)/.20),quaternion:flat.clone(),scale};
}
