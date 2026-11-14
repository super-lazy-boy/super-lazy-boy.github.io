import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {inspectionTransform,inspectionFraming} from '../lib/collectible-inspection.ts';

const versions=JSON.parse(await readFile('public/collectibles-version.json','utf8'));
const cases=['anduril','wish-willow'].flatMap(id=>[[1000,540],[375,540]].map(([w,h])=>{
  const dimensions=versions[id].dimensions,{scale,size}=inspectionTransform(dimensions);
  const framing=inspectionFraming(id,size,w/h);
  return {id,viewport:[w,h],fov:38,camera:framing.position.map((v,i)=>v/scale+(i===1?dimensions[1]/2:0)),target:[0,dimensions[1]/2,0]};
}));
await mkdir('work/qa',{recursive:true});
await writeFile('work/qa/inspection-framing.json',JSON.stringify(cases,null,2)+'\n');
console.log('Exported '+cases.length+' native inspection camera views.');
