import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  getOutgoers,
  getSimpleBezierPath,
  Position,
  useOnSelectionChange,
  useReactFlow,
  useStoreApi,
  type Edge,
  type Node,
  type OnConnect,
  type OnConnectEnd,
  type OnEdgesChange,
  type OnNodesChange,
  type XYPosition,
} from "@xyflow/react";
import {
  extractFields,
  getFieldDefault,
  type Connection,
  type Patch,
  type Shader,
  type Uniforms,
} from "@sequenza/lib";
import type { UniformExpressions } from "../components/EditorContext";
import { buildEditorState } from "../buildEditorState";
import { topologicalMap } from "../components/util";
import type { ShaderNode, ShaderNodeData } from "../components/ShaderNode";

function propagateWidthHeightUpdates(
  nodes: Node[],
  edges: Edge[],
  startId?: string,
): Node[] {
  const incomingEdges = new Map<string, Edge[]>();
  for (const edge of edges) {
    const list = incomingEdges.get(edge.target) ?? [];
    list.push(edge);
    incomingEdges.set(edge.target, list);
  }

  const adjacency = new Map<string, string[]>();
  for (const node of nodes) adjacency.set(node.id, []);
  for (const edge of edges) adjacency.get(edge.source)?.push(edge.target);

  let reachable: Set<string> | null = null;
  if (startId !== undefined) {
    reachable = new Set<string>();
    const bfs = [startId];
    while (bfs.length > 0) {
      const id = bfs.shift()!;
      if (reachable.has(id)) continue;
      reachable.add(id);
      for (const neighbor of adjacency.get(id) ?? []) bfs.push(neighbor);
    }
  }

  return topologicalMap(
    nodes,
    edges,
    (node, nodeMap) => {
      if (node.id === startId) return node;
      if (node.type !== "shader") return node;
      const incoming = incomingEdges.get(node.id);
      if (!incoming || incoming.length === 0) return node;

      const edge = reachable
        ? incoming.find((e) => reachable!.has(e.source))
        : incoming[0];
      if (!edge) return node;

      const sourceNode = nodeMap.get(edge.source);
      if (!sourceNode || sourceNode.type !== "shader") return node;
      const { width, height } = (sourceNode as ShaderNode).data.shader
        .resolution;

      const shaderNode = node as ShaderNode;
      return {
        ...shaderNode,
        data: {
          ...shaderNode.data,
          shader: {
            ...shaderNode.data.shader,
            resolution: { width, height },
          },
        },
      };
    },
    startId,
  );
}

