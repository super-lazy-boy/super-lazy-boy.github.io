import type {Vec3} from './room-navigation';

export const COLLECTIBLE_IDS=['tardis','starry-night','monica-apartment','millennium-falcon','wish-willow'] as const;
export type CollectibleId=typeof COLLECTIBLE_IDS[number];
export type NewCollectibleId=Exclude<CollectibleId,'tardis'|'starry-night'>;
export const COLLECTIBLE_NAMES:Record<CollectibleId,[string,string]>={
  tardis:['TARDIS · 神秘博士','TARDIS · Doctor Who'],
  'starry-night':['梵高 · 星空','Van Gogh · The Starry Night'],
  'monica-apartment':['老友记 · 莫妮卡的公寓','Friends · Monica’s Apartment'],
  'millennium-falcon':['乐高 · 千年隼','LEGO · Millennium Falcon'],
  'wish-willow':['痴迷 · 许愿柳','Obsession · One Wish Willow']
};
/** Assets use metres. The established room has .45 m per scene unit. */
export const COLLECTIBLE_PLACEMENTS:Record<NewCollectibleId,{position:Vec3;yaw:number;scale:number;zone:'books'|'cinema'}>={
  'monica-apartment':{position:[-2.75,4.38,-3.75],yaw:0,scale:1/.45,zone:'books'},
  'millennium-falcon':{position:[.25,.761,3.57],yaw:Math.PI/2,scale:1/.45,zone:'cinema'},
  'wish-willow':{position:[4.85,1.455,-3.75],yaw:-.10,scale:1/.45,zone:'cinema'}
};
export const NEW_COLLECTIBLE_IDS=Object.keys(COLLECTIBLE_PLACEMENTS) as NewCollectibleId[];
export function isCollectibleId(value:string):value is CollectibleId{return (COLLECTIBLE_IDS as readonly string[]).includes(value);}
