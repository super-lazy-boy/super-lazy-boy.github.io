type Vec3=[number,number,number];

// Cabinet-local coordinates. Keep tall keepsakes below the screen's bottom bar.
export const CINEMA_LAYOUT={
 origin:[3.20,0,-3.75] as Vec3,
 tabletopY:1.45,
 tardis:{position:[-1.85,1.45,.11] as Vec3,height:.40,yaw:Math.PI/12},
 tapePlayerX:-.52,
 drawerX:.52,
 keepsakes:[
  [-1.34,1.5175,.11],[-1.33,1.645,.10],[-1.34,1.7725,.10],
  [1.53,.10,.67],[1.57,.22,.64],[1.12,.085,1.04],
 ] as Vec3[],
 keepsakeYaws:[-.12,.04,.16,-.24,-.15,.23],
};
