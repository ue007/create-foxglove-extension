import * as THREE from "three";
import { ColorRGBA, Vector3 } from "./ros";

type UserData = { [key: string]: unknown };

const INITIAL_CAPACITY = 4;

const tempMat4 = new THREE.Matrix4();
const tempScale = new THREE.Vector3();
const tempColor = new THREE.Color();

/**
 * Extends InstancedMesh with a set() method that takes a list of points and
 * colors and dynamically resizes the buffer attributes.
 */
export class DynamicInstancedMesh<
  TGeometry extends THREE.BufferGeometry = THREE.BufferGeometry,
  TMaterial extends THREE.Material | THREE.Material[] = THREE.Material | THREE.Material[],
> extends THREE.InstancedMesh<TGeometry, TMaterial> {
  // Total size of the buffer attributes, which can be larger than .count (instances in use)
  private _capacity: number;

  constructor(geometry: TGeometry, material: TMaterial, initialCapacity = INITIAL_CAPACITY) {
    super(geometry, material, 0);

    this._capacity = initialCapacity;
    this._resize();
  }

  set(points: Vector3[], scale: Vector3, colors: ColorRGBA[], defaultColor: ColorRGBA): void {
    const count = points.length;
    this._setCount(count);

    for (let i = 0; i < count; i++) {
      const point = points[i]!;
      const color = colors[i] ?? defaultColor;
      tempMat4.makeTranslation(point.x, point.y, point.z);
      tempScale.set(scale.x, scale.y, scale.z);
      tempMat4.scale(tempScale);
      tempColor.setRGB(color.r, color.g, color.b);
      this.setMatrixAt(i, tempMat4);
      this.setColorAt(i, tempColor);
      // TODO: Need to adapt InstancedMesh to use an opacity instance buffer attribute
      // this.setOpacityAt(i, color.a);
    }
  }

  private _setCount(count: number) {
    while (count >= this._capacity) this._expand();
    this.count = count;
    this.instanceMatrix.count = count;
    this.instanceColor!.count = count;
  }

  private _expand() {
    this._capacity = this._capacity + Math.trunc(this._capacity / 2) + 16;
    this._resize();
  }

  private _resize() {
    const oldMatrixArray = this.instanceMatrix.array as Float32Array;
    const oldColorArray = this.instanceColor?.array as Float32Array | undefined;

    const newMatrixArray = new Float32Array(this._capacity * 16);
    const newColorArray = new Float32Array(this._capacity * 3);

    if (oldMatrixArray.length > 0) {
      newMatrixArray.set(oldMatrixArray);
    }
    if (oldColorArray && oldColorArray.length > 0) {
      newColorArray.set(oldColorArray);
    }

    this.instanceMatrix = new THREE.InstancedBufferAttribute(newMatrixArray, 16);
    this.instanceColor = new THREE.InstancedBufferAttribute(newColorArray, 3);

    this.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instanceColor.setUsage(THREE.DynamicDrawUsage);
  }
}
