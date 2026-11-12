"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Surface } from "./RoomMaterials";
import {
  CABINET_PROPS, CABINET_TOP, DESK_PROPS, DESK_TOP, SHELF_PROPS, SHELF_TOP, propBox,
} from "@/lib/room-prop-layout";

type Vec3 = [number, number, number];
const noRay = () => null;

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
    <mesh castShadow receiveShadow raycast={noRay}><cylinderGeometry args={[.075, .067, .17, 28]}/><Surface kind="ceramic" color={color}/></mesh>
    <mesh position={[0, .050, 0]} castShadow raycast={noRay}><cylinderGeometry args={[.067, .067, .006, 24]}/><Surface kind="glass" color="#3a2a1c"/></mesh>
    <mesh position={[.090, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow raycast={noRay}>
      <torusGeometry args={[.044, .010, 10, 20, Math.PI]}/>
      <Surface kind="ceramic" color={color}/>
    </mesh>
  </group>;
}

function PenCup({ position }: { position: Vec3 }) {
  return <group position={position}>
    <mesh position={[0, .068, 0]} castShadow receiveShadow raycast={noRay}><cylinderGeometry args={[.062, .058, .135, 24]}/><Surface kind="ceramic" color="#e7e2d4"/></mesh>
    {[[-.02, .01, .18], [.018, -.012, .02], [.005, .022, -.12]].map(([dx, dz, rot], i) => (
      <mesh key={i} position={[dx, .17, dz]} rotation={[.08 * i, 0, rot]} castShadow raycast={noRay}>
        <cylinderGeometry args={[.0075, .0075, .22, 10]}/>
        <Surface kind="paper" color={i === 1 ? "#c9a34a" : "#4a5560"}/>
      </mesh>
    ))}
  </group>;
}

function Notebook({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  return <group position={position} rotation={[0, rotation, 0]}>
    <mesh position={[0, .018, 0]} castShadow receiveShadow raycast={noRay}><boxGeometry args={[.30, .035, .40]}/><Surface kind="paper" color="#3d4a44"/></mesh>
    <mesh position={[0, .036, 0]} raycast={noRay}><boxGeometry args={[.29, .004, .39]}/><Surface kind="paper" color="#f2eee2"/></mesh>
  </group>;
}

function Pen({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  return <group position={position} rotation={[0, rotation, Math.PI / 2]}>
    <mesh castShadow raycast={noRay}><cylinderGeometry args={[.0045, .0045, .135, 12]}/><Surface kind="plastic" color="#2a2f33"/></mesh>
  </group>;
}

function BookStack({ position, rotation = 0, colors }: { position: Vec3; rotation?: number; colors: string[] }) {
  return <group position={position} rotation={[0, rotation, 0]}>
    {colors.map((color, i) => <mesh key={i} position={[i * .006, .014 + i * .028, -i * .004]} rotation={[0, .12 - i * .09, 0]} castShadow receiveShadow raycast={noRay}>
      <boxGeometry args={[.19, .026, .135]}/>
      <Surface kind="paper" color={color}/>
    </mesh>)}
  </group>;
}

function Remote({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  return <mesh position={position} rotation={[0, rotation, 0]} castShadow receiveShadow raycast={noRay}>
    <boxGeometry args={[.19, .022, .06]}/>
    <Surface kind="plastic" color="#2a2e32"/>
  </mesh>;
}

function Frame({ position, rotation = 0, color }: { position: Vec3; rotation?: number; color: string }) {
  return <group position={position} rotation={[-.12, rotation, 0]}>
    <mesh castShadow receiveShadow raycast={noRay}><boxGeometry args={[.17, .21, .012]}/><Surface kind="oak" color="#c8b294"/></mesh>
    <mesh position={[0, 0, .008]} raycast={noRay}><planeGeometry args={[.14, .18]}/><Surface kind="paper" color={color}/></mesh>
  </group>;
}

const byId = (list: typeof DESK_PROPS, id: string) => list.find((item) => item.id === id)!;

/** Desk: everything lives in the free strip behind the monitor. */
export function DeskClutter() {
  const paperA = byId(DESK_PROPS, "paper-a"), paperB = byId(DESK_PROPS, "paper-b");
  return <group>
    <BookStack position={[byId(DESK_PROPS, "stack").x, DESK_TOP, byId(DESK_PROPS, "stack").z]} rotation={0.12} colors={["#8f3f37", "#2f3f52", "#c8b07a"]}/>
    <Paper position={[paperA.x, DESK_TOP + .002, paperA.z]} rotation={paperA.rotation} size={[.30, .42]} color="#f6f1e2"/>
    <Paper position={[paperB.x, DESK_TOP + .004, paperB.z]} rotation={paperB.rotation} size={[.30, .42]} color="#dfe7e9"/>
    <Note position={[paperA.x + .06, DESK_TOP + .006, paperA.z - .10]} rotation={.3} color="#f0d98a"/>
    <Note position={[paperB.x - .05, DESK_TOP + .006, paperB.z + .09]} rotation={-.2} color="#a8c4cf"/>
    <Pen position={[paperA.x + .02, DESK_TOP + .010, paperA.z + .16]} rotation={.9}/>
    <Mug position={[byId(DESK_PROPS, "mug").x, DESK_TOP + .085, byId(DESK_PROPS, "mug").z]}/>
    <PenCup position={[byId(DESK_PROPS, "pencup").x, DESK_TOP, byId(DESK_PROPS, "pencup").z]}/>
    <Notebook position={[byId(DESK_PROPS, "notebook").x, DESK_TOP, byId(DESK_PROPS, "notebook").z]} rotation={0.22}/>
  </group>;
}

/** Bookshelf top: frames, a box and a cup, clear of the built-in plant and boxes. */
export function ShelfClutter() {
  const frames = SHELF_PROPS.filter((item) => item.id.startsWith("frame"));
  const box = byId(SHELF_PROPS, "box"), cup = byId(SHELF_PROPS, "shelf-mug");
  const colors = ["#e8dcc8", "#cfd8d4", "#e3cfc6"];
  return <group>
    {frames.map((frame, i) => <Frame key={frame.id} position={[frame.x, SHELF_TOP + .105, frame.z]} rotation={frame.rotation} color={colors[i]}/>)}
    <mesh position={[box.x, SHELF_TOP + .075, box.z]} rotation={[0, box.rotation ?? 0, 0]} castShadow receiveShadow raycast={noRay}>
      <boxGeometry args={[.30, .15, .22]}/>
      <Surface kind="paper" color="#d9cbb4"/>
    </mesh>
    <Mug position={[cup.x, SHELF_TOP + .085, cup.z]} color="#e9e4d8"/>
  </group>;
}

/** Media cabinet top: only the back strip is free. */
export function CabinetClutter() {
  const remote = byId(CABINET_PROPS, "remote"), note = byId(CABINET_PROPS, "note");
  return <group>
    <Remote position={[remote.x, CABINET_TOP + .012, remote.z]} rotation={remote.rotation ?? 0}/>
    <Note position={[note.x, CABINET_TOP + .002, note.z]} rotation={note.rotation ?? 0} color="#e7dc9a"/>
  </group>;
}

/** A paper bag on the floor beside the desk. */
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
