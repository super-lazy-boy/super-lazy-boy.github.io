import type {Vec3} from './room-navigation';

export const COLLECTIBLE_IDS=['tardis','starry-night','monica-apartment','millennium-falcon','wish-willow','zaizen-lighter','anduril','elder-wand'] as const;
export type CollectibleId=typeof COLLECTIBLE_IDS[number];
export type NewCollectibleId=Exclude<CollectibleId,'tardis'|'starry-night'>;
export const COLLECTIBLE_NAMES:Record<CollectibleId,[string,string]>={
  tardis:['TARDIS · 神秘博士','TARDIS · Doctor Who'],
  'starry-night':['梵高 · 星空','Van Gogh · The Starry Night'],
  'monica-apartment':['老友记 · 莫妮卡的公寓','Friends · Monica’s Apartment'],
  'millennium-falcon':['乐高 · 千年隼','LEGO · Millennium Falcon'],
  'wish-willow':['痴迷 · 许愿柳','Obsession · One Wish Willow'],
  'zaizen-lighter':['白色巨塔 · 财前五郎的打火机','The White Tower · Zaizen’s Lighter'],
  anduril:['指环王 · 安督利尔','The Lord of the Rings · Andúril'],
  'elder-wand':['哈利波特 · 接骨木魔杖','Harry Potter · The Elder Wand']
};
/** Assets use metres. The established room has .45 m per scene unit. */
export const COLLECTIBLE_PLACEMENTS:Record<NewCollectibleId,{position:Vec3;yaw:number;scale:number;zone:'books'|'cinema'|'office'}>={
  'monica-apartment':{position:[-2.75,4.38,-3.75],yaw:Math.PI/2,scale:1/.45,zone:'books'},
  'millennium-falcon':{position:[.25,.761,3.57],yaw:Math.PI/2,scale:1/.45,zone:'cinema'},
  'wish-willow':{position:[4.85,1.455,-3.75],yaw:-.10,scale:1/.45,zone:'cinema'},
  'zaizen-lighter':{position:[-3.30,1.6907,.56],yaw:Math.PI/2+.18,scale:1/.45,zone:'office'},
  anduril:{position:[5.95,1.29,-4.1907],yaw:0,scale:1/.45,zone:'cinema'},
  'elder-wand':{position:[-.61,4.374,-3.4615],yaw:0,scale:1/.45,zone:'books'}
};
export const NEW_COLLECTIBLE_IDS=Object.keys(COLLECTIBLE_PLACEMENTS) as NewCollectibleId[];
export function isCollectibleId(value:string):value is CollectibleId{return (COLLECTIBLE_IDS as readonly string[]).includes(value);}
