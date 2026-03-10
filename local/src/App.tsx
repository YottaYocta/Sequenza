import { useEffect, useMemo, useRef, useState } from 'react';
import type { Shader, Uniforms } from './lib/renderer';
import { io } from 'socket.io-client';

import '@xyflow/react/dist/style.css';
import { Editor } from './components/Editor';
import type { Edge, Node } from '@xyflow/react';
import type { ShaderNode } from './components/ShaderNode';
import { extractFields } from './lib/Field';

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
				newShaders[filepath] = {
					id: filepath,
					source: name,
					name: filepath,
					resolution: { width: 100, height: 100 }
				};
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
			let edges: Edge[] = JSON.parse(localStorage.getItem('sequenza-edges') ?? '[]');
			const uniforms: Record<string, Uniforms> = JSON.parse(
				localStorage.getItem('sequenza-uniforms') ?? '{}'
			);

			let shadersUpdated = false;
			for (const node of nodes) {
				if (node.type === 'shader') {
					const shaderNode = node as ShaderNode;
					const libraryShader = shaderMap[shaderNode.data.shader.name];

					if (libraryShader && shaderNode.data.shader.source !== libraryShader?.source) {
						// update shader, keep id because that's used for matching uniforms => shaders
						const newShader = { ...libraryShader, id: shaderNode.data.shader.id };
						shaderNode.data.shader = newShader;

						uniforms[newShader.id] = {};
						shadersUpdated = true;
					}
				}
			}

			edges = edges.filter((edge) => {
				const sourceNode = nodes.find((node) => node.id === edge.source);
				const targetNode = nodes.find((node) => node.id === edge.target);
				const targetHandle = edge.targetHandle;
				if (targetNode && targetNode.type !== 'shader') return false;
				const targetShaderNode = targetNode as ShaderNode;
				const targetFields = extractFields(targetShaderNode.data.shader);
				if (
					!sourceNode ||
					targetHandle === null ||
					targetHandle === undefined ||
					targetFields.find(
						(field) => field.name === targetHandle && field.type === 'sampler2D'
					) === undefined
				)
					return false;
				else return true;
			});

			localStorage.setItem('sequenza-nodes', JSON.stringify(nodes));
			localStorage.setItem('sequenza-edges', JSON.stringify(edges));
			localStorage.setItem('sequenza-uniforms', JSON.stringify(uniforms));

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
