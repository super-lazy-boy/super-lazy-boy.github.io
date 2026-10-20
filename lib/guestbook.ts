export const NOTE_COLORS={paper:'#f4e6b9',sage:'#dce5ce',blush:'#efdcd4',lavender:'#e2dfed'} as const;
export type NoteColor=keyof typeof NOTE_COLORS;
export type GuestNote={id:string;body:string;color:NoteColor;authorName:string;createdAt:string;updatedAt:string;mine:boolean;canEdit:boolean};
export type NoteCursor={before:string;id:string};
export type GuestbookData={enabled:boolean;owner:boolean;signedIn:boolean;notes:GuestNote[];hasMore:boolean;nextCursor:NoteCursor|null};
export function noteCount(body:string){return Array.from(body.trim()).length;}

