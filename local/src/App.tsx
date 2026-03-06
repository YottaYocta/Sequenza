import { useEffect, useMemo, useRef, useState } from 'react';
import type { Shader, Uniforms } from './renderer';
import { io } from 'socket.io-client';

import '@xyflow/react/dist/style.css';
import { Editor } from './Editor';
import type { Edge, Node } from '@xyflow/react';
import type { ShaderNode } from './ShaderNode';
import { extractFields } from './Field';

/**
 * a single node type; shaders
 * data/props: shader, patch (for renderer), uniforms, handle uniform update
 *
 */

function App() {
	// maps filepath to shader
	const [shaderMap, setShaderMap] = useState<Record<string, Shader>>({});
	const shaderUniforms = useRef<Record<string, Uniforms>>({});

	useEffect(() => {
		console.log('[CONNECT]');
		const socket = io('http://localhost:3001');
		socket.on('shaders-found', (data: Record<string, string>) => {
			const newShaders: Record<string, Shader> = {};
			for (const [filepath, name] of Object.entries(data)) {
				newShaders[filepath] = { id: filepath, source: name, name: filepath };
				shaderUniforms.current[filepath] = {};
			}
			setShaderMap(newShaders);
		});
		() => {
			console.log('[DISCONNECT]');
			socket.disconnect();
		};
	}, []);

	const initialState = useMemo(() => {
		try {
			const nodes: Node[] = JSON.parse(localStorage.getItem('sequenza-nodes') ?? '[]');
			const edges: Edge[] = JSON.parse(localStorage.getItem('sequenza-edges') ?? '[]');
			const uniforms: Record<string, Uniforms> = JSON.parse(
				localStorage.getItem('sequenza-uniforms') ?? 'null'
			);

			for (const node of nodes) {
				if (node.type === 'shader') {
					const shaderNode = node as ShaderNode;
					const newShader = shaderMap[shaderNode.data.shader.name];
					if (newShader && shaderNode.data.shader.source !== newShader?.source) {
						uniforms[shaderNode.data.shader.id] = {};
						shaderNode.data.shader = { ...newShader, id: shaderNode.data.shader.id };
						// console.log(shaderNode.data.shader.source.slice(0, 100));
						// console.log(extractFields(shaderNode.data.shader));
						// console.log('uniforms updated');
						localStorage.setItem('sequenza-nodes', JSON.stringify(nodes));
					}
				}
			}

			console.log(nodes);

			if (nodes !== null && edges !== null && uniforms !== null) return { nodes, edges, uniforms };
		} catch (e) {
			console.error(e);
		}
		return undefined;
	}, [shaderMap]);

	return (
		<main className="">
			<div className="w-full min-h-screen h-screen ">
				<Editor
					shaders={[...Object.values(shaderMap)]}
					initialState={initialState}
					handleSave={({ nodes, edges, uniforms }) => {
						localStorage.setItem('sequenza-nodes', JSON.stringify(nodes));
						localStorage.setItem('sequenza-edges', JSON.stringify(edges));
						localStorage.setItem('sequenza-uniforms', JSON.stringify(uniforms));
					}}
				></Editor>
			</div>
		</main>
	);
}

export default App;
