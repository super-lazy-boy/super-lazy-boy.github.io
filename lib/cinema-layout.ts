type Vec3=[number,number,number];

// Cabinet-local coordinates. Keep tall keepsakes below the screen's bottom bar.
export const CINEMA_LAYOUT={
 origin:[3.20,0,-3.75] as Vec3,
 tabletopY:1.45,
 tardis:{position:[-1.85,1.45,.11] as Vec3,height:.40,yaw:Math.PI/12},
 tapePlayerX:-.52,
 drawerX:.52,
 keepsakes:[
  [-1.34,1.520,.11],[-1.33,1.6525,.10],[-1.34,1.785,.10],
  [2.30,.069,1.80],[2.33,.2015,1.80],[2.30,.334,1.80],
 ] as Vec3[],
 keepsakeYaws:[-.12,.04,.16,-.24,-.15,.23],
};
