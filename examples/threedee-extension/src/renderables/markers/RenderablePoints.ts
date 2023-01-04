import * as THREE from "three";
import { DynamicBufferAttribute } from "../../DynamicBufferAttribute";
import { approxEquals } from "../../math";
import { Renderer } from "../../Renderer";
import { Marker } from "../../ros";
import { markerHasTransparency, pointsMaterial, releasePointsMaterial } from "./materials";
import { RenderableMarker } from "./RenderableMarker";

export class RenderablePoints extends RenderableMarker {
  geometry: THREE.BufferGeometry;
  positionAttribute: DynamicBufferAttribute<Float32Array, Float32ArrayConstructor>;
  colorAttribute: DynamicBufferAttribute<Float32Array, Float32ArrayConstructor>;
  points: THREE.Points;

  constructor(topic: string, marker: Marker, renderer: Renderer) {
    super(topic, marker, renderer);

    this.geometry = new THREE.BufferGeometry();

    this.positionAttribute = new DynamicBufferAttribute(Float32Array, 3);
    this.colorAttribute = new DynamicBufferAttribute(Float32Array, 4);

    this.geometry.setAttribute("position", this.positionAttribute);
    this.geometry.setAttribute("color", this.colorAttribute);

    const material = pointsMaterial(marker, renderer.materialCache);
    this.points = new THREE.Points(this.geometry, material);
    this.add(this.points);

    this.update(marker);
  }

  override dispose(): void {
    releasePointsMaterial(this.marker, this._renderer.materialCache);
  }

  override update(marker: Marker): void {
    super.update(marker);

    const prevWidth = this.marker.scale.x;
    const prevHeight = this.marker.scale.y;
    const prevTransparent = markerHasTransparency(this.marker);
    const width = marker.scale.x;
    const height = marker.scale.y;
    const transparent = markerHasTransparency(marker);

    if (
      !approxEquals(prevWidth, width) ||
      !approxEquals(prevHeight, height) ||
      prevTransparent !== transparent
    ) {
      releasePointsMaterial(this.marker, this._renderer.materialCache);
      this.points.material = pointsMaterial(marker, this._renderer.materialCache);
    }

    this._setPositions(marker);
    this._setColors(marker);
  }

  private _setPositions(marker: Marker): void {
    this.positionAttribute.resize(marker.points.length);

    const positions = this.positionAttribute.data;
    for (let i = 0; i < marker.points.length; i++) {
      const point = marker.points[i]!;
      positions[i * 3 + 0] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    }
    this.positionAttribute.needsUpdate = true;
  }

  private _setColors(marker: Marker): void {
    // Converts color-per-point to a flattened typed array
    const length = marker.points.length;
    this.colorAttribute.resize(length);
    const rgbaData = this.colorAttribute.data;
    this._markerColorsToLinear(marker, (color, i) => {
      rgbaData[4 * i + 0] = color[0];
      rgbaData[4 * i + 1] = color[1];
      rgbaData[4 * i + 2] = color[2];
      rgbaData[4 * i + 3] = color[3];
    });
    this.colorAttribute.needsUpdate = true;
  }
}
