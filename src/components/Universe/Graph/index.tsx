import { useFrame, useThree } from "@react-three/fiber";
import * as d3 from "d3-force-3d";
import { useCallback, useEffect, useMemo } from "react";
import ThreeForceGraph from "three-forcegraph";
import type { Node } from "../../../types";
import { useDataStore } from "../../GraphDataRetriever";
import { Tooltip } from "../Tooltip";
import { renderLink } from "./renderLink";
import { renderNode } from "./renderNode";
import { useGraphMouseEvents } from "./useGraphMouseEvents";

const SCALE = 1;
const HOVER_SCALE = 1.5;

export const Graph = () => {
  const { scene } = useThree();

  const data = useDataStore((s) => s.data);
  const setSelectedNode = useDataStore((s) => s.setSelectedNode);

  const graph = useMemo(() => {
    return new ThreeForceGraph()
      .nodeThreeObject(renderNode)
      .nodeResolution(20)
      .linkThreeObject(renderLink)
      .linkResolution(20)
      .d3VelocityDecay(0.2)
      .d3Force("link", d3.forceLink().strength(0.1))
      .d3Force("center", d3.forceCenter().strength(0.1));
  }, []);

  useEffect(() => {
    graph.clear().graphData(data);
  }, [data, graph]);

  useEffect(() => {
    scene.add(graph);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onClick = useCallback(
    (node: Node) => setSelectedNode(node),
    [setSelectedNode]
  );

  const onHover = useCallback((node: Node) => {
    node?.__threeObj?.scale.set(HOVER_SCALE, HOVER_SCALE, HOVER_SCALE);
  }, []);

  const onNotHover = useCallback((previousHoverNode: Node) => {
    previousHoverNode?.__threeObj?.scale.set(SCALE, SCALE, SCALE);
  }, []);

  const { hoverNode } = useGraphMouseEvents(onHover, onNotHover, onClick);

  useFrame(() => {
    if (hoverNode) {
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "auto";
    }

    graph.tickFrame();
  });

  return null
};
