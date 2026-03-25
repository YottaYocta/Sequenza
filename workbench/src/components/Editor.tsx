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
import { Dialog } from "./Dialog";
import { ExportDialog } from "./ExportDialog";

interface EditorProps {
  shaders: Shader[];
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
  initialShaderPanelOpen?: boolean;
  initialOpenPreviewNodeId?: string | null;
  onEditorStateChange?: (state: {
    showStats: boolean;
    shaderPanelOpen: boolean;
  }) => void;
  onOpenPreviewNodeIdChange?: (nodeId: string | null) => void;
}

function propagateWidthHeightUpdates(
  nodes: Node[],
  edges: Edge[],
  startNodeId: string,
): Node[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const queue: string[] = [startNodeId];

  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodeMap.get(id);
    if (!node || node.type !== "shader") continue;
    const shaderNode = node as ShaderNode;
    const { width, height } = shaderNode.data.shader.resolution;

    const outgoers = getOutgoers(
      node,
      [...nodeMap.values()],
      edges,
    ) as ShaderNode[];

    for (const outgoer of outgoers) {
      const updated: ShaderNode = {
        ...outgoer,
        data: {
          ...outgoer.data,
          shader: {
            ...outgoer.data.shader,
            resolution: { width: width, height: height },
          },
        },
      };
      nodeMap.set(outgoer.id, updated);
      queue.push(outgoer.id);
    }
  }

  return [...nodeMap.values()];
}

