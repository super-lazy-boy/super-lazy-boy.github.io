#!/usr/bin/env node
// Rebuild content/public-records.json from exported room backups.
// Usage: node scripts/restore-public-records.mjs <movies-backup.json> <books-backup.json>
import { readFile, writeFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parsePublicRecords } from "../lib/public-records.ts";

const root = new URL("../", import.meta.url);
const mediaDir = new URL("public/media/", root);
const output = new URL("content/public-records.json", root);
const [moviesPath, booksPath] = process.argv.slice(2);
if (!moviesPath || !booksPath) {
  console.error("Usage: node scripts/restore-public-records.mjs <movies-backup.json> <books-backup.json>");
  process.exit(1);
}

const exists = async (url) => { try { await access(url); return true; } catch { return false; } };
const clean = (value, max) => String(value ?? "").trim().slice(0, max);

const toPublicAsset = async (url) => {
  const match = /^https:\/\/super-lazy-boy\.github\.io\/(media\/[A-Za-z0-9_./-]+)$/.exec(url || "");
  if (!match) return /^https:\/\//i.test(url || "") ? url : "";
  const relative = match[1];
  return (await exists(new URL(relative, new URL("public/", root)))) ? "./" + relative : url;
};

const map = async (record) => ({
  id: clean(record.id, 100),
  kind: record.kind,
  title: clean(record.title, 160),
  creator: clean(record.creator, 160),
  year: clean(record.year, 12),
  body: clean(record.body, 60000),
  date: /^\d{4}-\d{2}-\d{2}$/.test(record.date || "") ? record.date : "",
  color: /^#[a-fA-F0-9]{6}$/.test(record.color || "") ? record.color : "#80927c",
  visibility: "public",
  progress: ["planned", "in-progress", "finished"].includes(record.progress) ? record.progress : "finished",
  rating: Math.max(0, Math.min(5, Number(record.rating) || 0)),
  tags: clean(record.tags, 600),
  coverUrl: await toPublicAsset(record.coverUrl),
  modelUrl: "",
  trailerUrl: /^https:\/\//i.test(record.trailerUrl || "") ? record.trailerUrl : "",
  slot: Number.isInteger(record.slot) && record.slot >= 0 ? record.slot : -1,
  memorable: record.memorable === true,
  modelVisible: false,
  modelPlacement: "books-middle",
  modelScale: 0.65,
  modelRotation: 0,
});

const readBackup = async (path) => {
  const data = JSON.parse(await readFile(path, "utf8"));
  return (data.records || []).filter((record) => record.visibility === "public" && !record.archived);
};

const movies = await readBackup(moviesPath);
const books = await readBackup(booksPath);
const seen = new Set();
const records = [];
for (const record of [...books, ...movies]) {
  if (seen.has(record.id)) continue;
  seen.add(record.id);
  records.push(await map(record));
}
records.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "book" ? -1 : 1));

const document = { version: 1, records };
const validated = parsePublicRecords(document);
await writeFile(output, JSON.stringify(document, null, 2) + "\n", "utf8");
const counts = validated.reduce((acc, record) => ((acc[record.kind] = (acc[record.kind] || 0) + 1), acc), {});
console.log(`Restored ${validated.length} public records (${JSON.stringify(counts)}).`);
console.log("Local media covers: " + validated.filter((record) => record.coverUrl.startsWith("./media/")).length);