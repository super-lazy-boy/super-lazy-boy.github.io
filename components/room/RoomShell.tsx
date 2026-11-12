"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Surface } from "./RoomMaterials";
import RoomWindow from "./RoomWindow";

type Vec3 = [number, number, number];

const WALL = "#f3ede2";
const BASE = "#e5ddcd";

/**
 * An L-shaped shell frames the room without closing it: a back wall behind the
 * shelves and a left wall behind the guest corner. The front stays open so the
 * tour camera can look in.
 */
/** Warm oak plank floor, the biggest single move toward the reference interior. */
function useFloorTexture() {
  return useMemo(() => {
    const W = 1024, H = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const c = canvas.getContext("2d")!;
    let seed = 11;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    c.fillStyle = "#b98f63"; c.fillRect(0, 0, W, H);
    const plankH = H / 8;
    for (let row = 0; row < 8; row++) {
      const offset = (row % 2) * (W / 4);
      for (let col = -1; col < 4; col++) {
        const x = offset + col * (W / 4);
        const tone = .88 + random() * .24;
        c.fillStyle = "rgba(" + Math.round(185 * tone) + "," + Math.round(143 * tone) + "," + Math.round(99 * tone) + ",1)";
        c.fillRect(x + 2, row * plankH + 2, W / 4 - 4, plankH - 4);
        for (let g = 0; g < 26; g++) {
          const y = row * plankH + 6 + random() * (plankH - 12);
          c.strokeStyle = random() > .5 ? "rgba(120,86,52,.16)" : "rgba(226,196,150,.18)";
          c.lineWidth = .8 + random() * 1.6;
          c.beginPath(); c.moveTo(x + 4, y); c.bezierCurveTo(x + 90, y + 3, x + 180, y - 3, x + W / 4 - 4, y + 1); c.stroke();
        }
      }
    }
    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(22, 17);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    return map;
  }, []);
}

export function RoomShell() {
  const floor = useFloorTexture();
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[.5,0,1] } receiveShadow>
      <planeGeometry args={[26,20]}/>
      <meshStandardMaterial map={floor} roughness={.78} metalness={0} envMapIntensity={.25}/>
    </mesh>
    {/* back wall */}
    <mesh position={[.1, 2.5, -4.22]} receiveShadow castShadow>
      <boxGeometry args={[15, 5.0, .12]}/>
      <Surface kind="paper" color="#f8f3e9" emissive="#f6efe2" emissiveIntensity={.16}/>
    </mesh>
    <mesh position={[.1, .07, -4.15]} receiveShadow castShadow>
      <boxGeometry args={[15, .14, .05]}/>
      <Surface kind="lacquer" color="#e9e1d1"/>
    </mesh>
    {/* left wall, split around the window opening so daylight only enters there */}
    {[
      { y: .59, h: 1.18, z: .75, d: 4.2 },   // below the window
      { y: 4.31, h: 1.38, z: .75, d: 4.2 },  // above the window
      { y: 2.5, h: 5.0, z: -2.9, d: 3.1 },   // wall before the window
      { y: 2.5, h: 5.0, z: 4.0, d: 2.3 },    // wall after the window
    ].map((seg, i) => <mesh key={i} position={[-6.36, seg.y, seg.z]} receiveShadow castShadow>
      <boxGeometry args={[.12, seg.h, seg.d]}/>
      <Surface kind="paper" color="#f8f3e9" emissive="#f6efe2" emissiveIntensity={.16}/>
    </mesh>)}
    <mesh position={[-6.29, .07, .35]} receiveShadow castShadow>
      <boxGeometry args={[.05, .14, 9.6]}/>
      <Surface kind="lacquer" color="#e9e1d1"/>
    </mesh>
    <RoomWindow/>
    {/* framed prints: two on the desk wall, one over the shelves */}
    {[
      { p: [-6.28, 2.55, -2.55] as Vec3, rot: [0, Math.PI / 2, 0] as Vec3, c: "#c9a882", s: "#6f7d6a", w: .72, h: .94 },
      { p: [-6.28, 2.55, -3.65] as Vec3, rot: [0, Math.PI / 2, 0] as Vec3, c: "#b5654a", s: "#e8dfc9", w: .52, h: .70 },
      { p: [1.15, 3.05, -4.15] as Vec3, rot: [0, 0, 0] as Vec3, c: "#7b8f96", s: "#e6dcc6", w: .92, h: .64 },
    ].map((f, i) => <group key={i} position={f.p} rotation={f.rot}>
      <mesh castShadow receiveShadow raycast={() => null}><boxGeometry args={[f.w + .07, f.h + .07, .035]}/><Surface kind="oak" color="#b08e63"/></mesh>
      <mesh position={[0, 0, .022]} raycast={() => null}><planeGeometry args={[f.w, f.h]}/><Surface kind="paper" color={f.s}/></mesh>
      <mesh position={[0, -.06, .026]} raycast={() => null}><planeGeometry args={[f.w * .82, f.h * .34]}/><Surface kind="paper" color={f.c}/></mesh>
      <mesh position={[0, f.h * .22, .026]} raycast={() => null}><circleGeometry args={[f.w * .13, 28]}/><Surface kind="paper" color="#b5654a"/></mesh>
    </group>)}
  </group>;
}

export default RoomShell;