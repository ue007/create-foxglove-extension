import * as THREE from "three";
import { Renderer } from "../Renderer";
import { Marker, MarkerAction, MarkerType, Pose } from "../ros";
import { updatePose } from "../updatePose";
import { RenderableArrow } from "./markers/RenderableArrow";
import { RenderableCube } from "./markers/RenderableCube";
import { RenderableCubeList } from "./markers/RenderableCubeList";
import { RenderableCylinder } from "./markers/RenderableCylinder";
import { RenderableLineList } from "./markers/RenderableLineList";
import { RenderableLineStrip } from "./markers/RenderableLineStrip";
import { RenderableMarker } from "./markers/RenderableMarker";
import { RenderableMeshResource } from "./markers/RenderableMeshResource";
import { RenderablePoints } from "./markers/RenderablePoints";
import { RenderableSphere } from "./markers/RenderableSphere";
import { RenderableSphereList } from "./markers/RenderableSphereList";

const INVALID_CUBE_LIST = "INVALID_CUBE_LIST";
const INVALID_LINE_LIST = "INVALID_LINE_LIST";
const INVALID_LINE_STRIP = "INVALID_LINE_STRIP";
const INVALID_MARKER_ACTION = "INVALID_MARKER_ACTION";
const INVALID_MARKER_TYPE = "INVALID_MARKER_TYPE";
const INVALID_POINTS_LIST = "INVALID_POINTS_LIST";
const INVALID_SPHERE_LIST = "INVALID_SPHERE_LIST";

export class TopicMarkers extends THREE.Object3D {
  readonly topic: string;
  readonly renderer: Renderer;
  namespaces = new Map<string, Map<number, RenderableMarker>>();

  constructor(topic: string, renderer: Renderer) {
    super();
    this.topic = topic;
    this.renderer = renderer;
  }

  dispose(): void {}

  addMarkerMessage(marker: Marker): void {
    switch (marker.action) {
      case MarkerAction.ADD:
      case MarkerAction.MODIFY:
        this._addOrUpdateMarker(marker);
        break;
      case MarkerAction.DELETE: {
        // Delete this marker
        const ns = this.namespaces.get(marker.ns);
        if (ns) {
          const renderable = ns.get(marker.id);
          if (renderable) {
            this.remove(renderable);
            renderable.dispose();
            ns.delete(marker.id);
          }
        }
        break;
      }
      case MarkerAction.DELETEALL: {
        // Delete all markers on this topic
        for (const ns of this.namespaces.values()) {
          for (const renderable of ns.values()) {
            this.remove(renderable);
            renderable.dispose();
          }
        }
        this.namespaces.clear();
        break;
      }
      default:
        // Unknown action
        this.renderer.topicErrors.add(
          this.topic,
          INVALID_MARKER_ACTION,
          `Invalid marker action ${marker.action}`,
        );
    }
  }

  startFrame(currentTime: bigint, renderFrameId: string, fixedFrameId: string): void {
    for (const ns of this.namespaces.values()) {
      for (const renderable of ns.values()) {
        const marker = renderable.marker;
        const frameId = marker.header.frame_id;
        const srcTime = marker.frame_locked ? currentTime : renderable.userData.srcTime!;
        updatePose(
          renderable,
          this.renderer.transformTree,
          renderFrameId,
          fixedFrameId,
          frameId,
          currentTime,
          srcTime,
        );
      }
    }
  }

  private _addOrUpdateMarker(marker: Marker): void {
    let ns = this.namespaces.get(marker.ns);
    if (!ns) {
      ns = new Map<number, RenderableMarker>();
      this.namespaces.set(marker.ns, ns);
    }

    let renderable = ns.get(marker.id);
    if (!renderable) {
      renderable = this._createMarkerRenderable(marker);
      if (!renderable) return;
      this.add(renderable);
      ns.set(marker.id, renderable);
    } else {
      renderable.update(marker);
    }
  }

  private _createMarkerRenderable(marker: Marker): RenderableMarker | undefined {
    switch (marker.type) {
      case MarkerType.ARROW:
        return new RenderableArrow(this.topic, marker, this.renderer);
      case MarkerType.CUBE:
        return new RenderableCube(this.topic, marker, this.renderer);
      case MarkerType.SPHERE:
        return new RenderableSphere(this.topic, marker, this.renderer);
      case MarkerType.CYLINDER:
        return new RenderableCylinder(this.topic, marker, this.renderer);
      case MarkerType.LINE_STRIP:
        if (marker.points.length < 2) {
          this.renderer.topicErrors.add(
            this.topic,
            INVALID_LINE_STRIP,
            "LINE_STRIP marker has fewer than 2 points",
          );
          return;
        }
        return new RenderableLineStrip(this.topic, marker, this.renderer);
      case MarkerType.LINE_LIST:
        if (marker.points.length < 2) {
          this.renderer.topicErrors.add(
            this.topic,
            INVALID_LINE_LIST,
            "LINE_LIST marker has fewer than 2 points",
          );
          return;
        } else if (marker.points.length % 2 !== 0) {
          this.renderer.topicErrors.add(
            this.topic,
            INVALID_LINE_LIST,
            "LINE_LIST marker has an odd number of points",
          );
          return;
        }
        return new RenderableLineList(this.topic, marker, this.renderer);
      case MarkerType.CUBE_LIST:
        if (marker.points.length === 0) {
          this.renderer.topicErrors.add(
            this.topic,
            INVALID_CUBE_LIST,
            "CUBE_LIST marker has no points",
          );
          return;
        }
        return new RenderableCubeList(this.topic, marker, this.renderer);
      case MarkerType.SPHERE_LIST:
        if (marker.points.length === 0) {
          this.renderer.topicErrors.add(
            this.topic,
            INVALID_SPHERE_LIST,
            "SPHERE_LIST marker has no points",
          );
          return;
        }
        return new RenderableSphereList(this.topic, marker, this.renderer);
      case MarkerType.POINTS:
        if (marker.points.length === 0) {
          this.renderer.topicErrors.add(
            this.topic,
            INVALID_POINTS_LIST,
            "POINTS marker has no points",
          );
          return;
        }
        return new RenderablePoints(this.topic, marker, this.renderer);
      case MarkerType.TEXT_VIEW_FACING:
        // return new RenderableTextViewFacing(this.topic, marker, this.renderer);
        return undefined;
      case MarkerType.MESH_RESOURCE:
        return new RenderableMeshResource(this.topic, marker, this.renderer);
      case MarkerType.TRIANGLE_LIST:
        // return new RenderableTriangleList(this.topic, marker, this.renderer);
        return undefined;
      default:
        this.renderer.topicErrors.add(
          this.topic,
          INVALID_MARKER_TYPE,
          `Invalid marker type ${marker.type}`,
        );
        return undefined;
    }
  }
}
