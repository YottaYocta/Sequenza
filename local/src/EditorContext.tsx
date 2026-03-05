import { createContext, type RefObject } from 'react';
import type { Patch, Shader, Uniforms } from './renderer';

interface EditorContextType {
	shaders: Shader[];
	patches: Record<string, Patch>;
	uniforms: RefObject<Record<string, Uniforms>>;
	handleUpdateUniforms: (shaderId: string, newUniforms: Uniforms) => void;
}

export const EditorContext = createContext<EditorContextType>({
	shaders: [],
	patches: {},
	uniforms: { current: {} },
	handleUpdateUniforms: () => {}
});
