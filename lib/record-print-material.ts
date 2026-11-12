import * as THREE from 'three';

/** Printed paper reflects the room's lights. It has no unlit/emissive overlay. */
export function recordPrintMaterial(map:THREE.Texture|null,color='#ffffff'){
  const material=new THREE.MeshStandardMaterial({map,color,roughness:.82,metalness:0,envMapIntensity:.30});
  material.name='Printed paper';return material;
}
