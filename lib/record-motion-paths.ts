import * as THREE from "three";
import { CINEMA_LAYOUT } from "./cinema-layout.ts";

export type Pose = { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3 };

export const smooth = (p: number) => { const v = THREE.MathUtils.clamp(p, 0, 1); return v * v * (3 - 2 * v); };

/** Clearance constants keep the moving object outside the shelf and cabinet shells. */
export const BOOK_CLEAR = .54;
export const TAPE_CLEAR = .60;
export const BOOK_HOLD_Y = 1.62;
export const PLAYER_Y = 1.525;
export const PLAYER_FRONT = -2.91;
export const PLAYER_INSIDE = -3.79;

/** Straight pull-out, then lift and turn only once the book is clear of the shelf. */
export function bookPose(origin: Pose, t: number) {
  const start = origin.position;
  const pulled = start.clone().add(new THREE.Vector3(0, 0, BOOK_CLEAR));
  const hold = pulled.clone().add(new THREE.Vector3(0, Math.max(0, BOOK_HOLD_Y - pulled.y), BOOK_CLEAR * .55));
  const tilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.12, -.52, .08));
  const target = Math.abs(origin.quaternion.z) > .45 ? tilt : origin.quaternion.clone().multiply(tilt);
  if (t < .34) {
    const k = smooth(t / .34);
    return { position: start.clone().lerp(pulled, k), quaternion: origin.quaternion.clone() };
  }
  if (t < .78) {
    const k = smooth((t - .34) / .44);
    const position = pulled.clone().lerp(hold, k);
    position.y += Math.sin(k * Math.PI) * .03;
    return { position, quaternion: origin.quaternion.clone().slerp(target, k) };
  }
  const k = smooth((t - .78) / .22);
  return { position: hold.clone().add(new THREE.Vector3(0, -.03 * k, 0)), quaternion: target.clone() };
}

/** Out of the cabinet, up over the lip, across, then down into the player. */
export function tapePose(origin: Pose, t: number) {
  const pulled = origin.position.clone().add(new THREE.Vector3(0, 0, TAPE_CLEAR));
  const lift = pulled.clone(); lift.y = Math.max(pulled.y + .20, 1.68);
  const playerX = CINEMA_LAYOUT.origin[0] + CINEMA_LAYOUT.tapePlayerX;
  const above = new THREE.Vector3(playerX, lift.y, PLAYER_FRONT);
  const mouth = new THREE.Vector3(playerX, PLAYER_Y, PLAYER_FRONT);
  const inside = new THREE.Vector3(playerX, PLAYER_Y, PLAYER_INSIDE);
  const upright = origin.quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2));
  const level = new THREE.Quaternion();
  if (t < .22) {
    const k = smooth(t / .22);
    return { position: origin.position.clone().lerp(pulled, k), quaternion: origin.quaternion.clone(), scale: new THREE.Vector3(1, 1, 1) };
  }
  if (t < .55) {
    const k = smooth((t - .22) / .33);
    const position = pulled.clone().lerp(lift, k);
    position.lerpVectors(lift, above, smooth(Math.max(0, (k - .45) / .55)));
    return { position, quaternion: origin.quaternion.clone().slerp(upright, smooth(k * 1.6)).slerp(level, smooth(Math.max(0, (k - .5) / .5))), scale: new THREE.Vector3(1, 1, 1) };
  }
  if (t < .78) {
    const k = smooth((t - .55) / .23);
    return { position: above.clone().lerp(mouth, k), quaternion: level.clone(), scale: new THREE.Vector3(1, 1, 1) };
  }
  const k = smooth((t - .78) / .22);
  return { position: mouth.clone().lerp(inside, k), quaternion: level.clone(), scale: new THREE.Vector3(1, 1, 1).lerp(new THREE.Vector3(.94, .94, .94), k) };
}
