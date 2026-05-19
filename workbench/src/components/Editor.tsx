import { useCallback, useEffect, useRef, useState, type FC } from "react";

import { extractFields, type Shader, type Uniforms } from "@sequenza/lib";
import type { UniformExpressions } from "./EditorContext";

import {
  Controls,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import { ShaderNode } from "./ShaderNode";
import { EditorContext } from "./EditorContext";
import CustomEdge from "./CustomEdge";
import ConnectionLine from "./ConnectionLine";
import { ExportDialog } from "./ExportDialog";
import { AddShaderDialog } from "./AddShaderDialog";
import { GlobalTimeline } from "./GlobalTimeline";
import { ContextMenu } from "@base-ui/react/context-menu";
import { useGraphState } from "../hooks/useGraphState";
import { useUniformAnimation } from "../hooks/useUniformAnimation";

interface EditorProps {
  shaders: Shader[];
  locked?: true;
  initialState?: {
    nodes: Node[];
    edges: Edge[];
    uniforms: Record<string, Uniforms>;
    uniformExpressions?: UniformExpressions;
  };
  handleSave: (data: {
    nodes: Node[];
    edges: Edge[];
    uniforms: Record<string, Uniforms>;
    uniformExpressions: UniformExpressions;
  }) => void;
  className?: string;
  initialShowStats?: boolean;
  onEditorStateChange?: (state: {
    showStats: boolean;
    addShaderPanelOpen: boolean;
  }) => void;
}

const EditorAux: FC<EditorProps> = ({
  shaders,
  initialState,
  handleSave,
  className,
  initialShowStats,
  locked,
}) => {
  const uniformRef = useRef<Record<string, Uniforms>>(
    initialState?.uniforms ?? {},
  );

  const [uniformExpressions, setUniformExpressions] = useState<
    Record<string, Uniforms>
  >(initialState?.uniformExpressions ?? {});

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

  const handleUpdateUniformExpression = useCallback(
    (
      shaderId: string,
      fieldName: string,
      slotIndex: number | null,
      value: string | null,
      fieldLength?: number,
    ) => {
      setUniformExpressions((prev) => {
        const prevNode = prev[shaderId] ?? {};
        const next = { ...prevNode };
        if (slotIndex === null) {
          next[fieldName] = value as any;
        } else {
          const prevArr = Array.isArray(prevNode[fieldName])
            ? [...(prevNode[fieldName] as (string | null)[])]
            : null;
          const len = prevArr?.length ?? fieldLength ?? slotIndex + 1;
          const arr: (string | null)[] = prevArr ?? Array(len).fill(null);
          while (arr.length <= slotIndex) arr.push(null);
          arr[slotIndex] = value;
          next[fieldName] = (arr.every((s) => s === null) ? null : arr) as any;
        }
        return { ...prev, [shaderId]: next };
      });
    },
    [],
  );

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onConnectEnd,
    isValidConnection,
    addShaderDialogOpen,
    setAddShaderDialogOpen,
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
  } = useGraphState({
    shaders,
    initialState,
    uniformRef,
    uniformExpressions,
    setUniformExpressions,
  });

  useEffect(() => {
    setUniformExpressions((prev) => {
      const next = { ...prev };
      for (const [nodeId, shader] of Object.entries(shaderMap)) {
        if (!next[nodeId]) next[nodeId] = {};
        for (const field of extractFields(shader)) {
          if (field.type === "sampler2D") continue;
          if (
            field.defaultExpr !== undefined &&
            !(field.name in next[nodeId])
          ) {
            next[nodeId] = {
              ...next[nodeId],
              [field.name]: field.defaultExpr as any,
            };
          }
        }
      }
      for (const nodeId of Object.keys(next)) {
        if (!shaderMap[nodeId]) delete next[nodeId];
      }
      return next;
    });
  }, [shaderHash]);

  const { playing, setPlaying, resetTime, elapsedRef, mousePosition } =
    useUniformAnimation({ shaderMap, uniformRef, uniformExpressions });

  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [showStats, setShowStats] = useState(initialShowStats ?? false);
  const [openExportNodeId, setOpenExportNodeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave({
          nodes,
          edges,
          uniforms: uniformRef.current,
          uniformExpressions,
        });
        setSavedAt(new Date());
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        e.key === "c" &&
        !(document.activeElement instanceof HTMLInputElement) &&
        !(document.activeElement instanceof HTMLTextAreaElement)
      ) {
        handleCopy();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nodes, edges, uniformExpressions, handleCopy]);

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

  const { screenToFlowPosition } = useReactFlow();

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger
        render={
          <div className={`w-full h-full ${className} relative`}>
            <EditorContext.Provider
              value={{
                elapsedRef,
                playing,
                setPlaying,
                resetTime,
                mousePosition,
                shaders,
                patches,
                showStats,
                openExportNodeId,
                setOpenExportNodeId,
                uniforms: uniformRef,
                uniformExpressions,
                handleUpdateUniforms,
                handleUpdateUniformExpression,
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
                {!locked && <GlobalTimeline />}
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
                uniformsRef={uniformRef}
                uniformExpressions={uniformExpressions}
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
  );
};

export const Editor: FC<EditorProps> = (props) => {
  return (
    <ReactFlowProvider>
      <EditorAux {...props}></EditorAux>
    </ReactFlowProvider>
  );
};
