import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";

import {
  extractFields,
  type Connection,
  type Patch,
  type Shader,
  type Uniforms,
} from "@sequenza/lib";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Controls,
  getOutgoers,
  getSimpleBezierPath,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useOnSelectionChange,
  useStoreApi,
  type Edge,
  type Node,
  type OnConnect,
  type OnConnectEnd,
  type OnEdgesChange,
  type OnNodesChange,
  type XYPosition,
} from "@xyflow/react";
import { ShaderNode, type ShaderNodeData } from "./ShaderNode";
import { EditorContext } from "./EditorContext";
import CustomEdge from "./CustomEdge";
import ConnectionLine from "./ConnectionLine";
import { ExportDialog } from "./ExportDialog";
import { AddShaderDialog } from "./AddShaderDialog";
import { ContextMenu } from "@base-ui/react/context-menu";
import { topologicalMap } from "./util";
import { importPatchToGraph } from "./importPatch";

interface EditorProps {
  shaders: Shader[];
  locked?: true;
  initialState?: {
    nodes: Node[];
    edges: Edge[];
    uniforms: Record<string, Uniforms>;
  };
  handleSave: (data: {
    nodes: Node[];
    edges: Edge[];
    uniforms: Record<string, Uniforms>;
  }) => void;
  className?: string;
  initialShowStats?: boolean;
  initialOpenPreviewNodeId?: string | null;
  onEditorStateChange?: (state: {
    showStats: boolean;
    addShaderPanelOpen: boolean;
  }) => void;
  onOpenPreviewNodeIdChange?: (nodeId: string | null) => void;
}

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

