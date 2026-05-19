import { createContext, type RefObject } from "react";
import type { Patch, Shader, Uniforms } from "@sequenza/lib";
import type { ShaderNodeData } from "./ShaderNode";

export type UniformExpression = string | (string | null)[] | null;
export type NodeUniformExpressions = Record<string, UniformExpression>;
export type UniformExpressions = Record<string, NodeUniformExpressions>;

interface EditorContextType {
  elapsedRef: RefObject<number>;
  playing: boolean;
  setPlaying: (p: boolean) => void;
  resetTime: () => void;
  mousePosition: RefObject<[number, number]>; // mouse position relative to screen dimensions on scale of 0-1
  shaders: Shader[];
  patches: Record<string, Patch>;
  uniforms: RefObject<Record<string, Uniforms>>;
  uniformExpressions: UniformExpressions;
  showStats: boolean;
  openExportNodeId: string | null;
  setOpenExportNodeId: (id: string | null) => void;
  handleUpdateUniforms: (
    shaderId: string,
    uniformUpdateCallback: (current: Uniforms) => Uniforms,
  ) => void;
  handleUpdateUniformExpression: (
    shaderId: string,
    fieldName: string,
    slotIndex: number | null,
    value: string | null,
    fieldLength?: number,
  ) => void;
  handleUpdateNode: (
    nodeId: string,
    data: (snapshot: ShaderNodeData) => ShaderNodeData,
  ) => void;
  handleInsertShader: (shader: Shader, edgeId: string) => void;
}

export const EditorContext = createContext<EditorContextType>({
  elapsedRef: { current: 0 },
  playing: false,
  setPlaying: () => {},
  resetTime: () => {},
  mousePosition: { current: [0, 0] },
  shaders: [],
  patches: {},
  showStats: false,
  openExportNodeId: null,
  setOpenExportNodeId: () => {},
  uniforms: { current: {} },
  uniformExpressions: {},
  handleUpdateUniforms: () => {},
  handleUpdateUniformExpression: () => {},
  handleUpdateNode: (_, snapshot) => snapshot,
  handleInsertShader: () => {},
});
