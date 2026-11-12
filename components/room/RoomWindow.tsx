"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Surface } from "./RoomMaterials";

type Vec3 = [number, number, number];
const noRay = () => null;

const WALL_X = -6.36;
const OPEN = { z0: -1.35, z1: 2.85, y0: 1.18, y1: 3.62 };
const FRAME = "#efe7d6";

/** Canvas textures for the view outside: sky, foliage, blossom. */
function useOutdoorTextures() {
  return useMemo(() => {
    const make = (draw: (c: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 512) => {
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const c = canvas.getContext("2d")!;
      draw(c, w, h);
      const map = new THREE.CanvasTexture(canvas);
      map.colorSpace = THREE.SRGBColorSpace;
      return map;
    };
    let seed = 7;
    const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    const sky = make((c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#cfe3f0");
      g.addColorStop(.45, "#e8eede");
      g.addColorStop(.72, "#f6ecd2");
      g.addColorStop(1, "#f3e3c6");
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    });

    const foliage = make((c, w, h) => {
      c.clearRect(0, 0, w, h);
      // layered canopy blobs with a soft edge
      for (let i = 0; i < 90; i++) {
        const x = random() * w, y = h * .25 + random() * h * .7, r = 26 + random() * 78;
        const g = c.createRadialGradient(x, y, r * .2, x, y, r);
        const tone = random();
        g.addColorStop(0, tone > .55 ? "rgba(94,124,74,.95)" : "rgba(70,100,62,.95)");
        g.addColorStop(1, "rgba(60,88,54,0)");
        c.fillStyle = g;
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
      }
    });

    const view = make((c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#bcd8ea"); g.addColorStop(.35, "#dfe9df");
      g.addColorStop(.62, "#f4ecd4"); g.addColorStop(1, "#efe0c4");
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      // sun glow
      const sun = c.createRadialGradient(w * .62, h * .30, 10, w * .62, h * .30, h * .55);
      sun.addColorStop(0, "rgba(255,246,214,.95)"); sun.addColorStop(.35, "rgba(255,236,190,.45)"); sun.addColorStop(1, "rgba(255,236,190,0)");
      c.fillStyle = sun; c.fillRect(0, 0, w, h);
      // distant tree line
      for (let layer = 0; layer < 3; layer++) {
        const baseY = h * (.52 + layer * .09), alpha = .35 + layer * .22;
        for (let i = 0; i < 46; i++) {
          const x = random() * w, r = 40 + random() * (90 - layer * 12);
          c.fillStyle = "rgba(" + (72 - layer * 6) + "," + (96 - layer * 4) + "," + (58 + layer * 4) + "," + alpha + ")";
          c.beginPath(); c.arc(x, baseY + (random() - .5) * 30, r, 0, Math.PI * 2); c.fill();
        }
      }
      // near foliage with individual leaves
      for (let i = 0; i < 240; i++) {
        const x = random() * w, y = h * .5 + random() * h * .45, r = 3 + random() * 9;
        c.fillStyle = random() > .5 ? "rgba(74,102,58,.85)" : "rgba(96,126,74,.8)";
        c.beginPath(); c.ellipse(x, y, r, r * .55, random() * 3, 0, Math.PI * 2); c.fill();
      }
      // a few warm blossoms catching light
      for (let i = 0; i < 26; i++) {
        const x = random() * w, y = h * .55 + random() * h * .4, r = 4 + random() * 6;
        c.fillStyle = "rgba(232,176,168,.9)";
        for (let p = 0; p < 5; p++) {
          const a = p * Math.PI * 2 / 5;
          c.beginPath(); c.ellipse(x + Math.cos(a) * r * .5, y + Math.sin(a) * r * .5, r * .45, r * .3, a, 0, Math.PI * 2); c.fill();
        }
      }
    }, 1024, 640);

    const blossom = make((c, w, h) => {
      c.clearRect(0, 0, w, h);
      for (let i = 0; i < 60; i++) {
        const x = random() * w, y = random() * h, r = 8 + random() * 12;
        c.fillStyle = random() > .5 ? "rgba(232,170,168,.95)" : "rgba(244,206,196,.95)";
        for (let p = 0; p < 5; p++) {
          const a = p * Math.PI * 2 / 5;
          c.beginPath(); c.ellipse(x + Math.cos(a) * r * .5, y + Math.sin(a) * r * .5, r * .45, r * .32, a, 0, Math.PI * 2); c.fill();
        }
        c.fillStyle = "rgba(214,150,90,.9)";
        c.beginPath(); c.arc(x, y, r * .22, 0, Math.PI * 2); c.fill();
      }
    });
    const sunPatch = make((c, w, h) => {
      c.clearRect(0, 0, w, h);
      const g = c.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "rgba(255,226,168,.95)");
      g.addColorStop(.55, "rgba(255,214,150,.55)");
      g.addColorStop(1, "rgba(255,206,140,0)");
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      // mullion gaps
      c.globalCompositeOperation = "destination-out";
      c.fillStyle = "rgba(0,0,0,.85)";
      c.fillRect(w * .33, 0, w * .03, h);
      c.fillRect(w * .66, 0, w * .03, h);
      c.fillRect(0, h * .52, w, h * .03);
      c.globalCompositeOperation = "source-over";
    }, 512, 512);

    return { sky, foliage, blossom, view, sunPatch };
  }, []);
}

