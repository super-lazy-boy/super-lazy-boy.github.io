import type {Vec3} from './room-navigation';
export const LIGHT_ANCHORS={
  desk:{position:[-3.915,2.31,1.04] as Vec3,target:[-3.35,1.70,-.30] as Vec3},
  floor:{position:[5.30,3.23,1.90] as Vec3,target:[3.0,.55,.85] as Vec3},
  picture:{position:[-6.04,4.22,-3.30] as Vec3,target:[-6.335,3.50,-3.30] as Vec3},
  projector:{position:[5.58,2.535,2.805] as Vec3,target:[3.2,3.05,-3.855] as Vec3},
  shelves:[[-1.9,.90,-3.40],[-1.9,2.54,-3.40],[-1.9,4.18,-3.40]] as Vec3[]
};
export function lightProfile(night:boolean,screening:boolean,lamps={desk:true,floor:true}){
  return {
    ambient:night?.035:.18,hemisphere:night?.12:.85,sun:night?0:screening?2.1:3.4,fill:night?.07:.55,environment:night?.12:.45,
    desk:night&&lamps.desk?(screening?.30:2.2):0,
    floor:night&&lamps.floor?(screening?1.5:8):0,
    picture:night?(screening?.15:1.25):.03,
    shelf:night?(screening?.035:.18):0,
    projector:screening?(night?3:1.5):0,
    beam:screening?(night?.07:.025):0
  };
}
