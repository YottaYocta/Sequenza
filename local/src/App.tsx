import { useCallback, useEffect, useRef, useState } from 'react';
import type { Shader, Uniforms } from './renderer';
import { io } from 'socket.io-client';
import { RendererComponent } from './RendererComponent';
import UniformForm from './UniformForm';
import {
	ReactFlow,
	Background,
	Controls,
	applyNodeChanges,
	type OnNodesChange,
	type Edge,
	type Node,
	type OnEdgesChange,
	applyEdgeChanges,
	type OnConnect,
	addEdge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

/**
 * a single node type; shaders
 * data/props: shader, patch (for renderer), uniforms, handle uniform update
 *
 */

function App() {
	const [shaderMap, setShaderMap] = useState<Record<string, Shader>>({});
	const shaderUniforms = useRef<Record<string, Uniforms>>({});

	const [nodes, setNodes] = useState<Node[]>([
		{
			id: 'n1',
			position: { x: 0, y: 0 },
			data: { label: 'Node 1' },
			type: 'input'
		},
		{
			id: 'n2',
			position: { x: 100, y: 100 },
			data: { label: 'Node 2' }
		}
	]);

	const [edges, setEdges] = useState<Edge[]>([
		{
			id: 'fjslkfkjsajflaj',
			source: 'n1',
			target: 'n2',
			label: 'edge'
		}
	]);

	useEffect(() => {
		console.log('[CONNECT]');
		const socket = io('http://localhost:3001');
		socket.on('shaders-found', (data: Record<string, string>) => {
			const newShaders: Record<string, Shader> = {};
			for (const [filepath, name] of Object.entries(data)) {
				newShaders[filepath] = { id: filepath, source: name };
				shaderUniforms.current[filepath] = {
					uResolution: [100, 100]
				};
			}
			setShaderMap(newShaders);
		});
		() => {
			console.log('[DISCONNECT]');
			socket.disconnect();
		};
	}, []);

	const RES = 300;

	const onNodesChange: OnNodesChange = useCallback(
		(changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
		[setNodes]
	);
	const onEdgesChange: OnEdgesChange = useCallback(
		(changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
		[setEdges]
	);

	const onConnect: OnConnect = useCallback((params) => {
		setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot));
	}, []);

	return (
		<main className="">
			<div className="w-full h-200 border">
				<ReactFlow
					proOptions={{ hideAttribution: true }}
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					fitView
				>
					<Background />
					<Controls />
				</ReactFlow>
			</div>
			{Object.entries(shaderMap).map(([filepath, source]) => {
				return (
					<div className="flex gap-4 items-start" key={filepath}>
						<p className="font-bold w-32">{filepath}</p>
						<div className="flex flex-col gap-2">
							<p className="text-xs w-96 line-clamp-5 border">{source.source}</p>
							<UniformForm shader={source} handleUpdateUniform={() => {}}></UniformForm>
						</div>
						<RendererComponent
							width={RES}
							height={RES}
							patch={{ shaders: [source], connections: [] }}
							uniforms={shaderUniforms}
						></RendererComponent>
					</div>
				);
			})}
		</main>
	);
}

export default App;