/** A climbing vine hugging the window frame. */
function Vine({ from, to, curve = .35, leaves = 22 }: { from: Vec3; to: Vec3; curve?: number; leaves?: number }) {
  const { points, leafSpots } = useMemo(() => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
    const mid = a.clone().lerp(b, .5);
    mid.z += curve;
    const pts = new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(26);
    const spots = Array.from({ length: leaves }, (_, i) => {
      const p = pts[Math.min(pts.length - 1, Math.round(i / (leaves - 1) * (pts.length - 1)))];
      return { p: p.clone(), a: (i * 2.399) % (Math.PI * 2), s: .6 + (i % 3) * .18 };
    });
    return { points: pts, leafSpots: spots };
  }, [JSON.stringify([from, to, curve, leaves])]);
  const geometry = useMemo(() => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 40, .012, 6, false), [points]);
  return <group>
    <mesh geometry={geometry} raycast={noRay}><Surface kind="fabric" color="#4d6338"/></mesh>
    {leafSpots.map((spot, i) => <mesh key={i} position={spot.p.toArray() as Vec3} rotation={[.4, spot.a, .5]} scale={[.09 * spot.s, .13 * spot.s, .02]} raycast={noRay}>
      <sphereGeometry args={[1, 10, 8]}/>
      <Surface kind="fabric" color={i % 3 ? "#5c7444" : "#6d8650"}/>
    </mesh>)}
  </group>;
}

export function RoomWindow() {
  const { view, sunPatch } = useOutdoorTextures();
  const { z0, z1, y0, y1 } = OPEN;
  const midZ = (z0 + z1) / 2, width = z1 - z0, height = y1 - y0, midY = (y0 + y1) / 2;

  return <group>
    {/* balcony slab, railing and flower boxes */}
    <mesh position={[WALL_X - 1.05, .02, midZ]} receiveShadow castShadow>
      <boxGeometry args={[2.1, .12, width + .9]}/>
      <Surface kind="oak" color="#b9a184"/>
    </mesh>
    {[0, 1, 2, 3, 4, 5].map(i => <mesh key={i} position={[WALL_X - 2.02, .55, z0 - .3 + i * ((width + .6) / 5)]} castShadow>
      <boxGeometry args={[.05, 1.05, .05]}/>
      <Surface kind="metal" color="#7d7a70"/>
    </mesh>)}
    <mesh position={[WALL_X - 2.02, 1.06, midZ]} castShadow><boxGeometry args={[.09, .07, width + .7]}/><Surface kind="oak" color="#b9a184"/></mesh>
    {[-1.1, 0, 1.1].map((dz, i) => <group key={i} position={[WALL_X - 2.02, 1.12, midZ + dz]}>
      <mesh castShadow receiveShadow raycast={noRay}><boxGeometry args={[.24, .18, .5]}/><Surface kind="ceramic" color={i === 1 ? "#cfc3ae" : "#c9b79c"}/></mesh>
      {[0, 1, 2, 3, 4].map(k => <mesh key={k} position={[(k % 2) * .06 - .03, .14 + (k % 3) * .05, -.18 + k * .09]} scale={[.07, .07, .07]} raycast={noRay}>
        <icosahedronGeometry args={[1, 0]}/>
        <Surface kind="fabric" color={k % 2 ? "#c86f74" : "#dfa0a2"}/>
      </mesh>)}
      {[0, 1, 2].map(k => <mesh key={"g" + k} position={[-.04 + k * .04, .1 + k * .04, -.12 + k * .12]} scale={[.09, .05, .06]} raycast={noRay}>
        <sphereGeometry args={[1, 8, 6]}/>
        <Surface kind="fabric" color="#5d7546"/>
      </mesh>)}
    </group>)}

    {/* the view: one painted panorama outside the window */}
    <mesh position={[WALL_X - 8.5, 2.7, midZ]} rotation={[0, Math.PI / 2, 0]} raycast={noRay}>
      <planeGeometry args={[17, 10]}/>
      <meshBasicMaterial map={view}/>
    </mesh>
    {/* window frame + sill */}
    <mesh position={[WALL_X + .04, y0 - .06, midZ]} castShadow receiveShadow><boxGeometry args={[.26, .1, width + .3]}/><Surface kind="lacquer" color={FRAME}/></mesh>
    <mesh position={[WALL_X + .04, y1 + .05, midZ]} castShadow><boxGeometry args={[.2, .1, width + .3]}/><Surface kind="lacquer" color={FRAME}/></mesh>
    {[z0, midZ, z1].map(z => <mesh key={z} position={[WALL_X + .04, midY, z]} castShadow><boxGeometry args={[.2, height, .07]}/><Surface kind="lacquer" color={FRAME}/></mesh>)}
    <mesh position={[WALL_X + .04, midY + height * .18, midZ]} castShadow><boxGeometry args={[.16, .05, width]}/><Surface kind="lacquer" color={FRAME}/></mesh>

    {/* sun patch on the floor: a skewed, soft-edged window projection */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[WALL_X + 2.05, .012, midZ + .35]} raycast={noRay}>
      <planeGeometry args={[4.0, 4.4]}/>
      <meshBasicMaterial map={sunPatch} transparent opacity={.5} depthWrite={false} blending={THREE.AdditiveBlending}/>
    </mesh>

    {/* roses climbing the frame */}
    <Vine from={[WALL_X + .12, y0 - .1, z0 - .05]} to={[WALL_X + .12, y1 - .2, z0 + .1]} curve={.5} leaves={20}/>
    <Vine from={[WALL_X + .12, y1 - .1, z1 + .05]} to={[WALL_X + .12, y0 + .3, z1 - .1]} curve={-.45} leaves={18}/>
    <Vine from={[WALL_X + .12, y1 + .02, midZ + .6]} to={[WALL_X + .12, y1 - .5, midZ - .8]} curve={.35} leaves={14}/>
  </group>;
}

export default RoomWindow;