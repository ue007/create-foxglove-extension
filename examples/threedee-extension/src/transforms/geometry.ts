import type { vec3, quat, mat4, ReadonlyMat4 } from "gl-matrix";

export type Point = {
  x: number;
  y: number;
  z: number;
};

export type Orientation = {
  x: number;
  y: number;
  z: number;
  w: number;
};

export type Pose = {
  position: Point;
  orientation: Orientation;
};

export function makePose(): Pose {
  return { position: { x: 0, y: 0, z: 0 }, orientation: { x: 0, y: 0, z: 0, w: 1 } };
}

// Helper functions for constructing geometry primitives that can be used with
// gl-matrix. These methods are preferred over the gl-matrix equivalents since
// they produce number[] arrays instead of Float32Array, which have less
// precision and are slower (float32 requires upcasting/downcasting to do math
// in JavaScript).

// ts-prune-ignore-next
export function vec3Identity(): vec3 {
  return [0, 0, 0];
}

// ts-prune-ignore-next
export function vec3FromValues(x: number, y: number, z: number): vec3 {
  return [x, y, z];
}

// ts-prune-ignore-next
export function vec3Clone(a: vec3): vec3 {
  return [a[0], a[1], a[2]];
}

// ts-prune-ignore-next
export function quatIdentity(): quat {
  return [0, 0, 0, 1];
}

// ts-prune-ignore-next
export function quatFromValues(x: number, y: number, z: number, w: number): quat {
  return [x, y, z, w];
}

// ts-prune-ignore-next
export function quatClone(q: quat): quat {
  return [q[0], q[1], q[2], q[3]];
}

// ts-prune-ignore-next
export function mat4Identity(): mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

// ts-prune-ignore-next
export function mat4FromValues(
  m00: number,
  m01: number,
  m02: number,
  m03: number,
  m10: number,
  m11: number,
  m12: number,
  m13: number,
  m20: number,
  m21: number,
  m22: number,
  m23: number,
  m30: number,
  m31: number,
  m32: number,
  m33: number,
): mat4 {
  return [m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33];
}

// ts-prune-ignore-next
export function mat4Clone(m: mat4): mat4 {
  return [
    m[0],
    m[1],
    m[2],
    m[3],
    m[4],
    m[5],
    m[6],
    m[7],
    m[8],
    m[9],
    m[10],
    m[11],
    m[12],
    m[13],
    m[14],
    m[15],
  ];
}

/**
 * Test if two numbers are approximately equal.
 */
export function approxEq(v1: number, v2: number, epsilon = 0.00001): boolean {
  return Math.abs(v1 - v2) <= epsilon;
}

/**
 * Returns a quaternion representing the rotational component of a
 * transformation matrix. The matrix must not have any scaling applied to it.
 * @param out Quaternion to receive the rotation component
 * @param mat Matrix to be decomposed (input)
 * @param scaling Scaling of the matrix (input)
 * @return out
 */
export function getRotationNoScaling(out: quat, mat: ReadonlyMat4): quat {
  const m11 = mat[0];
  const m12 = mat[1];
  const m13 = mat[2];
  const m21 = mat[4];
  const m22 = mat[5];
  const m23 = mat[6];
  const m31 = mat[8];
  const m32 = mat[9];
  const m33 = mat[10];
  const trace = m11 + m22 + m33;
  let S = 0;
  if (trace > 0) {
    S = Math.sqrt(trace + 1.0) * 2;
    out[3] = 0.25 * S;
    out[0] = (m23 - m32) / S;
    out[1] = (m31 - m13) / S;
    out[2] = (m12 - m21) / S;
  } else if (m11 > m22 && m11 > m33) {
    S = Math.sqrt(1.0 + m11 - m22 - m33) * 2;
    out[3] = (m23 - m32) / S;
    out[0] = 0.25 * S;
    out[1] = (m12 + m21) / S;
    out[2] = (m31 + m13) / S;
  } else if (m22 > m33) {
    S = Math.sqrt(1.0 + m22 - m11 - m33) * 2;
    out[3] = (m31 - m13) / S;
    out[0] = (m12 + m21) / S;
    out[1] = 0.25 * S;
    out[2] = (m23 + m32) / S;
  } else {
    S = Math.sqrt(1.0 + m33 - m11 - m22) * 2;
    out[3] = (m12 - m21) / S;
    out[0] = (m31 + m13) / S;
    out[1] = (m23 + m32) / S;
    out[2] = 0.25 * S;
  }
  return out;
}
