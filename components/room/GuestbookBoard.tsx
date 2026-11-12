"use client";
import {useEffect,useMemo,useRef,useState} from 'react';
import {Html,RoundedBox} from '@react-three/drei';
const noRay=()=>null;
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {NOTE_COLORS,type GuestNote,type GuestbookData} from '@/lib/guestbook';
import {ROOM_VIEWS} from '@/lib/room-navigation';

function useBoardTexture(notes: GuestNote[]) {
  const texture = useMemo(() => {
    const W = 1024, H = 880;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    // painted wooden frame + cork backing (single quad, no 3D edge to catch light)
    ctx.fillStyle = "#a3855c"; ctx.fillRect(0, 0, W, H);
    const frameShade = ctx.createLinearGradient(0, 0, W, H);
    frameShade.addColorStop(0, "rgba(255,240,215,.35)");
    frameShade.addColorStop(.55, "rgba(0,0,0,0)");
    frameShade.addColorStop(1, "rgba(60,40,20,.28)");
    ctx.fillStyle = frameShade; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#c9cabe"; ctx.fillRect(44, 40, W - 88, H - 80);
    for (let i = 0; i < 2200; i++) {
      const x = (i * 137.5) % W, y = (i * 71.3) % H;
      ctx.fillStyle = i % 3 ? "rgba(0,0,0,.035)" : "rgba(255,255,255,.05)";
      ctx.fillRect(x, y, 2, 2);
    }
    const slots = [
      { x: .04, y: .05, r: -.03 }, { x: .53, y: .03, r: .04 },
      { x: .06, y: .52, r: .025 }, { x: .54, y: .50, r: -.03 },
    ];
    const fallback = ["#f3e6ba", "#dce3cf", "#e9ddd5", "#e2dfed"];
    slots.forEach((slot, index) => {
      const note = notes[index];
      const w = 380, h = 330;
      const x = 44 + slot.x * (W - 88), y = 40 + slot.y * (H - 80);
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(slot.r);
      ctx.shadowColor = "rgba(60,56,40,.35)";
      ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
      ctx.fillStyle = note ? NOTE_COLORS[note.color] : fallback[index % 4];
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.shadowColor = "transparent";
      const shade = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      shade.addColorStop(0, "rgba(0,0,0,.06)"); shade.addColorStop(.45, "rgba(0,0,0,0)"); shade.addColorStop(1, "rgba(0,0,0,.10)");
      ctx.fillStyle = shade; ctx.fillRect(-w / 2, -h / 2, w, h);
      // washi tape
      ctx.fillStyle = "rgba(196,186,160,.75)";
      ctx.fillRect(-34, -h / 2 - 10, 68, 26);
      ctx.fillStyle = "#3a4036";
      ctx.font = "600 30px 'Microsoft YaHei', sans-serif";
      ctx.textBaseline = "top";
      const body = note?.body || (index === 0 ? "来过，留一句。" : "");
      const chars = Array.from(body);
      for (let row = 0; row < 5; row++) {
        ctx.fillText(chars.slice(row * 11, row * 11 + 11).join(""), -w / 2 + 30, -h / 2 + 52 + row * 46, w - 60);
      }
      ctx.font = "400 20px sans-serif";
      ctx.fillStyle = "#5c6355";
      ctx.fillText(note ? note.authorName : index === 0 ? "NOTES LEFT HERE" : "", -w / 2 + 30, h / 2 - 46, w - 60);
      ctx.restore();
    });
    const edge = ctx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .78);
    edge.addColorStop(0, "rgba(0,0,0,0)");
    edge.addColorStop(1, "rgba(60,55,40,.22)");
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, W, H);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    return map;
  }, [notes.map((note) => note.id + note.body + note.color).join("|")]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

export function GuestbookCamera(){
 const {camera,invalidate}=useThree(),target=useRef(new THREE.Vector3(...ROOM_VIEWS.guestbook.target));
 const reduced=useMemo(()=>matchMedia('(prefers-reduced-motion: reduce)').matches,[]),end=useMemo(()=>new THREE.Vector3(...ROOM_VIEWS.guestbook.camera),[]),focal=useRef(new THREE.Vector3());
 useEffect(()=>{camera.getWorldDirection(focal.current);focal.current.multiplyScalar(3.3).add(camera.position);},[camera]);
 useEffect(()=>{invalidate();},[invalidate]);
 useFrame((_,delta)=>{
  const alpha=reduced?1:1-Math.exp(-Math.min(delta,.20)*5.3);
  camera.position.lerp(end,alpha);focal.current.lerp(target.current,alpha);camera.lookAt(focal.current);
  if(camera instanceof THREE.PerspectiveCamera){camera.fov=THREE.MathUtils.lerp(camera.fov,40,alpha);camera.updateProjectionMatrix();}
  if(camera.position.distanceToSquared(end)>.000001||focal.current.distanceToSquared(target.current)>.000001)invalidate();
 });return null;
}
export default function GuestbookBoard({data,onOpen,active=true}:{data:GuestbookData|null;onOpen:()=>void;active?:boolean}){
 const [hover,setHover]=useState(false),notes=data?.notes.slice(0,4)||[],board=useBoardTexture(notes);
 return <group userData={{roomZone:'guestbook'}} position={[-5.5,2.45,3.65]} rotation={[0,Math.PI/2,0]} onClick={e=>{e.stopPropagation();if(active&&e.delta<4)onOpen();}} onPointerOver={e=>{e.stopPropagation();if(active){setHover(true);document.body.style.cursor='pointer';}}} onPointerOut={()=>{setHover(false);document.body.style.cursor='';}}>
  <mesh position={[0,0,.036]} castShadow><boxGeometry args={[1.23,1.05,.065]}/><meshStandardMaterial color={hover?'#96764e':'#a3855c'} roughness={.95} metalness={0} envMapIntensity={.05}/></mesh>
  <mesh position={[0,0,.075]}><planeGeometry args={[1.23,1.05]}/><meshBasicMaterial map={board}/></mesh>
  {[-1,1].map(side=><group key={'frame'+side}>
    <RoundedBox args={[1.27,.045,.055]} position={[0,side*.518,.080]} radius={.006} smoothness={2} castShadow receiveShadow><meshStandardMaterial color="#c4b193" roughness={.58}/></RoundedBox>
    <RoundedBox args={[.045,.99,.055]} position={[side*.613,0,.080]} radius={.006} smoothness={2} castShadow receiveShadow><meshStandardMaterial color="#c4b193" roughness={.58}/></RoundedBox>
  </group>)}
  {[-.49,.49].map(x=><mesh key={x} position={[x,-1.46,-.03]} castShadow><boxGeometry args={[.035,1.90,.035]}/><meshStandardMaterial color="#c3c8c0" roughness={.5} metalness={.3}/></mesh>)}
  {[-.49,.49].map(x=><mesh key={x} position={[x,-2.40,-.01]} castShadow><boxGeometry args={[.11,.05,.45]}/><meshStandardMaterial color="#b6bdb3" roughness={.55}/></mesh>)}
 </group>;
}
