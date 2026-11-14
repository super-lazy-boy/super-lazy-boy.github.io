import type {CollectibleId} from './collectibles';

/** Exported collectibles are grounded at Y=0 and centred on X/Z, in metres. */
export function inspectionTransform(dimensions:readonly number[]){
  const scale=3/Math.max(...dimensions);
  const size=dimensions.map(value=>value*scale);
  return {scale,size,offsetY:-size[1]/2,floorY:-size[1]/2-.005};
}

/** Fit every corner in perspective, allowing for both the viewing angle and aspect. */
export function inspectionFraming(item:CollectibleId,size:readonly number[],aspect:number,alternate=false){
  const azimuth=item==='anduril'?.16:item==='monica-apartment'?.32:item==='millennium-falcon'?.42:.34;
  const elevation=item==='anduril'?.08:item==='monica-apartment'?.84:item==='millennium-falcon'||item==='elder-wand'?.58:item==='zaizen-lighter'?.82:item==='wish-willow'?.48:.19;
  const a=alternate?0:azimuth,e=alternate?(item==='anduril'?0:Math.PI/2-.002):elevation;
  const direction=[Math.sin(a)*Math.cos(e),Math.sin(e),Math.cos(a)*Math.cos(e)];
  const right=[Math.cos(a),0,-Math.sin(a)],up=[-Math.sin(a)*Math.sin(e),Math.cos(e),-Math.cos(a)*Math.sin(e)];
  const tanY=Math.tan(38*Math.PI/360),tanX=tanY*Math.max(.1,aspect),margin=.83;
  const dot=(p:number[],q:number[])=>p.reduce((sum,value,i)=>sum+value*q[i],0);
  let distance=2.8;
  for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){
    const point=[x*size[0]/2,y*size[1]/2,z*size[2]/2];
    distance=Math.max(distance,dot(point,direction)+Math.max(Math.abs(dot(point,right))/(tanX*margin),Math.abs(dot(point,up))/(tanY*margin)));
  }
  return {position:direction.map(v=>v*distance) as [number,number,number],distance,maxDistance:Math.max(12,distance*2)};
}