const EditorAux: FC<EditorProps> = ({
  shaders,
  initialState,
  handleSave,
  className,
  initialShowStats,
  initialOpenPreviewNodeId,
  onOpenPreviewNodeIdChange,
  locked,
}) => {
  const [edges, setEdges] = useState<Edge[]>(initialState?.edges ?? []);
  const [nodes, setNodes] = useState<Node[]>(() => {
    const initialNodes = initialState?.nodes ?? [];
    const initialEdges = initialState?.edges ?? [];
    return propagateWidthHeightUpdates(initialNodes, initialEdges);
  });

  type Command = {
    addedNodes: Node[];
    removedNodes: Node[];
    addedEdges: Edge[];
    removedEdges: Edge[];
  };

  const undoStack = useRef<Command[]>([]);
  const redoStack = useRef<Command[]>([]);

  const pushCommand = useCallback((cmd: Command) => {
    undoStack.current.push(cmd);
    redoStack.current = [];
  }, []);

  const handleUndo = useCallback(() => {
    const cmd = undoStack.current.pop();
    if (!cmd) return;
    redoStack.current.push(cmd);
    setNodes((prev) => {
      const withoutAdded = prev.filter(
        (n) => !cmd.addedNodes.some((a) => a.id === n.id),
      );
      return [...withoutAdded, ...cmd.removedNodes];
    });
    setEdges((prev) => {
      const withoutAdded = prev.filter(
        (e) => !cmd.addedEdges.some((a) => a.id === e.id),
      );
      return [...withoutAdded, ...cmd.removedEdges];
    });
  }, []);

  const handleRedo = useCallback(() => {
    const cmd = redoStack.current.pop();
    if (!cmd) return;
    undoStack.current.push(cmd);
    setNodes((prev) => {
      const withoutRemoved = prev.filter(
        (n) => !cmd.removedNodes.some((r) => r.id === n.id),
      );
      return [...withoutRemoved, ...cmd.addedNodes];
    });
    setEdges((prev) => {
      const withoutRemoved = prev.filter(
        (e) => !cmd.removedEdges.some((r) => r.id === e.id),
      );
      return [...withoutRemoved, ...cmd.addedEdges];
    });
  }, []);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      const removals = changes.filter((c) => c.type === "remove");
      if (removals.length > 0) {
        const removedIds = new Set(removals.map((c) => c.id));
        setNodes((prev) => {
          const removedNodes = prev.filter((n) => removedIds.has(n.id));
          setEdges((prevEdges) => {
            const removedEdges = prevEdges.filter(
              (e) => removedIds.has(e.source) || removedIds.has(e.target),
            );
            if (removedNodes.length > 0 || removedEdges.length > 0) {
              pushCommand({
                addedNodes: [],
                removedNodes,
                addedEdges: [],
                removedEdges,
              });
            }
            return applyEdgeChanges(
              removedEdges.map((e) => ({ type: "remove", id: e.id })),
              prevEdges,
            );
          });
          return applyNodeChanges(changes, prev);
        });
      } else {
        setNodes((prev) => applyNodeChanges(changes, prev));
      }
    },
    [pushCommand],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      const removals = changes.filter((c) => c.type === "remove");
      if (removals.length > 0) {
        const removedIds = new Set(removals.map((c) => c.id));
        setEdges((prev) => {
          const removedEdges = prev.filter((e) => removedIds.has(e.id));
          if (removedEdges.length > 0) {
            pushCommand({
              addedNodes: [],
              removedNodes: [],
              addedEdges: [],
              removedEdges,
            });
          }
          return applyEdgeChanges(changes, prev);
        });
      } else {
        setEdges((prev) => applyEdgeChanges(changes, prev));
      }
    },
    [pushCommand],
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
      const addedEdge = newEdges.find(
        (e) => !edges.some((old) => old.id === e.id),
      );
      if (addedEdge) {
        pushCommand({
          addedNodes: [],
          removedNodes: [],
          addedEdges: [addedEdge],
          removedEdges: [],
        });
      }
      setEdges(newEdges);
      setNodes(newNodes);
    },
    [edges, nodes, pushCommand],
  );

  const { screenToFlowPosition } = useReactFlow();

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
          position: screenToFlowPosition({
            x: clientX,
            y: clientY,
          }),
          sourceId: connectionState.fromNode.id,
        });
        setAddShaderDialogOpen(true);
      }
    },
    [screenToFlowPosition],
  );

  const uniformRef = useRef<Record<string, Uniforms>>(
    initialState?.uniforms ?? {},
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
                  shader: {
                    ...shaderNode.data.shader,
                    source: newShader.source,
                  },
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

  const handleCopy = useCallback(() => {
    const selected = selectedNodesRef.current;
    if (selected.length === 0) return;
    const selectedIds = new Set(selected.map((n) => n.id));
    const internalEdges = edges.filter(
      (e) => selectedIds.has(e.source) && selectedIds.has(e.target),
    );
    const clipboardUniforms: Record<string, Uniforms> = {};
    for (const node of selected) {
      if (uniformRef.current[node.id])
        clipboardUniforms[node.id] = uniformRef.current[node.id];
    }
    navigator.clipboard
      .writeText(
        JSON.stringify({
          __sequenza_clipboard__: true,
          nodes: selected,
          edges: internalEdges,
          uniforms: clipboardUniforms,
        }),
      )
      .catch(console.error);
  }, [edges]);

  const handlePasteNodes = useCallback(
    (data: {
      nodes: Node[];
      edges: Edge[];
      uniforms: Record<string, Uniforms>;
    }) => {
      const idMap = new Map<string, string>();
      for (const node of data.nodes) {
        idMap.set(node.id, `${Math.random() * 100000}`);
      }

      const newNodes: Node[] = data.nodes.map((node) => {
        const newId = idMap.get(node.id)!;
        const shaderNode = node as ShaderNode;
        const newShader = { ...shaderNode.data.shader, id: newId };
        uniformRef.current[newId] = data.uniforms[node.id] ?? {};
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

      pushCommand({
        addedNodes: newNodes,
        removedNodes: [],
        addedEdges: newEdges,
        removedEdges: [],
      });
      setNodes((prev) => [...prev, ...newNodes]);
      setEdges((prev) => [...prev, ...newEdges]);
    },
    [pushCommand],
  );

  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const inInput =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;

      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave({ nodes, edges, uniforms: uniformRef.current });
        setSavedAt(new Date());
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "c" && !inInput) {
        handleCopy();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !inInput) {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nodes, edges, handleCopy, handleUndo, handleRedo]);

  const createShaderNode = (shader: Shader): ShaderNode => {
    const newId = `${Math.random() * 100000}`;
    const newShader: Shader = { ...shader, id: newId };
    uniformRef.current[newId] = {};

    return {
      id: newId,
      position: { x: 0, y: 0 },
      data: {
        shader: newShader,
        uniforms: uniformRef,
        paused: false,
      },
      type: "shader",
    };
  };

  const store = useStoreApi();
  const handleAddShader = useCallback(
    (shader: Shader) => {
      const newNode = createShaderNode(shader);

      if (addShaderLocation === null) {
        const domNode = store.getState().domNode;
        if (domNode) {
          const domRect = domNode.getBoundingClientRect();
          const pos = screenToFlowPosition({
            x: domRect.x + domRect.width / 2,
            y: domRect.y + domRect.height / 2,
          });
          newNode.position = pos;
        }
      } else if (addShaderLocation.sourceId) {
        handleAppendShader(
          shader,
          addShaderLocation.sourceId,
          addShaderLocation.position,
        );
        return;
      } else {
        newNode.position = addShaderLocation.position;
      }

      setAddShaderLocation(null);
      pushCommand({
        addedNodes: [newNode],
        removedNodes: [],
        addedEdges: [],
        removedEdges: [],
      });
      setNodes((snapshot) => [...snapshot, newNode]);
    },
    [addShaderLocation, pushCommand],
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
        let inputHandleName: string | undefined = undefined;
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

        const edgesWithoutConnection = edges.filter(
          (edge) => edge.id !== edgeId,
        );
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
        pushCommand({
          addedNodes: [newNode],
          removedNodes: [],
          addedEdges: [intoEdge, outOfEdge],
          removedEdges: [oldEdge],
        });
        setEdges(edgesWithoutConnection);
        const updatedNodes = propagateWidthHeightUpdates(
          [...nodes, newNode],
          edgesWithoutConnection,
          startNode.id,
        );
        setNodes(updatedNodes);
      }
    },
    [nodes, edges, pushCommand],
  );

  const [edgesHash, edgeMap] = useMemo(() => {
    const edgeMap: Record<string, Connection[]> = {};

    for (const node of nodes) {
      edgeMap[node.id] = [];
    }

    for (const edge of edges) {
      edgeMap[edge.target].push({
        from: edge.source,
        to: edge.target,
        input: edge.targetHandle ?? "",
      });
    }

    const hash = JSON.stringify(edgeMap);
    return [hash, edgeMap];
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

  /**
   * patches[i] gives the patch for shader node with id [i]
   */
  const patches = useMemo<Record<string, Patch>>(() => {
    // maps shader id to patch for that shader
    const patches: Record<string, Patch> = {};

    for (const [nodeId, shader] of Object.entries(shaderMap)) {
      patches[nodeId] = { shaders: [shader], connections: [] };

      const queue: string[] = [nodeId]; // nodes to traverse

      while (queue.length !== 0) {
        const dependentNodeId = queue.shift()!;
        for (const incomingConnection of edgeMap[dependentNodeId]) {
          const dependencyNodeId = incomingConnection.from;
          queue.push(dependencyNodeId);
          const dependencyShader = shaderMap[dependencyNodeId];
          if (
            !patches[nodeId].shaders.find(
              (shader) => shader.id === dependencyShader.id,
            )
          )
            patches[nodeId].shaders.push(dependencyShader);
          patches[nodeId].connections.push(incomingConnection);
        }
      }
    }
    return patches;
  }, [shaderHash, edgesHash]);

  const handleUpdateUniforms = useCallback(
    (
      shaderId: string,
      updateUniformCallback: (current: Uniforms) => Uniforms,
    ) => {
      uniformRef.current[shaderId] = updateUniformCallback(
        uniformRef.current[shaderId],
      );
    },
    [],
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
            const newNodeData = updateData(shaderNode.data);
            return { ...shaderNode, data: newNodeData };
          }
          return node;
        });
        return propagateWidthHeightUpdates(updated, edges, nodeId);
      });
    },
    [edges],
  );

  const timeRef = useRef<number>(0);
  const mousePosRef = useRef<[number, number]>([0, 0]);

  useEffect(() => {
    const interval = setInterval(() => {
      timeRef.current = Date.now();
    }, 10);

    const onMouseMove = (e: MouseEvent) => {
      mousePosRef.current = [
        Math.min(1, e.clientX / window.innerWidth),
        Math.min(e.clientY / innerHeight, 1),
      ];
    };

    window.addEventListener("mousemove", onMouseMove);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  const handleAppendShader = useCallback(
    (shader: Shader, sourceId: string, position: XYPosition) => {
      const sourceNode = nodes.find((node) => node.id === sourceId);
      if (sourceNode) {
        const newNode = createShaderNode(shader);

        newNode.position = position;

        const fields = extractFields(newNode.data.shader);
        let inputHandleName: string | undefined = undefined;
        for (const field of fields) {
          if (field.type === "sampler2D" && field.source === "input") {
            inputHandleName = field.name;
            break;
          }
        }

        if (inputHandleName !== undefined) {
          const newEdge: Edge = {
            id: "" + Math.random(),
            source: sourceId,
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
          pushCommand({
            addedNodes: [newNode],
            removedNodes: [],
            addedEdges: [newEdge],
            removedEdges: [],
          });
          setEdges(newEdges);
          setNodes(newNodes);
        }
      }
    },
    [nodes, edges, pushCommand],
  );

  const handleImport = useCallback(
    (json: string) => {
      try {
        const data = JSON.parse(json) as {
          uniforms: Record<string, Uniforms>;
          shader: Patch;
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
          idMap,
        } = importPatchToGraph(data.shader, center);

        for (const [oldId, newId] of idMap) {
          uniformRef.current[newId] = data.uniforms[oldId] ?? {};
        }

        const newNodes: Node[] = rawNodes.map(({ id, position, shader }) => ({
          id,
          position,
          data: { shader, uniforms: uniformRef, paused: false },
          type: "shader",
        }));

        setNodes((prev) => [...prev, ...newNodes]);
        setEdges((prev) => [...prev, ...newEdges]);
      } catch (e) {
        console.error(e);
      }
    },
    [screenToFlowPosition, store],
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      const text = e.clipboardData?.getData("text/plain");
      if (!text) return;
      try {
        const parsed = JSON.parse(text);
        if (parsed.__sequenza_clipboard__) {
          handlePasteNodes(parsed);
          return;
        }
      } catch (error: unknown) {
        console.log("imported value treated as JSON import, ", error);
      }
      handleImport(text);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleImport, handlePasteNodes]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showStats, setShowStats] = useState(initialShowStats ?? false);
  const [addShaderDialogOpen, setAddShaderDialogOpen] = useState(false);
  const [openExportNodeId, setOpenExportNodeId] = useState<string | null>(null);
  const [openPreviewNodeId, setOpenPreviewNodeIdState] = useState<
    string | null
  >(initialOpenPreviewNodeId ?? null);
  const setOpenPreviewNodeId = (id: string | null) => {
    setOpenPreviewNodeIdState(id);
    onOpenPreviewNodeIdChange?.(id);
  };

  return (
    <>
      <ContextMenu.Root>
        <ContextMenu.Trigger
          render={
            <div className={`w-full h-full ${className} relative`}>
              <EditorContext.Provider
                value={{
                  currentTime: timeRef,
                  mousePosition: mousePosRef,
                  shaders,
                  patches,
                  showStats,
                  openExportNodeId,
                  setOpenExportNodeId,
                  openPreviewNodeId,
                  setOpenPreviewNodeId,
                  uniforms: uniformRef,
                  handleUpdateUniforms,
                  handleUpdateNode,
                  handleInsertShader,
                }}
              >
                <ReactFlow
                  preventScrolling={!locked}
                  panOnScroll={!locked}
                  proOptions={{ hideAttribution: true }}
                  nodes={nodes}
                  nodeTypes={{ shader: ShaderNode }}
                  edges={edges}
                  edgeTypes={{ insert: CustomEdge }}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onConnectEnd={onConnectEnd}
                  connectionLineComponent={ConnectionLine}
                  isValidConnection={isValidConnection}
                  minZoom={0.1}
                  style={{
                    background: "#F1F1F1",
                  }}
                  fitView
                >
                  {!locked && (
                    <Controls
                      style={
                        {
                          "--xy-controls-button-background-color-default":
                            "transparent",
                          "--xy-controls-box-shadow-default": "none",
                        } as any
                      }
                    ></Controls>
                  )}
                  {!locked && (
                    <Panel
                      position="top-right"
                      className="flex flex-col gap-4 items-end"
                    >
                      <div className="flex gap-1 p-1 bg-white rounded-md w-min">
                        <button
                          className="button-base flex items-center gap-1"
                          onClick={() => setAddShaderDialogOpen(true)}
                        >
                          Add Shader
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#000000"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 5l0 14" />
                            <path d="M5 12l14 0" />
                          </svg>
                        </button>

                        <button
                          className="button-base"
                          onClick={() => setShowStats(!showStats)}
                        >
                          {showStats ? "Hide Stats" : "Show Stats"}
                        </button>
                        <button
                          className="button-base"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Import
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            file.text().then((text) => handleImport(text));
                            e.target.value = "";
                          }}
                        />
                      </div>
                      {showStats && (
                        <>
                          <div className="flex flex-col gap-2">
                            {nodes.map((node) => (
                              <p
                                className="text-xs text-neutral-400"
                                key={node.id}
                              >
                                {node.id}
                              </p>
                            ))}
                          </div>
                          <div className="flex flex-col gap-2">
                            {edges.map((edge) => (
                              <p
                                className="text-xs text-neutral-400"
                                key={edge.id}
                              >
                                {edge.source} {">"} {edge.target}{" "}
                                {edge.targetHandle}
                              </p>
                            ))}
                          </div>
                        </>
                      )}
                    </Panel>
                  )}
                  {savedAt && (
                    <Panel position="bottom-center">
                      <p className="text-xs text-neutral-400">
                        Last saved at {savedAt.toLocaleTimeString()}
                      </p>
                    </Panel>
                  )}
                </ReactFlow>
              </EditorContext.Provider>
              {openExportNodeId !== null && patches[openExportNodeId] && (
                <ExportDialog
                  uniforms={uniformRef.current}
                  patch={patches[openExportNodeId]}
                  open={true}
                  onOpenChange={(open) => {
                    if (!open) setOpenExportNodeId(null);
                  }}
                />
              )}
              <AddShaderDialog
                open={addShaderDialogOpen}
                handleOpenChange={setAddShaderDialogOpen}
                shaders={shaders}
                handleAddShader={handleAddShader}
              />
            </div>
          }
        />
        <ContextMenu.Portal>
          <ContextMenu.Backdrop />
          <ContextMenu.Positioner>
            <ContextMenu.Popup className="w-32 h-min bg-white outline-none flex flex-col p-1 rounded-md">
              <ContextMenu.Item
                onClick={(e) => {
                  const pos = screenToFlowPosition({
                    x: e.clientX,
                    y: e.clientY,
                  });
                  setAddShaderLocation({ position: pos });
                  setAddShaderDialogOpen(true);
                }}
                className="button-base w-full"
              >
                Add Node
              </ContextMenu.Item>
            </ContextMenu.Popup>
          </ContextMenu.Positioner>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    </>
  );
};

export const Editor: FC<EditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <EditorAux {...props}></EditorAux>
    </ReactFlowProvider>
  );
};
