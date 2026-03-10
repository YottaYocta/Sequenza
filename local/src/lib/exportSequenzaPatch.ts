import templateContent from '../assets/SequenzaComponent.tsx?raw';
import type { Patch, Uniforms } from './renderer';

export function exportSequenzaPatch(uniforms: Record<string, Uniforms>, patch: Patch): string {
	let content = templateContent;

	content = content.replace(
		"throw new Error('placeholder for initial uniforms');",
		`return ${JSON.stringify(uniforms, null, 2)};`
	);

	content = content.replace(
		"throw new Error('placeholder for patch');",
		`return ${JSON.stringify(patch, null, 2)};`
	);

	return content;
}
