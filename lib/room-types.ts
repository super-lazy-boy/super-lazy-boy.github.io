export const KINDS = ["book", "movie", "game", "research", "idea", "knowledge"] as const;
export type RecordKind = typeof KINDS[number];
export type RoomRecord = {
  id: string; kind: RecordKind; title: string; creator: string; year: string; body: string;
  color: string; date: string; visibility: "private" | "public"; progress: string;
  rating: number; tags: string; coverKey: string; coverUrl: string; trailerUrl: string;
  slot: number; memorable: boolean; memorialNote: string; modelKey: string;
  modelPlacement: string; modelScale: number; modelRotation: number; modelVisible: boolean;
  archived: boolean; createdAt: string; updatedAt: string; modelUrl?: string; resolvedCoverUrl?: string;
};
export type Zone = "overview" | "office" | "books" | "cinema" | "guestbook";
export const KIND_LABELS: Record<RecordKind, string> = {
  book: "阅读", movie: "电影", game: "游戏", research: "研究工作", idea: "研究想法", knowledge: "很多知识"
};
export function assetUrl(key: string) { return "/api/assets/" + key.split("/").map(encodeURIComponent).join("/"); }
export function recordCover(record: RoomRecord) { return record.resolvedCoverUrl || (record.coverKey ? assetUrl(record.coverKey) : record.coverUrl); }
export function safeTrailerId(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "");
    const id = host === "youtu.be" ? url.pathname.slice(1) : host === "youtube.com" ? url.searchParams.get("v") || url.pathname.split("/").pop() : "";
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

