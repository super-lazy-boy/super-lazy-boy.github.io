import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3} from 'three';
import {filmArchiveView} from '../lib/film-archive-view.ts';

test('the default film view keeps the complete cabinet clear of heading, search and pager at desktop and phone sizes',()=>{
  for(const [width,height] of [[2514,1174],[1920,938],[1366,626],[1024,626],[768,850],[700,600],[390,702],[360,480],[844,338]]){
    for(const x of [0,4.85,97]){
      const view=filmArchiveView(width,height,x),camera=new PerspectiveCamera(view.fov,width/height,.08,100);
      camera.position.fromArray(view.position);camera.lookAt(...view.target);camera.updateMatrixWorld();
      for(let i=0;i<8;i++){
        const {min,max}=view.bounds,p=new Vector3(i&1?max.x:min.x,i&2?max.y:min.y,i&4?max.z:min.z).project(camera),px=(p.x+1)*width/2,py=(1-p.y)*height/2;
        assert.ok(px>=view.safe.left-.01&&px<=view.safe.right+.01&&py>=view.safe.top-.01&&py<=view.safe.bottom+.01,`${width}×${height}, cabinet ${x}: corner ${i} outside usable view`);
      }
      assert.ok(view.maxDistance>view.position[2],'framing is inside the zoom control range');
    }
  }
});
