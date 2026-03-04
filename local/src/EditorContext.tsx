import { createContext, type RefObject } from 'react';
import type { Patch, Uniforms } from './renderer';

interface EditorContextType {
	patches: Record<string, Patch>;
	uniforms: RefObject<Record<string, Uniforms>>;
}

export const EditorContext = createContext<EditorContextType>({
	patches: {},
	uniforms: { current: {} }
});
