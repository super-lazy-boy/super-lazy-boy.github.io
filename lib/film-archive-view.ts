import {Box3,PerspectiveCamera,Vector3} from 'three';

/** Fit the entire cabinet inside the space between the heading/search and pager. */
export function filmArchiveView(width:number,height:number,x=0){
  const w=Math.max(1,width),h=Math.max(1,height),mobile=w<=700;
  const safe={left:Math.min(32,w*.06),right:w-Math.min(32,w*.06),top:Math.min(mobile?206:146,h*.35),bottom:h-Math.min(mobile?124:134,h*.26)};
  const fov=38,tan=Math.tan(fov*Math.PI/360),camera=new PerspectiveCamera(fov,w/h,.08,100);
  const bounds=new Box3(new Vector3(x-2.21,0,-.36),new Vector3(x+2.21,2.02,.36));
  const corners=[0,1,2,3,4,5,6,7].map(i=>new Vector3(i&1?bounds.max.x:bounds.min.x,i&2?bounds.max.y:bounds.min.y,i&4?bounds.max.z:bounds.min.z));
  let distance=4.7,targetY=1.01;
  for(let attempt=0;attempt<100;attempt++){
    targetY=1.01+(safe.top-(h-safe.bottom))/h*distance*tan;
    camera.position.set(x+.1,targetY+.18,distance);camera.lookAt(x,targetY,0);camera.updateMatrixWorld();
    const fits=corners.every(corner=>{const p=corner.clone().project(camera),px=(p.x+1)*w/2,py=(1-p.y)*h/2;return px>=safe.left&&px<=safe.right&&py>=safe.top&&py<=safe.bottom;});
    if(fits)break;
    distance*=1.04;
  }
  return {fov,position:camera.position.toArray() as [number,number,number],target:[x,targetY,0] as [number,number,number],maxDistance:Math.max(18,distance*1.6),safe,bounds};
}
