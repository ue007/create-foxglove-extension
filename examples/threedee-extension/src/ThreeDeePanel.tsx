/** @jsxImportSource @emotion/react */
import { jsx } from "@emotion/react";
import { css } from "@emotion/css";

import { PanelExtensionContext, RenderState, Topic, MessageEvent } from "@foxglove/studio";
import React, { useRef } from "react";
import { useLayoutEffect, useEffect, useState, useMemo } from "react";
import ReactDOM from "react-dom";
import { DebugGui } from "./DebugGui";
import { Renderer } from "./Renderer";
import { RendererContext, useRenderer, useRendererEvent } from "./RendererContext";
import { Stats } from "./Stats";
import {
  TRANSFORM_STAMPED_DATATYPES,
  TF_DATATYPES,
  MARKER_DATATYPES,
  MARKER_ARRAY_DATATYPES,
  TF,
  Marker,
  rosTimeToNanoSec,
} from "./ros";
import { setOverlayPosition } from "./LabelOverlay";

const SHOW_STATS = true;
const SHOW_DEBUG = false;

const MONOSPACE_FONTS = `"IBM Plex Mono", Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", "Lucida Sans Typewriter", "DejaVu Sans Mono", "Bitstream Vera Sans Mono", "Liberation Mono", "Nimbus Mono L", Monaco, "Courier New", Courier, monospace`;

const labelLight = css`
  position: relative;
  font-family: ${MONOSPACE_FONTS};
  color: #27272b;
  background-color: #ececec99;
`;

const labelDark = css`
  position: relative;
  font-family: ${MONOSPACE_FONTS};
  color: #e1e1e4;
  background-color: #181818cc;
`;

function RendererOverlay(props: { colorScheme: "dark" | "light" | undefined }): JSX.Element {
  const colorScheme = props.colorScheme;
  const [_selectedRenderable, setSelectedRenderable] = useState<THREE.Object3D | null>(null);
  const [labelsMap, setLabelsMap] = useState(new Map<string, Marker>());
  const labelsRef = useRef<HTMLDivElement>(null);
  const renderer = useRenderer();

  useRendererEvent("renderableSelected", (renderable) => setSelectedRenderable(renderable));

  useRendererEvent("showLabel", (labelId: string, labelMarker: Marker) => {
    const curLabelMarker = labelsMap.get(labelId);
    if (curLabelMarker === labelMarker) return;
    setLabelsMap(new Map(labelsMap.set(labelId, labelMarker)));
  });

  useRendererEvent("removeLabel", (labelId: string) => {
    if (!labelsMap.has(labelId)) return;
    labelsMap.delete(labelId);
    setLabelsMap(new Map(labelsMap));
  });

  useRendererEvent("endFrame", () => {
    if (renderer && labelsRef.current) {
      for (const labelId of labelsMap.keys()) {
        const labelEl = document.getElementById(`label-${labelId}`);
        if (labelEl) {
          const worldPosition = renderer.markerWorldPosition(labelId);
          if (worldPosition) {
            setOverlayPosition(
              labelEl.style,
              worldPosition,
              renderer.input.canvasSize,
              renderer.camera,
            );
          }
        }
      }
    }
  });

  // Create a div for each label
  const labelElements = useMemo(() => {
    const labelElements: JSX.Element[] = [];
    if (!renderer) return labelElements;
    const style = { left: "", top: "", transform: "" };
    const className = colorScheme === "dark" ? labelDark : labelLight;
    for (const [labelId, labelMarker] of labelsMap) {
      const worldPosition = renderer.markerWorldPosition(labelId);
      if (worldPosition) {
        setOverlayPosition(style, worldPosition, renderer.input.canvasSize, renderer.camera);
        labelElements.push(
          <div id={`label-${labelId}`} key={labelId} className={className} style={style}>
            {labelMarker.text}
          </div>,
        );
      }
    }
    return labelElements;
  }, [renderer, labelsMap, colorScheme]);

  const labels = (
    <div id="labels" ref={labelsRef} css={{ position: "absolute", top: 0 }}>
      {labelElements}
    </div>
  );

  const stats = SHOW_STATS ? (
    <div id="stats" css={{ position: "absolute", top: 0 }}>
      <Stats />
    </div>
  ) : undefined;

  const debug = SHOW_DEBUG ? (
    <div id="debug" css={{ position: "absolute", top: 60 }}>
      <DebugGui />
    </div>
  ) : undefined;

  return (
    <React.Fragment>
      {labels}
      {stats}
      {debug}
    </React.Fragment>
  );
}

