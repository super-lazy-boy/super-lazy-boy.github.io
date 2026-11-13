export const ROOM_BACKGROUNDS={day:'#ffffff',night:'#030405'} as const;
export const roomBackground=(night:boolean)=>night?ROOM_BACKGROUNDS.night:ROOM_BACKGROUNDS.day;
