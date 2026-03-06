import { createContext, type RefObject } from 'react';
import type { Patch, Shader, Uniforms } from './renderer';
import type { ShaderNodeData } from './ShaderNode';

interface EditorContextType {
	currentTime: RefObject<number>;
	mousePosition: RefObject<[number, number]>; // mouse position relative to screen dimensions on scale of 0-1
	shaders: Shader[];
	patches: Record<string, Patch>;
	uniforms: RefObject<Record<string, Uniforms>>;
	handleUpdateUniforms: (shaderId: string, newUniforms: Uniforms) => void;
	handleUpdateNode: (nodeId: string, data: (snapshot: ShaderNodeData) => ShaderNodeData) => void;
}

export const EditorContext = createContext<EditorContextType>({
	currentTime: { current: 0 },
	mousePosition: { current: [0, 0] },
	shaders: [],
	patches: {},
	uniforms: { current: {} },
	handleUpdateUniforms: () => {},
	handleUpdateNode: (snapshot) => snapshot
});
