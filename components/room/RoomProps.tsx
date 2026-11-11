"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Surface } from "./RoomMaterials";

type Vec3 = [number, number, number];
const noRay = () => null;

/** Thin sheet of paper lying on a surface. */
function Paper({ position, rotation = 0, size = [.21, .297] as [number, number], color = "#f7f5ef" }: { position: Vec3; rotation?: number; size?: [number, number]; color?: string }) {
  return <mesh position={position} rotation={[0, rotation, 0]} castShadow receiveShadow raycast={noRay}>
    <boxGeometry args={[size[0], .0016, size[1]]}/>
    <Surface kind="paper" color={color}/>
  </mesh>;
}

function Note({ position, rotation, color }: { position: Vec3; rotation: number; color: string }) {
  return <mesh position={position} rotation={[0, rotation, 0]} castShadow receiveShadow raycast={noRay}>
    <boxGeometry args={[.11, .0012, .11]}/>
    <Surface kind="paper" color={color}/>
  </mesh>;
}

function Mug({ position, color = "#f2efe6" }: { position: Vec3; color?: string }) {
  return <group position={position}>
    <mesh castShadow receiveShadow raycast={noRay}><cylinderGeometry args={[.058, .052, .13, 28]}/><Surface kind="ceramic" color={color}/></mesh>
    <mesh position={[0, .038, 0]} castShadow raycast={noRay}><cylinderGeometry args={[.052, .052, .005, 24]}/><Surface kind="glass" color="#3a2a1c"/></mesh>
    <mesh position={[.070, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow raycast={noRay}>
      <torusGeometry args={[.034, .008, 10, 20, Math.PI]}/>
      <Surface kind="ceramic" color={color}/>
    </mesh>
  </group>;
}

function Headphones({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  return <group position={position} rotation={[0, rotation, 0]}>
    <mesh position={[0, .02, 0]} rotation={[0, 0, 0]} castShadow raycast={noRay}>
      <torusGeometry args={[.082, .009, 10, 28, Math.PI]}/>
      <Surface kind="plastic" color="#22262a"/>
    </mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * .082, .012, 0]} rotation={[0, 0, Math.PI / 2]} castShadow raycast={noRay}>
      <cylinderGeometry args={[.034, .034, .022, 20]}/>
      <Surface kind="fabric" color="#2b3034"/>
    </mesh>)}
  </group>;
}

function Pen({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  return <group position={position} rotation={[0, rotation, Math.PI / 2]}>
    <mesh castShadow raycast={noRay}><cylinderGeometry args={[.0045, .0045, .135, 12]}/><Surface kind="plastic" color="#2a2f33"/></mesh>
    <mesh position={[0, .072, 0]} castShadow raycast={noRay}><coneGeometry args={[.0045, .016, 12]}/><Surface kind="metal" color="#c8ccd0"/></mesh>
  </group>;
}

function Cable({ points, color = "#2c3034", radius = .0055 }: { points: Vec3[]; color?: string; radius?: number }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), [JSON.stringify(points)]);
  return <mesh castShadow raycast={noRay}><tubeGeometry args={[curve, 48, radius, 6, false]}/><Surface kind="plastic" color={color}/></mesh>;
}

function BookStack({ position, colors }: { position: Vec3; colors: string[] }) {
  return <group position={position}>
    {colors.map((color, i) => <mesh key={i} position={[i * .006, .014 + i * .028, -i * .004]} rotation={[0, .12 - i * .09, 0]} castShadow receiveShadow raycast={noRay}>
      <boxGeometry args={[.19, .026, .135]}/>
      <Surface kind="paper" color={color}/>
    </mesh>)}
  </group>;
}

/** Desk: loose papers, notes, pen, mug, headphones, mouse pad, cable. */
export function DeskClutter() {
  const top = 1.69;
  return <group>
    {/* papers sit slightly stacked so the pile reads as thickness */}
    <Paper position={[-3.20, top + .003, 1.46]} rotation={.28} size={[.33, .46]} color="#f6f1e2"/>
    <Paper position={[-2.96, top + .0055, 1.66]} rotation={-.42} size={[.32, .45]} color="#dfe7e9"/>
    <Paper position={[-3.30, top + .008, 1.38]} rotation={.61} size={[.31, .44]} color="#efe6d2"/>
    <Paper position={[-3.04, top + .003, 2.06]} rotation={.15} size={[.32, .46]} color="#f7f4ea"/>
    <Paper position={[-3.34, top + .003, -.94]} rotation={-.28} size={[.33, .46]} color="#e9e2cf"/>
    <Paper position={[-2.90, top + .004, .26]} rotation={-.62} size={[.31, .44]} color="#f3ecdc"/>
    <Paper position={[-3.02, top + .0065, .18]} rotation={.34} size={[.30, .43]} color="#dfe7e9"/>
    <Note position={[-3.02, top + .005, 1.96]} rotation={.3} color="#f0d98a"/>
    <Note position={[-2.90, top + .005, 2.10]} rotation={-.2} color="#a8c4cf"/>
    <Note position={[-3.14, top + .005, 2.14]} rotation={.5} color="#e0a9a2"/>
    <Pen position={[-3.16, top + .010, 1.60]} rotation={.9}/>
    <Mug position={[-2.90, top + .062, 1.22]}/>
    <Headphones position={[-3.26, top + .020, -1.04]} rotation={.6}/>
    <BookStack position={[-3.40, top, 2.26]} colors={["#8f3f37", "#2f3f52", "#c8b07a"]}/>
    {/* mouse pad + cable routing */}
    <mesh position={[-3.06, top + .002, -.46]} rotation={[0, .08, 0]} receiveShadow raycast={noRay}>
      <boxGeometry args={[.42, .003, .32]}/>
      <Surface kind="fabric" color="#3b4046"/>
    </mesh>
    <Cable points={[[-3.72, top + .01, .58], [-3.86, top + .02, .34], [-3.92, top + .02, -.2], [-3.7, top + .02, -.62]]} radius={.008}/>
    <Cable points={[[-3.06, top + .012, .78], [-3.22, top + .014, 1.02], [-3.52, top + .014, 1.12]]} radius={.006}/>
  </group>;
}

