/**
 * Surface layout shared by the 3D props and the clearance test.
 * Every footprint is in world space (x/z) with the surface height in y.
 */
export type Footprint = { name: string; x0: number; x1: number; z0: number; z1: number };

export const DESK_TOP = 1.69;
export const CABINET_TOP = 1.45;
export const SHELF_TOP = 4.32;

/** Existing furniture already standing on the desk surface. */
export const DESK_OCCUPIED: Footprint[] = [
  { name: "mat", x0: -3.50, x1: -2.78, z0: -0.65, z1: 1.35 },
  { name: "keyboard", x0: -3.325, x1: -2.895, z0: 0.005, z1: 1.335 },
  { name: "mouse", x0: -3.27, x1: -2.93, z0: -0.56, z1: -0.34 },
  { name: "stand", x0: -3.665, x1: -3.275, z0: 0.23, z1: 0.87 },
  { name: "monitor", x0: -3.82, x1: -3.735, z0: -0.59, z1: 1.69 },
  { name: "speaker-left", x0: -3.755, x1: -3.445, z0: 1.945, z1: 2.255 },
  { name: "speaker-right", x0: -3.735, x1: -3.425, z0: -1.09, z1: -0.77 },
  { name: "lamp", x0: -4.22, x1: -3.82, z0: -1.20, z1: -0.80 },
  { name: "plant", x0: -4.12, x1: -3.94, z0: 2.04, z1: 2.22 },
  { name: "tray", x0: -3.19, x1: -2.85, z0: 1.675, z1: 2.125 },
  { name: "cup", x0: -3.12, x1: -2.98, z0: -1.06, z1: -0.92 },
];

/** Objects standing on the media cabinet top. */
export const CABINET_OCCUPIED: Footprint[] = [
  { name: "tardis", x0: 1.15, x1: 1.55, z0: -3.80, z1: -3.48 },
  { name: "keepsakes", x0: 1.75, x1: 1.97, z0: -3.75, z1: -3.55 },
  { name: "player", x0: 2.40, x1: 2.96, z0: -3.86, z1: -3.52 },
  { name: "drawer", x0: 3.44, x1: 4.00, z0: -3.86, z1: -3.52 },
  { name: "cassette", x0: 4.33, x1: 5.07, z0: -3.955, z1: -3.525 },
];

/** Objects standing on the bookshelf top. */
export const SHELF_OCCUPIED: Footprint[] = [
  { name: "shelf-plant", x0: -3.86, x1: -3.62, z0: -3.90, z1: -3.66 },
  { name: "shelf-boxes", x0: -0.68, x1: 0.06, z0: -3.95, z1: -3.55 },
];

export type PropPlacement = { id: string; x: number; z: number; footprint: [number, number]; rotation?: number };

/**
 * Only the free strip behind the monitor is wide enough for props; everything
 * closer to the front edge is taken by the keyboard, mouse, tray and speakers.
 */
export const DESK_PROPS: PropPlacement[] = [
  { id: "notebook", x: -4.02, z: -0.22, footprint: [0.30, 0.40], rotation: 0.22 },
  { id: "pencup", x: -4.05, z: 0.32, footprint: [0.14, 0.14] },
  { id: "paper-a", x: -4.04, z: 0.70, footprint: [0.30, 0.42], rotation: 0.28 },
  { id: "paper-b", x: -4.02, z: 1.18, footprint: [0.30, 0.42], rotation: -0.42 },
  { id: "mug", x: -4.00, z: 1.62, footprint: [0.16, 0.16] },
  { id: "stack", x: -4.02, z: 1.92, footprint: [0.28, 0.20], rotation: 0.12 },
];

/** The cabinet top is fully occupied in front; the note sits in the back strip. */
export const CABINET_PROPS: PropPlacement[] = [
  { id: "remote", x: 2.10, z: -3.98, footprint: [0.19, 0.06], rotation: -0.22 },
  { id: "note", x: 3.18, z: -3.97, footprint: [0.14, 0.14], rotation: -0.3 },
];

export const SHELF_PROPS: PropPlacement[] = [
  { id: "frame-a", x: -3.35, z: -3.82, footprint: [0.17, 0.12], rotation: 0.16 },
  { id: "frame-b", x: -3.10, z: -3.82, footprint: [0.17, 0.12], rotation: -0.10 },
  { id: "frame-c", x: -2.86, z: -3.82, footprint: [0.17, 0.12], rotation: 0.22 },
  { id: "box", x: -0.95, z: -3.80, footprint: [0.30, 0.22], rotation: -0.08 },
  { id: "shelf-mug", x: 0.38, z: -3.78, footprint: [0.16, 0.16] },
];

export function overlaps(a: { x0: number; x1: number; z0: number; z1: number }, b: Footprint) {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
}

export function propBox(placement: PropPlacement) {
  const [w, d] = placement.footprint;
  return { x0: placement.x - w / 2, x1: placement.x + w / 2, z0: placement.z - d / 2, z1: placement.z + d / 2 };
}
