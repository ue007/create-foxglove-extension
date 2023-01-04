import * as THREE from "three";
import { clamp } from "three/src/math/MathUtils";
import { rgbaEqual } from "../../color";
import { getRotationTo } from "../../math";
import { DetailLevel, Renderer } from "../../Renderer";
import { Marker, Vector3 } from "../../ros";
import { releaseStandardMaterial, standardMaterial } from "./materials";
import { RenderableMarker } from "./RenderableMarker";

// const SHAFT_LENGTH = 1;
// const SHAFT_DIAMETER = 0.1;
// const HEAD_LENGTH = 0.3;
// const HEAD_DIAMETER = 0.2;
const SHAFT_LENGTH = 0.77;
const SHAFT_DIAMETER = 1.0;
const HEAD_LENGTH = 0.23;
const HEAD_DIAMETER = 2.0;

const HEAD_LENGTH_PROPORTION = 0.23;

const NEGATIVE_UNIT_Z = new THREE.Vector3(0, 0, -1);

const tempStart = new THREE.Vector3();
const tempEnd = new THREE.Vector3();
const tempDirection = new THREE.Vector3();

export class RenderableArrow extends RenderableMarker {
  private static _shaftGeometry: THREE.CylinderGeometry | undefined;
  private static _headGeometry: THREE.ConeGeometry | undefined;
  private static _shaftEdgesGeometry: THREE.EdgesGeometry | undefined;
  private static _headEdgesGeometry: THREE.EdgesGeometry | undefined;

  shaftMesh: THREE.Mesh<THREE.CylinderGeometry, THREE.Material>;
  headMesh: THREE.Mesh<THREE.ConeGeometry, THREE.Material>;
  shaftOutline: THREE.LineSegments | undefined;
  headOutline: THREE.LineSegments | undefined;

  constructor(topic: string, marker: Marker, renderer: Renderer) {
    super(topic, marker, renderer);

    // Shaft mesh
    const material = standardMaterial(marker, renderer.materialCache);
    this.shaftMesh = new THREE.Mesh(RenderableArrow.shaftGeometry(renderer.lod), material);
    this.shaftMesh.castShadow = true;
    this.shaftMesh.receiveShadow = true;
    this.add(this.shaftMesh);

    // Head mesh
    this.headMesh = new THREE.Mesh(RenderableArrow.headGeometry(renderer.lod), material);
    this.headMesh.castShadow = true;
    this.headMesh.receiveShadow = true;
    this.add(this.headMesh);

    // Shaft outline
    this.shaftOutline = new THREE.LineSegments(
      RenderableArrow.shaftEdgesGeometry(renderer.lod),
      renderer.materialCache.outlineMaterial,
    );
    this.shaftMesh.add(this.shaftOutline);

    // Head outline
    this.headOutline = new THREE.LineSegments(
      RenderableArrow.headEdgesGeometry(renderer.lod),
      renderer.materialCache.outlineMaterial,
    );
    this.headMesh.add(this.headOutline);

    this.update(marker);
  }

  override dispose(): void {
    releaseStandardMaterial(this.marker, this._renderer.materialCache);
  }

