import * as THREE from "three";
import { LineMaterial } from "../../LineMaterial";
import {
  LineVertexColor,
  LineVertexColorPrepass,
  MaterialCache,
  PointsVertexColor,
  StandardColor,
  StandardInstancedColor,
} from "../../MaterialCache";
import { Marker, MarkerType } from "../../ros";

export function markerHasTransparency(marker: Marker): boolean {
  switch (marker.type) {
    case MarkerType.ARROW:
    case MarkerType.CUBE:
    case MarkerType.SPHERE:
    case MarkerType.CYLINDER:
    case MarkerType.TEXT_VIEW_FACING:
    case MarkerType.MESH_RESOURCE:
      return marker.color.a < 1.0;
    case MarkerType.LINE_STRIP:
    case MarkerType.LINE_LIST:
    case MarkerType.CUBE_LIST:
    case MarkerType.SPHERE_LIST:
    case MarkerType.POINTS:
    case MarkerType.TRIANGLE_LIST:
    default:
      for (const color of marker.colors) {
        if (color.a < 1.0) {
          return true;
        }
      }
      return marker.colors.length >= marker.points.length ? false : marker.color.a < 1.0;
  }
}

export function standardMaterial(
  marker: Marker,
  materialCache: MaterialCache,
): THREE.MeshStandardMaterial {
  return materialCache.acquire(
    StandardColor.id(marker.color),
    () => StandardColor.create(marker.color),
    StandardColor.dispose,
  );
}

export function releaseStandardMaterial(marker: Marker, materialCache: MaterialCache): void {
  materialCache.release(StandardColor.id(marker.color));
}

export function standardInstancedMaterial(
  marker: Marker,
  materialCache: MaterialCache,
): THREE.MeshStandardMaterial {
  const transparent = markerHasTransparency(marker);
  return materialCache.acquire(
    StandardInstancedColor.id(transparent),
    () => StandardInstancedColor.create(transparent),
    StandardInstancedColor.dispose,
  );
}

export function releaseStandardInstancedMaterial(
  marker: Marker,
  materialCache: MaterialCache,
): void {
  const transparent = markerHasTransparency(marker);
  materialCache.release(StandardInstancedColor.id(transparent));
}

export function linePrepassMaterial(marker: Marker, materialCache: MaterialCache): LineMaterial {
  const lineWidth = marker.scale.x;
  const transparent = markerHasTransparency(marker);
  return materialCache.acquire(
    LineVertexColorPrepass.id(lineWidth, transparent),
    () => LineVertexColorPrepass.create(lineWidth, transparent),
    LineVertexColorPrepass.dispose,
  );
}

export function releaseLinePrepassMaterial(marker: Marker, materialCache: MaterialCache): void {
  const lineWidth = marker.scale.x;
  const transparent = markerHasTransparency(marker);
  materialCache.release(LineVertexColorPrepass.id(lineWidth, transparent));
}

export function lineMaterial(marker: Marker, materialCache: MaterialCache): LineMaterial {
  const lineWidth = marker.scale.x;
  const transparent = markerHasTransparency(marker);
  return materialCache.acquire(
    LineVertexColor.id(lineWidth, transparent),
    () => LineVertexColor.create(lineWidth, transparent),
    LineVertexColor.dispose,
  );
}

export function releaseLineMaterial(marker: Marker, materialCache: MaterialCache): void {
  const lineWidth = marker.scale.x;
  const transparent = markerHasTransparency(marker);
  materialCache.release(LineVertexColor.id(lineWidth, transparent));
}

export function pointsMaterial(marker: Marker, materialCache: MaterialCache): THREE.PointsMaterial {
  const transparent = markerHasTransparency(marker);
  return materialCache.acquire(
    PointsVertexColor.id(marker.scale, transparent),
    () => PointsVertexColor.create(marker.scale, transparent),
    PointsVertexColor.dispose,
  );
}

export function releasePointsMaterial(marker: Marker, materialCache: MaterialCache): void {
  const transparent = markerHasTransparency(marker);
  materialCache.release(PointsVertexColor.id(marker.scale, transparent));
}