/** Top of the bookshelf: frames, boxes, a cup, a small plant. */
export function ShelfClutter() {
  const top = 4.32;
  const frames: Array<{ x: number; rot: number; color: string }> = [
    { x: -3.35, rot: .16, color: "#e8dcc8" },
    { x: -3.10, rot: -.10, color: "#cfd8d4" },
    { x: -2.86, rot: .22, color: "#e3cfc6" },
  ];
  return <group>
    {frames.map((frame, i) => <group key={i} position={[frame.x, top + .10, -3.82]} rotation={[-.12, frame.rot, 0]}>
      <mesh castShadow receiveShadow raycast={noRay}><boxGeometry args={[.17, .21, .012]}/><Surface kind="oak" color="#c8b294"/></mesh>
      <mesh position={[0, 0, .008]} raycast={noRay}><planeGeometry args={[.14, .18]}/><Surface kind="paper" color={frame.color}/></mesh>
    </group>)}
    <mesh position={[-.95, top + .075, -3.80]} rotation={[0, -.08, 0]} castShadow receiveShadow raycast={noRay}>
      <boxGeometry args={[.30, .15, .22]}/>
      <Surface kind="paper" color="#d9cbb4"/>
    </mesh>
    <Mug position={[.02, top + .048, -3.78]} color="#e9e4d8"/>
    <group position={[-4.02, top, -3.78]}>
      <mesh position={[0, .07, 0]} castShadow receiveShadow raycast={noRay}><cylinderGeometry args={[.07, .058, .14, 20]}/><Surface kind="ceramic" color="#cfc6b6"/></mesh>
      {[0, 1, 2, 3, 4].map(i => {
        const angle = i * 1.26;
        return <mesh key={i} position={[Math.cos(angle) * .045, .18 + (i % 2) * .04, Math.sin(angle) * .045]} scale={[.5, .5, 1.3]} castShadow raycast={noRay}>
          <sphereGeometry args={[.055, 14, 10]}/>
          <Surface kind="fabric" color="#4a6b45"/>
        </mesh>;
      })}
    </group>
  </group>;
}

/** Top of the media cabinet: remote, a tape lying flat, a note. */
export function CabinetClutter() {
  const top = 1.47;
  return <group>
    <mesh position={[4.52, top + .012, -3.62]} rotation={[0, -.22, 0]} castShadow receiveShadow raycast={noRay}>
      <boxGeometry args={[.19, .022, .06]}/>
      <Surface kind="plastic" color="#2a2e32"/>
    </mesh>
    <mesh position={[1.78, top + .028, -3.58]} rotation={[0, .14, 0]} castShadow receiveShadow raycast={noRay}>
      <boxGeometry args={[.26, .05, .16]}/>
      <Surface kind="tape" color="#33383c"/>
    </mesh>
    <Note position={[3.86, top + .003, -3.58]} rotation={-.3} color="#e7dc9a"/>
    <Cable points={[[4.52, top + .02, -3.66], [4.4, top + .02, -3.72], [4.1, top + .02, -3.7]]} radius={.004}/>
  </group>;
}

/** A paper bag and a few loose things on the floor. */
export function FloorClutter() {
  return <group>
    <mesh position={[-2.62, .15, 2.86]} rotation={[0, .34, 0]} castShadow receiveShadow raycast={noRay}>
      <boxGeometry args={[.22, .30, .15]}/>
      <Surface kind="paper" color="#c9b391"/>
    </mesh>
    <mesh position={[-2.62, .31, 2.86]} rotation={[0, .34, .1]} castShadow raycast={noRay}>
      <boxGeometry args={[.20, .02, .13]}/>
      <Surface kind="paper" color="#b89f78"/>
    </mesh>
  </group>;
}

export default function RoomProps() {
  return <group>
    <DeskClutter/>
    <ShelfClutter/>
    <CabinetClutter/>
    <FloorClutter/>
  </group>;
}
