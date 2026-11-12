"use client";

import { Surface } from "./RoomMaterials";

type Vec3 = [number, number, number];

const WALL = "#f3ede2";
const BASE = "#e5ddcd";

/**
 * An L-shaped shell frames the room without closing it: a back wall behind the
 * shelves and a left wall behind the guest corner. The front stays open so the
 * tour camera can look in.
 */
export function RoomShell() {
  return <group>
    {/* back wall */}
    <mesh position={[.1, 2.5, -4.22]} receiveShadow>
      <boxGeometry args={[15, 5.0, .12]}/>
      <Surface kind="paper" color="#f8f3e9" emissive="#f6efe2" emissiveIntensity={.16}/>
    </mesh>
    <mesh position={[.1, .07, -4.15]} receiveShadow>
      <boxGeometry args={[15, .14, .05]}/>
      <Surface kind="lacquer" color="#e9e1d1"/>
    </mesh>
    {/* left wall */}
    <mesh position={[-6.36, 2.5, .35]} receiveShadow>
      <boxGeometry args={[.12, 5.0, 9.6]}/>
      <Surface kind="paper" color="#f8f3e9" emissive="#f6efe2" emissiveIntensity={.16}/>
    </mesh>
    <mesh position={[-6.29, .07, .35]} receiveShadow>
      <boxGeometry args={[.05, .14, 9.6]}/>
      <Surface kind="lacquer" color="#e9e1d1"/>
    </mesh>
    {/* framed prints: two on the desk wall, one over the shelves */}
    {[
      { p: [-6.28, 2.55, 2.25] as Vec3, rot: [0, Math.PI / 2, 0] as Vec3, c: "#c9a882", s: "#6f7d6a", w: .78, h: 1.0 },
      { p: [-6.28, 2.55, -1.55] as Vec3, rot: [0, Math.PI / 2, 0] as Vec3, c: "#b5654a", s: "#e8dfc9", w: .56, h: .74 },
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