import * as THREE from "three";

const smooth=(a:number,b:number,v:number)=>{const p=THREE.MathUtils.clamp((v-a)/(b-a),0,1);return p*p*(3-2*p);};
const signed=(v:number,p:number)=>Math.sign(v)*Math.pow(Math.abs(v),p);
export function loungeRim(angle:number){
  const back=smooth(-.35,.65,Math.cos(angle));
  return .37+.72*back+.15*Math.pow(Math.abs(Math.sin(angle)),4);
}
export function loungeTop(r:number,angle:number):[number,number,number]{
  const x=.94*signed(Math.sin(angle),.74)*r,z=.88*signed(Math.cos(angle),.76)*r;
  const edge=smooth(.50,1,r),seat=.29+.065*r*r;
  const crease=Math.sin(angle*13+r*9)*.009*edge*Math.sin(r*Math.PI);
  return [x,THREE.MathUtils.lerp(seat,loungeRim(angle),edge)+crease,z];
}
export function loungeSide(t:number,angle:number):[number,number,number]{
  const radius=1+.085*Math.sin(t*Math.PI)-.13*t*t;
  const fold=.012*Math.sin(angle*15+t*5)*Math.sin(t*Math.PI);
  return [.94*signed(Math.sin(angle),.74)*(radius+fold),THREE.MathUtils.lerp(loungeRim(angle),.045,t),.88*signed(Math.cos(angle),.76)*(radius+fold)];
}
function surface(rows:number,columns:number,point:(r:number,a:number)=>[number,number,number]){
  const positions:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let row=0;row<=rows;row++)for(let col=0;col<=columns;col++){
    positions.push(...point(row/rows,col/columns*Math.PI*2));uv.push(col/columns*2,row/rows);
    if(row<rows&&col<columns){const a=row*(columns+1)+col,b=a+columns+1;indices.push(a,b,b+1,a,b+1,a+1);}
  }
  const result=new THREE.BufferGeometry();result.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));result.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));result.setIndex(indices);result.computeVertexNormals();return result;
}
export function createLounge(){return {top:surface(32,96,loungeTop),side:surface(24,96,loungeSide)};}
