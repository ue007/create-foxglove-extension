import { mat4, vec3, quat, ReadonlyMat4, ReadonlyVec3, ReadonlyQuat } from "gl-matrix";

import { Pose } from "./geometry";

import {
  approxEq,
  getRotationNoScaling,
  mat4Identity,
  quatIdentity,
  vec3Identity,
} from "./geometry";

const tempScale = vec3Identity();

/**
 * Transform represents a position and rotation in 3D space. It can be set and
 * accessed using either Vec3/Quat or Mat4, and these different representations
 * are automatically kept in sync.
 */
export class Transform {
  private _position: vec3;
  private _rotation: quat;
  private _matrix: mat4;

  constructor(position: vec3, rotation: quat) {
    this._position = position;
    this._rotation = rotation;
    quat.normalize(this._rotation, this._rotation);
    this._matrix = mat4.fromRotationTranslation(mat4Identity(), this._rotation, this._position);
  }

  position(): ReadonlyVec3 {
    return this._position;
  }

  rotation(): ReadonlyQuat {
    return this._rotation;
  }

  matrix(): ReadonlyMat4 {
    return this._matrix;
  }

  setPosition(position: ReadonlyVec3): this {
    vec3.copy(this._position, position);
    mat4.fromRotationTranslation(this._matrix, this._rotation, this._position);
    return this;
  }

  setRotation(rotation: ReadonlyQuat): this {
    quat.normalize(this._rotation, rotation);
    mat4.fromRotationTranslation(this._matrix, this._rotation, this._position);
    return this;
  }

  /**
   * Update position and rotation simultaneously. This is more efficient than
   * calling setPosition and setRotation separately, since we only need to
   * update the matrix once
   */
  setPositionRotation(position: ReadonlyVec3, rotation: ReadonlyQuat): this {
    vec3.copy(this._position, position);
    quat.normalize(this._rotation, rotation);
    mat4.fromRotationTranslation(this._matrix, this._rotation, this._position);
    return this;
  }

  /**
   * Update position and rotation from a Pose object
   */
  setPose(pose: Readonly<Pose>): this {
    vec3.set(this._position, pose.position.x, pose.position.y, pose.position.z);
    quat.set(
      this._rotation,
      pose.orientation.x,
      pose.orientation.y,
      pose.orientation.z,
      pose.orientation.w,
    );
    quat.normalize(this._rotation, this._rotation);
    mat4.fromRotationTranslation(this._matrix, this._rotation, this._position);
    return this;
  }

  /**
   * Update position and rotation from a matrix
   */
  setMatrix(matrix: ReadonlyMat4): this {
    // Ensure the matrix has no scaling
    mat4.getScaling(tempScale, matrix);
    if (!approxEq(tempScale[0], 1) || !approxEq(tempScale[1], 1) || !approxEq(tempScale[2], 1)) {
      throw new Error(
        `setMatrix given a matrix with non-unit scale [${tempScale[0]}, ${tempScale[1]}, ${
          tempScale[2]
        }]: ${mat4.str(matrix)}`,
      );
    }

    mat4.copy(this._matrix, matrix);
    mat4.getTranslation(this._position, matrix);
    getRotationNoScaling(this._rotation, matrix); // A faster mat4.getRotation when there is no scaling
    return this;
  }

  /**
   * Copy the values in another transform into this one
   */
  copy(other: Transform): this {
    // eslint-disable-next-line no-underscore-dangle
    vec3.copy(this._position, other._position);
    // eslint-disable-next-line no-underscore-dangle
    quat.copy(this._rotation, other._rotation);
    // eslint-disable-next-line no-underscore-dangle
    mat4.copy(this._matrix, other._matrix);
    return this;
  }

  toPose(out: Pose): void {
    out.position.x = this._position[0];
    out.position.y = this._position[1];
    out.position.z = this._position[2];
    out.orientation.x = this._rotation[0];
    out.orientation.y = this._rotation[1];
    out.orientation.z = this._rotation[2];
    out.orientation.w = this._rotation[3];
  }

  static Identity(): Transform {
    return new Transform(vec3Identity(), quatIdentity());
  }

  /**
   * Interpolate between two rigid body transforms using linear interpolation on
   * the translation vector and spherical linear interpolation on the rotation
   * quaternion.
   *
   * @param out Output transform to store the result in
   * @param a Start transform
   * @param b End transform
   * @param t Interpolant in the range [0, 1]
   * @returns A reference to `out`
   */
  static Interpolate(out: Transform, a: Transform, b: Transform, t: number): Transform {
    // eslint-disable-next-line no-underscore-dangle
    vec3.lerp(out._position, a.position(), b.position(), t);
    // eslint-disable-next-line no-underscore-dangle
    quat.slerp(out._rotation, a.rotation(), b.rotation(), t);
    // eslint-disable-next-line no-underscore-dangle
    out.setPositionRotation(out._position, out._rotation);
    return out;
  }
}
