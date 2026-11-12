import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { bookPose, tapePose, BOOK_CLEAR, TAPE_CLEAR, PLAYER_Y } from "../lib/record-motion-paths.ts";

const SHELF_FRONT = -3.40;   // bookcase side panel front face
const CABINET_FRONT = -3.425; // cinema cabinet side panel front face
const CABINET_TOP = 1.45;
const BOOK_DEPTH = .40;
const TAPE_DEPTH = .31;

const angle = (a, b) => a.angleTo(b);

const bookOrigin = (row, x, height) => ({
  position: new THREE.Vector3(x, .20 + row * .82, -3.72),
  quaternion: new THREE.Quaternion(),
  scale: new THREE.Vector3(1, 1, 1),
  height,
});

test("book never rotates while any part is still inside the shelf", () => {
  for (const row of [0, 1, 2, 3, 4]) {
    for (const x of [-3.9, -3.2, -2.4, -1.4, -.2]) {
      const origin = bookOrigin(row, x, .60);
      for (let i = 0; i <= 100; i++) {
        const t = i / 100;
        const pose = bookPose(origin, t);
        const front = pose.position.z + BOOK_DEPTH / 2;
        if (front < SHELF_FRONT + .01) {
          assert.ok(angle(pose.quaternion, origin.quaternion) < 1e-6,
            "rotated inside the shelf at t=" + t + " row=" + row + " front=" + front.toFixed(3));
        }
      }
    }
  }
});

test("book clears the shelf before it starts turning", () => {
  const origin = bookOrigin(2, -2.4, .60);
  const turnStart = (() => {
    for (let i = 0; i <= 200; i++) {
      const t = i / 200;
      if (angle(bookPose(origin, t).quaternion, origin.quaternion) > 1e-4) return t;
    }
    return 1;
  })();
  const pose = bookPose(origin, turnStart);
  const back = pose.position.z - BOOK_DEPTH / 2;
  assert.ok(back > SHELF_FRONT, "book starts turning while still inside the shelf: back=" + back.toFixed(3));
  assert.ok(pose.position.z - origin.position.z >= BOOK_CLEAR * .9, "pull-out distance too short");
});

test("book stays below the shelf plank above it while it is still inside", () => {
  for (const row of [0, 1, 2, 3, 4]) {
    const plankAbove = .15 + (row + 1) * .82 - .0375;
    const height = .55 + 8 * .016;
    const origin = bookOrigin(row, -2.4, height);
    for (let i = 0; i <= 100; i++) {
      const pose = bookPose(origin, i / 100);
      const front = pose.position.z + BOOK_DEPTH / 2;
      if (front < SHELF_FRONT) {
        assert.ok(pose.position.y + height <= plankAbove + 1e-6,
          "book clips the plank above at row " + row + " y=" + (pose.position.y + height).toFixed(3));
      }
    }
  }
});

test("tape leaves the cabinet before it turns or lifts", () => {
  const origin = {
    position: new THREE.Vector3(2.2, .39, -3.73),
    quaternion: new THREE.Quaternion(),
    scale: new THREE.Vector3(1, 1, 1),
  };
  // extraction only: the final insertion is supposed to re-enter the player
  for (let i = 0; i <= 22; i++) {
    const t = i / 100;
    const pose = tapePose(origin, t);
    const front = pose.position.z + TAPE_DEPTH / 2;
    if (front < CABINET_FRONT + .01) {
      assert.ok(angle(pose.quaternion, origin.quaternion) < 1e-6,
        "tape rotated inside the cabinet at t=" + t);
      assert.ok(pose.position.y <= origin.position.y + .01, "tape lifted inside the cabinet at t=" + t);
    }
  }
  const mid = tapePose(origin, .5);
  assert.ok(mid.position.y > CABINET_TOP + .1, "tape should clear the cabinet lip while crossing");
  assert.ok(mid.position.z > CABINET_FRONT, "tape should be in front of the cabinet while crossing");
  assert.ok(TAPE_CLEAR > TAPE_DEPTH, "clearance must exceed the tape depth");
});

test("tape lowers in clear air and then enters the hollow front slot", () => {
  const origin = {
    position: new THREE.Vector3(2.2, .39, -3.73),
    quaternion: new THREE.Quaternion(),
    scale: new THREE.Vector3(1, 1, 1),
  };
  let highest = -Infinity, minY = Infinity, previousZ = Infinity;
  for (let i = 22; i <= 100; i++) {
    const t = i / 100;
    const pose = tapePose(origin, t);
    highest = Math.max(highest, pose.position.y);
    if (t >= .55 && pose.position.z > CABINET_FRONT) { minY = Math.min(minY, pose.position.y); }
    if (t > .80) {
      assert.ok(pose.position.z <= previousZ + 1e-6, "tape should move straight into the player");
      assert.ok(Math.abs(pose.position.y - PLAYER_Y) < 1e-6, "tape should stay at the player slot height while inserting");
    }
    previousZ = pose.position.z;
  }
  assert.ok(highest > CABINET_TOP + .15, "tape never rises above the cabinet before crossing");
  assert.ok(minY >= CABINET_TOP - .02, "tape dips below the cabinet surface while crossing");
});
