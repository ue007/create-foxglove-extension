import * as THREE from "three";

const UNIT_X = new THREE.Vector3(1, 0, 0);
const UNIT_Y = new THREE.Vector3(0, 1, 0);

const v0 = new THREE.Vector3();
const v1 = new THREE.Vector3();
const c = new THREE.Vector3();

export function getRotationTo(src: THREE.Vector3, dest: THREE.Vector3): THREE.Quaternion {
  // Adapted from <https://www.ogre3d.org/docs/api/1.8/_ogre_vector3_8h_source.html>
  // Based on Stan Melax's article in Game Programming Gems
  const q = new THREE.Quaternion(0, 0, 0, 1);
  v0.copy(src).normalize();
  v1.copy(dest).normalize();

  const d = v0.dot(v1);
  // If dot == 1, vectors are the same
  if (d >= 1.0) {
    return q;
  }
  if (d < 1e-6 - 1.0) {
    // Generate an axis
    let axis = c.copy(UNIT_X).cross(src);
    if (isZeroLength(axis)) {
      // Pick another if collinear
      axis = c.copy(UNIT_Y).cross(src);
    }
    axis.normalize();
    q.setFromAxisAngle(axis, Math.PI);
  } else {
    const s = Math.sqrt((1 + d) * 2);
    const invs = 1 / s;

    c.copy(v0).cross(v1);

    q.x = c.x * invs;
    q.y = c.y * invs;
    q.z = c.z * invs;
    q.w = s * 0.5;
    q.normalize();
  }
  return q;
}

export function isZeroLength(vec: THREE.Vector3): boolean {
  return vec.lengthSq() < 1e-6 * 1e-6;
}

export function approxEquals(a: number, b: number, epsilon = 0.00001): boolean {
  return Math.abs(a - b) < epsilon;
}

export function uint8Equals(a: number, b: number): boolean {
  const ai = Math.trunc(a * 255);
  const bi = Math.trunc(b * 255);
  return ai === bi;
}
