import { useEffect, useMemo, useRef, useState } from 'react';
import type { Shader, Uniforms } from './renderer';
import { io } from 'socket.io-client';

import '@xyflow/react/dist/style.css';
import { Editor } from './Editor';
import type { Node } from '@xyflow/react';

/**
 * a single node type; shaders
 * data/props: shader, patch (for renderer), uniforms, handle uniform update
 *
 */

function App() {
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
			localStorage.clear();
		});
		() => {
			console.log('[DISCONNECT]');
			socket.disconnect();
		};
	}, []);

	const initialState = useMemo(() => {
		try {
			const nodes: Node[] = JSON.parse(localStorage.getItem('sequenza-nodes') ?? 'null');
			const edges = JSON.parse(localStorage.getItem('sequenza-edges') ?? 'null');
			const uniforms = JSON.parse(localStorage.getItem('sequenza-uniforms') ?? 'null');
			if (nodes !== null && edges !== null && uniforms !== null) return { nodes, edges, uniforms };
		} catch {}
		return undefined;
	}, []);

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
