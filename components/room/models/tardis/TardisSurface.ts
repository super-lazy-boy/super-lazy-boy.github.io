import * as THREE from 'three';

// Paint loss is a surface layer: it changes no structural dimensions or silhouette.
export function enableAgedPaint(material:THREE.MeshPhysicalMaterial,rootInverse:THREE.Matrix4){
 material.userData.agedPaint=true;
 material.onBeforeCompile=shader=>{
  shader.uniforms.wearRootInverse={value:rootInverse};
  shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
   uniform mat4 wearRootInverse; attribute vec3 wearHalfSize; varying vec3 vWearLocal; varying vec3 vWearHalf; varying vec3 vWearWorld;`);
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vWearLocal=position; vWearHalf=wearHalfSize;
   vec4 wearPoint=vec4(position,1.0);
   #ifdef USE_INSTANCING
    wearPoint=instanceMatrix*wearPoint;
   #endif
   vWearWorld=(wearRootInverse*modelMatrix*wearPoint).xyz;`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 vWearLocal; varying vec3 vWearHalf; varying vec3 vWearWorld;
   float wearHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
   float wearNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(mix(wearHash(i),wearHash(i+vec3(1,0,0)),f.x),mix(wearHash(i+vec3(0,1,0)),wearHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(wearHash(i+vec3(0,0,1)),wearHash(i+vec3(1,0,1)),f.x),mix(wearHash(i+vec3(0,1,1)),wearHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec3 edgeDistance=max(vWearHalf-abs(vWearLocal),vec3(0.0));
   float edgeD=max(min(edgeDistance.x,edgeDistance.y),min(max(edgeDistance.x,edgeDistance.y),edgeDistance.z));
   float wearPatch=wearNoise(vWearWorld*vec3(21.0,8.0,21.0));
   float fine=wearNoise(vWearWorld*vec3(270.0,90.0,270.0));
   float edge=(1.0-smoothstep(0.001,0.011,edgeD))*(0.15+0.47*wearPatch);
   float chips=(1.0-smoothstep(0.003,0.023,edgeD))*smoothstep(0.68,0.83,fine)*0.6;
   float fade=wearNoise(vWearWorld*vec3(8.0,2.0,8.0))*0.13;
   float wearAmount=clamp(edge+chips+fade,0.0,0.78);
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.055,0.078,0.090),wearAmount);
   float baseDirt=(1.0-smoothstep(0.08,0.44,vWearWorld.y))*(0.13+wearPatch*0.1);
   diffuseColor.rgb*=1.0-baseDirt;
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   roughnessFactor=clamp(roughnessFactor+fade*0.6-edge*0.15,0.42,0.94);`);
 };
 material.customProgramCacheKey=()=> 'tardis-local-aged-paint-v1';
 material.needsUpdate=true;
}

export function setWearBounds(mesh:THREE.Mesh){
 const g=mesh.geometry;g.computeBoundingBox();const half=g.boundingBox!.getSize(new THREE.Vector3()).multiplyScalar(.5),data=new Float32Array(g.attributes.position.count*3);
 for(let i=0;i<g.attributes.position.count;i++)data.set(half.toArray(),i*3);
 g.setAttribute('wearHalfSize',new THREE.BufferAttribute(data,3));
}
