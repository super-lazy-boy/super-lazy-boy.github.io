import * as THREE from 'three';
const S=1024;
function noise(x:number,y:number,seed:number){const n=Math.sin(x*127.1+y*311.7+seed*13.4)*43758.5453;return n-Math.floor(n);}
function data(bytes:Uint8Array,color=false){const t=new THREE.DataTexture(bytes,S,S,THREE.RGBAFormat);t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t;}
const evidenceLoader=new THREE.TextureLoader();
function evidenceMap(file:string,onLoaded?:()=>void){const t=evidenceLoader.load('./media/models/tardis/wood_'+file+'.png',onLoaded);t.colorSpace=THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t;}
export function woodMaterial(dark=false,onLoaded?:()=>void){
 const albedo=new Uint8Array(S*S*4),rough=new Uint8Array(S*S*4),normal=new Uint8Array(S*S*4),ao=new Uint8Array(S*S*4);
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){
  const u=x/S,v=y/S,i=(y*S+x)*4,n=noise(x,y,2005),phase=u*740+2*Math.sin(v*7)+Math.sin(u*40+v*10),grain=Math.pow((Math.sin(phase)+1)/2,10),broad=Math.sin(u*14+v*2)*Math.cos(v*12)*.013;
  const c=Math.round(243+broad*255+(n-.5)*6-grain*12);albedo.set([c,c,c,255],i);
  const r=184+Math.sin(u*31+v*7)*9+(noise(x,y,91)-.5)*20;rough.set([r,r,r,255],i);
  const nx=Math.cos(phase)*grain*.33+(noise(x,y,17)-.5)*.024,ny=Math.sin(v*61)*.012;
  normal.set([128+nx*127,128+ny*127,254,255],i);ao.set([253,253,253,255],i);
 }
 const m=new THREE.MeshPhysicalMaterial({color:dark?'#1a3148':'#1c3752',map:data(albedo,true),roughnessMap:evidenceMap('roughness_stabilized',onLoaded),normalMap:data(normal),normalScale:new THREE.Vector2(.35,.35),bumpMap:evidenceMap('height',onLoaded),bumpScale:.000025,aoMap:data(ao),roughness:1,metalness:0,clearcoat:.07,clearcoatRoughness:.65,envMapIntensity:.6});m.name=dark?'深蓝旧漆 · 凹面':'深蓝旧漆 · 木制框架';return m;
}
export function frostedMaterial(beacon=false){
 const normal=new Uint8Array(S*S*4),rough=new Uint8Array(S*S*4);
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=(y*S+x)*4,n=noise(x,y,62),b=noise(x,y,41);normal.set([128+(n-.5)*24,128+(b-.5)*24,254,255],i);const r=160+noise(x,y,87)*30;rough.set([r,r,r,255],i);}
 const m=new THREE.MeshPhysicalMaterial({color:beacon?'#a7afa2':'#7b8588',roughness:.72,roughnessMap:data(rough),normalMap:data(normal),normalScale:new THREE.Vector2(.17,.17),metalness:0,transmission:0,ior:1.45,clearcoat:.06,clearcoatRoughness:.6,emissive:beacon?'#e8d3a0':'#d6d8c9',emissiveIntensity:beacon?.09:.008,envMapIntensity:.3});m.name=beacon?'顶灯 · 旧玻璃':'六格窗 · 磨砂玻璃';return m;
}
function canvas(w:number,h:number){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function texture(c:HTMLCanvasElement){const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;}
export function topSignMaterial(){
 const c=canvas(1024,128),ctx=c.getContext('2d')!;ctx.fillStyle='#101c22';ctx.fillRect(0,0,1024,128);ctx.fillStyle='#d6d4bd';ctx.textBaseline='middle';ctx.font='76px Arial';ctx.fillText('POLICE',38,67);ctx.fillText('BOX',770,67);ctx.textAlign='center';ctx.font='33px Arial';ctx.fillText('PUBLIC',585,42);ctx.fillText('CALL',585,84);
 const map=texture(c),m=new THREE.MeshPhysicalMaterial({map,roughness:.38,metalness:0,clearcoat:.12,clearcoatRoughness:.5,emissive:'#c1b68f',emissiveMap:map,emissiveIntensity:.015});m.name='POLICE PUBLIC CALL BOX · 顶牌';return m;
}
export function telephoneMaterial(){
 const c=canvas(512,576),ctx=c.getContext('2d')!;ctx.fillStyle='#c6c5b4';ctx.fillRect(0,0,512,576);
 for(let i=0;i<3000;i++){const x=noise(i,2,15)*512,y=noise(i,5,21)*576;ctx.fillStyle=`rgba(68,69,54,${.015+noise(i,3,9)*.025})`;ctx.fillRect(x,y,1+noise(i,9,15)*3,2);}
 ctx.strokeStyle='#aaa999';ctx.lineWidth=8;ctx.strokeRect(5,5,502,566);ctx.fillStyle='#0d1013';ctx.textAlign='center';ctx.textBaseline='middle';
 const lines:[string,number,number,string][]=[['POLICE TELEPHONE',25,37,'Times New Roman'],['FREE',60,110,'Times New Roman'],['FOR USE OF',31,175,'Times New Roman'],['PUBLIC',49,230,'Times New Roman'],['ADVICE & ASSISTANCE',24,303,'Arial'],['OBTAINABLE IMMEDIATELY',22,337,'Arial'],['OFFICER & CARS',23,391,'Arial'],['RESPOND TO ALL CALLS',23,425,'Arial'],['PULL TO OPEN',43,513,'Arial']];for(const [t,size,y,font]of lines){ctx.font=`${size}px "${font}"`;ctx.fillText(t,256,y,474);}
 const m=new THREE.MeshPhysicalMaterial({map:texture(c),roughness:.74,metalness:.05,clearcoat:.03});m.name='电话门牌 · 旧搪瓷';return m;
}
export function bronzeMaterial(){const m=new THREE.MeshPhysicalMaterial({color:'#777361',roughness:.36,metalness:.78,envMapIntensity:.75});m.name='把手与门锁 · 旧金属';return m;}
