import { createContext, type RefObject } from 'react';
import type { Patch, Uniforms } from './renderer';

interface EditorContextType {
	patches: Record<string, Patch>;
	uniforms: RefObject<Record<string, Uniforms>>;
	handleUpdateUniforms: (shaderId: string, newUniforms: Uniforms) => void;
}

export const EditorContext = createContext<EditorContextType>({
	patches: {},
	uniforms: { current: {} },
	handleUpdateUniforms: () => {}
});
