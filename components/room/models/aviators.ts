import * as THREE from "three";

// Original procedural study. The character-specific likeness is pending user review.
// Coordinates: front +Z, temple arms extend toward -Z, scale 1 unit ~= 100 mm.
export function createAviators() {
  const group=new THREE.Group();group.name="aviators-review-draft";
  const silver=new THREE.MeshStandardMaterial({color:"#9ca4aa",metalness:.68,roughness:.27});
  const dark=new THREE.MeshStandardMaterial({color:"#343639",roughness:.43});
  const rubber=new THREE.MeshStandardMaterial({color:"#292a2b",roughness:.67});
  const glass=new THREE.MeshPhysicalMaterial({color:"#86402d",roughness:.11,metalness:0,transparent:true,opacity:.78,transmission:.28,thickness:.012,ior:1.5,side:THREE.DoubleSide,depthWrite:false});
  const pad=new THREE.MeshPhysicalMaterial({color:"#ded9cb",roughness:.32,transparent:true,opacity:.65});
  const lensPoints=[[-.32,.14],[-.27,.24],[-.10,.285],[.13,.265],[.285,.17],[.285,-.02],[.17,-.215],[-.015,-.285],[-.20,-.21],[-.30,-.06]];
  function tube(name:string,points:THREE.Vector3[],r:number,mat:THREE.Material,closed=false){
    const curve=new THREE.CatmullRomCurve3(points,closed,"centripetal");
    const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,closed?100:42,r,8,closed),mat);
    mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
  }
  function block(name:string,size:[number,number,number],position:[number,number,number],mat:THREE.Material) {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),mat);mesh.position.set(...position);mesh.name=name;mesh.castShadow=true;group.add(mesh);return mesh;
  }
  for(const side of [-1,1]){
    const cx=side*.37;
    const points=lensPoints.map(([x,y])=>new THREE.Vector3(cx+x*side,y,.055*(1-(x/.34)**2)));
    tube("lens-rim-"+side,points,.010,silver,true);
    const shape=new THREE.Shape();
    const boundary=new THREE.CatmullRomCurve3(points,true,"centripetal").getPoints(120);
    boundary.forEach((p,i)=>i===0?shape.moveTo(p.x,p.y):shape.lineTo(p.x,p.y));shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.012,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:2,curveSegments:32});
    const positions=geometry.attributes.position;
    for(let i=0;i<positions.count;i++){
      const localX=(positions.getX(i)-cx)*side;
      positions.setZ(i,positions.getZ(i)+.055*(1-(localX/.34)**2)-.006);
    }
    geometry.computeVertexNormals();
    const lens=new THREE.Mesh(geometry,glass);lens.name="tinted-lens-"+side;lens.renderOrder=2;group.add(lens);
    block("hinge-"+side,[.043,.027,.075],[side*.685,.145,-.012],silver);
    tube("metal-temple-"+side,[new THREE.Vector3(side*.69,.15,-.025),new THREE.Vector3(side*.715,.16,-.28),new THREE.Vector3(side*.72,.15,-.65),new THREE.Vector3(side*.69,.105,-.91)],.012,silver);
    tube("ear-tip-"+side,[new THREE.Vector3(side*.69,.105,-.88),new THREE.Vector3(side*.67,.06,-1.04),new THREE.Vector3(side*.64,-.09,-1.13),new THREE.Vector3(side*.635,-.13,-1.12)],.022,rubber);
    tube("pad-wire-"+side,[new THREE.Vector3(side*.12,.09,.045),new THREE.Vector3(side*.10,.035,-.035),new THREE.Vector3(side*.105,-.035,-.075)],.006,silver);
    const nose=new THREE.Mesh(new THREE.SphereGeometry(1,20,14),pad);
    nose.name="nose-pad-"+side;nose.position.set(side*.105,-.04,-.075);nose.scale.set(.035,.065,.017);nose.rotation.z=-side*.25;group.add(nose);
    const screw=new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,.003,14),dark);screw.rotation.x=Math.PI/2;screw.position.set(side*.694,.145,.030);screw.name="hinge-screw-"+side;group.add(screw);
  }
  tube("upper-double-bridge",[new THREE.Vector3(-.14,.235,.05),new THREE.Vector3(0,.255,.075),new THREE.Vector3(.14,.235,.05)],.011,silver);
  tube("nose-bridge",[new THREE.Vector3(-.105,.095,.05),new THREE.Vector3(0,.145,.075),new THREE.Vector3(.105,.095,.05)],.009,silver);
  group.userData={status:"review-draft",label:"强尼银手墨镜 · 造型草稿",note:"待对照原作细节逐项审核，尚未加入房间。"};
  return group;
}

