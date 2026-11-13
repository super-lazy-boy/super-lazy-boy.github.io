/** Keep the final hardware event in each display frame; clicks and exits can cancel it. */
export class LatestFrameTask<T> {
  private handle:number|null=null;
  private value:T|null=null;
  private run:(value:T)=>void;private request:(callback:FrameRequestCallback)=>number;private cancelFrame:(handle:number)=>void;
  constructor(run:(value:T)=>void,request:(callback:FrameRequestCallback)=>number=callback=>requestAnimationFrame(callback),cancelFrame:(handle:number)=>void=handle=>cancelAnimationFrame(handle)){this.run=run;this.request=request;this.cancelFrame=cancelFrame;}
  push(value:T){
    this.value=value;if(this.handle!==null)return;
    this.handle=this.request(()=>{const latest=this.value;this.handle=null;this.value=null;if(latest!==null)this.run(latest);});
  }
  cancel(){if(this.handle!==null)this.cancelFrame(this.handle);this.handle=null;this.value=null;}
}
