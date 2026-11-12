import type {Vec3} from './room-navigation';
export const LIGHT_ANCHORS={
  desk:{position:[-3.915,2.31,1.04] as Vec3,target:[-3.35,1.70,-.30] as Vec3},
  floor:{position:[5.30,3.23,1.90] as Vec3,target:[3.0,.55,.85] as Vec3},
  picture:{position:[-6.04,4.22,-3.30] as Vec3,target:[-6.335,3.50,-3.30] as Vec3},
  projector:{position:[5.58,2.535,2.805] as Vec3,target:[3.2,3.05,-3.855] as Vec3},
  guest:{position:[-6.09,2.92,4.15] as Vec3,target:[-5.40,1.35,3.7] as Vec3},
  console:{position:[-3.25,1.61,3.72] as Vec3,target:[-2.70,.55,3.6] as Vec3},
  media:[[2.15,1.288,-3.39],[4.25,1.288,-3.39]] as Vec3[],
  shelves:[[-1.9,.90,-3.40],[-1.9,2.54,-3.40],[-1.9,4.18,-3.40]] as Vec3[]
};
export function lightProfile(night:boolean,screening:boolean,lamps={desk:true,floor:true}){
  return {
    ambient:night?.022:.10,hemisphere:night?.085:.60,sun:night?0:screening?1.8:2.75,fill:night?.025:.38,environment:night?.065:.32,
    desk:night&&lamps.desk?(screening?.5:3.4):0,
    floor:night&&lamps.floor?(screening?1.8:10.5):0,
    picture:night?(screening?.25:2):.03,
    guest:night?(screening?.7:3.8):0,
    console:night?(screening?.35:2.1):0,
    shelf:night?(screening?.025:.12):0,
    media:night?(screening?.02:.12):0,
    projector:screening?(night?3:1.5):0,
    beam:screening?(night?.07:.025):0
  };
}