export function ThreeDeePanel({ context }: { context: PanelExtensionContext }): JSX.Element {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [renderer, setRenderer] = useState<Renderer | null>(null);
  useEffect(() => setRenderer(canvas ? new Renderer(canvas) : null), [canvas]);

  const [colorScheme, setColorScheme] = useState<"dark" | "light" | undefined>();
  const [topics, setTopics] = useState<ReadonlyArray<Topic> | undefined>();
  const [messages, setMessages] = useState<ReadonlyArray<MessageEvent<unknown>> | undefined>();
  const [currentTime, setCurrentTime] = useState<bigint | undefined>();

  const [renderDone, setRenderDone] = useState<(() => void) | undefined>();

  // We use a layout effect to setup render handling for our panel. We also setup some topic subscriptions.
  useLayoutEffect(() => {
    // The render handler is run by the broader studio system during playback when your panel
    // needs to render because the fields it is watching have changed. How you handle rendering depends on your framework.
    // You can only setup one render handler - usually early on in setting up your panel.
    //
    // Without a render handler your panel will never receive updates.
    //
    // The render handler could be invoked as often as 60hz during playback if fields are changing often.
    context.onRender = (renderState: RenderState, done) => {
      // This is a hack to extract the current time from the render state, until
      // <https://github.com/foxglove/studio/issues/1248> is implemented
      if (renderState.currentFrame) {
        const latest = getCurrentTime(renderState.currentFrame);
        if (latest != undefined) {
          setCurrentTime(latest);
        }
      }

      // render functions receive a _done_ callback. You MUST call this callback to indicate your panel has finished rendering.
      // Your panel will not receive another render callback until _done_ is called from a prior render. If your panel is not done
      // rendering before the next render call, studio shows a notification to the user that your panel is delayed.
      //
      // Set the done callback into a state variable to trigger a re-render
      setRenderDone(done);

      // Keep UI elements and the renderer aware of the current color scheme
      setColorScheme(renderState.colorScheme);

      // We may have new topics - since we are also watching for messages in the current frame, topics may not have changed
      // It is up to you to determine the correct action when state has not changed
      setTopics(renderState.topics);

      // currentFrame has messages on subscribed topics since the last render call
      setMessages(renderState.currentFrame);
    };

    // After adding a render handler, you must indicate which fields from RenderState will trigger updates.
    // If you do not watch any fields then your panel will never render since the panel context will assume you do not want any updates.

    // Tell the panel context that we care about any update to the _topic_ field of RenderState
    context.watch("topics");

    // Tell the panel context we want messages for the current frame for topics we've subscribed to
    // This corresponds to the _currentFrame_ field of render state.
    context.watch("currentFrame");
  }, []);

  // Build a map from topic name to datatype
  const topicsToDatatypes = useMemo(() => {
    const map = new Map<string, string>();
    if (!topics) return map;
    for (const topic of topics) {
      map.set(topic.name, topic.datatype);
    }
    return map;
  }, [topics]);

  // Build a list of topics to subscribe to
  const topicsToSubscribe = useMemo(() => {
    const subscriptionList: string[] = [];
    if (!topics) {
      return undefined;
    }

    for (const topic of topics) {
      // Subscribe to all transform topics
      if (TF_DATATYPES.has(topic.datatype) || TRANSFORM_STAMPED_DATATYPES.has(topic.datatype)) {
        subscriptionList.push(topic.name);
      }

      // TODO: Allow disabling of subscriptions to other topics
      if (MARKER_DATATYPES.has(topic.datatype) || MARKER_ARRAY_DATATYPES.has(topic.datatype)) {
        subscriptionList.push(topic.name);
      }
    }

    return subscriptionList;
  }, [topics]);

  // Notify the extension context when our subscription list changes
  useEffect(() => {
    if (!topicsToSubscribe) return;
    console.info(`[ThreeDeePanel] Subscribing to [${topicsToSubscribe.join(", ")}]`);
    context.subscribe(topicsToSubscribe);
  }, [topicsToSubscribe]);

  // Keep the renderer currentTime up to date
  useEffect(() => {
    if (renderer && currentTime != undefined) {
      renderer.currentTime = currentTime;
    }
  }, [currentTime, renderer]);

  useEffect(() => {
    if (colorScheme && renderer) {
      renderer.setColorScheme(colorScheme);
    }
  }, [colorScheme, renderer]);

  // Handle messages
  useEffect(() => {
    if (!messages || !renderer) return;

    for (const message of messages) {
      const datatype = topicsToDatatypes.get(message.topic);
      if (!datatype) continue;

      if (TF_DATATYPES.has(datatype)) {
        // tf2_msgs/TFMessage - Ingest the list of transforms into our TF tree
        const tfMessage = message.message as { transforms: TF[] };
        for (const tf of tfMessage.transforms) {
          renderer.addTransformMessage(tf);
        }
      } else if (TRANSFORM_STAMPED_DATATYPES.has(datatype)) {
        // geometry_msgs/TransformStamped - Ingest this single transform into our TF tree
        const tf = message.message as TF;
        renderer.addTransformMessage(tf);
      } else if (MARKER_ARRAY_DATATYPES.has(datatype)) {
        // visualization_msgs/MarkerArray - Ingest the list of markers
        const markerArray = message.message as { markers: Marker[] };
        for (const marker of markerArray.markers) {
          renderer.addMarkerMessage(message.topic, marker);
        }
      } else if (MARKER_DATATYPES.has(datatype)) {
        // visualization_msgs/Marker - Ingest this single marker
        const marker = message.message as Marker;
        renderer.addMarkerMessage(message.topic, marker);
      }
    }
  }, [messages, topicsToDatatypes]);

  // Invoke the done callback once the render is complete
  useEffect(() => {
    renderDone?.();
  }, [renderDone]);

  return (
    <React.Fragment>
      <canvas ref={setCanvas} css={{ position: "absolute", top: 0 }} />
      <RendererContext.Provider value={renderer}>
        <RendererOverlay colorScheme={colorScheme} />
      </RendererContext.Provider>
    </React.Fragment>
  );
}

export function initThreeDeePanel(context: PanelExtensionContext) {
  ReactDOM.render(<ThreeDeePanel context={context} />, context.panelElement);
}

function getCurrentTime(currentFrame: readonly MessageEvent<unknown>[]): bigint | undefined {
  if (currentFrame.length === 0) return undefined;

  let maxTime = rosTimeToNanoSec(currentFrame[0]!.receiveTime);
  for (let i = 1; i < currentFrame.length; i++) {
    const message = currentFrame[i]!;
    const curTime = rosTimeToNanoSec(message.receiveTime);
    if (curTime > maxTime) maxTime = curTime;
  }
  return maxTime;
}
