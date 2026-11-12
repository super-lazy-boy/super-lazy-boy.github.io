"use client";
import {useEffect,useMemo} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {LIGHT_ANCHORS,lightProfile} from '@/lib/room-lighting';

export default function ProjectionBeam({active,night}:{active:boolean;night:boolean}){
  const {invalidate}=useThree();
  const data=useMemo(()=>{
    const source=LIGHT_ANCHORS.projector.position,corners=[[1.19,1.915,-3.855],[5.21,1.915,-3.855],[5.21,4.185,-3.855],[1.19,4.185,-3.855]],vertices:number[]=[],uv:number[]=[];
    for(let i=0;i<4;i++){vertices.push(...source,...corners[i],...corners[(i+1)%4]);uv.push(.5,0,0,1,1,1);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{strength:{value:0}},
      vertexShader:'varying vec2 beamUv; void main(){beamUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:'uniform float strength; varying vec2 beamUv; void main(){float edge=smoothstep(0.0,0.17,beamUv.x)*smoothstep(0.0,0.17,1.0-beamUv.x);float fade=smoothstep(0.0,0.10,beamUv.y)*(1.0-.65*beamUv.y);gl_FragColor=vec4(vec3(.78,.85,1.0),strength*edge*fade);}'
    });return {geometry,material};
  },[]);
  useEffect(()=>{invalidate();},[active,night,invalidate]);
  useEffect(()=>()=>{data.geometry.dispose();data.material.dispose();},[data]);
  useFrame((_,dt)=>{const target=lightProfile(night,active).beam,old=data.material.uniforms.strength.value;data.material.uniforms.strength.value=THREE.MathUtils.lerp(old,target,matchMedia('(prefers-reduced-motion: reduce)').matches?1:1-Math.exp(-Math.min(dt,.1)*5));if(Math.abs(old-target)>.0001)invalidate();});
  return <mesh geometry={data.geometry} material={data.material} userData={{hoverIgnore:true}} raycast={()=>null} renderOrder={2}/>;
}