export function useGraphState({
  shaders,
  initialState,
  uniformRef,
  uniformExpressions,
  setUniformExpressions,
}: {
  shaders: Shader[];
  initialState?: {
    nodes: Node[];
    edges: Edge[];
    uniforms: Record<string, Uniforms>;
    uniformExpressions?: UniformExpressions;
  };
  uniformRef: RefObject<Record<string, Uniforms>>;
  uniformExpressions: UniformExpressions;
  setUniformExpressions: Dispatch<SetStateAction<UniformExpressions>>;
}) {
  const [edges, setEdges] = useState<Edge[]>(initialState?.edges ?? []);
  const [nodes, setNodes] = useState<Node[]>(() => {
    const initialNodes = initialState?.nodes ?? [];
    const initialEdges = initialState?.edges ?? [];
    return propagateWidthHeightUpdates(initialNodes, initialEdges);
  });

  const onNodesChange: OnNodesChange = useCallback(
    (changes) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [setNodes],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [setEdges],
  );

  const isValidConnection = useCallback(
    (connection: { source: string; target: string }) => {
      const visited = new Set<string>();
      const hasCycle = (nodeId: string): boolean => {
        if (visited.has(nodeId)) return false;
        if (nodeId === connection.source) return true;
        visited.add(nodeId);
        return getOutgoers({ id: nodeId } as Node, nodes, edges).some((n) =>
          hasCycle(n.id),
        );
      };
      return !hasCycle(connection.target);
    },
    [nodes, edges],
  );

  const onConnect: OnConnect = useCallback(
    (params) => {
      const newEdges = addEdge({ ...params, type: "insert" }, edges);
      const newNodes = propagateWidthHeightUpdates(
        nodes,
        newEdges,
        params.source,
      );
      setEdges(newEdges);
      setNodes(newNodes);
    },
    [edges, nodes],
  );

  const { screenToFlowPosition } = useReactFlow();
  const store = useStoreApi();

  const [addShaderDialogOpen, setAddShaderDialogOpen] = useState(false);
  const [addShaderLocation, setAddShaderLocation] = useState<null | {
    position: XYPosition;
    sourceId?: string;
  }>(null);

  const onConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      if (!connectionState.isValid && connectionState.fromNode) {
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;
        setAddShaderLocation({
          position: screenToFlowPosition({ x: clientX, y: clientY }),
          sourceId: connectionState.fromNode.id,
        });
        setAddShaderDialogOpen(true);
      }
    },
    [screenToFlowPosition],
  );

  const selectedNodesRef = useRef<Node[]>([]);
  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    selectedNodesRef.current = nodes;
  }, []);
  useOnSelectionChange({ onChange: onSelectionChange });

  useEffect(() => {
    setNodes((snapshot) =>
      snapshot.map((node) => {
        if (node.type === "shader") {
          const shaderNode: ShaderNode = node as ShaderNode;
          for (const newShader of shaders) {
            if (shaderNode.data.shader.name === newShader.name) {
              return {
                ...shaderNode,
                data: {
                  ...shaderNode.data,
                  shader: { ...shaderNode.data.shader, source: newShader.source },
                },
              };
            }
          }
          return shaderNode;
        }
        return node;
      }),
    );
  }, [shaders]);

  const createShaderNode = (shader: Shader): ShaderNode => {
    const newId = `${Math.random() * 100000}`;
    const newShader: Shader = { ...shader, id: newId };
    const defaults: Uniforms = {};
    for (const field of extractFields(shader)) {
      const def = getFieldDefault(field);
      if (def !== undefined) defaults[field.name] = def;
    }
    uniformRef.current[newId] = defaults;
    return {
      id: newId,
      position: { x: 0, y: 0 },
      data: { shader: newShader, uniforms: uniformRef, paused: false },
      type: "shader",
    };
  };

  const handleAddShader = useCallback(
    (shader: Shader) => {
      const newNode = createShaderNode(shader);

      if (addShaderLocation === null) {
        const domNode = store.getState().domNode;
        if (domNode) {
          const domRect = domNode.getBoundingClientRect();
          newNode.position = screenToFlowPosition({
            x: domRect.x + domRect.width / 2,
            y: domRect.y + domRect.height / 2,
          });
        }
        setAddShaderLocation(null);
        setNodes((snapshot) => [...snapshot, newNode]);
      } else if (addShaderLocation.sourceId) {
        // Append to existing node
        const sourceNode = nodes.find((n) => n.id === addShaderLocation.sourceId);
        if (sourceNode) {
          newNode.position = addShaderLocation.position;
          const fields = extractFields(newNode.data.shader);
          let inputHandleName: string | undefined;
          for (const field of fields) {
            if (field.type === "sampler2D" && field.source === "input") {
              inputHandleName = field.name;
              break;
            }
          }
          if (inputHandleName !== undefined) {
            const newEdge: Edge = {
              id: "" + Math.random(),
              source: addShaderLocation.sourceId,
              target: newNode.id,
              targetHandle: inputHandleName,
              type: "insert",
            };
            const newEdges = addEdge(newEdge, edges);
            const newNodes = propagateWidthHeightUpdates(
              [...nodes, newNode],
              newEdges,
              sourceNode.id,
            );
            setEdges(newEdges);
            setNodes(newNodes);
          }
        }
        setAddShaderLocation(null);
      } else {
        newNode.position = addShaderLocation.position;
        setAddShaderLocation(null);
        setNodes((snapshot) => [...snapshot, newNode]);
      }
    },
    [addShaderLocation, nodes, edges, screenToFlowPosition, store],
  );

  const handleInsertShader = useCallback(
    (shader: Shader, edgeId: string) => {
      const oldEdge = edges.find((edge) => edge.id === edgeId);
      if (!oldEdge) return;
      const edgeStartId = oldEdge.source;
      const edgeEndId = oldEdge.target;
      const startNode = nodes.find((node) => node.id === edgeStartId);
      const endNode = nodes.find((node) => node.id === edgeEndId);
      const endHandle = oldEdge.targetHandle;
      if (startNode && endNode && endHandle) {
        const newNode = createShaderNode(shader);
        const fields = extractFields(newNode.data.shader);
        let inputHandleName: string | undefined;
        for (const field of fields) {
          if (field.type === "sampler2D" && field.source === "input") {
            inputHandleName = field.name;
            break;
          }
        }
        if (inputHandleName === undefined) return;

        const [_, labelX, labelY] = getSimpleBezierPath({
          sourceX: startNode.position.x,
          sourceY: startNode.position.y,
          sourcePosition: Position.Bottom,
          targetX: endNode.position.x,
          targetY: endNode.position.y,
          targetPosition: Position.Top,
        });

        newNode.position.x = labelX;
        newNode.position.y = labelY;

        const edgesWithoutConnection = edges.filter((e) => e.id !== edgeId);
        const intoEdge: Edge = {
          id: "" + Math.random() * 10000,
          source: startNode.id,
          target: newNode.id,
          targetHandle: inputHandleName,
          type: "insert",
        };
        const outOfEdge: Edge = {
          id: "" + Math.random() * 10000,
          source: newNode.id,
          target: endNode.id,
          targetHandle: endHandle,
          type: "insert",
        };
        edgesWithoutConnection.push(intoEdge);
        edgesWithoutConnection.push(outOfEdge);
        setEdges(edgesWithoutConnection);
        setNodes(
          propagateWidthHeightUpdates(
            [...nodes, newNode],
            edgesWithoutConnection,
            startNode.id,
          ),
        );
      }
    },
    [nodes, edges],
  );

  const handleUpdateNode = useCallback(
    (
      nodeId: string,
      updateData: (snapshot: ShaderNodeData) => ShaderNodeData,
    ) => {
      setNodes((snapshot) => {
        const updated = snapshot.map((node) => {
          if (node.id === nodeId && node.type === "shader") {
            const shaderNode = node as ShaderNode;
            return { ...shaderNode, data: updateData(shaderNode.data) };
          }
          return node;
        });
        return propagateWidthHeightUpdates(updated, edges, nodeId);
      });
    },
    [edges],
  );

  const handleCopy = useCallback(() => {
    const selected = selectedNodesRef.current;
    if (selected.length === 0) return;
    const selectedIds = new Set(selected.map((n) => n.id));
    const internalEdges = edges.filter(
      (e) => selectedIds.has(e.source) && selectedIds.has(e.target),
    );
    const clipboardUniforms: Record<string, Uniforms> = {};
    const clipboardUniformExpressions: UniformExpressions = {};
    for (const node of selected) {
      if (uniformRef.current[node.id])
        clipboardUniforms[node.id] = uniformRef.current[node.id];
      if (uniformExpressions[node.id])
        clipboardUniformExpressions[node.id] = uniformExpressions[node.id];
    }
    navigator.clipboard
      .writeText(
        JSON.stringify({
          __sequenza_clipboard__: true,
          nodes: selected,
          edges: internalEdges,
          uniforms: clipboardUniforms,
          uniformExpressions: clipboardUniformExpressions,
        }),
      )
      .catch(console.error);
  }, [edges, uniformRef, uniformExpressions]);

  const handlePasteNodes = useCallback(
    (data: {
      nodes: Node[];
      edges: Edge[];
      uniforms: Record<string, Uniforms>;
      uniformExpressions?: UniformExpressions;
    }) => {
      const idMap = new Map<string, string>();
      for (const node of data.nodes) {
        idMap.set(node.id, `${Math.random() * 100000}`);
      }
      const newExprEntries: UniformExpressions = {};
      const newNodes: Node[] = data.nodes.map((node) => {
        const newId = idMap.get(node.id)!;
        const shaderNode = node as ShaderNode;
        const newShader = { ...shaderNode.data.shader, id: newId };
        uniformRef.current[newId] = data.uniforms[node.id] ?? {};
        newExprEntries[newId] = data.uniformExpressions?.[node.id] ?? {};
        return {
          ...shaderNode,
          id: newId,
          position: { x: node.position.x + 50, y: node.position.y + 50 },
          data: { ...shaderNode.data, shader: newShader, uniforms: uniformRef },
          selected: false,
        };
      });
      const newEdges: Edge[] = data.edges
        .filter((e) => idMap.has(e.source) && idMap.has(e.target))
        .map((edge) => ({
          ...edge,
          id: `${Math.random() * 100000}`,
          source: idMap.get(edge.source)!,
          target: idMap.get(edge.target)!,
        }));
      setUniformExpressions((prev) => ({ ...prev, ...newExprEntries }));
      setNodes((prev) => [...prev, ...newNodes]);
      setEdges((prev) => [...prev, ...newEdges]);
    },
    [uniformRef, setUniformExpressions],
  );

  const handleImport = useCallback(
    (json: string) => {
      try {
        const data = JSON.parse(json) as {
          uniforms: Record<string, Uniforms>;
          shader: Patch;
          uniformExpressions?: UniformExpressions;
        };
        const domNode = store.getState().domNode;
        const center = domNode
          ? (() => {
              const rect = domNode.getBoundingClientRect();
              return screenToFlowPosition({
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
              });
            })()
          : { x: 0, y: 0 };

        const {
          nodes: rawNodes,
          edges: newEdges,
          uniforms: newUniforms,
          idMap,
        } = buildEditorState(data.shader, data.uniforms, center);

        for (const [newId, value] of Object.entries(newUniforms)) {
          uniformRef.current[newId] = value;
        }
        if (data.uniformExpressions) {
          const remapped: UniformExpressions = {};
          for (const [oldId, exprs] of Object.entries(data.uniformExpressions)) {
            const newId = idMap.get(oldId);
            if (newId) remapped[newId] = exprs;
          }
          setUniformExpressions((prev) => ({ ...prev, ...remapped }));
        }
        const newNodes: Node[] = rawNodes.map((node) => ({
          ...node,
          data: { ...node.data, uniforms: uniformRef },
        }));
        setNodes((prev) => [...prev, ...newNodes]);
        setEdges((prev) => [...prev, ...newEdges]);
      } catch (e) {
        console.error(e);
      }
    },
    [screenToFlowPosition, store, uniformRef, setUniformExpressions],
  );

  const [edgesHash, edgeMap] = useMemo(() => {
    const edgeMap: Record<string, Connection[]> = {};
    for (const node of nodes) edgeMap[node.id] = [];
    for (const edge of edges) {
      edgeMap[edge.target].push({
        from: edge.source,
        to: edge.target,
        input: edge.targetHandle ?? "",
      });
    }
    return [JSON.stringify(edgeMap), edgeMap];
  }, [edges, nodes]);

  const [shaderHash, shaderMap] = useMemo(() => {
    const shaderMap: Record<string, Shader> = {};
    for (const node of nodes) {
      if (node.type === "shader") {
        const shaderNode = node as ShaderNode;
        shaderMap[shaderNode.id] = shaderNode.data.shader;
      }
    }
    return [JSON.stringify(shaderMap), shaderMap];
  }, [nodes]);

  const patches = useMemo<Record<string, Patch>>(() => {
    const patches: Record<string, Patch> = {};
    for (const [nodeId, shader] of Object.entries(shaderMap)) {
      patches[nodeId] = { shaders: [shader], connections: [] };
      const queue: string[] = [nodeId];
      while (queue.length !== 0) {
        const dependentNodeId = queue.shift()!;
        for (const incomingConnection of edgeMap[dependentNodeId]) {
          const dependencyNodeId = incomingConnection.from;
          queue.push(dependencyNodeId);
          const dependencyShader = shaderMap[dependencyNodeId];
          if (
            !patches[nodeId].shaders.find(
              (s) => s.id === dependencyShader.id,
            )
          )
            patches[nodeId].shaders.push(dependencyShader);
          patches[nodeId].connections.push(incomingConnection);
        }
      }
    }
    return patches;
  }, [shaderHash, edgesHash]);

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onConnectEnd,
    isValidConnection,
    addShaderDialogOpen,
    setAddShaderDialogOpen,
    addShaderLocation,
    setAddShaderLocation,
    handleAddShader,
    handleInsertShader,
    handleUpdateNode,
    handleCopy,
    handlePasteNodes,
    handleImport,
    shaderMap,
    shaderHash,
    patches,
  };
}
