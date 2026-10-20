/** One-way opening, with a short hold before entering the cabinet. */
export const DRAWER_DURATION_MS=1120;
export function memoryDrawerPose(elapsedMs:number,reduced=false){
 const progress=reduced?1:Math.min(1,Math.max(0,elapsedMs/DRAWER_DURATION_MS));
 const travel=Math.min(1,progress/.8);
 const eased=1-(1-travel)**3;
 return {extension:eased*.43,complete:progress>=1};
}
