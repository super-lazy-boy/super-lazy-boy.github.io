import type { RecordKind } from "./room-types";

export type RecordEntry = "book" | "movie" | "computer" | "manager";

export function recordEntry(kind: RecordKind): RecordEntry {
  if (kind === "book" || kind === "movie") return kind;
  return kind === "game" ? "manager" : "computer";
}

export function entryAllows(entry: RecordEntry, kind: RecordKind): boolean {
  return entry === "manager" || (entry === "computer"
    ? ["research", "idea", "knowledge"].includes(kind)
    : entry === kind);
}

export function editorKinds(kind: RecordKind | undefined, existing = false): RecordKind[] {
  if (existing || kind === "book" || kind === "movie" || kind === "game") return [kind || "book"];
  return ["research", "idea", "knowledge"];
}
