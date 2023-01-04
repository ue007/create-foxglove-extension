import { Marker } from "../../ros";
import { releaseStandardMaterial, standardMaterial } from "./materials";
import { RenderableMarker } from "./RenderableMarker";
import { Renderer } from "../../Renderer";
import { rgbaEqual } from "../../color";
import * as THREE from "three";
import { StandardColor } from "../../MaterialCache";

type GltfMesh = THREE.Mesh<
  THREE.BufferGeometry,
  THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[]
>;

const MESH_FETCH_FAILED = "MESH_FETCH_FAILED";

export class RenderableMeshResource extends RenderableMarker {
  mesh: THREE.Group | undefined;
  material: THREE.MeshStandardMaterial;

  constructor(topic: string, marker: Marker, renderer: Renderer) {
    super(topic, marker, renderer);

    this.material = standardMaterial(marker, renderer.materialCache);

    this._loadModel(marker.mesh_resource, marker.mesh_use_embedded_materials).catch(() => {});

    this.update(marker);
  }

  override dispose(): void {
    releaseStandardMaterial(this.marker, this._renderer.materialCache);
  }

  override update(marker: Marker): void {
    super.update(marker);

    if (!rgbaEqual(marker.color, this.marker.color)) {
      releaseStandardMaterial(marker, this._renderer.materialCache);
      this.material = standardMaterial(marker, this._renderer.materialCache);
    }

    if (marker.mesh_resource !== this.marker.mesh_resource) {
      this._loadModel(marker.mesh_resource, marker.mesh_use_embedded_materials).catch(() => {});
    }

    this.scale.set(marker.scale.x, marker.scale.y, marker.scale.z);
  }

  private async _loadModel(url: string, useEmbeddedMaterials: boolean): Promise<void> {
    if (this.mesh) {
      this.remove(this.mesh);
      this.mesh = undefined;
    }

    const cachedModel = await this._renderer.modelCache.load(url, (err) => {
      this._renderer.topicErrors.add(
        this.topic,
        MESH_FETCH_FAILED,
        `Failed to load mesh resource from "${url}": ${err.message}`,
      );
    });

    if (!cachedModel) {
      return;
    }

    const mesh = cachedModel.scene.clone(true);
    const edgesToAdd: [edges: THREE.LineSegments, parent: THREE.Object3D][] = [];

    mesh.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      // Enable shadows for all meshes
      child.castShadow = true;
      child.receiveShadow = true;

      // Draw edges for all meshes
      const edgesGeometry = new THREE.EdgesGeometry(child.geometry, 40);
      const line = new THREE.LineSegments(
        edgesGeometry,
        this._renderer.materialCache.outlineMaterial,
      );
      edgesToAdd.push([line, child]);

      if (!useEmbeddedMaterials) {
        // Dispose of any allocated textures and the material and swap it with
        // our own material
        const meshChild = child as GltfMesh;
        if (Array.isArray(meshChild.material)) {
          for (const material of meshChild.material) {
            StandardColor.dispose(material);
          }
        } else {
          StandardColor.dispose(meshChild.material);
        }
        meshChild.material = this.material;
      }
    });

    for (const [line, parent] of edgesToAdd) {
      parent.add(line);
    }

    this.mesh = mesh;
    this.add(this.mesh);
  }
}
