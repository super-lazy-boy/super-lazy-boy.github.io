export type ModelPhase='idle'|'downloading'|'decoding'|'ready'|'error';
export type ModelProgress={phase:ModelPhase;loaded:number;total:number;error:Error|null};
export type ModelLoadContext={signal:AbortSignal;attempt:number;download:(loaded:number,total:number)=>void;decoding:()=>void};
const IDLE:ModelProgress={phase:'idle',loaded:0,total:0,error:null};

/** One stable Suspense promise per versioned URL, including retries and timeouts. */
export class ModelResourceCache<T>{
  private entries=new Map<string,{progress:ModelProgress;promise:Promise<T>;value?:T}>();
  private listeners=new Set<()=>void>();
  private attempts=new Map<string,number>();
  private load:(url:string,context:ModelLoadContext)=>Promise<T>;
  private stallMs:number;
  constructor(load:(url:string,context:ModelLoadContext)=>Promise<T>,stallMs=45000){this.load=load;this.stallMs=stallMs;}
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  snapshot=(url:string)=>this.entries.get(url)?.progress??IDLE;
  private emit(){for(const listener of this.listeners)listener();}
  private start(url:string){
    const existing=this.entries.get(url);if(existing)return existing;
    const entry:{progress:ModelProgress;promise:Promise<T>;value?:T}={progress:{...IDLE,phase:'downloading'},promise:null!};
    this.entries.set(url,entry);
    const controller=new AbortController();let timer:ReturnType<typeof setTimeout>,settled=false;
    const attempt=this.attempts.get(url)??0;this.attempts.set(url,attempt+1);
    entry.promise=new Promise<T>((resolve,reject)=>{
      const fail=(reason:unknown)=>{
        if(settled)return;settled=true;clearTimeout(timer);controller.abort();
        const error=reason instanceof Error?reason:new Error(String(reason));
        entry.progress={...entry.progress,phase:'error',error};this.emit();reject(error);
      };
      const arm=()=>{clearTimeout(timer);timer=setTimeout(()=>fail(new Error('Model loading timed out: '+url)),this.stallMs);};
      const update=(patch:Partial<ModelProgress>)=>{if(!settled){entry.progress={...entry.progress,...patch};this.emit();}};
      // Start outside React rendering; status subscribers must never be updated by another render.
      Promise.resolve().then(async()=>{
        arm();this.emit();
        try{
          const value=await this.load(url,{signal:controller.signal,attempt,
            download:(loaded,total)=>{if(settled)return;if(loaded>entry.progress.loaded)arm();update({phase:'downloading',loaded:Math.max(loaded,entry.progress.loaded),total});},
            decoding:()=>{if(!settled){arm();update({phase:'decoding'});}}});
          if(settled)return;settled=true;clearTimeout(timer);entry.value=value;
          entry.progress={...entry.progress,phase:'ready',error:null};this.emit();resolve(value);
        }catch(error){fail(error);}
      });
    });
    // Preloading may have no mounted Suspense reader yet. Failures remain in the cache for the boundary.
    void entry.promise.catch(()=>{});return entry;
  }
  preload=(url:string)=>this.start(url).promise;
  read(url:string):T{
    const entry=this.start(url);
    if(entry.progress.phase==='error')throw entry.progress.error;
    if(entry.progress.phase!=='ready')throw entry.promise;
    return entry.value!;
  }
  retryFailures(){for(const [url,entry] of this.entries)if(entry.progress.phase==='error')this.entries.delete(url);this.emit();}
}

/** Download percentage never claims the decoded scene has already been drawn. */
export function roomLoadingPercent(progress:ModelProgress){
  if(progress.phase==='ready')return 96;
  if(progress.phase==='decoding')return 92;
  return progress.total>0?Math.min(90,Math.floor(progress.loaded/progress.total*90)):null;
}

function validGLB(bytes:ArrayBuffer){
  if(bytes.byteLength<12)throw new Error('Incomplete GLB response');
  const header=new DataView(bytes);
  if(header.getUint32(0,true)!==0x46546c67||header.getUint32(4,true)!==2||header.getUint32(8,true)!==bytes.byteLength)throw new Error('Invalid or incomplete GLB response');
  return bytes;
}
export async function downloadModel(response:Response,context:ModelLoadContext,expectedBytes=0){
  if(!response.ok)throw new Error('Model request failed: '+response.status);
  const type=response.headers.get('content-type')||'';
  if(type.includes('text/html'))throw new Error('Model URL returned an HTML page');
  const total=expectedBytes||Number(response.headers.get('content-length'))||0;
  if(!response.body){const bytes=await response.arrayBuffer();context.download(bytes.byteLength,total);return validGLB(bytes);}
  const reader=response.body.getReader(),chunks:Uint8Array[]=[];let loaded=0;
  try{
    while(true){
      if(context.signal.aborted)throw context.signal.reason;
      const {value,done}=await reader.read();if(done)break;
      chunks.push(value);loaded+=value.byteLength;context.download(loaded,total);
    }
  }catch(error){void reader.cancel(error).catch(()=>{});throw error;}finally{reader.releaseLock();}
  const bytes=new Uint8Array(loaded);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return validGLB(bytes.buffer);
}
