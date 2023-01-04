import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry";
import { approxEquals } from "../../math";
import { Renderer } from "../../Renderer";
import { Marker } from "../../ros";
import {
  lineMaterial,
  linePrepassMaterial,
  markerHasTransparency,
  releaseLineMaterial,
  releaseLinePrepassMaterial,
} from "./materials";
import { RenderableMarker } from "./RenderableMarker";

export class RenderableLineList extends RenderableMarker {
  geometry: LineSegmentsGeometry;
  linePrepass: LineSegments2;
  line: LineSegments2;

  constructor(topic: string, marker: Marker, renderer: Renderer) {
    super(topic, marker, renderer);

    this.geometry = new LineSegmentsGeometry();

    // Stencil and depth pass 1
    const matLinePrepass = linePrepassMaterial(marker, renderer.materialCache);
    this.linePrepass = new LineSegments2(this.geometry, matLinePrepass);
    this.linePrepass.renderOrder = 1;
    this.add(this.linePrepass);

    // Color pass 2
    const matLine = lineMaterial(marker, renderer.materialCache);
    this.line = new LineSegments2(this.geometry, matLine);
    this.line.renderOrder = 2;
    this.add(this.line);

    this.update(marker);
  }

  override dispose(): void {
    releaseLinePrepassMaterial(this.marker, this._renderer.materialCache);
    releaseLineMaterial(this.marker, this._renderer.materialCache);
  }

  override update(marker: Marker): void {
    super.update(marker);

    const prevLineWidth = this.marker.scale.x;
    const prevTransparent = markerHasTransparency(this.marker);
    const lineWidth = marker.scale.x;
    const transparent = markerHasTransparency(marker);

    if (!approxEquals(prevLineWidth, lineWidth) || prevTransparent !== transparent) {
      releaseLinePrepassMaterial(this.marker, this._renderer.materialCache);
      releaseLineMaterial(this.marker, this._renderer.materialCache);
      this.linePrepass.material = linePrepassMaterial(marker, this._renderer.materialCache);
      this.line.material = lineMaterial(marker, this._renderer.materialCache);
    }

    this._setPositions(marker);
    this._setColors(marker);

    this.linePrepass.computeLineDistances();
    this.line.computeLineDistances();
  }

  private _setPositions(marker: Marker): void {
    const linePositions = new Float32Array(3 * marker.points.length);
    for (let i = 0; i < marker.points.length; i++) {
      const point = marker.points[i]!;
      linePositions[i * 3 + 0] = point.x;
      linePositions[i * 3 + 1] = point.y;
      linePositions[i * 3 + 2] = point.z;
    }

    this.geometry.setPositions(linePositions);
  }

  private _setColors(marker: Marker): void {
    // Converts color-per-point to a flattened typed array
    const rgbaData = new Float32Array(4 * marker.points.length);
    this._markerColorsToLinear(marker, (color, i) => {
      rgbaData[4 * i + 0] = color[0];
      rgbaData[4 * i + 1] = color[1];
      rgbaData[4 * i + 2] = color[2];
      rgbaData[4 * i + 3] = color[3];
    });

    // [rgba, rgba]
    const instanceColorBuffer = new THREE.InstancedInterleavedBuffer(rgbaData, 8, 1);
    this.geometry.setAttribute(
      "instanceColorStart",
      new THREE.InterleavedBufferAttribute(instanceColorBuffer, 4, 0),
    );
    this.geometry.setAttribute(
      "instanceColorEnd",
      new THREE.InterleavedBufferAttribute(instanceColorBuffer, 4, 4),
    );
  }
}
