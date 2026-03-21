import { createContext, type RefObject } from "react";
import type { Patch, Shader, Uniforms } from "@sequenza/lib";
import type { ShaderNodeData } from "./ShaderNode";

interface EditorContextType {
  currentTime: RefObject<number>;
  mousePosition: RefObject<[number, number]>; // mouse position relative to screen dimensions on scale of 0-1
  shaders: Shader[];
  patches: Record<string, Patch>;
  uniforms: RefObject<Record<string, Uniforms>>;
  showStats: boolean;
  openExportNodeId: string | null;
  setOpenExportNodeId: (id: string | null) => void;
  openPreviewNodeId: string | null;
  setOpenPreviewNodeId: (id: string | null) => void;
  handleUpdateUniforms: (
    shaderId: string,
    uniformUpdateCallback: (current: Uniforms) => Uniforms,
  ) => void;
  handleUpdateNode: (
    nodeId: string,
    data: (snapshot: ShaderNodeData) => ShaderNodeData,
  ) => void;
  handleInsertShader: (shader: Shader, edgeId: string) => void;
}

export const EditorContext = createContext<EditorContextType>({
  currentTime: { current: 0 },
  mousePosition: { current: [0, 0] },
  shaders: [],
  patches: {},
  showStats: false,
  openExportNodeId: null,
  setOpenExportNodeId: () => {},
  openPreviewNodeId: null,
  setOpenPreviewNodeId: () => {},
  uniforms: { current: {} },
  handleUpdateUniforms: () => {},
  handleUpdateNode: (snapshot) => snapshot,
  handleInsertShader: () => {},
});
