import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import {
  CABINET_OCCUPIED, CABINET_PROPS, CABINET_TOP,
  DESK_OCCUPIED, DESK_PROPS, DESK_TOP,
  SHELF_OCCUPIED, SHELF_PROPS, SHELF_TOP,
  overlaps, propBox,
} from "../lib/room-prop-layout.ts";

/** Flat quads at the surface height, one per existing object footprint. */
function surfaceBVH(footprints, height) {
  const positions = [];
  for (const f of footprints) {
    const y = height + .001;
    const a = [f.x0, y, f.z0], b = [f.x1, y, f.z0], c = [f.x1, y, f.z1], d = [f.x0, y, f.z1];
    positions.push(...a, ...b, ...c, ...a, ...c, ...d);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return new MeshBVH(geometry);
}

const identity = new THREE.Matrix4();

function assertClear(name, bvh, placements, height, bounds) {
  for (const placement of placements) {
    const box = propBox(placement);
    const test3 = new THREE.Box3(
      new THREE.Vector3(box.x0, height, box.z0),
      new THREE.Vector3(box.x1, height + .30, box.z1),
    );
    assert.equal(bvh.intersectsBox(test3, identity), false, `${name} prop "${placement.id}" overlaps existing furniture`);
    assert.ok(box.x0 >= bounds.x0 && box.x1 <= bounds.x1 && box.z0 >= bounds.z0 && box.z1 <= bounds.z1,
      `${name} prop "${placement.id}" hangs off the surface`);
  }
}

test("desk props do not intersect the desk furniture", () => {
  assertClear("desk", surfaceBVH(DESK_OCCUPIED, DESK_TOP), DESK_PROPS, DESK_TOP,
    { x0: -4.275, x1: -2.725, z0: -1.35, z1: 2.45 });
});

test("cabinet props do not intersect the cabinet objects", () => {
  assertClear("cabinet", surfaceBVH(CABINET_OCCUPIED, CABINET_TOP), CABINET_PROPS, CABINET_TOP,
    { x0: 1.03, x1: 5.37, z0: -4.09, z1: -3.41 });
});

test("shelf props do not intersect the shelf-top objects", () => {
  assertClear("shelf", surfaceBVH(SHELF_OCCUPIED, SHELF_TOP), SHELF_PROPS, SHELF_TOP,
    { x0: -4.30, x1: .50, z0: -4.10, z1: -3.40 });
});

test("props do not overlap each other", () => {
  for (const [name, placements] of [["desk", DESK_PROPS], ["cabinet", CABINET_PROPS], ["shelf", SHELF_PROPS]]) {
    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        const a = propBox(placements[i]), b = propBox(placements[j]);
        assert.equal(overlaps(a, { ...b, name: placements[j].id }), false,
          `${name}: "${placements[i].id}" overlaps "${placements[j].id}"`);
      }
    }
  }
});
