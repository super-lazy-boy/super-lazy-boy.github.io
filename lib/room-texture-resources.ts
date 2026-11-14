import {TextureLoader} from 'three';
import {ModelResourceCache} from './model-resource-cache';
import {useModelPhase} from './model-resource-hooks';

export const TARDIS_TEXTURE_URLS={
  roughness:'./media/models/tardis/wood_roughness_stabilized.png',
  height:'./media/models/tardis/wood_height.png'
} as const;
// Cache the decoded images, then clone texture objects for each room/inspector instance.
// TextureLoader preserves the existing image orientation and colour handling.
export const roomTextures=new ModelResourceCache(async(url,context)=>{
  const texture=await new TextureLoader().loadAsync(url);
  if(context.signal.aborted){texture.dispose();throw context.signal.reason;}
  return texture;
});
export function readTardisTextures(){
  return {roughness:roomTextures.read(TARDIS_TEXTURE_URLS.roughness),height:roomTextures.read(TARDIS_TEXTURE_URLS.height)};
}
export function useTardisTexturePhase(){
  const roughness=useModelPhase(roomTextures,TARDIS_TEXTURE_URLS.roughness),height=useModelPhase(roomTextures,TARDIS_TEXTURE_URLS.height);
  return roughness==='ready'&&height==='ready'?'ready':roughness==='error'||height==='error'?'error':'loading';
}