const EditorAux: FC<EditorProps> = ({
  shaders,
  initialState,
  handleSave,
  className,
  initialShowStats,
  initialShaderPanelOpen,
  initialOpenPreviewNodeId,
  onEditorStateChange,
  onOpenPreviewNodeIdChange,
}) => {
  const [edges, setEdges] = useState<Edge[]>(initialState?.edges ?? []);
  const [nodes, setNodes] = useState<Node[]>(() => {
    const initialNodes = initialState?.nodes ?? [];
    const initialEdges = initialState?.edges ?? [];
    const targetIds = new Set(initialEdges.map((e) => e.target));
    const rootIds = initialNodes
      .filter((n) => !targetIds.has(n.id))
      .map((n) => n.id);
    let result = initialNodes;
    for (const rootId of rootIds) {
      result = propagateWidthHeightUpdates(result, initialEdges, rootId);
    }
    return result;
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

  const [dropLocation, setDropLocation] = useState<null | {
    position: XYPosition;
    sourceId: string;
  }>(null);

  const onConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      if (!connectionState.isValid && connectionState.fromNode) {
        const { clientX, clientY } =
          "changedTouches" in event ? event.changedTouches[0] : event;
        setDropLocation({
          position: screenToFlowPosition({
            x: clientX,
            y: clientY,
          }),
          sourceId: connectionState.fromNode.id,
        });
      }
    },
    [screenToFlowPosition],
  );

  const uniformRef = useRef<Record<string, Uniforms>>(
    initialState?.uniforms ?? {},
  );

  useEffect(() => {
    if (initialState?.uniforms) uniformRef.current = initialState.uniforms;
  }, [initialState]);

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

  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave({ nodes, edges, uniforms: uniformRef.current });
        setSavedAt(new Date());
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nodes, edges]);

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
  const handleAddShader = (shader: Shader) => {
    const newNode = createShaderNode(shader);
    const domNode = store.getState().domNode;

    if (domNode) {
      const domRect = domNode.getBoundingClientRect();
      const pos = screenToFlowPosition({
        x: domRect.x + domRect.width / 2,
        y: domRect.y + domRect.height / 2,
      });
      newNode.position = pos;
    }

    setNodes((snapshot) => [...snapshot, newNode]);
  };

  const handleInsertShader = (shader: Shader, edgeId: string) => {
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

      setNodes((snapshot) => [...snapshot, newNode]);
      setEdges((snapshot) => {
        const edgesWithoutConnection = snapshot.filter(
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
        return edgesWithoutConnection;
      });
    }
  };

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
            return { ...shaderNode, data: updateData(shaderNode.data) };
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
          console.log(newEdges);
          console.log(newNodes);
          setEdges(newEdges);
          setNodes(newNodes);
        }
      }
    },
    [nodes, edges],
  );

  const [shaderSearch, setShaderSearch] = useState("");
  const [shaderDialogSearch, setShaderDialogSearch] = useState("");
  const [showStats, setShowStats] = useState(initialShowStats ?? false);
  const [shaderPanelOpen, setShaderPanelOpen] = useState(
    initialShaderPanelOpen ?? true,
  );
  const [openExportNodeId, setOpenExportNodeId] = useState<string | null>(null);
  const [openPreviewNodeId, setOpenPreviewNodeIdState] = useState<
    string | null
  >(initialOpenPreviewNodeId ?? null);
  const setOpenPreviewNodeId = (id: string | null) => {
    setOpenPreviewNodeIdState(id);
    onOpenPreviewNodeIdChange?.(id);
  };

  useEffect(() => {
    onEditorStateChange?.({ showStats, shaderPanelOpen });
  }, [showStats, shaderPanelOpen]);

  return (
    <div className={`w-full h-full ${className}`}>
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
          panOnScroll={true}
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
          style={{
            background: "#F3F3F3",
          }}
          fitView
        >
          <Controls
            style={
              {
                "--xy-controls-button-background-color-default": "transparent",
                "--xy-controls-box-shadow-default": "none",
              } as any
            }
          ></Controls>
          <Panel position="top-left" className="flex flex-col gap-4">
            <button
              className="button-base"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? "Hide Stats" : "Show Stats"}
            </button>
            {showStats && (
              <>
                <div className="flex flex-col gap-2">
                  {nodes.map((node) => (
                    <p className="text-xs text-neutral-400" key={node.id}>
                      {node.id}
                    </p>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  {edges.map((edge) => (
                    <p className="text-xs text-neutral-400" key={edge.id}>
                      {edge.source} {">"} {edge.target} {edge.targetHandle}
                    </p>
                  ))}
                </div>
              </>
            )}
          </Panel>
          {shaders.length > 0 && (
            <Panel position="bottom-right">
              <div className="w-56 flex flex-col rounded-sm bg-white overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2">
                  <p className="text-sm">Add Shader</p>
                  <button
                    className="button-base"
                    onClick={() => setShaderPanelOpen(!shaderPanelOpen)}
                  >
                    {shaderPanelOpen ? "Hide" : "Show"}
                  </button>
                </div>
                {shaderPanelOpen && (
                  <div className="flex flex-col gap-1 px-2 pb-2">
                    <input
                      type="text"
                      value={shaderSearch}
                      onChange={(e) => setShaderSearch(e.target.value)}
                      placeholder="Search shaders..."
                      className="text-xs p-1 rounded-sm border border-neutral-200 outline-none mb-1"
                    />
                    <div className="flex flex-col gap-1 pb-2 h-[50vh] overflow-y-auto">
                      {shaders
                        .filter((s) =>
                          s.name
                            .toLowerCase()
                            .includes(shaderSearch.toLowerCase()),
                        )
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((shader) => (
                          <button
                            key={shader.id}
                            className="text-xs flex justify-start p-1 rounded-sm hover:bg-neutral-100 cursor-pointer text-neutral-500"
                            onClick={() => handleAddShader(shader)}
                          >
                            {shader.id.length > 25
                              ? `${shader.id.slice(0, 11)}...${shader.id.slice(-11)}`
                              : shader.id}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
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
      <Dialog
        open={dropLocation === null ? false : true}
        handleOpenChange={(open) => {
          if (open === false) setDropLocation(null);
        }}
      >
        <div className="w-full h-full flex flex-col p-4 gap-4">
          <div className="w-full flex justify-between">
            <p>Add a Shader</p>
            <button
              className="button-base"
              onClick={() => {
                setDropLocation(null);
              }}
            >
              Close
            </button>
          </div>
          <div className="w-full flex flex-col h-full overflow-hidden gap-2">
            <input
              type="text"
              value={shaderDialogSearch}
              onChange={(e) => setShaderDialogSearch(e.target.value)}
              placeholder="Search shaders..."
              className="text-xs p-1 rounded-sm border border-neutral-200 outline-none mb-1"
            />
            <div className="h-full flex flex-col overflow-y-auto">
              {shaders
                .filter((s) =>
                  s.name
                    .toLowerCase()
                    .includes(shaderDialogSearch.toLowerCase()),
                )
                .map((shader) => (
                  <button
                    key={shader.id}
                    className="text-xs flex justify-start p-1 rounded-sm hover:bg-neutral-100 cursor-pointer text-neutral-500"
                    onClick={() => {
                      if (dropLocation) {
                        handleAppendShader(
                          shader,
                          dropLocation.sourceId,
                          dropLocation.position,
                        );
                        setDropLocation(null);
                      } else {
                        setDropLocation(null);
                      }
                    }}
                  >
                    {shader.id}
                  </button>
                ))}
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export const Editor: FC<EditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <EditorAux {...props}></EditorAux>
    </ReactFlowProvider>
  );
};