  override update(marker: Marker): void {
    super.update(marker);

    if (!rgbaEqual(marker.color, this.marker.color)) {
      releaseStandardMaterial(marker, this._renderer.materialCache);
      this.shaftMesh.material = standardMaterial(marker, this._renderer.materialCache);
      this.headMesh.material = this.shaftMesh.material;
    }

    // Adapted from <https://github.com/ros-visualization/rviz/blob/noetic-devel/src/rviz/default_plugin/markers/arrow_marker.cpp
    if (marker.points.length === 2) {
      const pointA = marker.points[0]!;
      const pointB = marker.points[1]!;
      tempStart.set(pointA.x, pointA.y, pointA.z);
      tempEnd.set(pointB.x, pointB.y, pointB.z);

      tempDirection.subVectors(tempEnd, tempStart);
      const distance = tempDirection.length();

      let headLength = HEAD_LENGTH_PROPORTION * distance;
      if (marker.scale.z != 0) {
        const length = marker.scale.z;
        headLength = clamp(length, 0, distance);
      }
      const shaftLength = distance - headLength;
      const shaftDiameter = marker.scale.x;
      const headDiameter = marker.scale.y;

      this.shaftMesh.scale.set(shaftLength, shaftDiameter, shaftDiameter);
      this.headMesh.scale.set(headLength, headDiameter, headDiameter);
      this.scale.set(1, 1, 1);
      this.shaftMesh.position.set(0, 0, 0);

      // Override this.pose
      tempDirection.normalize();
      copyPoint(pointA, this.userData.pose.position);
      this.userData.pose.orientation = getRotationTo(NEGATIVE_UNIT_Z, tempDirection);
    } else {
      this.shaftMesh.scale.set(SHAFT_LENGTH, SHAFT_DIAMETER, SHAFT_DIAMETER);
      this.headMesh.scale.set(HEAD_LENGTH, HEAD_DIAMETER, HEAD_DIAMETER);
      this.scale.set(marker.scale.x, marker.scale.y, marker.scale.z);

      const halfShaftLength = SHAFT_LENGTH / 2;
      const halfHeadLength = HEAD_LENGTH / 2;
      this.shaftMesh.position.set(halfShaftLength, 0, 0);
      this.headMesh.position.set(halfShaftLength * 2 + halfHeadLength, 0, 0);
    }
  }

  static shaftGeometry(lod: DetailLevel): THREE.CylinderGeometry {
    if (!RenderableArrow._shaftGeometry) {
      const subdivs = shaftSubdivisions(lod);
      RenderableArrow._shaftGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, subdivs, 1, false);
      RenderableArrow._shaftGeometry.rotateZ(-Math.PI / 2);
      RenderableArrow._shaftGeometry.computeBoundingSphere();
    }
    return RenderableArrow._shaftGeometry;
  }

  static headGeometry(lod: DetailLevel): THREE.ConeGeometry {
    if (!RenderableArrow._headGeometry) {
      const subdivs = headSubdivisions(lod);
      RenderableArrow._headGeometry = new THREE.ConeGeometry(0.5, 1, subdivs, 1, false);
      RenderableArrow._headGeometry.rotateZ(-Math.PI / 2);
      RenderableArrow._headGeometry.computeBoundingSphere();
    }
    return RenderableArrow._headGeometry;
  }

  static shaftEdgesGeometry(lod: DetailLevel): THREE.EdgesGeometry {
    if (!RenderableArrow._shaftEdgesGeometry) {
      const geometry = RenderableArrow.shaftGeometry(lod);
      RenderableArrow._shaftEdgesGeometry = new THREE.EdgesGeometry(geometry, 40);
      RenderableArrow._shaftEdgesGeometry.computeBoundingSphere();
    }
    return RenderableArrow._shaftEdgesGeometry;
  }

  static headEdgesGeometry(lod: DetailLevel): THREE.EdgesGeometry {
    if (!RenderableArrow._headEdgesGeometry) {
      const geometry = RenderableArrow.headGeometry(lod);
      RenderableArrow._headEdgesGeometry = new THREE.EdgesGeometry(geometry, 40);
      RenderableArrow._headEdgesGeometry.computeBoundingSphere();
    }
    return RenderableArrow._headEdgesGeometry;
  }
}

function copyPoint(from: Vector3, to: Vector3): void {
  to.x = from.x;
  to.y = from.y;
  to.z = from.z;
}

function shaftSubdivisions(lod: DetailLevel) {
  switch (lod) {
    case DetailLevel.Low:
      return 12;
    case DetailLevel.Medium:
      return 20;
    case DetailLevel.High:
      return 32;
  }
}

function headSubdivisions(lod: DetailLevel) {
  switch (lod) {
    case DetailLevel.Low:
      return 12;
    case DetailLevel.Medium:
      return 20;
    case DetailLevel.High:
      return 32;
  }
}
