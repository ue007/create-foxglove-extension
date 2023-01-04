/** @jsxImportSource @emotion/react */
import { jsx } from "@emotion/react";

import { forwardRef } from "react";
import * as THREE from "three";
import { MathUtils } from "three";

const MIN_SIZE = 44;
const MAX_SIZE = 64;

const MIN_DIST = 4;
const MAX_DIST = 16;

const tempV = new THREE.Vector3();

type Props = {
  visible: boolean;
  innerRef?: React.Ref<HTMLDivElement>;
};

function LabelOverlayBase(props: Props): JSX.Element {
  return (
    <div
      ref={props.innerRef}
      css={{
        display: props.visible ? "inherit" : "none",
        position: "absolute",
        width: MAX_SIZE,
        height: MAX_SIZE,
        pointerEvents: "none",
      }}
    ></div>
  );
}

export function setOverlayPosition(
  output: { left: string; top: string; transform: string },
  worldPosition: THREE.Vector3,
  canvasSize: THREE.Vector2,
  camera: THREE.Camera,
): void {
  tempV.copy(worldPosition);
  tempV.project(camera);
  const x = (tempV.x * 0.5 + 0.5) * canvasSize.width;
  const y = (tempV.y * -0.5 + 0.5) * canvasSize.height;

  const dist = tempV.distanceTo(camera.position);
  const interpolant = 1 - MathUtils.clamp((dist - MIN_DIST) / (MAX_DIST - MIN_DIST), 0, 1);
  const size = MathUtils.lerp(MIN_SIZE, MAX_SIZE, interpolant);
  const scale = MathUtils.lerp(MIN_SIZE / MAX_SIZE, 1, interpolant);
  const translateX = -(MAX_SIZE / 2) + (x % 1);
  const translateY = -size + (y % 1);

  // This sets style properties directly on the div for performance
  output.left = `${Math.floor(x)}px`;
  output.top = `${Math.floor(y)}px`;
  output.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

export const LabelOverlay = forwardRef<HTMLDivElement, Props>((props, ref) =>
  LabelOverlayBase({ ...props, innerRef: ref }),
);
