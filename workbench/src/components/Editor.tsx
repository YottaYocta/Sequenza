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
  type Edge,
  type Node,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import { ShaderNode, type ShaderNodeData } from "./ShaderNode";
import { EditorContext } from "./EditorContext";
import CustomEdge from "./CustomEdge";

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
}

export const Editor: FC<EditorProps> = ({
  shaders,
  initialState,
  handleSave,
}) => {
  const [nodes, setNodes] = useState<Node[]>(initialState?.nodes ?? []);
  const [edges, setEdges] = useState<Edge[]>(initialState?.edges ?? []);

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

  const onConnect: OnConnect = useCallback((params) => {
    setEdges((snapshot) => addEdge({ ...params, type: "insert" }, snapshot));
  }, []);

  const uniformRef = useRef<Record<string, Uniforms>>(
    initialState?.uniforms ?? {},
  );
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
    return {
      id: newId,
      position: { x: 0, y: 0 },
      data: {
        shader: newShader,
        uniforms: uniformRef,
        resolution: [100, 100],
        paused: false,
      },
      type: "shader",
    };
  };

  const handleAddShader = (shader: Shader) => {
    setNodes((snapshot) => [...snapshot, createShaderNode(shader)]);
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
        if (field.type === "sampler2D" && field.texture === undefined) {
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
        };

        const outOfEdge: Edge = {
          id: "" + Math.random() * 10000,
          source: newNode.id,
          target: endNode.id,
          targetHandle: endHandle,
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
          patches[nodeId].shaders.push(dependencyShader);
          patches[nodeId].connections.push(incomingConnection);
        }
      }
    }
    return patches;
  }, [shaderHash, edgesHash]);

  const handleUpdateUniforms = useCallback(
    (shaderId: string, uniforms: Uniforms) => {
      uniformRef.current[shaderId] = uniforms;
    },
    [],
  );

  const handleUpdateNode = useCallback(
    (
      nodeId: string,
      updateData: (snapshot: ShaderNodeData) => ShaderNodeData,
    ) => {
      setNodes((snapshot) =>
        snapshot.map((node) => {
          if (node.id === nodeId && node.type === "shader") {
            const shaderNode = node as ShaderNode;
            return { ...shaderNode, data: updateData(shaderNode.data) };
          }
          return node;
        }),
      );
    },
    [],
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

  return (
    <div className="w-full h-full">
      <EditorContext.Provider
        value={{
          currentTime: timeRef,
          mousePosition: mousePosRef,
          shaders,
          patches,
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
          isValidConnection={isValidConnection}
          style={{
            background: "#F9F9F9",
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
          </Panel>
          <Panel position="top-right">
            <div className="p-4 flex flex-col rounded-sm border border-neutral-200 gap-4">
              <p className="text-sm p-1">Add Shader</p>
              <div className="flex flex-col gap-1">
                {shaders.map((shader) => (
                  <button
                    key={shader.id}
                    className="text-xs flex justify-start p-1 rounded-sm hover:bg-neutral-100 cursor-pointer text-neutral-500"
                    onClick={() => {
                      handleAddShader(shader);
                    }}
                  >
                    {shader.id}
                  </button>
                ))}
              </div>
            </div>
          </Panel>
          {savedAt && (
            <Panel position="bottom-center">
              <p className="text-xs text-neutral-400">
                Last saved at {savedAt.toLocaleTimeString()}
              </p>
            </Panel>
          )}
        </ReactFlow>
      </EditorContext.Provider>
    </div>
  );
};
